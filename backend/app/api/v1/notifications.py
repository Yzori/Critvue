"""
Notification API Endpoints

REST API for managing user notifications and preferences.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import NotificationType, NotificationPriority, EntityType
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationStatsResponse,
    NotificationMarkRead,
    NotificationMarkAllRead,
    NotificationArchive,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
)
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ==================== Notification Endpoints ====================

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    read: Optional[bool] = Query(None, description="Filter by read status"),
    archived: Optional[bool] = Query(None, description="Filter by archived status"),
    notification_type: Optional[NotificationType] = Query(None, description="Filter by type"),
    priority: Optional[NotificationPriority] = Query(None, description="Filter by priority"),
    entity_type: Optional[EntityType] = Query(None, description="Filter by entity type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated list of notifications for the current user.

    Supports filtering by:
    - Read/unread status
    - Archived status
    - Notification type
    - Priority level
    - Entity type

    Returns notifications in reverse chronological order (newest first).
    """
    try:
        service = NotificationService(db)

        # Calculate offset
        offset = (page - 1) * page_size

        # Get notifications
        notifications = await service.get_notifications(
            user_id=current_user.id,
            read=read,
            archived=archived,
            notification_type=notification_type,
            priority=priority,
            limit=page_size,
            offset=offset,
        )

        # Get total count using efficient SQL COUNT query
        total = await service.get_notification_count(
            user_id=current_user.id,
            read=read,
            archived=archived,
            notification_type=notification_type,
            priority=priority,
        )

        # Get unread count
        unread_count = await service.get_unread_count(current_user.id)

        # Convert to response format
        notification_responses = [
            NotificationResponse.model_validate(n) for n in notifications
        ]

        # Calculate total pages
        total_pages = (total + page_size - 1) // page_size

        return NotificationListResponse(
            notifications=notification_responses,
            total=total,
            unread_count=unread_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    except Exception as e:
        logger.error(f"Error getting notifications for user {current_user.id}: {e}")
        raise InternalError(message="Failed to retrieve notifications"
        )


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get count of unread notifications for the current user.

    Useful for displaying notification badge count.
    """
    try:
        service = NotificationService(db)
        count = await service.get_unread_count(current_user.id)

        return {"unread_count": count}

    except Exception as e:
        logger.error(f"Error getting unread count for user {current_user.id}: {e}")
        raise InternalError(message="Failed to get unread count"
        )


@router.get("/stats", response_model=NotificationStatsResponse)
async def get_notification_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get notification statistics for the current user.

    Returns:
    - Total notifications
    - Unread count
    - Archived count
    - Breakdown by priority
    - Breakdown by type
    """
    try:
        service = NotificationService(db)

        # Use efficient SQL queries for stats
        stats = await service.get_notification_stats(current_user.id)

        return NotificationStatsResponse(
            total=stats["total"],
            unread=stats["unread"],
            archived=stats["archived"],
            by_priority=stats["by_priority"],
            by_type=stats["by_type"],
        )

    except Exception as e:
        logger.error(f"Error getting notification stats for user {current_user.id}: {e}")
        raise InternalError(message="Failed to get notification statistics"
        )


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific notification by ID"""
    try:
        service = NotificationService(db)

        # Use direct lookup by ID
        notification = await service.get_notification_by_id(notification_id, current_user.id)

        if not notification:
            raise NotFoundError(message="Notification not found"
            )

        return NotificationResponse.model_validate(notification)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting notification {notification_id}: {e}")
        raise InternalError(message="Failed to retrieve notification"
        )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    data: NotificationMarkRead,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a notification as read or unread.

    Send {"read": true} to mark as read, {"read": false} to mark as unread.
    """
    try:
        service = NotificationService(db)

        if data.read:
            notification = await service.mark_as_read(notification_id, current_user.id)
        else:
            # For marking as unread, use direct lookup
            notification = await service.get_notification_by_id(notification_id, current_user.id)

            if notification:
                notification.read = False
                notification.read_at = None
                await db.commit()
                await db.refresh(notification)

        if not notification:
            raise NotFoundError(message="Notification not found"
            )

        return NotificationResponse.model_validate(notification)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification {notification_id} as read: {e}")
        raise InternalError(message="Failed to update notification"
        )


@router.post("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    data: NotificationMarkAllRead,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all unread notifications as read for the current user.

    Returns the count of notifications that were marked as read.
    """
    try:
        service = NotificationService(db)
        count = await service.mark_all_as_read(current_user.id)

        return {
            "message": f"Marked {count} notifications as read",
            "count": count
        }

    except Exception as e:
        logger.error(f"Error marking all notifications as read for user {current_user.id}: {e}")
        raise InternalError(message="Failed to mark all notifications as read"
        )


@router.patch("/{notification_id}/archive", response_model=NotificationResponse)
async def archive_notification(
    notification_id: int,
    data: NotificationArchive,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Archive or unarchive a notification.

    Send {"archived": true} to archive, {"archived": false} to unarchive.
    """
    try:
        service = NotificationService(db)

        if data.archived:
            notification = await service.archive_notification(notification_id, current_user.id)
        else:
            # For unarchiving, use direct lookup
            notification = await service.get_notification_by_id(notification_id, current_user.id)

            if notification:
                notification.archived = False
                await db.commit()
                await db.refresh(notification)

        if not notification:
            raise NotFoundError(message="Notification not found"
            )

        return NotificationResponse.model_validate(notification)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving notification {notification_id}: {e}")
        raise InternalError(message="Failed to archive notification"
        )


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a notification permanently.

    This action cannot be undone.
    """
    try:
        service = NotificationService(db)
        success = await service.delete_notification(notification_id, current_user.id)

        if not success:
            raise NotFoundError(message="Notification not found"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification {notification_id}: {e}")
        raise InternalError(message="Failed to delete notification"
        )


# ==================== Preference Endpoints ====================

@router.get("/preferences/me", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get notification preferences for the current user.

    Returns settings for:
    - Channel toggles (email, push, SMS)
    - Email digest frequency
    - Quiet hours
    - Category-specific preferences
    """
    try:
        service = NotificationService(db)
        prefs = await service.get_or_create_preferences(current_user.id)

        return NotificationPreferencesResponse.model_validate(prefs)

    except Exception as e:
        logger.error(f"Error getting notification preferences for user {current_user.id}: {e}")
        raise InternalError(message="Failed to retrieve notification preferences"
        )


@router.patch("/preferences/me", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    updates: NotificationPreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update notification preferences for the current user.

    Only the fields you provide will be updated. All other fields remain unchanged.

    Example:
    {
      "email_enabled": true,
      "push_enabled": false,
      "email_digest_frequency": "daily",
      "quiet_hours_enabled": true,
      "quiet_hours_start": 22,
      "quiet_hours_end": 8
    }
    """
    try:
        service = NotificationService(db)

        # Convert Pydantic model to dict, excluding None values
        update_data = updates.model_dump(exclude_none=True)

        prefs = await service.update_preferences(current_user.id, **update_data)

        logger.info(f"Updated notification preferences for user {current_user.id}")

        return NotificationPreferencesResponse.model_validate(prefs)

    except Exception as e:
        logger.error(f"Error updating notification preferences for user {current_user.id}: {e}")
        raise InternalError(message="Failed to update notification preferences"
        )
