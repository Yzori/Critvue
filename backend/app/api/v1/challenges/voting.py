"""Voting and statistics endpoints for challenges."""

from fastapi import APIRouter, Depends, Path as PathParam
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.core.exceptions import NotFoundError, InvalidInputError, InternalError, AdminRequiredError
from app.schemas.challenge import (
    ChallengeVoteCreate,
    ChallengeVoteResponse,
    ChallengeVoteStats,
    ChallengeStats,
)
from app.services.challenges import ChallengeService
from app.api.v1.challenges.common import logger

router = APIRouter(tags=["Challenges - Voting"])


# ==================== VOTING ====================


@router.post(
    "/{challenge_id}/vote",
    response_model=ChallengeVoteResponse,
    status_code=201,
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

        logger.info(
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
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to cast vote: {str(e)}")
        raise InternalError(message="Failed to cast vote")


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
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Failed to get vote stats: {str(e)}")
        raise InternalError(message="Failed to retrieve vote statistics")


# ==================== STATISTICS ====================


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
        logger.error(f"Failed to get user stats: {str(e)}")
        raise InternalError(message="Failed to retrieve statistics")


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
            raise NotFoundError(resource="User")

        return ChallengeStats(**stats)
    except (NotFoundError, InvalidInputError, InternalError, AdminRequiredError):
        raise
    except Exception as e:
        logger.error(f"Failed to get user stats: {str(e)}")
        raise InternalError(message="Failed to retrieve statistics")
