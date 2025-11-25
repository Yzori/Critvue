"""Badge database models for skill-based achievements"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User


class BadgeCategory(str, enum.Enum):
    """Badge categories"""
    SKILL = "skill"           # Skill mastery badges (React Expert, etc.)
    MILESTONE = "milestone"   # Achievement milestones (100 reviews, etc.)
    STREAK = "streak"         # Streak achievements (30-day streak, etc.)
    QUALITY = "quality"       # Quality badges (High acceptance rate, etc.)
    SPECIAL = "special"       # Special achievements (Top reviewer, etc.)
    SEASONAL = "seasonal"     # Seasonal/event badges


class BadgeRarity(str, enum.Enum):
    """Badge rarity levels"""
    COMMON = "common"         # Easy to earn
    UNCOMMON = "uncommon"     # Moderate effort
    RARE = "rare"             # Significant achievement
    EPIC = "epic"             # Exceptional achievement
    LEGENDARY = "legendary"   # Very rare, top performers


class Badge(Base):
    """
    Badge definitions for the achievement system.

    Badges reward specific behaviors and achievements, providing
    visible recognition and small karma bonuses.
    """

    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)

    # Badge identity
    code = Column(String(100), unique=True, nullable=False, index=True)  # e.g., "react_expert"
    name = Column(String(255), nullable=False)  # e.g., "React Expert"
    description = Column(Text, nullable=False)  # What the badge represents

    # Badge metadata
    category = Column(
        Enum(BadgeCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    rarity = Column(
        Enum(BadgeRarity, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=BadgeRarity.COMMON
    )

    # Rewards
    karma_reward = Column(Integer, default=0, nullable=False)  # One-time karma when earned
    xp_reward = Column(Integer, default=0, nullable=False)     # One-time XP when earned

    # Visual
    icon_url = Column(String(500), nullable=True)  # Badge icon
    color = Column(String(50), nullable=True)      # Display color (hex or name)

    # Requirements (stored as JSON-like text for flexibility)
    requirement_type = Column(String(100), nullable=True)  # e.g., "skill_reviews", "streak_days"
    requirement_value = Column(Integer, nullable=True)     # e.g., 10 (for 10 reviews in skill)
    requirement_skill = Column(String(100), nullable=True) # For skill badges, e.g., "React"

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Badge {self.code}: {self.name} ({self.rarity.value})>"


class UserBadge(Base):
    """
    Junction table for badges earned by users.

    Tracks when each badge was earned and provides context.
    """

    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), nullable=False, index=True)

    # Earning context
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    earning_reason = Column(Text, nullable=True)  # Context about how it was earned

    # For badges that can level up (e.g., "React Expert Level 2")
    level = Column(Integer, default=1, nullable=False)

    # Display preferences
    is_featured = Column(Boolean, default=False, nullable=False)  # Show on profile prominently
    is_hidden = Column(Boolean, default=False, nullable=False)    # User can hide badges

    # Relationships (using backref to avoid circular imports)
    user = relationship("User", backref="earned_badges")
    badge = relationship("Badge", back_populates="user_badges")

    def __repr__(self) -> str:
        return f"<UserBadge {self.user_id} earned {self.badge_id} at {self.earned_at}>"
