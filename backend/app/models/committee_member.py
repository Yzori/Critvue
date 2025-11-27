"""Committee Member database model for expert application review"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.application_review import ApplicationReview


class CommitteeRole(str, enum.Enum):
    """Committee member role types"""
    ADMIN = "admin"  # Full approval power, single vote is final
    SENIOR_REVIEWER = "senior_reviewer"  # Can vote, needs consensus
    COMMITTEE_LEAD = "committee_lead"  # Can break ties, escalate


class CommitteeMember(AsyncAttrs, Base):
    """
    Committee Member model for tracking who can review expert applications.

    Committee members are users who have been granted the ability to review
    and vote on expert applications. Different roles have different levels
    of authority in the approval process.
    """

    __tablename__ = "committee_members"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign key to user
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True  # One committee membership per user
    )

    # Committee role - use String for SQLite compatibility
    role: Mapped[str] = mapped_column(
        String(30),
        default=CommitteeRole.SENIOR_REVIEWER.value,
        nullable=False,
        index=True
    )

    @property
    def role_enum(self) -> CommitteeRole:
        """Get role as enum"""
        return CommitteeRole(self.role)

    # Active status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Capacity - how many applications they can review concurrently
    max_concurrent_reviews: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    deactivated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="committee_membership")
    application_reviews: Mapped[list["ApplicationReview"]] = relationship(
        "ApplicationReview",
        back_populates="reviewer",
        cascade="all, delete-orphan"
    )

    # Indexes
    __table_args__ = (
        Index("idx_committee_active_role", "is_active", "role"),
    )

    def __repr__(self) -> str:
        return f"<CommitteeMember {self.id} - User {self.user_id} ({self.role})>"
