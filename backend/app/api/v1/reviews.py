"""Review Request API endpoints"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Path as PathParam, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.review_request import ReviewStatus
from app.schemas.review import (
    ReviewRequestCreate,
    ReviewRequestUpdate,
    ReviewRequestResponse,
    ReviewRequestListResponse,
    ReviewRequestStats,
)
from app.crud.review import review_crud
from app.core.logging_config import security_logger
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post(
    "",
    response_model=ReviewRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new review request"
)
async def create_review_request(
    review_data: ReviewRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReviewRequestResponse:
    """
    Create a new review request.

    Args:
        review_data: Review request creation data
        current_user: Currently authenticated user
        db: Database session

    Returns:
        Created review request with relationships

    Raises:
        HTTPException: If creation fails
    """
    try:
        # NOTE: Quota check moved to update_review_request when status changes to PENDING
        # This allows users to create drafts regardless of quota, and only enforces
        # the limit when actually submitting. This also allows expert review creation.

        review = await review_crud.create_review_request(
            db=db,
            user_id=current_user.id,
            data=review_data
        )

        # NOTE: Review count is incremented when status changes to PENDING (on submission)
        # NOT when creating a draft review to avoid counting abandoned drafts

        security_logger.logger.info(
            f"Review request created: id={review.id}, user={current_user.email}, "
            f"type={review.content_type.value}"
        )

        return ReviewRequestResponse.model_validate(review)
    except HTTPException:
        # Re-raise HTTPException as-is (preserves status code like 403)
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to create review request for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create review request"
        )


@router.get(
    "",
    response_model=ReviewRequestListResponse,
    summary="List user's review requests"
)
async def list_review_requests(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return"),
    status_filter: Optional[ReviewStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReviewRequestListResponse:
    """
    Get a paginated list of the current user's review requests.

    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        status_filter: Optional status filter
        current_user: Currently authenticated user
        db: Database session

    Returns:
        Paginated list of review requests

    Raises:
        HTTPException: If retrieval fails
    """
    try:
        reviews, total = await review_crud.get_user_review_requests(
            db=db,
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            status=status_filter
        )

        return ReviewRequestListResponse(
            items=[ReviewRequestResponse.model_validate(r) for r in reviews],
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(reviews)) < total
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to list review requests for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve review requests"
        )


@router.get(
    "/stats",
    response_model=ReviewRequestStats,
    summary="Get review request statistics"
)
async def get_review_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReviewRequestStats:
    """
    Get statistics for the current user's review requests.

    Args:
        current_user: Currently authenticated user
        db: Database session

    Returns:
        Review request statistics

    Raises:
        HTTPException: If retrieval fails
    """
    try:
        stats = await review_crud.get_review_stats(
            db=db,
            user_id=current_user.id
        )
        return ReviewRequestStats(**stats)
    except Exception as e:
        security_logger.logger.error(
            f"Failed to get review stats for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get(
    "/{review_id}",
    response_model=ReviewRequestResponse,
    summary="Get a specific review request"
)
async def get_review_request(
    review_id: int = PathParam(..., ge=1, description="ID of the review request (must be positive)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReviewRequestResponse:
    """
    Get a specific review request by ID.

    Users can view:
    - Their own reviews (any status)
    - Reviews they're assigned to as a reviewer
    - Reviews available for claiming (PENDING or IN_REVIEW status)

    Args:
        review_id: ID of the review request
        current_user: Currently authenticated user
        db: Database session

    Returns:
        Review request with relationships

    Raises:
        HTTPException: If not found or user doesn't have access
    """
    try:
        # Get review without user_id filter first
        review = await review_crud.get_review_request(
            db=db,
            review_id=review_id,
            user_id=None  # Don't filter by user
        )

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        # Check authorization
        is_owner = review.user_id == current_user.id

        # Check if user is a reviewer for this review
        is_reviewer = any(
            slot.reviewer_id == current_user.id
            for slot in (review.slots or [])
        )

        # Reviews available for claiming (PENDING or IN_REVIEW with available slots)
        is_available_for_claiming = review.status in [
            ReviewStatus.PENDING,
            ReviewStatus.IN_REVIEW
        ] and review.reviews_claimed < review.reviews_requested

        # Allow access if user is owner, reviewer, or review is available for claiming
        if not (is_owner or is_reviewer or is_available_for_claiming):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this review"
            )

        # Prepare response with requester information
        response_data = ReviewRequestResponse.model_validate(review)

        # Add requester information from the user relationship
        if hasattr(review, 'user') and review.user:
            response_data.requester_username = review.user.full_name or review.user.email.split('@')[0]
            response_data.requester_avatar = review.user.avatar_url

        # Filter slots based on user role for privacy
        if response_data.slots and not is_owner:
            # Non-owners can only see:
            # 1. Their own slots (any status)
            # 2. Accepted slots from others (public)
            # 3. Available slots (for claiming)
            filtered_slots = []
            for slot in response_data.slots:
                # Show slot if it's the user's own slot
                if slot.reviewer_id == current_user.id:
                    filtered_slots.append(slot)
                # Show accepted slots (public information)
                elif slot.status == "accepted":
                    filtered_slots.append(slot)
                # Show available slots (for claiming)
                elif slot.status == "available":
                    filtered_slots.append(slot)
                # Hide submitted/claimed/rejected slots from other reviewers

            response_data.slots = filtered_slots

        return response_data
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(
            f"Failed to get review request {review_id} for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve review request"
        )


@router.patch(
    "/{review_id}",
    response_model=ReviewRequestResponse,
    summary="Update a review request"
)
async def update_review_request(
    review_id: int = PathParam(..., ge=1, description="ID of the review request (must be positive)"),
    update_data: ReviewRequestUpdate = ...,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReviewRequestResponse:
    """
    Update a review request.

    Note: Only draft and pending reviews can be edited.

    Args:
        review_id: ID of the review request
        update_data: Update data
        current_user: Currently authenticated user
        db: Database session

    Returns:
        Updated review request

    Raises:
        HTTPException: If not found, user doesn't have access, or review cannot be edited
    """
    try:
        # Get the current review to check status transition
        from app.models.review_request import ReviewStatus, ReviewType
        current_review = await review_crud.get_review_request(
            db=db,
            review_id=review_id,
            user_id=current_user.id
        )

        if not current_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        # Check if status is changing from DRAFT to PENDING
        original_status = current_review.status
        is_status_changing_to_pending = (
            update_data.status == ReviewStatus.PENDING and
            original_status != ReviewStatus.PENDING
        )

        # Determine final review type (from update_data if provided, else current)
        final_review_type = update_data.review_type if update_data.review_type else current_review.review_type

        # Check quota BEFORE submitting a FREE review (DRAFT → PENDING)
        if is_status_changing_to_pending and final_review_type == ReviewType.FREE:
            can_create, error_message = await SubscriptionService.check_review_limit(current_user, db)
            if not can_create:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=error_message
                )

        # Update the review
        review = await review_crud.update_review_request(
            db=db,
            review_id=review_id,
            user_id=current_user.id,
            data=update_data
        )

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        # Increment review count when free review is submitted (DRAFT → PENDING)
        if is_status_changing_to_pending and review.review_type == ReviewType.FREE:
            await SubscriptionService.increment_review_count(current_user, db)
            security_logger.logger.info(
                f"Incremented review count for user {current_user.email}: "
                f"review {review.id} submitted"
            )

        security_logger.logger.info(
            f"Review request updated: id={review.id}, user={current_user.email}"
        )

        return ReviewRequestResponse.model_validate(review)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(
            f"Failed to update review request {review_id} for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update review request"
        )


@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a review request"
)
async def delete_review_request(
    review_id: int = PathParam(..., ge=1, description="ID of the review request (must be positive)"),
    hard_delete: bool = Query(False, description="Permanently delete (default: soft delete)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a review request (soft delete by default).

    Args:
        review_id: ID of the review request
        hard_delete: If True, permanently delete. If False, soft delete (default)
        current_user: Currently authenticated user
        db: Database session

    Raises:
        HTTPException: If not found or user doesn't have access
    """
    try:
        deleted = await review_crud.delete_review_request(
            db=db,
            review_id=review_id,
            user_id=current_user.id,
            soft_delete=not hard_delete
        )

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        delete_type = "hard" if hard_delete else "soft"
        security_logger.logger.info(
            f"Review request {delete_type} deleted: id={review_id}, user={current_user.email}"
        )
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(
            f"Failed to delete review request {review_id} for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete review request"
        )
