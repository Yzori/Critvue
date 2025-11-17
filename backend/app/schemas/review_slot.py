"""Review Slot Pydantic schemas"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator

from app.models.review_slot import (
    ReviewSlotStatus,
    AcceptanceType,
    RejectionReason,
    PaymentStatus,
    DisputeResolution
)


# ===== ReviewSlot Base Schemas =====

class ReviewSlotBase(BaseModel):
    """Base schema for review slots"""
    review_request_id: int = Field(..., gt=0)


class ReviewSlotCreate(ReviewSlotBase):
    """Schema for creating a review slot (typically automatic)"""
    payment_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


# ===== Review Submission Schemas =====

class FeedbackSection(BaseModel):
    """Individual feedback section in structured review"""
    section_id: str = Field(..., description="Section identifier (e.g., 'issues', 'strengths')")
    section_label: str = Field(..., description="Display label for section")
    content: str = Field(..., min_length=1, description="Feedback content for this section")
    word_count: Optional[int] = Field(None, description="Word count (auto-calculated)")
    required: bool = Field(default=True, description="Whether this section was required")

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate and sanitize content"""
        v = v.strip()
        if not v:
            raise ValueError('Section content cannot be empty')
        return v


class Annotation(BaseModel):
    """Context-specific annotation (pin, timestamp, highlight, line comment)"""
    annotation_id: str = Field(..., description="Unique annotation identifier")
    annotation_type: str = Field(
        ...,
        description="Type: 'pin', 'timestamp', 'highlight', 'line_comment'"
    )

    # For pins (design/art)
    x: Optional[float] = Field(None, ge=0.0, le=1.0, description="Normalized X coordinate (0-1)")
    y: Optional[float] = Field(None, ge=0.0, le=1.0, description="Normalized Y coordinate (0-1)")
    file_id: Optional[int] = Field(None, description="Associated file ID")

    # For timestamps (video/audio)
    timestamp: Optional[float] = Field(None, ge=0.0, description="Timestamp in seconds")

    # For highlights (writing)
    start_offset: Optional[int] = Field(None, ge=0, description="Start character offset")
    end_offset: Optional[int] = Field(None, ge=0, description="End character offset")
    highlighted_text: Optional[str] = Field(None, max_length=500, description="Highlighted text snippet")

    # For line comments (code)
    filename: Optional[str] = Field(None, max_length=255, description="File name for code comment")
    line_number: Optional[int] = Field(None, ge=1, description="Line number in file")

    # Common fields
    feedback_type: str = Field(
        ...,
        description="Feedback type: 'issue', 'suggestion', 'praise', 'question'"
    )
    comment: str = Field(..., min_length=1, max_length=2000, description="Annotation comment")
    severity: Optional[str] = Field(
        None,
        description="Severity for issues: 'low', 'medium', 'high'"
    )


class ReviewSubmit(BaseModel):
    """Schema for submitting a review (supports both structured and legacy formats)"""
    # Legacy format (backward compatible)
    review_text: Optional[str] = Field(None, min_length=50, max_length=10000)

    # New structured format
    feedback_sections: Optional[List[FeedbackSection]] = Field(
        None,
        description="Structured feedback sections (replaces review_text)"
    )
    annotations: Optional[List[Annotation]] = Field(
        None,
        description="Context-specific annotations (pins, timestamps, etc.)"
    )

    # Common fields
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    attachments: Optional[List[dict]] = Field(
        default=None,
        description="Optional list of attachment metadata"
    )

    @field_validator('review_text')
    @classmethod
    def validate_review_text(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize review text"""
        if v:
            v = v.strip()
            if len(v) < 50:
                raise ValueError('Review text must be at least 50 characters')
        return v

    @field_validator('feedback_sections')
    @classmethod
    def validate_sections(cls, v: Optional[List[FeedbackSection]], info) -> Optional[List[FeedbackSection]]:
        """Validate that either review_text or feedback_sections is provided"""
        data = info.data
        review_text = data.get('review_text')

        # Must have either review_text or feedback_sections
        if not review_text and not v:
            raise ValueError('Must provide either review_text or feedback_sections')

        # If using sections, validate minimum content
        if v:
            total_words = 0
            for section in v:
                words = len(section.content.split())
                total_words += words

            if total_words < 50:
                raise ValueError('Total feedback across all sections must be at least 50 words')

        return v


class ReviewAccept(BaseModel):
    """Schema for accepting a review"""
    helpful_rating: Optional[int] = Field(
        None,
        ge=1,
        le=5,
        description="Optional rating of how helpful the review was"
    )


class ReviewReject(BaseModel):
    """Schema for rejecting a review"""
    rejection_reason: RejectionReason = Field(..., description="Reason for rejection")
    rejection_notes: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional detailed explanation"
    )

    @field_validator('rejection_notes')
    @classmethod
    def validate_rejection_notes(cls, v: Optional[str], info) -> Optional[str]:
        """Require notes when reason is 'other'"""
        data = info.data
        reason = data.get('rejection_reason')

        if reason == RejectionReason.OTHER and not v:
            raise ValueError('Rejection notes are required when reason is "other"')

        if v:
            v = v.strip()
            if len(v) < 10:
                raise ValueError('Rejection notes must be at least 10 characters')

        return v


class ReviewDispute(BaseModel):
    """Schema for disputing a rejection"""
    dispute_reason: str = Field(
        ...,
        min_length=20,
        max_length=2000,
        description="Explanation for why rejection is unfair"
    )

    @field_validator('dispute_reason')
    @classmethod
    def validate_dispute_reason(cls, v: str) -> str:
        """Validate dispute reason"""
        v = v.strip()
        if len(v) < 20:
            raise ValueError('Dispute reason must be at least 20 characters')
        return v


class DisputeResolve(BaseModel):
    """Schema for admin resolving a dispute"""
    resolution: DisputeResolution = Field(..., description="Admin decision")
    admin_notes: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional admin explanation"
    )


# ===== ReviewSlot Response Schemas =====

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
        days = total_seconds // 86400
        hours = (total_seconds % 86400) // 3600
        minutes = (total_seconds % 3600) // 60

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


# ===== Reviewer Dashboard Schemas =====

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


# ===== Admin Schemas =====

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
