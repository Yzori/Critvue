"""Password reset API endpoints"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.session import get_db
from app.models.user import User
from app.schemas.password_reset import (
    PasswordResetRequest,
    PasswordResetConfirm,
    PasswordResetResponse,
    PasswordResetVerify,
    PasswordResetVerifyResponse
)
from app.services.password_reset import (
    create_password_reset_token,
    verify_reset_token,
    reset_password,
    mask_email,
    RESET_TOKEN_EXPIRE_MINUTES
)
from app.services.email import send_password_reset_email
from app.core.logging_config import security_logger
from app.core.config import settings


router = APIRouter(prefix="/auth/password-reset", tags=["Password Reset"])
limiter = Limiter(key_func=get_remote_address, enabled=settings.ENABLE_RATE_LIMITING)


def get_client_ip(request: Request) -> Optional[str]:
    """
    Extract client IP address from request

    Handles X-Forwarded-For header for proxied requests
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def get_user_agent(request: Request) -> Optional[str]:
    """Extract User-Agent from request"""
    return request.headers.get("User-Agent", "Unknown")[:500]


@router.post("/request", response_model=PasswordResetResponse, status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_PASSWORD_RESET)
async def request_password_reset(
    request: Request,
    reset_request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
) -> PasswordResetResponse:
    """
    Request a password reset

    This endpoint is intentionally vague in its responses to prevent email enumeration.
    It always returns success, regardless of whether the email exists.

    Rate limiting: 3 requests per hour per IP address

    Security considerations:
    - Generic response message (no email enumeration)
    - Rate limited to prevent abuse
    - Tokens expire in 15 minutes
    - All old unused tokens are invalidated when new one is created
    - Audit trail (IP address, user agent) is recorded

    Args:
        request: FastAPI request for rate limiting and metadata
        reset_request: Email address requesting password reset
        db: Database session

    Returns:
        Generic success message

    Example:
        POST /auth/password-reset/request
        {
            "email": "user@example.com"
        }

        Response:
        {
            "message": "Password reset email sent",
            "detail": "If an account exists with this email, you will receive a password reset link."
        }
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == reset_request.email))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    # This is a security best practice
    response_message = "Password reset email sent"
    response_detail = (
        "If an account exists with this email, you will receive a password reset link. "
        f"The link will expire in {RESET_TOKEN_EXPIRE_MINUTES} minutes."
    )

    if user and user.is_active:
        # User exists and is active - create reset token and send email
        try:
            # Get client metadata for audit trail
            ip_address = get_client_ip(request)
            user_agent = get_user_agent(request)

            # Create reset token
            reset_token = await create_password_reset_token(
                db=db,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent
            )

            # Send email with reset token
            await send_password_reset_email(
                to_email=user.email,
                reset_token=reset_token,
                user_name=user.full_name
            )

            # Log successful password reset request
            security_logger.log_password_reset_request(user.email, request)

        except Exception as e:
            # Log the error but don't reveal it to the user
            # In production, you'd want proper error logging here
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send password reset email: {e}")

            # Still return success to prevent email enumeration
            pass
    else:
        # Log password reset request for non-existent or inactive user
        # This helps detect enumeration attempts
        if user and not user.is_active:
            security_logger.log_auth_failure(
                reset_request.email,
                request,
                reason="inactive_account",
                event_type="password_reset"
            )
        else:
            # Don't log non-existent email attempts to avoid filling logs
            pass

    # Always return the same response, whether user exists or not
    return PasswordResetResponse(
        message=response_message,
        detail=response_detail
    )


@router.post("/verify", response_model=PasswordResetVerifyResponse, status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_RESET_VERIFY)
async def verify_password_reset_token(
    request: Request,
    verify_request: PasswordResetVerify,
    db: AsyncSession = Depends(get_db)
) -> PasswordResetVerifyResponse:
    """
    Verify if a password reset token is valid (optional endpoint)

    This endpoint is useful for frontend validation before the user submits
    the password reset form. It checks if the token is valid and not expired.

    Rate limiting: 10 requests per minute per IP address

    Args:
        request: FastAPI request for rate limiting
        verify_request: Token to verify
        db: Database session

    Returns:
        Token validity status with masked email and expiration info

    Example:
        POST /auth/password-reset/verify
        {
            "token": "abc123def456..."
        }

        Response (valid):
        {
            "valid": true,
            "email": "u***@example.com",
            "expires_in_seconds": 600
        }

        Response (invalid):
        {
            "valid": false,
            "email": null,
            "expires_in_seconds": null
        }
    """
    reset_token, user = await verify_reset_token(db, verify_request.token)

    if not reset_token or not user:
        return PasswordResetVerifyResponse(
            valid=False,
            email=None,
            expires_in_seconds=None
        )

    # Calculate seconds until expiration
    from datetime import datetime
    expires_in = (reset_token.expires_at - datetime.utcnow()).total_seconds()
    expires_in_seconds = max(0, int(expires_in))

    return PasswordResetVerifyResponse(
        valid=True,
        email=mask_email(user.email),
        expires_in_seconds=expires_in_seconds
    )


@router.post("/confirm", response_model=PasswordResetResponse, status_code=status.HTTP_200_OK)
@limiter.limit(settings.RATE_LIMIT_RESET_CONFIRM)
async def confirm_password_reset(
    request: Request,
    reset_confirm: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
) -> PasswordResetResponse:
    """
    Confirm password reset with token and new password

    This endpoint completes the password reset process. It validates the token
    and updates the user's password.

    Rate limiting: 5 requests per minute per IP address

    Security considerations:
    - Token is verified and must be valid (not expired, not used)
    - Token is marked as used after successful reset (single-use)
    - All other active reset tokens for the user are invalidated
    - Password is validated for strength requirements
    - Password is hashed before storage

    Args:
        request: FastAPI request for rate limiting
        reset_confirm: Reset token and new password
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException 400: If token is invalid or expired
        HTTPException 422: If password doesn't meet requirements

    Example:
        POST /auth/password-reset/confirm
        {
            "token": "abc123def456...",
            "new_password": "NewSecureP@ssw0rd"
        }

        Response:
        {
            "message": "Password reset successful",
            "detail": "Your password has been updated. You can now log in with your new password."
        }
    """
    try:
        # Reset password using token (this also returns the user)
        success = await reset_password(
            db=db,
            token=reset_confirm.token,
            new_password=reset_confirm.new_password
        )

        if success:
            # Get user email for logging
            reset_token_obj, user = await verify_reset_token(db, reset_confirm.token)
            if user:
                security_logger.log_password_reset_success(user.email, request)

            return PasswordResetResponse(
                message="Password reset successful",
                detail="Your password has been updated. You can now log in with your new password."
            )

    except HTTPException as http_exc:
        # Log failed password reset attempt
        security_logger.log_auth_failure(
            "unknown",
            request,
            reason=str(http_exc.detail),
            event_type="password_reset_confirm"
        )
        # Re-raise HTTP exceptions (like invalid token)
        raise
    except Exception as e:
        # Log unexpected errors
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error during password reset: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later."
        )

    # Should never reach here, but just in case
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Password reset failed"
    )


# Optional: Admin endpoint to revoke all reset tokens for a user
# Uncomment if needed for admin functionality
"""
from app.api.deps import get_current_admin_user

@router.delete("/admin/revoke/{user_id}", status_code=status.HTTP_200_OK)
async def admin_revoke_reset_tokens(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
) -> dict:
    '''
    Admin endpoint: Revoke all password reset tokens for a user

    Requires admin authentication
    '''
    from app.services.password_reset import revoke_user_reset_tokens

    count = await revoke_user_reset_tokens(db, user_id)

    return {
        "message": f"Revoked {count} password reset token(s) for user {user_id}"
    }
"""
