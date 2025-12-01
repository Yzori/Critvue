"""Battle Challenge model for direct challenge invitations"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.battle import Battle


class ChallengeStatus(str, enum.Enum):
    """Status of a direct challenge"""
    PENDING = "pending"       # Waiting for response
    ACCEPTED = "accepted"     # Challenge accepted, battle started
    DECLINED = "declined"     # Challenge declined
    EXPIRED = "expired"       # Challenge expired (48 hours)


class BattleChallenge(Base):
    """
    Battle Challenge model for direct challenge invitations.

    When a user directly challenges another user to a battle,
    this model tracks the challenge status.
    """

    __tablename__ = "battle_challenges"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to battle (one-to-one)
    battle_id = Column(
        Integer,
        ForeignKey("battles.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    # Challenger (who sent the challenge)
    challenger_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Challenged (who received the challenge)
    challenged_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Optional message from challenger
    message = Column(Text, nullable=True)

    # Challenge status
    status = Column(
        Enum(ChallengeStatus, values_callable=lambda x: [e.value for e in x]),
        default=ChallengeStatus.PENDING,
        nullable=False,
        index=True
    )

    # Expiration (48 hours from creation)
    expires_at = Column(DateTime, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)  # When accepted/declined

    # Relationships
    battle = relationship("Battle", back_populates="challenge")
    challenger = relationship(
        "User",
        foreign_keys=[challenger_id],
        backref="sent_challenges"
    )
    challenged = relationship(
        "User",
        foreign_keys=[challenged_id],
        backref="received_challenges"
    )

    def __repr__(self) -> str:
        return f"<BattleChallenge {self.id}: {self.challenger_id} -> {self.challenged_id} [{self.status}]>"

    @property
    def is_pending(self) -> bool:
        """Check if challenge is still pending"""
        return self.status == ChallengeStatus.PENDING

    @property
    def is_expired(self) -> bool:
        """Check if challenge has expired"""
        if self.status == ChallengeStatus.EXPIRED:
            return True
        if self.status == ChallengeStatus.PENDING and datetime.utcnow() > self.expires_at:
            return True
        return False

    def accept(self) -> None:
        """Accept the challenge"""
        if self.is_pending and not self.is_expired:
            self.status = ChallengeStatus.ACCEPTED
            self.responded_at = datetime.utcnow()

    def decline(self) -> None:
        """Decline the challenge"""
        if self.is_pending:
            self.status = ChallengeStatus.DECLINED
            self.responded_at = datetime.utcnow()

    def expire(self) -> None:
        """Mark challenge as expired"""
        if self.is_pending:
            self.status = ChallengeStatus.EXPIRED
