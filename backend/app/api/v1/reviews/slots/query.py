"""Query operations for review slots"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.crud import review_slot as crud_review_slot
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.review_request import ReviewRequest
from app.schemas.review_slot import (
    ReviewSlotResponse,
    ReviewSlotListResponse,
    ReviewerSlotListResponse,
)
from app.core.exceptions import (
    SlotNotFoundError,
    InvalidInputError,
    InternalError,
)

from .common import limiter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["review-slots"])


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
    - status: Filter by slot status - single status OR comma-separated list (e.g., "claimed,submitted")
    - skip: Pagination offset (default: 0)
    - limit: Page size (default: 20, max: 100)

    **Rate Limit:** 100 requests per minute (higher limit to support dashboard components)
    """
    status_filters = None
    if status:
        status_list = [s.strip() for s in status.split(',')]
        status_filters = []
        for s in status_list:
            try:
                status_filters.append(ReviewSlotStatus(s))
            except ValueError:
                raise InvalidInputError(message=f"Invalid status: {s}")

    limit = min(limit, 100)

    try:
        slots, total = await crud_review_slot.get_user_review_slots(
            db,
            current_user.id,
            status_filters,
            skip,
            limit
        )

        items_with_request = []
        for slot in slots:
            slot_dict = ReviewSlotResponse.model_validate(slot).model_dump()
            slot_dict["review_request"] = {
                "id": slot.review_request.id,
                "title": slot.review_request.title,
                "description": slot.review_request.description,
                "content_type": slot.review_request.content_type.value,
                "status": slot.review_request.status.value,
                "external_links": slot.review_request.external_links,
            } if slot.review_request else None
            items_with_request.append(slot_dict)

        return ReviewerSlotListResponse(
            items=items_with_request,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(slots)) < total
        )

    except InvalidInputError:
        raise
    except Exception as e:
        logger.error(f"Error getting review slots for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while fetching review slots")


@router.get(
    "/pending-for-me",
    status_code=status.HTTP_200_OK
)
@limiter.limit("100/minute")
async def get_pending_reviews_for_requester(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all submitted review slots waiting for acceptance by the current user (as requester)

    Returns all slots with status='submitted' for review requests owned by the current user,
    ordered by urgency (auto_accept_at ascending) so most urgent appear first.

    **Rate Limit:** 100 requests per minute
    """
    try:
        query = (
            select(ReviewSlot)
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewRequest.user_id == current_user.id,
                    ReviewSlot.status == "submitted"
                )
            )
            .options(
                selectinload(ReviewSlot.review_request),
                selectinload(ReviewSlot.reviewer)
            )
            .order_by(ReviewSlot.auto_accept_at.asc())
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        items_with_request = []
        for slot in slots:
            slot_dict = ReviewSlotResponse.model_validate(slot).model_dump(mode='json')
            slot_dict["review_request"] = {
                "id": slot.review_request.id,
                "title": slot.review_request.title,
                "description": slot.review_request.description,
                "content_type": slot.review_request.content_type.value,
                "external_links": slot.review_request.external_links,
            } if slot.review_request else None
            items_with_request.append(slot_dict)

        logger.info(f"Found {len(slots)} pending reviews for user {current_user.id}")
        return JSONResponse(content=items_with_request)

    except Exception as e:
        logger.error(f"Error getting pending reviews for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while fetching pending reviews")


@router.get(
    "/urgent-pending",
    status_code=status.HTTP_200_OK
)
@limiter.limit("100/minute")
async def get_urgent_pending_count(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get count and list of urgent pending reviews (< 24 hours to auto-accept)

    Returns slots that need immediate attention from the requester.

    **Rate Limit:** 100 requests per minute
    """
    try:
        urgent_deadline = datetime.utcnow() + timedelta(hours=24)

        query = (
            select(ReviewSlot)
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewRequest.user_id == current_user.id,
                    ReviewSlot.status == "submitted",
                    ReviewSlot.auto_accept_at < urgent_deadline
                )
            )
            .options(
                selectinload(ReviewSlot.review_request),
                selectinload(ReviewSlot.reviewer)
            )
            .order_by(ReviewSlot.auto_accept_at.asc())
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        items_with_request = []
        for slot in slots:
            slot_dict = ReviewSlotResponse.model_validate(slot).model_dump(mode='json')
            slot_dict["review_request"] = {
                "id": slot.review_request.id,
                "title": slot.review_request.title,
                "content_type": slot.review_request.content_type.value,
                "external_links": slot.review_request.external_links,
            } if slot.review_request else None
            items_with_request.append(slot_dict)

        return JSONResponse(content={
            "count": len(slots),
            "slots": items_with_request
        })

    except Exception as e:
        logger.error(f"Error getting urgent pending reviews for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while fetching urgent pending reviews")


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
        review_request = await db.get(ReviewRequest, request_id)
        if not review_request:
            raise SlotNotFoundError(resource="Review request")

        slots = await crud_review_slot.get_slots_for_request(db, request_id)

        if review_request.user_id == current_user.id:
            return slots
        else:
            return [
                slot for slot in slots
                if slot.reviewer_id == current_user.id or slot.status == "accepted"
            ]

    except SlotNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error getting slots for request {request_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while fetching review slots")


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
            raise SlotNotFoundError()

        return slot

    except SlotNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error getting slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while fetching the review slot")
