"""Smart Adaptive Review Editor endpoints"""

import json
import logging
from datetime import datetime, timedelta

from bleach import clean
from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.crud import review_slot as crud_review_slot
from app.models.user import User
from app.models.review_request import ReviewRequest
from app.schemas.review_slot import (
    ReviewSlotResponse,
    DraftSaveSuccess,
    SmartReviewSubmit,
)
from app.services.review_sparks_hooks import on_review_submitted
from app.services.notification_triggers import notify_review_submitted, notify_elaboration_submitted
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

ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li', 'strong', 'em']


@router.get(
    "/rubrics/{content_type}",
    status_code=status.HTTP_200_OK
)
@limiter.limit("120/minute")
async def get_rubric(
    request: Request,
    content_type: str,
    subcategory: str = None
):
    """
    Get rubric configuration for a content type and optional subcategory

    **Content Types:** code, design, writing, art, audio, video

    **Subcategories (optional):**
    - code: frontend, backend, database, devops, mobile, algorithm
    - design: ui_ux, branding, marketing, web_design, mobile_design, print
    - art: illustration, traditional, 3d_modeling, concept_art, character_design, digital_painting
    - audio: voiceover, podcast, music, sound_design, mixing
    - video: filmed, edited_clip, animation, game_capture, tutorial, short_form
    - writing: blog_article, technical, creative, marketing_copy, script, academic

    Returns focus areas, rating dimensions, and section prompts.

    **Rate Limit:** 120 requests per minute
    """
    from app.constants.review_rubrics import get_rubric as get_rubric_config

    try:
        rubric = get_rubric_config(content_type, subcategory)
        return rubric
    except Exception as e:
        logger.error(f"Error getting rubric for content type {content_type} (subcategory: {subcategory}): {e}")
        raise InternalError(message="An error occurred while fetching rubric")


@router.get(
    "/{slot_id}/sections",
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def get_review_sections(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get context-aware section templates for a review slot

    Returns appropriate sections based on:
    - Content Type (design, code, writing, etc.)
    - Feedback Priority (validation, specific_fixes, etc.)
    - Review Tier (quick, standard, deep)

    **Requirements:**
    - User must be the reviewer who claimed the slot

    **Rate Limit:** 20 requests per minute
    """
    slot = await get_slot_with_access_check(
        db, slot_id, current_user.id,
        require_reviewer=True
    )

    review_request = await db.get(ReviewRequest, slot.review_request_id)
    if not review_request:
        raise SlotNotFoundError(resource="Review request")

    from app.config.review_sections import get_sections, calculate_min_total_words

    sections = get_sections(
        content_type=review_request.content_type.value,
        feedback_priority=review_request.feedback_priority.value if review_request.feedback_priority else "specific_fixes",
        review_tier=review_request.review_tier.value if review_request.review_tier else "standard"
    )

    # Merge with draft data if available
    if slot.draft_sections:
        try:
            draft_sections = json.loads(slot.draft_sections) if isinstance(slot.draft_sections, str) else slot.draft_sections
            section_dict = {s["id"]: s for s in sections}
            for draft in draft_sections:
                if draft["id"] in section_dict:
                    section_dict[draft["id"]]["content"] = draft.get("content", "")
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.error(f"Failed to parse draft sections for slot {slot_id}: {e}")

    return JSONResponse({
        "sections": sections,
        "context": {
            "content_type": review_request.content_type.value,
            "feedback_priority": review_request.feedback_priority.value if review_request.feedback_priority else "specific_fixes",
            "review_tier": review_request.review_tier.value if review_request.review_tier else "standard",
            "min_total_words": calculate_min_total_words(sections),
            "has_draft": bool(slot.draft_sections)
        }
    })


@router.post(
    "/{slot_id}/smart-review/submit",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def submit_smart_review(
    request: Request,
    slot_id: int,
    review_data: SmartReviewSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a Smart Adaptive Review

    **Requirements:**
    - Slot must be in 'claimed' status
    - User must be the reviewer who claimed the slot
    - Phase 1 and Phase 2 must be completed
    - Phase 3 is recommended but optional

    **Rate Limit:** 20 requests per minute
    """
    slot = await get_slot_with_access_check(
        db, slot_id, current_user.id,
        require_reviewer=True,
        allowed_statuses=["claimed", "elaboration_requested"]
    )

    is_elaboration_response = slot.status == "elaboration_requested"

    # Validate required phases
    smart_review = review_data.smart_review
    if not smart_review.phase1_quick_assessment:
        raise InvalidInputError(message="Phase 1 (Quick Assessment) is required")

    if not smart_review.phase2_rubric:
        raise InvalidInputError(message="Phase 2 (Rubric Ratings) is required")

    # Sanitize and convert to dict
    review_dict = smart_review.model_dump(exclude_none=True)

    if review_dict.get('phase1_quick_assessment'):
        phase1 = review_dict['phase1_quick_assessment']
        if 'quick_summary' in phase1:
            phase1['quick_summary'] = clean(phase1['quick_summary'], tags=ALLOWED_TAGS, strip=True)

    if review_dict.get('phase3_detailed_feedback'):
        phase3 = review_dict['phase3_detailed_feedback']
        if 'strengths' in phase3:
            phase3['strengths'] = [clean(item, tags=ALLOWED_TAGS, strip=True) for item in phase3['strengths']]
        if 'improvements' in phase3:
            phase3['improvements'] = [clean(item, tags=ALLOWED_TAGS, strip=True) for item in phase3['improvements']]
        if 'additional_notes' in phase3:
            phase3['additional_notes'] = clean(phase3['additional_notes'], tags=ALLOWED_TAGS, strip=True)

    def json_serial(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    slot.draft_sections = json.dumps(review_dict, default=json_serial)
    slot.feedback_sections = None
    slot.rating = smart_review.phase1_quick_assessment.overall_rating

    # Generate review_text summary
    summary_parts = [f"**Summary:** {smart_review.phase1_quick_assessment.quick_summary}"]

    if smart_review.phase3_detailed_feedback and smart_review.phase3_detailed_feedback.strengths:
        summary_parts.append("\n**Strengths:**")
        for strength in smart_review.phase3_detailed_feedback.strengths:
            summary_parts.append(f"- {strength}")

    if smart_review.phase3_detailed_feedback and smart_review.phase3_detailed_feedback.improvements:
        summary_parts.append("\n**Areas for Improvement:**")
        for improvement in smart_review.phase3_detailed_feedback.improvements:
            summary_parts.append(f"- {improvement}")

    if smart_review.phase3_detailed_feedback and smart_review.phase3_detailed_feedback.additional_notes:
        summary_parts.append(f"\n**Additional Notes:**\n{smart_review.phase3_detailed_feedback.additional_notes}")

    slot.review_text = "\n".join(summary_parts)
    slot.status = "submitted"
    slot.submitted_at = datetime.utcnow()
    slot.auto_accept_at = datetime.utcnow() + timedelta(days=7)

    await db.commit()
    await db.refresh(slot)

    if is_elaboration_response:
        await notify_elaboration_submitted(db, slot_id, current_user.id)
        logger.info(f"User {current_user.id} responded to elaboration request for slot {slot_id}")
    else:
        await on_review_submitted(db, slot.id, current_user.id)
        await notify_review_submitted(db, slot_id, current_user.id)
        logger.info(f"User {current_user.id} submitted Smart Review for slot {slot_id}")

    return slot


@router.post(
    "/{slot_id}/studio/submit",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def submit_studio_review(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a Review Studio review (ReviewStudioState format).

    Stores ReviewStudioState directly in draft_sections and marks slot as submitted.

    **Requirements:**
    - Slot must be in 'claimed' status
    - User must be the reviewer who claimed the slot
    - Must have at least one issue or strength card with content
    - Must have a verdict with rating

    **Rate Limit:** 20 requests per minute
    """
    body = await request.json()

    # First check authorization
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=current_user.id)
    if not slot:
        raise SlotNotFoundError()

    if slot.reviewer_id != current_user.id:
        raise NotOwnerError(message="Not your review")

    # Acquire row-level lock
    slot = await crud_review_slot.get_review_slot_with_lock(db, slot_id)
    is_elaboration_response = slot and slot.status == "elaboration_requested"

    if not slot or slot.status not in ("claimed", "elaboration_requested"):
        raise InvalidStateError(
            message="Cannot submit review for this slot status",
            current_state=slot.status if slot else "unknown",
            allowed_states=["claimed", "elaboration_requested"]
        )

    # Validate minimum requirements
    issue_cards = body.get("issueCards", [])
    strength_cards = body.get("strengthCards", [])
    verdict = body.get("verdictCard", {})

    has_content = False
    for card in issue_cards:
        if card.get("issue") and len(card.get("issue", "").strip()) > 0:
            has_content = True
            break
    if not has_content:
        for card in strength_cards:
            if card.get("what") and len(card.get("what", "").strip()) > 0:
                has_content = True
                break

    if not has_content:
        raise InvalidInputError(message="Must have at least one issue or strength with content")

    if not verdict.get("rating") or verdict.get("rating") < 1:
        raise InvalidInputError(message="Must provide an overall rating")

    body["_format"] = "studio"
    body["_version"] = "2.0"
    body["_submitted_at"] = datetime.utcnow().isoformat()

    slot.draft_sections = json.dumps(body)
    slot.status = "submitted"
    slot.rating = verdict.get("rating")
    slot.submitted_at = datetime.utcnow()
    slot.updated_at = datetime.utcnow()
    slot.auto_accept_at = datetime.utcnow() + timedelta(hours=72)

    await db.commit()
    await db.refresh(slot)

    if is_elaboration_response:
        await notify_elaboration_submitted(db, slot_id, current_user.id)
        logger.info(f"User {current_user.id} responded to elaboration request (Studio) for slot {slot_id}")
    else:
        await on_review_submitted(db, slot.id, current_user.id)
        await notify_review_submitted(db, slot_id, current_user.id)
        logger.info(f"User {current_user.id} submitted Studio Review for slot {slot_id}")

    return slot
