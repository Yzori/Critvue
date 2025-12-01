"""Battle Vote model for community voting on battles"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.battle import Battle
    from app.models.battle_entry import BattleEntry


class BattleVote(Base):
    """
    Battle Vote model for community voting.

    Each user can vote once per battle.
    Votes are final and cannot be changed.
    Vote counts are hidden until voting ends (blind voting).
    """

    __tablename__ = "battle_votes"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    battle_id = Column(
        Integer,
        ForeignKey("battles.id", ondelete="CASCADE"),
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
        ForeignKey("battle_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Timestamp
    voted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Ensure one vote per user per battle
    __table_args__ = (
        UniqueConstraint('battle_id', 'voter_id', name='unique_battle_voter'),
    )

    # Relationships
    battle = relationship("Battle", back_populates="votes")
    voter = relationship("User", backref="battle_votes")
    entry = relationship("BattleEntry", back_populates="votes")

    def __repr__(self) -> str:
        return f"<BattleVote {self.id}: User {self.voter_id} voted for Entry {self.entry_id} in Battle {self.battle_id}>"
