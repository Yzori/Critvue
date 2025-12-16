"""ReviewSlot Response schemas"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field

from app.constants.time import SECONDS_PER_DAY, SECONDS_PER_HOUR, SECONDS_PER_MINUTE
from app.models.review_slot import (
    ReviewSlotStatus,
    AcceptanceType,
    RejectionReason,
    PaymentStatus,
    DisputeResolution,
)

from .submission import FeedbackSection, Annotation


class ReviewerInfo(BaseModel):
    """Minimal reviewer information for public display"""
    id: int
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewSlotResponse(BaseModel):
    """Schema for review slot response"""
    id: int
    review_request_id: int
    reviewer_id: Optional[int] = None
    status: ReviewSlotStatus

    # Lifecycle timestamps
    claimed_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    claim_deadline: Optional[datetime] = None
    auto_accept_at: Optional[datetime] = None

    # Review content (only visible after submission)
    review_text: Optional[str] = None
    rating: Optional[int] = None
    review_attachments: Optional[List[Any]] = None

    # Structured feedback (new format)
    feedback_sections: Optional[List[FeedbackSection]] = None
    annotations: Optional[List[Annotation]] = None

    # Acceptance/Rejection metadata
    acceptance_type: Optional[AcceptanceType] = None
    rejection_reason: Optional[RejectionReason] = None
    rejection_notes: Optional[str] = None

    # Dispute info
    is_disputed: bool = False
    dispute_reason: Optional[str] = None
    dispute_resolved_at: Optional[datetime] = None
    dispute_resolution: Optional[DisputeResolution] = None

    # Elaboration request tracking
    elaboration_request: Optional[str] = None
    elaboration_requested_at: Optional[datetime] = None
    elaboration_count: int = 0
    elaboration_deadline: Optional[datetime] = None

    # Payment info (only for requester/reviewer)
    payment_amount: Optional[Decimal] = None
    payment_status: Optional[PaymentStatus] = None
    payment_released_at: Optional[datetime] = None

    # Quality metrics
    requester_helpful_rating: Optional[int] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    # Computed fields
    @property
    def review_preview(self) -> Optional[str]:
        """Get preview of review text"""
        if not self.review_text:
            return None
        return self.review_text[:100] + ("..." if len(self.review_text) > 100 else "")

    @property
    def time_until_deadline(self) -> Optional[str]:
        """Get human-readable time until deadline"""
        if not self.claim_deadline:
            return None
        delta = self.claim_deadline - datetime.utcnow()
        if delta.total_seconds() <= 0:
            return "Expired"
        return self._format_timedelta(delta)

    @property
    def time_until_auto_accept(self) -> Optional[str]:
        """Get human-readable time until auto-accept"""
        if not self.auto_accept_at:
            return None
        delta = self.auto_accept_at - datetime.utcnow()
        if delta.total_seconds() <= 0:
            return "Expired"
        return self._format_timedelta(delta)

    @staticmethod
    def _format_timedelta(delta: timedelta) -> str:
        """Format timedelta to human-readable string"""
        total_seconds = int(delta.total_seconds())
        days = total_seconds // SECONDS_PER_DAY
        hours = (total_seconds % SECONDS_PER_DAY) // SECONDS_PER_HOUR
        minutes = (total_seconds % SECONDS_PER_HOUR) // SECONDS_PER_MINUTE

        if days > 0:
            return f"{days}d {hours}h"
        elif hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"

    class Config:
        from_attributes = True


class ReviewSlotPublicResponse(BaseModel):
    """Public view of review slot (for browse/request detail)"""
    id: int
    status: ReviewSlotStatus
    reviewer: Optional[ReviewerInfo] = None

    # Only show content after acceptance
    review_text: Optional[str] = None
    rating: Optional[int] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    # Computed fields
    @property
    def review_preview(self) -> Optional[str]:
        """Get preview of review text"""
        if not self.review_text:
            return None
        return self.review_text[:100] + ("..." if len(self.review_text) > 100 else "")

    class Config:
        from_attributes = True


class ReviewSlotListResponse(BaseModel):
    """Schema for paginated list of review slots"""
    items: List[ReviewSlotResponse]
    total: int
    skip: int
    limit: int
    has_more: bool


class ReviewSlotStats(BaseModel):
    """Statistics for review slots"""
    total_slots: int
    available: int
    claimed: int
    submitted: int
    accepted: int
    rejected: int
    abandoned: int
    disputed: int
