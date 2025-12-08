"""Growth Analytics API endpoints for portfolio growth metrics"""

from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.review_slot import ReviewSlot
from app.models.review_request import ReviewRequest
from app.models.sparks_transaction import SparksTransaction as KarmaTransaction
from app.services.sparks_service import SparksService as KarmaService
from app.services.badge_service import BadgeService

router = APIRouter(prefix="/growth", tags=["Growth Analytics"])


# ============= Schemas =============

class GrowthDataResponse(BaseModel):
    """Overall growth metrics for portfolio page"""
    total_reviews: int = Field(..., description="Total reviews received")
    improvement_score: int = Field(..., description="Improvement percentage (0-100)")
    top_category: str = Field(..., description="Most active content category")
    growth_percentile: int = Field(..., description="User's growth percentile (0-100)")
    streak_days: int = Field(..., description="Current activity streak")
    total_projects: int = Field(..., description="Total portfolio projects")


class MilestoneResponse(BaseModel):
    """Achievement milestone"""
    id: str
    title: str
    description: str
    icon: str
    earned_at: Optional[str] = None
    rarity: str  # common, uncommon, rare, epic, legendary


class ReviewerContribution(BaseModel):
    """Reviewer who contributed to growth"""
    id: int
    name: str
    avatar: Optional[str] = None
    specialty: str
    review_count: int
    impact_score: int  # 0-100


class ProjectMetrics(BaseModel):
    """Metrics for a portfolio project"""
    id: int
    title: str
    description: Optional[str]
    content_type: str
    image_url: Optional[str]
    before_image_url: Optional[str]
    project_url: Optional[str]
    views_count: int
    rating: Optional[float]
    reviews_received: int
    is_self_documented: bool
    is_verified: bool
    is_featured: bool
    created_at: str


class PortfolioGrowthResponse(BaseModel):
    """Complete portfolio growth analytics"""
    growth_data: GrowthDataResponse
    milestones: List[MilestoneResponse]
    top_reviewers: List[ReviewerContribution]
    projects: List[ProjectMetrics]


# ============= Endpoints =============

@router.get("/summary", response_model=GrowthDataResponse)
async def get_growth_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get user's growth summary metrics"""

    # Get total portfolio projects
    portfolio_result = await db.execute(
        select(func.count(Portfolio.id))
        .where(Portfolio.user_id == current_user.id)
    )
    total_projects = portfolio_result.scalar() or 0

    # Get reviews received (as requester)
    reviews_result = await db.execute(
        select(func.count(ReviewSlot.id))
        .select_from(ReviewSlot)
        .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.status == "accepted"
            )
        )
    )
    total_reviews = reviews_result.scalar() or 0

    # Calculate improvement score based on accepted reviews and ratings
    avg_rating_result = await db.execute(
        select(func.avg(ReviewSlot.rating))
        .select_from(ReviewSlot)
        .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.status == "accepted",
                ReviewSlot.rating.isnot(None)
            )
        )
    )
    avg_rating = avg_rating_result.scalar()

    # Improvement score: combination of review count and rating
    # Only calculate if user has received reviews, otherwise 0
    if total_reviews > 0 and avg_rating is not None:
        improvement_score = min(100, int((total_reviews * 5) + (float(avg_rating) * 10)))
    else:
        improvement_score = 0

    # Get top content category
    category_result = await db.execute(
        select(Portfolio.content_type, func.count(Portfolio.id).label('count'))
        .where(Portfolio.user_id == current_user.id)
        .group_by(Portfolio.content_type)
        .order_by(func.count(Portfolio.id).desc())
        .limit(1)
    )
    category_row = category_result.first()
    top_category = category_row[0] if category_row else "Design"

    # Format category name
    category_names = {
        "design": "UI Design",
        "code": "Development",
        "video": "Video Production",
        "audio": "Audio",
        "writing": "Writing",
        "art": "Art & Illustration",
        "stream": "Streaming"
    }
    top_category = category_names.get(top_category, top_category.title())

    # Calculate growth percentile based on karma
    growth_percentile = current_user.reputation_percentile or 50

    return GrowthDataResponse(
        total_reviews=total_reviews,
        improvement_score=improvement_score,
        top_category=top_category,
        growth_percentile=growth_percentile,
        streak_days=current_user.current_streak or 0,
        total_projects=total_projects
    )


@router.get("/milestones", response_model=List[MilestoneResponse])
async def get_milestones(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get user's earned and available milestones"""

    badge_service = BadgeService(db)

    # Get earned badges
    earned_badges = await badge_service.get_user_badges(current_user.id)
    earned_codes = {b.badge_code for b in earned_badges}

    # Define milestone templates
    milestone_templates = [
        {
            "id": "first_review",
            "title": "First Critique",
            "description": "Received your first expert review",
            "icon": "message",
            "rarity": "common",
            "check": lambda u: u.total_reviews_received >= 1
        },
        {
            "id": "five_reviews",
            "title": "Feedback Seeker",
            "description": "Received critiques from 5 different reviewers",
            "icon": "users",
            "rarity": "uncommon",
            "check": lambda u: u.total_reviews_received >= 5
        },
        {
            "id": "ten_reviews",
            "title": "Growth Mindset",
            "description": "Received 10 reviews on your work",
            "icon": "trending",
            "rarity": "uncommon",
            "check": lambda u: u.total_reviews_received >= 10
        },
        {
            "id": "top_50",
            "title": "Rising Star",
            "description": "Reached top 50% improvement on the platform",
            "icon": "star",
            "rarity": "rare",
            "check": lambda u: (u.reputation_percentile or 0) >= 50
        },
        {
            "id": "top_25",
            "title": "Top Performer",
            "description": "Reached top 25% improvement on the platform",
            "icon": "award",
            "rarity": "rare",
            "check": lambda u: (u.reputation_percentile or 0) >= 75
        },
        {
            "id": "streak_7",
            "title": "Weekly Warrior",
            "description": "Maintained a 7-day activity streak",
            "icon": "flame",
            "rarity": "rare",
            "check": lambda u: (u.longest_streak or 0) >= 7
        },
        {
            "id": "streak_30",
            "title": "Monthly Master",
            "description": "Maintained a 30-day activity streak",
            "icon": "flame",
            "rarity": "epic",
            "check": lambda u: (u.longest_streak or 0) >= 30
        },
        {
            "id": "top_10",
            "title": "Elite Creator",
            "description": "Reached top 10% improvement on the platform",
            "icon": "trophy",
            "rarity": "epic",
            "check": lambda u: (u.reputation_percentile or 0) >= 90
        },
        {
            "id": "master_tier",
            "title": "Master of Craft",
            "description": "Achieved Master tier through consistent excellence",
            "icon": "zap",
            "rarity": "legendary",
            "check": lambda u: u.user_tier == "master"
        },
    ]

    milestones = []
    for template in milestone_templates:
        earned = template["check"](current_user)

        # Find earned date from karma transactions if available
        earned_at = None
        if earned:
            # Use current date as approximation
            earned_at = datetime.utcnow().isoformat()

        milestones.append(MilestoneResponse(
            id=template["id"],
            title=template["title"],
            description=template["description"],
            icon=template["icon"],
            earned_at=earned_at if earned else None,
            rarity=template["rarity"]
        ))

    return milestones


@router.get("/reviewers", response_model=List[ReviewerContribution])
async def get_top_reviewers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = 10
):
    """Get reviewers who have contributed to user's growth"""

    # Get reviewers who reviewed this user's work
    result = await db.execute(
        select(
            User.id,
            User.full_name,
            User.avatar_url,
            User.specialty_tags,
            func.count(ReviewSlot.id).label('review_count'),
            func.avg(ReviewSlot.requester_helpful_rating).label('avg_helpful')
        )
        .select_from(User)
        .join(ReviewSlot, ReviewSlot.reviewer_id == User.id)
        .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.status == "accepted"
            )
        )
        .group_by(User.id)
        .order_by(func.count(ReviewSlot.id).desc())
        .limit(limit)
    )

    reviewers = []
    for row in result:
        # Calculate impact score based on review count and helpfulness
        review_count = row.review_count or 0
        avg_helpful = float(row.avg_helpful or 3)
        impact_score = min(100, int((review_count * 15) + (avg_helpful * 14)))

        # Get specialty from tags
        tags = row.specialty_tags or []
        specialty = tags[0] if tags else "General"

        reviewers.append(ReviewerContribution(
            id=row.id,
            name=row.full_name or "Anonymous",
            avatar=row.avatar_url,
            specialty=specialty,
            review_count=review_count,
            impact_score=impact_score
        ))

    return reviewers


@router.get("/projects", response_model=List[ProjectMetrics])
async def get_project_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = 20
):
    """Get portfolio projects with metrics"""

    # Get portfolio items for the user
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.user_id == current_user.id)
        .order_by(Portfolio.created_at.desc())
        .limit(limit)
    )

    portfolios = result.scalars().all()

    # Get total accepted reviews for this user (as a general metric)
    reviews_result = await db.execute(
        select(func.count(ReviewSlot.id))
        .select_from(ReviewSlot)
        .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.status == "accepted"
            )
        )
    )
    total_reviews = reviews_result.scalar() or 0

    # Distribute reviews across projects (approximate)
    reviews_per_project = total_reviews // max(len(portfolios), 1) if portfolios else 0

    projects = []
    for portfolio in portfolios:
        projects.append(ProjectMetrics(
            id=portfolio.id,
            title=portfolio.title,
            description=portfolio.description,
            content_type=portfolio.content_type,
            image_url=portfolio.image_url,
            before_image_url=portfolio.before_image_url,
            project_url=portfolio.project_url,
            views_count=portfolio.views_count or 0,
            rating=float(portfolio.rating) if portfolio.rating else None,
            reviews_received=reviews_per_project,
            is_self_documented=portfolio.review_request_id is None,
            is_verified=portfolio.review_request_id is not None,
            is_featured=portfolio.is_featured == 1,
            created_at=portfolio.created_at.isoformat()
        ))

    return projects


@router.get("/full", response_model=PortfolioGrowthResponse)
async def get_full_portfolio_growth(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get complete portfolio growth analytics in one call"""

    # Fetch all data in parallel using the other endpoints' logic
    growth_data = await get_growth_summary(db, current_user)
    milestones = await get_milestones(db, current_user)
    top_reviewers = await get_top_reviewers(db, current_user, limit=10)
    projects = await get_project_metrics(db, current_user, limit=20)

    return PortfolioGrowthResponse(
        growth_data=growth_data,
        milestones=milestones,
        top_reviewers=top_reviewers,
        projects=projects
    )
