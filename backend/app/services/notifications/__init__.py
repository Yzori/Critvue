"""
Notifications Services Module

This module consolidates all notification-related services:
- core: Main NotificationService for managing in-app notifications
- email_service: Email delivery service (Resend integration)
- email_digest: Daily/weekly email digest functionality
- triggers: Event-based notification triggers
- trigger_helpers: Helper functions for notification triggers
- payment_triggers: Payment-specific notification triggers

Usage:
    from app.services.notifications import NotificationService
    from app.services.notifications import send_email, send_password_reset_email
    from app.services.notifications import notify_review_submitted
"""

# Core notification service
from app.services.notifications.core import NotificationService

# Email service and functions
from app.services.notifications.email_service import (
    EmailService,
    get_email_service,
    send_email,
    send_email_verification,
    send_password_reset_email,
    send_payment_failed_email,
    send_digest_email,
    send_welcome_email,
    send_review_completed_email,
)

# Email digest
from app.services.notifications.email_digest import (
    send_daily_digests,
    send_weekly_digests,
)

# Notification triggers
from app.services.notifications.triggers import (
    notify_review_submitted,
    notify_review_accepted,
    notify_review_rejected,
    notify_review_invitation,
    notify_slot_claimed,
    notify_slot_abandoned,
    notify_elaboration_submitted,
    notify_dispute_created,
    notify_dispute_resolved,
)

# Trigger helpers
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

# Payment notification triggers
from app.services.notifications.payment_triggers import (
    notify_payment_captured,
    notify_payment_released,
    notify_payment_failed,
    notify_refund_issued,
)

__all__ = [
    # Core
    "NotificationService",
    # Email
    "EmailService",
    "get_email_service",
    "send_email",
    "send_email_verification",
    "send_password_reset_email",
    "send_payment_failed_email",
    "send_digest_email",
    "send_welcome_email",
    "send_review_completed_email",
    # Digest
    "send_daily_digests",
    "send_weekly_digests",
    # Triggers
    "notify_review_submitted",
    "notify_review_accepted",
    "notify_review_rejected",
    "notify_review_invitation",
    "notify_slot_claimed",
    "notify_slot_abandoned",
    "notify_elaboration_submitted",
    "notify_dispute_created",
    "notify_dispute_resolved",
    # Trigger helpers
    "NotificationContext",
    "fetch_slot_context",
    "fetch_request_context",
    "fetch_application_context",
    "send_notification",
    "notification_trigger",
    "count_available_slots",
    "get_review_preview",
    # Payment triggers
    "notify_payment_captured",
    "notify_payment_released",
    "notify_payment_failed",
    "notify_refund_issued",
]
