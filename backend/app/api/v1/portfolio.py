"""Portfolio API endpoints"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.review_request import ReviewRequest, ReviewStatus
from app.models.portfolio import Portfolio
from app.api.deps import get_current_user
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    PortfolioListResponse,
    MAX_SELF_DOCUMENTED_ITEMS,
)
from app.crud import portfolio as portfolio_crud
from app.core.config import settings
from app.core.logging_config import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/portfolio", tags=["Portfolio"])
limiter = Limiter(key_func=get_remote_address, enabled=settings.ENABLE_RATE_LIMITING)


class PortfolioSlotsResponse(BaseModel):
    """Response for self-documented portfolio slots"""
    used: int
    max: int
    remaining: int


class FeaturedSlotsResponse(BaseModel):
    """Response for featured portfolio slots"""
    used: int
    max: int
    remaining: int


class ToggleFeaturedRequest(BaseModel):
    """Request to toggle featured status"""
    featured: bool


MAX_FEATURED_ITEMS = 3


def _portfolio_to_response(portfolio) -> PortfolioResponse:
    """Convert a Portfolio model to a PortfolioResponse"""
    return PortfolioResponse(
        id=portfolio.id,
        user_id=portfolio.user_id,
        review_request_id=portfolio.review_request_id,
        title=portfolio.title,
        description=portfolio.description,
        content_type=portfolio.content_type,
        image_url=portfolio.image_url,
        before_image_url=portfolio.before_image_url,
        project_url=portfolio.project_url,
        rating=portfolio.rating,
        views_count=portfolio.views_count,
        is_featured=portfolio.is_featured_bool,
        is_self_documented=portfolio.is_self_documented,
        is_verified=portfolio.is_verified,
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at,
    )


@router.get("/slots", response_model=PortfolioSlotsResponse)
async def get_self_documented_slots(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioSlotsResponse:
    """
    Get the number of self-documented portfolio slots used and remaining

    Returns:
        Slots information
    """
    used = await portfolio_crud.get_self_documented_count(db, current_user.id)
    return PortfolioSlotsResponse(
        used=used,
        max=MAX_SELF_DOCUMENTED_ITEMS,
        remaining=max(0, MAX_SELF_DOCUMENTED_ITEMS - used),
    )


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_portfolio_item(
    request: Request,
    portfolio_data: PortfolioCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """
    Create a new self-documented portfolio item

    Self-documented items are limited to 3 per user. Complete reviews
    to earn unlimited verified portfolio entries.

    Args:
        portfolio_data: Portfolio item data

    Returns:
        Created portfolio item

    Rate limited to 20 requests per minute
    """
    try:
        portfolio = await portfolio_crud.create_portfolio_item(
            db, current_user.id, portfolio_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    logger.info(f"Portfolio item {portfolio.id} created by user {current_user.id}")

    return _portfolio_to_response(portfolio)


# ============= Verified Portfolio from Reviews =============
# NOTE: These endpoints MUST be defined BEFORE /{portfolio_id} to avoid route conflicts

class EligibleReviewFile(BaseModel):
    """File info for eligible review"""
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_url: Optional[str]

    class Config:
        from_attributes = True


class EligibleReviewResponse(BaseModel):
    """A completed review that can be added to portfolio"""
    id: int
    title: str
    description: str
    content_type: str
    created_at: str
    completed_at: Optional[str]
    files: List[EligibleReviewFile]
    has_portfolio_item: bool


class CreateVerifiedPortfolioRequest(BaseModel):
    """Request to create a verified portfolio item from a review"""
    title: Optional[str] = Field(None, max_length=255, description="Override title (uses review title if not provided)")
    description: Optional[str] = Field(None, max_length=2000, description="Override description")
    image_url: str = Field(..., description="Main image URL for the portfolio item")
    before_image_url: Optional[str] = Field(None, description="Before image URL for comparison")
    project_url: Optional[str] = Field(None, max_length=500, description="External project URL")


@router.get("/eligible-reviews", response_model=List[EligibleReviewResponse])
async def get_eligible_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[EligibleReviewResponse]:
    """
    Get user's completed review requests eligible for portfolio

    Returns review requests that:
    - Are owned by the current user
    - Have status COMPLETED
    - May or may not already have a portfolio item

    Returns:
        List of eligible reviews with their files
    """
    # Get completed review requests for the user
    result = await db.execute(
        select(ReviewRequest)
        .options(selectinload(ReviewRequest.files))
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewRequest.status == ReviewStatus.COMPLETED,
                ReviewRequest.deleted_at.is_(None),
            )
        )
        .order_by(ReviewRequest.completed_at.desc())
    )
    reviews = result.scalars().all()

    # Get all portfolio items linked to these reviews
    review_ids = [r.id for r in reviews]
    if review_ids:
        portfolio_result = await db.execute(
            select(Portfolio.review_request_id).where(
                Portfolio.review_request_id.in_(review_ids)
            )
        )
        reviews_with_portfolio = set(portfolio_result.scalars().all())
    else:
        reviews_with_portfolio = set()

    # Build response
    eligible_reviews = []
    for review in reviews:
        files = [
            EligibleReviewFile(
                id=f.id,
                filename=f.filename,
                original_filename=f.original_filename,
                file_type=f.file_type,
                file_url=f.file_url,
            )
            for f in review.files
        ]

        eligible_reviews.append(
            EligibleReviewResponse(
                id=review.id,
                title=review.title,
                description=review.description,
                content_type=review.content_type.value if hasattr(review.content_type, 'value') else review.content_type,
                created_at=review.created_at.isoformat(),
                completed_at=review.completed_at.isoformat() if review.completed_at else None,
                files=files,
                has_portfolio_item=review.id in reviews_with_portfolio,
            )
        )

    return eligible_reviews


@router.post("/from-review/{review_request_id}", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_portfolio_from_review(
    request: Request,
    review_request_id: int,
    portfolio_data: CreateVerifiedPortfolioRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """
    Create a verified portfolio item from a completed review request

    The review request must:
    - Be owned by the current user
    - Have status COMPLETED
    - Not already have a portfolio item linked to it

    Args:
        review_request_id: ID of the completed review request
        portfolio_data: Portfolio item data

    Returns:
        Created portfolio item

    Raises:
        HTTPException: If review not found, not owned, not completed, or already has portfolio
    """
    # Get the review request
    result = await db.execute(
        select(ReviewRequest).where(
            and_(
                ReviewRequest.id == review_request_id,
                ReviewRequest.user_id == current_user.id,
                ReviewRequest.deleted_at.is_(None),
            )
        )
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review request not found or you don't have permission to access it",
        )

    if review.status != ReviewStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed reviews can be added to portfolio",
        )

    # Check if already has a portfolio item
    existing = await portfolio_crud.get_portfolio_by_review_request(db, review_request_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This review already has a portfolio item",
        )

    # Create the verified portfolio item
    content_type = review.content_type.value if hasattr(review.content_type, 'value') else review.content_type

    portfolio = await portfolio_crud.create_verified_portfolio_item(
        db=db,
        user_id=current_user.id,
        review_request_id=review_request_id,
        title=portfolio_data.title or review.title,
        description=portfolio_data.description or review.description,
        content_type=content_type,
        image_url=portfolio_data.image_url,
        before_image_url=portfolio_data.before_image_url,
        project_url=portfolio_data.project_url,
    )

    logger.info(
        f"Verified portfolio item {portfolio.id} created from review {review_request_id} by user {current_user.id}"
    )

    return _portfolio_to_response(portfolio)


# ============= End Verified Portfolio from Reviews =============


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio_item(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """
    Get a portfolio item by ID (public endpoint)

    Args:
        portfolio_id: Portfolio item ID

    Returns:
        Portfolio item

    Raises:
        HTTPException: If portfolio item not found
    """
    portfolio = await portfolio_crud.get_portfolio_item(db, portfolio_id)

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found"
        )

    # Increment view count
    await portfolio_crud.increment_portfolio_views(db, portfolio_id)

    return _portfolio_to_response(portfolio)


@router.get("/user/{user_id}", response_model=PortfolioListResponse)
async def get_user_portfolio(
    user_id: int,
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
) -> PortfolioListResponse:
    """
    Get all portfolio items for a user with pagination

    Args:
        user_id: User ID
        content_type: Optional content type filter
        page: Page number (starts at 1)
        page_size: Number of items per page (max 100)

    Returns:
        Paginated list of portfolio items
    """
    skip = (page - 1) * page_size

    items, total = await portfolio_crud.get_user_portfolio_items(
        db, user_id, content_type, skip, page_size
    )

    # Convert to response models
    portfolio_items = [_portfolio_to_response(item) for item in items]

    has_more = (skip + len(items)) < total

    return PortfolioListResponse(
        items=portfolio_items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more,
    )


@router.get("/me/items", response_model=PortfolioListResponse)
async def get_my_portfolio(
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioListResponse:
    """
    Get authenticated user's portfolio items with pagination

    Args:
        content_type: Optional content type filter
        page: Page number (starts at 1)
        page_size: Number of items per page (max 100)

    Returns:
        Paginated list of user's portfolio items
    """
    skip = (page - 1) * page_size

    items, total = await portfolio_crud.get_user_portfolio_items(
        db, current_user.id, content_type, skip, page_size
    )

    # Convert to response models
    portfolio_items = [_portfolio_to_response(item) for item in items]

    has_more = (skip + len(items)) < total

    return PortfolioListResponse(
        items=portfolio_items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more,
    )


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
@limiter.limit("30/minute")
async def update_portfolio_item(
    request: Request,
    portfolio_id: int,
    portfolio_data: PortfolioUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """
    Update a portfolio item (must be owner)

    Args:
        portfolio_id: Portfolio item ID
        portfolio_data: Fields to update

    Returns:
        Updated portfolio item

    Raises:
        HTTPException: If portfolio item not found or not owned by user

    Rate limited to 30 requests per minute
    """
    portfolio = await portfolio_crud.update_portfolio_item(
        db, portfolio_id, current_user.id, portfolio_data
    )

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found or you don't have permission to edit it",
        )

    logger.info(f"Portfolio item {portfolio_id} updated by user {current_user.id}")

    return _portfolio_to_response(portfolio)


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_portfolio_item(
    request: Request,
    portfolio_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete a portfolio item (must be owner)

    Args:
        portfolio_id: Portfolio item ID

    Raises:
        HTTPException: If portfolio item not found or not owned by user

    Rate limited to 10 requests per minute
    """
    deleted = await portfolio_crud.delete_portfolio_item(
        db, portfolio_id, current_user.id
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found or you don't have permission to delete it",
        )

    logger.info(f"Portfolio item {portfolio_id} deleted by user {current_user.id}")


@router.get("/featured/all", response_model=list[PortfolioResponse])
async def get_featured_portfolio(
    limit: int = Query(10, ge=1, le=50, description="Number of items to return"),
    db: AsyncSession = Depends(get_db),
) -> list[PortfolioResponse]:
    """
    Get featured portfolio items across all users

    Args:
        limit: Number of items to return (max 50)

    Returns:
        List of featured portfolio items
    """
    items = await portfolio_crud.get_featured_portfolio_items(db, limit)

    return [_portfolio_to_response(item) for item in items]


@router.get("/featured/slots", response_model=FeaturedSlotsResponse)
async def get_featured_slots(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FeaturedSlotsResponse:
    """
    Get the number of featured portfolio slots used and remaining

    Returns:
        Featured slots information
    """
    used = await portfolio_crud.get_user_featured_count(db, current_user.id)
    return FeaturedSlotsResponse(
        used=used,
        max=MAX_FEATURED_ITEMS,
        remaining=max(0, MAX_FEATURED_ITEMS - used),
    )


@router.get("/featured/user/{user_id}", response_model=list[PortfolioResponse])
async def get_user_featured_portfolio(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[PortfolioResponse]:
    """
    Get featured portfolio items for a specific user (public endpoint)

    Args:
        user_id: User ID

    Returns:
        List of user's featured portfolio items (max 3)
    """
    items = await portfolio_crud.get_user_featured_items(db, user_id)

    return [_portfolio_to_response(item) for item in items]


@router.post("/{portfolio_id}/feature", response_model=PortfolioResponse)
@limiter.limit("30/minute")
async def toggle_featured(
    request: Request,
    portfolio_id: int,
    toggle_request: ToggleFeaturedRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    """
    Toggle the featured status of a portfolio item

    Users can feature up to 3 portfolio items to display on their profile.

    Args:
        portfolio_id: Portfolio item ID
        toggle_request: Request body with featured status

    Returns:
        Updated portfolio item

    Raises:
        HTTPException: If portfolio item not found, not owned, or max featured reached

    Rate limited to 30 requests per minute
    """
    portfolio, error = await portfolio_crud.toggle_portfolio_featured(
        db, portfolio_id, current_user.id, toggle_request.featured, MAX_FEATURED_ITEMS
    )

    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    action = "featured" if toggle_request.featured else "unfeatured"
    logger.info(f"Portfolio item {portfolio_id} {action} by user {current_user.id}")

    return _portfolio_to_response(portfolio)
