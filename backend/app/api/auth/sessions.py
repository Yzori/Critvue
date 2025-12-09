"""
Authentication - Session Management Endpoints

View and manage user sessions across devices.
"""

from datetime import datetime
from typing import Optional

from fastapi import Cookie, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.auth.common import (
    create_router,
    get_db,
    get_current_user,
    User,
    UserSession,
    redis_service,
    security_logger,
    HTTPException,
)

router = create_router("sessions")


@router.get("/sessions")
async def get_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    access_token: Optional[str] = Cookie(None)
) -> list[dict]:
    """
    Get all active sessions for the current user.
    """
    # Get current session token from Redis mapping
    current_session_token = None
    if access_token:
        current_session_token = redis_service.get_session_id(access_token)

    # Get all active sessions for user
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == current_user.id)
        .where(UserSession.is_active == True)
        .order_by(UserSession.last_active_at.desc())
    )
    sessions = result.scalars().all()

    return [
        {
            "id": str(session.id),
            "device": session.device_type or "Desktop",
            "browser": session.browser or "Unknown",
            "os": session.os or "Unknown",
            "location": session.location or "Unknown location",
            "last_active": session.last_active_at.isoformat() if session.last_active_at else None,
            "is_current": session.session_token == current_session_token if current_session_token else False,
        }
        for session in sessions
    ]


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Revoke a specific session by ID.
    """
    # Find the session
    result = await db.execute(
        select(UserSession)
        .where(UserSession.id == session_id)
        .where(UserSession.user_id == current_user.id)
        .where(UserSession.is_active == True)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # Revoke the session
    session.is_active = False
    session.revoked_at = datetime.utcnow()
    await db.commit()

    security_logger.log_auth_success(
        current_user.email,
        request,
        event_type="session_revoked"
    )

    return {"message": "Session revoked successfully"}


@router.delete("/sessions")
async def revoke_all_other_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    access_token: Optional[str] = Cookie(None)
) -> dict:
    """
    Revoke all sessions except the current one.
    """
    # Get current session token from Redis mapping
    current_session_token = None
    if access_token:
        current_session_token = redis_service.get_session_id(access_token)

    # Get all active sessions except current
    result = await db.execute(
        select(UserSession)
        .where(UserSession.user_id == current_user.id)
        .where(UserSession.is_active == True)
    )
    sessions = result.scalars().all()

    revoked_count = 0
    for session in sessions:
        if session.session_token != current_session_token:
            session.is_active = False
            session.revoked_at = datetime.utcnow()
            revoked_count += 1

    await db.commit()

    security_logger.log_auth_success(
        current_user.email,
        request,
        event_type="all_sessions_revoked"
    )

    return {
        "message": f"Revoked {revoked_count} session(s)",
        "revoked_count": revoked_count
    }
