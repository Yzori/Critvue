"""Common imports, dependencies, and helpers for challenge endpoints."""

from typing import Optional, List
from fastapi import Depends, Path as PathParam, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_user_optional
from app.models.user import User, UserRole
from app.core.exceptions import (
    AdminRequiredError,
    NotFoundError,
    InvalidInputError,
    InternalError,
)
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
    OpenSlotsRequest,
    SlotClaimResponse,
    OpenSlotChallengeResponse,
)
from app.services.challenges import ChallengeService
from app.core.logging_config import get_logger
from app.utils import get_display_name

logger = get_logger(__name__)


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to verify current user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise AdminRequiredError()
    return current_user


def build_challenge_response(
    challenge,
    current_user_id: Optional[int] = None,
    entries: Optional[list] = None
) -> ChallengeResponse:
    """Build a ChallengeResponse with user context."""
    # Get participant info
    participant1_name = None
    participant1_avatar = None
    participant2_name = None
    participant2_avatar = None
    winner_name = None

    if challenge.participant1:
        participant1_name = get_display_name(challenge.participant1)
        participant1_avatar = challenge.participant1.avatar_url
    if challenge.participant2:
        participant2_name = get_display_name(challenge.participant2)
        participant2_avatar = challenge.participant2.avatar_url
    if challenge.winner:
        winner_name = get_display_name(challenge.winner)

    creator_name = get_display_name(challenge.creator)

    # Build entry responses
    entry_responses = _build_entry_responses(challenge, entries, current_user_id)

    # Get current user context
    user_context = _get_user_context(challenge, current_user_id, entry_responses)

    # Build invitation responses
    invitation_responses = _build_invitation_responses(challenge)

    # Build prompt response
    prompt_response = _build_prompt_response(challenge.prompt)

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
        invitation_mode=challenge.invitation_mode,
        slots_open_at=challenge.slots_open_at,
        slots_close_at=challenge.slots_close_at,
        has_open_slots=challenge.has_open_slots,
        available_slots=challenge.available_slots,
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
        current_user_entry=user_context["entry"],
        current_user_voted=user_context["voted"],
        current_user_vote_entry_id=user_context["vote_entry_id"],
        current_user_invitation=user_context["invitation"],
        current_user_is_participant=user_context["is_participant"]
    )


def _build_entry_responses(
    challenge,
    entries: Optional[list],
    current_user_id: Optional[int]
) -> List[ChallengeEntryResponse]:
    """Build entry response list."""
    if entries is None:
        entries = challenge.entries

    entry_responses = []
    for entry in entries:
        user_name = None
        user_avatar = None
        user_tier = None
        if entry.user:
            user_name = get_display_name(entry.user)
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

    return entry_responses


def _get_user_context(
    challenge,
    current_user_id: Optional[int],
    entry_responses: List[ChallengeEntryResponse]
) -> dict:
    """Extract current user context from challenge."""
    result = {
        "entry": None,
        "voted": False,
        "vote_entry_id": None,
        "invitation": None,
        "is_participant": False
    }

    if not current_user_id:
        return result

    # Find user's entry
    for entry_resp in entry_responses:
        if entry_resp.user_id == current_user_id:
            result["entry"] = entry_resp
            break

    # Check if user voted
    if challenge.votes:
        for vote in challenge.votes:
            if vote.voter_id == current_user_id:
                result["voted"] = True
                result["vote_entry_id"] = vote.entry_id
                break

    # Check for user invitation
    if challenge.invitations:
        for inv in challenge.invitations:
            if inv.user_id == current_user_id:
                result["invitation"] = ChallengeInvitationResponse(
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
    if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
        result["is_participant"] = current_user_id in [
            challenge.participant1_id,
            challenge.participant2_id
        ]
    else:
        result["is_participant"] = any(
            p.user_id == current_user_id for p in challenge.participants
        )

    return result


def _build_invitation_responses(challenge) -> List[ChallengeInvitationResponse]:
    """Build invitation response list."""
    invitation_responses = []
    for inv in challenge.invitations:
        user_name = None
        user_avatar = None
        user_tier = None
        if inv.user:
            user_name = get_display_name(inv.user)
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

    return invitation_responses


def _build_prompt_response(prompt) -> Optional[ChallengePromptResponse]:
    """Build prompt response."""
    if not prompt:
        return None
    return ChallengePromptResponse(
        id=prompt.id,
        title=prompt.title,
        description=prompt.description,
        content_type=prompt.content_type,
        difficulty=prompt.difficulty,
        is_active=prompt.is_active,
        times_used=prompt.times_used,
        created_at=prompt.created_at
    )
