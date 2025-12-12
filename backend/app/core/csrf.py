"""
CSRF Protection using Double-Submit Cookie Pattern

This module provides CSRF protection for state-changing HTTP methods
(POST, PUT, PATCH, DELETE) when using cookie-based authentication.

How it works:
1. A CSRF token is set in a non-httpOnly cookie (readable by JavaScript)
2. Frontend must include this token in the X-CSRF-Token header for state-changing requests
3. Backend validates that the header value matches the cookie value

Exempt paths:
- Webhook endpoints (authenticated via signatures, not cookies)
- Login/register endpoints (no session to protect yet)
- OAuth callbacks (authenticated via OAuth state parameter)
"""

import secrets
import logging
from typing import Set
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings

logger = logging.getLogger(__name__)

# Cookie name for CSRF token
CSRF_COOKIE_NAME = "csrf_token"
# Header name to check for CSRF token
CSRF_HEADER_NAME = "X-CSRF-Token"

# HTTP methods that require CSRF protection
PROTECTED_METHODS: Set[str] = {"POST", "PUT", "PATCH", "DELETE"}

# Paths exempt from CSRF protection (must match exactly or be a prefix)
EXEMPT_PATHS: Set[str] = {
    # Webhooks use signature verification, not cookies
    "/api/v1/webhooks",
    # Auth endpoints - no session to protect yet
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/google",
    "/api/v1/auth/google/callback",
    "/api/v1/auth/refresh",
    # Password reset uses tokens, not sessions
    "/api/v1/password-reset",
    # Health checks
    "/health",
}

# Path prefixes exempt from CSRF
EXEMPT_PATH_PREFIXES: tuple = (
    "/api/v1/webhooks/",  # All webhook subpaths
)


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token"""
    return secrets.token_urlsafe(32)


def is_path_exempt(path: str) -> bool:
    """Check if a path is exempt from CSRF protection"""
    # Check exact matches
    if path in EXEMPT_PATHS:
        return True

    # Check prefix matches
    for prefix in EXEMPT_PATH_PREFIXES:
        if path.startswith(prefix):
            return True

    return False


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce CSRF protection using double-submit cookie pattern.

    For protected methods (POST, PUT, PATCH, DELETE):
    - Validates that X-CSRF-Token header matches csrf_token cookie
    - Returns 403 Forbidden if validation fails

    For all requests:
    - Sets/refreshes CSRF token cookie if not present
    """

    async def dispatch(self, request: Request, call_next):
        method = request.method.upper()
        path = request.url.path

        # Get existing CSRF token from cookie
        csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)

        # Check if CSRF validation is needed
        if method in PROTECTED_METHODS and not is_path_exempt(path):
            # Get CSRF token from header
            csrf_header = request.headers.get(CSRF_HEADER_NAME)

            # Validate CSRF token
            if not csrf_cookie or not csrf_header:
                logger.warning(
                    f"CSRF validation failed: missing token. "
                    f"Path: {path}, Method: {method}, "
                    f"Has cookie: {bool(csrf_cookie)}, Has header: {bool(csrf_header)}"
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "CSRF_VALIDATION_FAILED",
                            "message": "CSRF token missing. Please refresh the page and try again."
                        }
                    }
                )

            # Compare tokens (constant-time comparison to prevent timing attacks)
            if not secrets.compare_digest(csrf_cookie, csrf_header):
                logger.warning(
                    f"CSRF validation failed: token mismatch. "
                    f"Path: {path}, Method: {method}"
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {
                            "code": "CSRF_VALIDATION_FAILED",
                            "message": "CSRF token invalid. Please refresh the page and try again."
                        }
                    }
                )

        # Process the request
        response: Response = await call_next(request)

        # Set CSRF cookie if not present (for all responses)
        if not csrf_cookie:
            new_token = generate_csrf_token()
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=new_token,
                httponly=False,  # Must be readable by JavaScript
                secure=settings.is_production,  # HTTPS only in production
                samesite="lax",  # Lax allows normal navigation but blocks cross-site requests
                max_age=60 * 60 * 24 * 7,  # 7 days
                path="/",
            )

        return response
