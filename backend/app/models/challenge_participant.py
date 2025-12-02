"""Challenge Participant model for category challenge participants"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.challenge import Challenge


class ChallengeParticipant(Base):
    """
    Challenge Participant model for category challenges.

    Tracks users who have joined a category challenge.
    Used for category challenges where multiple participants can join.
    """

    __tablename__ = "challenge_participants"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    challenge_id = Column(
        Integer,
        ForeignKey("challenges.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Timestamp when joined
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Final placement (set after challenge completes)
    placement = Column(Integer, nullable=True)  # 1st, 2nd, 3rd, etc.

    # Karma earned from this challenge
    karma_earned = Column(Integer, default=0, nullable=False)

    # Ensure one participation record per user per challenge
    __table_args__ = (
        UniqueConstraint('challenge_id', 'user_id', name='unique_challenge_participant'),
    )

    # Relationships
    challenge = relationship("Challenge", back_populates="participants")
    user = relationship("User", backref="challenge_participations")

    def __repr__(self) -> str:
        return f"<ChallengeParticipant {self.id}: User {self.user_id} in Challenge {self.challenge_id}>"

    @property
    def is_winner(self) -> bool:
        """Check if participant is a winner (has placement)"""
        return self.placement is not None and self.placement > 0

    def set_placement(self, placement: int, karma: int) -> None:
        """Set final placement and karma reward"""
        self.placement = placement
        self.karma_earned = karma
