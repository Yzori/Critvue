"""Challenge database model for platform-curated creative competitions"""

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
    from app.models.challenge_entry import ChallengeEntry
    from app.models.challenge_vote import ChallengeVote
    from app.models.challenge_invitation import ChallengeInvitation
    from app.models.challenge_participant import ChallengeParticipant
    from app.models.challenge_prompt import ChallengePrompt


class ChallengeStatus(str, enum.Enum):
    """Challenge lifecycle states"""
    DRAFT = "draft"               # Admin created, not yet published
    INVITING = "inviting"         # 1v1: Invitations sent, waiting for responses
    OPEN = "open"                 # Category: Open for entries
    ACTIVE = "active"             # Submission period active
    VOTING = "voting"             # Submission closed, voting open
    COMPLETED = "completed"       # Voting closed, winners determined
    CANCELLED = "cancelled"       # Challenge cancelled
    DRAW = "draw"                 # 1v1 tie - both get partial rewards


class ChallengeType(str, enum.Enum):
    """Type of challenge"""
    ONE_ON_ONE = "one_on_one"     # 1v1 curated creator challenge
    CATEGORY = "category"          # Open category challenge


class Challenge(Base):
    """
    Challenge model for platform-curated creative competitions.

    Two types:
    1. ONE_ON_ONE: Platform invites two specific creators (blind invitations)
    2. CATEGORY: Open competition where anyone can enter

    Admin-only creation. Community votes to determine winners.
    Winners earn karma/reputation.
    """

    __tablename__ = "challenges"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Challenge metadata
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Challenge type
    challenge_type = Column(
        Enum(ChallengeType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )

    # Content type (design, code, writing, etc.)
    content_type = Column(
        Enum(ContentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )

    # Prompt (curated challenge theme)
    prompt_id = Column(
        Integer,
        ForeignKey("challenge_prompts.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Status
    status = Column(
        Enum(ChallengeStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ChallengeStatus.DRAFT,
        index=True
    )

    # Timing configuration
    submission_hours = Column(Integer, default=72, nullable=False)
    voting_hours = Column(Integer, default=48, nullable=False)

    # Deadlines (calculated when challenge becomes active)
    submission_deadline = Column(DateTime, nullable=True)
    voting_deadline = Column(DateTime, nullable=True)

    # Category-specific: number of winners
    max_winners = Column(Integer, default=1, nullable=False)

    # 1v1-specific participants (for quick access, also tracked via invitations)
    participant1_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    participant2_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    winner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # 1v1 vote tracking
    participant1_votes = Column(Integer, default=0, nullable=False)
    participant2_votes = Column(Integer, default=0, nullable=False)

    # Display/Branding
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    banner_image_url = Column(String(500), nullable=True)
    prize_description = Column(Text, nullable=True)

    # Stats
    total_votes = Column(Integer, default=0, nullable=False)
    total_entries = Column(Integer, default=0, nullable=False)

    # Karma rewards
    winner_karma_reward = Column(Integer, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)  # When submission period began
    voting_started_at = Column(DateTime, nullable=True)  # When voting phase began
    completed_at = Column(DateTime, nullable=True)  # When winners determined

    # Admin who created
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Composite indexes for optimized queries
    __table_args__ = (
        Index('idx_challenge_status_type', 'status', 'challenge_type'),
        Index('idx_challenge_status_content', 'status', 'content_type'),
    )

    # Relationships
    creator = relationship(
        "User",
        foreign_keys=[created_by],
        backref="created_challenges"
    )
    participant1 = relationship(
        "User",
        foreign_keys=[participant1_id],
        backref="challenges_as_participant1"
    )
    participant2 = relationship(
        "User",
        foreign_keys=[participant2_id],
        backref="challenges_as_participant2"
    )
    winner = relationship(
        "User",
        foreign_keys=[winner_id],
        backref="won_challenges"
    )
    prompt = relationship(
        "ChallengePrompt",
        back_populates="challenges"
    )
    entries = relationship(
        "ChallengeEntry",
        back_populates="challenge",
        cascade="all, delete-orphan"
    )
    votes = relationship(
        "ChallengeVote",
        back_populates="challenge",
        cascade="all, delete-orphan"
    )
    invitations = relationship(
        "ChallengeInvitation",
        back_populates="challenge",
        cascade="all, delete-orphan"
    )
    participants = relationship(
        "ChallengeParticipant",
        back_populates="challenge",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Challenge {self.id}: {self.title[:30]} [{self.challenge_type}][{self.status}]>"

    @property
    def is_one_on_one(self) -> bool:
        """Check if this is a 1v1 challenge"""
        return self.challenge_type == ChallengeType.ONE_ON_ONE

    @property
    def is_category(self) -> bool:
        """Check if this is a category challenge"""
        return self.challenge_type == ChallengeType.CATEGORY

    @property
    def is_joinable(self) -> bool:
        """Check if challenge can be joined (category challenges only)"""
        return (
            self.is_category and
            self.status == ChallengeStatus.OPEN and
            (self.submission_deadline is None or datetime.utcnow() < self.submission_deadline)
        )

    @property
    def is_submittable(self) -> bool:
        """Check if entries can be submitted"""
        if self.status != ChallengeStatus.ACTIVE:
            return False
        if self.submission_deadline and datetime.utcnow() > self.submission_deadline:
            return False
        return True

    @property
    def is_votable(self) -> bool:
        """Check if challenge can be voted on"""
        if self.status != ChallengeStatus.VOTING:
            return False
        if self.voting_deadline and datetime.utcnow() > self.voting_deadline:
            return False
        return True

    @property
    def vote_margin(self) -> int:
        """Get the vote margin for 1v1 challenges"""
        return abs(self.participant1_votes - self.participant2_votes)

    @property
    def vote_margin_percentage(self) -> float:
        """Get vote margin as percentage of total votes"""
        if self.total_votes == 0:
            return 0.0
        return (self.vote_margin / self.total_votes) * 100

    @property
    def is_close_match(self) -> bool:
        """Check if the match is close (within 5% margin) - for 1v1"""
        return self.vote_margin_percentage <= 5.0
