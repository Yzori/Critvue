"""Public Browse API endpoints for marketplace discovery"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.session import get_db
from app.schemas.browse import (
    BrowseReviewsResponse,
    SortOption,
    DeadlineFilter
)
from app.crud.browse import browse_crud
from app.models.review_request import ContentType, ReviewType
from app.core.logging_config import security_logger

router = APIRouter(prefix="/reviews", tags=["Browse"])

# Initialize rate limiter for public endpoints
limiter = Limiter(key_func=get_remote_address)


@router.get(
    "/browse",
    response_model=BrowseReviewsResponse,
    summary="Browse public review requests marketplace"
)
@limiter.limit("100/minute")  # Rate limit for public endpoint
async def browse_reviews(
    request: Request,
    content_type: Optional[ContentType] = Query(
        None,
        description="Filter by content type (design, code, video, audio, writing, art)"
    ),
    review_type: Optional[ReviewType] = Query(
        None,
        description="Filter by review type (free, expert)"
    ),
    sort_by: SortOption = Query(
        SortOption.RECENT,
        description="Sort option: recent, price_high, price_low, deadline"
    ),
    deadline: Optional[DeadlineFilter] = Query(
        None,
        description="Filter by deadline urgency: urgent, this_week, this_month, flexible"
    ),
    limit: int = Query(
        50,
        ge=1,
        le=100,
        description="Number of results per page (max 100)"
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Pagination offset"
    ),
    db: AsyncSession = Depends(get_db)
) -> BrowseReviewsResponse:
    """
    Browse public review requests marketplace without authentication.

    This endpoint allows anyone to discover open review requests available for claiming.
    Users can filter by content type, review type, deadline, and sort by various criteria.

    **Features:**
    - Public access (no authentication required)
    - Only shows open/pending reviews
    - Includes creator info (name, avatar) but NO sensitive data
    - Pagination support with limit and offset
    - Flexible filtering and sorting options
    - Rate limited to prevent abuse

    **Query Parameters:**
    - `content_type`: Filter by content category
    - `review_type`: Filter by free or expert reviews
    - `sort_by`: Sort by recent, price_high, price_low, or deadline
    - `deadline`: Filter by urgency (urgent <24h, this_week <7d, etc.)
    - `limit`: Results per page (default 50, max 100)
    - `offset`: Pagination offset (default 0)

    **Response:**
    Returns a list of review requests with:
    - Basic review info (title, description, type)
    - Creator info (id, name, avatar) - NO sensitive data
    - Preview image/thumbnail if available
    - Price for expert reviews
    - Deadline and urgency indicator
    - Skills needed (from feedback_areas)

    **Security:**
    - Rate limited to 100 requests per minute per IP
    - No sensitive user data exposed
    - Only public-facing review information shown

    Args:
        request: FastAPI request object (for rate limiting)
        content_type: Optional content type filter
        review_type: Optional review type filter
        sort_by: Sort option (default: recent)
        deadline: Optional deadline urgency filter
        limit: Number of results (default 50, max 100)
        offset: Pagination offset (default 0)
        db: Database session

    Returns:
        BrowseReviewsResponse with reviews list and pagination metadata

    Raises:
        HTTPException: If database query fails (500)
        RateLimitExceeded: If rate limit is exceeded (429)
    """
    try:
        # Log the browse request (without user identification for public endpoint)
        security_logger.logger.info(
            f"Browse request: content_type={content_type}, review_type={review_type}, "
            f"sort_by={sort_by}, deadline={deadline}, limit={limit}, offset={offset}"
        )

        # Get reviews from CRUD layer
        reviews, total = await browse_crud.get_public_reviews(
            db=db,
            content_type=content_type,
            review_type=review_type,
            sort_by=sort_by,
            deadline=deadline,
            limit=limit,
            offset=offset
        )

        # Build response
        return BrowseReviewsResponse(
            reviews=reviews,
            total=total,
            limit=limit,
            offset=offset
        )

    except Exception as e:
        security_logger.logger.error(
            f"Failed to browse reviews: {type(e).__name__}: {str(e)}"
        )
        # Re-raise as generic error to avoid exposing internal details
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve review requests. Please try again later."
        )
