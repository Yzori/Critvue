"""Challenge Vote model for community voting on challenges"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.challenge import Challenge
    from app.models.challenge_entry import ChallengeEntry


class ChallengeVote(Base):
    """
    Challenge Vote model for community voting.

    Each user can vote once per challenge.
    Votes are final and cannot be changed.
    Vote counts are hidden until voting ends (blind voting).
    """

    __tablename__ = "challenge_votes"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    challenge_id = Column(
        Integer,
        ForeignKey("challenges.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    voter_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    entry_id = Column(
        Integer,
        ForeignKey("challenge_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Timestamp
    voted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Ensure one vote per user per challenge
    __table_args__ = (
        UniqueConstraint('challenge_id', 'voter_id', name='unique_challenge_voter'),
    )

    # Relationships
    challenge = relationship("Challenge", back_populates="votes")
    voter = relationship("User", backref="challenge_votes")
    entry = relationship("ChallengeEntry", back_populates="votes")

    def __repr__(self) -> str:
        return f"<ChallengeVote {self.id}: User {self.voter_id} voted for Entry {self.entry_id} in Challenge {self.challenge_id}>"
