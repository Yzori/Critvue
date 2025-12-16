"""
Unsubscribe API Endpoints

Handles email unsubscribe functionality for compliance with CAN-SPAM and GDPR.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.services.unsubscribe import (
    unsubscribe_by_token,
    resubscribe_by_token,
    get_user_from_unsubscribe_token,
)
from app.core.exceptions import InvalidInputError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/unsubscribe", tags=["Email Preferences"])


class UnsubscribeRequest(BaseModel):
    """Request body for unsubscribe."""
    token: str
    category: Optional[str] = None  # Optional category to unsubscribe from


class UnsubscribeResponse(BaseModel):
    """Response for unsubscribe operations."""
    success: bool
    message: str
    email: Optional[str] = None  # Masked email for confirmation


def mask_email(email: str) -> str:
    """Mask email for display (e.g., j***@example.com)"""
    if not email or "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[0] + "***" + local[-1]
    return f"{masked_local}@{domain}"


@router.post("", response_model=UnsubscribeResponse)
async def unsubscribe(
    data: UnsubscribeRequest,
    db: AsyncSession = Depends(get_db)
) -> UnsubscribeResponse:
    """
    Unsubscribe from email notifications using token.

    This endpoint supports one-click unsubscribe as required by email regulations.
    No authentication required - uses secure token.
    """
    # Get user for email masking
    user = await get_user_from_unsubscribe_token(db, data.token)
    masked = mask_email(user.email) if user else None

    success, message = await unsubscribe_by_token(db, data.token, data.category)

    if not success:
        raise InvalidInputError(message=message)

    return UnsubscribeResponse(
        success=success,
        message=message,
        email=masked,
    )


@router.get("", response_model=UnsubscribeResponse)
async def unsubscribe_get(
    token: str = Query(..., description="Unsubscribe token"),
    category: Optional[str] = Query(None, description="Category to unsubscribe from"),
    db: AsyncSession = Depends(get_db)
) -> UnsubscribeResponse:
    """
    Unsubscribe from email notifications using token (GET method).

    This endpoint supports one-click unsubscribe via link click.
    Used for email client compatibility that don't support POST.
    """
    # Get user for email masking
    user = await get_user_from_unsubscribe_token(db, token)
    masked = mask_email(user.email) if user else None

    success, message = await unsubscribe_by_token(db, token, category)

    if not success:
        raise InvalidInputError(message=message)

    return UnsubscribeResponse(
        success=success,
        message=message,
        email=masked,
    )


@router.post("/resubscribe", response_model=UnsubscribeResponse)
async def resubscribe(
    data: UnsubscribeRequest,
    db: AsyncSession = Depends(get_db)
) -> UnsubscribeResponse:
    """
    Re-subscribe to email notifications.

    Used when a user wants to re-enable emails after unsubscribing.
    """
    # Get user for email masking
    user = await get_user_from_unsubscribe_token(db, data.token)
    masked = mask_email(user.email) if user else None

    success, message = await resubscribe_by_token(db, data.token)

    if not success:
        raise InvalidInputError(message=message)

    return UnsubscribeResponse(
        success=success,
        message=message,
        email=masked,
    )
