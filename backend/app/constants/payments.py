"""
Payment-related constants.

Configuration for expert review payments, platform fees,
and Stripe integration settings.
"""

from decimal import Decimal


# =============================================================================
# Fee Configuration
# =============================================================================

# Platform fee percentage (taken from reviewer's portion)
PLATFORM_FEE_PERCENT = Decimal("0.25")  # 25%

# Pro subscription discount
PRO_DISCOUNT_PERCENT = Decimal("0.15")  # 15% discount for Pro users


# =============================================================================
# Payment Limits
# =============================================================================

# Expert review pricing bounds
MIN_REVIEW_PRICE = Decimal("5.00")      # Minimum per-review price
MAX_REVIEW_PRICE = Decimal("500.00")    # Maximum per-review price

# Budget limits
MIN_BUDGET = Decimal("5.00")            # Minimum total budget
MAX_BUDGET = Decimal("5000.00")         # Maximum total budget

# Payout thresholds
MIN_PAYOUT_AMOUNT = Decimal("10.00")    # Minimum payout to reviewer


# =============================================================================
# Payment Processing
# =============================================================================

# Escrow hold period (hours)
ESCROW_HOLD_HOURS = 168                 # 7 days

# Auto-release period (days after review accepted)
AUTO_RELEASE_DAYS = 7

# Refund eligibility (hours after payment)
REFUND_WINDOW_HOURS = 72                # 3 days


# =============================================================================
# Stripe Configuration
# =============================================================================

# Payment intent settings
PAYMENT_INTENT_CURRENCY = "usd"

# Connect account settings
CONNECT_ACCOUNT_TYPE = "express"
CONNECT_CAPABILITIES = ["card_payments", "transfers"]

# Payout schedule
PAYOUT_SCHEDULE_INTERVAL = "daily"
PAYOUT_SCHEDULE_DELAY_DAYS = 2


# =============================================================================
# Fee Calculation Helpers
# =============================================================================

def calculate_platform_fee(amount: Decimal) -> Decimal:
    """
    Calculate the platform fee for a given amount.

    Args:
        amount: The payment amount

    Returns:
        Platform fee amount
    """
    return amount * PLATFORM_FEE_PERCENT


def calculate_reviewer_earnings(amount: Decimal) -> Decimal:
    """
    Calculate reviewer earnings after platform fee.

    Args:
        amount: The payment amount

    Returns:
        Reviewer's earnings after fee
    """
    return amount - calculate_platform_fee(amount)


def apply_pro_discount(amount: Decimal) -> Decimal:
    """
    Apply Pro subscription discount to an amount.

    Args:
        amount: The original amount

    Returns:
        Discounted amount
    """
    return amount * (Decimal("1") - PRO_DISCOUNT_PERCENT)


def calculate_payment_breakdown(
    budget: Decimal,
    reviews_requested: int,
    is_pro_user: bool = False
) -> dict:
    """
    Calculate complete payment breakdown.

    Args:
        budget: Total budget
        reviews_requested: Number of reviews
        is_pro_user: Whether user has Pro subscription

    Returns:
        Dictionary with all payment components
    """
    subtotal = budget
    discount_amount = Decimal("0")

    if is_pro_user:
        discount_amount = subtotal * PRO_DISCOUNT_PERCENT

    total = subtotal - discount_amount
    per_review = total / reviews_requested
    platform_fee = calculate_platform_fee(per_review)
    reviewer_earnings = per_review - platform_fee

    return {
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "discount_percent": int(PRO_DISCOUNT_PERCENT * 100) if is_pro_user else 0,
        "total": total,
        "per_review_amount": per_review,
        "platform_fee_per_review": platform_fee,
        "platform_fee_total": platform_fee * reviews_requested,
        "reviewer_earnings_per_review": reviewer_earnings,
        "reviews_requested": reviews_requested,
    }
