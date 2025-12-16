"""
Authentication - Email Verification Endpoints

Handles email verification and resend functionality.
"""

import logging
from fastapi import Depends, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth.common import (
    create_router,
    limiter,
    get_db,
    settings,
)
from app.services.auth.email_verification import (
    verify_email_token,
    resend_verification_email,
)
from app.core.exceptions import InvalidInputError

logger = logging.getLogger(__name__)

router = create_router("email-verification")


class VerifyEmailRequest(BaseModel):
    """Request body for email verification."""
    token: str


class ResendVerificationRequest(BaseModel):
    """Request body for resending verification email."""
    email: EmailStr


class VerificationResponse(BaseModel):
    """Response for verification operations."""
    success: bool
    message: str


@router.post("/verify-email", response_model=VerificationResponse)
async def verify_email(
    request: Request,
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
) -> VerificationResponse:
    """
    Verify user's email address using verification token.

    Args:
        data: Contains the verification token
        db: Database session

    Returns:
        VerificationResponse with success status and message
    """
    success, user, message = await verify_email_token(db, data.token)

    if not success and user is None:
        # Invalid token
        raise InvalidInputError(message=message)

    return VerificationResponse(success=success, message=message)


@router.post("/resend-verification", response_model=VerificationResponse)
@limiter.limit("3/hour")  # Limit resend requests
async def resend_verification(
    request: Request,
    data: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db)
) -> VerificationResponse:
    """
    Resend verification email to user.

    Args:
        data: Contains the user's email
        db: Database session

    Returns:
        VerificationResponse with success status and message

    Note:
        Always returns success to prevent email enumeration attacks.
    """
    success, message = await resend_verification_email(db, data.email)
    return VerificationResponse(success=success, message=message)
