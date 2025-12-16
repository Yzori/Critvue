"""Reviewer Dashboard schemas"""

from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field

from .responses import ReviewSlotResponse


class ReviewerSlotWithRequest(ReviewSlotResponse):
    """Review slot with embedded request info for reviewer dashboard"""
    review_request: dict = Field(..., description="Minimal review request info")


class ReviewerSlotListResponse(BaseModel):
    """Schema for paginated list of review slots with request details (for reviewer dashboard)"""
    items: List[ReviewerSlotWithRequest]
    total: int
    skip: int
    limit: int
    has_more: bool


class ReviewerDashboard(BaseModel):
    """Dashboard data for reviewers"""
    active_claims: List[ReviewerSlotWithRequest] = Field(
        default=[],
        description="Slots currently claimed by reviewer"
    )
    submitted_reviews: List[ReviewerSlotWithRequest] = Field(
        default=[],
        description="Reviews submitted, awaiting acceptance"
    )
    completed_reviews: List[ReviewerSlotWithRequest] = Field(
        default=[],
        description="Accepted reviews"
    )
    stats: dict = Field(
        default={},
        description="Reviewer statistics"
    )


class ReviewerEarnings(BaseModel):
    """Earnings summary for expert reviewers"""
    total_earned: Decimal = Field(default=Decimal("0.00"))
    pending_payment: Decimal = Field(default=Decimal("0.00"))
    available_for_withdrawal: Decimal = Field(default=Decimal("0.00"))
    reviews_completed: int = Field(default=0)
    average_rating: Optional[float] = None
    acceptance_rate: float = Field(default=0.0, ge=0.0, le=1.0)
