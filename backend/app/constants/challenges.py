"""
Challenge-related constants.

Centralized configuration for creative challenges including
karma rewards, timing defaults, and scoring thresholds.
"""

from typing import Dict, Any


# =============================================================================
# Karma Rewards for Challenge Outcomes
# =============================================================================

KARMA_VALUES: Dict[str, int] = {
    # 1v1 challenges
    "win_base": 50,                    # Base karma for winning a 1v1
    "win_margin_bonus_max": 50,        # Max bonus karma based on victory margin
    "loss_participation": 5,           # Karma for losing but participating
    "draw": 25,                        # Karma for a draw

    # Category challenges
    "category_1st": 100,               # First place in category challenge
    "category_2nd": 50,                # Second place
    "category_3rd": 25,                # Third place
    "category_participation": 5,       # Participation in category challenge

    # General rewards
    "vote_cast": 2,                    # Karma for casting a vote
    "win_streak_3": 50,                # Bonus for 3-win streak
    "win_streak_5": 100,               # Bonus for 5-win streak
}


# =============================================================================
# Timing Defaults (hours)
# =============================================================================

DEFAULT_SUBMISSION_HOURS = 72          # Hours to submit challenge entry
DEFAULT_VOTING_HOURS = 48              # Hours for voting period
INVITATION_EXPIRY_HOURS = 48           # Hours until invitation expires


# =============================================================================
# Scoring Thresholds
# =============================================================================

DRAW_THRESHOLD_PERCENT = 5.0           # Vote difference under this % is a draw


# =============================================================================
# Challenge Limits
# =============================================================================

MAX_ENTRIES_PER_CATEGORY = 100         # Max entries in category challenge
MIN_VOTES_FOR_RESULT = 5               # Minimum votes needed to declare winner
MAX_ACTIVE_CHALLENGES_PER_USER = 3     # Max concurrent challenges per user


# =============================================================================
# Category Challenge Settings
# =============================================================================

DEFAULT_WINNERS_COUNT = 3              # Default number of winners in category
MAX_WINNERS_COUNT = 10                 # Maximum winners allowed


# =============================================================================
# Helper Functions
# =============================================================================

def get_karma_reward(outcome: str) -> int:
    """
    Get the karma reward for a given challenge outcome.

    Args:
        outcome: The outcome key (e.g., "win_base", "category_1st")

    Returns:
        The karma amount, or 0 if outcome not found
    """
    return KARMA_VALUES.get(outcome, 0)


def calculate_win_bonus(vote_margin_percent: float) -> int:
    """
    Calculate bonus karma based on victory margin.

    Args:
        vote_margin_percent: The winning margin as a percentage (0-100)

    Returns:
        Bonus karma amount
    """
    if vote_margin_percent <= 0:
        return 0

    # Scale bonus linearly with margin (max at 50%+ margin)
    scale = min(vote_margin_percent / 50.0, 1.0)
    return int(KARMA_VALUES["win_margin_bonus_max"] * scale)
