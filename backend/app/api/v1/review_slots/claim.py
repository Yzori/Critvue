"""Claim and abandon operations for review slots"""

import logging

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.review_slot import ReviewSlotResponse
from app.services.claim_service import (
    claim_service,
    ClaimValidationError,
    ApplicationRequiredError as ServiceApplicationRequired,
    TierPermissionError as ServiceTierPermission,
)
from app.services.gamification.review_sparks_hooks import on_claim_abandoned
from app.services.notifications.triggers import notify_slot_claimed, notify_slot_abandoned
from app.core.exceptions import (
    ApplicationRequiredError,
    TierPermissionError,
    InvalidInputError,
    SlotNotFoundError,
    InternalError,
)

from .common import limiter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["review-slots"])


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
        claimed_slot = await claim_service.claim_review_by_slot_id(
            db, slot_id, current_user.id
        )

        await notify_slot_claimed(db, slot_id, current_user.id)
        logger.info(f"User {current_user.id} claimed slot {slot_id}")

        return claimed_slot

    except ServiceApplicationRequired as e:
        raise ApplicationRequiredError(message=str(e))
    except ServiceTierPermission as e:
        raise TierPermissionError(message=str(e))
    except ClaimValidationError as e:
        raise InvalidInputError(message=str(e))
    except RuntimeError as e:
        raise SlotNotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error claiming slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while claiming the slot")


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
        abandoned_slot = await claim_service.unclaim_review_slot(
            db, slot_id, current_user.id
        )

        await on_claim_abandoned(db, abandoned_slot.id, current_user.id)
        await notify_slot_abandoned(db, slot_id, current_user.id)
        logger.info(f"User {current_user.id} abandoned slot {slot_id}")

        return abandoned_slot

    except ClaimValidationError as e:
        error_msg = str(e)
        if "don't own" in error_msg.lower():
            from app.core.exceptions import NotOwnerError
            raise NotOwnerError(message=error_msg)
        raise InvalidInputError(message=error_msg)
    except RuntimeError as e:
        raise SlotNotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error abandoning slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while abandoning the slot")
