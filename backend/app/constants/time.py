"""
Time-related constants for the Critvue application.

These constants standardize time calculations across the codebase,
replacing magic numbers like 86400, 3600, etc.
"""

# Basic time units in seconds
SECONDS_PER_MINUTE = 60
SECONDS_PER_HOUR = 3600
SECONDS_PER_DAY = 86400
SECONDS_PER_3_DAYS = 259200
SECONDS_PER_WEEK = 604800
SECONDS_PER_YEAR = 31536000


class TimeConstants:
    """
    Time constants class for cases where a namespace is preferred.

    Usage:
        from app.constants import TimeConstants

        if elapsed < TimeConstants.SECONDS_PER_DAY:
            ...
    """

    # Basic time units
    SECONDS_PER_MINUTE = SECONDS_PER_MINUTE
    SECONDS_PER_HOUR = SECONDS_PER_HOUR
    SECONDS_PER_DAY = SECONDS_PER_DAY
    SECONDS_PER_3_DAYS = SECONDS_PER_3_DAYS
    SECONDS_PER_WEEK = SECONDS_PER_WEEK
    SECONDS_PER_YEAR = SECONDS_PER_YEAR

    # Derived time values (in days)
    DAYS_PER_WEEK = 7
    DAYS_PER_MONTH = 30  # Approximate
    DAYS_PER_YEAR = 365

    # Common durations in hours
    HOURS_PER_DAY = 24
    HOURS_PER_WEEK = 168


class UrgencyThresholds:
    """
    Thresholds for calculating urgency levels based on remaining time.

    Used in dashboard endpoints for deadline urgency calculation.
    """

    # Urgency level thresholds (in seconds)
    CRITICAL = SECONDS_PER_DAY       # < 24 hours
    HIGH = SECONDS_PER_3_DAYS        # < 3 days
    MEDIUM = SECONDS_PER_WEEK        # < 7 days
    # LOW = anything above MEDIUM

    # Urgency level names
    LEVEL_CRITICAL = "CRITICAL"
    LEVEL_HIGH = "HIGH"
    LEVEL_MEDIUM = "MEDIUM"
    LEVEL_LOW = "LOW"
    LEVEL_EXPIRED = "EXPIRED"
    LEVEL_NONE = "NONE"
