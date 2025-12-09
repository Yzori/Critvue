"""
Desktop Dashboard - Batch Operations

Endpoints for bulk actions like batch reject.
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, Request, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.dashboard_desktop.common import (
    create_router,
    limiter,
    logger,
    get_current_user,
    get_db,
    RateLimits,
    InternalError,
    InvalidInputError,
    User,
    ReviewSlot,
    ReviewSlotStatus,
    ReviewRequest,
)

router = create_router("batch")


@router.post("/desktop/batch-reject")
@limiter.limit(RateLimits.DASHBOARD_BATCH)
async def batch_reject_reviews(
    request: Request,
    slot_ids: List[int] = Query(..., description="List of slot IDs to reject"),
    rejection_reason: str = Query(..., description="Rejection reason (same for all)"),
    rejection_notes: Optional[str] = Query(None, description="Optional notes"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject multiple reviews at once.

    **Request Body**:
    - slot_ids: List of slot IDs (max 50)
    - rejection_reason: Reason (low_quality, off_topic, spam, abusive, other)
    - rejection_notes: Optional explanation

    **Rate Limit**: 10 requests per minute

    Returns summary of successful and failed rejections.
    """
    try:
        # Validate batch size
        if len(slot_ids) > 50:
            raise InvalidInputError(message="Maximum 50 reviews can be batch rejected at once")

        if not slot_ids:
            raise InvalidInputError(message="slot_ids cannot be empty")

        # Get all slots
        query = (
            select(ReviewSlot)
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewSlot.id.in_(slot_ids),
                    ReviewRequest.user_id == current_user.id  # Security check
                )
            )
            .options(selectinload(ReviewSlot.review_request))
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Track results
        rejected = []
        failed = []

        # Process each slot
        for slot in slots:
            try:
                if slot.status != ReviewSlotStatus.SUBMITTED.value:
                    failed.append({
                        "slot_id": slot.id,
                        "error": f"Review is {slot.status}, not submitted",
                        "code": "INVALID_STATUS"
                    })
                    continue

                # Reject the review
                from app.crud import review_slot as crud_review_slot
                from app.models.review_slot import RejectionReason

                rejected_slot = await crud_review_slot.reject_review(
                    db,
                    slot.id,
                    current_user.id,
                    RejectionReason(rejection_reason),
                    rejection_notes
                )

                # Deduct sparks
                from app.services.review_sparks_hooks import on_review_rejected
                await on_review_rejected(db, rejected_slot.id, rejected_slot.reviewer_id)

                rejected.append({
                    "slot_id": rejected_slot.id,
                    "status": "rejected",
                    "reviewer_id": rejected_slot.reviewer_id
                })

            except Exception as e:
                logger.error(f"Error rejecting slot {slot.id}: {e}")
                failed.append({
                    "slot_id": slot.id,
                    "error": str(e),
                    "code": "REJECTION_FAILED"
                })

        # Commit all changes
        await db.commit()

        return {
            "rejected": rejected,
            "failed": failed,
            "summary": {
                "total_requested": len(slot_ids),
                "successful": len(rejected),
                "failed": len(failed)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch reject for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to batch reject reviews")
