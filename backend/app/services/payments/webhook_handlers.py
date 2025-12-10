"""
Payment Webhook Handlers.

Handles Stripe webhook events for payments and Connect accounts.
"""

from datetime import datetime
from typing import Dict, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.review_request import ReviewRequest
from app.models.review_slot import ReviewSlot, PaymentStatus
from app.services.payments.base import logger


class PaymentWebhookHandlers:
    """Handlers for Stripe webhook events"""

    @staticmethod
    async def handle_payment_success(
        payment_intent: Dict[str, Any],
        db: AsyncSession
    ) -> None:
        """
        Handle payment_intent.succeeded webhook.
        Mark all slots as ESCROWED and update review request.

        Args:
            payment_intent: Stripe Payment Intent object from webhook
            db: Database session
        """
        payment_intent_id = payment_intent["id"]
        metadata = payment_intent.get("metadata", {})
        review_request_id = metadata.get("review_request_id")

        if not review_request_id:
            logger.warning(f"Payment Intent {payment_intent_id} has no review_request_id")
            return

        # Find review request
        result = await db.execute(
            select(ReviewRequest).where(
                ReviewRequest.stripe_payment_intent_id == payment_intent_id
            )
        )
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.warning(f"No review request found for Payment Intent {payment_intent_id}")
            return

        # Update review request
        review_request.payment_captured_at = datetime.utcnow()

        # Mark all slots as ESCROWED
        slots_result = await db.execute(
            select(ReviewSlot).where(
                ReviewSlot.review_request_id == review_request.id
            )
        )
        slots = slots_result.scalars().all()

        for slot in slots:
            if slot.payment_status == PaymentStatus.PENDING.value:
                slot.payment_status = PaymentStatus.ESCROWED.value
                slot.transaction_id = payment_intent_id

        await db.commit()

        logger.info(
            f"Payment succeeded for review request {review_request.id}, "
            f"marked {len(slots)} slots as ESCROWED"
        )

        # Send notification to creator
        try:
            creator = await db.get(User, review_request.user_id)
            if creator:
                from app.services.payment_notifications import notify_payment_captured
                total_amount = sum(slot.payment_amount or 0 for slot in slots)
                await notify_payment_captured(
                    db=db,
                    review_request=review_request,
                    creator=creator,
                    amount=total_amount
                )
        except Exception as notif_error:
            logger.error(f"Failed to send payment captured notification: {notif_error}")

    @staticmethod
    async def handle_payment_failed(
        payment_intent: Dict[str, Any],
        db: AsyncSession
    ) -> None:
        """
        Handle payment_intent.payment_failed webhook.
        Log the failure and optionally notify the user.

        Args:
            payment_intent: Stripe Payment Intent object from webhook
            db: Database session
        """
        payment_intent_id = payment_intent["id"]
        metadata = payment_intent.get("metadata", {})
        user_id = metadata.get("user_id")
        review_request_id = metadata.get("review_request_id")

        error = payment_intent.get("last_payment_error", {})
        error_message = error.get("message", "Unknown error")

        logger.warning(
            f"Payment failed for review request {review_request_id}, "
            f"user {user_id}: {error_message}"
        )

        # Send notification to user about failed payment
        if review_request_id:
            try:
                result = await db.execute(
                    select(ReviewRequest).where(ReviewRequest.id == int(review_request_id))
                )
                review_request = result.scalar_one_or_none()

                if review_request:
                    creator = await db.get(User, review_request.user_id)
                    if creator:
                        from app.services.payment_notifications import notify_payment_failed
                        await notify_payment_failed(
                            db=db,
                            review_request=review_request,
                            creator=creator,
                            error_message=error_message
                        )
            except Exception as notif_error:
                logger.error(f"Failed to send payment failed notification: {notif_error}")

    @staticmethod
    async def handle_refund_completed(
        refund: Dict[str, Any],
        db: AsyncSession
    ) -> None:
        """
        Handle charge.refunded webhook to confirm refund completion.

        Args:
            refund: Stripe Refund object from webhook
            db: Database session
        """
        metadata = refund.get("metadata", {})
        slot_id = metadata.get("slot_id")

        if slot_id:
            logger.info(f"Refund confirmed for slot {slot_id}")
            # Slot status is already updated in process_refund
            # This webhook just confirms Stripe processed it

    @staticmethod
    async def handle_connect_account_updated(
        account: Dict[str, Any],
        db: AsyncSession
    ) -> None:
        """
        Handle account.updated webhook for Connect accounts.

        Args:
            account: Stripe Account object from webhook
            db: Database session
        """
        account_id = account["id"]

        # Find user with this Connect account
        result = await db.execute(
            select(User).where(User.stripe_connect_account_id == account_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"No user found for Connect account {account_id}")
            return

        # Update status
        user.stripe_connect_onboarded = account.get("details_submitted", False)
        user.stripe_connect_payouts_enabled = account.get("payouts_enabled", False)

        await db.commit()

        logger.info(
            f"Updated Connect status for user {user.id} from webhook: "
            f"onboarded={user.stripe_connect_onboarded}, "
            f"payouts_enabled={user.stripe_connect_payouts_enabled}"
        )
