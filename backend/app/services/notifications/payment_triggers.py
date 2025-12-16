"""Payment notification triggers

This module provides notification triggers for payment-related events:
- Payment captured (for creators)
- Payment released (for reviewers)
- Refund issued (for creators)
- Connect action required

Refactored to use the shared notification trigger helper pattern.
"""

import logging
from typing import Optional
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import (
    NotificationType,
    NotificationPriority,
    EntityType
)
from app.models.review_slot import ReviewSlot
from app.models.review_request import ReviewRequest
from app.models.user import User
from app.services.notifications.core import NotificationService

logger = logging.getLogger(__name__)


async def _send_payment_notification(
    db: AsyncSession,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    data: dict,
    action_url: str,
    action_label: str,
    priority: NotificationPriority,
    entity_id: int,
) -> bool:
    """
    Internal helper to send payment notifications via NotificationService.

    Returns True on success, False on error.
    """
    try:
        service = NotificationService(db)
        await service.create_notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data,
            priority=priority,
            action_url=action_url,
            action_label=action_label,
            entity_type=EntityType.PAYMENT,
            entity_id=entity_id,
        )
        logger.info(f"Sent {notification_type.value} notification to user {user_id}")
        return True
    except Exception as e:
        logger.error(
            f"Error sending {notification_type.value} notification to user {user_id}: {e}",
            exc_info=True
        )
        return False


async def notify_payment_captured(
    db: AsyncSession,
    review_request: ReviewRequest,
    creator: User,
    amount: Decimal
) -> bool:
    """
    Notify creator that their payment has been captured.

    Args:
        db: Database session
        review_request: The review request
        creator: The creator user
        amount: Payment amount

    Returns:
        True if notification was sent successfully
    """
    return await _send_payment_notification(
        db=db,
        user_id=creator.id,
        notification_type=NotificationType.PAYMENT_SUCCEEDED,
        title="Payment Successful",
        message=f"Your payment of ${amount:.2f} for '{review_request.title}' has been processed. Your review request is now live!",
        data={
            "review_request_id": review_request.id,
            "review_request_title": review_request.title,
            "amount": float(amount),
            "currency": "usd"
        },
        action_url=f"/review/{review_request.id}",
        action_label="View Request",
        priority=NotificationPriority.HIGH,
        entity_id=review_request.id,
    )


async def notify_payment_released(
    db: AsyncSession,
    slot: ReviewSlot,
    reviewer: User,
    net_amount: Decimal,
    platform_fee: Decimal
) -> bool:
    """
    Notify reviewer that payment has been released to their account.

    Args:
        db: Database session
        slot: The review slot
        reviewer: The reviewer user
        net_amount: Net amount after platform fee
        platform_fee: Platform fee amount

    Returns:
        True if notification was sent successfully
    """
    # Get review request title
    review_request = await db.get(ReviewRequest, slot.review_request_id)
    title = review_request.title if review_request else "Review"

    return await _send_payment_notification(
        db=db,
        user_id=reviewer.id,
        notification_type=NotificationType.EXPERT_PAYMENT_RELEASED,
        title="Payment Released!",
        message=f"You've earned ${net_amount:.2f} for your review of '{title}'. The payment has been transferred to your connected account.",
        data={
            "slot_id": slot.id,
            "review_request_id": slot.review_request_id,
            "review_request_title": title,
            "net_amount": float(net_amount),
            "platform_fee": float(platform_fee),
            "gross_amount": float(net_amount + platform_fee),
            "currency": "usd"
        },
        action_url="/reviewer/settings/payouts",
        action_label="View Earnings",
        priority=NotificationPriority.HIGH,
        entity_id=slot.id,
    )


async def notify_refund_issued(
    db: AsyncSession,
    slot: ReviewSlot,
    creator: User,
    amount: Decimal,
    reason: str = "Review rejected"
) -> bool:
    """
    Notify creator that a refund has been issued.

    Args:
        db: Database session
        slot: The review slot
        creator: The creator user
        amount: Refund amount
        reason: Reason for refund

    Returns:
        True if notification was sent successfully
    """
    # Get review request title
    review_request = await db.get(ReviewRequest, slot.review_request_id)
    title = review_request.title if review_request else "Review"

    return await _send_payment_notification(
        db=db,
        user_id=creator.id,
        notification_type=NotificationType.EXPERT_PAYMENT_REFUNDED,
        title="Refund Processed",
        message=f"A refund of ${amount:.2f} has been issued for '{title}'. Reason: {reason}. It may take 5-10 business days to appear on your statement.",
        data={
            "slot_id": slot.id,
            "review_request_id": slot.review_request_id,
            "review_request_title": title,
            "amount": float(amount),
            "reason": reason,
            "currency": "usd"
        },
        action_url=f"/review/{slot.review_request_id}",
        action_label="View Details",
        priority=NotificationPriority.MEDIUM,
        entity_id=slot.id,
    )


async def notify_payment_failed(
    db: AsyncSession,
    review_request: ReviewRequest,
    creator: User,
    error_message: str = "Your payment could not be processed"
) -> bool:
    """
    Notify creator that their payment failed.

    Args:
        db: Database session
        review_request: The review request
        creator: The creator user
        error_message: Error message from payment processor

    Returns:
        True if notification was sent successfully
    """
    return await _send_payment_notification(
        db=db,
        user_id=creator.id,
        notification_type=NotificationType.PAYMENT_FAILED,
        title="Payment Failed",
        message=f"We couldn't process your payment for '{review_request.title}'. {error_message}. Please try again or use a different payment method.",
        data={
            "review_request_id": review_request.id,
            "review_request_title": review_request.title,
            "error_message": error_message
        },
        action_url=f"/review/{review_request.id}/checkout",
        action_label="Retry Payment",
        priority=NotificationPriority.URGENT,
        entity_id=review_request.id,
    )


async def notify_connect_action_required(
    db: AsyncSession,
    user: User,
    action_type: str = "complete_onboarding"
) -> bool:
    """
    Notify reviewer that action is required on their Connect account.

    Args:
        db: Database session
        user: The user
        action_type: Type of action required

    Returns:
        True if notification was sent successfully
    """
    messages = {
        "complete_onboarding": "Please complete your payout setup to start receiving payments for expert reviews.",
        "provide_info": "Stripe needs additional information to enable your payouts. Please update your account.",
        "verify_identity": "Please verify your identity to continue receiving payments.",
        "update_bank": "There's an issue with your bank account. Please update your payment details."
    }

    message = messages.get(action_type, messages["complete_onboarding"])

    return await _send_payment_notification(
        db=db,
        user_id=user.id,
        notification_type=NotificationType.SUBSCRIPTION_CANCELED,  # Reusing as "account action required"
        title="Payout Setup Required",
        message=message,
        data={
            "action_type": action_type
        },
        action_url="/reviewer/settings/payouts",
        action_label="Update Settings",
        priority=NotificationPriority.HIGH,
        entity_id=user.id,
    )
