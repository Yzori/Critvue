"""API endpoints for review slots"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, get_db
from app.crud import review_slot as crud_review_slot
from app.models.user import User
from app.models.review_slot import RejectionReason, DisputeResolution
from app.schemas.review_slot import (
    ReviewSlotResponse,
    ReviewSlotPublicResponse,
    ReviewSlotListResponse,
    ReviewerSlotListResponse,
    ReviewSubmit,
    ReviewAccept,
    ReviewReject,
    ReviewDispute,
    DisputeResolve,
    ReviewerSlotWithRequest,
)
from app.services.claim_service import claim_service, ClaimValidationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/review-slots", tags=["review-slots"])

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


# ===== Claim Operations =====

@router.post(
    "/{slot_id}/claim",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def claim_review_slot(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Claim a review slot for review

    **Requirements:**
    - Slot must be in 'available' status
    - User cannot claim slots from their own review requests
    - User cannot claim multiple slots for the same request

    **Rate Limit:** 20 requests per minute
    """
    try:
        # Claim the slot using shared service
        claimed_slot = await claim_service.claim_review_by_slot_id(
            db, slot_id, current_user.id
        )

        logger.info(f"User {current_user.id} claimed slot {slot_id}")

        return claimed_slot

    except ClaimValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error claiming slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while claiming the slot"
        )


@router.post(
    "/{slot_id}/abandon",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def abandon_review_slot(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Abandon a claimed review slot

    **Requirements:**
    - Slot must be in 'claimed' status
    - User must be the reviewer who claimed the slot

    **Rate Limit:** 20 requests per minute
    """
    try:
        # Abandon using shared service
        abandoned_slot = await claim_service.unclaim_review_slot(
            db, slot_id, current_user.id
        )

        logger.info(f"User {current_user.id} abandoned slot {slot_id}")

        return abandoned_slot

    except ClaimValidationError as e:
        # ClaimValidationError can include permission errors
        error_msg = str(e)
        if "don't own" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error abandoning slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while abandoning the slot"
        )


# ===== Submit Review =====

@router.post(
    "/{slot_id}/submit",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def submit_review(
    request: Request,
    slot_id: int,
    review_data: ReviewSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a review for a claimed slot

    **Requirements:**
    - Slot must be in 'claimed' status
    - User must be the reviewer who claimed the slot
    - Review text must be at least 50 characters
    - Rating must be between 1-5

    **Rate Limit:** 20 requests per minute
    """
    try:
        submitted_slot = await crud_review_slot.submit_review(
            db,
            slot_id,
            current_user.id,
            review_data.review_text,
            review_data.rating,
            review_data.attachments
        )

        logger.info(f"User {current_user.id} submitted review for slot {slot_id}")

        return submitted_slot

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error submitting review for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while submitting the review"
        )


# ===== Accept/Reject Review =====

@router.post(
    "/{slot_id}/accept",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def accept_review(
    request: Request,
    slot_id: int,
    accept_data: ReviewAccept,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept a submitted review

    **Requirements:**
    - Slot must be in 'submitted' status
    - User must be the requester who created the review request

    **Rate Limit:** 20 requests per minute
    """
    try:
        accepted_slot = await crud_review_slot.accept_review(
            db,
            slot_id,
            current_user.id,
            accept_data.helpful_rating
        )

        logger.info(f"User {current_user.id} accepted review for slot {slot_id}")

        return accepted_slot

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error accepting review for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while accepting the review"
        )


@router.post(
    "/{slot_id}/reject",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def reject_review(
    request: Request,
    slot_id: int,
    reject_data: ReviewReject,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a submitted review

    **Requirements:**
    - Slot must be in 'submitted' status
    - User must be the requester who created the review request
    - Must provide rejection reason
    - If reason is 'other', must provide detailed notes

    **Rate Limit:** 20 requests per minute
    """
    try:
        rejected_slot = await crud_review_slot.reject_review(
            db,
            slot_id,
            current_user.id,
            reject_data.rejection_reason,
            reject_data.rejection_notes
        )

        logger.info(
            f"User {current_user.id} rejected review for slot {slot_id} "
            f"(reason: {reject_data.rejection_reason.value})"
        )

        return rejected_slot

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error rejecting review for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while rejecting the review"
        )


# ===== Dispute Operations =====

@router.post(
    "/{slot_id}/dispute",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def create_dispute(
    request: Request,
    slot_id: int,
    dispute_data: ReviewDispute,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a dispute for a rejected review

    **Requirements:**
    - Slot must be in 'rejected' status
    - User must be the reviewer who submitted the review
    - Dispute must be created within 7 days of rejection
    - Dispute reason must be at least 20 characters

    **Rate Limit:** 20 requests per minute
    """
    try:
        disputed_slot = await crud_review_slot.create_dispute(
            db,
            slot_id,
            current_user.id,
            dispute_data.dispute_reason
        )

        logger.info(f"User {current_user.id} created dispute for slot {slot_id}")

        return disputed_slot

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating dispute for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the dispute"
        )


# ===== Query Operations =====

@router.get(
    "/my-slots",
    response_model=ReviewerSlotListResponse
)
@limiter.limit("100/minute")
async def get_my_review_slots(
    request: Request,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all review slots for the current user (as reviewer)

    **Query Parameters:**
    - status: Filter by slot status (optional)
    - skip: Pagination offset (default: 0)
    - limit: Page size (default: 20, max: 100)

    **Rate Limit:** 100 requests per minute (higher limit to support dashboard components)
    """
    try:
        # Validate status if provided
        from app.models.review_slot import ReviewSlotStatus
        status_filter = None
        if status:
            try:
                status_filter = ReviewSlotStatus(status)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {status}"
                )

        # Limit max page size
        limit = min(limit, 100)

        slots, total = await crud_review_slot.get_user_review_slots(
            db,
            current_user.id,
            status_filter,
            skip,
            limit
        )

        # Map slots to include review_request data
        items_with_request = []
        for slot in slots:
            slot_dict = {
                **slot.__dict__,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "description": slot.review_request.description,
                    "content_type": slot.review_request.content_type.value,
                    "status": slot.review_request.status.value,
                } if slot.review_request else None
            }
            items_with_request.append(slot_dict)

        return ReviewerSlotListResponse(
            items=items_with_request,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(slots)) < total
        )

    except Exception as e:
        logger.error(f"Error getting review slots for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching review slots"
        )


@router.get(
    "/request/{request_id}/slots",
    response_model=List[ReviewSlotResponse]
)
@limiter.limit("20/minute")
async def get_request_slots(
    request: Request,
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all review slots for a specific review request

    **Requirements:**
    - User must be the requester or a reviewer of one of the slots

    **Rate Limit:** 20 requests per minute
    """
    try:
        # Verify user has access to this request
        from app.models.review_request import ReviewRequest
        request = await db.get(ReviewRequest, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review request not found"
            )

        # Get all slots for this request
        slots = await crud_review_slot.get_slots_for_request(db, request_id)

        # Filter visibility based on user role
        if request.user_id == current_user.id:
            # Requester can see all slots
            return slots
        else:
            # Reviewers can only see their own slots or accepted reviews
            filtered_slots = [
                slot for slot in slots
                if slot.reviewer_id == current_user.id or
                slot.status == "accepted"
            ]
            return filtered_slots

    except Exception as e:
        logger.error(f"Error getting slots for request {request_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching review slots"
        )


@router.get(
    "/{slot_id}",
    response_model=ReviewSlotResponse
)
@limiter.limit("20/minute")
async def get_review_slot(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific review slot by ID

    **Requirements:**
    - User must be the requester or the reviewer

    **Rate Limit:** 20 requests per minute
    """
    try:
        slot = await crud_review_slot.get_review_slot(
            db, slot_id, user_id=current_user.id
        )

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review slot not found or you don't have access"
            )

        return slot

    except Exception as e:
        logger.error(f"Error getting slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching the review slot"
        )


# ===== Admin Endpoints =====

@router.post(
    "/{slot_id}/resolve-dispute",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def resolve_dispute(
    request: Request,
    slot_id: int,
    resolution_data: DisputeResolve,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to resolve a disputed review

    **Requirements:**
    - User must be an admin
    - Slot must be in 'disputed' status

    **Rate Limit:** 20 requests per minute
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can resolve disputes"
        )

    try:
        resolved_slot = await crud_review_slot.resolve_dispute(
            db,
            slot_id,
            current_user.id,
            resolution_data.resolution,
            resolution_data.admin_notes
        )

        logger.info(
            f"Admin {current_user.id} resolved dispute for slot {slot_id} "
            f"(resolution: {resolution_data.resolution.value})"
        )

        return resolved_slot

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error resolving dispute for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resolving the dispute"
        )


@router.get(
    "/admin/disputed",
    response_model=ReviewSlotListResponse
)
@limiter.limit("20/minute")
async def get_disputed_slots(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to get all disputed review slots

    **Requirements:**
    - User must be an admin

    **Rate Limit:** 20 requests per minute
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view disputed reviews"
        )

    try:
        # Limit max page size
        limit = min(limit, 100)

        slots, total = await crud_review_slot.get_disputed_slots(db, skip, limit)

        return ReviewSlotListResponse(
            items=slots,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(slots)) < total
        )

    except Exception as e:
        logger.error(f"Error getting disputed slots: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching disputed slots"
        )
