"""Payment schemas for expert review payments and Stripe Connect"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


# ===== Payment Intent Schemas =====

class CreatePaymentIntentRequest(BaseModel):
    """Request to create a payment intent for expert review"""
    review_request_id: int = Field(..., description="ID of the review request to pay for")


class CreatePaymentIntentResponse(BaseModel):
    """Response with payment intent details"""
    client_secret: str = Field(..., description="Stripe client secret for frontend")
    payment_intent_id: str = Field(..., description="Payment Intent ID")
    amount: Decimal = Field(..., description="Amount in dollars")
    currency: str = Field(default="usd", description="Currency code")


class PaymentStatusResponse(BaseModel):
    """Response with payment status for a review request"""
    payment_status: str = Field(..., description="Current payment status")
    payment_intent_id: Optional[str] = Field(None, description="Stripe Payment Intent ID")
    amount: Optional[Decimal] = Field(None, description="Total payment amount")
    payment_captured_at: Optional[datetime] = Field(None, description="When payment was captured")
    is_paid: bool = Field(default=False, description="Whether payment has been captured")


# ===== Stripe Connect Schemas =====

class ConnectOnboardingRequest(BaseModel):
    """Request to start Stripe Connect onboarding"""
    return_url: str = Field(..., description="URL to redirect to after onboarding")
    refresh_url: str = Field(..., description="URL to redirect to if link expires")


class ConnectOnboardingResponse(BaseModel):
    """Response with Connect onboarding URL"""
    account_id: str = Field(..., description="Stripe Connect account ID")
    onboarding_url: str = Field(..., description="URL to complete onboarding")


class ConnectStatusResponse(BaseModel):
    """Response with Connect account status"""
    is_onboarded: bool = Field(default=False, description="Whether onboarding is complete")
    payouts_enabled: bool = Field(default=False, description="Whether payouts are enabled")
    account_id: Optional[str] = Field(None, description="Stripe Connect account ID")
    details_submitted: bool = Field(default=False, description="Whether account details are submitted")


class ConnectDashboardLinkResponse(BaseModel):
    """Response with link to Stripe Connect dashboard"""
    dashboard_url: str = Field(..., description="URL to Stripe Connect dashboard")


# ===== Payout Schemas =====

class PayoutHistoryItem(BaseModel):
    """Single payout history entry"""
    payout_id: str
    amount: Decimal
    status: str  # pending, in_transit, paid, failed, canceled
    created_at: datetime
    arrival_date: Optional[datetime] = None


class PayoutHistoryResponse(BaseModel):
    """Response with payout history"""
    payouts: List[PayoutHistoryItem]
    total_paid: Decimal
    has_more: bool = False


class AvailableBalanceResponse(BaseModel):
    """Response with available balance for withdrawal"""
    available_balance: Decimal = Field(..., description="Amount available for withdrawal")
    pending_balance: Decimal = Field(..., description="Amount pending from recent payments")
    currency: str = Field(default="usd")


# ===== Payment Breakdown Schemas =====

class PaymentBreakdown(BaseModel):
    """Breakdown of payment amounts"""
    subtotal: Decimal = Field(..., description="Base amount before discount")
    discount_amount: Decimal = Field(default=Decimal("0"), description="Pro user discount")
    total: Decimal = Field(..., description="Final amount to charge")
    per_review_amount: Decimal = Field(..., description="Amount per review slot")
    platform_fee: Decimal = Field(..., description="Platform fee (20%)")
    reviewer_earnings: Decimal = Field(..., description="Amount reviewer receives per slot")
    reviews_requested: int = Field(..., description="Number of reviews")
    discount_percent: int = Field(default=0, description="Discount percentage applied")


class CalculatePaymentRequest(BaseModel):
    """Request to calculate payment breakdown"""
    budget: Decimal = Field(..., description="Total budget for reviews")
    reviews_requested: int = Field(default=1, ge=1, le=10, description="Number of reviews")
    apply_pro_discount: bool = Field(default=False, description="Whether to apply Pro discount")


class CalculatePaymentResponse(BaseModel):
    """Response with payment calculation"""
    breakdown: PaymentBreakdown
