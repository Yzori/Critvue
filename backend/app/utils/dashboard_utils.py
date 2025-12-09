"""
Dashboard utility functions.

Shared utilities for dashboard endpoints (mobile and desktop).
These functions were extracted from dashboard.py and dashboard_desktop.py
to eliminate code duplication.
"""

import hashlib
import json
from typing import Optional, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy import and_, asc, desc

from app.constants.time import (
    SECONDS_PER_MINUTE,
    SECONDS_PER_HOUR,
    SECONDS_PER_DAY,
    SECONDS_PER_3_DAYS,
    SECONDS_PER_WEEK,
    UrgencyThresholds,
)


def calculate_urgency(deadline: Optional[datetime]) -> Tuple[str, int, str]:
    """
    Calculate urgency level, seconds remaining, and human-readable countdown.

    Args:
        deadline: The deadline datetime, or None if no deadline.

    Returns:
        Tuple of (urgency_level, seconds_remaining, countdown_text)

        urgency_level: One of "CRITICAL", "HIGH", "MEDIUM", "LOW", "EXPIRED", "NONE"
        seconds_remaining: Integer seconds until deadline (0 if expired/none)
        countdown_text: Human-readable string like "2d 5h", "3h 15m", "45m"

    Examples:
        >>> calculate_urgency(datetime.utcnow() + timedelta(hours=12))
        ("CRITICAL", 43200, "12h 0m")

        >>> calculate_urgency(datetime.utcnow() + timedelta(days=5))
        ("MEDIUM", 432000, "5d 0h")

        >>> calculate_urgency(None)
        ("NONE", 0, "No deadline")
    """
    if deadline is None:
        return UrgencyThresholds.LEVEL_NONE, 0, "No deadline"

    now = datetime.utcnow()
    delta = deadline - now
    seconds = int(delta.total_seconds())

    if seconds < 0:
        return UrgencyThresholds.LEVEL_EXPIRED, 0, "Expired"

    # Calculate urgency level based on thresholds
    if seconds < UrgencyThresholds.CRITICAL:  # < 24 hours
        urgency_level = UrgencyThresholds.LEVEL_CRITICAL
    elif seconds < UrgencyThresholds.HIGH:    # < 3 days
        urgency_level = UrgencyThresholds.LEVEL_HIGH
    elif seconds < UrgencyThresholds.MEDIUM:  # < 7 days
        urgency_level = UrgencyThresholds.LEVEL_MEDIUM
    else:
        urgency_level = UrgencyThresholds.LEVEL_LOW

    # Format countdown text
    days = seconds // SECONDS_PER_DAY
    hours = (seconds % SECONDS_PER_DAY) // SECONDS_PER_HOUR
    minutes = (seconds % SECONDS_PER_HOUR) // SECONDS_PER_MINUTE

    if days > 0:
        countdown_text = f"{days}d {hours}h"
    elif hours > 0:
        countdown_text = f"{hours}h {minutes}m"
    else:
        countdown_text = f"{minutes}m"

    return urgency_level, seconds, countdown_text


def generate_etag(data: Any) -> str:
    """
    Generate ETag for response caching.

    Args:
        data: Any JSON-serializable data structure.

    Returns:
        SHA256 hash of the JSON-serialized data.

    Note:
        Uses sort_keys=True for consistent hashing regardless of dict ordering.
    """
    content = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(content.encode()).hexdigest()


def apply_sorting(query, sort_by: str, sort_order: str, model):
    """
    Apply sorting to a SQLAlchemy query based on sort_by and sort_order.

    Args:
        query: SQLAlchemy query object
        sort_by: Field name to sort by (e.g., "created_at", "updated_at", "deadline", "status", "title")
        sort_order: Sort direction ("asc" or "desc")
        model: SQLAlchemy model class with the sortable columns

    Returns:
        Modified query with ORDER BY clause applied.
    """
    order_func = asc if sort_order == "asc" else desc

    sort_mapping = {
        "created_at": model.created_at,
        "updated_at": model.updated_at,
        "deadline": getattr(model, "claim_deadline", None) or getattr(model, "deadline", None),
        "status": model.status,
        "title": getattr(model, "title", None),
    }

    sort_col = sort_mapping.get(sort_by)
    if sort_col is not None:
        return query.order_by(order_func(sort_col))

    return query


def apply_date_range_filter(
    query,
    date_range: str,
    date_column,
    custom_start: Optional[datetime] = None,
    custom_end: Optional[datetime] = None
):
    """
    Apply date range filter to a SQLAlchemy query.

    Args:
        query: SQLAlchemy query object
        date_range: One of "last_7_days", "last_30_days", "last_90_days", "custom"
        date_column: SQLAlchemy column to filter on
        custom_start: Start datetime for custom range
        custom_end: End datetime for custom range

    Returns:
        Modified query with WHERE clause for date filtering.
    """
    now = datetime.utcnow()

    if date_range == "last_7_days":
        start_date = now - timedelta(days=7)
        return query.where(date_column >= start_date)
    elif date_range == "last_30_days":
        start_date = now - timedelta(days=30)
        return query.where(date_column >= start_date)
    elif date_range == "last_90_days":
        start_date = now - timedelta(days=90)
        return query.where(date_column >= start_date)
    elif date_range == "custom" and custom_start and custom_end:
        return query.where(and_(
            date_column >= custom_start,
            date_column <= custom_end
        ))

    return query
