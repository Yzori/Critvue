"""
Payment Calculation Service.

Handles payment breakdown calculations with platform fees and discounts.
"""

from decimal import Decimal

from app.models.user import User, SubscriptionTier, SubscriptionStatus
from app.schemas.payment import PaymentBreakdown
from app.constants.payments import (
    PLATFORM_FEE_PERCENT,
    PRO_DISCOUNT_PERCENT,
)


class PaymentCalculationService:
    """Service for calculating payment breakdowns"""

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
