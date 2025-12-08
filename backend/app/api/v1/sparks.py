"""Sparks API endpoints for reputation system"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.sparks_service import SparksService
from app.services.badge_service import BadgeService
from app.services.leaderboard_service import LeaderboardService
from app.services.requester_rating_service import RequesterRatingService
from app.services.reviewer_rating_service import ReviewerRatingService
from app.models.leaderboard import SeasonType, LeaderboardCategory

router = APIRouter(prefix="/sparks", tags=["Sparks"])


# ============= Schemas =============

class SparksSummaryResponse(BaseModel):
    """Summary of user's sparks statistics"""
    total_sparks: int
    total_xp: int
    reputation_score: int
    user_tier: str  # Actual tier from database (not calculated from sparks)
    acceptance_rate: Optional[float]
    accepted_reviews_count: int
    current_streak: int
    longest_streak: int
    streak_shields: int
    weekly_reviews: int
    weekly_goal: int
    weekly_goal_streak: int
    last_review_date: Optional[str]
    last_active_date: Optional[str]


class SparksBreakdownResponse(BaseModel):
    """Detailed sparks breakdown"""
    total_sparks: int
    total_xp: int
    reputation_score: int
    positive_sparks_earned: int
    negative_sparks_incurred: int
    net_sparks: int
    breakdown_by_action: dict
    percentile: int
    acceptance_rate: Optional[float]
    current_streak: int
    longest_streak: int
    streak_shields: int
    weekly_progress: dict
    warning_count: int
    warnings_expire_at: Optional[str]


class BadgeResponse(BaseModel):
    """Badge information"""
    badge_code: str
    badge_name: str
    badge_description: str
    category: str
    rarity: str
    icon_url: Optional[str]
    color: Optional[str]
    earned_at: Optional[str] = None
    level: Optional[int] = None
    is_featured: Optional[bool] = None
    karma_reward: Optional[int] = None
    xp_reward: Optional[int] = None
    progress: Optional[dict] = None


class LeaderboardEntryResponse(BaseModel):
    """Leaderboard entry"""
    rank: int
    user_id: int
    username: str
    avatar_url: Optional[str]
    user_tier: str
    score: int
    reviews_count: int
    karma_earned: int
    xp_earned: int


class UserRankingResponse(BaseModel):
    """User's ranking info"""
    rank: int
    total_participants: int
    percentile: int
    score: int
    reviews_count: int
    karma_earned: int
    xp_earned: int


class RequesterRatingRequest(BaseModel):
    """Request to rate a requester"""
    clarity_rating: int = Field(..., ge=1, le=5)
    responsiveness_rating: int = Field(..., ge=1, le=5)
    fairness_rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None
    is_anonymous: bool = True


class RequesterStatsResponse(BaseModel):
    """Requester statistics"""
    avg_clarity: Optional[float]
    avg_responsiveness: Optional[float]
    avg_fairness: Optional[float]
    avg_overall: Optional[float]
    total_ratings: int
    total_reviews_requested: int
    is_responsive: bool
    is_fair: bool
    badges: List[str]


class ReviewerRatingRequest(BaseModel):
    """Request to rate a reviewer"""
    quality_rating: int = Field(..., ge=1, le=5)
    professionalism_rating: int = Field(..., ge=1, le=5)
    helpfulness_rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None
    is_anonymous: bool = True


class ReviewerStatsResponse(BaseModel):
    """Reviewer statistics from ratings"""
    avg_quality: Optional[float]
    avg_professionalism: Optional[float]
    avg_helpfulness: Optional[float]
    avg_overall: Optional[float]
    total_ratings: int
    total_reviews_completed: int
    reviews_accepted: int
    reviews_rejected: int
    is_high_quality: bool
    is_professional: bool
    badges: List[str]


class WeeklyGoalUpdateRequest(BaseModel):
    """Request to update weekly goal"""
    target: int = Field(..., ge=1, le=20, description="Weekly review target (1-20)")


# ============= Sparks Endpoints =============

@router.get("/summary", response_model=SparksSummaryResponse)
async def get_sparks_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's sparks summary."""
    sparks_service = SparksService(db)
    summary = await sparks_service.get_sparks_summary(current_user.id)
    # Add actual user tier from database (not calculated from sparks)
    summary["user_tier"] = current_user.user_tier.value
    return summary


@router.get("/breakdown", response_model=SparksBreakdownResponse)
async def get_sparks_breakdown(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed sparks breakdown for transparency."""
    sparks_service = SparksService(db)
    breakdown = await sparks_service.get_sparks_breakdown(current_user.id)
    return breakdown


@router.get("/history")
async def get_sparks_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get sparks transaction history."""
    sparks_service = SparksService(db)
    transactions = await sparks_service.get_sparks_history(
        current_user.id,
        limit=limit,
        offset=offset
    )

    return {
        "transactions": [
            {
                "id": t.id,
                "action": t.action.value,
                "points": t.points,
                "balance_after": t.balance_after,
                "reason": t.reason,
                "created_at": t.created_at.isoformat(),
            }
            for t in transactions
        ],
        "limit": limit,
        "offset": offset,
    }


@router.put("/weekly-goal")
async def update_weekly_goal(
    request: WeeklyGoalUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's weekly review goal."""
    current_user.weekly_goal_target = request.target
    await db.commit()

    return {
        "message": f"Weekly goal updated to {request.target} reviews",
        "weekly_goal_target": request.target,
    }


# ============= Badge Endpoints =============

@router.get("/badges", response_model=List[BadgeResponse])
async def get_my_badges(
    include_hidden: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get badges earned by current user."""
    badge_service = BadgeService(db)
    badges = await badge_service.get_user_badges(
        current_user.id,
        include_hidden=include_hidden
    )
    return badges


@router.get("/badges/available", response_model=List[BadgeResponse])
async def get_available_badges(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get badges user hasn't earned yet with progress."""
    badge_service = BadgeService(db)
    badges = await badge_service.get_available_badges(current_user.id)
    return badges


@router.post("/badges/{badge_id}/toggle-featured")
async def toggle_badge_featured(
    badge_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle whether a badge is featured on profile."""
    badge_service = BadgeService(db)
    success = await badge_service.toggle_badge_featured(current_user.id, badge_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Badge not found or not owned by user"
        )

    return {"message": "Badge featured status toggled"}


@router.get("/badges/user/{user_id}", response_model=List[BadgeResponse])
async def get_user_badges(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get badges for a specific user (public view)."""
    badge_service = BadgeService(db)
    badges = await badge_service.get_user_badges(user_id, include_hidden=False)
    return badges


# ============= Leaderboard Endpoints =============

@router.get("/leaderboard/{season_type}")
async def get_leaderboard(
    season_type: str,
    category: str = Query("overall"),
    skill: Optional[str] = None,
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get current season leaderboard."""
    try:
        season_type_enum = SeasonType(season_type)
        category_enum = LeaderboardCategory(category)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid season_type or category"
        )

    leaderboard_service = LeaderboardService(db)
    season = await leaderboard_service.get_active_season(season_type_enum)

    if not season:
        return {
            "season": None,
            "rankings": [],
            "message": "No active season"
        }

    rankings = await leaderboard_service.get_leaderboard(
        season.id,
        category_enum,
        limit=limit,
        skill=skill
    )

    return {
        "season": {
            "id": season.id,
            "name": season.name,
            "start_date": season.start_date.isoformat(),
            "end_date": season.end_date.isoformat(),
        },
        "rankings": rankings,
    }


@router.get("/leaderboard/{season_type}/my-rank", response_model=UserRankingResponse)
async def get_my_ranking(
    season_type: str,
    category: str = Query("overall"),
    skill: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's ranking in a leaderboard."""
    try:
        season_type_enum = SeasonType(season_type)
        category_enum = LeaderboardCategory(category)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid season_type or category"
        )

    leaderboard_service = LeaderboardService(db)
    season = await leaderboard_service.get_active_season(season_type_enum)

    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active season"
        )

    ranking = await leaderboard_service.get_user_ranking(
        current_user.id,
        season.id,
        category_enum,
        skill=skill
    )

    if not ranking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ranking found for this season"
        )

    return ranking


@router.get("/seasons")
async def get_seasons(
    season_type: Optional[str] = None,
    include_finalized: bool = Query(True),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get list of seasons."""
    season_type_enum = None
    if season_type:
        try:
            season_type_enum = SeasonType(season_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid season_type"
            )

    leaderboard_service = LeaderboardService(db)
    seasons = await leaderboard_service.get_all_seasons(
        season_type=season_type_enum,
        include_finalized=include_finalized,
        limit=limit
    )

    return {"seasons": seasons}


# ============= Requester Rating Endpoints =============

@router.post("/requester-rating/{review_slot_id}")
async def submit_requester_rating(
    review_slot_id: int,
    request: RequesterRatingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a rating for a requester after completing a review."""
    rating_service = RequesterRatingService(db)

    try:
        rating = await rating_service.submit_rating(
            review_slot_id=review_slot_id,
            reviewer_id=current_user.id,
            clarity_rating=request.clarity_rating,
            responsiveness_rating=request.responsiveness_rating,
            fairness_rating=request.fairness_rating,
            feedback_text=request.feedback_text,
            is_anonymous=request.is_anonymous
        )

        return {
            "message": "Rating submitted successfully",
            "rating_id": rating.id,
            "overall_rating": rating.overall_rating,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/requester-rating/can-rate/{review_slot_id}")
async def can_rate_requester(
    review_slot_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Check if user can rate requester for a review."""
    rating_service = RequesterRatingService(db)
    result = await rating_service.can_rate_requester(current_user.id, review_slot_id)
    return result


@router.get("/requester-stats/{user_id}", response_model=RequesterStatsResponse)
async def get_requester_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated stats for a requester (public)."""
    rating_service = RequesterRatingService(db)
    stats = await rating_service.get_requester_stats(user_id)

    if not stats:
        return RequesterStatsResponse(
            avg_clarity=None,
            avg_responsiveness=None,
            avg_fairness=None,
            avg_overall=None,
            total_ratings=0,
            total_reviews_requested=0,
            is_responsive=True,
            is_fair=True,
            badges=[]
        )

    return stats


@router.get("/requester-ratings/{user_id}")
async def get_requester_ratings(
    user_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get individual ratings for a requester."""
    rating_service = RequesterRatingService(db)

    # Include full details if viewing own ratings
    include_anonymous = current_user and current_user.id == user_id

    ratings = await rating_service.get_ratings_for_requester(
        user_id,
        limit=limit,
        include_anonymous=include_anonymous
    )

    return {"ratings": ratings}


# ============= Reviewer Rating Endpoints =============

@router.post("/reviewer-rating/{review_slot_id}")
async def submit_reviewer_rating(
    review_slot_id: int,
    request: ReviewerRatingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a rating for a reviewer after they complete a review."""
    rating_service = ReviewerRatingService(db)

    try:
        rating = await rating_service.submit_rating(
            review_slot_id=review_slot_id,
            requester_id=current_user.id,
            quality_rating=request.quality_rating,
            professionalism_rating=request.professionalism_rating,
            helpfulness_rating=request.helpfulness_rating,
            feedback_text=request.feedback_text,
            is_anonymous=request.is_anonymous
        )

        return {
            "message": "Rating submitted successfully",
            "rating_id": rating.id,
            "overall_rating": rating.overall_rating,
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/reviewer-rating/can-rate/{review_slot_id}")
async def can_rate_reviewer(
    review_slot_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Check if user can rate reviewer for a review slot."""
    rating_service = ReviewerRatingService(db)
    result = await rating_service.can_rate_reviewer(current_user.id, review_slot_id)
    return result


@router.get("/reviewer-stats/{user_id}", response_model=ReviewerStatsResponse)
async def get_reviewer_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get aggregated rating stats for a reviewer (public)."""
    rating_service = ReviewerRatingService(db)
    stats = await rating_service.get_reviewer_stats(user_id)

    if not stats:
        return ReviewerStatsResponse(
            avg_quality=None,
            avg_professionalism=None,
            avg_helpfulness=None,
            avg_overall=None,
            total_ratings=0,
            total_reviews_completed=0,
            reviews_accepted=0,
            reviews_rejected=0,
            is_high_quality=True,
            is_professional=True,
            badges=[]
        )

    return stats


@router.get("/reviewer-ratings/{user_id}")
async def get_reviewer_ratings(
    user_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get individual ratings for a reviewer."""
    rating_service = ReviewerRatingService(db)

    # Include full details if viewing own ratings
    include_anonymous = current_user and current_user.id == user_id

    ratings = await rating_service.get_ratings_for_reviewer(
        user_id,
        limit=limit,
        include_anonymous=include_anonymous
    )

    return {"ratings": ratings}
