"""Draft operations for review slots (legacy, smart review, and studio formats)"""

import json
import logging
from datetime import datetime

from bleach import clean
from fastapi import APIRouter, Depends, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.crud import review_slot as crud_review_slot
from app.models.user import User
from app.schemas.review_slot import (
    FeedbackSection,
    DraftSave,
    DraftResponse,
    DraftSaveSuccess,
    SmartReviewDraft,
)
from app.core.exceptions import (
    SlotNotFoundError,
    NotOwnerError,
    InvalidStateError,
    InvalidInputError,
    InternalError,
)

from .common import limiter, get_slot_with_access_check

logger = logging.getLogger(__name__)

router = APIRouter(tags=["review-slots"])

# Allowed HTML tags for sanitization
ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li', 'strong', 'em']


# =============================================================================
# Legacy Draft Endpoints
# =============================================================================

@router.post(
    "/{slot_id}/save-draft",
    response_model=DraftSaveSuccess,
    status_code=status.HTTP_200_OK
)
@limiter.limit("60/minute")
async def save_review_draft(
    request: Request,
    slot_id: int,
    draft_data: DraftSave,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Auto-save review draft (legacy format)

    **Requirements:**
    - User must be the reviewer who claimed the slot
    - Slot must be in 'claimed' status

    **Rate Limit:** 60 requests per minute (for frequent auto-saves)
    """
    slot = await get_slot_with_access_check(
        db, slot_id, current_user.id,
        require_reviewer=True,
        allowed_statuses=["claimed"]
    )

    # Sanitize and convert sections to dict
    sections_data = []
    for section in draft_data.sections:
        section_dict = section.model_dump()
        section_dict['content'] = clean(
            section_dict['content'],
            tags=ALLOWED_TAGS,
            strip=True
        )
        sections_data.append(section_dict)

    slot.draft_sections = json.dumps(sections_data)

    if draft_data.rating is not None:
        slot.rating = draft_data.rating

    slot.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(slot)

    logger.info(f"User {current_user.id} saved draft for slot {slot_id}")

    return DraftSaveSuccess(
        success=True,
        last_saved_at=slot.updated_at
    )


@router.get(
    "/{slot_id}/draft",
    response_model=DraftResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("60/minute")
async def load_review_draft(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Load saved review draft (legacy format)

    Returns 404 if no draft exists (which is valid - frontend handles this)
    """
    slot = await get_slot_with_access_check(
        db, slot_id, current_user.id,
        require_reviewer=True
    )

    if not slot.draft_sections:
        raise SlotNotFoundError(message="No draft found")

    try:
        draft_sections_data = json.loads(slot.draft_sections) if isinstance(slot.draft_sections, str) else slot.draft_sections
    except json.JSONDecodeError as e:
        logger.error(f"Corrupted draft data for slot {slot_id}: {e}")
        raise InvalidInputError(message="Draft data is corrupted and cannot be loaded")

    # Check if this is Smart Review data
    if isinstance(draft_sections_data, dict) and any(key.startswith('phase') for key in draft_sections_data.keys()):
        raise SlotNotFoundError(message="No legacy draft found. Use smart-review/draft endpoint instead.")

    if not isinstance(draft_sections_data, list):
        raise InvalidInputError(message="Invalid draft format")

    sections = [FeedbackSection(**section) for section in draft_sections_data]
    logger.info(f"User {current_user.id} loaded draft for slot {slot_id}")

    return DraftResponse(
        sections=sections,
        rating=slot.rating,
        last_saved_at=slot.updated_at
    )


# =============================================================================
# Smart Review Draft Endpoints
# =============================================================================

@router.post(
    "/{slot_id}/smart-review/save-draft",
    response_model=DraftSaveSuccess,
    status_code=status.HTTP_200_OK
)
@limiter.limit("60/minute")
async def save_smart_review_draft(
    request: Request,
    slot_id: int,
    draft_data: SmartReviewDraft,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save Smart Adaptive Review Editor draft

    **Requirements:**
    - User must be the reviewer who claimed the slot
    - Slot must be in 'claimed' status

    **Rate Limit:** 60 requests per minute (for frequent auto-saves)
    """
    slot = await get_slot_with_access_check(
        db, slot_id, current_user.id,
        require_reviewer=True,
        allowed_statuses=["claimed"]
    )

    draft_dict = draft_data.model_dump(exclude_none=True)

    # Sanitize Phase 1 quick summary
    if draft_dict.get('phase1_quick_assessment'):
        phase1 = draft_dict['phase1_quick_assessment']
        if 'quick_summary' in phase1:
            phase1['quick_summary'] = clean(phase1['quick_summary'], tags=ALLOWED_TAGS, strip=True)

    # Sanitize Phase 3 detailed feedback
    if draft_dict.get('phase3_detailed_feedback'):
        phase3 = draft_dict['phase3_detailed_feedback']
        if 'strengths' in phase3:
            phase3['strengths'] = [clean(item, tags=ALLOWED_TAGS, strip=True) for item in phase3['strengths']]
        if 'improvements' in phase3:
            phase3['improvements'] = [clean(item, tags=ALLOWED_TAGS, strip=True) for item in phase3['improvements']]
        if 'additional_notes' in phase3:
            phase3['additional_notes'] = clean(phase3['additional_notes'], tags=ALLOWED_TAGS, strip=True)

    slot.draft_sections = json.dumps(jsonable_encoder(draft_dict))

    if draft_dict.get('phase1_quick_assessment', {}).get('overall_rating'):
        slot.rating = draft_dict['phase1_quick_assessment']['overall_rating']

    slot.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(slot)

    logger.info(f"User {current_user.id} saved Smart Review draft for slot {slot_id}")

    return DraftSaveSuccess(success=True, last_saved_at=slot.updated_at)


@router.get(
    "/{slot_id}/smart-review/draft",
    response_model=SmartReviewDraft,
    status_code=status.HTTP_200_OK
)
@limiter.limit("30/minute")
async def get_smart_review_draft(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get Smart Adaptive Review Editor draft

    **Requirements:**
    - User must be the reviewer who claimed the slot
    - Slot must be in 'claimed' status

    **Rate Limit:** 30 requests per minute
    """
    slot = await get_slot_with_access_check(
        db, slot_id, current_user.id,
        require_reviewer=True
    )

    if slot.draft_sections:
        try:
            draft_data = json.loads(slot.draft_sections)
        except json.JSONDecodeError as e:
            logger.error(f"Corrupted Smart Review draft data for slot {slot_id}: {e}")
            raise InvalidInputError(message="Draft data is corrupted and cannot be loaded")
        return SmartReviewDraft(**draft_data)
    else:
        return SmartReviewDraft()


# =============================================================================
# Studio Draft Endpoints
# =============================================================================

@router.post(
    "/{slot_id}/studio/save-draft",
    response_model=DraftSaveSuccess,
    status_code=status.HTTP_200_OK
)
@limiter.limit("60/minute")
async def save_studio_draft(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Save Review Studio draft (ReviewStudioState format) directly.

    Accepts raw JSON and stores it directly in draft_sections without conversion.
    This preserves all card data including annotations with their linked card IDs.

    **Requirements:**
    - User must be the reviewer who claimed the slot
    - Slot must be in 'claimed' status

    **Rate Limit:** 60 requests per minute
    """
    body = await request.json()

    slot = await get_slot_with_access_check(
        db, slot_id, current_user.id,
        require_reviewer=True,
        allowed_statuses=["claimed"]
    )

    # Mark as studio format and store directly
    body["_format"] = "studio"
    body["_version"] = "2.0"
    slot.draft_sections = json.dumps(body)

    if body.get("verdictCard", {}).get("rating"):
        slot.rating = body["verdictCard"]["rating"]

    slot.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(slot)

    logger.info(f"User {current_user.id} saved Studio draft for slot {slot_id}")

    return DraftSaveSuccess(success=True, last_saved_at=slot.updated_at)


@router.get(
    "/{slot_id}/studio/draft",
    status_code=status.HTTP_200_OK
)
@limiter.limit("30/minute")
async def get_studio_draft(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get Review Studio draft (ReviewStudioState format) directly.

    Returns the raw JSON stored in draft_sections without conversion.

    **Requirements:**
    - User must be the reviewer who claimed the slot, OR
    - User is the creator viewing a submitted review

    **Rate Limit:** 30 requests per minute
    """
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=current_user.id)

    if not slot:
        raise SlotNotFoundError()

    is_reviewer = slot.reviewer_id == current_user.id
    is_creator = slot.review_request and slot.review_request.user_id == current_user.id

    if not is_reviewer and not is_creator:
        raise NotOwnerError(message="Not authorized to access this draft")

    if is_creator and not is_reviewer and slot.status != "submitted":
        raise NotOwnerError(message="Review not yet submitted")

    if slot.draft_sections:
        try:
            draft_data = json.loads(slot.draft_sections)
        except json.JSONDecodeError as e:
            logger.error(f"Corrupted Studio draft data for slot {slot_id}: {e}")
            raise InvalidInputError(message="Draft data is corrupted and cannot be loaded")
        return JSONResponse(content=draft_data)
    else:
        return JSONResponse(content={})
