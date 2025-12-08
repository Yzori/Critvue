"""Slot Application database model for expert review slot applications"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncAttrs

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_request import ReviewRequest


class SlotApplicationStatus(str, enum.Enum):
    """Status of a slot application"""
    PENDING = "pending"          # Awaiting creator decision
    ACCEPTED = "accepted"        # Creator accepted - slot assigned to applicant
    REJECTED = "rejected"        # Creator rejected the application
    WITHDRAWN = "withdrawn"      # Applicant withdrew their application
    EXPIRED = "expired"          # Request was completed/cancelled before decision


class SlotApplication(AsyncAttrs, Base):
    """
    Application from an expert to review a paid review request.

    For paid review requests, instead of directly claiming slots, experts apply
    with a pitch message. The creator reviews applications and accepts/rejects
    applicants, giving them control over who provides expert feedback.

    Flow:
    1. Expert applies to a review request (creates SlotApplication with PENDING status)
    2. Creator reviews applications and accepts/rejects
    3. Accepted applicant gets a slot assigned (slot becomes CLAIMED)
    4. Normal review flow continues from there
    """

    __tablename__ = "slot_applications"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign keys
    review_request_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("review_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    applicant_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # Slot that was assigned on acceptance (null until accepted)
    assigned_slot_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("review_slots.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Application status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SlotApplicationStatus.PENDING.value,
        index=True
    )

    # Application content
    pitch_message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Short message from the expert explaining why they'd be a good fit"
    )

    # Creator's response (on rejection)
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Optional reason provided by creator when rejecting"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    decided_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        doc="When creator accepted/rejected the application"
    )

    # Relationships
    review_request: Mapped["ReviewRequest"] = relationship(
        "ReviewRequest",
        back_populates="slot_applications"
    )
    applicant: Mapped["User"] = relationship(
        "User",
        back_populates="slot_applications"
    )
    assigned_slot: Mapped[Optional["ReviewSlot"]] = relationship(
        "ReviewSlot",
        back_populates="application"
    )

    # Indexes for efficient querying
    __table_args__ = (
        # Prevent duplicate applications from same user to same request
        Index(
            "idx_unique_user_request_application",
            "applicant_id",
            "review_request_id",
            unique=True,
            postgresql_where="status NOT IN ('rejected', 'withdrawn', 'expired')"
        ),
        # For querying applications by request
        Index("idx_slot_app_request_status", "review_request_id", "status"),
        # For querying user's applications
        Index("idx_slot_app_user_status", "applicant_id", "status"),
        # For ordering by creation date
        Index("idx_slot_app_created", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<SlotApplication {self.id}: User {self.applicant_id} -> Request {self.review_request_id} ({self.status})>"

    # ===== Properties =====

    @property
    def status_enum(self) -> SlotApplicationStatus:
        """Get status as enum"""
        return SlotApplicationStatus(self.status)

    @property
    def is_pending(self) -> bool:
        """Check if application is awaiting decision"""
        return self.status == SlotApplicationStatus.PENDING.value

    @property
    def is_accepted(self) -> bool:
        """Check if application was accepted"""
        return self.status == SlotApplicationStatus.ACCEPTED.value

    @property
    def is_rejected(self) -> bool:
        """Check if application was rejected"""
        return self.status == SlotApplicationStatus.REJECTED.value

    @property
    def is_withdrawable(self) -> bool:
        """Check if applicant can withdraw"""
        return self.status == SlotApplicationStatus.PENDING.value

    @property
    def is_decidable(self) -> bool:
        """Check if creator can accept/reject"""
        return self.status == SlotApplicationStatus.PENDING.value

    # ===== State Transition Methods =====

    def accept(self, slot_id: int) -> None:
        """
        Accept this application and assign a slot.

        Args:
            slot_id: ID of the slot to assign to the applicant

        Raises:
            ValueError: If application is not pending
        """
        if not self.is_decidable:
            raise ValueError(f"Cannot accept application in status '{self.status}'")

        now = datetime.utcnow()
        self.status = SlotApplicationStatus.ACCEPTED.value
        self.assigned_slot_id = slot_id
        self.decided_at = now
        self.updated_at = now

    def reject(self, reason: Optional[str] = None) -> None:
        """
        Reject this application.

        Args:
            reason: Optional reason for rejection

        Raises:
            ValueError: If application is not pending
        """
        if not self.is_decidable:
            raise ValueError(f"Cannot reject application in status '{self.status}'")

        now = datetime.utcnow()
        self.status = SlotApplicationStatus.REJECTED.value
        self.rejection_reason = reason
        self.decided_at = now
        self.updated_at = now

    def withdraw(self) -> None:
        """
        Withdraw this application (by applicant).

        Raises:
            ValueError: If application is not pending
        """
        if not self.is_withdrawable:
            raise ValueError(f"Cannot withdraw application in status '{self.status}'")

        now = datetime.utcnow()
        self.status = SlotApplicationStatus.WITHDRAWN.value
        self.updated_at = now

    def expire(self) -> None:
        """
        Mark application as expired (request completed/cancelled).

        Raises:
            ValueError: If application is not pending
        """
        if not self.is_pending:
            raise ValueError(f"Cannot expire application in status '{self.status}'")

        now = datetime.utcnow()
        self.status = SlotApplicationStatus.EXPIRED.value
        self.updated_at = now
