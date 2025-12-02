"""Challenge API endpoints for platform-curated creative competitions"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Path as PathParam, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_user_optional
from app.models.user import User, UserRole
from app.models.review_request import ContentType
from app.models.challenge import ChallengeStatus, ChallengeType
from app.schemas.challenge import (
    ChallengeCreateAdmin,
    ChallengeUpdateAdmin,
    ChallengeResponse,
    ChallengeListResponse,
    ChallengeEntryCreate,
    ChallengeEntryUpdate,
    ChallengeEntryResponse,
    ChallengeVoteCreate,
    ChallengeVoteResponse,
    ChallengeVoteStats,
    ChallengePromptCreate,
    ChallengePromptUpdate,
    ChallengePromptResponse,
    ChallengePromptListResponse,
    ChallengeStats,
    ChallengeLeaderboardResponse,
    ChallengeLeaderboardEntry,
    ChallengeInvitationCreate,
    ChallengeInvitationResponse,
    InvitationRespondRequest,
    ChallengeParticipantResponse,
    ReplaceInvitationRequest,
)
from app.services.challenge_service import ChallengeService
from app.core.logging_config import security_logger

router = APIRouter(prefix="/challenges", tags=["Challenges"])


# ==================== DEPENDENCIES ====================


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to verify current user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def _build_challenge_response(
    challenge,
    current_user_id: Optional[int] = None,
    entries: Optional[list] = None
) -> ChallengeResponse:
    """Build a ChallengeResponse with user context."""
    # Get user info
    participant1_name = None
    participant1_avatar = None
    participant2_name = None
    participant2_avatar = None
    winner_name = None

    if challenge.participant1:
        participant1_name = challenge.participant1.full_name or challenge.participant1.email.split('@')[0]
        participant1_avatar = challenge.participant1.avatar_url
    if challenge.participant2:
        participant2_name = challenge.participant2.full_name or challenge.participant2.email.split('@')[0]
        participant2_avatar = challenge.participant2.avatar_url
    if challenge.winner:
        winner_name = challenge.winner.full_name or challenge.winner.email.split('@')[0]

    creator_name = None
    if challenge.creator:
        creator_name = challenge.creator.full_name or challenge.creator.email.split('@')[0]

    # Build entry responses with user info
    entry_responses = []
    current_user_entry = None
    current_user_voted = False
    current_user_vote_entry_id = None
    current_user_invitation = None
    current_user_is_participant = False

    if entries is None:
        entries = challenge.entries

    for entry in entries:
        user_name = None
        user_avatar = None
        user_tier = None
        if entry.user:
            user_name = entry.user.full_name or entry.user.email.split('@')[0]
            user_avatar = entry.user.avatar_url
            user_tier = entry.user.user_tier.value if entry.user.user_tier else None

        entry_resp = ChallengeEntryResponse(
            id=entry.id,
            challenge_id=entry.challenge_id,
            user_id=entry.user_id,
            title=entry.title,
            description=entry.description,
            file_urls=entry.file_urls,
            external_links=entry.external_links,
            thumbnail_url=entry.thumbnail_url,
            vote_count=entry.vote_count if challenge.status in [ChallengeStatus.COMPLETED, ChallengeStatus.DRAW] else 0,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            submitted_at=entry.submitted_at,
            user_name=user_name,
            user_avatar=user_avatar,
            user_tier=user_tier
        )
        entry_responses.append(entry_resp)

        if current_user_id and entry.user_id == current_user_id:
            current_user_entry = entry_resp

    # Check if current user voted
    if current_user_id and challenge.votes:
        for vote in challenge.votes:
            if vote.voter_id == current_user_id:
                current_user_voted = True
                current_user_vote_entry_id = vote.entry_id
                break

    # Check for current user invitation
    if current_user_id and challenge.invitations:
        for inv in challenge.invitations:
            if inv.user_id == current_user_id:
                current_user_invitation = ChallengeInvitationResponse(
                    id=inv.id,
                    challenge_id=inv.challenge_id,
                    user_id=inv.user_id,
                    slot=inv.slot,
                    status=inv.status,
                    message=inv.message,
                    expires_at=inv.expires_at,
                    created_at=inv.created_at,
                    responded_at=inv.responded_at
                )
                break

    # Check if participant
    if current_user_id:
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            current_user_is_participant = current_user_id in [
                challenge.participant1_id,
                challenge.participant2_id
            ]
        else:
            current_user_is_participant = any(
                p.user_id == current_user_id for p in challenge.participants
            )

    # Build invitation responses
    invitation_responses = []
    for inv in challenge.invitations:
        user_name = None
        user_avatar = None
        user_tier = None
        if inv.user:
            user_name = inv.user.full_name or inv.user.email.split('@')[0]
            user_avatar = inv.user.avatar_url
            user_tier = inv.user.user_tier.value if inv.user.user_tier else None

        invitation_responses.append(ChallengeInvitationResponse(
            id=inv.id,
            challenge_id=inv.challenge_id,
            user_id=inv.user_id,
            slot=inv.slot,
            status=inv.status,
            message=inv.message,
            expires_at=inv.expires_at,
            created_at=inv.created_at,
            responded_at=inv.responded_at,
            user_name=user_name,
            user_avatar=user_avatar,
            user_tier=user_tier
        ))

    # Build prompt response
    prompt_response = None
    if challenge.prompt:
        prompt_response = ChallengePromptResponse(
            id=challenge.prompt.id,
            title=challenge.prompt.title,
            description=challenge.prompt.description,
            content_type=challenge.prompt.content_type,
            difficulty=challenge.prompt.difficulty,
            is_active=challenge.prompt.is_active,
            times_used=challenge.prompt.times_used,
            created_at=challenge.prompt.created_at
        )

    return ChallengeResponse(
        id=challenge.id,
        title=challenge.title,
        description=challenge.description,
        challenge_type=challenge.challenge_type,
        content_type=challenge.content_type,
        prompt_id=challenge.prompt_id,
        status=challenge.status,
        submission_hours=challenge.submission_hours,
        voting_hours=challenge.voting_hours,
        submission_deadline=challenge.submission_deadline,
        voting_deadline=challenge.voting_deadline,
        max_winners=challenge.max_winners,
        total_entries=challenge.total_entries,
        participant1_id=challenge.participant1_id,
        participant2_id=challenge.participant2_id,
        winner_id=challenge.winner_id,
        participant1_votes=challenge.participant1_votes if challenge.status in [ChallengeStatus.COMPLETED, ChallengeStatus.DRAW] else 0,
        participant2_votes=challenge.participant2_votes if challenge.status in [ChallengeStatus.COMPLETED, ChallengeStatus.DRAW] else 0,
        is_featured=challenge.is_featured,
        banner_image_url=challenge.banner_image_url,
        prize_description=challenge.prize_description,
        total_votes=challenge.total_votes if challenge.status in [ChallengeStatus.COMPLETED, ChallengeStatus.DRAW] else 0,
        winner_karma_reward=challenge.winner_karma_reward,
        created_at=challenge.created_at,
        started_at=challenge.started_at,
        voting_started_at=challenge.voting_started_at,
        completed_at=challenge.completed_at,
        created_by=challenge.created_by,
        prompt=prompt_response,
        entries=entry_responses,
        invitations=invitation_responses,
        participant1_name=participant1_name,
        participant1_avatar=participant1_avatar,
        participant2_name=participant2_name,
        participant2_avatar=participant2_avatar,
        winner_name=winner_name,
        creator_name=creator_name,
        current_user_entry=current_user_entry,
        current_user_voted=current_user_voted,
        current_user_vote_entry_id=current_user_vote_entry_id,
        current_user_invitation=current_user_invitation,
        current_user_is_participant=current_user_is_participant
    )


# ==================== PROMPTS ====================


@router.get(
    "/prompts",
    response_model=ChallengePromptListResponse,
    summary="Get available challenge prompts"
)
async def get_prompts(
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
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
        security_logger.logger.error(f"Failed to get challenge prompts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prompts"
        )


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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prompt not found"
            )

        return ChallengePromptResponse.model_validate(prompt)
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to get prompt {prompt_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prompt"
        )


# ==================== ADMIN: PROMPT MANAGEMENT ====================


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

        security_logger.logger.info(
            f"Challenge prompt created: id={prompt.id}, title={prompt.title}, by admin={admin_user.email}"
        )

        return ChallengePromptResponse.model_validate(prompt)
    except Exception as e:
        security_logger.logger.error(f"Failed to create prompt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create prompt"
        )


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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prompt not found"
            )

        security_logger.logger.info(
            f"Challenge prompt updated: id={prompt_id}, by admin={admin_user.email}"
        )

        return ChallengePromptResponse.model_validate(prompt)
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to update prompt {prompt_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update prompt"
        )


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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prompt not found"
            )

        security_logger.logger.info(
            f"Challenge prompt deleted: id={prompt_id}, by admin={admin_user.email}"
        )
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to delete prompt {prompt_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete prompt"
        )


# ==================== ADMIN: CHALLENGE MANAGEMENT ====================


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
            prize_description=challenge_data.prize_description
        )

        security_logger.logger.info(
            f"Challenge created: id={challenge.id}, type={challenge.challenge_type}, by admin={admin_user.email}"
        )

        return _build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to create challenge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create challenge"
        )


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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challenge not found"
            )

        security_logger.logger.info(
            f"Challenge updated: id={challenge_id}, by admin={admin_user.email}"
        )

        return _build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to update challenge {challenge_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update challenge"
        )


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

        security_logger.logger.info(
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to invite creator: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to invite creator"
        )


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

        security_logger.logger.info(
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to replace invitation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to replace invitation"
        )


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

        security_logger.logger.info(
            f"Challenge activated: id={challenge_id}, by admin={admin_user.email}"
        )

        return _build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to activate challenge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate challenge"
        )


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

        security_logger.logger.info(
            f"Category challenge opened: id={challenge_id}, by admin={admin_user.email}"
        )

        return _build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to open challenge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to open challenge"
        )


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

        security_logger.logger.info(
            f"Submissions closed: challenge={challenge_id}, by admin={admin_user.email}"
        )

        return _build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to close submissions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to close submissions"
        )


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

        security_logger.logger.info(
            f"Challenge completed: id={challenge_id}, by admin={admin_user.email}"
        )

        return _build_challenge_response(challenge, admin_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to complete challenge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete challenge"
        )


# ==================== PUBLIC: CHALLENGES ====================


@router.get(
    "",
    response_model=ChallengeListResponse,
    summary="Get challenges"
)
async def get_challenges(
    status_filter: Optional[ChallengeStatus] = Query(None, alias="status", description="Filter by status"),
    challenge_type: Optional[ChallengeType] = Query(None, description="Filter by challenge type"),
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    skip: int = Query(0, ge=0, description="Number to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
) -> ChallengeListResponse:
    """Get challenges with filters."""
    try:
        service = ChallengeService(db)
        challenges, total = await service.get_challenges(
            status=status_filter,
            challenge_type=challenge_type,
            content_type=content_type,
            is_featured=is_featured,
            skip=skip,
            limit=limit
        )

        user_id = current_user.id if current_user else None

        return ChallengeListResponse(
            items=[_build_challenge_response(c, user_id) for c in challenges],
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(challenges)) < total
        )
    except Exception as e:
        security_logger.logger.error(f"Failed to get challenges: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve challenges"
        )


@router.get(
    "/active",
    response_model=List[ChallengeResponse],
    summary="Get challenges in voting phase"
)
async def get_active_challenges(
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
) -> List[ChallengeResponse]:
    """Get challenges currently in voting phase."""
    try:
        service = ChallengeService(db)
        challenges = await service.get_active_challenges(
            content_type=content_type,
            limit=limit
        )

        user_id = current_user.id if current_user else None

        return [_build_challenge_response(c, user_id) for c in challenges]
    except Exception as e:
        security_logger.logger.error(f"Failed to get active challenges: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve active challenges"
        )


@router.get(
    "/leaderboard",
    response_model=ChallengeLeaderboardResponse,
    summary="Get challenge leaderboard"
)
async def get_leaderboard(
    limit: int = Query(50, ge=1, le=100, description="Maximum entries"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
) -> ChallengeLeaderboardResponse:
    """Get challenge leaderboard ranked by wins."""
    try:
        service = ChallengeService(db)
        leaderboard = await service.get_leaderboard(limit=limit)

        # Find current user's rank
        current_user_rank = None
        if current_user:
            for entry in leaderboard:
                if entry["user_id"] == current_user.id:
                    current_user_rank = entry["rank"]
                    break

        return ChallengeLeaderboardResponse(
            entries=[ChallengeLeaderboardEntry(**e) for e in leaderboard],
            total_participants=len(leaderboard),
            current_user_rank=current_user_rank
        )
    except Exception as e:
        security_logger.logger.error(f"Failed to get leaderboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leaderboard"
        )


@router.get(
    "/{challenge_id}",
    response_model=ChallengeResponse,
    summary="Get a specific challenge"
)
async def get_challenge(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
) -> ChallengeResponse:
    """Get a specific challenge by ID."""
    try:
        service = ChallengeService(db)
        challenge = await service.get_challenge(challenge_id)

        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Challenge not found"
            )

        user_id = current_user.id if current_user else None

        # Get entries with blind mode handling
        entries = await service.get_entries(challenge_id, user_id)

        return _build_challenge_response(challenge, user_id, entries)
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to get challenge {challenge_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve challenge"
        )


# ==================== USER: INVITATIONS ====================


@router.get(
    "/invitations/pending",
    response_model=List[ChallengeInvitationResponse],
    summary="Get my pending invitations"
)
async def get_my_invitations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[ChallengeInvitationResponse]:
    """Get pending challenge invitations for the current user."""
    try:
        service = ChallengeService(db)
        invitations = await service.get_user_invitations(current_user.id)

        return [
            ChallengeInvitationResponse(
                id=inv.id,
                challenge_id=inv.challenge_id,
                user_id=inv.user_id,
                slot=inv.slot,
                status=inv.status,
                message=inv.message,
                expires_at=inv.expires_at,
                created_at=inv.created_at,
                responded_at=inv.responded_at
            )
            for inv in invitations
        ]
    except Exception as e:
        security_logger.logger.error(f"Failed to get invitations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve invitations"
        )


@router.post(
    "/invitations/{invitation_id}/respond",
    response_model=ChallengeInvitationResponse,
    summary="Respond to an invitation"
)
async def respond_to_invitation(
    response_data: InvitationRespondRequest,
    invitation_id: int = PathParam(..., ge=1, description="Invitation ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ChallengeInvitationResponse:
    """Accept or decline a challenge invitation."""
    try:
        service = ChallengeService(db)
        invitation = await service.respond_to_invitation(
            invitation_id=invitation_id,
            user_id=current_user.id,
            accept=response_data.accept
        )

        action = "accepted" if response_data.accept else "declined"
        security_logger.logger.info(
            f"Invitation {action}: id={invitation_id}, user={current_user.email}"
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to respond to invitation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to respond to invitation"
        )


# ==================== USER: CATEGORY CHALLENGES ====================


@router.post(
    "/{challenge_id}/join",
    response_model=ChallengeParticipantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Join a category challenge"
)
async def join_category_challenge(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ChallengeParticipantResponse:
    """Join a category challenge."""
    try:
        service = ChallengeService(db)
        participant = await service.join_category_challenge(
            challenge_id=challenge_id,
            user_id=current_user.id
        )

        security_logger.logger.info(
            f"User joined challenge: challenge={challenge_id}, user={current_user.email}"
        )

        return ChallengeParticipantResponse(
            id=participant.id,
            challenge_id=participant.challenge_id,
            user_id=participant.user_id,
            joined_at=participant.joined_at,
            placement=participant.placement,
            karma_earned=participant.karma_earned,
            user_name=current_user.full_name or current_user.email.split('@')[0],
            user_avatar=current_user.avatar_url,
            user_tier=current_user.user_tier.value if current_user.user_tier else None
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to join challenge: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join challenge"
        )


# ==================== ENTRIES ====================


@router.post(
    "/{challenge_id}/entries",
    response_model=ChallengeEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update an entry"
)
async def create_entry(
    entry_data: ChallengeEntryCreate,
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ChallengeEntryResponse:
    """Create or update a challenge entry (before submission deadline)."""
    try:
        service = ChallengeService(db)
        entry = await service.create_entry(
            challenge_id=challenge_id,
            user_id=current_user.id,
            title=entry_data.title,
            description=entry_data.description,
            file_urls=entry_data.file_urls,
            external_links=entry_data.external_links,
            thumbnail_url=entry_data.thumbnail_url
        )

        return ChallengeEntryResponse(
            id=entry.id,
            challenge_id=entry.challenge_id,
            user_id=entry.user_id,
            title=entry.title,
            description=entry.description,
            file_urls=entry.file_urls,
            external_links=entry.external_links,
            thumbnail_url=entry.thumbnail_url,
            vote_count=entry.vote_count,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            submitted_at=entry.submitted_at,
            user_name=current_user.full_name or current_user.email.split('@')[0],
            user_avatar=current_user.avatar_url,
            user_tier=current_user.user_tier.value if current_user.user_tier else None
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to create entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create entry"
        )


@router.post(
    "/{challenge_id}/entries/submit",
    response_model=ChallengeEntryResponse,
    summary="Submit an entry (finalize)"
)
async def submit_entry(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ChallengeEntryResponse:
    """Submit an entry (mark as final). Cannot be edited after submission."""
    try:
        service = ChallengeService(db)
        entry = await service.submit_entry(
            challenge_id=challenge_id,
            user_id=current_user.id
        )

        security_logger.logger.info(
            f"Entry submitted: challenge={challenge_id}, user={current_user.email}"
        )

        return ChallengeEntryResponse(
            id=entry.id,
            challenge_id=entry.challenge_id,
            user_id=entry.user_id,
            title=entry.title,
            description=entry.description,
            file_urls=entry.file_urls,
            external_links=entry.external_links,
            thumbnail_url=entry.thumbnail_url,
            vote_count=entry.vote_count,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            submitted_at=entry.submitted_at,
            user_name=current_user.full_name or current_user.email.split('@')[0],
            user_avatar=current_user.avatar_url,
            user_tier=current_user.user_tier.value if current_user.user_tier else None
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to submit entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit entry"
        )


@router.get(
    "/{challenge_id}/entries",
    response_model=List[ChallengeEntryResponse],
    summary="Get challenge entries"
)
async def get_entries(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
) -> List[ChallengeEntryResponse]:
    """Get entries for a challenge (with blind mode handling for 1v1)."""
    try:
        service = ChallengeService(db)
        user_id = current_user.id if current_user else None
        entries = await service.get_entries(challenge_id, user_id)

        return [
            ChallengeEntryResponse(
                id=e.id,
                challenge_id=e.challenge_id,
                user_id=e.user_id,
                title=e.title,
                description=e.description,
                file_urls=e.file_urls,
                external_links=e.external_links,
                thumbnail_url=e.thumbnail_url,
                vote_count=e.vote_count,
                created_at=e.created_at,
                updated_at=e.updated_at,
                submitted_at=e.submitted_at
            )
            for e in entries
        ]
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to get entries: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve entries"
        )


# ==================== VOTING ====================


@router.post(
    "/{challenge_id}/vote",
    response_model=ChallengeVoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cast a vote"
)
async def cast_vote(
    vote_data: ChallengeVoteCreate,
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ChallengeVoteResponse:
    """Cast a vote for an entry. One vote per user per challenge."""
    try:
        service = ChallengeService(db)
        vote = await service.cast_vote(
            challenge_id=challenge_id,
            voter_id=current_user.id,
            entry_id=vote_data.entry_id
        )

        security_logger.logger.info(
            f"Vote cast: challenge={challenge_id}, entry={vote_data.entry_id}, user={current_user.email}"
        )

        return ChallengeVoteResponse(
            id=vote.id,
            challenge_id=vote.challenge_id,
            voter_id=vote.voter_id,
            entry_id=vote.entry_id,
            voted_at=vote.voted_at
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to cast vote: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cast vote"
        )


@router.get(
    "/{challenge_id}/votes",
    response_model=ChallengeVoteStats,
    summary="Get vote statistics"
)
async def get_vote_stats(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    db: AsyncSession = Depends(get_db)
) -> ChallengeVoteStats:
    """Get vote statistics for a challenge (hidden during voting phase)."""
    try:
        service = ChallengeService(db)
        stats = await service.get_vote_stats(challenge_id)

        return ChallengeVoteStats(
            total_votes=stats.get("total_votes", 0),
            participant1_votes=stats.get("participant1_votes"),
            participant2_votes=stats.get("participant2_votes"),
            participant1_percentage=stats.get("participant1_percentage"),
            participant2_percentage=stats.get("participant2_percentage"),
            top_entries=stats.get("top_entries")
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        security_logger.logger.error(f"Failed to get vote stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve vote statistics"
        )


# ==================== STATISTICS & LEADERBOARD ====================


@router.get(
    "/stats/me",
    response_model=ChallengeStats,
    summary="Get my challenge stats"
)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ChallengeStats:
    """Get challenge statistics for the current user."""
    try:
        service = ChallengeService(db)
        stats = await service.get_user_challenge_stats(current_user.id)

        return ChallengeStats(**stats)
    except Exception as e:
        security_logger.logger.error(f"Failed to get user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get(
    "/stats/{user_id}",
    response_model=ChallengeStats,
    summary="Get user challenge stats"
)
async def get_user_stats(
    user_id: int = PathParam(..., ge=1, description="User ID"),
    db: AsyncSession = Depends(get_db)
) -> ChallengeStats:
    """Get challenge statistics for a specific user."""
    try:
        service = ChallengeService(db)
        stats = await service.get_user_challenge_stats(user_id)

        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return ChallengeStats(**stats)
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to get user stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )
