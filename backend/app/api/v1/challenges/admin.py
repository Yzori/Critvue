"""Admin challenge API endpoints - prompts and challenge management."""

from fastapi import APIRouter, Depends, Path as PathParam, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.review_request import ContentType
from app.core.exceptions import NotFoundError, InvalidInputError, InternalError, AdminRequiredError
from app.schemas.challenge import (
    ChallengeCreateAdmin,
    ChallengeUpdateAdmin,
    ChallengeResponse,
    ChallengePromptCreate,
    ChallengePromptUpdate,
    ChallengePromptResponse,
    ChallengePromptListResponse,
    ChallengeInvitationCreate,
    ChallengeInvitationResponse,
    ReplaceInvitationRequest,
    OpenSlotsRequest,
)
from app.services.challenges import ChallengeService
from app.api.v1.challenges.common import (
    require_admin,
    build_challenge_response,
    logger,
)

router = APIRouter(tags=["Challenges - Admin"])


# ==================== PROMPTS: PUBLIC ====================


@router.get(
    "/prompts",
    response_model=ChallengePromptListResponse,
    summary="Get available challenge prompts"
)
async def get_prompts(
    content_type: ContentType | None = Query(None, description="Filter by content type"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of prompts"),
    db: AsyncSession = Depends(get_db)
) -> ChallengePromptListResponse:
    """Get available challenge prompts."""
    try:
        service = ChallengeService(db)
        prompts = await service.get_prompts(
            content_type=content_type,
            limit=limit
        )

        return ChallengePromptListResponse(
            items=[ChallengePromptResponse.model_validate(p) for p in prompts],
            total=len(prompts)
        )
    except Exception as e:
        logger.error(f"Failed to get challenge prompts: {str(e)}")
        raise InternalError(message="Failed to retrieve prompts")


@router.get(
    "/prompts/{prompt_id}",
    response_model=ChallengePromptResponse,
    summary="Get a specific prompt"
)
async def get_prompt(
    prompt_id: int = PathParam(..., ge=1, description="Prompt ID"),
    db: AsyncSession = Depends(get_db)
) -> ChallengePromptResponse:
    """Get a specific challenge prompt by ID."""
    try:
        service = ChallengeService(db)
        prompt = await service.get_prompt(prompt_id)

        if not prompt:
            raise NotFoundError(resource="Prompt")

        return ChallengePromptResponse.model_validate(prompt)
    except (NotFoundError, InvalidInputError, InternalError, AdminRequiredError):
        raise
    except Exception as e:
        logger.error(f"Failed to get prompt {prompt_id}: {str(e)}")
        raise InternalError(message="Failed to retrieve prompt")


# ==================== PROMPTS: ADMIN MANAGEMENT ====================


@router.post(
    "/prompts",
    response_model=ChallengePromptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a challenge prompt (Admin only)"
)
async def create_prompt(
    prompt_data: ChallengePromptCreate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengePromptResponse:
    """Create a new challenge prompt (Admin only)."""
    try:
        service = ChallengeService(db)
        prompt = await service.create_prompt(
            title=prompt_data.title,
            description=prompt_data.description,
            content_type=prompt_data.content_type,
            difficulty=prompt_data.difficulty,
            is_active=prompt_data.is_active
        )

        logger.info(
            f"Challenge prompt created: id={prompt.id}, title={prompt.title}, by admin={admin_user.email}"
        )

        return ChallengePromptResponse.model_validate(prompt)
    except Exception as e:
        logger.error(f"Failed to create prompt: {str(e)}")
        raise InternalError(message="Failed to create prompt")


@router.put(
    "/prompts/{prompt_id}",
    response_model=ChallengePromptResponse,
    summary="Update a challenge prompt (Admin only)"
)
async def update_prompt(
    prompt_data: ChallengePromptUpdate,
    prompt_id: int = PathParam(..., ge=1, description="Prompt ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengePromptResponse:
    """Update an existing challenge prompt (Admin only)."""
    try:
        service = ChallengeService(db)
        prompt = await service.update_prompt(
            prompt_id=prompt_id,
            **prompt_data.model_dump(exclude_unset=True)
        )

        if not prompt:
            raise NotFoundError(resource="Prompt")

        logger.info(
            f"Challenge prompt updated: id={prompt_id}, by admin={admin_user.email}"
        )

        return ChallengePromptResponse.model_validate(prompt)
    except (NotFoundError, InvalidInputError, InternalError, AdminRequiredError):
        raise
    except Exception as e:
        logger.error(f"Failed to update prompt {prompt_id}: {str(e)}")
        raise InternalError(message="Failed to update prompt")


@router.delete(
    "/prompts/{prompt_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a challenge prompt (Admin only)"
)
async def delete_prompt(
    prompt_id: int = PathParam(..., ge=1, description="Prompt ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Soft-delete a challenge prompt (Admin only)."""
    try:
        service = ChallengeService(db)
        success = await service.delete_prompt(prompt_id)

        if not success:
            raise NotFoundError(resource="Prompt")

        logger.info(
            f"Challenge prompt deleted: id={prompt_id}, by admin={admin_user.email}"
        )
    except (NotFoundError, InvalidInputError, InternalError, AdminRequiredError):
        raise
    except Exception as e:
        logger.error(f"Failed to delete prompt {prompt_id}: {str(e)}")
        raise InternalError(message="Failed to delete prompt")


# ==================== CHALLENGE MANAGEMENT ====================


@router.post(
    "/admin/create",
    response_model=ChallengeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a challenge (Admin only)"
)
async def create_challenge(
    challenge_data: ChallengeCreateAdmin,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeResponse:
    """
    Create a new challenge (Admin only).

    - ONE_ON_ONE: Creates in DRAFT status, then invite creators
    - CATEGORY: Creates in DRAFT status, then open when ready
    """
    try:
        service = ChallengeService(db)
        challenge = await service.create_challenge(
            admin_id=admin_user.id,
            title=challenge_data.title,
            description=challenge_data.description,
            content_type=challenge_data.content_type,
            challenge_type=challenge_data.challenge_type,
            prompt_id=challenge_data.prompt_id,
            submission_hours=challenge_data.submission_hours,
            voting_hours=challenge_data.voting_hours,
            max_winners=challenge_data.max_winners,
            is_featured=challenge_data.is_featured,
            banner_image_url=challenge_data.banner_image_url,
            prize_description=challenge_data.prize_description,
            invitation_mode=challenge_data.invitation_mode
        )

        logger.info(
            f"Challenge created: id={challenge.id}, type={challenge.challenge_type}, by admin={admin_user.email}"
        )

        return build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to create challenge: {str(e)}")
        raise InternalError(message="Failed to create challenge")


@router.put(
    "/admin/{challenge_id}",
    response_model=ChallengeResponse,
    summary="Update a challenge (Admin only)"
)
async def update_challenge(
    challenge_data: ChallengeUpdateAdmin,
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeResponse:
    """Update a challenge (Admin only). Only allowed in DRAFT status."""
    try:
        service = ChallengeService(db)
        challenge = await service.update_challenge(
            challenge_id=challenge_id,
            **challenge_data.model_dump(exclude_unset=True)
        )

        if not challenge:
            raise NotFoundError(resource="Challenge")

        logger.info(
            f"Challenge updated: id={challenge_id}, by admin={admin_user.email}"
        )

        return build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except (NotFoundError, InvalidInputError, InternalError, AdminRequiredError):
        raise
    except Exception as e:
        logger.error(f"Failed to update challenge {challenge_id}: {str(e)}")
        raise InternalError(message="Failed to update challenge")


@router.post(
    "/admin/{challenge_id}/invite",
    response_model=ChallengeInvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a creator to a 1v1 challenge (Admin only)"
)
async def invite_creator(
    invitation_data: ChallengeInvitationCreate,
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeInvitationResponse:
    """Invite a creator to a 1v1 challenge (Admin only)."""
    try:
        service = ChallengeService(db)
        invitation = await service.invite_creator(
            challenge_id=challenge_id,
            user_id=invitation_data.user_id,
            slot=invitation_data.slot,
            message=invitation_data.message
        )

        logger.info(
            f"Creator invited: challenge={challenge_id}, user={invitation_data.user_id}, by admin={admin_user.email}"
        )

        return ChallengeInvitationResponse(
            id=invitation.id,
            challenge_id=invitation.challenge_id,
            user_id=invitation.user_id,
            slot=invitation.slot,
            status=invitation.status,
            message=invitation.message,
            expires_at=invitation.expires_at,
            created_at=invitation.created_at,
            responded_at=invitation.responded_at
        )
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to invite creator: {str(e)}")
        raise InternalError(message="Failed to invite creator")


@router.post(
    "/admin/{challenge_id}/replace-invite",
    response_model=ChallengeInvitationResponse,
    summary="Replace a declined invitation (Admin only)"
)
async def replace_invitation(
    replacement_data: ReplaceInvitationRequest,
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    slot: int = Query(..., ge=1, le=2, description="Slot to replace (1 or 2)"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeInvitationResponse:
    """Replace a declined or expired invitation with a new one (Admin only)."""
    try:
        service = ChallengeService(db)
        invitation = await service.replace_invitation(
            challenge_id=challenge_id,
            slot=slot,
            new_user_id=replacement_data.new_user_id,
            message=replacement_data.message
        )

        logger.info(
            f"Invitation replaced: challenge={challenge_id}, slot={slot}, new_user={replacement_data.new_user_id}, by admin={admin_user.email}"
        )

        return ChallengeInvitationResponse(
            id=invitation.id,
            challenge_id=invitation.challenge_id,
            user_id=invitation.user_id,
            slot=invitation.slot,
            status=invitation.status,
            message=invitation.message,
            expires_at=invitation.expires_at,
            created_at=invitation.created_at,
            responded_at=invitation.responded_at
        )
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to replace invitation: {str(e)}")
        raise InternalError(message="Failed to replace invitation")


@router.post(
    "/admin/{challenge_id}/activate",
    response_model=ChallengeResponse,
    summary="Activate a 1v1 challenge (Admin only)"
)
async def activate_challenge(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeResponse:
    """Activate a 1v1 challenge after both creators accepted (Admin only)."""
    try:
        service = ChallengeService(db)
        challenge = await service.activate_challenge(challenge_id)

        logger.info(
            f"Challenge activated: id={challenge_id}, by admin={admin_user.email}"
        )

        return build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to activate challenge: {str(e)}")
        raise InternalError(message="Failed to activate challenge")


@router.post(
    "/admin/{challenge_id}/open",
    response_model=ChallengeResponse,
    summary="Open a category challenge for entries (Admin only)"
)
async def open_challenge(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeResponse:
    """Open a category challenge for entries (Admin only)."""
    try:
        service = ChallengeService(db)
        challenge = await service.open_challenge(challenge_id)

        logger.info(
            f"Category challenge opened: id={challenge_id}, by admin={admin_user.email}"
        )

        return build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to open challenge: {str(e)}")
        raise InternalError(message="Failed to open challenge")


@router.post(
    "/admin/{challenge_id}/open-slots",
    response_model=ChallengeResponse,
    summary="Open slots for a 1v1 challenge (Admin only)"
)
async def open_challenge_slots(
    slots_data: OpenSlotsRequest,
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeResponse:
    """Open slots for first-come-first-served claiming on a 1v1 challenge (Admin only)."""
    try:
        service = ChallengeService(db)
        challenge = await service.open_challenge_slots(
            challenge_id=challenge_id,
            duration_hours=slots_data.duration_hours
        )

        logger.info(
            f"Challenge slots opened: id={challenge_id}, duration={slots_data.duration_hours}h, by admin={admin_user.email}"
        )

        return build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to open challenge slots: {str(e)}")
        raise InternalError(message="Failed to open challenge slots")


@router.post(
    "/admin/{challenge_id}/close-submissions",
    response_model=ChallengeResponse,
    summary="Close submissions and start voting (Admin only)"
)
async def close_submissions(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeResponse:
    """Close submissions and start voting phase (Admin only)."""
    try:
        service = ChallengeService(db)
        challenge = await service.close_submissions(challenge_id)

        logger.info(
            f"Submissions closed: challenge={challenge_id}, by admin={admin_user.email}"
        )

        return build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to close submissions: {str(e)}")
        raise InternalError(message="Failed to close submissions")


@router.post(
    "/admin/{challenge_id}/complete",
    response_model=ChallengeResponse,
    summary="Complete a challenge and determine winners (Admin only)"
)
async def complete_challenge(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> ChallengeResponse:
    """Complete a challenge and determine winners (Admin only)."""
    try:
        service = ChallengeService(db)
        challenge = await service.complete_challenge(challenge_id)

        logger.info(
            f"Challenge completed: id={challenge_id}, by admin={admin_user.email}"
        )

        return build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to complete challenge: {str(e)}")
        raise InternalError(message="Failed to complete challenge")
