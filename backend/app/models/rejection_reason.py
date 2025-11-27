"""Rejection Reason database model for standardized application rejection reasons"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
from app.models.user import Base

if TYPE_CHECKING:
    from app.models.application_review import ApplicationReview


class RejectionReason(AsyncAttrs, Base):
    """
    Rejection Reason model for standardized reasons when rejecting expert applications.

    Provides a consistent set of rejection reasons that committee members can select
    when rejecting an application, with optional additional freeform feedback.
    """

    __tablename__ = "rejection_reasons"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Unique code for programmatic reference
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    # Human-readable label
    label: Mapped[str] = mapped_column(String(255), nullable=False)

    # Detailed description shown to committee members
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Message shown to the applicant (can be different from internal description)
    applicant_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Active status (allows soft-disabling reasons)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Display order
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application_reviews: Mapped[list["ApplicationReview"]] = relationship(
        "ApplicationReview",
        back_populates="rejection_reason"
    )

    def __repr__(self) -> str:
        return f"<RejectionReason {self.code} - {self.label}>"
