"""
Application Constants Module

Centralized constants for the Critvue backend application.
All magic numbers and hardcoded values should be defined here.
"""

from app.constants.time import (
    SECONDS_PER_MINUTE,
    SECONDS_PER_HOUR,
    SECONDS_PER_DAY,
    SECONDS_PER_3_DAYS,
    SECONDS_PER_WEEK,
    SECONDS_PER_YEAR,
    TimeConstants,
)

from app.constants.rate_limits import (
    RateLimits,
)

from app.constants.pagination import (
    PaginationDefaults,
)

from app.constants.sparks import (
    SparksConfig,
)

# New constant modules
from app.constants import challenges
from app.constants import leaderboard
from app.constants import payments
from app.constants import committee
from app.constants import review_slots

__all__ = [
    # Time constants
    "SECONDS_PER_MINUTE",
    "SECONDS_PER_HOUR",
    "SECONDS_PER_DAY",
    "SECONDS_PER_3_DAYS",
    "SECONDS_PER_WEEK",
    "SECONDS_PER_YEAR",
    "TimeConstants",
    # Rate limits
    "RateLimits",
    # Pagination
    "PaginationDefaults",
    # Sparks
    "SparksConfig",
    # New modules
    "challenges",
    "leaderboard",
    "payments",
    "committee",
    "review_slots",
]
