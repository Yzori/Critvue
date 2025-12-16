"""
Notification Triggers for Review Lifecycle

Handles automatic notification creation for key events in the review workflow.
Refactored to use NotificationTriggerHelper for reduced duplication.
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import NotificationType, NotificationPriority, EntityType
from app.services.notifications.trigger_helpers import (
    NotificationContext,
    fetch_slot_context,
    fetch_request_context,
    fetch_application_context,
    send_notification,
    notification_trigger,
    count_available_slots,
    get_review_preview,
)


# ==================== Review Slot Claim Events ====================


@notification_trigger
async def notify_slot_claimed(db: AsyncSession, slot_id: int, reviewer_id: int) -> None:
    """Notify requester when a reviewer claims one of their review slots."""
    ctx = await fetch_slot_context(db, slot_id, reviewer_id=reviewer_id)
    if not ctx:
        return

    available_slots = await count_available_slots(db, ctx.review_request.id)

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.review_request.user_id,
        notification_type=NotificationType.REVIEW_SLOT_CLAIMED,
        title=f"Review slot claimed by {ctx.reviewer_name}",
        message=f"{ctx.reviewer_name} has claimed a review slot for '{ctx.request_title}'. They will submit their review soon.",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "reviewer_id": ctx.reviewer.id,
            "reviewer_name": ctx.reviewer_name,
            "reviewer_avatar": ctx.reviewer_avatar,
            "remaining_slots": available_slots,
        },
        priority=NotificationPriority.MEDIUM,
        action_url=f"/review/{ctx.review_request.id}",
        action_label="View Request",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


@notification_trigger
async def notify_slot_abandoned(db: AsyncSession, slot_id: int, reviewer_id: int) -> None:
    """Notify requester when a reviewer abandons a claimed slot."""
    ctx = await fetch_slot_context(db, slot_id, reviewer_id=reviewer_id)
    if not ctx:
        return

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.review_request.user_id,
        notification_type=NotificationType.REVIEW_SLOT_AVAILABLE,
        title="Review slot available again",
        message=f"A reviewer has released a slot for '{ctx.request_title}'. The slot is now available for another reviewer to claim.",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
        },
        priority=NotificationPriority.MEDIUM,
        action_url=f"/review/{ctx.review_request.id}",
        action_label="View Request",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


# ==================== Review Submission Events ====================


@notification_trigger
async def notify_review_submitted(db: AsyncSession, slot_id: int, reviewer_id: int) -> None:
    """Notify requester when a reviewer submits their review."""
    ctx = await fetch_slot_context(db, slot_id, reviewer_id=reviewer_id)
    if not ctx:
        return

    review_preview = get_review_preview(ctx.slot)

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.review_request.user_id,
        notification_type=NotificationType.REVIEW_SUBMITTED,
        title=f"Review submitted by {ctx.reviewer_name}",
        message=f"{ctx.reviewer_name} has submitted their review for '{ctx.request_title}'. Review it and accept or reject within 7 days.",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "reviewer_id": ctx.reviewer.id,
            "reviewer_name": ctx.reviewer_name,
            "reviewer_avatar": ctx.reviewer_avatar,
            "rating_given": ctx.slot.rating,
            "review_preview": review_preview,
            "auto_accept_deadline": ctx.slot.auto_accept_at.isoformat() if ctx.slot.auto_accept_at else None,
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/dashboard/reviews/{ctx.slot.id}/review",
        action_label="Review Submission",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


# ==================== Review Acceptance Events ====================


@notification_trigger
async def notify_review_accepted(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    helpful_rating: int,
    sparks_earned: int,
    new_sparks_balance: int
) -> None:
    """Notify reviewer when their review is accepted."""
    ctx = await fetch_slot_context(db, slot_id, reviewer_id=reviewer_id)
    if not ctx:
        return

    await send_notification(
        ctx=ctx,
        recipient_id=reviewer_id,
        notification_type=NotificationType.REVIEW_ACCEPTED,
        title="Your review was accepted!",
        message=f"Your review for '{ctx.request_title}' has been accepted. You earned {sparks_earned} sparks!",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "sparks_earned": sparks_earned,
            "new_sparks_balance": new_sparks_balance,
            "helpful_rating": helpful_rating,
            "acceptance_type": "manual",
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/reviewer/review/{ctx.slot.id}",
        action_label="View Review",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


# ==================== Review Rejection Events ====================


@notification_trigger
async def notify_review_rejected(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    rejection_reason: str,
    rejection_notes: Optional[str],
    sparks_penalty: int,
    new_sparks_balance: int
) -> None:
    """Notify reviewer when their review is rejected."""
    ctx = await fetch_slot_context(db, slot_id, reviewer_id=reviewer_id)
    if not ctx:
        return

    dispute_deadline = datetime.utcnow() + timedelta(days=7)

    await send_notification(
        ctx=ctx,
        recipient_id=reviewer_id,
        notification_type=NotificationType.REVIEW_REJECTED,
        title="Your review was rejected",
        message=f"Your review for '{ctx.request_title}' was rejected. Reason: {rejection_reason}. You can dispute this decision within 7 days.",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "rejection_reason": rejection_reason,
            "rejection_notes": rejection_notes,
            "sparks_penalty": sparks_penalty,
            "new_sparks_balance": new_sparks_balance,
            "can_dispute": True,
            "dispute_deadline": dispute_deadline.isoformat(),
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/reviewer/review/{ctx.slot.id}",
        action_label="View Details & Dispute",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


# ==================== Dispute Events ====================


@notification_trigger
async def notify_dispute_created(db: AsyncSession, slot_id: int, reviewer_id: int) -> None:
    """Notify requester when a dispute is created."""
    ctx = await fetch_slot_context(db, slot_id, reviewer_id=reviewer_id)
    if not ctx:
        return

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.review_request.user_id,
        notification_type=NotificationType.DISPUTE_CREATED,
        title="Review dispute created",
        message=f"{ctx.reviewer_name} has disputed your rejection of their review for '{ctx.request_title}'. An admin will review the dispute.",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "reviewer_id": ctx.reviewer.id,
            "reviewer_name": ctx.reviewer_name,
            "dispute_reason": ctx.slot.dispute_reason,
        },
        priority=NotificationPriority.MEDIUM,
        action_url=f"/dashboard/reviews/{ctx.slot.id}/review",
        action_label="View Dispute",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


@notification_trigger
async def notify_dispute_resolved(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int,
    resolution: str,
    admin_notes: Optional[str]
) -> None:
    """Notify reviewer and requester when a dispute is resolved."""
    ctx = await fetch_slot_context(db, slot_id, reviewer_id=reviewer_id)
    if not ctx:
        return

    # Notify reviewer based on resolution
    if resolution == "approved":
        title = "Dispute resolved in your favor"
        message = f"Your dispute for '{ctx.request_title}' was approved. The review has been accepted and you've received karma."
    else:
        title = "Dispute resolved"
        message = f"Your dispute for '{ctx.request_title}' was reviewed. The original rejection stands."

    await send_notification(
        ctx=ctx,
        recipient_id=reviewer_id,
        notification_type=NotificationType.DISPUTE_RESOLVED,
        title=title,
        message=message,
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "resolution": resolution,
            "admin_notes": admin_notes,
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/reviewer/review/{ctx.slot.id}",
        action_label="View Review" if resolution == "approved" else "View Details",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )

    # Notify requester
    await send_notification(
        ctx=ctx,
        recipient_id=ctx.review_request.user_id,
        notification_type=NotificationType.DISPUTE_RESOLVED,
        title="Review dispute resolved",
        message=f"The dispute for '{ctx.request_title}' has been resolved. Resolution: {resolution}",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "resolution": resolution,
            "admin_notes": admin_notes,
        },
        priority=NotificationPriority.MEDIUM,
        action_url=f"/dashboard/reviews/{ctx.slot.id}/review",
        action_label="View Review",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


# ==================== Elaboration Request Events ====================


@notification_trigger
async def notify_elaboration_requested(
    db: AsyncSession,
    slot_id: int,
    requester_id: int
) -> None:
    """Notify reviewer when the creator requests elaboration on their submitted review."""
    ctx = await fetch_slot_context(db, slot_id)
    if not ctx or not ctx.slot.reviewer_id:
        return

    # Fetch requester info
    requester = await ctx.db.get(User, requester_id)
    if not requester:
        return

    requester_name = requester.full_name or requester.email

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.slot.reviewer_id,
        notification_type=NotificationType.ELABORATION_REQUESTED,
        title="Elaboration requested on your review",
        message=f"{requester_name} would like more detail on your review for '{ctx.request_title}'. Please respond within 48 hours.",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "requester_id": requester.id,
            "requester_name": requester_name,
            "requester_avatar": requester.avatar_url,
            "elaboration_request": ctx.slot.elaboration_request,
            "elaboration_count": ctx.slot.elaboration_count,
            "elaboration_deadline": ctx.slot.elaboration_deadline.isoformat() if ctx.slot.elaboration_deadline else None,
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/reviewer/hub?slot={ctx.slot.id}",
        action_label="Respond to Request",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


@notification_trigger
async def notify_elaboration_submitted(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: int
) -> None:
    """Notify creator when reviewer responds to an elaboration request."""
    ctx = await fetch_slot_context(db, slot_id, reviewer_id=reviewer_id)
    if not ctx:
        return

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.review_request.user_id,
        notification_type=NotificationType.ELABORATION_SUBMITTED,
        title="Elaboration received on your review",
        message=f"{ctx.reviewer_name} has provided additional detail on their review for '{ctx.request_title}'.",
        data={
            "slot_id": ctx.slot.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "reviewer_id": ctx.reviewer.id,
            "reviewer_name": ctx.reviewer_name,
            "reviewer_avatar": ctx.reviewer_avatar,
            "elaboration_count": ctx.slot.elaboration_count,
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/reviewer/hub?slot={ctx.slot.id}&mode=creator",
        action_label="View Updated Review",
        entity_type=EntityType.REVIEW_SLOT,
        entity_id=ctx.slot.id,
    )


# ==================== Review Invitation Events ====================


@notification_trigger
async def notify_review_invitation(
    db: AsyncSession,
    review_request_id: int,
    inviter_id: int,
    invitee_id: int,
    message: Optional[str] = None
) -> None:
    """Notify a user when they receive a review invitation from a creator."""
    ctx = await fetch_request_context(
        db,
        review_request_id,
        extra_user_ids={"inviter": inviter_id, "invitee": invitee_id}
    )
    if not ctx:
        return

    inviter = ctx.extra_users.get("inviter")
    inviter_name = inviter.full_name or inviter.email if inviter else "Someone"

    available_slots = await count_available_slots(db, review_request_id)

    notification_message = f"{inviter_name} has invited you to review '{ctx.request_title}'."
    if message:
        truncated = message[:100] + "..." if len(message) > 100 else message
        notification_message += f' Message: "{truncated}"'

    await send_notification(
        ctx=ctx,
        recipient_id=invitee_id,
        notification_type=NotificationType.REVIEW_INVITATION,
        title=f"Review invitation from {inviter_name}",
        message=notification_message,
        data={
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "content_type": ctx.review_request.content_type.value if ctx.review_request.content_type else None,
            "review_type": ctx.review_request.review_type.value if ctx.review_request.review_type else None,
            "inviter_id": inviter.id if inviter else None,
            "inviter_name": inviter_name,
            "inviter_avatar": inviter.avatar_url if inviter else None,
            "available_slots": available_slots,
            "personal_message": message,
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/review/{ctx.review_request.id}",
        action_label="View Request",
        entity_type=EntityType.REVIEW_REQUEST,
        entity_id=ctx.review_request.id,
    )


# ==================== Slot Application Events ====================


@notification_trigger
async def notify_slot_application_received(
    db: AsyncSession,
    application_id: int,
    applicant_id: int
) -> None:
    """Notify creator when an expert applies for a paid review slot."""
    ctx = await fetch_application_context(db, application_id)
    if not ctx:
        return

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.review_request.user_id,
        notification_type=NotificationType.SLOT_APPLICATION_RECEIVED,
        title=f"New application for '{ctx.request_title}'",
        message=f"{ctx.reviewer_name} has applied to review your project. Review their profile and decide if you want to accept them.",
        data={
            "application_id": ctx.application.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "applicant_id": ctx.reviewer.id,
            "applicant_name": ctx.reviewer_name,
            "applicant_avatar": ctx.reviewer_avatar,
            "pitch_message": ctx.application.pitch_message[:200] if ctx.application.pitch_message else None,
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/review/{ctx.review_request.id}/applications",
        action_label="Review Applications",
        entity_type=EntityType.SLOT_APPLICATION,
        entity_id=ctx.application.id,
    )


@notification_trigger
async def notify_slot_application_accepted(
    db: AsyncSession,
    application_id: int,
    slot_id: int
) -> None:
    """Notify expert when their application is accepted."""
    ctx = await fetch_application_context(db, application_id)
    if not ctx:
        return

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.application.applicant_id,
        notification_type=NotificationType.SLOT_APPLICATION_ACCEPTED,
        title=f"Application accepted for '{ctx.request_title}'",
        message=f"{ctx.requester_name} has accepted your application! You can now start working on your review.",
        data={
            "application_id": ctx.application.id,
            "slot_id": slot_id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "creator_id": ctx.requester.id,
            "creator_name": ctx.requester_name,
        },
        priority=NotificationPriority.HIGH,
        action_url=f"/reviewer/review/{slot_id}",
        action_label="Start Review",
        entity_type=EntityType.SLOT_APPLICATION,
        entity_id=ctx.application.id,
    )


@notification_trigger
async def notify_slot_application_rejected(
    db: AsyncSession,
    application_id: int,
    rejection_reason: str = None
) -> None:
    """Notify expert when their application is rejected."""
    ctx = await fetch_application_context(db, application_id)
    if not ctx:
        return

    message = f"Your application for '{ctx.request_title}' was not accepted."
    if rejection_reason:
        message += f" Feedback: {rejection_reason[:200]}"
    else:
        message += " The creator has selected other reviewers for this project."

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.application.applicant_id,
        notification_type=NotificationType.SLOT_APPLICATION_REJECTED,
        title=f"Application not accepted for '{ctx.request_title}'",
        message=message,
        data={
            "application_id": ctx.application.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "rejection_reason": rejection_reason,
        },
        priority=NotificationPriority.MEDIUM,
        action_url="/browse",
        action_label="Find Other Reviews",
        entity_type=EntityType.SLOT_APPLICATION,
        entity_id=ctx.application.id,
    )


@notification_trigger
async def notify_slot_application_withdrawn(
    db: AsyncSession,
    application_id: int,
    applicant_id: int
) -> None:
    """Notify creator when an expert withdraws their application."""
    ctx = await fetch_application_context(db, application_id)
    if not ctx:
        return

    await send_notification(
        ctx=ctx,
        recipient_id=ctx.review_request.user_id,
        notification_type=NotificationType.SLOT_APPLICATION_WITHDRAWN,
        title=f"Application withdrawn for '{ctx.request_title}'",
        message=f"{ctx.reviewer_name} has withdrawn their application for your review request.",
        data={
            "application_id": ctx.application.id,
            "review_request_id": ctx.review_request.id,
            "review_request_title": ctx.request_title,
            "applicant_id": ctx.reviewer.id,
            "applicant_name": ctx.reviewer_name,
        },
        priority=NotificationPriority.LOW,
        action_url=f"/review/{ctx.review_request.id}/applications",
        action_label="View Applications",
        entity_type=EntityType.SLOT_APPLICATION,
        entity_id=ctx.application.id,
    )
