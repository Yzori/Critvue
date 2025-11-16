"""Subscription-related Pydantic schemas"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SubscriptionStatus(BaseModel):
    """Response schema for subscription status"""
    tier: str = Field(..., description="Current subscription tier (free or pro)")
    status: Optional[str] = Field(None, description="Subscription status (active, canceled, etc.)")
    subscription_end_date: Optional[datetime] = Field(None, description="Date subscription ends")

    # Review limits for free tier
    monthly_reviews_used: int = Field(0, description="Number of community reviews used this month")
    monthly_reviews_limit: int = Field(3, description="Monthly limit for free tier (3 for free, unlimited for pro)")
    reviews_remaining: int = Field(0, description="Number of reviews remaining this month")
    reviews_reset_at: Optional[datetime] = Field(None, description="When the review count resets")

    # Benefits
    has_unlimited_reviews: bool = Field(False, description="Whether user has unlimited community reviews")
    expert_review_discount: float = Field(0.0, description="Discount percentage on expert reviews (15% for pro)")
    has_priority_queue: bool = Field(False, description="Whether user has priority queue access")

    # Stripe IDs
    stripe_customer_id: Optional[str] = Field(None, description="Stripe customer ID")
    stripe_subscription_id: Optional[str] = Field(None, description="Stripe subscription ID")

    class Config:
        from_attributes = True


class CreateCheckoutSessionRequest(BaseModel):
    """Request to create a Stripe checkout session"""
    price_id: Optional[str] = Field(None, description="Stripe price ID (optional, defaults to Pro tier)")
    success_url: str = Field(..., description="URL to redirect to on successful checkout")
    cancel_url: str = Field(..., description="URL to redirect to on canceled checkout")


class CreateCheckoutSessionResponse(BaseModel):
    """Response with checkout session URL"""
    checkout_url: str = Field(..., description="Stripe Checkout Session URL")
    session_id: str = Field(..., description="Stripe Checkout Session ID")


class CreatePortalSessionRequest(BaseModel):
    """Request to create a Stripe customer portal session"""
    return_url: str = Field(..., description="URL to return to from the portal")


class CreatePortalSessionResponse(BaseModel):
    """Response with portal session URL"""
    portal_url: str = Field(..., description="Stripe Customer Portal URL")


class SubscriptionUpgradeResponse(BaseModel):
    """Response after subscription upgrade"""
    message: str
    tier: str
    status: str


class WebhookEvent(BaseModel):
    """Stripe webhook event data"""
    type: str
    data: dict
