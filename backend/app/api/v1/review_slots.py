"""API endpoints for review slots"""

import logging
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, get_db
from app.crud import review_slot as crud_review_slot
from app.models.user import User
from app.models.review_slot import ReviewSlot, RejectionReason, DisputeResolution
from app.models.review_request import ReviewRequest
from app.schemas.review_slot import (
    ReviewSlotResponse,
    ReviewSlotPublicResponse,
    ReviewSlotListResponse,
    ReviewerSlotListResponse,
    ReviewSubmit,
    ReviewAccept,
    ReviewReject,
    ReviewDispute,
    DisputeResolve,
    ReviewerSlotWithRequest,
    DraftSave,
    DraftResponse,
    DraftSaveSuccess,
    SmartReviewDraft,
    SmartReviewSubmit,
)
from app.services.claim_service import claim_service, ClaimValidationError
from app.services.review_karma_hooks import (
    on_review_submitted,
    on_review_accepted,
    on_review_rejected,
    on_claim_abandoned,
    on_dispute_created,
    on_dispute_resolved
)
from app.services.notification_triggers import (
    notify_slot_claimed,
    notify_slot_abandoned,
    notify_review_submitted,
    notify_review_accepted,
    notify_review_rejected,
    notify_dispute_created,
    notify_dispute_resolved,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/review-slots", tags=["review-slots"])

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


# ===== Claim Operations =====

@router.post(
    "/{slot_id}/claim",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def claim_review_slot(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Claim a review slot for review

    **Requirements:**
    - Slot must be in 'available' status
    - User cannot claim slots from their own review requests
    - User cannot claim multiple slots for the same request

    **Rate Limit:** 20 requests per minute
    """
    try:
        # Claim the slot using shared service
        claimed_slot = await claim_service.claim_review_by_slot_id(
            db, slot_id, current_user.id
        )

        # Send notification to requester
        await notify_slot_claimed(db, slot_id, current_user.id)

        logger.info(f"User {current_user.id} claimed slot {slot_id}")

        return claimed_slot

    except ClaimValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error claiming slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while claiming the slot"
        )


@router.post(
    "/{slot_id}/abandon",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def abandon_review_slot(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Abandon a claimed review slot

    **Requirements:**
    - Slot must be in 'claimed' status
    - User must be the reviewer who claimed the slot

    **Rate Limit:** 20 requests per minute
    """
    try:
        # Abandon using shared service
        abandoned_slot = await claim_service.unclaim_review_slot(
            db, slot_id, current_user.id
        )

        # Award karma penalty for abandoning claim
        await on_claim_abandoned(db, abandoned_slot.id, current_user.id)

        # Send notification to requester
        await notify_slot_abandoned(db, slot_id, current_user.id)

        logger.info(f"User {current_user.id} abandoned slot {slot_id}")

        return abandoned_slot

    except ClaimValidationError as e:
        # ClaimValidationError can include permission errors
        error_msg = str(e)
        if "don't own" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error abandoning slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while abandoning the slot"
        )


# ===== Submit Review =====

@router.post(
    "/{slot_id}/submit",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def submit_review(
    request: Request,
    slot_id: int,
    review_data: ReviewSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a review for a claimed slot

    **Requirements:**
    - Slot must be in 'claimed' status
    - User must be the reviewer who claimed the slot
    - Review text must be at least 50 characters
    - Rating must be between 1-5

    **Rate Limit:** 20 requests per minute
    """
    try:
        # Convert Pydantic models to dicts for CRUD function
        feedback_sections = None
        if review_data.feedback_sections:
            feedback_sections = [section.model_dump() for section in review_data.feedback_sections]

        annotations = None
        if review_data.annotations:
            annotations = [annotation.model_dump() for annotation in review_data.annotations]

        submitted_slot = await crud_review_slot.submit_review(
            db,
            slot_id,
            current_user.id,
            review_data.review_text,
            review_data.rating,
            review_data.attachments,
            feedback_sections,
            annotations
        )

        # Award karma for submitting review
        await on_review_submitted(db, submitted_slot.id, current_user.id)

        # Send notification to requester
        await notify_review_submitted(db, slot_id, current_user.id)

        logger.info(f"User {current_user.id} submitted review for slot {slot_id}")

        return submitted_slot

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error submitting review for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while submitting the review"
        )


# ===== Draft Operations =====

@router.post(
    "/{slot_id}/save-draft",
    response_model=DraftSaveSuccess,
    status_code=status.HTTP_200_OK
)
@limiter.limit("60/minute")  # Higher limit for frequent auto-saves
async def save_review_draft(
    request: Request,
    slot_id: int,
    draft_data: DraftSave,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Auto-save review draft

    **Requirements:**
    - User must be the reviewer who claimed the slot
    - Slot must be in 'claimed' status

    **Rate Limit:** 60 requests per minute (for frequent auto-saves)
    """
    try:
        slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=current_user.id)

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found"
            )

        if slot.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not your review"
            )

        if slot.status.value != "claimed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot save draft for non-claimed slot"
            )

        # Save draft sections as JSON with sanitization
        import json
        from datetime import datetime
        from bleach import clean

        # Allowed HTML tags (basic formatting only)
        ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li', 'strong', 'em']

        # Sanitize and convert sections to dict
        sections_data = []
        for section in draft_data.sections:
            section_dict = section.model_dump()
            # Sanitize HTML content to prevent XSS
            section_dict['content'] = clean(
                section_dict['content'],
                tags=ALLOWED_TAGS,
                strip=True
            )
            sections_data.append(section_dict)

        slot.draft_sections = json.dumps(sections_data)

        # Save draft rating if provided
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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving draft for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while saving draft"
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
    Load saved review draft

    Returns 404 if no draft exists (which is valid - frontend handles this)
    """
    try:
        slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=current_user.id)

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found"
            )

        if slot.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not your review"
            )

        if not slot.draft_sections:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No draft found"
            )

        # Parse draft sections from JSON
        import json
        from app.schemas.review_slot import FeedbackSection

        draft_sections_data = json.loads(slot.draft_sections) if isinstance(slot.draft_sections, str) else slot.draft_sections

        # Check if this is Smart Review data (dict with phase keys) or legacy data (list)
        if isinstance(draft_sections_data, dict) and any(key.startswith('phase') for key in draft_sections_data.keys()):
            # This is Smart Review data, not legacy draft data
            # Return empty draft - frontend should use smart-review endpoint instead
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No legacy draft found. Use smart-review/draft endpoint instead."
            )

        # Convert to FeedbackSection objects (legacy format)
        if not isinstance(draft_sections_data, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid draft format"
            )

        sections = [FeedbackSection(**section) for section in draft_sections_data]

        logger.info(f"User {current_user.id} loaded draft for slot {slot_id}")

        return DraftResponse(
            sections=sections,
            rating=slot.rating,
            last_saved_at=slot.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading draft for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while loading draft"
        )


# ===== Smart Adaptive Review Editor Endpoints =====

@router.get(
    "/rubrics/{content_type}",
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
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
    If subcategory is provided, returns specialized rubric with additional rating dimensions.

    **Rate Limit:** 20 requests per minute
    """
    from app.constants.review_rubrics import get_rubric as get_rubric_config

    try:
        rubric = get_rubric_config(content_type, subcategory)
        return rubric
    except Exception as e:
        logger.error(f"Error getting rubric for content type {content_type} (subcategory: {subcategory}): {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching rubric"
        )


@router.post(
    "/{slot_id}/smart-review/save-draft",
    response_model=DraftSaveSuccess,
    status_code=status.HTTP_200_OK
)
@limiter.limit("60/minute")  # Higher limit for frequent auto-saves
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
    import json
    from datetime import datetime
    from bleach import clean

    # Allowed HTML tags (basic formatting only)
    ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li', 'strong', 'em']

    try:
        slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=current_user.id)

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found"
            )

        if slot.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not your review"
            )

        if slot.status != "claimed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot save draft for non-claimed slot"
            )

        # Convert draft to dict and sanitize
        draft_dict = draft_data.model_dump(exclude_none=True)

        # Sanitize Phase 1 quick summary
        if draft_dict.get('phase1_quick_assessment'):
            phase1 = draft_dict['phase1_quick_assessment']
            if 'quick_summary' in phase1:
                phase1['quick_summary'] = clean(
                    phase1['quick_summary'],
                    tags=ALLOWED_TAGS,
                    strip=True
                )

        # Sanitize Phase 3 detailed feedback
        if draft_dict.get('phase3_detailed_feedback'):
            phase3 = draft_dict['phase3_detailed_feedback']

            # Sanitize strengths list
            if 'strengths' in phase3:
                phase3['strengths'] = [
                    clean(item, tags=ALLOWED_TAGS, strip=True)
                    for item in phase3['strengths']
                ]

            # Sanitize improvements list
            if 'improvements' in phase3:
                phase3['improvements'] = [
                    clean(item, tags=ALLOWED_TAGS, strip=True)
                    for item in phase3['improvements']
                ]

            # Sanitize additional notes
            if 'additional_notes' in phase3:
                phase3['additional_notes'] = clean(
                    phase3['additional_notes'],
                    tags=ALLOWED_TAGS,
                    strip=True
                )

        # Save as JSON in draft_sections field
        slot.draft_sections = json.dumps(draft_dict)

        # Also save overall rating for backward compatibility
        if draft_dict.get('phase1_quick_assessment', {}).get('overall_rating'):
            slot.rating = draft_dict['phase1_quick_assessment']['overall_rating']

        slot.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(slot)

        logger.info(f"User {current_user.id} saved Smart Review draft for slot {slot_id}")

        return DraftSaveSuccess(
            success=True,
            last_saved_at=slot.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving Smart Review draft for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while saving draft"
        )


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
    import json

    try:
        slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=current_user.id)

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found"
            )

        if slot.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not your review"
            )

        # Parse draft_sections JSON
        if slot.draft_sections:
            draft_data = json.loads(slot.draft_sections)
            return SmartReviewDraft(**draft_data)
        else:
            # Return empty draft
            return SmartReviewDraft()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading Smart Review draft for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while loading draft"
        )


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
    import json
    from bleach import clean
    from datetime import datetime

    # Allowed HTML tags (basic formatting only)
    ALLOWED_TAGS = ['b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li', 'strong', 'em']

    try:
        slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=current_user.id)

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found"
            )

        if slot.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not your review"
            )

        if slot.status != "claimed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot submit review for non-claimed slot"
            )

        # Validate required phases
        smart_review = review_data.smart_review
        if not smart_review.phase1_quick_assessment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phase 1 (Quick Assessment) is required"
            )

        if not smart_review.phase2_rubric:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phase 2 (Rubric Ratings) is required"
            )

        # Sanitize and convert to dict
        review_dict = smart_review.model_dump(exclude_none=True)

        # Sanitize Phase 1
        if review_dict.get('phase1_quick_assessment'):
            phase1 = review_dict['phase1_quick_assessment']
            if 'quick_summary' in phase1:
                phase1['quick_summary'] = clean(
                    phase1['quick_summary'],
                    tags=ALLOWED_TAGS,
                    strip=True
                )

        # Sanitize Phase 3 if present
        if review_dict.get('phase3_detailed_feedback'):
            phase3 = review_dict['phase3_detailed_feedback']

            if 'strengths' in phase3:
                phase3['strengths'] = [
                    clean(item, tags=ALLOWED_TAGS, strip=True)
                    for item in phase3['strengths']
                ]

            if 'improvements' in phase3:
                phase3['improvements'] = [
                    clean(item, tags=ALLOWED_TAGS, strip=True)
                    for item in phase3['improvements']
                ]

            if 'additional_notes' in phase3:
                phase3['additional_notes'] = clean(
                    phase3['additional_notes'],
                    tags=ALLOWED_TAGS,
                    strip=True
                )

        # Save Smart Review data to draft_sections (keep feedback_sections for legacy format only)
        slot.draft_sections = json.dumps(review_dict)
        slot.feedback_sections = None  # Smart Reviews don't use the legacy feedback_sections format

        # Extract overall rating for backward compatibility
        slot.rating = smart_review.phase1_quick_assessment.overall_rating

        # Generate review_text summary for backward compatibility
        summary_parts = []

        # Add quick summary
        summary_parts.append(f"**Summary:** {smart_review.phase1_quick_assessment.quick_summary}")

        # Add strengths if present
        if smart_review.phase3_detailed_feedback and smart_review.phase3_detailed_feedback.strengths:
            summary_parts.append("\n**Strengths:**")
            for strength in smart_review.phase3_detailed_feedback.strengths:
                summary_parts.append(f"- {strength}")

        # Add improvements if present
        if smart_review.phase3_detailed_feedback and smart_review.phase3_detailed_feedback.improvements:
            summary_parts.append("\n**Areas for Improvement:**")
            for improvement in smart_review.phase3_detailed_feedback.improvements:
                summary_parts.append(f"- {improvement}")

        # Add additional notes if present
        if smart_review.phase3_detailed_feedback and smart_review.phase3_detailed_feedback.additional_notes:
            summary_parts.append(f"\n**Additional Notes:**\n{smart_review.phase3_detailed_feedback.additional_notes}")

        slot.review_text = "\n".join(summary_parts)

        # Update status
        slot.status = "submitted"
        slot.submitted_at = datetime.utcnow()

        # Set auto-accept deadline (7 days from now)
        from datetime import timedelta
        slot.auto_accept_at = datetime.utcnow() + timedelta(days=7)

        await db.commit()
        await db.refresh(slot)

        # Award karma for submitting review
        await on_review_submitted(db, slot.id, current_user.id)

        # Send notification to requester
        await notify_review_submitted(db, slot_id, current_user.id)

        logger.info(f"User {current_user.id} submitted Smart Review for slot {slot_id}")

        return slot

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting Smart Review for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while submitting the review"
        )


# ===== Section Templates =====

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
    try:
        # Get the slot and verify access
        slot = await crud_review_slot.get_review_slot(db, slot_id, user_id=current_user.id)

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review slot not found or you don't have access"
            )

        # Verify user is the reviewer
        if slot.reviewer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned reviewer can access section templates"
            )

        # Get the review request to extract context
        from app.models.review_request import ReviewRequest
        review_request = await db.get(ReviewRequest, slot.review_request_id)

        if not review_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review request not found"
            )

        # Get appropriate sections from template system
        from app.config.review_sections import get_sections, calculate_min_total_words

        sections = get_sections(
            content_type=review_request.content_type.value,
            feedback_priority=review_request.feedback_priority.value if review_request.feedback_priority else "specific_fixes",
            review_tier=review_request.review_tier.value if review_request.review_tier else "standard"
        )

        # Merge with draft data if available
        if slot.draft_sections:
            import json
            try:
                draft_sections = json.loads(slot.draft_sections) if isinstance(slot.draft_sections, str) else slot.draft_sections
                # Merge draft content into section templates
                section_dict = {s["id"]: s for s in sections}
                for draft in draft_sections:
                    if draft["id"] in section_dict:
                        section_dict[draft["id"]]["content"] = draft.get("content", "")
            except (json.JSONDecodeError, KeyError, TypeError) as e:
                logger.error(f"Failed to parse draft sections for slot {slot_id}: {e}")
                # Continue without draft data rather than failing the request

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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sections for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching section templates"
        )


# ===== Accept/Reject Review =====

@router.post(
    "/{slot_id}/accept",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def accept_review(
    request: Request,
    slot_id: int,
    accept_data: ReviewAccept,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept a submitted review

    **Requirements:**
    - Slot must be in 'submitted' status
    - User must be the requester who created the review request

    **Rate Limit:** 20 requests per minute
    """
    try:
        accepted_slot = await crud_review_slot.accept_review(
            db,
            slot_id,
            current_user.id,
            accept_data.helpful_rating
        )

        # Award karma for accepted review (includes helpful rating bonus)
        await on_review_accepted(
            db,
            accepted_slot.id,
            accepted_slot.reviewer_id,
            helpful_rating=accept_data.helpful_rating
        )

        # Get karma info for notification
        from app.models.user import UserTier
        from sqlalchemy import select
        result = await db.execute(
            select(UserTier).where(UserTier.user_id == accepted_slot.reviewer_id)
        )
        user_tier = result.scalar_one_or_none()
        karma_earned = 50  # Base karma for accepted review
        if accept_data.helpful_rating >= 4:
            karma_earned += 10
        new_karma = user_tier.karma_points if user_tier else karma_earned

        # Send notification to reviewer
        await notify_review_accepted(
            db,
            slot_id,
            accepted_slot.reviewer_id,
            accept_data.helpful_rating,
            karma_earned,
            new_karma
        )

        logger.info(f"User {current_user.id} accepted review for slot {slot_id}")

        return accepted_slot

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error accepting review for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while accepting the review"
        )


@router.post(
    "/{slot_id}/reject",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def reject_review(
    request: Request,
    slot_id: int,
    reject_data: ReviewReject,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a submitted review

    **Requirements:**
    - Slot must be in 'submitted' status
    - User must be the requester who created the review request
    - Must provide rejection reason
    - If reason is 'other', must provide detailed notes

    **Rate Limit:** 20 requests per minute
    """
    try:
        rejected_slot = await crud_review_slot.reject_review(
            db,
            slot_id,
            current_user.id,
            reject_data.rejection_reason,
            reject_data.rejection_notes
        )

        # Deduct karma for rejected review
        await on_review_rejected(db, rejected_slot.id, rejected_slot.reviewer_id)

        # Get karma info for notification
        from app.models.user import UserTier
        from sqlalchemy import select
        result = await db.execute(
            select(UserTier).where(UserTier.user_id == rejected_slot.reviewer_id)
        )
        user_tier = result.scalar_one_or_none()
        karma_penalty = 25  # Karma penalty for rejected review
        new_karma = user_tier.karma_points if user_tier else 0

        # Send notification to reviewer
        await notify_review_rejected(
            db,
            slot_id,
            rejected_slot.reviewer_id,
            reject_data.rejection_reason.value,
            reject_data.rejection_notes,
            karma_penalty,
            new_karma
        )

        logger.info(
            f"User {current_user.id} rejected review for slot {slot_id} "
            f"(reason: {reject_data.rejection_reason.value})"
        )

        return rejected_slot

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error rejecting review for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while rejecting the review"
        )


# ===== Dispute Operations =====

@router.post(
    "/{slot_id}/dispute",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def create_dispute(
    request: Request,
    slot_id: int,
    dispute_data: ReviewDispute,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a dispute for a rejected review

    **Requirements:**
    - Slot must be in 'rejected' status
    - User must be the reviewer who submitted the review
    - Dispute must be created within 7 days of rejection
    - Dispute reason must be at least 20 characters

    **Rate Limit:** 20 requests per minute
    """
    try:
        disputed_slot = await crud_review_slot.create_dispute(
            db,
            slot_id,
            current_user.id,
            dispute_data.dispute_reason
        )

        # Track dispute creation (no karma change yet)
        await on_dispute_created(db, disputed_slot.id, current_user.id)

        # Send notifications to requester and admins
        await notify_dispute_created(db, slot_id, current_user.id)

        logger.info(f"User {current_user.id} created dispute for slot {slot_id}")

        return disputed_slot

    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating dispute for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the dispute"
        )


# ===== Query Operations =====

@router.get(
    "/my-slots",
    response_model=ReviewerSlotListResponse
)
@limiter.limit("100/minute")
async def get_my_review_slots(
    request: Request,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all review slots for the current user (as reviewer)

    **Query Parameters:**
    - status: Filter by slot status - single status OR comma-separated list (e.g., "claimed,submitted")
    - skip: Pagination offset (default: 0)
    - limit: Page size (default: 20, max: 100)

    **Rate Limit:** 100 requests per minute (higher limit to support dashboard components)
    """
    try:
        # Validate status if provided (supports multiple statuses)
        from app.models.review_slot import ReviewSlotStatus
        status_filters = None
        if status:
            # Split by comma to support multiple statuses
            status_list = [s.strip() for s in status.split(',')]
            status_filters = []
            for s in status_list:
                try:
                    status_filters.append(ReviewSlotStatus(s))
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid status: {s}"
                    )

        # Limit max page size
        limit = min(limit, 100)

        slots, total = await crud_review_slot.get_user_review_slots(
            db,
            current_user.id,
            status_filters,
            skip,
            limit
        )

        # Use Pydantic serialization (more efficient, avoids N+1 queries)
        # Since review_request is already eagerly loaded via selectinload in CRUD,
        # we can efficiently serialize it without additional queries
        items_with_request = []
        for slot in slots:
            # Convert slot to dict using Pydantic, then add review_request
            slot_dict = ReviewSlotResponse.model_validate(slot).model_dump()

            # Add review_request data (already loaded, no additional query)
            slot_dict["review_request"] = {
                "id": slot.review_request.id,
                "title": slot.review_request.title,
                "description": slot.review_request.description,
                "content_type": slot.review_request.content_type.value,
                "status": slot.review_request.status.value,
            } if slot.review_request else None

            items_with_request.append(slot_dict)

        return ReviewerSlotListResponse(
            items=items_with_request,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(slots)) < total
        )

    except Exception as e:
        logger.error(f"Error getting review slots for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching review slots"
        )


@router.get(
    "/pending-for-me",
    status_code=status.HTTP_200_OK
)
@limiter.limit("100/minute")
async def get_pending_reviews_for_requester(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all submitted review slots waiting for acceptance by the current user (as requester)

    Returns all slots with status='submitted' for review requests owned by the current user,
    ordered by urgency (auto_accept_at ascending) so most urgent appear first.

    **Rate Limit:** 100 requests per minute
    """
    try:
        # Query for submitted slots on user's review requests
        query = (
            select(ReviewSlot)
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewRequest.user_id == current_user.id,
                    ReviewSlot.status == "submitted"
                )
            )
            .options(
                selectinload(ReviewSlot.review_request),
                selectinload(ReviewSlot.reviewer)
            )
            .order_by(ReviewSlot.auto_accept_at.asc())  # Most urgent first
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Convert to response with review_request data
        items_with_request = []
        for slot in slots:
            # Use mode='json' to properly serialize datetime objects
            slot_dict = ReviewSlotResponse.model_validate(slot).model_dump(mode='json')

            # Add review_request summary
            slot_dict["review_request"] = {
                "id": slot.review_request.id,
                "title": slot.review_request.title,
                "description": slot.review_request.description,
                "content_type": slot.review_request.content_type.value,
            } if slot.review_request else None

            items_with_request.append(slot_dict)

        logger.info(f"Found {len(slots)} pending reviews for user {current_user.id}")
        return JSONResponse(content=items_with_request)

    except Exception as e:
        logger.error(f"Error getting pending reviews for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching pending reviews"
        )


@router.get(
    "/urgent-pending",
    status_code=status.HTTP_200_OK
)
@limiter.limit("100/minute")
async def get_urgent_pending_count(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get count and list of urgent pending reviews (< 24 hours to auto-accept)

    Returns slots that need immediate attention from the requester.

    **Rate Limit:** 100 requests per minute
    """
    try:
        # Calculate 24 hours from now
        urgent_deadline = datetime.utcnow() + timedelta(hours=24)

        # Query for submitted slots that auto-accept within 24 hours
        query = (
            select(ReviewSlot)
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewRequest.user_id == current_user.id,
                    ReviewSlot.status == "submitted",
                    ReviewSlot.auto_accept_at < urgent_deadline
                )
            )
            .options(
                selectinload(ReviewSlot.review_request),
                selectinload(ReviewSlot.reviewer)
            )
            .order_by(ReviewSlot.auto_accept_at.asc())
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Convert to response with review_request data
        items_with_request = []
        for slot in slots:
            # Use mode='json' to properly serialize datetime objects
            slot_dict = ReviewSlotResponse.model_validate(slot).model_dump(mode='json')

            slot_dict["review_request"] = {
                "id": slot.review_request.id,
                "title": slot.review_request.title,
                "content_type": slot.review_request.content_type.value,
            } if slot.review_request else None

            items_with_request.append(slot_dict)

        return JSONResponse(content={
            "count": len(slots),
            "slots": items_with_request
        })

    except Exception as e:
        logger.error(f"Error getting urgent pending reviews for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching urgent pending reviews"
        )


@router.get(
    "/request/{request_id}/slots",
    response_model=List[ReviewSlotResponse]
)
@limiter.limit("20/minute")
async def get_request_slots(
    request: Request,
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all review slots for a specific review request

    **Requirements:**
    - User must be the requester or a reviewer of one of the slots

    **Rate Limit:** 20 requests per minute
    """
    try:
        # Verify user has access to this request
        from app.models.review_request import ReviewRequest
        request = await db.get(ReviewRequest, request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review request not found"
            )

        # Get all slots for this request
        slots = await crud_review_slot.get_slots_for_request(db, request_id)

        # Filter visibility based on user role
        if request.user_id == current_user.id:
            # Requester can see all slots
            return slots
        else:
            # Reviewers can only see their own slots or accepted reviews
            filtered_slots = [
                slot for slot in slots
                if slot.reviewer_id == current_user.id or
                slot.status == "accepted"
            ]
            return filtered_slots

    except Exception as e:
        logger.error(f"Error getting slots for request {request_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching review slots"
        )


@router.get(
    "/{slot_id}",
    response_model=ReviewSlotResponse
)
@limiter.limit("20/minute")
async def get_review_slot(
    request: Request,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific review slot by ID

    **Requirements:**
    - User must be the requester or the reviewer

    **Rate Limit:** 20 requests per minute
    """
    try:
        slot = await crud_review_slot.get_review_slot(
            db, slot_id, user_id=current_user.id
        )

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review slot not found or you don't have access"
            )

        return slot

    except Exception as e:
        logger.error(f"Error getting slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching the review slot"
        )


# ===== Admin Endpoints =====

@router.post(
    "/{slot_id}/resolve-dispute",
    response_model=ReviewSlotResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("20/minute")
async def resolve_dispute(
    request: Request,
    slot_id: int,
    resolution_data: DisputeResolve,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to resolve a disputed review

    **Requirements:**
    - User must be an admin
    - Slot must be in 'disputed' status

    **Rate Limit:** 20 requests per minute
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can resolve disputes"
        )

    try:
        resolved_slot = await crud_review_slot.resolve_dispute(
            db,
            slot_id,
            current_user.id,
            resolution_data.resolution,
            resolution_data.admin_notes
        )

        # Award/deduct karma based on dispute resolution
        await on_dispute_resolved(
            db,
            resolved_slot.id,
            resolved_slot.reviewer_id,
            resolution=resolution_data.resolution.value
        )

        # Send notifications to reviewer and requester
        await notify_dispute_resolved(
            db,
            slot_id,
            resolved_slot.reviewer_id,
            resolution_data.resolution.value,
            resolution_data.admin_notes
        )

        logger.info(
            f"Admin {current_user.id} resolved dispute for slot {slot_id} "
            f"(resolution: {resolution_data.resolution.value})"
        )

        return resolved_slot

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error resolving dispute for slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resolving the dispute"
        )


@router.get(
    "/admin/disputed",
    response_model=ReviewSlotListResponse
)
@limiter.limit("20/minute")
async def get_disputed_slots(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin endpoint to get all disputed review slots

    **Requirements:**
    - User must be an admin

    **Rate Limit:** 20 requests per minute
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view disputed reviews"
        )

    try:
        # Limit max page size
        limit = min(limit, 100)

        slots, total = await crud_review_slot.get_disputed_slots(db, skip, limit)

        return ReviewSlotListResponse(
            items=slots,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(slots)) < total
        )

    except Exception as e:
        logger.error(f"Error getting disputed slots: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching disputed slots"
        )
