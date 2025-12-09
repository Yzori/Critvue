"""Dependencies for API endpoints"""

from typing import Optional
from fastapi import Cookie, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.core.security import decode_access_token
from app.core.exceptions import (
    NotAuthenticatedError,
    TokenInvalidError,
    TokenRevokedError,
    InactiveUserError,
    BannedUserError,
    SuspendedUserError,
)
from app.models.user import User
from app.schemas.user import TokenData
from app.services.redis_service import redis_service

security = HTTPBearer()


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token in cookie

    Args:
        access_token: JWT access token from httpOnly cookie
        db: Database session

    Returns:
        Current authenticated user

    Raises:
        NotAuthenticatedError: If no token is provided
        TokenRevokedError: If token has been revoked
        TokenInvalidError: If token is invalid or user not found
        InactiveUserError: If user account is inactive
        BannedUserError: If user account is banned
        SuspendedUserError: If user account is suspended
    """
    # Check if token exists in cookie
    if not access_token:
        raise NotAuthenticatedError()

    # Check if token is blacklisted
    if redis_service.is_token_blacklisted(access_token):
        raise TokenRevokedError()

    payload = decode_access_token(access_token)

    if payload is None:
        raise TokenInvalidError()

    user_id: Optional[int] = payload.get("user_id")
    if user_id is None:
        raise TokenInvalidError()

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise TokenInvalidError(message="User not found")

    if not user.is_active:
        raise InactiveUserError()

    # Check if user is banned
    if user.is_banned:
        raise BannedUserError()

    # Check if user is suspended (and suspension hasn't expired)
    if user.is_suspended:
        from datetime import datetime
        if user.suspended_until and user.suspended_until > datetime.utcnow():
            raise SuspendedUserError(suspended_until=user.suspended_until.isoformat())

    return user


async def get_current_user_optional(
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get the current authenticated user.
    Returns None if not authenticated instead of raising an exception.

    Args:
        access_token: JWT access token from httpOnly cookie
        db: Database session

    Returns:
        Current authenticated user or None if not authenticated
    """
    if not access_token:
        return None

    # Check if token is blacklisted
    if redis_service.is_token_blacklisted(access_token):
        return None

    payload = decode_access_token(access_token)
    if payload is None:
        return None

    user_id: Optional[int] = payload.get("user_id")
    if user_id is None:
        return None

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    # Banned users get None (treated as not authenticated)
    if user.is_banned:
        return None

    # Suspended users get None if suspension is active
    if user.is_suspended:
        from datetime import datetime
        if user.suspended_until and user.suspended_until > datetime.utcnow():
            return None

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current active user

    Args:
        current_user: Current authenticated user

    Returns:
        Active user

    Raises:
        InactiveUserError: If user is not active
    """
    if not current_user.is_active:
        raise InactiveUserError()
    return current_user
