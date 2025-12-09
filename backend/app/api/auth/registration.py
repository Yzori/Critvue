"""
Authentication - Registration Endpoint

User registration functionality.
"""

from fastapi import Depends, Request, status
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

router = create_router("registration")


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
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Log successful registration
    security_logger.log_auth_success(new_user.email, request, event_type="register")

    return new_user
