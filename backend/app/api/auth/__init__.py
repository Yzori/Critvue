"""
Authentication API Endpoints Package

This package contains authentication endpoints organized into modules:
- registration: User registration
- login: Login, logout, token refresh, password change
- oauth: Google OAuth flow
- sessions: Session management (view, revoke)
- email_verification: Email verification and resend

Usage:
    from app.api.auth import router

    # Include in main app
    app.include_router(router, prefix="/api/v1")
"""

from fastapi import APIRouter

from app.api.auth.registration import router as registration_router
from app.api.auth.login import router as login_router
from app.api.auth.oauth import router as oauth_router
from app.api.auth.sessions import router as sessions_router
from app.api.auth.email_verification import router as email_verification_router

# Re-export get_current_user for backwards compatibility
# (some modules import it from here instead of app.api.deps)
from app.api.deps import get_current_user

# Create main router that combines all sub-routers
router = APIRouter(tags=["Authentication"])

# Include all sub-routers
router.include_router(registration_router)
router.include_router(login_router)
router.include_router(oauth_router)
router.include_router(sessions_router)
router.include_router(email_verification_router)

__all__ = ["router", "get_current_user"]
