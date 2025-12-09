"""
Authentication - Google OAuth Endpoints

OAuth flow for Google authentication.
"""

from datetime import datetime

from fastapi import Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.auth.common import (
    create_router,
    get_db,
    oauth,
    User,
    create_access_token,
    create_refresh_token,
    security_logger,
    settings,
    set_auth_cookies,
)

router = create_router("oauth")


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

        # Set cookies
        set_auth_cookies(response, access_token, refresh_token)

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
