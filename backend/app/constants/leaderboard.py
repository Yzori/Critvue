"""
Leaderboard-related constants.

Configuration for seasonal competitions, rankings, and rewards.
"""

from typing import Dict, Any, Optional


# =============================================================================
# Leaderboard Rewards by Rank
# =============================================================================

REWARDS: Dict[Any, Dict[str, Any]] = {
    # Top 3 positions with individual rewards
    1: {
        "karma": 500,
        "xp": 500,
        "title": "Champion",
        "badge_id": "season_champion",
    },
    2: {
        "karma": 300,
        "xp": 300,
        "title": "Runner-up",
        "badge_id": "season_runner_up",
    },
    3: {
        "karma": 200,
        "xp": 200,
        "title": "Third Place",
        "badge_id": "season_third",
    },
    # Top 10 (positions 4-10) get smaller rewards
    10: {
        "karma": 100,
        "xp": 100,
        "title": "Top 10",
        "badge_id": "season_top_10",
    },
    # Percentile-based rewards
    "percentile_10": {
        "karma": 50,
        "xp": 50,
        "title": "Top 10%",
        "badge_id": "season_top_10_percent",
    },
    "percentile_25": {
        "karma": 25,
        "xp": 25,
        "title": "Top 25%",
        "badge_id": None,
    },
}


# =============================================================================
# Season Settings
# =============================================================================

# Season duration defaults (days)
WEEKLY_SEASON_DAYS = 7
MONTHLY_SEASON_DAYS = 30
QUARTERLY_SEASON_DAYS = 90

# Minimum participation requirements
MIN_REVIEWS_FOR_RANKING = 5            # Min reviews to appear on leaderboard
MIN_SCORE_FOR_REWARDS = 100            # Min score to qualify for rewards


# =============================================================================
# Leaderboard Display Settings
# =============================================================================

DEFAULT_PAGE_SIZE = 50                 # Default entries per page
MAX_PAGE_SIZE = 100                    # Maximum entries per page
HIGHLIGHT_TOP_N = 3                    # Number of top positions to highlight


# =============================================================================
# Score Multipliers
# =============================================================================

QUALITY_SCORE_MULTIPLIER = 1.5         # Bonus for high-quality reviews
STREAK_BONUS_MULTIPLIER = 0.1          # Per-day streak bonus (10% per day)
MAX_STREAK_BONUS = 2.0                 # Maximum streak multiplier (200%)


# =============================================================================
# Helper Functions
# =============================================================================

def get_reward_for_rank(rank: int, total_participants: int) -> Optional[Dict[str, Any]]:
    """
    Get the reward configuration for a given rank.

    Args:
        rank: The user's position (1-indexed)
        total_participants: Total participants in the season

    Returns:
        Reward configuration dict or None if no reward
    """
    # Exact rank rewards (1st, 2nd, 3rd)
    if rank in REWARDS:
        return REWARDS[rank]

    # Top 10 (positions 4-10)
    if rank <= 10:
        return REWARDS[10]

    # Percentile-based rewards
    if total_participants > 0:
        percentile = (rank / total_participants) * 100

        if percentile <= 10:
            return REWARDS["percentile_10"]
        if percentile <= 25:
            return REWARDS["percentile_25"]

    return None


def calculate_season_score(
    reviews_completed: int,
    avg_rating: float,
    streak_days: int
) -> int:
    """
    Calculate a user's season score.

    Args:
        reviews_completed: Number of reviews completed this season
        avg_rating: Average rating received (0-5)
        streak_days: Current activity streak in days

    Returns:
        Calculated season score
    """
    base_score = reviews_completed * 10

    # Quality multiplier based on rating
    quality_multiplier = 1.0 + (avg_rating / 5.0) * (QUALITY_SCORE_MULTIPLIER - 1.0)

    # Streak multiplier
    streak_multiplier = min(
        1.0 + (streak_days * STREAK_BONUS_MULTIPLIER),
        MAX_STREAK_BONUS
    )

    return int(base_score * quality_multiplier * streak_multiplier)
