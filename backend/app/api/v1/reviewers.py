"""
Reviewer Directory API Endpoints

Provides a searchable/filterable directory of reviewers.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from pydantic import BaseModel, Field
import json

from app.db.session import get_db
from app.models.user import User, UserTier, ReviewerAvailability


router = APIRouter(prefix="/reviewers", tags=["Reviewers"])


# ==================== Schemas ====================

class ReviewerEntry(BaseModel):
    """Individual reviewer in the directory"""
    user_id: int
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    reviewer_tagline: Optional[str] = None
    user_tier: str
    specialty_tags: List[str] = []
    availability: str = "available"  # available, busy, unavailable

    # Stats
    total_reviews_given: int = 0
    accepted_reviews_count: int = 0
    acceptance_rate: Optional[float] = None
    avg_rating: Optional[float] = None
    avg_response_time_hours: Optional[int] = None
    karma_points: int = 0
    current_streak: int = 0

    class Config:
        from_attributes = True


class ReviewerDirectoryMetadata(BaseModel):
    """Metadata about the directory query"""
    total_entries: int
    limit: int
    offset: int
    tier_filter: Optional[str] = None
    specialty_filter: Optional[str] = None
    sort_by: str


class ReviewerDirectoryResponse(BaseModel):
    """Complete reviewer directory response"""
    reviewers: List[ReviewerEntry]
    metadata: ReviewerDirectoryMetadata


class SpecialtyCount(BaseModel):
    """Specialty tag with count"""
    tag: str
    count: int


class ReviewerFiltersResponse(BaseModel):
    """Available filters for the reviewer directory"""
    tiers: List[str]
    specialties: List[SpecialtyCount]
    total_reviewers: int


# ==================== Endpoints ====================

@router.get("", response_model=ReviewerDirectoryResponse)
async def get_reviewer_directory(
    response: Response,
    search: Optional[str] = Query(None, description="Search by name or username"),
    tier: Optional[str] = Query(None, description="Filter by tier (novice, contributor, skilled, trusted_advisor, expert, master)"),
    specialty: Optional[str] = Query(None, description="Filter by specialty tag"),
    min_reviews: int = Query(0, ge=0, description="Minimum reviews given to appear in directory"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum average rating"),
    sort_by: str = Query("karma", regex="^(karma|rating|reviews|response_time|acceptance_rate)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a paginated, filterable directory of reviewers.

    Only shows users who have given at least one review (or min_reviews).

    Args:
        search: Search term for name/username
        tier: Filter by user tier
        specialty: Filter by specialty tag
        min_reviews: Minimum reviews to appear (default: 1)
        min_rating: Minimum average rating filter
        sort_by: Sort field (karma, rating, reviews, response_time, acceptance_rate)
        sort_order: Sort direction (asc, desc)
        limit: Number of entries to return (max 100)
        offset: Pagination offset

    Returns:
        Paginated list of reviewers with metadata
    """
    # Add cache headers (5 minute cache)
    response.headers["Cache-Control"] = "public, max-age=300"

    # Build base query - users who have opted into the reviewer directory
    query = select(User).where(
        and_(
            User.is_active == True,
            User.is_listed_as_reviewer == True,
            User.total_reviews_given >= min_reviews
        )
    )

    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(User.full_name).like(search_term),
                func.lower(User.username).like(search_term)
            )
        )

    # Apply tier filter
    if tier:
        try:
            tier_enum = UserTier(tier.lower())
            query = query.where(User.user_tier == tier_enum)
        except ValueError:
            pass  # Invalid tier, ignore filter

    # Apply specialty filter
    if specialty:
        # specialty_tags is stored as JSON text, search within it
        query = query.where(
            func.lower(User.specialty_tags).like(f'%"{specialty.lower()}"%')
        )

    # Apply minimum rating filter
    if min_rating is not None:
        query = query.where(User.avg_rating >= min_rating)

    # Get total count before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total_entries = total_result.scalar_one()

    # Apply sorting
    sort_column_map = {
        "karma": User.karma_points,
        "rating": User.avg_rating,
        "reviews": User.total_reviews_given,
        "response_time": User.avg_response_time_hours,
        "acceptance_rate": User.acceptance_rate,
    }
    sort_column = sort_column_map.get(sort_by, User.karma_points)

    if sort_order == "desc":
        # For response_time, nulls should be last (slower is worse)
        if sort_by == "response_time":
            query = query.order_by(sort_column.asc().nulls_last(), User.id)
        else:
            query = query.order_by(sort_column.desc().nulls_last(), User.id)
    else:
        if sort_by == "response_time":
            query = query.order_by(sort_column.desc().nulls_last(), User.id)
        else:
            query = query.order_by(sort_column.asc().nulls_first(), User.id)

    # Apply pagination
    query = query.limit(limit).offset(offset)

    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()

    # Build reviewer entries
    reviewers = []
    for user in users:
        # Parse specialty tags from JSON
        specialty_tags = []
        if user.specialty_tags:
            try:
                specialty_tags = json.loads(user.specialty_tags)
                if not isinstance(specialty_tags, list):
                    specialty_tags = []
            except (json.JSONDecodeError, TypeError):
                specialty_tags = []

        entry = ReviewerEntry(
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            title=user.title,
            bio=user.bio[:200] + "..." if user.bio and len(user.bio) > 200 else user.bio,
            reviewer_tagline=user.reviewer_tagline,
            user_tier=user.user_tier.value,
            specialty_tags=specialty_tags[:5],  # Limit to first 5 tags
            availability=user.reviewer_availability.value if user.reviewer_availability else "available",
            total_reviews_given=user.total_reviews_given or 0,
            accepted_reviews_count=user.accepted_reviews_count or 0,
            acceptance_rate=float(user.acceptance_rate) if user.acceptance_rate else None,
            avg_rating=float(user.avg_rating) if user.avg_rating else None,
            avg_response_time_hours=user.avg_response_time_hours,
            karma_points=user.karma_points or 0,
            current_streak=user.current_streak or 0,
        )
        reviewers.append(entry)

    # Build metadata
    metadata = ReviewerDirectoryMetadata(
        total_entries=total_entries,
        limit=limit,
        offset=offset,
        tier_filter=tier,
        specialty_filter=specialty,
        sort_by=sort_by,
    )

    return ReviewerDirectoryResponse(
        reviewers=reviewers,
        metadata=metadata,
    )


@router.get("/filters", response_model=ReviewerFiltersResponse)
async def get_reviewer_filters(
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Get available filters for the reviewer directory.

    Returns all tiers and popular specialty tags with counts.
    """
    # Add cache headers (10 minute cache)
    response.headers["Cache-Control"] = "public, max-age=600"

    # Get total reviewers count (users who have opted into directory)
    total_query = select(func.count()).where(
        and_(
            User.is_active == True,
            User.is_listed_as_reviewer == True
        )
    )
    total_result = await db.execute(total_query)
    total_reviewers = total_result.scalar_one()

    # Get all tiers
    tiers = [tier.value for tier in UserTier]

    # Get specialty tags with counts (only from listed reviewers)
    # This is a bit complex since specialty_tags is JSON stored as text
    users_query = select(User.specialty_tags).where(
        and_(
            User.is_active == True,
            User.is_listed_as_reviewer == True,
            User.specialty_tags.isnot(None)
        )
    )
    users_result = await db.execute(users_query)

    # Count specialty tags
    tag_counts: dict[str, int] = {}
    for (tags_json,) in users_result.all():
        if tags_json:
            try:
                tags = json.loads(tags_json)
                if isinstance(tags, list):
                    for tag in tags:
                        if isinstance(tag, str):
                            tag_lower = tag.lower()
                            tag_counts[tag_lower] = tag_counts.get(tag_lower, 0) + 1
            except (json.JSONDecodeError, TypeError):
                pass

    # Sort by count and take top 20
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:20]
    specialties = [SpecialtyCount(tag=tag, count=count) for tag, count in sorted_tags]

    return ReviewerFiltersResponse(
        tiers=tiers,
        specialties=specialties,
        total_reviewers=total_reviewers,
    )
