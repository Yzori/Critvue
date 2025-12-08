"""Sparks Transaction database model for tracking reputation changes"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_slot import ReviewSlot


class SparksAction(str, enum.Enum):
    """Types of actions that award or deduct sparks points"""

    # Review lifecycle actions
    REVIEW_SUBMITTED = "review_submitted"                # +5 when review is submitted
    REVIEW_ACCEPTED = "review_accepted"                  # +20/30/40 based on helpful rating
    REVIEW_AUTO_ACCEPTED = "review_auto_accepted"        # +15 for auto-accepted reviews
    REVIEW_REJECTED = "review_rejected"                  # -10 when review is rejected

    # Quality ratings from requesters (all possible ratings)
    HELPFUL_RATING_5 = "helpful_rating_5"                # +40 karma (excellent)
    HELPFUL_RATING_4 = "helpful_rating_4"                # +30 karma (good)
    HELPFUL_RATING_3 = "helpful_rating_3"                # +20 karma (okay)
    HELPFUL_RATING_2 = "helpful_rating_2"                # +5 karma (poor - reduced)
    HELPFUL_RATING_1 = "helpful_rating_1"                # +0 karma (very poor - no reward)

    # Dispute outcomes
    DISPUTE_WON = "dispute_won"                          # +50 when admin sides with reviewer
    DISPUTE_LOST = "dispute_lost"                        # -30 when admin sides with requester

    # Negative actions (graduated penalty system)
    WARNING_ISSUED = "warning_issued"                    # 0 points, just a warning
    CLAIM_ABANDONED = "claim_abandoned"                  # -20 when claim is abandoned/timed out
    CLAIM_ABANDONED_REPEAT = "claim_abandoned_repeat"    # -40 for repeat offenders
    SPAM_PENALTY = "spam_penalty"                        # -100 for spam/abusive content

    # Streak bonuses (daily streaks)
    STREAK_BONUS_5 = "streak_bonus_5"                    # +25 for 5-day streak
    STREAK_BONUS_10 = "streak_bonus_10"                  # +75 for 10-day streak
    STREAK_BONUS_25 = "streak_bonus_25"                  # +200 for 25-day streak
    STREAK_SHIELD_USED = "streak_shield_used"            # 0 points, streak protected
    STREAK_SHIELD_EARNED = "streak_shield_earned"        # +0, but grants a shield

    # Weekly goal system (primary engagement metric)
    WEEKLY_GOAL_MET = "weekly_goal_met"                  # +30 when weekly goal achieved
    WEEKLY_GOAL_EXCEEDED = "weekly_goal_exceeded"        # +50 bonus for exceeding goal
    WEEKLY_STREAK_BONUS_4 = "weekly_streak_bonus_4"      # +100 for 4 consecutive weeks
    WEEKLY_STREAK_BONUS_12 = "weekly_streak_bonus_12"    # +500 for 12 consecutive weeks (quarterly)

    # Badge rewards
    BADGE_EARNED = "badge_earned"                        # Variable based on badge rarity

    # Profile completion bonuses
    PROFILE_COMPLETED = "profile_completed"              # +50 one-time bonus
    PORTFOLIO_ADDED = "portfolio_added"                  # +10 per portfolio item
    PORTFOLIO_FEATURED = "portfolio_featured"            # +25 when portfolio is featured

    # Misc bonuses
    DAILY_BONUS = "daily_bonus"                          # +5 for first review of the day
    TIER_PROMOTION = "tier_promotion"                    # Bonus points on tier promotion
    QUALITY_BONUS = "quality_bonus"                      # +10 bonus for exceptional quality (all 5-star reviews)

    # Reputation changes (affects reputation_score, not karma)
    REPUTATION_DECAY = "reputation_decay"                # -X reputation for inactivity
    REPUTATION_RESTORED = "reputation_restored"          # +X reputation when returning from inactivity

    # Seasonal rewards
    LEADERBOARD_REWARD = "leaderboard_reward"            # Variable based on rank
    SEASONAL_BONUS = "seasonal_bonus"                    # End-of-season bonus

    # Challenge rewards
    CHALLENGE_WIN = "challenge_win"                      # +50-100 based on vote margin
    CHALLENGE_LOSS = "challenge_loss"                    # +5 participation bonus
    CHALLENGE_DRAW = "challenge_draw"                    # +25 each
    CHALLENGE_WIN_STREAK_3 = "challenge_win_streak_3"    # +50 bonus for 3-win streak
    CHALLENGE_WIN_STREAK_5 = "challenge_win_streak_5"    # +100 bonus for 5-win streak
    CHALLENGE_VOTE_CAST = "challenge_vote_cast"          # +2 for voting in a challenge
    CHALLENGE_CATEGORY_WIN = "challenge_category_win"    # +25-75 for category challenge placement


class SparksTransaction(Base):
    """
    Records all sparks point changes for audit trail and analytics.

    Every sparks change is logged with the action type, point delta, and context.
    This provides full transparency and allows for dispute resolution.
    """

    __tablename__ = "sparks_transactions"

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
    action = Column(
        Enum(SparksAction, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    points = Column(Integer, nullable=False)  # Can be negative
    balance_after = Column(Integer, nullable=False)  # Snapshot of total sparks after this transaction
    reason = Column(Text, nullable=True)  # Human-readable description for user display

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="sparks_transactions")
    review_slot = relationship("ReviewSlot", backref="sparks_transactions")

    def __repr__(self) -> str:
        sign = "+" if self.points >= 0 else ""
        return f"<SparksTransaction {self.id}: {self.user_id} {sign}{self.points} ({self.action})>"
