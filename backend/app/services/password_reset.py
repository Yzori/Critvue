"""Password reset service layer with security utilities"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete

from app.models.user import User
from app.core.exceptions import InvalidInputError
from app.models.password_reset import PasswordResetToken
from app.core.security import get_password_hash


# Configuration constants
RESET_TOKEN_EXPIRE_MINUTES = 15
RESET_TOKEN_LENGTH = 32  # bytes, will be 43 chars when base64 encoded
MAX_ACTIVE_TOKENS_PER_USER = 3  # Prevent token flooding


def generate_reset_token() -> str:
    """
    Generate a cryptographically secure random token

    Returns:
        URL-safe random token string (43 characters)

    Security:
        Uses secrets.token_urlsafe which is designed for security-sensitive applications
        Tokens are unpredictable and resistant to timing attacks
    """
    return secrets.token_urlsafe(RESET_TOKEN_LENGTH)


def hash_token(token: str) -> str:
    """
    Hash a token using SHA-256 for secure storage

    Args:
        token: Plain token string

    Returns:
        Hexadecimal hash of the token

    Security:
        - Tokens are hashed before storage to prevent token theft from DB breaches
        - SHA-256 is one-way: can't reverse from hash to original token
        - Even if database is compromised, attackers can't use tokens
    """
    return hashlib.sha256(token.encode()).hexdigest()


async def create_password_reset_token(
    db: AsyncSession,
    user: User,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> str:
    """
    Create a new password reset token for a user

    Args:
        db: Database session
        user: User requesting password reset
        ip_address: IP address of the requester (for audit trail)
        user_agent: User agent of the requester (for audit trail)

    Returns:
        Plain token string (to be sent via email)

    Security:
        - Invalidates old unused tokens to prevent token accumulation
        - Limits maximum active tokens per user
        - Stores hashed version of token in database
        - Includes audit trail (IP, user agent, timestamp)
    """
    # Delete expired tokens for this user (cleanup)
    await db.execute(
        delete(PasswordResetToken).where(
            and_(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.expires_at < datetime.utcnow()
            )
        )
    )

    # Count active tokens for this user
    result = await db.execute(
        select(PasswordResetToken).where(
            and_(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.is_used == '0',
                PasswordResetToken.expires_at > datetime.utcnow()
            )
        )
    )
    active_tokens = result.scalars().all()

    # If user has too many active tokens, delete the oldest ones
    if len(active_tokens) >= MAX_ACTIVE_TOKENS_PER_USER:
        # Sort by created_at and delete oldest
        active_tokens.sort(key=lambda t: t.created_at)
        tokens_to_delete = active_tokens[:len(active_tokens) - MAX_ACTIVE_TOKENS_PER_USER + 1]
        for token in tokens_to_delete:
            await db.delete(token)

    # Generate new token
    plain_token = generate_reset_token()
    token_hash = hash_token(plain_token)

    # Create token record
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        ip_address=ip_address,
        user_agent=user_agent
    )

    db.add(reset_token)
    await db.commit()

    # Return the plain token (this will be sent to user's email)
    return plain_token


async def verify_reset_token(
    db: AsyncSession,
    token: str
) -> Tuple[Optional[PasswordResetToken], Optional[User]]:
    """
    Verify a password reset token

    Args:
        db: Database session
        token: Plain token string from user

    Returns:
        Tuple of (PasswordResetToken, User) if valid, (None, None) if invalid

    Security:
        - Hash token before database lookup
        - Check expiration
        - Check if already used
        - Return user only if all checks pass
    """
    token_hash = hash_token(token)

    # Find token in database
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        return None, None

    # Check if token is valid
    if not reset_token.is_valid():
        return None, None

    # Get associated user
    result = await db.execute(
        select(User).where(User.id == reset_token.user_id)
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return None, None

    return reset_token, user


async def reset_password(
    db: AsyncSession,
    token: str,
    new_password: str
) -> bool:
    """
    Reset a user's password using a valid token

    Args:
        db: Database session
        token: Plain token string
        new_password: New password (will be hashed)

    Returns:
        True if password was reset successfully

    Raises:
        HTTPException: If token is invalid or expired

    Security:
        - Verifies token validity
        - Hashes new password before storage
        - Marks token as used (single-use enforcement)
        - Invalidates all other reset tokens for the user
    """
    # Verify token
    reset_token, user = await verify_reset_token(db, token)

    if not reset_token or not user:
        raise InvalidInputError(
            message="Invalid or expired password reset token"
        )

    # Update user's password
    user.hashed_password = get_password_hash(new_password)

    # Mark token as used
    reset_token.mark_as_used()

    # Invalidate all other active reset tokens for this user
    # This prevents token reuse if user requested multiple resets
    await db.execute(
        delete(PasswordResetToken).where(
            and_(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.id != reset_token.id,
                PasswordResetToken.is_used == '0'
            )
        )
    )

    await db.commit()
    return True


async def cleanup_expired_tokens(db: AsyncSession) -> int:
    """
    Cleanup expired password reset tokens

    This should be called periodically (e.g., via cron job or background task)

    Args:
        db: Database session

    Returns:
        Number of tokens deleted

    Note:
        In production, consider keeping used/expired tokens for audit trail
        and only deleting tokens older than X days (e.g., 30 days)
    """
    # Delete tokens that expired more than 24 hours ago
    cutoff_time = datetime.utcnow() - timedelta(hours=24)

    result = await db.execute(
        delete(PasswordResetToken).where(
            PasswordResetToken.expires_at < cutoff_time
        )
    )

    await db.commit()
    return result.rowcount


async def revoke_user_reset_tokens(db: AsyncSession, user_id: int) -> int:
    """
    Revoke all active password reset tokens for a user

    Useful when:
    - User successfully resets password
    - Admin needs to invalidate all reset tokens
    - Security breach detected

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Number of tokens revoked
    """
    result = await db.execute(
        delete(PasswordResetToken).where(
            and_(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.is_used == '0'
            )
        )
    )

    await db.commit()
    return result.rowcount


def mask_email(email: str) -> str:
    """
    Mask email address for security

    Args:
        email: Email address to mask

    Returns:
        Masked email (e.g., "j***@example.com")

    Security:
        Used in responses to prevent email enumeration
        while still providing useful feedback to legitimate users
    """
    if '@' not in email:
        return "***"

    local, domain = email.split('@', 1)

    if len(local) <= 1:
        masked_local = '*'
    else:
        masked_local = local[0] + '***'

    return f"{masked_local}@{domain}"
