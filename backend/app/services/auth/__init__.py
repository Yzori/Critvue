"""
Auth Services Module

This module consolidates authentication-related services:
- email_verification: Email verification token management
- password_reset: Password reset token management
- unsubscribe: Email unsubscribe management

Usage:
    from app.services.auth import send_verification_email
    from app.services.auth import create_password_reset_token
"""

from app.services.auth.email_verification import (
    send_verification_email,
    verify_email_token,
    resend_verification_email,
    generate_verification_token,
)

from app.services.auth.password_reset import (
    create_password_reset_token,
    verify_reset_token,
    reset_password,
    mask_email,
    RESET_TOKEN_EXPIRE_MINUTES,
)

from app.services.auth.unsubscribe import (
    generate_unsubscribe_token,
    get_or_create_unsubscribe_token,
    get_unsubscribe_url,
    get_unsubscribe_url_for_user,
    unsubscribe_by_token,
    resubscribe_by_token,
    get_user_from_unsubscribe_token,
)

__all__ = [
    # Email verification
    "send_verification_email",
    "verify_email_token",
    "resend_verification_email",
    "generate_verification_token",
    # Password reset
    "create_password_reset_token",
    "verify_reset_token",
    "reset_password",
    "mask_email",
    "RESET_TOKEN_EXPIRE_MINUTES",
    # Unsubscribe
    "generate_unsubscribe_token",
    "get_or_create_unsubscribe_token",
    "get_unsubscribe_url",
    "get_unsubscribe_url_for_user",
    "unsubscribe_by_token",
    "resubscribe_by_token",
    "get_user_from_unsubscribe_token",
]
