"""Challenge Invitation model for 1v1 challenge invitations"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.challenge import Challenge


class InvitationStatus(str, enum.Enum):
    """Status of a challenge invitation"""
    PENDING = "pending"       # Waiting for response
    ACCEPTED = "accepted"     # Invitation accepted
    DECLINED = "declined"     # Invitation declined
    EXPIRED = "expired"       # Invitation expired (48 hours)
    REPLACED = "replaced"     # User was replaced by another invitee


class ChallengeInvitation(Base):
    """
    Challenge Invitation model for 1v1 challenge invitations.

    When the platform creates a 1v1 challenge, it invites two creators.
    Invitations are blind - creators don't see who the opponent is until both accept.
    """

    __tablename__ = "challenge_invitations"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to challenge
    challenge_id = Column(
        Integer,
        ForeignKey("challenges.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Invited user
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Participant slot (1 or 2 for 1v1 challenges)
    slot = Column(Integer, nullable=False)

    # Invitation status
    status = Column(
        Enum(InvitationStatus, values_callable=lambda x: [e.value for e in x]),
        default=InvitationStatus.PENDING,
        nullable=False,
        index=True
    )

    # Optional invitation message from admin
    message = Column(Text, nullable=True)

    # Expiration (48 hours from creation)
    expires_at = Column(DateTime, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)  # When accepted/declined

    # Ensure one invitation per user per challenge
    __table_args__ = (
        UniqueConstraint('challenge_id', 'user_id', name='unique_challenge_user_invite'),
    )

    # Relationships
    challenge = relationship("Challenge", back_populates="invitations")
    user = relationship(
        "User",
        backref="challenge_invitations"
    )

    def __repr__(self) -> str:
        return f"<ChallengeInvitation {self.id}: Challenge {self.challenge_id} -> User {self.user_id} [{self.status}]>"

    @property
    def is_pending(self) -> bool:
        """Check if invitation is still pending"""
        return self.status == InvitationStatus.PENDING

    @property
    def is_expired(self) -> bool:
        """Check if invitation has expired"""
        if self.status == InvitationStatus.EXPIRED:
            return True
        if self.status == InvitationStatus.PENDING and datetime.utcnow() > self.expires_at:
            return True
        return False

    def accept(self) -> None:
        """Accept the invitation"""
        if self.is_pending and not self.is_expired:
            self.status = InvitationStatus.ACCEPTED
            self.responded_at = datetime.utcnow()

    def decline(self) -> None:
        """Decline the invitation"""
        if self.is_pending:
            self.status = InvitationStatus.DECLINED
            self.responded_at = datetime.utcnow()

    def expire(self) -> None:
        """Mark invitation as expired"""
        if self.is_pending:
            self.status = InvitationStatus.EXPIRED

    def replace(self) -> None:
        """Mark invitation as replaced (admin invited someone else)"""
        if self.is_pending or self.status == InvitationStatus.DECLINED:
            self.status = InvitationStatus.REPLACED
