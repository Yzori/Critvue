"""Karma Transaction database model for tracking reputation changes"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_slot import ReviewSlot


class KarmaAction(str, enum.Enum):
    """Types of actions that award or deduct karma points"""

    # Review lifecycle actions
    REVIEW_SUBMITTED = "review_submitted"                # +5 when review is submitted
    REVIEW_ACCEPTED = "review_accepted"                  # +20/30/40 based on helpful rating
    REVIEW_AUTO_ACCEPTED = "review_auto_accepted"        # +15 for auto-accepted reviews
    REVIEW_REJECTED = "review_rejected"                  # -10 when review is rejected

    # Quality ratings from requesters
    HELPFUL_RATING_5 = "helpful_rating_5"                # Included in REVIEW_ACCEPTED
    HELPFUL_RATING_4 = "helpful_rating_4"                # Included in REVIEW_ACCEPTED

    # Dispute outcomes
    DISPUTE_WON = "dispute_won"                          # +50 when admin sides with reviewer
    DISPUTE_LOST = "dispute_lost"                        # -30 when admin sides with requester

    # Negative actions
    CLAIM_ABANDONED = "claim_abandoned"                  # -20 when claim is abandoned/timed out
    SPAM_PENALTY = "spam_penalty"                        # -100 for spam/abusive content

    # Streak bonuses
    STREAK_BONUS_5 = "streak_bonus_5"                    # +25 for 5-day streak
    STREAK_BONUS_10 = "streak_bonus_10"                  # +75 for 10-day streak
    STREAK_BONUS_25 = "streak_bonus_25"                  # +200 for 25-day streak

    # Profile completion bonuses
    PROFILE_COMPLETED = "profile_completed"              # +50 one-time bonus
    PORTFOLIO_ADDED = "portfolio_added"                  # +10 per portfolio item
    PORTFOLIO_FEATURED = "portfolio_featured"            # +25 when portfolio is featured

    # Misc bonuses
    DAILY_BONUS = "daily_bonus"                          # +5 for first review of the day
    TIER_PROMOTION = "tier_promotion"                    # Bonus points on tier promotion


class KarmaTransaction(Base):
    """
    Records all karma point changes for audit trail and analytics.

    Every karma change is logged with the action type, point delta, and context.
    This provides full transparency and allows for dispute resolution.
    """

    __tablename__ = "karma_transactions"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    related_review_slot_id = Column(
        Integer,
        ForeignKey("review_slots.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Transaction details
    action = Column(Enum(KarmaAction), nullable=False, index=True)
    points = Column(Integer, nullable=False)  # Can be negative
    balance_after = Column(Integer, nullable=False)  # Snapshot of total karma after this transaction
    reason = Column(Text, nullable=True)  # Human-readable description for user display

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="karma_transactions")
    review_slot = relationship("ReviewSlot", backref="karma_transactions")

    def __repr__(self) -> str:
        sign = "+" if self.points >= 0 else ""
        return f"<KarmaTransaction {self.id}: {self.user_id} {sign}{self.points} ({self.action})>"
