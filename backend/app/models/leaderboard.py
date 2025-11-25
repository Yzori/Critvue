"""Seasonal Leaderboard database models"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User


class SeasonType(str, enum.Enum):
    """Season types for leaderboards"""
    WEEKLY = "weekly"       # Weekly competitions
    MONTHLY = "monthly"     # Monthly competitions
    QUARTERLY = "quarterly" # Quarterly seasons


class LeaderboardCategory(str, enum.Enum):
    """Leaderboard categories"""
    OVERALL = "overall"           # Overall karma/XP earned
    REVIEWS = "reviews"           # Most reviews submitted
    QUALITY = "quality"           # Highest quality ratings
    HELPFUL = "helpful"           # Most helpful reviews
    SKILL = "skill"               # Per-skill leaderboards
    NEWCOMER = "newcomer"         # New users (joined in last 30 days)


class Season(Base):
    """
    Season definitions for leaderboard competitions.

    Seasons reset periodically, giving everyone a fresh start
    and recognizing consistent performers.
    """

    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, index=True)

    # Season identity
    name = Column(String(255), nullable=False)  # e.g., "Winter 2024"
    season_type = Column(
        Enum(SeasonType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )

    # Time bounds
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=False, index=True)

    # Status
    is_active = Column(Boolean, default=False, nullable=False, index=True)
    is_finalized = Column(Boolean, default=False, nullable=False)  # Results locked in

    # Rewards info (JSON stored as text)
    rewards_description = Column(Text, nullable=True)  # Description of prizes

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    entries = relationship("LeaderboardEntry", back_populates="season", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Season {self.id}: {self.name} ({self.season_type.value})>"


class LeaderboardEntry(Base):
    """
    User entries in seasonal leaderboards.

    Tracks user performance within a specific season and category.
    """

    __tablename__ = "leaderboard_entries"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False, index=True)

    # Category
    category = Column(
        Enum(LeaderboardCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    skill = Column(String(100), nullable=True, index=True)  # For skill-specific leaderboards

    # Scores
    score = Column(Integer, default=0, nullable=False, index=True)  # Primary ranking metric
    reviews_count = Column(Integer, default=0, nullable=False)
    karma_earned = Column(Integer, default=0, nullable=False)
    xp_earned = Column(Integer, default=0, nullable=False)
    avg_rating = Column(Integer, nullable=True)  # Stored as 1-500 for precision

    # Ranking
    rank = Column(Integer, nullable=True, index=True)  # Final rank (set when season ends)
    percentile = Column(Integer, nullable=True)  # Top X% of users

    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships (using backref to avoid circular imports)
    user = relationship("User", backref="leaderboard_entries")
    season = relationship("Season", back_populates="entries")

    def __repr__(self) -> str:
        return f"<LeaderboardEntry user={self.user_id} season={self.season_id} score={self.score}>"
