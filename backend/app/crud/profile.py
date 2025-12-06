"""CRUD operations for user profiles"""

import json
import re
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.review_request import ReviewRequest, ReviewStatus
from app.schemas.profile import ProfileUpdate


async def get_user_profile(db: AsyncSession, user_id: int) -> Optional[User]:
    """
    Get user profile by ID

    Args:
        db: Database session
        user_id: User ID

    Returns:
        User object or None if not found
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    """
    Get user profile by username

    Args:
        db: Database session
        username: Username (case-insensitive)

    Returns:
        User object or None if not found
    """
    result = await db.execute(
        select(User).where(func.lower(User.username) == func.lower(username))
    )
    return result.scalar_one_or_none()


async def get_user_by_identifier(db: AsyncSession, identifier: str) -> Optional[User]:
    """
    Get user profile by ID or username

    This function first tries to parse the identifier as an integer (user ID),
    and if that fails, treats it as a username.

    Args:
        db: Database session
        identifier: User ID (numeric) or username (string)

    Returns:
        User object or None if not found
    """
    # Try parsing as integer ID first
    try:
        user_id = int(identifier)
        return await get_user_profile(db, user_id)
    except ValueError:
        # Not a number, treat as username
        return await get_user_by_username(db, identifier)


async def update_username(
    db: AsyncSession, user_id: int, username: Optional[str]
) -> Optional[User]:
    """
    Update user's username

    Args:
        db: Database session
        user_id: User ID
        username: New username (None to clear)

    Returns:
        Updated user object or None if not found
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return None

    user.username = username
    user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    return user


async def is_username_available(db: AsyncSession, username: str, exclude_user_id: Optional[int] = None) -> bool:
    """
    Check if a username is available

    Args:
        db: Database session
        username: Username to check
        exclude_user_id: Optional user ID to exclude (for updating own username)

    Returns:
        True if username is available, False otherwise
    """
    query = select(User).where(func.lower(User.username) == func.lower(username))
    if exclude_user_id:
        query = query.where(User.id != exclude_user_id)

    result = await db.execute(query)
    return result.scalar_one_or_none() is None


async def generate_unique_username(db: AsyncSession, email: str) -> str:
    """
    Generate a unique username from an email address.

    The username is derived from the email prefix (before @), sanitized to only
    contain lowercase letters, numbers, underscores, and hyphens.

    Args:
        db: Database session
        email: User's email address

    Returns:
        A unique username string
    """
    # Extract email prefix and sanitize
    email_prefix = email.split('@')[0].lower()
    # Replace invalid characters with underscore, keep only a-z, 0-9, _, -
    base = re.sub(r'[^a-z0-9_-]', '_', email_prefix)
    # Remove consecutive underscores
    base = re.sub(r'_+', '_', base)
    # Remove leading/trailing underscores
    base = base.strip('_')
    # Truncate to 45 chars (leaving room for counter suffix)
    base = base[:45] if base else 'user'

    # Try base username first
    if await is_username_available(db, base):
        return base

    # Append incrementing numbers until unique
    counter = 2
    while True:
        candidate = f"{base}{counter}"
        if await is_username_available(db, candidate):
            return candidate
        counter += 1
        # Safety limit to prevent infinite loops
        if counter > 10000:
            # Fallback to timestamp-based username
            import time
            return f"{base}_{int(time.time())}"


async def update_profile(
    db: AsyncSession, user_id: int, profile_data: ProfileUpdate
) -> Optional[User]:
    """
    Update user profile

    Args:
        db: Database session
        user_id: User ID
        profile_data: Profile update data

    Returns:
        Updated user object or None if not found
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return None

    # Update fields if provided
    update_data = profile_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "specialty_tags" and value is not None:
            # Convert list to JSON string for SQLite
            setattr(user, field, json.dumps(value))
        else:
            setattr(user, field, value)

    user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    return user


async def update_avatar(
    db: AsyncSession, user_id: int, avatar_url: Optional[str]
) -> Optional[User]:
    """
    Update user avatar URL

    Args:
        db: Database session
        user_id: User ID
        avatar_url: New avatar URL (None to remove avatar)

    Returns:
        Updated user object or None if not found
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return None

    user.avatar_url = avatar_url
    user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    return user


async def calculate_user_stats(db: AsyncSession, user_id: int) -> Dict[str, Any]:
    """
    Calculate user statistics from review data

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Dictionary with calculated stats
    """
    # Count reviews given (accepted review slots as reviewer)
    reviews_given_result = await db.execute(
        select(func.count(ReviewSlot.id)).where(
            and_(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
            )
        )
    )
    total_reviews_given = reviews_given_result.scalar() or 0

    # Count reviews received (accepted review slots for user's requests)
    reviews_received_result = await db.execute(
        select(func.count(ReviewSlot.id))
        .select_from(ReviewSlot)
        .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
        .where(
            and_(
                ReviewRequest.user_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
            )
        )
    )
    total_reviews_received = reviews_received_result.scalar() or 0

    # Calculate average rating (from reviews given by this user)
    avg_rating_result = await db.execute(
        select(func.avg(ReviewSlot.rating)).where(
            and_(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewSlot.rating.isnot(None),
            )
        )
    )
    avg_rating = avg_rating_result.scalar()
    if avg_rating:
        avg_rating = round(float(avg_rating), 2)

    # Calculate average response time (time from claimed to submitted)
    response_times_result = await db.execute(
        select(
            func.avg(
                func.julianday(ReviewSlot.submitted_at)
                - func.julianday(ReviewSlot.claimed_at)
            )
            * 24  # Convert days to hours
        ).where(
            and_(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status.in_(
                    [
                        ReviewSlotStatus.SUBMITTED.value,
                        ReviewSlotStatus.ACCEPTED.value,
                    ]
                ),
                ReviewSlot.claimed_at.isnot(None),
                ReviewSlot.submitted_at.isnot(None),
            )
        )
    )
    avg_response_time = response_times_result.scalar()
    if avg_response_time:
        avg_response_time = int(round(avg_response_time))

    return {
        "total_reviews_given": total_reviews_given,
        "total_reviews_received": total_reviews_received,
        "avg_rating": avg_rating,
        "avg_response_time_hours": avg_response_time,
    }


async def update_user_stats(db: AsyncSession, user_id: int) -> Optional[User]:
    """
    Recalculate and update user statistics

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Updated user object or None if not found
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return None

    # Calculate stats
    stats = await calculate_user_stats(db, user_id)

    # Update user model
    user.total_reviews_given = stats["total_reviews_given"]
    user.total_reviews_received = stats["total_reviews_received"]
    user.avg_rating = Decimal(str(stats["avg_rating"])) if stats["avg_rating"] else None
    user.avg_response_time_hours = stats["avg_response_time_hours"]
    user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    return user


async def award_badges(db: AsyncSession, user_id: int) -> List[str]:
    """
    Calculate and award badges to a user based on their activity

    Args:
        db: Database session
        user_id: User ID

    Returns:
        List of badge names
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return []

    badges = []

    # Top Contributor: 25+ reviews given
    if user.total_reviews_given >= 25:
        badges.append("Top Contributor")

    # Fast Responder: Average response time < 24 hours
    if user.avg_response_time_hours and user.avg_response_time_hours < 24:
        badges.append("Fast Responder")

    # Expert Reviewer: 4.5+ average rating with 10+ reviews
    if (
        user.avg_rating
        and float(user.avg_rating) >= 4.5
        and user.total_reviews_given >= 10
    ):
        badges.append("Expert Reviewer")

    # Rising Star: 5+ reviews given and member for less than 30 days
    if user.total_reviews_given >= 5:
        days_since_joining = (datetime.utcnow() - user.created_at).days
        if days_since_joining < 30:
            badges.append("Rising Star")

    # Verified Pro: Verified user with 10+ reviews
    if user.is_verified and user.total_reviews_given >= 10:
        badges.append("Verified Pro")

    # Early Adopter: Joined before a certain date (placeholder)
    # if user.created_at < datetime(2024, 2, 1):
    #     badges.append("Early Adopter")

    # Update user badges
    user.badges = json.dumps(badges)
    user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    return badges


def parse_user_specialty_tags(user: User) -> List[str]:
    """
    Parse specialty tags from JSON string

    Args:
        user: User object

    Returns:
        List of specialty tags
    """
    if not user.specialty_tags:
        return []

    try:
        tags = json.loads(user.specialty_tags)
        return tags if isinstance(tags, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def parse_user_badges(user: User) -> List[str]:
    """
    Parse badges from JSON string

    Args:
        user: User object

    Returns:
        List of badge names
    """
    if not user.badges:
        return []

    try:
        badges = json.loads(user.badges)
        return badges if isinstance(badges, list) else []
    except (json.JSONDecodeError, TypeError):
        return []
