"""
Notification Service

Handles creation, delivery, and management of notifications across multiple channels.
Supports in-app, email, push, and SMS notifications with user preferences.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, update, delete

from app.models.notification import (
    Notification,
    NotificationPreferences,
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    EntityType,
    EmailDigestFrequency,
)
from app.models.user import User
from app.schemas.notification import NotificationCreate
from app.services.notifications.email_service import send_email

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Core notification service for managing all notification operations.

    Responsibilities:
    - Create and store notifications in database
    - Route notifications to appropriate channels
    - Respect user preferences and quiet hours
    - Manage notification lifecycle (read, archive, expire)
    - Generate email digests
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== Core Notification Creation ====================

    async def create_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        channels: Optional[List[NotificationChannel]] = None,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[int] = None,
        expires_at: Optional[datetime] = None,
    ) -> Notification:
        """
        Create a new notification and deliver it through appropriate channels.

        Args:
            user_id: ID of user to notify
            notification_type: Type of notification
            title: Notification title
            message: Notification message body
            data: Optional rich data payload
            priority: Priority level
            channels: Delivery channels (if None, uses default based on priority)
            action_url: Optional URL for action button
            action_label: Optional label for action button
            entity_type: Type of related entity
            entity_id: ID of related entity
            expires_at: Optional expiration time

        Returns:
            Created Notification object
        """
        try:
            # Get user preferences
            prefs = await self.get_or_create_preferences(user_id)

            # Determine channels if not specified
            if channels is None:
                channels = self._get_default_channels(priority)

            # Filter channels based on user preferences
            enabled_channels = await self._filter_channels_by_preferences(
                channels, prefs, notification_type, priority
            )

            # Create notification in database
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=message,
                data=data,
                priority=priority,
                channels=[c.value for c in enabled_channels],
                action_url=action_url,
                action_label=action_label,
                entity_type=entity_type,
                entity_id=entity_id,
                expires_at=expires_at,
                read=False,
                archived=False,
            )

            self.db.add(notification)
            await self.db.commit()
            await self.db.refresh(notification)

            logger.info(
                f"Created notification {notification.id} for user {user_id}: "
                f"{notification_type.value} (channels: {enabled_channels})"
            )

            # Deliver notification through enabled channels
            await self._deliver_notification(notification, enabled_channels, prefs)

            return notification

        except Exception as e:
            logger.error(f"Error creating notification for user {user_id}: {e}")
            await self.db.rollback()
            raise

    async def create_bulk_notifications(
        self,
        user_ids: List[int],
        notification_type: NotificationType,
        title: str,
        message: str,
        **kwargs
    ) -> List[Notification]:
        """
        Create notifications for multiple users (e.g., announcements).

        Args:
            user_ids: List of user IDs to notify
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            **kwargs: Additional arguments passed to create_notification

        Returns:
            List of created Notification objects
        """
        notifications = []

        for user_id in user_ids:
            try:
                notification = await self.create_notification(
                    user_id=user_id,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    **kwargs
                )
                notifications.append(notification)
            except Exception as e:
                logger.error(f"Error creating bulk notification for user {user_id}: {e}")
                continue

        logger.info(f"Created {len(notifications)} bulk notifications of type {notification_type.value}")
        return notifications

    # ==================== Channel Delivery ====================

    async def _deliver_notification(
        self,
        notification: Notification,
        channels: List[NotificationChannel],
        prefs: NotificationPreferences,
    ) -> None:
        """
        Deliver notification through specified channels.

        Args:
            notification: Notification to deliver
            channels: Channels to deliver through
            prefs: User preferences
        """
        for channel in channels:
            try:
                if channel == NotificationChannel.IN_APP:
                    # Already saved to database, nothing more to do
                    pass

                elif channel == NotificationChannel.EMAIL:
                    await self._send_email_notification(notification, prefs)

                elif channel == NotificationChannel.PUSH:
                    await self._send_push_notification(notification)

                elif channel == NotificationChannel.SMS:
                    await self._send_sms_notification(notification)

            except Exception as e:
                logger.error(
                    f"Error delivering notification {notification.id} "
                    f"via {channel.value}: {e}"
                )

    async def _send_email_notification(
        self,
        notification: Notification,
        prefs: NotificationPreferences,
    ) -> None:
        """
        Send notification via email.

        Respects email digest preferences - either sends immediately or queues for digest.
        """
        # Check if should send immediately or queue for digest
        if prefs.email_digest_frequency == EmailDigestFrequency.IMMEDIATE:
            await self._send_immediate_email(notification)
        else:
            # Notification is already in database and will be included in next digest
            logger.info(
                f"Notification {notification.id} queued for email digest "
                f"({prefs.email_digest_frequency.value})"
            )

    async def _send_immediate_email(self, notification: Notification) -> None:
        """Send immediate email for notification"""
        try:
            # Get user email
            result = await self.db.execute(
                select(User).where(User.id == notification.user_id)
            )
            user = result.scalar_one_or_none()

            if not user:
                logger.error(f"User {notification.user_id} not found for email notification")
                return

            # Send the email
            success = await send_email(
                to_email=user.email,
                subject=f"Critvue: {notification.title}",
                html_content=self._generate_email_html(notification),
                text_content=notification.message,
            )

            if success:
                logger.info(f"Email notification {notification.id} sent to {user.email}")
            else:
                logger.warning(f"Failed to send email notification {notification.id} to {user.email}")

        except Exception as e:
            logger.error(f"Error sending email for notification {notification.id}: {e}")

    def _generate_email_html(self, notification: Notification) -> str:
        """Generate HTML email template for notification"""
        action_button = ""
        if notification.action_url and notification.action_label:
            action_button = f"""
            <p style="margin: 20px 0;">
                <a href="{notification.action_url}"
                   style="background-color: #3B82F6; color: white; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    {notification.action_label}
                </a>
            </p>
            """

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                     background-color: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white;
                        border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 16px 0;">
                    {notification.title}
                </h1>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                    {notification.message}
                </p>
                {action_button}
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                    You received this email because you have notifications enabled on Critvue.
                    <a href="https://critvue.com/settings/notifications"
                       style="color: #3B82F6; text-decoration: none;">
                        Manage preferences
                    </a>
                </p>
            </div>
        </body>
        </html>
        """

    async def _send_push_notification(self, notification: Notification) -> None:
        """Send push notification (placeholder for future implementation)"""
        logger.info(f"Push notification {notification.id} - not yet implemented")
        # TODO: Implement push notification via Firebase Cloud Messaging or similar
        pass

    async def _send_sms_notification(self, notification: Notification) -> None:
        """Send SMS notification (placeholder for future implementation)"""
        logger.info(f"SMS notification {notification.id} - not yet implemented")
        # TODO: Implement SMS via Twilio or similar
        pass

    # ==================== Notification Queries ====================

    async def get_notifications(
        self,
        user_id: int,
        read: Optional[bool] = None,
        archived: Optional[bool] = None,
        notification_type: Optional[NotificationType] = None,
        priority: Optional[NotificationPriority] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Notification]:
        """
        Get notifications for a user with optional filters.

        Args:
            user_id: User ID to get notifications for
            read: Filter by read status
            archived: Filter by archived status
            notification_type: Filter by notification type
            priority: Filter by priority
            limit: Maximum number of notifications to return
            offset: Number of notifications to skip

        Returns:
            List of Notification objects
        """
        query = select(Notification).where(Notification.user_id == user_id)

        # Apply filters
        if read is not None:
            query = query.where(Notification.read == read)

        if archived is not None:
            query = query.where(Notification.archived == archived)

        if notification_type:
            query = query.where(Notification.type == notification_type)

        if priority:
            query = query.where(Notification.priority == priority)

        # Order by created_at descending (newest first)
        query = query.order_by(desc(Notification.created_at))

        # Apply pagination
        query = query.limit(limit).offset(offset)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_notification_count(
        self,
        user_id: int,
        read: Optional[bool] = None,
        archived: Optional[bool] = None,
        notification_type: Optional[NotificationType] = None,
        priority: Optional[NotificationPriority] = None,
    ) -> int:
        """
        Get count of notifications matching filters using efficient SQL COUNT.

        Args:
            user_id: User ID to count notifications for
            read: Filter by read status
            archived: Filter by archived status
            notification_type: Filter by notification type
            priority: Filter by priority

        Returns:
            Count of matching notifications
        """
        query = select(func.count(Notification.id)).where(Notification.user_id == user_id)

        if read is not None:
            query = query.where(Notification.read == read)

        if archived is not None:
            query = query.where(Notification.archived == archived)

        if notification_type:
            query = query.where(Notification.type == notification_type)

        if priority:
            query = query.where(Notification.priority == priority)

        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_notification_by_id(
        self,
        notification_id: int,
        user_id: int
    ) -> Optional[Notification]:
        """
        Get a specific notification by ID with ownership check.

        Args:
            notification_id: ID of notification to retrieve
            user_id: User ID for ownership verification

        Returns:
            Notification if found and owned by user, None otherwise
        """
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.id == notification_id,
                    Notification.user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_unread_count(self, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                and_(
                    Notification.user_id == user_id,
                    Notification.read == False,
                    Notification.archived == False,
                )
            )
        )
        return result.scalar_one()

    async def get_notification_stats(self, user_id: int) -> Dict[str, Any]:
        """
        Get notification statistics using efficient SQL queries.

        Returns dict with:
        - total: Total notifications
        - unread: Unread count
        - archived: Archived count
        - by_priority: Dict of counts by priority
        - by_type: Dict of counts by type
        """
        # Total count
        total_result = await self.db.execute(
            select(func.count(Notification.id)).where(Notification.user_id == user_id)
        )
        total = total_result.scalar_one()

        # Unread count
        unread_result = await self.db.execute(
            select(func.count(Notification.id)).where(
                and_(Notification.user_id == user_id, Notification.read == False)
            )
        )
        unread = unread_result.scalar_one()

        # Archived count
        archived_result = await self.db.execute(
            select(func.count(Notification.id)).where(
                and_(Notification.user_id == user_id, Notification.archived == True)
            )
        )
        archived = archived_result.scalar_one()

        # Count by priority using GROUP BY
        priority_result = await self.db.execute(
            select(Notification.priority, func.count(Notification.id))
            .where(Notification.user_id == user_id)
            .group_by(Notification.priority)
        )
        by_priority = {row[0].value: row[1] for row in priority_result.all()}

        # Count by type using GROUP BY
        type_result = await self.db.execute(
            select(Notification.type, func.count(Notification.id))
            .where(Notification.user_id == user_id)
            .group_by(Notification.type)
        )
        by_type = {row[0].value: row[1] for row in type_result.all()}

        return {
            "total": total,
            "unread": unread,
            "archived": archived,
            "by_priority": by_priority,
            "by_type": by_type,
        }

    async def mark_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Mark a notification as read"""
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.id == notification_id,
                    Notification.user_id == user_id,
                )
            )
        )
        notification = result.scalar_one_or_none()

        if notification:
            notification.mark_as_read()
            await self.db.commit()
            await self.db.refresh(notification)

        return notification

    async def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user. Returns count of updated notifications."""
        # Use bulk UPDATE for efficiency
        stmt = (
            update(Notification)
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.read == False,
                )
            )
            .values(read=True, read_at=datetime.utcnow())
        )

        result = await self.db.execute(stmt)
        count = result.rowcount

        if count > 0:
            await self.db.commit()
            logger.info(f"Marked {count} notifications as read for user {user_id}")

        return count

    async def archive_notification(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Archive a notification"""
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.id == notification_id,
                    Notification.user_id == user_id,
                )
            )
        )
        notification = result.scalar_one_or_none()

        if notification:
            notification.archive()
            await self.db.commit()
            await self.db.refresh(notification)

        return notification

    async def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a notification"""
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.id == notification_id,
                    Notification.user_id == user_id,
                )
            )
        )
        notification = result.scalar_one_or_none()

        if notification:
            await self.db.delete(notification)
            await self.db.commit()
            return True

        return False

    # ==================== Preferences Management ====================

    async def get_or_create_preferences(self, user_id: int) -> NotificationPreferences:
        """Get user's notification preferences or create default if not exists"""
        result = await self.db.execute(
            select(NotificationPreferences).where(
                NotificationPreferences.user_id == user_id
            )
        )
        prefs = result.scalar_one_or_none()

        if not prefs:
            prefs = NotificationPreferences(user_id=user_id)
            self.db.add(prefs)
            await self.db.commit()
            await self.db.refresh(prefs)
            logger.info(f"Created default notification preferences for user {user_id}")

        return prefs

    async def update_preferences(
        self,
        user_id: int,
        **updates
    ) -> NotificationPreferences:
        """Update user's notification preferences"""
        prefs = await self.get_or_create_preferences(user_id)

        for key, value in updates.items():
            if value is not None and hasattr(prefs, key):
                setattr(prefs, key, value)

        prefs.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(prefs)

        logger.info(f"Updated notification preferences for user {user_id}")
        return prefs

    # ==================== Helper Methods ====================

    def _get_default_channels(self, priority: NotificationPriority) -> List[NotificationChannel]:
        """Get default notification channels based on priority"""
        if priority == NotificationPriority.URGENT:
            return [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH]
        elif priority == NotificationPriority.HIGH:
            return [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        elif priority == NotificationPriority.MEDIUM:
            return [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        else:  # LOW
            return [NotificationChannel.IN_APP]

    async def _filter_channels_by_preferences(
        self,
        channels: List[NotificationChannel],
        prefs: NotificationPreferences,
        notification_type: NotificationType,
        priority: NotificationPriority,
    ) -> List[NotificationChannel]:
        """Filter channels based on user preferences and quiet hours"""
        enabled_channels = []

        for channel in channels:
            # Always include in-app notifications
            if channel == NotificationChannel.IN_APP:
                enabled_channels.append(channel)
                continue

            # Check global channel toggle
            if channel == NotificationChannel.EMAIL and not prefs.email_enabled:
                continue
            elif channel == NotificationChannel.PUSH and not prefs.push_enabled:
                continue
            elif channel == NotificationChannel.SMS and not prefs.sms_enabled:
                continue

            # Check quiet hours for push/SMS (not email)
            if channel in [NotificationChannel.PUSH, NotificationChannel.SMS]:
                if prefs.is_quiet_hours():
                    # Only send urgent notifications during quiet hours
                    if priority != NotificationPriority.URGENT:
                        continue

            enabled_channels.append(channel)

        return enabled_channels

    # ==================== Cleanup ====================

    async def cleanup_expired_notifications(self) -> int:
        """Delete expired notifications. Returns count of deleted notifications."""
        # Use bulk DELETE for efficiency
        stmt = (
            delete(Notification)
            .where(
                and_(
                    Notification.expires_at.is_not(None),
                    Notification.expires_at < datetime.utcnow(),
                )
            )
        )

        result = await self.db.execute(stmt)
        count = result.rowcount

        if count > 0:
            await self.db.commit()
            logger.info(f"Deleted {count} expired notifications")

        return count
