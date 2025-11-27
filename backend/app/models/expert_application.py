"""Expert Application database model"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from app.models.user import Base

if TYPE_CHECKING:
    from app.models.application_review import ApplicationReview


class ApplicationStatus(str, enum.Enum):
    """Expert application status types"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    REQUEST_CHANGES = "request_changes"  # Committee requested changes
    RESUBMITTED = "resubmitted"  # Applicant resubmitted after changes


class ExpertApplication(AsyncAttrs, Base):
    """
    Expert Application model for tracking reviewer applications.

    Tracks the complete lifecycle of an expert application from draft to final decision.
    Ensures users cannot submit duplicate applications by enforcing one active application per user.
    """

    __tablename__ = "expert_applications"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign key to user
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Basic information
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Application status - use String for SQLite compatibility
    status: Mapped[str] = mapped_column(
        String(30),
        default=ApplicationStatus.DRAFT.value,
        nullable=False,
        index=True
    )

    @property
    def status_enum(self) -> ApplicationStatus:
        """Get status as enum"""
        return ApplicationStatus(self.status)

    # Application data (stores the full form submission)
    application_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Application number (unique identifier for submitted applications)
    application_number: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True, index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # When final decision was made

    # Re-application tracking (3-month cooldown after rejection)
    last_rejection_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rejection_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Assigned reviewer tier (set on approval)
    assigned_tier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # expert, master, elite

    # Final rejection reason summary (for applicant notification)
    rejection_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship to user
    user: Mapped["User"] = relationship("User", back_populates="expert_applications")

    # Relationship to reviews
    reviews: Mapped[list["ApplicationReview"]] = relationship(
        "ApplicationReview",
        back_populates="application",
        cascade="all, delete-orphan"
    )

    # Indexes for efficient querying
    __table_args__ = (
        Index("idx_expert_app_user_status", "user_id", "status"),
        Index("idx_expert_app_created", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<ExpertApplication {self.id} - {self.email} ({self.status})>"
