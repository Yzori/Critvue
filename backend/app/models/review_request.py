"""Review Request database model"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text
)
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_file import ReviewFile
    from app.models.review_slot import ReviewSlot


class ContentType(str, enum.Enum):
    """Types of content that can be reviewed"""
    DESIGN = "design"
    CODE = "code"
    VIDEO = "video"
    AUDIO = "audio"
    WRITING = "writing"
    ART = "art"


class ReviewType(str, enum.Enum):
    """Types of review services"""
    FREE = "free"  # AI + community reviews
    EXPERT = "expert"  # Paid expert reviews


class ReviewStatus(str, enum.Enum):
    """Status of a review request"""
    DRAFT = "draft"
    PENDING = "pending"
    IN_REVIEW = "in_review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ReviewTier(str, enum.Enum):
    """Expert review tier levels"""
    QUICK = "quick"  # $5-15, 5-10 minutes
    STANDARD = "standard"  # $25-75, 15-20 minutes
    DEEP = "deep"  # $100-200+, 30+ minutes


class FeedbackPriority(str, enum.Enum):
    """Primary focus area for the review"""
    VALIDATION = "validation"  # Quick validation of approach/direction
    SPECIFIC_FIXES = "specific_fixes"  # Specific issues to address
    STRATEGIC_DIRECTION = "strategic_direction"  # High-level strategic guidance
    COMPREHENSIVE = "comprehensive"  # Full comprehensive review


class ReviewRequest(Base):
    """Review Request model for managing feedback requests"""

    __tablename__ = "review_requests"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Basic information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    # Content and review type
    content_type = Column(
        Enum(ContentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    content_subcategory = Column(
        String(50),
        nullable=True,
        index=True,
        doc="Optional subcategory for more specific content type (e.g., 'frontend', 'ui_ux', 'illustration')"
    )
    review_type = Column(
        Enum(ReviewType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ReviewType.FREE
    )

    # Status tracking
    status = Column(
        Enum(ReviewStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ReviewStatus.DRAFT,
        index=True
    )

    # Feedback areas (JSON stored as text for flexibility)
    # Example: "UI/UX, Color scheme, Typography" or specific questions
    feedback_areas = Column(Text, nullable=True)

    # Budget for expert reviews (optional, in cents to avoid floating point issues)
    budget = Column(Numeric(10, 2), nullable=True)

    # Deadline for review completion (optional, UTC datetime)
    deadline = Column(DateTime, nullable=True, index=True)

    # Expert review tier fields (nullable for FREE reviews - backward compatible)
    tier = Column(
        Enum(ReviewTier, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        index=True,
        doc="Expert review tier: quick (5-10min), standard (15-20min), deep (30+ min). NULL for free reviews."
    )
    feedback_priority = Column(
        Enum(FeedbackPriority, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        doc="Primary focus area for the review"
    )
    specific_questions = Column(
        JSON,
        nullable=True,
        doc="JSON array of specific questions the requester wants answered"
    )
    context = Column(
        Text,
        nullable=True,
        doc="Additional context about the project, target audience, goals, etc."
    )
    estimated_duration = Column(
        Integer,
        nullable=True,
        doc="Estimated review duration in minutes based on tier"
    )

    # Multi-review support
    reviews_requested = Column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
        doc="Number of reviews requested (1-10)"
    )
    reviews_claimed = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        index=True,
        doc="Number of review slots that have been claimed"
    )
    reviews_completed = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        index=True,
        doc="Number of reviews that have been accepted"
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Soft delete support for audit trail
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Composite indexes for optimized queries
    __table_args__ = (
        # Index for filtering user's reviews by status and sorting by date
        Index('idx_user_status_created', 'user_id', 'status', 'created_at'),
        # Index for filtering non-deleted reviews by user
        Index('idx_user_deleted', 'user_id', 'deleted_at'),
        # Index for filtering by status and date (for admin queries)
        Index('idx_status_created', 'status', 'created_at'),
        # Index for browse marketplace queries (status, deadline for urgency filters)
        Index('idx_status_deadline', 'status', 'deadline'),
        # Index for content type filtering in browse
        Index('idx_content_status', 'content_type', 'status', 'created_at'),
        # Index for subcategory filtering (content_type + subcategory + status)
        Index('idx_content_subcategory', 'content_type', 'content_subcategory', 'status'),
        # Index for multi-review queries (status + reviews_claimed)
        Index('idx_status_reviews_claimed', 'status', 'reviews_claimed'),
        # Index for expert review tier filtering (review_type + tier)
        Index('idx_review_type_tier', 'review_type', 'tier'),
    )

    # Relationships
    user = relationship("User", back_populates="review_requests")
    files = relationship(
        "ReviewFile",
        back_populates="review_request",
        cascade="all, delete-orphan",
        lazy="selectin"  # Eager load files when fetching review requests
    )
    slots = relationship(
        "ReviewSlot",
        back_populates="review_request",
        cascade="all, delete-orphan",
        lazy="selectin"  # Eager load slots for status calculations
    )

    def __repr__(self) -> str:
        return f"<ReviewRequest {self.id}: {self.title[:30]}>"

    @property
    def is_deleted(self) -> bool:
        """Check if review request is soft deleted"""
        return self.deleted_at is not None

    @property
    def is_editable(self) -> bool:
        """Check if review request can be edited"""
        return self.status in [ReviewStatus.DRAFT, ReviewStatus.PENDING]

    @property
    def file_count(self) -> int:
        """Get number of attached files"""
        return len(self.files) if self.files else 0

    @property
    def available_slots(self) -> int:
        """Get number of available review slots"""
        return max(0, self.reviews_requested - self.reviews_claimed)

    @property
    def is_fully_claimed(self) -> bool:
        """Check if all review slots are claimed"""
        return self.reviews_claimed >= self.reviews_requested

    @property
    def is_partially_claimed(self) -> bool:
        """Check if some but not all review slots are claimed"""
        return 0 < self.reviews_claimed < self.reviews_requested

    @property
    def claim_progress_percentage(self) -> float:
        """Get claim progress as percentage (0-100)"""
        if self.reviews_requested == 0:
            return 0.0
        return (self.reviews_claimed / self.reviews_requested) * 100
