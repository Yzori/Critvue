"""Dispute operations for review slots"""

import logging

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.crud import review_slot as crud_review_slot
from app.models.user import User
from app.schemas.review_slot import (
    ReviewSlotResponse,
    ReviewSlotListResponse,
    ReviewDispute,
    DisputeResolve,
)
from app.services.gamification.review_sparks_hooks import on_dispute_created, on_dispute_resolved
from app.services.notifications.triggers import notify_dispute_created, notify_dispute_resolved
from app.core.exceptions import (
    NotOwnerError,
    InvalidInputError,
    SlotNotFoundError,
    AdminRequiredError,
    InternalError,
)

from .common import limiter, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["review-slots"])


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

        await on_dispute_created(db, disputed_slot.id, current_user.id)
        await notify_dispute_created(db, slot_id, current_user.id)
        logger.info(f"User {current_user.id} created dispute for slot {slot_id}")

        return disputed_slot

    except PermissionError as e:
        raise NotOwnerError(message=str(e))
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except RuntimeError as e:
        raise SlotNotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error creating dispute for slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while creating the dispute")


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
    require_admin(current_user)

    try:
        resolved_slot = await crud_review_slot.resolve_dispute(
            db,
            slot_id,
            current_user.id,
            resolution_data.resolution,
            resolution_data.admin_notes
        )

        await on_dispute_resolved(
            db,
            resolved_slot.id,
            resolved_slot.reviewer_id,
            resolution=resolution_data.resolution.value
        )

        await notify_dispute_resolved(
            db,
            slot_id,
            resolved_slot.reviewer_id,
            resolution_data.resolution.value,
            resolution_data.admin_notes
        )

        logger.info(
            f"Admin {current_user.id} resolved dispute for slot {slot_id} "
            f"(resolution: {resolution_data.resolution.value})"
        )

        return resolved_slot

    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except RuntimeError as e:
        raise SlotNotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error resolving dispute for slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while resolving the dispute")


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
    require_admin(current_user)

    try:
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
        logger.error(f"Error getting disputed slots: {e}", exc_info=True)
        raise InternalError(message="An error occurred while fetching disputed slots")
