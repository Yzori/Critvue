"""
Email Digest Service

Handles sending batched email digests (daily and weekly) to users
based on their notification preferences.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.notification import (
    Notification,
    NotificationPreferences,
    EmailDigestFrequency,
)
from app.models.user import User
from app.services.email import send_digest_email
from app.services.unsubscribe import get_unsubscribe_url_for_user

logger = logging.getLogger(__name__)


async def get_users_for_digest(
    db: AsyncSession,
    frequency: EmailDigestFrequency,
    current_hour: int,
    current_day: int,  # 1=Monday, 7=Sunday
) -> List[User]:
    """
    Get users who should receive digest at this time.

    Args:
        db: Database session
        frequency: Digest frequency (DAILY or WEEKLY)
        current_hour: Current hour (0-23)
        current_day: Current day of week (1=Monday)

    Returns:
        List of users to send digest to
    """
    # Build query for notification preferences
    query = (
        select(NotificationPreferences)
        .where(
            and_(
                NotificationPreferences.email_enabled == True,
                NotificationPreferences.email_digest_frequency == frequency,
                NotificationPreferences.email_digest_time == current_hour,
            )
        )
    )

    # For weekly digest, also check the day
    if frequency == EmailDigestFrequency.WEEKLY:
        query = query.where(NotificationPreferences.email_digest_day == current_day)

    result = await db.execute(query)
    preferences = result.scalars().all()

    # Get user objects
    user_ids = [p.user_id for p in preferences]
    if not user_ids:
        return []

    users_result = await db.execute(
        select(User).where(
            and_(
                User.id.in_(user_ids),
                User.is_active == True,
            )
        )
    )
    return list(users_result.scalars().all())


async def get_notifications_for_digest(
    db: AsyncSession,
    user_id: int,
    since: datetime,
) -> List[Notification]:
    """
    Get unread notifications for a user since a given time.

    Args:
        db: Database session
        user_id: User ID
        since: Start datetime for notification collection

    Returns:
        List of notifications to include in digest
    """
    result = await db.execute(
        select(Notification)
        .where(
            and_(
                Notification.user_id == user_id,
                Notification.created_at >= since,
                Notification.archived == False,
            )
        )
        .order_by(Notification.created_at.desc())
        .limit(50)  # Limit to prevent huge digests
    )
    return list(result.scalars().all())


def notification_to_dict(notification: Notification) -> Dict[str, Any]:
    """Convert notification to dictionary for email template."""
    return {
        "title": notification.title,
        "message": notification.message,
        "action_url": notification.action_url,
        "action_label": notification.action_label,
        "priority": notification.priority.value if notification.priority else "medium",
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
    }


async def send_daily_digests(db: AsyncSession) -> int:
    """
    Send daily email digests to all users who have daily digests enabled.

    Args:
        db: Database session

    Returns:
        Number of digests sent
    """
    now = datetime.now(timezone.utc)
    current_hour = now.hour
    current_day = now.isoweekday()  # 1=Monday, 7=Sunday

    # Get users for daily digest at this hour
    users = await get_users_for_digest(
        db, EmailDigestFrequency.DAILY, current_hour, current_day
    )

    if not users:
        logger.debug(f"No users to send daily digest to at hour {current_hour}")
        return 0

    # Calculate "since" time (24 hours ago)
    since = now - timedelta(hours=24)

    sent_count = 0
    for user in users:
        try:
            # Get notifications for this user
            notifications = await get_notifications_for_digest(db, user.id, since)

            if not notifications:
                logger.debug(f"No notifications for user {user.id} daily digest")
                continue

            # Get unsubscribe URL
            unsubscribe_url = await get_unsubscribe_url_for_user(db, user.id)

            # Convert notifications to dict format
            notification_dicts = [notification_to_dict(n) for n in notifications]

            # Send digest email
            success = await send_digest_email(
                to_email=user.email,
                user_name=user.full_name,
                notifications=notification_dicts,
                digest_type="Daily",
                digest_period="day",
            )

            if success:
                sent_count += 1
                logger.info(f"Sent daily digest to {user.email} with {len(notifications)} notifications")
            else:
                logger.warning(f"Failed to send daily digest to {user.email}")

        except Exception as e:
            logger.error(f"Error sending daily digest to user {user.id}: {e}", exc_info=True)
            continue

    return sent_count


async def send_weekly_digests(db: AsyncSession) -> int:
    """
    Send weekly email digests to all users who have weekly digests enabled.

    Args:
        db: Database session

    Returns:
        Number of digests sent
    """
    now = datetime.now(timezone.utc)
    current_hour = now.hour
    current_day = now.isoweekday()  # 1=Monday, 7=Sunday

    # Get users for weekly digest at this hour and day
    users = await get_users_for_digest(
        db, EmailDigestFrequency.WEEKLY, current_hour, current_day
    )

    if not users:
        logger.debug(f"No users to send weekly digest to at hour {current_hour} day {current_day}")
        return 0

    # Calculate "since" time (7 days ago)
    since = now - timedelta(days=7)

    sent_count = 0
    for user in users:
        try:
            # Get notifications for this user
            notifications = await get_notifications_for_digest(db, user.id, since)

            if not notifications:
                logger.debug(f"No notifications for user {user.id} weekly digest")
                continue

            # Get unsubscribe URL
            unsubscribe_url = await get_unsubscribe_url_for_user(db, user.id)

            # Convert notifications to dict format
            notification_dicts = [notification_to_dict(n) for n in notifications]

            # Send digest email
            success = await send_digest_email(
                to_email=user.email,
                user_name=user.full_name,
                notifications=notification_dicts,
                digest_type="Weekly",
                digest_period="week",
            )

            if success:
                sent_count += 1
                logger.info(f"Sent weekly digest to {user.email} with {len(notifications)} notifications")
            else:
                logger.warning(f"Failed to send weekly digest to {user.email}")

        except Exception as e:
            logger.error(f"Error sending weekly digest to user {user.id}: {e}", exc_info=True)
            continue

    return sent_count
