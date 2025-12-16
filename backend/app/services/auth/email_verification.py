"""
Email Verification Service

Handles email verification token generation, validation, and verification flow.

This module provides functionality for:
- Generating secure verification tokens
- Sending verification emails on registration
- Validating verification tokens
- Resending verification emails

Example:
    >>> from app.services.email_verification import send_verification_email
    >>> success = await send_verification_email(db, user)
"""

import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.services.notifications.email_service import send_email_verification
from app.core.config import settings

logger = logging.getLogger(__name__)

# Token expiry time (24 hours)
VERIFICATION_TOKEN_EXPIRE_HOURS = 24


def generate_verification_token() -> str:
    """Generate a secure random verification token.

    Returns:
        A URL-safe base64-encoded token string (32 bytes).
    """
    return secrets.token_urlsafe(32)


async def create_verification_token(
    db: AsyncSession,
    user: User,
) -> str:
    """
    Create and store a verification token for a user.

    Args:
        db: Database session
        user: User to create token for

    Returns:
        The generated verification token
    """
    token = generate_verification_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)

    user.email_verification_token = token
    user.email_verification_expires_at = expires_at

    await db.commit()
    await db.refresh(user)

    logger.info(f"Created verification token for user {user.id} ({user.email})")
    return token


async def send_verification_email(
    db: AsyncSession,
    user: User,
) -> bool:
    """
    Generate verification token and send verification email.

    Args:
        db: Database session
        user: User to send verification to

    Returns:
        True if email was sent successfully
    """
    # Generate token
    token = await create_verification_token(db, user)

    # Send email
    success = await send_email_verification(
        to_email=user.email,
        verification_token=token,
        user_name=user.full_name,
    )

    if success:
        logger.info(f"Verification email sent to {user.email}")
    else:
        logger.error(f"Failed to send verification email to {user.email}")

    return success


async def verify_email_token(
    db: AsyncSession,
    token: str,
) -> Tuple[bool, Optional[User], str]:
    """
    Verify an email verification token.

    Args:
        db: Database session
        token: The verification token

    Returns:
        Tuple of (success, user, message)
    """
    # Find user with this token
    result = await db.execute(
        select(User).where(User.email_verification_token == token)
    )
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(f"Invalid verification token attempted")
        return False, None, "Invalid verification token"

    # Check if already verified
    if user.is_verified:
        logger.info(f"User {user.email} attempted to verify already-verified email")
        return True, user, "Email already verified"

    # Check expiry
    if user.email_verification_expires_at:
        # Make sure both datetimes are timezone-aware for comparison
        expires_at = user.email_verification_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            logger.warning(f"Expired verification token for user {user.email}")
            return False, user, "Verification token has expired. Please request a new one."

    # Mark as verified
    user.is_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None

    await db.commit()
    await db.refresh(user)

    logger.info(f"Email verified for user {user.id} ({user.email})")
    return True, user, "Email verified successfully"


async def resend_verification_email(
    db: AsyncSession,
    email: str,
) -> Tuple[bool, str]:
    """
    Resend verification email to a user.

    Args:
        db: Database session
        email: User's email address

    Returns:
        Tuple of (success, message)
    """
    # Find user
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal if email exists
        logger.warning(f"Resend verification requested for non-existent email: {email}")
        return True, "If an account exists with this email, a verification link has been sent."

    if user.is_verified:
        logger.info(f"Resend verification requested for already-verified user: {email}")
        return True, "If an account exists with this email, a verification link has been sent."

    # Send new verification email
    success = await send_verification_email(db, user)

    # Always return success message to prevent email enumeration
    return True, "If an account exists with this email, a verification link has been sent."
