"""
Common imports and utilities for authentication endpoints.

This module provides shared dependencies, imports, and utilities
used across all auth endpoint modules.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address
from authlib.integrations.starlette_client import OAuth

from app.db.session import get_db
from app.models.user import User
from app.models.user_session import UserSession
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
from app.crud.profile import generate_unique_username


# Rate limiter instance
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


def create_router(tag_suffix: str = "") -> APIRouter:
    """Create a router with the auth prefix and tag."""
    tag = f"Authentication{'-' + tag_suffix if tag_suffix else ''}"
    return APIRouter(prefix="/auth", tags=[tag])


def generate_session_id() -> str:
    """Generate a unique session identifier using UUID4"""
    return str(uuid.uuid4())


def parse_user_agent(user_agent: str) -> dict:
    """Parse user agent string to extract browser and OS info"""
    browser = "Unknown"
    os = "Unknown"
    device_type = "desktop"

    if not user_agent:
        return {"browser": browser, "os": os, "device_type": device_type}

    user_agent_lower = user_agent.lower()

    # Detect OS
    if "windows" in user_agent_lower:
        os = "Windows"
    elif "mac os" in user_agent_lower or "macintosh" in user_agent_lower:
        os = "macOS"
    elif "linux" in user_agent_lower:
        os = "Linux"
    elif "android" in user_agent_lower:
        os = "Android"
        device_type = "mobile"
    elif "iphone" in user_agent_lower or "ipad" in user_agent_lower:
        os = "iOS"
        device_type = "mobile" if "iphone" in user_agent_lower else "tablet"

    # Detect browser
    if "chrome" in user_agent_lower and "edg" not in user_agent_lower:
        browser = "Chrome"
    elif "firefox" in user_agent_lower:
        browser = "Firefox"
    elif "safari" in user_agent_lower and "chrome" not in user_agent_lower:
        browser = "Safari"
    elif "edg" in user_agent_lower:
        browser = "Edge"
    elif "opera" in user_agent_lower or "opr" in user_agent_lower:
        browser = "Opera"

    return {"browser": browser, "os": os, "device_type": device_type}


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str
) -> None:
    """Set access and refresh token cookies on a response."""
    # Set access token as httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear access and refresh token cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


async def create_user_session(
    db: AsyncSession,
    user_id: int,
    request: Request,
    access_token: str
) -> UserSession:
    """Create a new user session record."""
    user_agent = request.headers.get("user-agent", "")
    ua_info = parse_user_agent(user_agent)
    client_ip = request.client.host if request.client else None
    session_id = generate_session_id()

    new_session = UserSession(
        user_id=user_id,
        session_token=session_id,
        device_type=ua_info["device_type"],
        browser=ua_info["browser"],
        os=ua_info["os"],
        ip_address=client_ip,
        user_agent=user_agent,
        location="Current session",
        is_active=True,
        created_at=datetime.utcnow(),
        last_active_at=datetime.utcnow(),
    )
    db.add(new_session)
    await db.commit()

    # Store session ID in Redis for quick lookup
    redis_service.set_session_mapping(access_token, session_id)

    return new_session
