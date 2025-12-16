"""
Authentication - Registration Endpoint

User registration functionality with email verification.
"""

import logging
from fastapi import Depends, Request, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.auth.common import (
    create_router,
    limiter,
    get_db,
    User,
    UserCreate,
    UserResponse,
    get_password_hash,
    generate_unique_username,
    security_logger,
    settings,
)
from app.core.exceptions import InvalidInputError
from app.services.auth.email_verification import send_verification_email

logger = logging.getLogger(__name__)

router = create_router("registration")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_REGISTRATION)
async def register(
    request: Request,
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Register a new user and send verification email.

    Args:
        user_data: User registration data
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        Created user

    Raises:
        InvalidInputError: If email already exists
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
        raise InvalidInputError(
            message="Unable to complete registration. Please try a different email or contact support."
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)

    # Auto-generate full_name from email prefix if not provided
    full_name = user_data.full_name
    if not full_name:
        email_prefix = user_data.email.split('@')[0]
        full_name = email_prefix

    # Auto-generate SEO-friendly username from email
    username = await generate_unique_username(db, user_data.email)

    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=full_name,
        username=username,
        is_verified=False,  # Explicitly set to require email verification
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Log successful registration
    security_logger.log_auth_success(new_user.email, request, event_type="register")

    # Send verification email (non-blocking)
    try:
        await send_verification_email(db, new_user)
        logger.info(f"Verification email queued for {new_user.email}")
    except Exception as e:
        # Don't fail registration if email fails - user can resend later
        logger.error(f"Failed to send verification email to {new_user.email}: {e}")

    return new_user
