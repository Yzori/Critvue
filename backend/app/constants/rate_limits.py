"""
Rate limiting constants for API endpoints.

Centralizes all rate limit values to ensure consistency
and make it easy to adjust limits across the application.
"""


class RateLimits:
    """
    Rate limit constants for various API endpoint categories.

    Format: "{count}/{period}" where period can be:
    - minute, hour, day

    Usage:
        from app.constants import RateLimits

        @limiter.limit(RateLimits.DASHBOARD_READ)
        async def my_endpoint():
            ...
    """

    # Dashboard endpoints
    DASHBOARD_READ = "100/minute"           # Standard dashboard read operations
    DASHBOARD_DESKTOP_READ = "200/minute"   # Desktop dashboard (higher limit)
    DASHBOARD_WRITE = "30/minute"           # Dashboard write operations (accept/reject)
    DASHBOARD_BATCH = "10/minute"           # Batch operations

    # Profile endpoints
    PROFILE_READ = "30/minute"              # Profile read operations
    PROFILE_UPDATE = "10/minute"            # Profile update operations
    PROFILE_SENSITIVE = "5/minute"          # Sensitive profile operations
    PROFILE_UPLOAD = "3/minute"             # Avatar/portfolio uploads

    # Browse/Discovery endpoints
    BROWSE_READ = "100/minute"              # Public browse endpoints
    BROWSE_ACTION = "20/minute"             # Browse actions (bookmark, etc.)

    # Review slots endpoints
    REVIEW_SLOTS_READ = "120/minute"        # Review slot queries
    REVIEW_SLOTS_WRITE = "20/minute"        # Review slot mutations

    # Portfolio endpoints
    PORTFOLIO_READ = "30/minute"            # Portfolio read operations
    PORTFOLIO_WRITE = "20/minute"           # Portfolio write operations
    PORTFOLIO_DELETE = "10/minute"          # Portfolio delete operations

    # Admin endpoints
    ADMIN_READ = "10/minute"                # Admin read operations
    ADMIN_WRITE = "5/minute"                # Admin write operations

    # Authentication endpoints (from config.py - these override env vars)
    # AUTH_LOGIN = Settings.RATE_LIMIT_LOGIN
    # AUTH_REFRESH = Settings.RATE_LIMIT_REFRESH
    # AUTH_RESET_VERIFY = Settings.RATE_LIMIT_RESET_VERIFY
    # AUTH_RESET_CONFIRM = Settings.RATE_LIMIT_RESET_CONFIRM

    # Dispute endpoints
    DISPUTE_READ = "20/minute"              # Dispute read operations
    DISPUTE_WRITE = "20/minute"             # Dispute write operations

    # Leaderboard endpoints
    LEADERBOARD_READ = "60/minute"          # Leaderboard queries

    # Challenge endpoints
    CHALLENGE_READ = "60/minute"            # Challenge read operations
    CHALLENGE_WRITE = "20/minute"           # Challenge write operations
    CHALLENGE_VOTE = "30/minute"            # Challenge voting
