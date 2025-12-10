"""Public challenge API endpoints - browsing and viewing challenges."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Path as PathParam, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user_optional
from app.models.user import User
from app.models.review_request import ContentType
from app.models.challenge import ChallengeStatus, ChallengeType
from app.core.exceptions import NotFoundError, InvalidInputError, InternalError, AdminRequiredError
from app.schemas.challenge import (
    ChallengeResponse,
    ChallengeListResponse,
    ChallengePromptResponse,
    ChallengeLeaderboardResponse,
    ChallengeLeaderboardEntry,
    OpenSlotChallengeResponse,
)
from app.services.challenges import ChallengeService
from app.api.v1.challenges.common import (
    build_challenge_response,
    _build_prompt_response,
    logger,
    get_display_name,
)

router = APIRouter(tags=["Challenges - Public"])


@router.get(
    "/",
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
            items=[build_challenge_response(c, user_id) for c in challenges],
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(challenges)) < total
        )
    except Exception as e:
        logger.error(f"Failed to get challenges: {str(e)}")
        raise InternalError(message="Failed to retrieve challenges")


@router.get(
    "/open-slots",
    response_model=List[OpenSlotChallengeResponse],
    summary="Get 1v1 challenges with available slots"
)
async def get_open_slot_challenges(
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number"),
    db: AsyncSession = Depends(get_db)
) -> List[OpenSlotChallengeResponse]:
    """Get 1v1 challenges with available slots for claiming."""
    try:
        service = ChallengeService(db)
        challenges = await service.get_open_slot_challenges(
            content_type=content_type,
            limit=limit
        )

        responses = []
        for c in challenges:
            participant1_name = None
            participant1_avatar = None
            if c.participant1:
                participant1_name = get_display_name(c.participant1)
                participant1_avatar = c.participant1.avatar_url

            prompt_response = _build_prompt_response(c.prompt)

            responses.append(OpenSlotChallengeResponse(
                id=c.id,
                title=c.title,
                description=c.description,
                content_type=c.content_type,
                prompt=prompt_response,
                available_slots=c.available_slots,
                slots_close_at=c.slots_close_at,
                submission_hours=c.submission_hours,
                voting_hours=c.voting_hours,
                prize_description=c.prize_description,
                winner_karma_reward=c.winner_karma_reward,
                is_featured=c.is_featured,
                participant1_id=c.participant1_id,
                participant1_name=participant1_name,
                participant1_avatar=participant1_avatar
            ))

        return responses
    except Exception as e:
        logger.error(f"Failed to get open slot challenges: {str(e)}")
        raise InternalError(message="Failed to retrieve open slot challenges")


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

        return [build_challenge_response(c, user_id) for c in challenges]
    except Exception as e:
        logger.error(f"Failed to get active challenges: {str(e)}")
        raise InternalError(message="Failed to retrieve active challenges")


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
        logger.error(f"Failed to get leaderboard: {str(e)}")
        raise InternalError(message="Failed to retrieve leaderboard")


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
            raise NotFoundError(resource="Challenge")

        user_id = current_user.id if current_user else None

        # Get entries with blind mode handling
        entries = await service.get_entries(challenge_id, user_id)

        return build_challenge_response(challenge, user_id, entries)
    except (NotFoundError, InvalidInputError, InternalError, AdminRequiredError):
        raise
    except Exception as e:
        logger.error(f"Failed to get challenge {challenge_id}: {str(e)}")
        raise InternalError(message="Failed to retrieve challenge")
