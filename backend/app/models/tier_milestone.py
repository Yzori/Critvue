"""Tier Milestone database model for tracking tier progression history"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.user import Base, UserTier

if TYPE_CHECKING:
    from app.models.user import User


class TierMilestone(Base):
    """
    Records tier promotions for historical tracking and analytics.

    This allows users to see their progression timeline and provides
    data for analytics on how users advance through the tier system.
    """

    __tablename__ = "tier_milestones"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Tier progression
    from_tier = Column(Enum(UserTier), nullable=True)  # NULL for initial tier assignment
    to_tier = Column(Enum(UserTier), nullable=False)

    # Context
    reason = Column(Text, nullable=True)  # e.g., "Reached 15,000 karma" or "Expert application approved"
    karma_at_promotion = Column(Integer, nullable=False)  # Karma balance when promoted

    # Timestamp
    achieved_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="tier_milestones")

    def __repr__(self) -> str:
        from_str = self.from_tier.value if self.from_tier else "none"
        return f"<TierMilestone {self.id}: {self.user_id} {from_str} -> {self.to_tier.value}>"
