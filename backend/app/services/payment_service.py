"""
Payment Service for Expert Review Payments and Stripe Connect

Handles:
- Creating Payment Intents for expert review checkout
- Managing escrow (payment_status transitions)
- Releasing payments to reviewers via Stripe Connect
- Processing refunds
- Stripe Connect account management for reviewers
"""

import logging
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional, List

import stripe
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User, SubscriptionTier, SubscriptionStatus
from app.models.review_request import ReviewRequest, ReviewType
from app.models.review_slot import ReviewSlot, PaymentStatus
from app.schemas.payment import PaymentBreakdown

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_API_KEY

# Constants
PLATFORM_FEE_PERCENT = settings.STRIPE_PLATFORM_FEE_PERCENT  # 25%
PRO_DISCOUNT_PERCENT = Decimal("0.15")  # 15% discount for Pro users


class PaymentService:
    """Service for handling expert review payments and Stripe Connect"""

    # ===== Payment Calculation =====

    @staticmethod
    def calculate_payment_breakdown(
        budget: Decimal,
        reviews_requested: int,
        is_pro_user: bool = False
    ) -> PaymentBreakdown:
        """
        Calculate payment breakdown with platform fee and optional Pro discount.

        Args:
            budget: Total budget for all reviews
            reviews_requested: Number of reviews requested
            is_pro_user: Whether user has active Pro subscription

        Returns:
            PaymentBreakdown with all calculated amounts
        """
        subtotal = budget

        # Apply Pro discount (15%)
        discount_amount = Decimal("0")
        discount_percent = 0
        if is_pro_user:
            discount_amount = subtotal * PRO_DISCOUNT_PERCENT
            discount_percent = 15

        total = subtotal - discount_amount

        # Calculate per-review amounts
        per_review_amount = total / reviews_requested

        # Platform fee (20%) comes from reviewer's portion
        platform_fee_per_review = per_review_amount * Decimal(str(PLATFORM_FEE_PERCENT))
        reviewer_earnings_per_review = per_review_amount - platform_fee_per_review

        return PaymentBreakdown(
            subtotal=subtotal,
            discount_amount=discount_amount,
            total=total,
            per_review_amount=per_review_amount,
            platform_fee=platform_fee_per_review * reviews_requested,
            reviewer_earnings=reviewer_earnings_per_review,
            reviews_requested=reviews_requested,
            discount_percent=discount_percent
        )

    @staticmethod
    def is_pro_user_active(user: User) -> bool:
        """Check if user has active Pro subscription"""
        return (
            user.subscription_tier == SubscriptionTier.PRO and
            user.subscription_status == SubscriptionStatus.ACTIVE
        )

    # ===== Payment Intent Creation =====

    @staticmethod
    async def create_payment_intent(
        review_request: ReviewRequest,
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Create a Stripe Payment Intent for an expert review request.

        Args:
            review_request: The review request to pay for
            user: The user making the payment
            db: Database session

        Returns:
            Dict with client_secret and payment_intent_id

        Raises:
            ValueError: If validation fails
            stripe.StripeError: If Stripe API fails
        """
        # Validate review request
        if review_request.review_type != ReviewType.EXPERT:
            raise ValueError("Payment is only required for expert reviews")

        if review_request.stripe_payment_intent_id:
            # Payment Intent already exists, retrieve it
            try:
                intent = stripe.PaymentIntent.retrieve(review_request.stripe_payment_intent_id)
                if intent.status in ["succeeded", "processing"]:
                    raise ValueError("Payment has already been processed")
                return {
                    "client_secret": intent.client_secret,
                    "payment_intent_id": intent.id,
                    "amount": Decimal(intent.amount) / 100
                }
            except stripe.StripeError:
                # Intent doesn't exist anymore, create new one
                pass

        if not review_request.budget:
            raise ValueError("Budget is required for expert reviews")

        # Calculate amount
        is_pro = PaymentService.is_pro_user_active(user)
        breakdown = PaymentService.calculate_payment_breakdown(
            budget=review_request.budget,
            reviews_requested=review_request.reviews_requested,
            is_pro_user=is_pro
        )

        # Amount in cents for Stripe
        amount_cents = int(breakdown.total * 100)

        # Ensure user has Stripe customer ID
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.full_name,
                metadata={"user_id": str(user.id)}
            )
            user.stripe_customer_id = customer.id
            await db.commit()
            logger.info(f"Created Stripe customer {customer.id} for user {user.id}")

        # Create Payment Intent
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            customer=user.stripe_customer_id,
            metadata={
                "review_request_id": str(review_request.id),
                "user_id": str(user.id),
                "reviews_requested": str(review_request.reviews_requested),
                "is_pro_user": str(is_pro),
                "discount_applied": str(breakdown.discount_amount)
            },
            description=f"Expert review: {review_request.title[:50]}",
            automatic_payment_methods={"enabled": True}
        )

        # Store Payment Intent ID
        review_request.stripe_payment_intent_id = intent.id
        await db.commit()

        logger.info(f"Created Payment Intent {intent.id} for review request {review_request.id}")

        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": breakdown.total
        }

    # ===== Payment Webhook Handlers =====

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

    # ===== Payment Release (to Reviewer) =====

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
                from app.services.payment_notifications import notify_payment_released
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

    # ===== Refund Processing =====

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
                from app.services.payment_notifications import notify_refund_issued
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

    # ===== Stripe Connect Account Management =====

    @staticmethod
    async def create_connect_account(
        user: User,
        db: AsyncSession
    ) -> str:
        """
        Create a Stripe Connect Express account for a reviewer.

        Args:
            user: The user to create account for
            db: Database session

        Returns:
            The Connect account ID
        """
        if user.stripe_connect_account_id:
            return user.stripe_connect_account_id

        account = stripe.Account.create(
            type="express",
            email=user.email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True}
            },
            metadata={
                "user_id": str(user.id),
                "platform": "critvue"
            }
        )

        user.stripe_connect_account_id = account.id
        await db.commit()

        logger.info(f"Created Connect account {account.id} for user {user.id}")

        return account.id

    @staticmethod
    async def create_connect_onboarding_link(
        user: User,
        return_url: str,
        refresh_url: str,
        db: AsyncSession
    ) -> str:
        """
        Create a Stripe Connect onboarding link.

        Args:
            user: The user to onboard
            return_url: URL to redirect after completion
            refresh_url: URL to redirect if link expires
            db: Database session

        Returns:
            The onboarding URL
        """
        # Ensure account exists
        if not user.stripe_connect_account_id:
            await PaymentService.create_connect_account(user, db)

        account_link = stripe.AccountLink.create(
            account=user.stripe_connect_account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding"
        )

        return account_link.url

    @staticmethod
    async def create_connect_dashboard_link(user: User) -> str:
        """
        Create a link to the Stripe Connect Express dashboard.

        Args:
            user: The user with Connect account

        Returns:
            Dashboard URL

        Raises:
            ValueError: If user has no Connect account
        """
        if not user.stripe_connect_account_id:
            raise ValueError("User does not have a Connect account")

        login_link = stripe.Account.create_login_link(
            user.stripe_connect_account_id
        )

        return login_link.url

    @staticmethod
    async def check_connect_status(
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Check Stripe Connect account status and update user record.

        Args:
            user: The user to check
            db: Database session

        Returns:
            Dict with status information
        """
        if not user.stripe_connect_account_id:
            return {
                "is_onboarded": False,
                "payouts_enabled": False,
                "account_id": None,
                "details_submitted": False
            }

        try:
            account = stripe.Account.retrieve(user.stripe_connect_account_id)

            is_onboarded = account.details_submitted
            payouts_enabled = account.payouts_enabled

            # Update user record if status changed
            if (user.stripe_connect_onboarded != is_onboarded or
                user.stripe_connect_payouts_enabled != payouts_enabled):
                user.stripe_connect_onboarded = is_onboarded
                user.stripe_connect_payouts_enabled = payouts_enabled
                await db.commit()
                logger.info(
                    f"Updated Connect status for user {user.id}: "
                    f"onboarded={is_onboarded}, payouts_enabled={payouts_enabled}"
                )

            return {
                "is_onboarded": is_onboarded,
                "payouts_enabled": payouts_enabled,
                "account_id": user.stripe_connect_account_id,
                "details_submitted": account.details_submitted
            }

        except stripe.StripeError as e:
            logger.error(f"Failed to check Connect status for user {user.id}: {e}")
            return {
                "is_onboarded": user.stripe_connect_onboarded,
                "payouts_enabled": user.stripe_connect_payouts_enabled,
                "account_id": user.stripe_connect_account_id,
                "details_submitted": False
            }

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

    # ===== Balance and Payouts =====

    @staticmethod
    async def get_available_balance(user: User) -> Dict[str, Decimal]:
        """
        Get available balance from Stripe Connect account.

        Args:
            user: The reviewer user

        Returns:
            Dict with available and pending balances
        """
        if not user.stripe_connect_account_id:
            return {
                "available_balance": Decimal("0"),
                "pending_balance": Decimal("0")
            }

        try:
            balance = stripe.Balance.retrieve(
                stripe_account=user.stripe_connect_account_id
            )

            # Get USD balances (Stripe returns amounts in cents)
            available = Decimal("0")
            pending = Decimal("0")

            for item in balance.available:
                if item.currency == "usd":
                    available = Decimal(item.amount) / 100

            for item in balance.pending:
                if item.currency == "usd":
                    pending = Decimal(item.amount) / 100

            return {
                "available_balance": available,
                "pending_balance": pending
            }

        except stripe.StripeError as e:
            logger.error(f"Failed to get balance for user {user.id}: {e}")
            return {
                "available_balance": Decimal("0"),
                "pending_balance": Decimal("0")
            }

    @staticmethod
    async def get_payout_history(
        user: User,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get payout history for a reviewer.

        Args:
            user: The reviewer user
            limit: Max number of payouts to return

        Returns:
            List of payout records
        """
        if not user.stripe_connect_account_id:
            return []

        try:
            payouts = stripe.Payout.list(
                limit=limit,
                stripe_account=user.stripe_connect_account_id
            )

            return [
                {
                    "payout_id": p.id,
                    "amount": Decimal(p.amount) / 100,
                    "status": p.status,
                    "created_at": datetime.fromtimestamp(p.created),
                    "arrival_date": datetime.fromtimestamp(p.arrival_date) if p.arrival_date else None
                }
                for p in payouts.data
            ]

        except stripe.StripeError as e:
            logger.error(f"Failed to get payout history for user {user.id}: {e}")
            return []
