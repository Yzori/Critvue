"""Review Request API endpoints"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
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
        review = await review_crud.create_review_request(
            db=db,
            user_id=current_user.id,
            data=review_data
        )

        security_logger.logger.info(
            f"Review request created: id={review.id}, user={current_user.email}, "
            f"type={review.content_type.value}"
        )

        return ReviewRequestResponse.model_validate(review)
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
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReviewRequestResponse:
    """
    Get a specific review request by ID.

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
        review = await review_crud.get_review_request(
            db=db,
            review_id=review_id,
            user_id=current_user.id
        )

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        return ReviewRequestResponse.model_validate(review)
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
    review_id: int,
    update_data: ReviewRequestUpdate,
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
    review_id: int,
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
