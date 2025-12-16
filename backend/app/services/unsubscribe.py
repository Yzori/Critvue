"""
Unsubscribe Service

Handles email unsubscribe token generation and one-click unsubscribe functionality
for email compliance (CAN-SPAM, GDPR).
"""

import secrets
import logging
from typing import Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.notification import NotificationPreferences, EmailDigestFrequency
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_unsubscribe_token() -> str:
    """Generate a secure random unsubscribe token."""
    return secrets.token_urlsafe(48)


async def get_or_create_unsubscribe_token(
    db: AsyncSession,
    user_id: int,
) -> str:
    """
    Get existing unsubscribe token or create a new one.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Unsubscribe token string
    """
    # Get or create preferences
    result = await db.execute(
        select(NotificationPreferences).where(
            NotificationPreferences.user_id == user_id
        )
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        # Create new preferences with token
        prefs = NotificationPreferences(
            user_id=user_id,
            unsubscribe_token=generate_unsubscribe_token(),
        )
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    elif not prefs.unsubscribe_token:
        # Generate token if missing
        prefs.unsubscribe_token = generate_unsubscribe_token()
        await db.commit()
        await db.refresh(prefs)

    return prefs.unsubscribe_token


def get_unsubscribe_url(token: str) -> str:
    """
    Generate the full unsubscribe URL for a token.

    Args:
        token: Unsubscribe token

    Returns:
        Full unsubscribe URL
    """
    return f"{settings.FRONTEND_URL}/unsubscribe?token={token}"


async def get_unsubscribe_url_for_user(
    db: AsyncSession,
    user_id: int,
) -> str:
    """
    Get the full unsubscribe URL for a user.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Full unsubscribe URL
    """
    token = await get_or_create_unsubscribe_token(db, user_id)
    return get_unsubscribe_url(token)


async def unsubscribe_by_token(
    db: AsyncSession,
    token: str,
    category: Optional[str] = None,
) -> Tuple[bool, str]:
    """
    Process unsubscribe request using token.

    Args:
        db: Database session
        token: Unsubscribe token
        category: Optional category to unsubscribe from (None = all emails)

    Returns:
        Tuple of (success, message)
    """
    # Find preferences by token
    result = await db.execute(
        select(NotificationPreferences).where(
            NotificationPreferences.unsubscribe_token == token
        )
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        logger.warning(f"Invalid unsubscribe token attempted: {token[:10]}...")
        return False, "Invalid unsubscribe link"

    if category:
        # Unsubscribe from specific category
        if prefs.category_preferences is None:
            prefs.category_preferences = {}

        # Disable email for this category
        if category not in prefs.category_preferences:
            prefs.category_preferences[category] = {}
        prefs.category_preferences[category]["email"] = False

        logger.info(f"User {prefs.user_id} unsubscribed from {category} emails")
        message = f"You've been unsubscribed from {category.replace('_', ' ')} emails."
    else:
        # Unsubscribe from all emails (set to never)
        prefs.email_enabled = False
        prefs.email_digest_frequency = EmailDigestFrequency.NEVER

        logger.info(f"User {prefs.user_id} unsubscribed from all emails")
        message = "You've been unsubscribed from all email notifications."

    await db.commit()
    return True, message


async def resubscribe_by_token(
    db: AsyncSession,
    token: str,
) -> Tuple[bool, str]:
    """
    Re-enable email notifications using token.

    Args:
        db: Database session
        token: Unsubscribe token

    Returns:
        Tuple of (success, message)
    """
    # Find preferences by token
    result = await db.execute(
        select(NotificationPreferences).where(
            NotificationPreferences.unsubscribe_token == token
        )
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        logger.warning(f"Invalid resubscribe token attempted: {token[:10]}...")
        return False, "Invalid link"

    # Re-enable emails
    prefs.email_enabled = True
    if prefs.email_digest_frequency == EmailDigestFrequency.NEVER:
        prefs.email_digest_frequency = EmailDigestFrequency.IMMEDIATE

    await db.commit()
    logger.info(f"User {prefs.user_id} re-subscribed to emails")

    return True, "You've been re-subscribed to email notifications."


async def get_user_from_unsubscribe_token(
    db: AsyncSession,
    token: str,
) -> Optional[User]:
    """
    Get user associated with an unsubscribe token.

    Args:
        db: Database session
        token: Unsubscribe token

    Returns:
        User object if found, None otherwise
    """
    result = await db.execute(
        select(NotificationPreferences).where(
            NotificationPreferences.unsubscribe_token == token
        )
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        return None

    user_result = await db.execute(
        select(User).where(User.id == prefs.user_id)
    )
    return user_result.scalar_one_or_none()
