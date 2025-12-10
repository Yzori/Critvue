"""Submit, accept, reject, and elaboration operations for review slots"""

import logging

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.crud import review_slot as crud_review_slot
from app.models.user import User, UserTier
from app.models.review_slot import ReviewSlot, PaymentStatus
from app.models.review_request import ReviewRequest
from app.schemas.review_slot import (
    ReviewSlotResponse,
    ReviewSubmit,
    ReviewAccept,
    ReviewReject,
    RequestElaboration,
)
from app.services.review_sparks_hooks import on_review_submitted, on_review_accepted, on_review_rejected
from app.services.notification_triggers import (
    notify_review_submitted,
    notify_review_accepted,
    notify_review_rejected,
    notify_elaboration_requested,
)
from app.services.payments import PaymentService
from app.core.exceptions import (
    NotOwnerError,
    InvalidInputError,
    SlotNotFoundError,
    InternalError,
)

from .common import limiter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["review-slots"])


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
        feedback_sections = None
        if review_data.feedback_sections:
            feedback_sections = [section.model_dump() for section in review_data.feedback_sections]

        annotations = None
        if review_data.annotations:
            annotations = [annotation.model_dump() for annotation in review_data.annotations]

        submitted_slot = await crud_review_slot.submit_review(
            db,
            slot_id,
            current_user.id,
            review_data.review_text,
            review_data.rating,
            review_data.attachments,
            feedback_sections,
            annotations
        )

        await on_review_submitted(db, submitted_slot.id, current_user.id)
        await notify_review_submitted(db, slot_id, current_user.id)
        logger.info(f"User {current_user.id} submitted review for slot {slot_id}")

        return submitted_slot

    except PermissionError as e:
        raise NotOwnerError(message=str(e))
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except RuntimeError as e:
        raise SlotNotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error submitting review for slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while submitting the review")


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

        await on_review_accepted(
            db,
            accepted_slot.id,
            accepted_slot.reviewer_id,
            helpful_rating=accept_data.helpful_rating
        )

        # Get karma info for notification
        result = await db.execute(
            select(User).where(User.id == accepted_slot.reviewer_id)
        )
        reviewer = result.scalar_one_or_none()
        karma_earned = 50
        if accept_data.helpful_rating >= 4:
            karma_earned += 10
        new_karma = reviewer.sparks_points if reviewer else karma_earned

        await notify_review_accepted(
            db,
            slot_id,
            accepted_slot.reviewer_id,
            accept_data.helpful_rating,
            karma_earned,
            new_karma
        )

        # Release payment for expert reviews
        if accepted_slot.requires_payment and accepted_slot.payment_status == PaymentStatus.ESCROWED.value:
            try:
                payment_released = await PaymentService.release_payment_to_reviewer(
                    slot=accepted_slot,
                    reviewer=reviewer,
                    db=db
                )
                if payment_released:
                    logger.info(f"Payment released for slot {slot_id} to reviewer {reviewer.id}")
                else:
                    logger.warning(f"Payment release failed for slot {slot_id}")
            except Exception as payment_error:
                logger.error(f"Error releasing payment for slot {slot_id}: {payment_error}")

        logger.info(f"User {current_user.id} accepted review for slot {slot_id}")
        return accepted_slot

    except PermissionError as e:
        raise NotOwnerError(message=str(e))
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except RuntimeError as e:
        raise SlotNotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error accepting review for slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while accepting the review")


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

        await on_review_rejected(db, rejected_slot.id, rejected_slot.reviewer_id)

        # Get karma info for notification
        result = await db.execute(
            select(UserTier).where(UserTier.user_id == rejected_slot.reviewer_id)
        )
        user_tier = result.scalar_one_or_none()
        karma_penalty = 25
        new_karma = user_tier.sparks_points if user_tier else 0

        await notify_review_rejected(
            db,
            slot_id,
            rejected_slot.reviewer_id,
            reject_data.rejection_reason.value,
            reject_data.rejection_notes,
            karma_penalty,
            new_karma
        )

        # Process refund for expert reviews
        if rejected_slot.requires_payment and rejected_slot.payment_status == PaymentStatus.ESCROWED.value:
            try:
                review_request_result = await db.execute(
                    select(ReviewRequest).where(ReviewRequest.id == rejected_slot.review_request_id)
                )
                review_request = review_request_result.scalar_one_or_none()

                if review_request:
                    refund_processed = await PaymentService.process_refund(
                        slot=rejected_slot,
                        review_request=review_request,
                        db=db
                    )
                    if refund_processed:
                        logger.info(f"Refund processed for slot {slot_id}")
                    else:
                        logger.warning(f"Refund processing failed for slot {slot_id}")
            except Exception as refund_error:
                logger.error(f"Error processing refund for slot {slot_id}: {refund_error}")

        logger.info(
            f"User {current_user.id} rejected review for slot {slot_id} "
            f"(reason: {reject_data.rejection_reason.value})"
        )
        return rejected_slot

    except PermissionError as e:
        raise NotOwnerError(message=str(e))
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except RuntimeError as e:
        raise SlotNotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error rejecting review for slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while rejecting the review")


@router.post(
    "/{slot_id}/request-elaboration",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def request_elaboration(
    request: Request,
    slot_id: int,
    elaboration_data: RequestElaboration,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Request elaboration on a submitted review

    **Requirements:**
    - Slot must be in 'submitted' status
    - User must be the requester who created the review request
    - Maximum 2 elaboration requests per review
    - Request must be at least 20 characters

    **Rate Limit:** 20 requests per minute
    """
    try:
        elaborated_slot = await crud_review_slot.request_elaboration(
            db,
            slot_id,
            current_user.id,
            elaboration_data.elaboration_request
        )

        await notify_elaboration_requested(db, slot_id, current_user.id)
        logger.info(
            f"User {current_user.id} requested elaboration for slot {slot_id} "
            f"(count: {elaborated_slot.elaboration_count})"
        )

        return elaborated_slot

    except PermissionError as e:
        raise NotOwnerError(message=str(e))
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except RuntimeError as e:
        raise SlotNotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error requesting elaboration for slot {slot_id}: {e}", exc_info=True)
        raise InternalError(message="An error occurred while requesting elaboration")
