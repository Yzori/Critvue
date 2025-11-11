"""Review Request database model"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text
)
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_file import ReviewFile


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
    content_type = Column(Enum(ContentType), nullable=False, index=True)
    review_type = Column(Enum(ReviewType), nullable=False, default=ReviewType.FREE)

    # Status tracking
    status = Column(Enum(ReviewStatus), nullable=False, default=ReviewStatus.DRAFT, index=True)

    # Feedback areas (JSON stored as text for flexibility)
    # Example: "UI/UX, Color scheme, Typography" or specific questions
    feedback_areas = Column(Text, nullable=True)

    # Budget for expert reviews (optional, in cents to avoid floating point issues)
    budget = Column(Numeric(10, 2), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Soft delete support for audit trail
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    user = relationship("User", back_populates="review_requests")
    files = relationship(
        "ReviewFile",
        back_populates="review_request",
        cascade="all, delete-orphan",
        lazy="selectin"  # Eager load files when fetching review requests
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
