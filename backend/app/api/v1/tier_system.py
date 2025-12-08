"""
Tier System API Endpoints

Provides endpoints for users to view their tier progress, karma history,
and tier requirements.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.api.auth import get_current_user
from app.models.user import User, UserTier
from app.models.sparks_transaction import SparksTransaction as KarmaTransaction, SparksAction as KarmaAction
from app.models.tier_milestone import TierMilestone
from app.services.sparks_service import SparksService as KarmaService
from app.services.tier_service import TierService

router = APIRouter(prefix="/tier-system", tags=["Tier System"])


# ==================== Response Models ====================

class TierRequirementsResponse(BaseModel):
    """Requirements for a specific tier"""
    tier: str
    karma_min: int
    accepted_reviews_min: int
    acceptance_rate_min: Optional[float]
    avg_helpful_rating_min: Optional[float]
    can_accept_paid: bool
    weekly_paid_limit: Optional[int]
    paid_tier_min: Optional[int]
    paid_tier_max: Optional[int]

    class Config:
        from_attributes = True


class TierProgressDetail(BaseModel):
    """Progress detail for a specific requirement"""
    required: Optional[float]
    current: float
    met: bool


class TierProgressResponse(BaseModel):
    """User's progress towards next tier"""
    current_tier: str
    tier_achieved_at: Optional[str]
    karma_points: int
    can_accept_paid: bool
    weekly_paid_limit: Optional[int]
    next_tier: Optional[str]
    meets_requirements: Optional[bool]
    at_max_tier: bool
    progress: Optional[dict]  # Details of each requirement


class KarmaTransactionResponse(BaseModel):
    """Karma transaction history item"""
    id: int
    action: str
    points: int
    balance_after: int
    reason: Optional[str]
    related_review_slot_id: Optional[int]
    created_at: str

    class Config:
        from_attributes = True


class KarmaHistoryResponse(BaseModel):
    """Paginated karma transaction history"""
    transactions: List[KarmaTransactionResponse]
    total_karma: int
    acceptance_rate: Optional[float]
    accepted_reviews_count: int
    current_streak: int
    longest_streak: int


class TierMilestoneResponse(BaseModel):
    """Tier milestone achievement"""
    id: int
    from_tier: Optional[str]
    to_tier: str
    reason: Optional[str]
    karma_at_promotion: int
    achieved_at: str

    class Config:
        from_attributes = True


class AllTiersResponse(BaseModel):
    """All tier information"""
    tiers: List[TierRequirementsResponse]
    tier_order: List[str]


class KarmaSummaryResponse(BaseModel):
    """Summary of karma statistics"""
    total_karma: int
    acceptance_rate: Optional[float]
    accepted_reviews_count: int
    current_streak: int
    longest_streak: int
    last_review_date: Optional[str]
    transactions_by_action: dict


# ==================== Endpoints ====================

@router.get("/me/tier", response_model=TierProgressResponse)
async def get_my_tier_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's tier information and progress towards next tier.

    Returns:
    - Current tier and achievements
    - Progress towards next tier
    - Requirements breakdown showing what's needed
    """
    tier_service = TierService(db)
    progress = await tier_service.get_tier_progress(current_user.id)

    return TierProgressResponse(**progress)


@router.get("/me/karma/history", response_model=KarmaHistoryResponse)
async def get_my_karma_history(
    limit: int = Query(50, ge=1, le=100, description="Number of transactions to return"),
    offset: int = Query(0, ge=0, description="Number of transactions to skip"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's karma transaction history.

    Includes all karma awards and deductions with reasons.
    Results are paginated and ordered by most recent first.
    """
    karma_service = KarmaService(db)

    # Get transactions
    transactions = await karma_service.get_karma_history(
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )

    # Convert to response models
    transaction_responses = [
        KarmaTransactionResponse(
            id=t.id,
            action=t.action.value,
            points=t.points,
            balance_after=t.balance_after,
            reason=t.reason,
            related_review_slot_id=t.related_review_slot_id,
            created_at=t.created_at.isoformat()
        )
        for t in transactions
    ]

    return KarmaHistoryResponse(
        transactions=transaction_responses,
        total_karma=current_user.sparks_points or 0,
        acceptance_rate=float(current_user.acceptance_rate) if current_user.acceptance_rate else None,
        accepted_reviews_count=current_user.accepted_reviews_count,
        current_streak=current_user.current_streak,
        longest_streak=current_user.longest_streak
    )


@router.get("/me/karma/summary", response_model=KarmaSummaryResponse)
async def get_my_karma_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get summary statistics of user's karma.

    Includes:
    - Total karma points
    - Acceptance rate
    - Streak information
    - Breakdown by action type
    """
    karma_service = KarmaService(db)
    summary = await karma_service.get_karma_summary(current_user.id)

    return KarmaSummaryResponse(**summary)


@router.get("/me/milestones", response_model=List[TierMilestoneResponse])
async def get_my_tier_milestones(
    limit: int = Query(10, ge=1, le=50, description="Number of milestones to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's tier progression history.

    Shows all tier promotions with reasons and karma at time of achievement.
    """
    tier_service = TierService(db)
    milestones = await tier_service.get_tier_milestones(
        user_id=current_user.id,
        limit=limit
    )

    return [
        TierMilestoneResponse(
            id=m.id,
            from_tier=m.from_tier.value if m.from_tier else None,
            to_tier=m.to_tier.value,
            reason=m.reason,
            karma_at_promotion=m.karma_at_promotion,
            achieved_at=m.achieved_at.isoformat()
        )
        for m in milestones
    ]


@router.get("/tiers", response_model=AllTiersResponse)
async def get_all_tiers(
    db: AsyncSession = Depends(get_db)
):
    """
    Get information about all tiers and their requirements.

    This is a public endpoint that shows the tier system structure
    so users can understand the progression path.
    """
    tier_service = TierService(db)

    tiers_info = []
    for tier in TierService.TIER_ORDER:
        requirements = await tier_service.get_tier_requirements(tier)
        tiers_info.append(
            TierRequirementsResponse(
                tier=tier.value,
                karma_min=requirements["karma_min"],
                accepted_reviews_min=requirements["accepted_reviews_min"],
                acceptance_rate_min=requirements["acceptance_rate_min"],
                avg_helpful_rating_min=requirements["avg_helpful_rating_min"],
                can_accept_paid=requirements["can_accept_paid"],
                weekly_paid_limit=requirements["weekly_paid_limit"],
                paid_tier_min=requirements["paid_tier_min"],
                paid_tier_max=requirements["paid_tier_max"]
            )
        )

    return AllTiersResponse(
        tiers=tiers_info,
        tier_order=[tier.value for tier in TierService.TIER_ORDER]
    )


@router.get("/tiers/{tier_name}", response_model=TierRequirementsResponse)
async def get_tier_requirements(
    tier_name: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed requirements for a specific tier.

    Args:
        tier_name: Tier name (novice, contributor, skilled, trusted_advisor, expert, master)
    """
    # Validate tier name
    try:
        tier = UserTier(tier_name.lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tier name. Must be one of: {', '.join([t.value for t in UserTier])}"
        )

    tier_service = TierService(db)
    requirements = await tier_service.get_tier_requirements(tier)

    return TierRequirementsResponse(
        tier=tier.value,
        karma_min=requirements["karma_min"],
        accepted_reviews_min=requirements["accepted_reviews_min"],
        acceptance_rate_min=requirements["acceptance_rate_min"],
        avg_helpful_rating_min=requirements["avg_helpful_rating_min"],
        can_accept_paid=requirements["can_accept_paid"],
        weekly_paid_limit=requirements["weekly_paid_limit"],
        paid_tier_min=requirements["paid_tier_min"],
        paid_tier_max=requirements["paid_tier_max"]
    )


@router.post("/me/check-promotion")
async def check_tier_promotion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually trigger a check for tier promotion.

    This is usually called automatically after karma changes,
    but can be manually triggered if needed.

    Returns whether the user was promoted.
    """
    karma_service = KarmaService(db)
    was_promoted = await karma_service.check_tier_promotion(current_user.id)

    if was_promoted:
        # Refresh user to get updated tier
        await db.refresh(current_user)
        return {
            "promoted": True,
            "new_tier": current_user.user_tier.value,
            "message": f"Congratulations! You've been promoted to {current_user.user_tier.value}!"
        }
    else:
        return {
            "promoted": False,
            "current_tier": current_user.user_tier.value,
            "message": "You don't currently meet the requirements for the next tier."
        }
