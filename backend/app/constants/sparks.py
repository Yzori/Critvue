"""
Sparks/Reputation system constants.

Centralizes all sparks-related configuration values
for the reputation and XP system.
"""


class SparksConfig:
    """
    Configuration constants for the Sparks reputation system.

    Usage:
        from app.constants import SparksConfig

        if days_inactive > SparksConfig.DECAY_START_DAYS:
            apply_decay()
    """

    # XP multiplier (XP = sparks * multiplier for positive actions)
    XP_MULTIPLIER = 1.0  # 1:1 ratio by default

    # Reputation decay settings
    DECAY_START_DAYS = 14       # Start decaying after N days inactive
    DECAY_RATE_PER_WEEK = 5     # Lose N reputation points per week of inactivity
    DECAY_FLOOR = 50            # Reputation can't go below this value

    # Warning system
    WARNING_EXPIRY_DAYS = 30    # Warnings expire after N days

    # Streak settings
    STREAK_SHIELD_MAX = 3       # Maximum streak shields a user can hold
    WEEKEND_GRACE_ENABLED = True  # Allow weekend grace for streaks

    # Weekly goal settings
    WEEKLY_GOAL_DEFAULT = 5     # Default weekly review goal
    WEEKLY_GOAL_MIN = 1         # Minimum weekly goal
    WEEKLY_GOAL_MAX = 20        # Maximum weekly goal


class SparksRewards:
    """
    Point values for different sparks-earning actions.

    Note: These are base values. Some actions may have modifiers
    applied based on context (e.g., rating-based multipliers).
    """

    # Core review actions
    REVIEW_SUBMITTED = 5
    REVIEW_ACCEPTED = 20        # Base value, adjusted by rating
    REVIEW_AUTO_ACCEPTED = 15
    REVIEW_REJECTED = -10

    # Rating-based rewards (replaces flat REVIEW_ACCEPTED)
    HELPFUL_RATING_5 = 40
    HELPFUL_RATING_4 = 30
    HELPFUL_RATING_3 = 20
    HELPFUL_RATING_2 = 5        # Reduced for poor ratings
    HELPFUL_RATING_1 = 0        # No reward for very poor

    # Disputes
    DISPUTE_WON = 50
    DISPUTE_LOST = -30

    # Penalties (graduated system)
    WARNING_ISSUED = 0          # Just a warning, no sparks
    CLAIM_ABANDONED = -20
    CLAIM_ABANDONED_REPEAT = -40  # Harsher for repeat offenders
    SPAM_PENALTY = -100

    # Daily streaks
    STREAK_BONUS_5 = 25
    STREAK_BONUS_10 = 75
    STREAK_BONUS_25 = 200
    STREAK_SHIELD_USED = 0
    STREAK_SHIELD_EARNED = 0

    # Weekly goals
    WEEKLY_GOAL_MET = 30
    WEEKLY_GOAL_EXCEEDED = 50
    WEEKLY_STREAK_BONUS_4 = 100
    WEEKLY_STREAK_BONUS_12 = 500

    # Badges (base value, actual varies by badge)
    BADGE_EARNED = 25

    # Profile
    PROFILE_COMPLETED = 50
    PORTFOLIO_ADDED = 10
    PORTFOLIO_FEATURED = 25

    # Misc
    DAILY_BONUS = 5
    TIER_PROMOTION = 100
    QUALITY_BONUS = 10

    # Variable rewards (set to 0, actual value determined at runtime)
    LEADERBOARD_REWARD = 0      # Variable based on rank
    SEASONAL_BONUS = 0          # Variable
    REPUTATION_DECAY = 0        # Affects reputation_score, not sparks
    REPUTATION_RESTORED = 0
