"""
Pagination constants for API endpoints.

Centralizes default and maximum page sizes for consistent
pagination behavior across the application.
"""


class PaginationDefaults:
    """
    Pagination constants for different endpoint types.

    Usage:
        from app.constants import PaginationDefaults

        page_size: int = Query(
            PaginationDefaults.MOBILE_PAGE_SIZE,
            ge=1,
            le=PaginationDefaults.MOBILE_MAX_PAGE_SIZE
        )
    """

    # Mobile endpoints (smaller payloads)
    MOBILE_PAGE_SIZE = 10
    MOBILE_MAX_PAGE_SIZE = 50

    # Desktop endpoints (larger payloads)
    DESKTOP_PAGE_SIZE = 20
    DESKTOP_MAX_PAGE_SIZE = 100

    # Admin endpoints
    ADMIN_PAGE_SIZE = 25
    ADMIN_MAX_PAGE_SIZE = 100

    # Browse/Discovery endpoints
    BROWSE_PAGE_SIZE = 20
    BROWSE_MAX_PAGE_SIZE = 50

    # Leaderboard endpoints
    LEADERBOARD_PAGE_SIZE = 25
    LEADERBOARD_MAX_PAGE_SIZE = 100

    # Activity/Timeline endpoints
    ACTIVITY_PAGE_SIZE = 15
    ACTIVITY_MAX_PAGE_SIZE = 50

    # Search results
    SEARCH_PAGE_SIZE = 20
    SEARCH_MAX_PAGE_SIZE = 100

    # Portfolio items
    PORTFOLIO_PAGE_SIZE = 12
    PORTFOLIO_MAX_PAGE_SIZE = 48

    # Notifications
    NOTIFICATION_PAGE_SIZE = 20
    NOTIFICATION_MAX_PAGE_SIZE = 50

    # Reviews
    REVIEW_PAGE_SIZE = 10
    REVIEW_MAX_PAGE_SIZE = 50
