"""
Leaderboard API Endpoints

Provides rankings for users based on various metrics:
- Karma points
- Acceptance rate
- Review streaks
- Number of accepted reviews
- Helpfulness rating
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, literal_column
from sqlalchemy.sql import Select

from app.db.session import get_db
from app.core.security import decode_access_token
from app.api.deps import get_current_user
from app.models.user import User, UserTier
from app.schemas.leaderboard import (
    LeaderboardResponse,
    LeaderboardEntry,
    LeaderboardMetadata,
    CurrentUserPosition,
    UserPositionResponse,
    UserCategoryPosition
)

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


# ==================== Dependencies ====================

async def get_optional_current_user(
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get the current authenticated user if available, otherwise return None.
    This allows endpoints to be accessed by both authenticated and unauthenticated users.

    Args:
        access_token: JWT access token from httpOnly cookie (optional)
        db: Database session

    Returns:
        Current authenticated user or None if not authenticated
    """
    if not access_token:
        return None

    try:
        payload = decode_access_token(access_token)
        if payload is None:
            return None

        user_id: Optional[int] = payload.get("user_id")
        if user_id is None:
            return None

        # Fetch user from database
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user is None or not user.is_active:
            return None

        return user
    except Exception:
        # If anything goes wrong, just return None (user not authenticated)
        return None


# ==================== Helper Functions ====================

def apply_period_filter(query: Select, period: str) -> Select:
    """
    Apply time-based filtering for leaderboard periods.

    Note: Currently filters based on user.created_at as a proxy.
    In the future, this should filter based on karma_transactions.created_at
    to show true period-based rankings.

    Args:
        query: SQLAlchemy select query
        period: Time period (weekly, monthly, all_time)

    Returns:
        Modified query with period filter applied
    """
    if period == "weekly":
        cutoff = datetime.utcnow() - timedelta(days=7)
        return query.where(User.created_at >= cutoff)
    elif period == "monthly":
        cutoff = datetime.utcnow() - timedelta(days=30)
        return query.where(User.created_at >= cutoff)
    # all_time - no filter
    return query


def calculate_percentile(rank: int, total: int) -> float:
    """
    Calculate percentile ranking (0-100, where 100 is top).

    Args:
        rank: User's rank (1-indexed)
        total: Total number of users

    Returns:
        Percentile value (0-100)
    """
    if total == 0:
        return 0.0
    # Formula: (total - rank + 1) / total * 100
    # Rank 1 of 100 = 100th percentile
    # Rank 100 of 100 = 1st percentile
    return round(((total - rank + 1) / total) * 100, 2)


async def get_user_rank(
    db: AsyncSession,
    user_id: int,
    stat_column,
    period: str,
    tier: Optional[str],
    min_reviews: int = 0
) -> Optional[dict]:
    """
    Get a user's rank for a specific statistic.

    Args:
        db: Database session
        user_id: User ID to rank
        stat_column: SQLAlchemy column to rank by
        period: Time period filter
        tier: Optional tier filter
        min_reviews: Minimum accepted reviews required to qualify

    Returns:
        Dictionary with rank, total_users, and stat_value, or None if not found
    """
    # Build base query
    query = select(User).where(
        and_(
            User.is_active == True,
            User.accepted_reviews_count >= min_reviews
        )
    )

    # Apply filters
    query = apply_period_filter(query, period)
    if tier:
        try:
            tier_enum = UserTier(tier.lower())
            query = query.where(User.user_tier == tier_enum)
        except ValueError:
            pass  # Invalid tier, ignore filter

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total_users = total_result.scalar_one()

    if total_users == 0:
        return None

    # Get user's stat value
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalar_one_or_none()

    if not user:
        return None

    stat_value = getattr(user, stat_column.key)
    if stat_value is None:
        stat_value = 0

    # Count users ranked higher (with better stats)
    rank_query = select(func.count()).select_from(
        query.where(stat_column > stat_value).subquery()
    )
    rank_result = await db.execute(rank_query)
    better_count = rank_result.scalar_one()

    rank = better_count + 1

    return {
        "rank": rank,
        "total_users": total_users,
        "stat_value": float(stat_value) if stat_value is not None else 0.0
    }


async def build_leaderboard(
    db: AsyncSession,
    stat_column,
    period: str,
    tier: Optional[str],
    limit: int,
    offset: int,
    current_user_id: Optional[int] = None,
    min_reviews: int = 0
) -> LeaderboardResponse:
    """
    Build a leaderboard for a specific statistic.

    Args:
        db: Database session
        stat_column: SQLAlchemy column to rank by (e.g., User.karma_points)
        period: Time period (weekly, monthly, all_time)
        tier: Optional tier filter
        limit: Number of entries to return
        offset: Number of entries to skip
        current_user_id: Optional current user ID to include their position
        min_reviews: Minimum accepted reviews required to qualify

    Returns:
        LeaderboardResponse with entries and metadata
    """
    # Build base query
    query = select(User).where(
        and_(
            User.is_active == True,
            User.accepted_reviews_count >= min_reviews
        )
    )

    # Apply filters
    query = apply_period_filter(query, period)
    if tier:
        try:
            tier_enum = UserTier(tier.lower())
            query = query.where(User.user_tier == tier_enum)
        except ValueError:
            pass  # Invalid tier, ignore filter

    # Order by stat descending (nulls last)
    query = query.order_by(stat_column.desc().nulls_last(), User.id)

    # Get total count before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total_entries = total_result.scalar_one()

    # Apply pagination
    query = query.limit(limit).offset(offset)

    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()

    # Build leaderboard entries
    entries = []
    for idx, user in enumerate(users):
        # Calculate rank (accounting for offset)
        rank = offset + idx + 1

        # Create entry with relevant stats
        entry = LeaderboardEntry(
            user_id=user.id,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            user_tier=user.user_tier.value,
            rank=rank,
            rank_change=None,  # TODO: Implement by comparing to cached previous period rankings
            karma_points=user.karma_points if stat_column.key == "karma_points" else None,
            acceptance_rate=float(user.acceptance_rate) if stat_column.key == "acceptance_rate" and user.acceptance_rate else None,
            current_streak=user.current_streak if stat_column.key == "current_streak" else None,
            accepted_reviews_count=user.accepted_reviews_count if stat_column.key == "accepted_reviews_count" else None,
            avg_rating=float(user.avg_rating) if stat_column.key == "avg_rating" and user.avg_rating else None
        )
        entries.append(entry)

    # Get current user's position if requested and not in results
    current_user_position = None
    if current_user_id:
        # Check if user is already in results
        user_in_results = any(e.user_id == current_user_id for e in entries)

        if not user_in_results:
            rank_data = await get_user_rank(
                db=db,
                user_id=current_user_id,
                stat_column=stat_column,
                period=period,
                tier=tier,
                min_reviews=min_reviews
            )

            if rank_data:
                current_user_position = CurrentUserPosition(
                    user_id=current_user_id,
                    rank=rank_data["rank"],
                    total_users=rank_data["total_users"],
                    percentile=calculate_percentile(rank_data["rank"], rank_data["total_users"]),
                    stat_value=rank_data["stat_value"]
                )

    # Build metadata
    metadata = LeaderboardMetadata(
        total_entries=total_entries,
        limit=limit,
        offset=offset,
        period=period,
        tier_filter=tier
    )

    return LeaderboardResponse(
        entries=entries,
        metadata=metadata,
        current_user_position=current_user_position
    )


# ==================== Endpoints ====================

@router.get("/karma", response_model=LeaderboardResponse)
async def get_karma_leaderboard(
    response: Response,
    period: str = Query("all_time", regex="^(weekly|monthly|all_time)$"),
    tier: Optional[str] = Query(None, description="Filter by tier (novice, contributor, skilled, trusted_advisor, expert, master)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get leaderboard of top users by karma points.

    Args:
        period: Time period (weekly, monthly, all_time)
        tier: Optional tier filter
        limit: Number of entries to return (max 100)
        offset: Number of entries to skip for pagination

    Returns:
        Leaderboard with top users by karma points, including current user's position
    """
    # Add cache headers (5 minute cache)
    response.headers["Cache-Control"] = "public, max-age=300"

    return await build_leaderboard(
        db=db,
        stat_column=User.karma_points,
        period=period,
        tier=tier,
        limit=limit,
        offset=offset,
        current_user_id=current_user.id if current_user else None,
        min_reviews=0
    )


@router.get("/acceptance-rate", response_model=LeaderboardResponse)
async def get_acceptance_rate_leaderboard(
    response: Response,
    period: str = Query("all_time", regex="^(weekly|monthly|all_time)$"),
    tier: Optional[str] = Query(None, description="Filter by tier"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get leaderboard of top users by acceptance rate.

    Requires minimum 5 accepted reviews to qualify.

    Args:
        period: Time period (weekly, monthly, all_time)
        tier: Optional tier filter
        limit: Number of entries to return (max 100)
        offset: Number of entries to skip for pagination

    Returns:
        Leaderboard with top users by acceptance rate
    """
    # Add cache headers (5 minute cache)
    response.headers["Cache-Control"] = "public, max-age=300"

    return await build_leaderboard(
        db=db,
        stat_column=User.acceptance_rate,
        period=period,
        tier=tier,
        limit=limit,
        offset=offset,
        current_user_id=current_user.id if current_user else None,
        min_reviews=5  # Require 5 reviews to qualify
    )


@router.get("/streak", response_model=LeaderboardResponse)
async def get_streak_leaderboard(
    response: Response,
    period: str = Query("all_time", regex="^(weekly|monthly|all_time)$"),
    tier: Optional[str] = Query(None, description="Filter by tier"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get leaderboard of top users by current review streak.

    Args:
        period: Time period (weekly, monthly, all_time)
        tier: Optional tier filter
        limit: Number of entries to return (max 100)
        offset: Number of entries to skip for pagination

    Returns:
        Leaderboard with top users by current streak
    """
    # Add cache headers (5 minute cache)
    response.headers["Cache-Control"] = "public, max-age=300"

    return await build_leaderboard(
        db=db,
        stat_column=User.current_streak,
        period=period,
        tier=tier,
        limit=limit,
        offset=offset,
        current_user_id=current_user.id if current_user else None,
        min_reviews=0
    )


@router.get("/reviews", response_model=LeaderboardResponse)
async def get_reviews_leaderboard(
    response: Response,
    period: str = Query("all_time", regex="^(weekly|monthly|all_time)$"),
    tier: Optional[str] = Query(None, description="Filter by tier"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get leaderboard of top users by number of accepted reviews.

    Args:
        period: Time period (weekly, monthly, all_time)
        tier: Optional tier filter
        limit: Number of entries to return (max 100)
        offset: Number of entries to skip for pagination

    Returns:
        Leaderboard with top users by accepted review count
    """
    # Add cache headers (5 minute cache)
    response.headers["Cache-Control"] = "public, max-age=300"

    return await build_leaderboard(
        db=db,
        stat_column=User.accepted_reviews_count,
        period=period,
        tier=tier,
        limit=limit,
        offset=offset,
        current_user_id=current_user.id if current_user else None,
        min_reviews=0
    )


@router.get("/helpful", response_model=LeaderboardResponse)
async def get_helpful_leaderboard(
    response: Response,
    period: str = Query("all_time", regex="^(weekly|monthly|all_time)$"),
    tier: Optional[str] = Query(None, description="Filter by tier"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get leaderboard of top users by average helpfulness rating.

    Requires minimum 5 reviews to qualify.

    Args:
        period: Time period (weekly, monthly, all_time)
        tier: Optional tier filter
        limit: Number of entries to return (max 100)
        offset: Number of entries to skip for pagination

    Returns:
        Leaderboard with top users by average rating
    """
    # Add cache headers (5 minute cache)
    response.headers["Cache-Control"] = "public, max-age=300"

    return await build_leaderboard(
        db=db,
        stat_column=User.avg_rating,
        period=period,
        tier=tier,
        limit=limit,
        offset=offset,
        current_user_id=current_user.id if current_user else None,
        min_reviews=5  # Require 5 reviews to qualify
    )


@router.get("/me/position", response_model=UserPositionResponse)
async def get_my_position(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's ranking position across all leaderboard categories.

    Returns:
        User's rank in each category (karma, acceptance rate, streak, reviews, helpfulness)
        plus their rank within their tier and overall percentile rankings.
    """
    positions = []

    # Define all categories to check
    categories = [
        ("karma", User.karma_points, 0),
        ("acceptance_rate", User.acceptance_rate, 5),
        ("streak", User.current_streak, 0),
        ("reviews", User.accepted_reviews_count, 0),
        ("helpful", User.avg_rating, 5)
    ]

    # Get position in each category
    for category_name, stat_column, min_reviews in categories:
        rank_data = await get_user_rank(
            db=db,
            user_id=current_user.id,
            stat_column=stat_column,
            period="all_time",
            tier=None,
            min_reviews=min_reviews
        )

        if rank_data:
            positions.append(
                UserCategoryPosition(
                    category=category_name,
                    rank=rank_data["rank"],
                    total_users=rank_data["total_users"],
                    percentile=calculate_percentile(rank_data["rank"], rank_data["total_users"]),
                    stat_value=rank_data["stat_value"]
                )
            )

    # Get rank within user's tier (based on karma)
    tier_rank_data = await get_user_rank(
        db=db,
        user_id=current_user.id,
        stat_column=User.karma_points,
        period="all_time",
        tier=current_user.user_tier.value,
        min_reviews=0
    )

    tier_rank_in_tier = tier_rank_data["rank"] if tier_rank_data else 1
    tier_total_in_tier = tier_rank_data["total_users"] if tier_rank_data else 1

    return UserPositionResponse(
        user_id=current_user.id,
        user_tier=current_user.user_tier.value,
        tier_rank_in_tier=tier_rank_in_tier,
        tier_total_in_tier=tier_total_in_tier,
        positions=positions
    )
