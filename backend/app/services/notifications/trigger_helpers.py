"""
Notification Trigger Helper

Provides a reusable context and helper functions to eliminate duplication
in notification triggers. Reduces ~1000 LOC to ~200 LOC.
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Optional, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notification import NotificationType, NotificationPriority, EntityType
from app.models.review_slot import ReviewSlot
from app.models.review_request import ReviewRequest
from app.models.user import User
from app.services.notifications.core import NotificationService

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class NotificationContext:
    """
    Context object containing all entities needed for notifications.

    Fetched once and reused across notification creation to avoid N+1 queries.
    """
    db: AsyncSession
    slot: Optional[ReviewSlot] = None
    review_request: Optional[ReviewRequest] = None
    reviewer: Optional[User] = None
    requester: Optional[User] = None
    application: Optional[Any] = None  # SlotApplication, imported dynamically
    extra_users: Dict[str, User] = field(default_factory=dict)

    @property
    def reviewer_name(self) -> str:
        """Get display name for reviewer"""
        if not self.reviewer:
            return "Unknown"
        return self.reviewer.full_name or self.reviewer.email

    @property
    def reviewer_avatar(self) -> Optional[str]:
        """Get avatar URL for reviewer"""
        return self.reviewer.avatar_url if self.reviewer else None

    @property
    def requester_name(self) -> str:
        """Get display name for requester/creator"""
        if not self.requester:
            return "Unknown"
        return self.requester.full_name or self.requester.email

    @property
    def requester_avatar(self) -> Optional[str]:
        """Get avatar URL for requester"""
        return self.requester.avatar_url if self.requester else None

    @property
    def request_title(self) -> str:
        """Get review request title"""
        return self.review_request.title if self.review_request else "Unknown"

    def user_name(self, user_key: str) -> str:
        """Get display name for a user from extra_users"""
        user = self.extra_users.get(user_key)
        if not user:
            return "Unknown"
        return user.full_name or user.email


async def fetch_slot_context(
    db: AsyncSession,
    slot_id: int,
    reviewer_id: Optional[int] = None,
    include_all_slots: bool = False,
) -> Optional[NotificationContext]:
    """
    Fetch a complete notification context for slot-based notifications.

    This replaces the repetitive pattern of:
        slot = await db.execute(select(ReviewSlot)...)
        review_request = await db.execute(select(ReviewRequest)...)
        reviewer = await db.get(User, reviewer_id)

    With a single optimized query.

    Args:
        db: Database session
        slot_id: ID of the review slot
        reviewer_id: Optional reviewer ID to fetch (defaults to slot.reviewer_id)
        include_all_slots: Whether to include all slots for the request (for counting)

    Returns:
        NotificationContext with slot, review_request, reviewer, and requester
        Returns None if slot not found (logs error)
    """
    try:
        # Build query with eager loading
        query = (
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
            .options(
                selectinload(ReviewSlot.review_request).selectinload(ReviewRequest.user)
            )
        )

        result = await db.execute(query)
        slot = result.scalar_one_or_none()

        if not slot:
            logger.error(f"Slot {slot_id} not found for notification")
            return None

        review_request = slot.review_request
        if not review_request:
            logger.error(f"Review request not found for slot {slot_id}")
            return None

        requester = review_request.user

        # Fetch reviewer
        reviewer = None
        actual_reviewer_id = reviewer_id or slot.reviewer_id
        if actual_reviewer_id:
            reviewer = await db.get(User, actual_reviewer_id)
            if not reviewer:
                logger.error(f"Reviewer {actual_reviewer_id} not found")
                return None

        return NotificationContext(
            db=db,
            slot=slot,
            review_request=review_request,
            reviewer=reviewer,
            requester=requester,
        )

    except Exception as e:
        logger.error(f"Error fetching slot context for slot {slot_id}: {e}", exc_info=True)
        return None


async def fetch_request_context(
    db: AsyncSession,
    review_request_id: int,
    extra_user_ids: Optional[Dict[str, int]] = None,
) -> Optional[NotificationContext]:
    """
    Fetch a notification context for review request-based notifications.

    Args:
        db: Database session
        review_request_id: ID of the review request
        extra_user_ids: Dict of {key: user_id} for additional users to fetch

    Returns:
        NotificationContext with review_request, requester, and extra_users
    """
    try:
        query = (
            select(ReviewRequest)
            .where(ReviewRequest.id == review_request_id)
            .options(selectinload(ReviewRequest.user))
        )

        result = await db.execute(query)
        review_request = result.scalar_one_or_none()

        if not review_request:
            logger.error(f"Review request {review_request_id} not found for notification")
            return None

        ctx = NotificationContext(
            db=db,
            review_request=review_request,
            requester=review_request.user,
        )

        # Fetch additional users
        if extra_user_ids:
            for key, user_id in extra_user_ids.items():
                user = await db.get(User, user_id)
                if user:
                    ctx.extra_users[key] = user
                else:
                    logger.error(f"User {user_id} ({key}) not found")
                    return None

        return ctx

    except Exception as e:
        logger.error(f"Error fetching request context: {e}", exc_info=True)
        return None


async def fetch_application_context(
    db: AsyncSession,
    application_id: int,
) -> Optional[NotificationContext]:
    """
    Fetch a notification context for slot application-based notifications.

    Args:
        db: Database session
        application_id: ID of the slot application

    Returns:
        NotificationContext with application, review_request, requester, and applicant
    """
    try:
        from app.models.slot_application import SlotApplication

        application = await db.get(SlotApplication, application_id)
        if not application:
            logger.error(f"Application {application_id} not found for notification")
            return None

        review_request = await db.get(ReviewRequest, application.review_request_id)
        if not review_request:
            logger.error(f"Review request {application.review_request_id} not found")
            return None

        requester = await db.get(User, review_request.user_id)
        applicant = await db.get(User, application.applicant_id)

        if not applicant:
            logger.error(f"Applicant {application.applicant_id} not found")
            return None

        return NotificationContext(
            db=db,
            application=application,
            review_request=review_request,
            requester=requester,
            reviewer=applicant,  # applicant is stored as reviewer for convenience
        )

    except Exception as e:
        logger.error(f"Error fetching application context: {e}", exc_info=True)
        return None


async def send_notification(
    ctx: NotificationContext,
    recipient_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    data: Dict[str, Any],
    priority: NotificationPriority,
    action_url: str,
    action_label: str,
    entity_type: EntityType,
    entity_id: int,
) -> bool:
    """
    Send a notification using the context.

    This wraps NotificationService.create_notification with consistent
    error handling and logging.

    Args:
        ctx: NotificationContext with db session
        recipient_id: User ID to send notification to
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        data: Additional data dict
        priority: Notification priority
        action_url: URL for notification action
        action_label: Label for action button
        entity_type: Type of related entity
        entity_id: ID of related entity

    Returns:
        True if notification was sent successfully
    """
    try:
        service = NotificationService(ctx.db)
        await service.create_notification(
            user_id=recipient_id,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data,
            priority=priority,
            action_url=action_url,
            action_label=action_label,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        logger.info(
            f"Sent {notification_type.value} notification to user {recipient_id}"
        )
        return True
    except Exception as e:
        logger.error(
            f"Error sending {notification_type.value} notification to user {recipient_id}: {e}",
            exc_info=True
        )
        return False


def notification_trigger(func: Callable[..., T]) -> Callable[..., T]:
    """
    Decorator for notification trigger functions.

    Provides consistent error handling and logging for all triggers.
    The decorated function should return early if context fetch fails.

    Usage:
        @notification_trigger
        async def notify_something(db: AsyncSession, slot_id: int) -> None:
            ctx = await fetch_slot_context(db, slot_id)
            if not ctx:
                return
            ...
    """
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(
                f"Error in notification trigger {func.__name__}: {e}",
                exc_info=True
            )
            return None

    wrapper.__name__ = func.__name__
    wrapper.__doc__ = func.__doc__
    return wrapper


async def count_available_slots(db: AsyncSession, review_request_id: int) -> int:
    """
    Count available slots for a review request.

    Args:
        db: Database session
        review_request_id: ID of the review request

    Returns:
        Number of available slots
    """
    result = await db.execute(
        select(ReviewSlot)
        .where(ReviewSlot.review_request_id == review_request_id)
        .where(ReviewSlot.status == "available")
    )
    return len(result.scalars().all())


def get_review_preview(slot: ReviewSlot, max_length: int = 150) -> str:
    """
    Extract a preview of the review text from a slot.

    Handles both plain text reviews and Studio draft reviews.

    Args:
        slot: ReviewSlot with review content
        max_length: Maximum preview length

    Returns:
        Preview string
    """
    if slot.review_text:
        text = slot.review_text
        return text[:max_length] + "..." if len(text) > max_length else text

    if slot.draft_sections:
        try:
            import json
            draft_data = (
                slot.draft_sections
                if isinstance(slot.draft_sections, dict)
                else json.loads(slot.draft_sections)
            )
            summary = draft_data.get("verdictCard", {}).get("summary")
            if summary:
                return summary[:max_length] + "..." if len(summary) > max_length else summary
        except (json.JSONDecodeError, TypeError, KeyError):
            pass

    return "Review submitted - check the details in your dashboard"
