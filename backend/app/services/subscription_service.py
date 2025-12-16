"""Subscription service for managing user subscriptions and Stripe integration"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import stripe
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User, SubscriptionTier, SubscriptionStatus
from app.core.exceptions import (
    InvalidStateError,
    InvalidInputError,
    InternalError,
)
from app.services.notifications.email_service import send_payment_failed_email

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_API_KEY


class SubscriptionService:
    """Service for handling subscription operations"""

    # Free tier limits
    FREE_TIER_MONTHLY_LIMIT = 3
    PRO_TIER_EXPERT_DISCOUNT = 0.15  # 15% discount

    @staticmethod
    async def get_subscription_status(user: User) -> Dict[str, Any]:
        """
        Get detailed subscription status for a user

        Args:
            user: User model instance

        Returns:
            Dictionary with subscription status details
        """
        is_pro = user.subscription_tier == SubscriptionTier.PRO
        is_active = is_pro and user.subscription_status == SubscriptionStatus.ACTIVE

        # Calculate reviews remaining for free tier
        reviews_remaining = 0
        if not is_pro:
            reviews_remaining = max(0, SubscriptionService.FREE_TIER_MONTHLY_LIMIT - user.monthly_reviews_used)

        return {
            "tier": user.subscription_tier.value,
            "status": user.subscription_status.value if user.subscription_status else None,
            "subscription_end_date": user.subscription_end_date,
            "monthly_reviews_used": user.monthly_reviews_used,
            "monthly_reviews_limit": 0 if is_pro else SubscriptionService.FREE_TIER_MONTHLY_LIMIT,
            "reviews_remaining": reviews_remaining if not is_pro else -1,  # -1 indicates unlimited
            "reviews_reset_at": user.reviews_reset_at,
            "has_unlimited_reviews": is_active,
            "expert_review_discount": SubscriptionService.PRO_TIER_EXPERT_DISCOUNT if is_active else 0.0,
            "has_priority_queue": is_active,
            "stripe_customer_id": user.stripe_customer_id,
            "stripe_subscription_id": user.stripe_subscription_id,
        }

    @staticmethod
    async def check_review_limit(user: User, db: AsyncSession) -> tuple[bool, Optional[str]]:
        """
        Check if user can create a review request

        Args:
            user: User model instance
            db: Database session

        Returns:
            Tuple of (can_create, error_message)
        """
        # Pro users with active subscriptions have unlimited reviews
        if user.subscription_tier == SubscriptionTier.PRO and user.subscription_status == SubscriptionStatus.ACTIVE:
            return True, None

        # Free tier users have monthly limits
        await SubscriptionService.reset_monthly_limit_if_needed(user, db)

        if user.monthly_reviews_used >= SubscriptionService.FREE_TIER_MONTHLY_LIMIT:
            return False, (
                f"You've reached your monthly limit of {SubscriptionService.FREE_TIER_MONTHLY_LIMIT} "
                f"community reviews. Upgrade to Pro for unlimited reviews!"
            )

        return True, None

    @staticmethod
    async def increment_review_count(user: User, db: AsyncSession) -> None:
        """
        Increment the monthly review count for free tier users

        Args:
            user: User model instance
            db: Database session
        """
        # Only track for free tier
        if user.subscription_tier == SubscriptionTier.FREE:
            # Ensure reset date is set
            if not user.reviews_reset_at:
                user.reviews_reset_at = SubscriptionService._get_next_reset_date()

            user.monthly_reviews_used += 1
            await db.commit()
            await db.refresh(user)

            logger.info(
                f"Incremented review count for user {user.id}: "
                f"{user.monthly_reviews_used}/{SubscriptionService.FREE_TIER_MONTHLY_LIMIT}"
            )

    @staticmethod
    async def reset_monthly_limit_if_needed(user: User, db: AsyncSession) -> bool:
        """
        Reset monthly review count if the reset date has passed

        Args:
            user: User model instance
            db: Database session

        Returns:
            True if reset occurred, False otherwise
        """
        if user.subscription_tier != SubscriptionTier.FREE:
            return False

        # Initialize reset date if not set
        if not user.reviews_reset_at:
            user.reviews_reset_at = SubscriptionService._get_next_reset_date()
            await db.commit()
            return False

        # Check if reset is needed
        now = datetime.utcnow()
        if now >= user.reviews_reset_at:
            user.monthly_reviews_used = 0
            user.reviews_reset_at = SubscriptionService._get_next_reset_date()
            await db.commit()
            await db.refresh(user)
            logger.info(f"Reset monthly review count for user {user.id}")
            return True

        return False

    @staticmethod
    def _get_next_reset_date() -> datetime:
        """Get the next monthly reset date (first day of next month)"""
        now = datetime.utcnow()
        # First day of next month
        if now.month == 12:
            return datetime(now.year + 1, 1, 1)
        else:
            return datetime(now.year, now.month + 1, 1)

    @staticmethod
    async def calculate_expert_review_price(base_price: float, user: User) -> tuple[float, float]:
        """
        Calculate the final price for an expert review with any applicable discounts

        Args:
            base_price: Base price in dollars
            user: User model instance

        Returns:
            Tuple of (final_price, discount_amount)
        """
        # Pro users with active subscriptions get 15% discount
        if user.subscription_tier == SubscriptionTier.PRO and user.subscription_status == SubscriptionStatus.ACTIVE:
            discount_amount = base_price * SubscriptionService.PRO_TIER_EXPERT_DISCOUNT
            final_price = base_price - discount_amount
            return final_price, discount_amount

        return base_price, 0.0

    @staticmethod
    async def create_checkout_session(
        user: User,
        success_url: str,
        cancel_url: str,
        db: AsyncSession
    ) -> Dict[str, str]:
        """
        Create a Stripe Checkout session for Pro subscription

        Args:
            user: User model instance
            success_url: URL to redirect on success
            cancel_url: URL to redirect on cancel
            db: Database session

        Returns:
            Dictionary with checkout_url and session_id

        Raises:
            ValueError: If Stripe is not configured or user already has active subscription
        """
        if not settings.STRIPE_API_KEY or not settings.STRIPE_PRO_PRICE_ID:
            raise InternalError(message="Stripe is not properly configured")

        # Check if user already has an active subscription
        if user.subscription_tier == SubscriptionTier.PRO and user.subscription_status == SubscriptionStatus.ACTIVE:
            raise InvalidStateError(message="User already has an active Pro subscription")

        try:
            # Create or retrieve Stripe customer
            if not user.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.full_name,
                    metadata={"user_id": str(user.id)}
                )
                user.stripe_customer_id = customer.id
                await db.commit()
                logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
            else:
                customer_id = user.stripe_customer_id

            # Create Checkout Session
            session = stripe.checkout.Session.create(
                customer=user.stripe_customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price": settings.STRIPE_PRO_PRICE_ID,
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": str(user.id),
                },
                subscription_data={
                    "metadata": {
                        "user_id": str(user.id),
                    }
                },
                allow_promotion_codes=True,
            )

            logger.info(f"Created checkout session {session.id} for user {user.id}")

            return {
                "checkout_url": session.url,
                "session_id": session.id,
            }

        except stripe.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {str(e)}")
            raise InternalError(message=f"Failed to create checkout session: {str(e)}")

    @staticmethod
    async def create_portal_session(user: User, return_url: str) -> Dict[str, str]:
        """
        Create a Stripe Customer Portal session for subscription management

        Args:
            user: User model instance
            return_url: URL to return to from portal

        Returns:
            Dictionary with portal_url

        Raises:
            ValueError: If user doesn't have a Stripe customer ID
        """
        if not user.stripe_customer_id:
            raise InvalidStateError(message="User does not have a Stripe customer account")

        try:
            session = stripe.billing_portal.Session.create(
                customer=user.stripe_customer_id,
                return_url=return_url,
            )

            logger.info(f"Created portal session for user {user.id}")

            return {
                "portal_url": session.url,
            }

        except stripe.StripeError as e:
            logger.error(f"Stripe error creating portal session: {str(e)}")
            raise InternalError(message=f"Failed to create portal session: {str(e)}")

    @staticmethod
    async def handle_subscription_created(subscription: Dict[str, Any], db: AsyncSession) -> None:
        """
        Handle subscription.created webhook event

        Args:
            subscription: Stripe subscription object
            db: Database session
        """
        user_id = int(subscription.get("metadata", {}).get("user_id", 0))
        if not user_id:
            logger.warning(f"Subscription {subscription['id']} has no user_id in metadata")
            return

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"User {user_id} not found for subscription {subscription['id']}")
            return

        user.subscription_tier = SubscriptionTier.PRO
        user.subscription_status = SubscriptionStatus(subscription["status"])
        user.stripe_subscription_id = subscription["id"]
        user.subscription_end_date = datetime.fromtimestamp(subscription["current_period_end"])

        await db.commit()
        logger.info(f"Activated Pro subscription for user {user.id}")

    @staticmethod
    async def handle_subscription_updated(subscription: Dict[str, Any], db: AsyncSession) -> None:
        """
        Handle subscription.updated webhook event

        Args:
            subscription: Stripe subscription object
            db: Database session
        """
        result = await db.execute(
            select(User).where(User.stripe_subscription_id == subscription["id"])
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"No user found for subscription {subscription['id']}")
            return

        user.subscription_status = SubscriptionStatus(subscription["status"])
        user.subscription_end_date = datetime.fromtimestamp(subscription["current_period_end"])

        # If subscription is no longer active, downgrade to free
        if subscription["status"] not in ["active", "trialing"]:
            user.subscription_tier = SubscriptionTier.FREE
            logger.info(f"Downgraded user {user.id} to Free tier")

        await db.commit()
        logger.info(f"Updated subscription for user {user.id}: status={subscription['status']}")

    @staticmethod
    async def handle_subscription_deleted(subscription: Dict[str, Any], db: AsyncSession) -> None:
        """
        Handle subscription.deleted webhook event (cancellation at period end)

        Args:
            subscription: Stripe subscription object
            db: Database session
        """
        result = await db.execute(
            select(User).where(User.stripe_subscription_id == subscription["id"])
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"No user found for subscription {subscription['id']}")
            return

        user.subscription_tier = SubscriptionTier.FREE
        user.subscription_status = SubscriptionStatus.CANCELED
        user.subscription_end_date = datetime.fromtimestamp(subscription["ended_at"]) if subscription.get("ended_at") else datetime.utcnow()

        # Reset review count when downgrading
        user.monthly_reviews_used = 0
        user.reviews_reset_at = SubscriptionService._get_next_reset_date()

        await db.commit()
        logger.info(f"Cancelled subscription for user {user.id}")

    @staticmethod
    async def handle_invoice_payment_succeeded(invoice: Dict[str, Any], db: AsyncSession) -> None:
        """
        Handle invoice.payment_succeeded webhook event

        Args:
            invoice: Stripe invoice object
            db: Database session
        """
        subscription_id = invoice.get("subscription")
        if not subscription_id:
            return

        result = await db.execute(
            select(User).where(User.stripe_subscription_id == subscription_id)
        )
        user = result.scalar_one_or_none()

        if user:
            logger.info(f"Payment succeeded for user {user.id}, subscription {subscription_id}")
            # Subscription status will be updated via subscription.updated event

    @staticmethod
    async def handle_invoice_payment_failed(invoice: Dict[str, Any], db: AsyncSession) -> None:
        """
        Handle invoice.payment_failed webhook event

        Args:
            invoice: Stripe invoice object
            db: Database session
        """
        subscription_id = invoice.get("subscription")
        if not subscription_id:
            return

        result = await db.execute(
            select(User).where(User.stripe_subscription_id == subscription_id)
        )
        user = result.scalar_one_or_none()

        if user:
            user.subscription_status = SubscriptionStatus.PAST_DUE
            await db.commit()
            logger.warning(f"Payment failed for user {user.id}, subscription {subscription_id}")

            # Send email notification to user about failed payment
            amount_due = invoice.get("amount_due", 0)
            amount_str = f"${amount_due / 100:.2f}" if amount_due else None
            await send_payment_failed_email(
                to_email=user.email,
                user_name=user.full_name,
                amount=amount_str,
            )

    @staticmethod
    async def sync_subscription_from_stripe(user: User, db: AsyncSession) -> bool:
        """
        Sync subscription status directly from Stripe API.
        Useful when webhooks aren't available (local dev) or to verify status.

        Args:
            user: User model instance
            db: Database session

        Returns:
            True if subscription was synced/updated, False otherwise
        """
        if not user.stripe_customer_id:
            logger.info(f"User {user.id} has no Stripe customer ID")
            return False

        try:
            # List all subscriptions for this customer
            subscriptions = stripe.Subscription.list(
                customer=user.stripe_customer_id,
                limit=1,
                status="all"
            )

            if not subscriptions.data:
                logger.info(f"No subscriptions found for user {user.id}")
                return False

            # Get the most recent subscription
            subscription = subscriptions.data[0]
            logger.info(f"Found subscription {subscription.id} with status {subscription.status}")

            # Update user subscription data
            user.stripe_subscription_id = subscription.id
            user.subscription_end_date = datetime.fromtimestamp(subscription.current_period_end)

            if subscription.status in ["active", "trialing"]:
                user.subscription_tier = SubscriptionTier.PRO
                user.subscription_status = SubscriptionStatus.ACTIVE
                logger.info(f"Synced Pro subscription for user {user.id}")
            elif subscription.status == "past_due":
                user.subscription_tier = SubscriptionTier.PRO
                user.subscription_status = SubscriptionStatus.PAST_DUE
                logger.info(f"User {user.id} subscription is past due")
            elif subscription.status == "canceled":
                user.subscription_tier = SubscriptionTier.FREE
                user.subscription_status = SubscriptionStatus.CANCELED
                logger.info(f"User {user.id} subscription is canceled")
            else:
                # Other statuses (incomplete, incomplete_expired, unpaid)
                user.subscription_tier = SubscriptionTier.FREE
                user.subscription_status = None
                logger.info(f"User {user.id} subscription status: {subscription.status}")

            await db.commit()
            await db.refresh(user)
            return True

        except stripe.StripeError as e:
            logger.error(f"Stripe error syncing subscription for user {user.id}: {str(e)}")
            return False
