"""
User utility functions for consistent user data formatting across the application.
"""

from typing import Optional, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User


def get_display_name(user: Optional["User"]) -> Optional[str]:
    """
    Extract display name from user, with fallback to email prefix.

    Args:
        user: User object or None

    Returns:
        Display name string or None if user is None
    """
    if not user:
        return None
    return user.full_name or user.email.split('@')[0]


def format_user_info(user: Optional["User"]) -> Optional[Dict[str, Any]]:
    """
    Format user object into a standardized dictionary for API responses.

    Args:
        user: User object or None

    Returns:
        Dictionary with user info or None if user is None
    """
    if not user:
        return None
    return {
        "id": user.id,
        "name": get_display_name(user),
        "avatar_url": user.avatar_url,
        "tier": user.user_tier.value if user.user_tier else None,
    }


def format_reviewer_info(reviewer: Optional["User"]) -> Optional[Dict[str, Any]]:
    """
    Format reviewer user object with additional reviewer-specific fields.

    Args:
        reviewer: User object (reviewer) or None

    Returns:
        Dictionary with reviewer info or None if reviewer is None
    """
    if not reviewer:
        return None
    return {
        "id": reviewer.id,
        "name": get_display_name(reviewer),
        "avatar_url": reviewer.avatar_url,
        "tier": reviewer.user_tier.value if reviewer.user_tier else None,
        "avg_rating": getattr(reviewer, 'avg_rating', None),
        "reviews_given": getattr(reviewer, 'reviews_given', 0),
    }
