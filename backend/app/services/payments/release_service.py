"""
Payment Release Service.

Handles releasing escrowed payments to reviewers and processing refunds.
"""

from datetime import datetime
from decimal import Decimal

import stripe
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.review_request import ReviewRequest
from app.models.review_slot import ReviewSlot, PaymentStatus
from app.constants.payments import PLATFORM_FEE_PERCENT
from app.services.payments.base import logger


class PaymentReleaseService:
    """Service for releasing payments and processing refunds"""

    @staticmethod
    async def release_payment_to_reviewer(
        slot: ReviewSlot,
        reviewer: User,
        db: AsyncSession
    ) -> bool:
        """
        Release escrowed payment to reviewer via Stripe Connect.

        Args:
            slot: The review slot with payment to release
            reviewer: The reviewer to pay
            db: Database session

        Returns:
            True if transfer succeeded, False otherwise
        """
        if not slot.requires_payment:
            logger.debug(f"Slot {slot.id} does not require payment")
            return True

        if slot.payment_status != PaymentStatus.ESCROWED.value:
            logger.warning(
                f"Cannot release payment for slot {slot.id}: "
                f"status is {slot.payment_status}, expected ESCROWED"
            )
            return False

        if not reviewer.stripe_connect_account_id:
            logger.error(f"Reviewer {reviewer.id} has no Connect account")
            return False

        if not reviewer.stripe_connect_payouts_enabled:
            logger.error(f"Reviewer {reviewer.id} does not have payouts enabled")
            return False

        # Calculate amounts
        payment_amount = slot.payment_amount
        platform_fee = payment_amount * Decimal(str(PLATFORM_FEE_PERCENT))
        net_amount = payment_amount - platform_fee

        # Convert to cents
        net_amount_cents = int(net_amount * 100)

        try:
            # Create transfer to Connect account
            transfer = stripe.Transfer.create(
                amount=net_amount_cents,
                currency="usd",
                destination=reviewer.stripe_connect_account_id,
                metadata={
                    "slot_id": str(slot.id),
                    "reviewer_id": str(reviewer.id),
                    "review_request_id": str(slot.review_request_id),
                    "gross_amount": str(payment_amount),
                    "platform_fee": str(platform_fee)
                },
                description=f"Payment for review slot {slot.id}"
            )

            # Update slot
            now = datetime.utcnow()
            slot.payment_status = PaymentStatus.RELEASED.value
            slot.payment_released_at = now
            slot.stripe_transfer_id = transfer.id
            slot.platform_fee_amount = platform_fee
            slot.net_amount_to_reviewer = net_amount

            await db.commit()

            logger.info(
                f"Released ${net_amount} to reviewer {reviewer.id} for slot {slot.id} "
                f"(transfer {transfer.id})"
            )

            # Send notification to reviewer
            try:
                from app.services.notifications.payment_triggers import notify_payment_released
                await notify_payment_released(
                    db=db,
                    slot=slot,
                    reviewer=reviewer,
                    net_amount=net_amount,
                    platform_fee=platform_fee
                )
            except Exception as notif_error:
                logger.error(f"Failed to send payment released notification: {notif_error}")

            return True

        except stripe.StripeError as e:
            logger.error(f"Failed to release payment for slot {slot.id}: {e}")
            return False

    @staticmethod
    async def process_refund(
        slot: ReviewSlot,
        review_request: ReviewRequest,
        db: AsyncSession
    ) -> bool:
        """
        Process refund for a rejected review slot.

        Args:
            slot: The review slot to refund
            review_request: The parent review request
            db: Database session

        Returns:
            True if refund succeeded, False otherwise
        """
        if not slot.requires_payment:
            return True

        if slot.payment_status != PaymentStatus.ESCROWED.value:
            logger.warning(
                f"Cannot refund slot {slot.id}: "
                f"status is {slot.payment_status}, expected ESCROWED"
            )
            return False

        if not review_request.stripe_payment_intent_id:
            logger.error(f"No Payment Intent for review request {review_request.id}")
            return False

        # Calculate refund amount (just this slot's portion)
        refund_amount_cents = int(slot.payment_amount * 100)

        try:
            # Create refund
            refund = stripe.Refund.create(
                payment_intent=review_request.stripe_payment_intent_id,
                amount=refund_amount_cents,
                metadata={
                    "slot_id": str(slot.id),
                    "review_request_id": str(review_request.id),
                    "reason": "review_rejected"
                }
            )

            # Update slot
            slot.payment_status = PaymentStatus.REFUNDED.value
            slot.transaction_id = refund.id

            await db.commit()

            logger.info(
                f"Refunded ${slot.payment_amount} for slot {slot.id} "
                f"(refund {refund.id})"
            )

            # Send notification to creator
            try:
                from app.services.notifications.payment_triggers import notify_refund_issued
                creator = await db.get(User, review_request.user_id)
                if creator:
                    await notify_refund_issued(
                        db=db,
                        slot=slot,
                        creator=creator,
                        amount=slot.payment_amount,
                        reason="Review rejected"
                    )
            except Exception as notif_error:
                logger.error(f"Failed to send refund notification: {notif_error}")

            return True

        except stripe.StripeError as e:
            logger.error(f"Failed to refund slot {slot.id}: {e}")
            return False
