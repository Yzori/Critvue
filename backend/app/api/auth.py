"""Authentication API endpoints"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    decode_access_token
)
from app.api.deps import get_current_user
from app.services.redis_service import redis_service
from app.core.logging_config import security_logger
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address, enabled=settings.ENABLE_RATE_LIMITING)

# OAuth setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_REGISTRATION)
async def register(
    request: Request,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Register a new user

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        Created user

    Raises:
        HTTPException: If email already exists
    """
    # Check if user with email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Log failed registration attempt
        security_logger.log_auth_failure(
            user_data.email,
            request,
            reason="email_already_exists",
            event_type="register"
        )
        # Generic error to prevent email enumeration
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to complete registration. Please try a different email or contact support."
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)

    # Auto-generate full_name from email prefix if not provided
    # Example: "john.doe@example.com" -> "john.doe"
    full_name = user_data.full_name
    if not full_name:
        # Extract username part before @ symbol
        email_prefix = user_data.email.split('@')[0]
        full_name = email_prefix

    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=full_name,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Log successful registration
    security_logger.log_auth_success(new_user.email, request, event_type="register")

    return new_user


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
    # Even if user doesn't exist, we still run bcrypt
    if user:
        password_valid = verify_password(credentials.password, user.hashed_password)
    else:
        # Run password hash to maintain consistent timing
        get_password_hash(credentials.password)
        password_valid = False

    # Generic error message to prevent email enumeration
    if not user or not password_valid:
        # Log failed login attempt
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
        # Log inactive account login attempt
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

    # Set access token as httpOnly cookie
    # max_age must match JWT expiration time from settings
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,           # Cannot be accessed by JavaScript
        secure=False,            # Set to True in production with HTTPS
        samesite="lax",          # CSRF protection
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert minutes to seconds
        path="/",                # Available to all routes
    )

    # Set refresh token as httpOnly cookie
    # max_age must match JWT expiration time from settings
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,           # Cannot be accessed by JavaScript
        secure=False,            # Set to True in production with HTTPS
        samesite="lax",          # CSRF protection
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # Convert days to seconds
        path="/api/v1/auth",     # Only sent to auth endpoints
    )

    # Log successful login
    security_logger.log_auth_success(user.email, request, event_type="login")

    # Return user data (not tokens)
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
        # Log failed token refresh
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
        # Log failed token refresh
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
        # Log failed token refresh
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
        # Log failed token refresh
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

    # Set new access token as httpOnly cookie
    # max_age must match JWT expiration time from settings
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert minutes to seconds
        path="/",
    )

    # Set new refresh token as httpOnly cookie
    # max_age must match JWT expiration time from settings
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # Convert days to seconds
        path="/api/v1/auth",
    )

    # Log successful token refresh
    security_logger.log_auth_success(user.email, request, event_type="token_refresh")

    return {
        "message": "Token refreshed successfully",
        "detail": "New access token has been set in httpOnly cookie"
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
            # Calculate TTL for blacklist entry (time until token expires)
            exp_timestamp = payload["exp"]
            current_timestamp = datetime.utcnow().timestamp()
            ttl = int(exp_timestamp - current_timestamp)

            if ttl > 0:
                # Add token to blacklist
                redis_service.blacklist_token(access_token, ttl)
                # Log token blacklisting
                security_logger.log_token_blacklist(current_user.email, reason="logout")

    # Delete access_token cookie
    response.delete_cookie(
        key="access_token",
        path="/"
    )

    # Delete refresh_token cookie
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth"
    )

    # Log logout event
    from app.core.logging_config import logging
    logger = logging.getLogger("security")
    logger.info(f"LOGOUT | email={current_user.email}")

    return {
        "message": "Successfully logged out",
        "detail": "Your session has been terminated. Please log in again to continue."
    }


# =============================================================================
# GOOGLE OAUTH ENDPOINTS
# =============================================================================

@router.get("/google")
async def google_login(request: Request):
    """
    Initiate Google OAuth flow.
    Redirects user to Google's consent screen.
    """
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Google OAuth callback.
    Creates or logs in user, sets JWT cookies, redirects to frontend.
    """
    try:
        # Exchange authorization code for tokens
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')

        if not user_info or not user_info.get('email'):
            security_logger.log_auth_failure(
                "unknown",
                request,
                reason="google_oauth_no_email",
                event_type="oauth"
            )
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=google_auth_failed",
                status_code=302
            )

        email = user_info['email']
        full_name = user_info.get('name', email.split('@')[0])

        # Find or create user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            # Create new user (OAuth users have no password)
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=None,
                oauth_provider='google',
                is_verified=True,  # Google emails are pre-verified
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            security_logger.log_auth_success(email, request, event_type="oauth_register")
        else:
            # Update existing user if they haven't set oauth_provider
            if not user.oauth_provider:
                user.oauth_provider = 'google'
            user.last_login = datetime.utcnow()
            await db.commit()
            security_logger.log_auth_success(email, request, event_type="oauth_login")

        # Check if user is active
        if not user.is_active:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=account_inactive",
                status_code=302
            )

        # Create JWT tokens
        token_data = {"user_id": user.id, "email": user.email}
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)

        # Create redirect response to frontend dashboard
        response = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/dashboard",
            status_code=302
        )

        # Set access token cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )

        # Set refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
            path="/api/v1/auth",
        )

        return response

    except Exception as e:
        security_logger.log_auth_failure(
            "unknown",
            request,
            reason=f"google_oauth_error: {str(e)}",
            event_type="oauth"
        )
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=google_auth_failed",
            status_code=302
        )
