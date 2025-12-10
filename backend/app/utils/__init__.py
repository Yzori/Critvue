"""
Utility modules for the Critvue application.
"""

from app.utils.dashboard_utils import (
    calculate_urgency,
    calculate_browse_urgency,
    generate_etag,
    apply_sorting,
    apply_date_range_filter,
)

from app.utils.error_handlers import (
    handle_errors,
    handle_service_errors,
    require_not_none,
    require_state,
    require_permission,
)

from app.utils.pagination import (
    PaginationParams,
    PaginatedResponse,
    get_pagination_params,
    paginate_query,
)

from app.utils.query_helpers import (
    SortParams,
    SortDirection,
    QueryBuilder,
    get_sort_params,
    apply_filters,
)

from app.utils.user_utils import (
    get_display_name,
    format_user_info,
    format_reviewer_info,
)

__all__ = [
    # Dashboard utils
    "calculate_urgency",
    "calculate_browse_urgency",
    "generate_etag",
    "apply_sorting",
    "apply_date_range_filter",
    # Error handlers
    "handle_errors",
    "handle_service_errors",
    "require_not_none",
    "require_state",
    "require_permission",
    # Pagination
    "PaginationParams",
    "PaginatedResponse",
    "get_pagination_params",
    "paginate_query",
    # Query helpers
    "SortParams",
    "SortDirection",
    "QueryBuilder",
    "get_sort_params",
    "apply_filters",
    # User utils
    "get_display_name",
    "format_user_info",
    "format_reviewer_info",
]
