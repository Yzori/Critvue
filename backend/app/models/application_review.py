"""Application Review database model for committee votes on expert applications"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from app.models.user import Base

if TYPE_CHECKING:
    from app.models.expert_application import ExpertApplication
    from app.models.committee_member import CommitteeMember
    from app.models.rejection_reason import RejectionReason


class ReviewStatus(str, enum.Enum):
    """Status of a committee member's review of an application"""
    CLAIMED = "claimed"  # Committee member has claimed to review
    VOTED = "voted"  # Committee member has submitted their vote
    RELEASED = "released"  # Committee member released back to queue


class Vote(str, enum.Enum):
    """Committee member's vote on an application"""
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_CHANGES = "request_changes"


class ApplicationReview(AsyncAttrs, Base):
    """
    Application Review model for tracking committee member votes on expert applications.

    Each review represents one committee member's evaluation of one application.
    Multiple reviews can exist for the same application when committee consensus is required.
    """

    __tablename__ = "application_reviews"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign key to application
    application_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("expert_applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Foreign key to committee member (reviewer)
    reviewer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("committee_members.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Review status - use String for SQLite compatibility
    status: Mapped[str] = mapped_column(
        String(20),
        default=ReviewStatus.CLAIMED.value,
        nullable=False,
        index=True
    )

    # Vote (null until voted) - use String for SQLite compatibility
    vote: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )

    @property
    def status_enum(self) -> ReviewStatus:
        """Get status as enum"""
        return ReviewStatus(self.status)

    @property
    def vote_enum(self) -> Optional[Vote]:
        """Get vote as enum"""
        return Vote(self.vote) if self.vote else None

    # Rejection reason (only if vote is REJECT)
    rejection_reason_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("rejection_reasons.id", ondelete="SET NULL"),
        nullable=True
    )

    # Additional feedback (optional freeform)
    additional_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Internal notes (not shown to applicant)
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    claimed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    voted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    application: Mapped["ExpertApplication"] = relationship(
        "ExpertApplication",
        back_populates="reviews"
    )
    reviewer: Mapped["CommitteeMember"] = relationship(
        "CommitteeMember",
        back_populates="application_reviews"
    )
    rejection_reason: Mapped[Optional["RejectionReason"]] = relationship(
        "RejectionReason",
        back_populates="application_reviews"
    )

    # Indexes
    __table_args__ = (
        Index("idx_app_review_app_status", "application_id", "status"),
        Index("idx_app_review_reviewer_status", "reviewer_id", "status"),
        Index("idx_app_review_claimed_at", "claimed_at"),
    )

    def __repr__(self) -> str:
        return f"<ApplicationReview {self.id} - App {self.application_id} by Reviewer {self.reviewer_id} ({self.status})>"
