"""User participation endpoints - invitations, joining, entries, and slot claiming."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path as PathParam, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.core.exceptions import NotFoundError, InvalidInputError, InternalError, AdminRequiredError
from app.schemas.challenge import (
    ChallengeInvitationResponse,
    InvitationRespondRequest,
    ChallengeParticipantResponse,
    ChallengeEntryCreate,
    ChallengeEntryResponse,
    SlotClaimResponse,
)
from app.services.challenges import ChallengeService
from app.api.v1.challenges.common import logger, get_display_name

router = APIRouter(tags=["Challenges - Participation"])


# ==================== SLOT CLAIMING ====================


@router.post(
    "/{challenge_id}/claim-slot",
    response_model=SlotClaimResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Claim a slot in an open slots 1v1 challenge"
)
async def claim_challenge_slot(
    challenge_id: int = PathParam(..., ge=1, description="Challenge ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SlotClaimResponse:
    """Claim a slot in an open slots 1v1 challenge. Auto-activates when both slots are filled."""
    try:
        service = ChallengeService(db)
        result = await service.claim_challenge_slot(
            challenge_id=challenge_id,
            user_id=current_user.id
        )

        logger.info(
            f"Slot claimed: challenge={challenge_id}, slot={result['slot']}, user={current_user.email}, activated={result['challenge_activated']}"
        )

        return SlotClaimResponse(
            challenge_id=result["challenge_id"],
            user_id=result["user_id"],
            slot=result["slot"],
            claimed_at=result["claimed_at"],
            challenge_activated=result["challenge_activated"]
        )
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to claim slot: {str(e)}")
        raise InternalError(message="Failed to claim slot")


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
        logger.error(f"Failed to get invitations: {str(e)}")
        raise InternalError(message="Failed to retrieve invitations")


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
        logger.info(
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
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to respond to invitation: {str(e)}")
        raise InternalError(message="Failed to respond to invitation")


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

        logger.info(
            f"User joined challenge: challenge={challenge_id}, user={current_user.email}"
        )

        return ChallengeParticipantResponse(
            id=participant.id,
            challenge_id=participant.challenge_id,
            user_id=participant.user_id,
            joined_at=participant.joined_at,
            placement=participant.placement,
            karma_earned=participant.karma_earned,
            user_name=get_display_name(current_user),
            user_avatar=current_user.avatar_url,
            user_tier=current_user.user_tier.value if current_user.user_tier else None
        )
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to join challenge: {str(e)}")
        raise InternalError(message="Failed to join challenge")


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
            user_name=get_display_name(current_user),
            user_avatar=current_user.avatar_url,
            user_tier=current_user.user_tier.value if current_user.user_tier else None
        )
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to create entry: {str(e)}")
        raise InternalError(message="Failed to create entry")


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

        logger.info(
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
            user_name=get_display_name(current_user),
            user_avatar=current_user.avatar_url,
            user_tier=current_user.user_tier.value if current_user.user_tier else None
        )
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to submit entry: {str(e)}")
        raise InternalError(message="Failed to submit entry")


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
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to get entries: {str(e)}")
        raise InternalError(message="Failed to retrieve entries")
