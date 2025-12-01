"""Battle database model for 1v1 creative competitions"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text
)
from sqlalchemy.orm import relationship

from app.models.user import Base
from app.models.review_request import ContentType

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.battle_entry import BattleEntry
    from app.models.battle_vote import BattleVote
    from app.models.battle_challenge import BattleChallenge
    from app.models.battle_prompt import BattlePrompt


class BattleStatus(str, enum.Enum):
    """Battle lifecycle states"""
    PENDING = "pending"           # Waiting for second participant
    ACTIVE = "active"             # Both participants joined, submission period
    VOTING = "voting"             # Submission closed, voting open
    COMPLETED = "completed"       # Voting closed, winner determined
    CANCELLED = "cancelled"       # Battle cancelled (no second participant, etc.)
    DRAW = "draw"                 # Tie - both get partial rewards


class BattleType(str, enum.Enum):
    """How the battle was initiated"""
    QUEUE = "queue"               # Random matchmaking from queue
    DIRECT_CHALLENGE = "direct"   # Direct challenge to specific user


class Battle(Base):
    """
    Battle model for 1v1 creative competitions.

    Two creators compete on the same prompt/challenge.
    Community votes to determine the winner.
    Winners earn karma/reputation.
    """

    __tablename__ = "battles"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Battle metadata
    title = Column(String(255), nullable=False)

    # Content type (design, code, writing, etc.)
    content_type = Column(
        Enum(ContentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )

    # Prompt (curated challenge)
    prompt_id = Column(
        Integer,
        ForeignKey("battle_prompts.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Participants
    creator_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    opponent_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    winner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Battle configuration
    battle_type = Column(
        Enum(BattleType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=BattleType.QUEUE
    )
    status = Column(
        Enum(BattleStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=BattleStatus.PENDING,
        index=True
    )

    # Tier-based matchmaking (uses existing UserTier as strings for flexibility)
    min_tier = Column(String(50), nullable=True)
    max_tier = Column(String(50), nullable=True)

    # Timing configuration
    submission_hours = Column(Integer, default=72, nullable=False)
    voting_hours = Column(Integer, default=48, nullable=False)

    # Deadlines (calculated from started_at)
    submission_deadline = Column(DateTime, nullable=True)
    voting_deadline = Column(DateTime, nullable=True)

    # Vote tracking
    creator_votes = Column(Integer, default=0, nullable=False)
    opponent_votes = Column(Integer, default=0, nullable=False)
    total_votes = Column(Integer, default=0, nullable=False)

    # Reward tracking
    winner_karma_reward = Column(Integer, nullable=True)
    loser_karma_change = Column(Integer, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)  # When opponent joined
    voting_started_at = Column(DateTime, nullable=True)  # When voting phase began
    completed_at = Column(DateTime, nullable=True)  # When winner determined

    # Soft delete
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Composite indexes for optimized queries
    __table_args__ = (
        # Index for filtering battles by status and content type
        Index('idx_battle_status_content', 'status', 'content_type'),
        # Index for creator's battles
        Index('idx_battle_creator_status', 'creator_id', 'status'),
        # Index for opponent's battles
        Index('idx_battle_opponent_status', 'opponent_id', 'status'),
        # Index for active battles (for browsing/voting)
        Index('idx_battle_status_created', 'status', 'created_at'),
        # Index for finding pending battles for matchmaking
        Index('idx_battle_pending_content', 'status', 'content_type', 'prompt_id'),
    )

    # Relationships
    creator = relationship(
        "User",
        foreign_keys=[creator_id],
        backref="created_battles"
    )
    opponent = relationship(
        "User",
        foreign_keys=[opponent_id],
        backref="opponent_battles"
    )
    winner = relationship(
        "User",
        foreign_keys=[winner_id],
        backref="won_battles"
    )
    prompt = relationship(
        "BattlePrompt",
        back_populates="battles"
    )
    entries = relationship(
        "BattleEntry",
        back_populates="battle",
        cascade="all, delete-orphan"
    )
    votes = relationship(
        "BattleVote",
        back_populates="battle",
        cascade="all, delete-orphan"
    )
    challenge = relationship(
        "BattleChallenge",
        back_populates="battle",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Battle {self.id}: {self.title[:30]} [{self.status}]>"

    @property
    def is_deleted(self) -> bool:
        """Check if battle is soft deleted"""
        return self.deleted_at is not None

    @property
    def is_joinable(self) -> bool:
        """Check if battle can be joined (pending and not expired)"""
        return self.status == BattleStatus.PENDING and not self.is_deleted

    @property
    def is_submittable(self) -> bool:
        """Check if entries can be submitted"""
        if self.status != BattleStatus.ACTIVE:
            return False
        if self.submission_deadline and datetime.utcnow() > self.submission_deadline:
            return False
        return True

    @property
    def is_votable(self) -> bool:
        """Check if battle can be voted on"""
        if self.status != BattleStatus.VOTING:
            return False
        if self.voting_deadline and datetime.utcnow() > self.voting_deadline:
            return False
        return True

    @property
    def both_entries_submitted(self) -> bool:
        """Check if both participants have submitted entries"""
        if not self.entries:
            return False
        submitted_count = sum(1 for e in self.entries if e.submitted_at is not None)
        return submitted_count >= 2

    @property
    def vote_margin(self) -> int:
        """Get the vote margin (difference between winner and loser votes)"""
        return abs(self.creator_votes - self.opponent_votes)

    @property
    def vote_margin_percentage(self) -> float:
        """Get vote margin as percentage of total votes"""
        if self.total_votes == 0:
            return 0.0
        return (self.vote_margin / self.total_votes) * 100

    @property
    def is_close_match(self) -> bool:
        """Check if the match is close (within 5% margin)"""
        return self.vote_margin_percentage <= 5.0
