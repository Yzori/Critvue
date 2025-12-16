"""Admin schemas for Review Slots"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel

from app.models.review_slot import RejectionReason, PaymentStatus

from .responses import ReviewerInfo


class DisputedReview(BaseModel):
    """Disputed review for admin dashboard"""
    slot_id: int
    review_request_id: int
    reviewer: ReviewerInfo
    requester: dict  # Minimal requester info

    # Review content
    review_text: str
    rating: int
    submitted_at: datetime

    # Rejection info
    rejection_reason: RejectionReason
    rejection_notes: Optional[str]
    reviewed_at: datetime

    # Dispute info
    dispute_reason: str
    dispute_created_at: datetime

    # Payment info
    payment_amount: Optional[Decimal] = None
    payment_status: PaymentStatus

    class Config:
        from_attributes = True


class DisputeListResponse(BaseModel):
    """List of disputed reviews for admin"""
    items: List[DisputedReview]
    total: int
    skip: int
    limit: int
    has_more: bool
