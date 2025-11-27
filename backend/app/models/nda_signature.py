"""NDA Signature database model for tracking NDA agreements"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_request import ReviewRequest


class NDARole(str, enum.Enum):
    """Role of the signer in the NDA"""
    CREATOR = "creator"
    REVIEWER = "reviewer"


# Current NDA version - increment when NDA terms change
CURRENT_NDA_VERSION = "1.0"


class NDASignature(Base):
    """
    Tracks NDA signatures for confidential review requests.

    Each signature records:
    - Who signed (user_id)
    - Their role (creator/reviewer)
    - What they signed (review_request_id, nda_version)
    - When they signed (signed_at)
    - Audit info (IP, user agent)
    """

    __tablename__ = "nda_signatures"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    review_request_id = Column(
        Integer,
        ForeignKey("review_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Signature details
    role = Column(String(20), nullable=False)  # 'creator' or 'reviewer'
    full_legal_name = Column(String(255), nullable=False)
    nda_version = Column(String(50), nullable=False, default=CURRENT_NDA_VERSION)

    # Audit trail
    signature_ip = Column(String(45), nullable=True)  # IPv4 or IPv6
    signature_user_agent = Column(String(500), nullable=True)
    signed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Composite indexes
    __table_args__ = (
        Index('idx_nda_sig_request_user', 'review_request_id', 'user_id'),
        Index('idx_nda_sig_request_role', 'review_request_id', 'role'),
    )

    # Relationships
    review_request = relationship("ReviewRequest", back_populates="nda_signatures")
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<NDASignature {self.id}: {self.role} for request {self.review_request_id}>"

    @property
    def is_creator(self) -> bool:
        """Check if this is a creator signature"""
        return self.role == NDARole.CREATOR.value

    @property
    def is_reviewer(self) -> bool:
        """Check if this is a reviewer signature"""
        return self.role == NDARole.REVIEWER.value
