"""
Notification Triggers for Review Lifecycle

Handles automatic notification creation for key events in the review workflow.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.notification import NotificationType, NotificationPriority, EntityType
from app.models.review_slot import ReviewSlot
from app.models.review_request import ReviewRequest
from app.models.user import User
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


# ==================== Review Slot Claim Events ====================

async def notify_slot_claimed(db: AsyncSession, slot_id: int, reviewer_id: int) -> None:
    """
    Notify requester when a reviewer claims one of their review slots.

    Args:
        db: Database session
        slot_id: ID of claimed slot
        reviewer_id: ID of reviewer who claimed the slot
    """
    try:
        # Get slot and review request
        result = await db.execute(
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            logger.error(f"Slot {slot_id} not found for claim notification")
            return

        # Get review request
        result = await db.execute(
            select(ReviewRequest)
            .where(ReviewRequest.id == slot.review_request_id)
        )
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.error(f"Review request {slot.review_request_id} not found")
            return

        # Get reviewer info
        reviewer = await db.get(User, reviewer_id)
        if not reviewer:
            logger.error(f"Reviewer {reviewer_id} not found")
            return

        # Calculate remaining slots
        result = await db.execute(
            select(ReviewSlot)
            .where(ReviewSlot.review_request_id == slot.review_request_id)
        )
        all_slots = result.scalars().all()
        available_slots = sum(1 for s in all_slots if s.status == "available")

        # Create notification for requester
        service = NotificationService(db)
        await service.create_notification(
            user_id=review_request.user_id,
            notification_type=NotificationType.REVIEW_SLOT_CLAIMED,
            title=f"Review slot claimed by {reviewer.full_name or reviewer.email}",
            message=f"{reviewer.full_name or reviewer.email} has claimed a review slot for '{review_request.title}'. They will submit their review soon.",
            data={
                "slot_id": slot.id,
                "review_request_id": review_request.id,
                "review_request_title": review_request.title,
                "reviewer_id": reviewer.id,
                "reviewer_name": reviewer.full_name or reviewer.email,
                "reviewer_avatar": reviewer.avatar_url,
                "remaining_slots": available_slots,
            },
            priority=NotificationPriority.MEDIUM,
            action_url=f"/review/{review_request.id}",
            action_label="View Request",
            entity_type=EntityType.REVIEW_SLOT,
            entity_id=slot.id,
        )

        logger.info(f"Created slot claimed notification for user {review_request.user_id}")

    except Exception as e:
        logger.error(f"Error creating slot claimed notification: {e}", exc_info=True)


async def notify_slot_abandoned(db: AsyncSession, slot_id: int, reviewer_id: int) -> None:
    """
    Notify requester when a reviewer abandons a claimed slot.

    Args:
        db: Database session
        slot_id: ID of abandoned slot
        reviewer_id: ID of reviewer who abandoned the slot
    """
    try:
        # Get slot and review request
        result = await db.execute(
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            logger.error(f"Slot {slot_id} not found for abandon notification")
            return

        # Get review request
        result = await db.execute(
            select(ReviewRequest)
            .where(ReviewRequest.id == slot.review_request_id)
        )
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.error(f"Review request {slot.review_request_id} not found")
            return

        # Get reviewer info
        reviewer = await db.get(User, reviewer_id)
        if not reviewer:
            logger.error(f"Reviewer {reviewer_id} not found")
            return

        # Create notification for requester
        service = NotificationService(db)
        await service.create_notification(
            user_id=review_request.user_id,
            notification_type=NotificationType.REVIEW_SLOT_AVAILABLE,
            title="Review slot available again",
            message=f"A reviewer has released a slot for '{review_request.title}'. The slot is now available for another reviewer to claim.",
            data={
                "slot_id": slot.id,
                "review_request_id": review_request.id,
                "review_request_title": review_request.title,
            },
            priority=NotificationPriority.MEDIUM,
            action_url=f"/review/{review_request.id}",
            action_label="View Request",
            entity_type=EntityType.REVIEW_SLOT,
            entity_id=slot.id,
        )

        logger.info(f"Created slot abandoned notification for user {review_request.user_id}")

    except Exception as e:
        logger.error(f"Error creating slot abandoned notification: {e}", exc_info=True)


# ==================== Review Submission Events ====================

async def notify_review_submitted(db: AsyncSession, slot_id: int, reviewer_id: int) -> None:
    """
    Notify requester when a reviewer submits their review.

    Args:
        db: Database session
        slot_id: ID of slot with submitted review
        reviewer_id: ID of reviewer who submitted
    """
    try:
        # Get slot and review request
        result = await db.execute(
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            logger.error(f"Slot {slot_id} not found for submission notification")
            return

        # Get review request
        result = await db.execute(
            select(ReviewRequest)
            .where(ReviewRequest.id == slot.review_request_id)
        )
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.error(f"Review request {slot.review_request_id} not found")
            return

        # Get reviewer info
        reviewer = await db.get(User, reviewer_id)
        if not reviewer:
            logger.error(f"Reviewer {reviewer_id} not found")
            return

        # Create review preview (first 150 chars)
        # For Studio reviews, review_text may be None - try to get summary from draft_sections
        review_preview = None
        if slot.review_text:
            review_preview = slot.review_text[:150] + "..." if len(slot.review_text) > 150 else slot.review_text
        elif slot.draft_sections:
            # Try to extract summary from Studio draft (verdictCard.summary)
            try:
                import json
                draft_data = slot.draft_sections if isinstance(slot.draft_sections, dict) else json.loads(slot.draft_sections)
                if draft_data.get("verdictCard", {}).get("summary"):
                    summary = draft_data["verdictCard"]["summary"]
                    review_preview = summary[:150] + "..." if len(summary) > 150 else summary
            except (json.JSONDecodeError, TypeError, KeyError):
                pass
        if not review_preview:
            review_preview = "Review submitted - check the details in your dashboard"

        # Create notification for requester
        service = NotificationService(db)
        await service.create_notification(
            user_id=review_request.user_id,
            notification_type=NotificationType.REVIEW_SUBMITTED,
            title=f"Review submitted by {reviewer.full_name or reviewer.email}",
            message=f"{reviewer.full_name or reviewer.email} has submitted their review for '{review_request.title}'. Review it and accept or reject within 7 days.",
            data={
                "slot_id": slot.id,
                "review_request_id": review_request.id,
                "review_request_title": review_request.title,
                "reviewer_id": reviewer.id,
                "reviewer_name": reviewer.full_name or reviewer.email,
                "reviewer_avatar": reviewer.avatar_url,
                "rating_given": slot.rating,
                "review_preview": review_preview,
                "auto_accept_deadline": slot.auto_accept_at.isoformat() if slot.auto_accept_at else None,
            },
            priority=NotificationPriority.HIGH,
            action_url=f"/dashboard/reviews/{slot.id}/review",
            action_label="Review Submission",
            entity_type=EntityType.REVIEW_SLOT,
            entity_id=slot.id,
        )

        logger.info(f"Created review submitted notification for user {review_request.user_id}")

    except Exception as e:
        logger.error(f"Error creating review submitted notification: {e}", exc_info=True)


# ==================== Review Acceptance Events ====================

async def notify_review_accepted(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    helpful_rating: int,
    karma_earned: int,
    new_karma_balance: int
) -> None:
    """
    Notify reviewer when their review is accepted.

    Args:
        db: Database session
        slot_id: ID of accepted slot
        reviewer_id: ID of reviewer
        helpful_rating: How helpful the review was (1-5)
        karma_earned: Amount of karma earned
        new_karma_balance: Reviewer's new karma balance
    """
    try:
        # Get slot and review request
        result = await db.execute(
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            logger.error(f"Slot {slot_id} not found for acceptance notification")
            return

        # Get review request
        result = await db.execute(
            select(ReviewRequest)
            .where(ReviewRequest.id == slot.review_request_id)
        )
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.error(f"Review request {slot.review_request_id} not found")
            return

        # Create notification for reviewer
        service = NotificationService(db)
        await service.create_notification(
            user_id=reviewer_id,
            notification_type=NotificationType.REVIEW_ACCEPTED,
            title="Your review was accepted!",
            message=f"Your review for '{review_request.title}' has been accepted. You earned {karma_earned} karma points!",
            data={
                "slot_id": slot.id,
                "review_request_id": review_request.id,
                "review_request_title": review_request.title,
                "karma_earned": karma_earned,
                "new_karma_balance": new_karma_balance,
                "helpful_rating": helpful_rating,
                "acceptance_type": "manual",
            },
            priority=NotificationPriority.HIGH,
            action_url=f"/reviewer/review/{slot.id}",
            action_label="View Review",
            entity_type=EntityType.REVIEW_SLOT,
            entity_id=slot.id,
        )

        logger.info(f"Created review accepted notification for user {reviewer_id}")

    except Exception as e:
        logger.error(f"Error creating review accepted notification: {e}", exc_info=True)


# ==================== Review Rejection Events ====================

async def notify_review_rejected(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    rejection_reason: str,
    rejection_notes: Optional[str],
    karma_penalty: int,
    new_karma_balance: int
) -> None:
    """
    Notify reviewer when their review is rejected.

    Args:
        db: Database session
        slot_id: ID of rejected slot
        reviewer_id: ID of reviewer
        rejection_reason: Reason for rejection
        rejection_notes: Additional notes from requester
        karma_penalty: Amount of karma deducted
        new_karma_balance: Reviewer's new karma balance
    """
    try:
        # Get slot and review request
        result = await db.execute(
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            logger.error(f"Slot {slot_id} not found for rejection notification")
            return

        # Get review request
        result = await db.execute(
            select(ReviewRequest)
            .where(ReviewRequest.id == slot.review_request_id)
        )
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.error(f"Review request {slot.review_request_id} not found")
            return

        # Calculate dispute deadline (7 days from now)
        dispute_deadline = datetime.utcnow() + timedelta(days=7)

        # Create notification for reviewer
        service = NotificationService(db)
        await service.create_notification(
            user_id=reviewer_id,
            notification_type=NotificationType.REVIEW_REJECTED,
            title="Your review was rejected",
            message=f"Your review for '{review_request.title}' was rejected. Reason: {rejection_reason}. You can dispute this decision within 7 days.",
            data={
                "slot_id": slot.id,
                "review_request_id": review_request.id,
                "review_request_title": review_request.title,
                "rejection_reason": rejection_reason,
                "rejection_notes": rejection_notes,
                "karma_penalty": karma_penalty,
                "new_karma_balance": new_karma_balance,
                "can_dispute": True,
                "dispute_deadline": dispute_deadline.isoformat(),
            },
            priority=NotificationPriority.HIGH,
            action_url=f"/reviewer/review/{slot.id}",
            action_label="View Details & Dispute",
            entity_type=EntityType.REVIEW_SLOT,
            entity_id=slot.id,
        )

        logger.info(f"Created review rejected notification for user {reviewer_id}")

    except Exception as e:
        logger.error(f"Error creating review rejected notification: {e}", exc_info=True)


# ==================== Dispute Events ====================

async def notify_dispute_created(db: AsyncSession, slot_id: int, reviewer_id: int) -> None:
    """
    Notify admin and requester when a dispute is created.

    Args:
        db: Database session
        slot_id: ID of disputed slot
        reviewer_id: ID of reviewer who created dispute
    """
    try:
        # Get slot and review request
        result = await db.execute(
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            logger.error(f"Slot {slot_id} not found for dispute notification")
            return

        # Get review request
        result = await db.execute(
            select(ReviewRequest)
            .where(ReviewRequest.id == slot.review_request_id)
        )
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.error(f"Review request {slot.review_request_id} not found")
            return

        # Get reviewer info
        reviewer = await db.get(User, reviewer_id)
        if not reviewer:
            logger.error(f"Reviewer {reviewer_id} not found")
            return

        service = NotificationService(db)

        # Notify requester
        await service.create_notification(
            user_id=review_request.user_id,
            notification_type=NotificationType.DISPUTE_CREATED,
            title=f"Review dispute created",
            message=f"{reviewer.full_name or reviewer.email} has disputed your rejection of their review for '{review_request.title}'. An admin will review the dispute.",
            data={
                "slot_id": slot.id,
                "review_request_id": review_request.id,
                "review_request_title": review_request.title,
                "reviewer_id": reviewer.id,
                "reviewer_name": reviewer.full_name or reviewer.email,
                "dispute_reason": slot.dispute_reason,
            },
            priority=NotificationPriority.MEDIUM,
            action_url=f"/dashboard/reviews/{slot.id}/review",
            action_label="View Dispute",
            entity_type=EntityType.REVIEW_SLOT,
            entity_id=slot.id,
        )

        # TODO: Notify all admins (would need to query for admin users)
        # For now, just log it
        logger.info(f"Dispute created for slot {slot_id} - admins should be notified")

    except Exception as e:
        logger.error(f"Error creating dispute notification: {e}", exc_info=True)


async def notify_dispute_resolved(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    resolution: str,
    admin_notes: Optional[str]
) -> None:
    """
    Notify reviewer and requester when a dispute is resolved.

    Args:
        db: Database session
        slot_id: ID of disputed slot
        reviewer_id: ID of reviewer
        resolution: Resolution decision (approved/denied)
        admin_notes: Admin's notes on the decision
    """
    try:
        # Get slot and review request
        result = await db.execute(
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
        )
        slot = result.scalar_one_or_none()

        if not slot:
            logger.error(f"Slot {slot_id} not found for dispute resolution notification")
            return

        # Get review request
        result = await db.execute(
            select(ReviewRequest)
            .where(ReviewRequest.id == slot.review_request_id)
        )
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.error(f"Review request {slot.review_request_id} not found")
            return

        service = NotificationService(db)

        # Notify reviewer
        if resolution == "approved":
            await service.create_notification(
                user_id=reviewer_id,
                notification_type=NotificationType.DISPUTE_RESOLVED,
                title="Dispute resolved in your favor",
                message=f"Your dispute for '{review_request.title}' was approved. The review has been accepted and you've received karma.",
                data={
                    "slot_id": slot.id,
                    "review_request_id": review_request.id,
                    "review_request_title": review_request.title,
                    "resolution": resolution,
                    "admin_notes": admin_notes,
                },
                priority=NotificationPriority.HIGH,
                action_url=f"/reviewer/review/{slot.id}",
                action_label="View Review",
                entity_type=EntityType.REVIEW_SLOT,
                entity_id=slot.id,
            )
        else:
            await service.create_notification(
                user_id=reviewer_id,
                notification_type=NotificationType.DISPUTE_RESOLVED,
                title="Dispute resolved",
                message=f"Your dispute for '{review_request.title}' was reviewed. The original rejection stands.",
                data={
                    "slot_id": slot.id,
                    "review_request_id": review_request.id,
                    "review_request_title": review_request.title,
                    "resolution": resolution,
                    "admin_notes": admin_notes,
                },
                priority=NotificationPriority.HIGH,
                action_url=f"/reviewer/review/{slot.id}",
                action_label="View Details",
                entity_type=EntityType.REVIEW_SLOT,
                entity_id=slot.id,
            )

        # Notify requester
        await service.create_notification(
            user_id=review_request.user_id,
            notification_type=NotificationType.DISPUTE_RESOLVED,
            title="Review dispute resolved",
            message=f"The dispute for '{review_request.title}' has been resolved. Resolution: {resolution}",
            data={
                "slot_id": slot.id,
                "review_request_id": review_request.id,
                "review_request_title": review_request.title,
                "resolution": resolution,
                "admin_notes": admin_notes,
            },
            priority=NotificationPriority.MEDIUM,
            action_url=f"/dashboard/reviews/{slot.id}/review",
            action_label="View Review",
            entity_type=EntityType.REVIEW_SLOT,
            entity_id=slot.id,
        )

        logger.info(f"Created dispute resolution notifications for slot {slot_id}")

    except Exception as e:
        logger.error(f"Error creating dispute resolution notification: {e}", exc_info=True)
