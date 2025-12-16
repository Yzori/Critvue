"""Common dependencies and helpers for review slots endpoints"""

import logging
from functools import wraps
from typing import Callable, TypeVar

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.review_slot import ReviewSlot
from app.models.review_request import ReviewRequest
from app.crud import review_slot as crud_review_slot
from app.core.exceptions import (
    SlotNotFoundError,
    NotOwnerError,
    InvalidStateError,
    AdminRequiredError,
    InternalError,
)

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Type variable for generic return type
T = TypeVar("T")


async def get_slot_with_access_check(
    db: AsyncSession,
    slot_id: int,
    user_id: int,
    require_reviewer: bool = False,
    require_requester: bool = False,
    allowed_statuses: list[str] | None = None,
) -> ReviewSlot:
    """
    Fetch a review slot with access validation.

    Args:
        db: Database session
        slot_id: ID of the slot to fetch
        user_id: ID of the user making the request
        require_reviewer: If True, user must be the reviewer
        require_requester: If True, user must be the requester
        allowed_statuses: List of allowed slot statuses

    Returns:
        ReviewSlot if found and access is valid

    Raises:
        SlotNotFoundError: If slot doesn't exist
        NotOwnerError: If user doesn't have access
        InvalidStateError: If slot status is not allowed
    """
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=user_id)

    if not slot:
        raise SlotNotFoundError()

    if require_reviewer and slot.reviewer_id != user_id:
        raise NotOwnerError(message="Not your review")

    if require_requester:
        # Need to check if user is the owner of the review request
        if not slot.review_request or slot.review_request.user_id != user_id:
            raise NotOwnerError(message="Not your review request")

    if allowed_statuses and slot.status not in allowed_statuses:
        raise InvalidStateError(
            message=f"Cannot perform this action on a {slot.status} slot",
            current_state=slot.status,
            allowed_states=allowed_statuses,
        )

    return slot


def require_admin(user: User) -> None:
    """
    Verify user is an admin.

    Raises:
        AdminRequiredError: If user is not an admin
    """
    if not user.is_admin:
        raise AdminRequiredError()
