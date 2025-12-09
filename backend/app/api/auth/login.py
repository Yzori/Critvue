"""
Authentication - Login, Logout, Token Refresh, Password Change

Core authentication flow endpoints.
"""

from datetime import datetime
from typing import Optional
import json

from fastapi import Cookie, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.api.auth.common import (
    create_router,
    limiter,
    get_db,
    get_current_user,
    User,
    UserLogin,
    UserResponse,
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    decode_access_token,
    redis_service,
    security_logger,
    settings,
    HTTPException,
    set_auth_cookies,
    clear_auth_cookies,
    create_user_session,
)

router = create_router("login")


@router.post("/login", response_model=UserResponse)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Login user and set JWT tokens as httpOnly cookies

    Args:
        request: FastAPI request for rate limiting
        response: FastAPI response to set cookies
        credentials: User login credentials
        db: Database session

    Returns:
        User information (tokens set in httpOnly cookies)

    Raises:
        HTTPException: If credentials are invalid
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    # Always verify password to prevent timing attacks
    if user:
        password_valid = verify_password(credentials.password, user.hashed_password)
    else:
        # Run password hash to maintain consistent timing
        get_password_hash(credentials.password)
        password_valid = False

    # Generic error message to prevent email enumeration
    if not user or not password_valid:
        security_logger.log_auth_failure(
            credentials.email,
            request,
            reason="invalid_credentials",
            event_type="login"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        security_logger.log_auth_failure(
            credentials.email,
            request,
            reason="inactive_account",
            event_type="login"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    # Create access and refresh tokens
    token_data = {"user_id": user.id, "email": user.email}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    # Create session record
    await create_user_session(db, user.id, request, access_token)

    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)

    # Log successful login
    security_logger.log_auth_success(user.email, request, event_type="login")

    return user


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current authenticated user information

    Args:
        current_user: Current authenticated user from JWT token

    Returns:
        Current user information
    """
    return current_user


@router.post("/refresh")
@limiter.limit(settings.RATE_LIMIT_REFRESH)
async def refresh_access_token(
    request: Request,
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get a new access token using a refresh token from cookie

    Args:
        request: FastAPI request for rate limiting
        response: FastAPI response to set new cookies
        refresh_token: Refresh token from cookie
        db: Database session

    Returns:
        Success message (new tokens set in httpOnly cookies)

    Raises:
        HTTPException: If refresh token is invalid or missing
    """
    # Check if refresh token exists in cookie
    if not refresh_token:
        security_logger.log_auth_failure(
            "unknown",
            request,
            reason="missing_refresh_token",
            event_type="token_refresh"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode and validate refresh token
    payload = decode_refresh_token(refresh_token)

    if not payload:
        security_logger.log_auth_failure(
            "unknown",
            request,
            reason="invalid_refresh_token",
            event_type="token_refresh"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[int] = payload.get("user_id")
    if not user_id:
        security_logger.log_auth_failure(
            "unknown",
            request,
            reason="missing_user_id_in_token",
            event_type="token_refresh"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify user still exists and is active
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        email = payload.get("email", "unknown")
        security_logger.log_auth_failure(
            email,
            request,
            reason="user_not_found_or_inactive",
            event_type="token_refresh"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new tokens
    new_token_data = {"user_id": user.id, "email": user.email}
    new_access_token = create_access_token(data=new_token_data)
    new_refresh_token = create_refresh_token(data=new_token_data)

    # Set new cookies
    set_auth_cookies(response, new_access_token, new_refresh_token)

    # Log successful token refresh
    security_logger.log_auth_success(user.email, request, event_type="token_refresh")

    return {
        "message": "Token refreshed successfully",
        "detail": "New access token has been set in httpOnly cookie"
    }


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


@router.post("/change-password")
async def change_password(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Change user password while logged in.

    Args:
        request: FastAPI request
        current_user: Current authenticated user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If current password is wrong or validation fails
    """
    # Parse body from request
    body_bytes = await request.body()
    body_data = json.loads(body_bytes) if body_bytes else {}

    try:
        password_data = ChangePasswordRequest(**body_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid request body. Required: current_password, new_password (min 8 chars)"
        )

    # Check if user has a password (OAuth users might not)
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change password for OAuth-only accounts. Please set a password first."
        )

    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        security_logger.log_auth_failure(
            current_user.email,
            request,
            reason="incorrect_current_password",
            event_type="change_password"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Ensure new password is different
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await db.commit()

    security_logger.log_auth_success(current_user.email, request, event_type="change_password")

    return {
        "message": "Password changed successfully",
        "detail": "Your password has been updated. Please use the new password for future logins."
    }


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    access_token: Optional[str] = Cookie(None)
) -> dict:
    """
    Logout user and clear httpOnly cookies

    Args:
        response: FastAPI response to delete cookies
        current_user: Current authenticated user
        access_token: Access token from cookie (for blacklisting)

    Returns:
        Success message
    """
    # If access token exists, blacklist it for additional security
    if access_token:
        payload = decode_access_token(access_token)
        if payload and "exp" in payload:
            exp_timestamp = payload["exp"]
            current_timestamp = datetime.utcnow().timestamp()
            ttl = int(exp_timestamp - current_timestamp)

            if ttl > 0:
                redis_service.blacklist_token(access_token, ttl)
                security_logger.log_token_blacklist(current_user.email, reason="logout")

    # Clear cookies
    clear_auth_cookies(response)

    # Log logout event
    import logging
    logger = logging.getLogger("security")
    logger.info(f"LOGOUT | email={current_user.email}")

    return {
        "message": "Successfully logged out",
        "detail": "Your session has been terminated. Please log in again to continue."
    }
