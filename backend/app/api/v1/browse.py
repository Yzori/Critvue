"""Public Browse API endpoints for marketplace discovery"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.session import get_db
from app.schemas.browse import (
    BrowseReviewsResponse,
    ClaimReviewSlotResponse,
    SortOption,
    DeadlineFilter
)
from app.crud.browse import browse_crud
from app.models.review_request import ContentType, ReviewType
from app.models.user import User
from app.core.logging_config import security_logger
from app.api.deps import get_current_active_user
from app.services.claim_service import claim_service, ClaimValidationError, ApplicationRequiredError, TierPermissionError

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
        description="Filter by content type (design, code, video, stream, audio, writing, art)"
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
    user_skills: Optional[str] = Query(
        None,
        description="Comma-separated list of user skills for personalized match scoring (e.g., 'React,TypeScript,UI Design')"
    ),
    search: Optional[str] = Query(
        None,
        description="Search term to filter reviews by title or description"
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
        # Parse user skills from comma-separated string
        skills_list = None
        if user_skills:
            skills_list = [s.strip() for s in user_skills.split(',') if s.strip()]

        # Log the browse request (without user identification for public endpoint)
        security_logger.logger.info(
            f"Browse request: content_type={content_type}, review_type={review_type}, "
            f"sort_by={sort_by}, deadline={deadline}, limit={limit}, offset={offset}, "
            f"user_skills={len(skills_list) if skills_list else 0} skills, search={search}"
        )

        # Get reviews from CRUD layer
        reviews, total = await browse_crud.get_public_reviews(
            db=db,
            content_type=content_type,
            review_type=review_type,
            sort_by=sort_by,
            deadline=deadline,
            limit=limit,
            offset=offset,
            user_skills=skills_list,
            search=search
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
        raise InternalError(message="Failed to retrieve review requests. Please try again later."
        )


@router.post(
    "/{review_id}/claim",
    response_model=ClaimReviewSlotResponse,
    summary="Claim a review slot"
)
@limiter.limit("20/minute")  # Stricter rate limit for state-changing operation
async def claim_review_slot(
    request: Request,
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> ClaimReviewSlotResponse:
    """
    Claim a review slot for a specific review request.

    This endpoint allows authenticated reviewers to claim one of the available
    review slots for a review request. Multiple reviewers can claim slots for
    the same request if reviews_requested > 1.

    **Requirements:**
    - Must be authenticated
    - Cannot claim your own review request
    - Review must have available slots (reviews_claimed < reviews_requested)
    - Review must be in PENDING or IN_REVIEW status
    - Review must not be deleted
    - Cannot claim multiple slots for the same request

    **Race Condition Protection:**
    - Uses database-level row locking (SELECT FOR UPDATE)
    - Ensures atomic claim operations
    - Prevents over-claiming when multiple reviewers claim simultaneously

    **Status Updates:**
    - If this is the first claim, status changes from PENDING to IN_REVIEW
    - If this fills all slots, status remains IN_REVIEW (changes to COMPLETED when reviews submitted)

    **Response:**
    - Returns slot_id that can be used to navigate to /reviewer/review/{slot_id}
    - Frontend should redirect user to the review writing page with this slot_id

    Args:
        request: FastAPI request object (for rate limiting)
        review_id: ID of the review request to claim
        current_user: Currently authenticated user (injected by dependency)
        db: Database session

    Returns:
        ClaimReviewSlotResponse with claim status, slot_id, and updated slot information

    Raises:
        HTTPException 401: If not authenticated
        HTTPException 403: If trying to claim own review
        HTTPException 404: If review request not found
        HTTPException 409: If no available slots or already claimed
        HTTPException 429: If rate limit exceeded
        HTTPException 500: If database operation fails
    """
    try:
        # Log the claim attempt
        security_logger.logger.info(
            f"User {current_user.id} attempting to claim review {review_id}"
        )

        # Claim the review slot using shared service
        slot = await claim_service.claim_review_by_request_id(
            db=db,
            review_id=review_id,
            reviewer_id=current_user.id
        )

        # Get updated review request for counters
        from app.models.review_request import ReviewRequest
        review = await db.get(ReviewRequest, review_id)

        # Success - log and return response
        security_logger.logger.info(
            f"User {current_user.id} successfully claimed review {review_id} (slot {slot.id}). "
            f"Slots: {review.reviews_claimed}/{review.reviews_requested}"
        )

        return ClaimReviewSlotResponse(
            success=True,
            message="Successfully claimed review slot",
            review_request_id=review.id,
            slot_id=slot.id,
            reviews_claimed=review.reviews_claimed,
            available_slots=review.available_slots,
            is_fully_claimed=review.is_fully_claimed
        )

    except ApplicationRequiredError as e:
        # For paid reviews, redirect to application workflow
        error_msg = str(e)
        security_logger.logger.info(
            f"User {current_user.id} redirected to application flow for review {review_id}: {error_msg}"
        )
        raise ForbiddenError(message={
                "code": "APPLICATION_REQUIRED",
                "message": error_msg,
                "action": "apply",
                "review_id": review_id
            }
        )

    except TierPermissionError as e:
        # User's tier doesn't allow claiming this paid review
        error_msg = str(e)
        security_logger.logger.info(
            f"User {current_user.id} tier permission denied for review {review_id}: {error_msg}"
        )
        raise ForbiddenError(message={
                "code": "TIER_PERMISSION_DENIED",
                "message": error_msg,
                "action": "upgrade"
            }
        )

    except ClaimValidationError as e:
        # Handle validation errors (own review, fully claimed, duplicate claim, etc.)
        error_msg = str(e)
        security_logger.logger.warning(
            f"Claim validation failed for user {current_user.id} on review {review_id}: {error_msg}"
        )

        # Raise appropriate custom exception based on error type
        if "cannot claim your own" in error_msg.lower():
            raise ForbiddenError(message=error_msg)
        else:
            # "already claimed" or "all review slots" or other conflict errors
            raise ConflictError(message=error_msg)

    except RuntimeError as e:
        # Handle not found errors
        error_msg = str(e)
        security_logger.logger.warning(
            f"Review {review_id} not found for claim by user {current_user.id}: {error_msg}"
        )
        raise NotFoundError(message=error_msg
        )

    except Exception as e:
        # Handle unexpected errors
        security_logger.logger.error(
            f"Failed to claim review {review_id} for user {current_user.id}: "
            f"{type(e).__name__}: {str(e)}"
        )
        raise InternalError(message="Failed to claim review slot. Please try again later."
        )


@router.post(
    "/{review_id}/unclaim",
    response_model=ClaimReviewSlotResponse,
    summary="Unclaim a review slot"
)
@limiter.limit("20/minute")
async def unclaim_review_slot(
    request: Request,
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> ClaimReviewSlotResponse:
    """
    Unclaim a previously claimed review slot.

    This endpoint allows reviewers to release a claimed review slot if they
    decide not to proceed with the review. Note: This finds and unclaims
    the user's active slot for this review request.

    **Requirements:**
    - Must be authenticated
    - Must have an active claimed slot for this review
    - Slot must be in CLAIMED status (not yet submitted)

    **Status Updates:**
    - If this was the last claimed slot, status changes from IN_REVIEW to PENDING
    - Otherwise, status remains IN_REVIEW

    Args:
        request: FastAPI request object (for rate limiting)
        review_id: ID of the review request to unclaim
        current_user: Currently authenticated user (injected by dependency)
        db: Database session

    Returns:
        ClaimReviewSlotResponse with unclaim status and updated slot information

    Raises:
        HTTPException 401: If not authenticated
        HTTPException 404: If review request or slot not found
        HTTPException 409: If no active claim found or invalid state
        HTTPException 429: If rate limit exceeded
        HTTPException 500: If database operation fails
    """
    try:
        # Log the unclaim attempt
        security_logger.logger.info(
            f"User {current_user.id} attempting to unclaim review {review_id}"
        )

        # Find the user's claimed slot for this review
        from sqlalchemy import select, and_
        from app.models.review_slot import ReviewSlot, ReviewSlotStatus

        slot_query = select(ReviewSlot).where(
            and_(
                ReviewSlot.review_request_id == review_id,
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.CLAIMED.value
            )
        )

        result = await db.execute(slot_query)
        slot = result.scalar_one_or_none()

        if not slot:
            security_logger.logger.warning(
                f"No claimed slot found for user {current_user.id} on review {review_id}"
            )
            raise NotFoundError(message="No active claim found for this review request"
            )

        # Unclaim the slot using shared service
        await claim_service.unclaim_review_slot(
            db=db,
            slot_id=slot.id,
            reviewer_id=current_user.id
        )

        # Get updated review request for counters
        from app.models.review_request import ReviewRequest
        review = await db.get(ReviewRequest, review_id)

        # Success - log and return response
        security_logger.logger.info(
            f"User {current_user.id} successfully unclaimed review {review_id} (slot {slot.id}). "
            f"Slots: {review.reviews_claimed}/{review.reviews_requested}"
        )

        return ClaimReviewSlotResponse(
            success=True,
            message="Successfully unclaimed review slot",
            review_request_id=review.id,
            slot_id=slot.id,
            reviews_claimed=review.reviews_claimed,
            available_slots=review.available_slots,
            is_fully_claimed=review.is_fully_claimed
        )

    except ClaimValidationError as e:
        # Handle validation errors
        error_msg = str(e)
        security_logger.logger.warning(
            f"Unclaim validation failed for user {current_user.id} on review {review_id}: {error_msg}"
        )

        raise ConflictError(message=error_msg
        )

    except RuntimeError as e:
        # Handle not found errors
        error_msg = str(e)
        security_logger.logger.warning(
            f"Slot not found for unclaim by user {current_user.id}: {error_msg}"
        )
        raise NotFoundError(message=error_msg
        )

    except Exception as e:
        # Handle unexpected errors
        security_logger.logger.error(
            f"Failed to unclaim review {review_id} for user {current_user.id}: "
            f"{type(e).__name__}: {str(e)}"
        )
        raise InternalError(message="Failed to unclaim review slot. Please try again later."
        )
