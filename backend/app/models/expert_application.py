"""Expert Application database model"""

import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from app.models.user import Base


class ApplicationStatus(str, enum.Enum):
    """Expert application status types"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


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

    # Application status
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus),
        default=ApplicationStatus.DRAFT,
        nullable=False,
        index=True
    )

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

    # Relationship to user
    user: Mapped["User"] = relationship("User", back_populates="expert_applications")

    # Indexes for efficient querying
    __table_args__ = (
        Index("idx_expert_app_user_status", "user_id", "status"),
        Index("idx_expert_app_created", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<ExpertApplication {self.id} - {self.email} ({self.status})>"
