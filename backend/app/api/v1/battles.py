"""Battle API endpoints for 1v1 creative competitions"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Path as PathParam, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.review_request import ContentType
from app.models.battle import BattleStatus, BattleType
from app.schemas.battle import (
    BattleCreate,
    BattleJoinQueue,
    BattleResponse,
    BattleListResponse,
    BattleEntryCreate,
    BattleEntryUpdate,
    BattleEntryResponse,
    BattleVoteCreate,
    BattleVoteResponse,
    BattleVoteStats,
    BattlePromptResponse,
    BattlePromptListResponse,
    BattleStats,
    BattleLeaderboardResponse,
    BattleLeaderboardEntry,
    QueueStatus,
    BattleChallengeResponse,
)
from app.services.battle_service import BattleService
from app.core.logging_config import security_logger

router = APIRouter(prefix="/battles", tags=["Battles"])


# ==================== PROMPTS ====================


@router.get(
    "/prompts",
    response_model=BattlePromptListResponse,
    summary="Get available battle prompts"
)
async def get_prompts(
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of prompts"),
    db: AsyncSession = Depends(get_db)
) -> BattlePromptListResponse:
    """
    Get available battle prompts.

    Prompts are platform-curated challenges that battles are based on.
    """
    try:
        service = BattleService(db)
        prompts = await service.get_prompts(
            content_type=content_type,
            limit=limit
        )

        return BattlePromptListResponse(
            items=[BattlePromptResponse.model_validate(p) for p in prompts],
            total=len(prompts)
        )
    except Exception as e:
        security_logger.logger.error(f"Failed to get battle prompts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prompts"
        )


@router.get(
    "/prompts/{prompt_id}",
    response_model=BattlePromptResponse,
    summary="Get a specific prompt"
)
async def get_prompt(
    prompt_id: int = PathParam(..., ge=1, description="Prompt ID"),
    db: AsyncSession = Depends(get_db)
) -> BattlePromptResponse:
    """Get a specific battle prompt by ID."""
    try:
        service = BattleService(db)
        prompt = await service.get_prompt(prompt_id)

        if not prompt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prompt not found"
            )

        return BattlePromptResponse.model_validate(prompt)
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to get prompt {prompt_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prompt"
        )


# ==================== BATTLE CRUD ====================


@router.post(
    "",
    response_model=BattleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new battle"
)
async def create_battle(
    battle_data: BattleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleResponse:
    """
    Create a new battle.

    For QUEUE type: Battle waits for a matching opponent.
    For DIRECT type: Creates a challenge for the specified user.
    """
    try:
        service = BattleService(db)

        battle = await service.create_battle(
            creator_id=current_user.id,
            title=battle_data.title,
            content_type=battle_data.content_type,
            prompt_id=battle_data.prompt_id,
            battle_type=battle_data.battle_type,
            submission_hours=battle_data.submission_hours,
            voting_hours=battle_data.voting_hours,
            challenged_user_id=battle_data.challenged_user_id,
            challenge_message=battle_data.challenge_message
        )

        security_logger.logger.info(
            f"Battle created: id={battle.id}, creator={current_user.email}, "
            f"type={battle.battle_type.value}"
        )

        return await _build_battle_response(battle, current_user.id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to create battle for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create battle"
        )


@router.get(
    "",
    response_model=BattleListResponse,
    summary="List battles"
)
async def list_battles(
    status_filter: Optional[BattleStatus] = Query(None, description="Filter by status"),
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    user_id: Optional[int] = Query(None, description="Filter by participant user ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum records to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleListResponse:
    """Get a paginated list of battles with optional filters."""
    try:
        service = BattleService(db)
        battles, total = await service.get_battles(
            status=status_filter,
            content_type=content_type,
            user_id=user_id,
            skip=skip,
            limit=limit
        )

        items = [
            await _build_battle_response(b, current_user.id, db)
            for b in battles
        ]

        return BattleListResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(battles)) < total
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to list battles for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve battles"
        )


@router.get(
    "/active",
    response_model=List[BattleResponse],
    summary="Get active battles (voting phase)"
)
async def get_active_battles(
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    limit: int = Query(20, ge=1, le=50, description="Maximum battles to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[BattleResponse]:
    """Get battles currently in the voting phase."""
    try:
        service = BattleService(db)
        battles = await service.get_active_battles(
            content_type=content_type,
            limit=limit
        )

        return [
            await _build_battle_response(b, current_user.id, db)
            for b in battles
        ]
    except Exception as e:
        security_logger.logger.error(f"Failed to get active battles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve active battles"
        )


@router.get(
    "/my",
    response_model=BattleListResponse,
    summary="Get current user's battles"
)
async def get_my_battles(
    status_filter: Optional[BattleStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum records to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleListResponse:
    """Get battles where the current user is a participant."""
    try:
        service = BattleService(db)
        battles, total = await service.get_battles(
            status=status_filter,
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )

        items = [
            await _build_battle_response(b, current_user.id, db)
            for b in battles
        ]

        return BattleListResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(battles)) < total
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to get battles for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve your battles"
        )


@router.get(
    "/challenges/pending",
    response_model=List[BattleResponse],
    summary="Get pending challenges"
)
async def get_pending_challenges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[BattleResponse]:
    """Get battles where you have been challenged and haven't responded yet."""
    try:
        service = BattleService(db)
        battles = await service.get_pending_challenges(current_user.id)

        return [
            await _build_battle_response(b, current_user.id, db)
            for b in battles
        ]
    except Exception as e:
        security_logger.logger.error(
            f"Failed to get pending challenges for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve pending challenges"
        )


@router.get(
    "/stats/me",
    response_model=BattleStats,
    summary="Get current user's battle statistics"
)
async def get_my_battle_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleStats:
    """Get battle statistics for the current user."""
    try:
        service = BattleService(db)
        stats = await service.get_user_battle_stats(current_user.id)

        return BattleStats(**stats)
    except Exception as e:
        security_logger.logger.error(
            f"Failed to get battle stats for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get(
    "/stats/{user_id}",
    response_model=BattleStats,
    summary="Get a user's battle statistics"
)
async def get_user_battle_stats(
    user_id: int = PathParam(..., ge=1, description="User ID"),
    db: AsyncSession = Depends(get_db)
) -> BattleStats:
    """Get battle statistics for a specific user."""
    try:
        service = BattleService(db)
        stats = await service.get_user_battle_stats(user_id)

        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return BattleStats(**stats)
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to get battle stats for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


# ==================== LEADERBOARD ====================


@router.get(
    "/leaderboard",
    response_model=BattleLeaderboardResponse,
    summary="Get battle leaderboard"
)
async def get_leaderboard(
    limit: int = Query(50, ge=1, le=100, description="Number of entries"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleLeaderboardResponse:
    """Get the battle leaderboard ranked by wins."""
    try:
        from sqlalchemy import select, func, desc
        from app.models.user import User

        # Query users with battle stats, ranked by wins
        stmt = (
            select(User)
            .where(User.battles_won > 0)
            .order_by(desc(User.battles_won), desc(User.best_battle_streak))
            .limit(limit)
        )

        result = await db.execute(stmt)
        users = list(result.scalars().all())

        # Build leaderboard entries
        entries = []
        for rank, user in enumerate(users, 1):
            total = user.battles_won + user.battles_lost + user.battles_drawn
            win_rate = (user.battles_won / total * 100) if total > 0 else 0

            entries.append(BattleLeaderboardEntry(
                rank=rank,
                user_id=user.id,
                user_name=user.full_name or user.email.split('@')[0],
                user_avatar=user.avatar_url,
                battles_won=user.battles_won,
                win_rate=round(win_rate, 1),
                best_streak=user.best_battle_streak
            ))

        # Find current user's rank
        current_user_rank = None
        for entry in entries:
            if entry.user_id == current_user.id:
                current_user_rank = entry.rank
                break

        # Count total participants
        count_stmt = select(func.count()).select_from(User).where(User.battles_won > 0)
        count_result = await db.execute(count_stmt)
        total_participants = count_result.scalar() or 0

        return BattleLeaderboardResponse(
            entries=entries,
            total_participants=total_participants,
            current_user_rank=current_user_rank
        )
    except Exception as e:
        security_logger.logger.error(f"Failed to get leaderboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leaderboard"
        )


@router.get(
    "/{battle_id}",
    response_model=BattleResponse,
    summary="Get a specific battle"
)
async def get_battle(
    battle_id: int = PathParam(..., ge=1, description="Battle ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleResponse:
    """Get a specific battle by ID."""
    try:
        service = BattleService(db)
        battle = await service.get_battle(battle_id)

        if not battle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Battle not found"
            )

        return await _build_battle_response(battle, current_user.id, db)
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(f"Failed to get battle {battle_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve battle"
        )


# ==================== QUEUE MATCHMAKING ====================


@router.post(
    "/queue/join",
    response_model=BattleResponse,
    summary="Join the battle queue"
)
async def join_queue(
    queue_data: BattleJoinQueue,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleResponse:
    """
    Join the matchmaking queue for a battle.

    If a matching opponent is found, automatically joins their battle.
    Otherwise, creates a new pending battle to wait for an opponent.
    """
    try:
        service = BattleService(db)

        # Check for existing match
        match = await service.find_match_in_queue(
            content_type=queue_data.content_type,
            prompt_id=queue_data.prompt_id,
            user_id=current_user.id,
            user_tier=current_user.user_tier.value if current_user.user_tier else "novice"
        )

        if match:
            # Join the existing battle
            battle = await service.join_battle(match.id, current_user.id)
            security_logger.logger.info(
                f"User {current_user.email} matched to battle {battle.id}"
            )
        else:
            # Create a new battle and wait
            prompt = await service.get_prompt(queue_data.prompt_id)
            if not prompt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid prompt ID"
                )

            battle = await service.create_battle(
                creator_id=current_user.id,
                title=f"Battle: {prompt.title}",
                content_type=queue_data.content_type,
                prompt_id=queue_data.prompt_id,
                battle_type=BattleType.QUEUE
            )
            security_logger.logger.info(
                f"User {current_user.email} created queue battle {battle.id}"
            )

        return await _build_battle_response(battle, current_user.id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(
            f"Failed to join queue for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join queue"
        )


@router.get(
    "/queue/status",
    response_model=QueueStatus,
    summary="Get queue status"
)
async def get_queue_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> QueueStatus:
    """Check if the current user is in a matchmaking queue."""
    try:
        service = BattleService(db)
        battles, _ = await service.get_battles(
            status=BattleStatus.PENDING,
            user_id=current_user.id,
            limit=1
        )

        # Check if user has a pending queue battle
        queue_battle = None
        for b in battles:
            if b.battle_type == BattleType.QUEUE and b.creator_id == current_user.id:
                queue_battle = b
                break

        if queue_battle:
            return QueueStatus(
                in_queue=True,
                content_type=queue_battle.content_type,
                prompt_id=queue_battle.prompt_id,
                prompt_title=queue_battle.prompt.title if queue_battle.prompt else None,
                joined_at=queue_battle.created_at,
                estimated_wait="~5 minutes"
            )

        return QueueStatus(in_queue=False)
    except Exception as e:
        security_logger.logger.error(
            f"Failed to get queue status for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get queue status"
        )


@router.delete(
    "/queue/leave",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Leave the battle queue"
)
async def leave_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Leave the matchmaking queue (cancel pending queue battle)."""
    try:
        service = BattleService(db)
        battles, _ = await service.get_battles(
            status=BattleStatus.PENDING,
            user_id=current_user.id,
            limit=10
        )

        # Find and cancel queue battles created by this user
        cancelled = False
        for b in battles:
            if b.battle_type == BattleType.QUEUE and b.creator_id == current_user.id:
                b.status = BattleStatus.CANCELLED
                cancelled = True

        if cancelled:
            await db.commit()
            security_logger.logger.info(f"User {current_user.email} left battle queue")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not in queue"
            )
    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(
            f"Failed to leave queue for user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave queue"
        )


# ==================== CHALLENGES ====================


@router.post(
    "/{battle_id}/accept",
    response_model=BattleResponse,
    summary="Accept a battle challenge"
)
async def accept_challenge(
    battle_id: int = PathParam(..., ge=1, description="Battle ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleResponse:
    """Accept a direct challenge and join the battle."""
    try:
        service = BattleService(db)
        battle = await service.join_battle(battle_id, current_user.id)

        security_logger.logger.info(
            f"User {current_user.email} accepted challenge for battle {battle_id}"
        )

        return await _build_battle_response(battle, current_user.id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to accept challenge for battle {battle_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept challenge"
        )


@router.post(
    "/{battle_id}/decline",
    response_model=BattleResponse,
    summary="Decline a battle challenge"
)
async def decline_challenge(
    battle_id: int = PathParam(..., ge=1, description="Battle ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleResponse:
    """Decline a direct challenge."""
    try:
        service = BattleService(db)
        battle = await service.decline_challenge(battle_id, current_user.id)

        security_logger.logger.info(
            f"User {current_user.email} declined challenge for battle {battle_id}"
        )

        return await _build_battle_response(battle, current_user.id, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to decline challenge for battle {battle_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decline challenge"
        )


# ==================== ENTRIES ====================


@router.post(
    "/{battle_id}/entries",
    response_model=BattleEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update battle entry"
)
async def create_entry(
    entry_data: BattleEntryCreate,
    battle_id: int = PathParam(..., ge=1, description="Battle ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleEntryResponse:
    """
    Create or update a battle entry.

    Can be called multiple times before submission to update the entry.
    """
    try:
        service = BattleService(db)
        entry = await service.create_entry(
            battle_id=battle_id,
            user_id=current_user.id,
            title=entry_data.title,
            description=entry_data.description,
            file_urls=entry_data.file_urls,
            external_links=entry_data.external_links,
            thumbnail_url=entry_data.thumbnail_url
        )

        security_logger.logger.info(
            f"Entry created/updated for battle {battle_id} by user {current_user.email}"
        )

        response = BattleEntryResponse.model_validate(entry)
        response.user_name = current_user.full_name or current_user.email.split('@')[0]
        response.user_avatar = current_user.avatar_url

        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to create entry for battle {battle_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create entry"
        )


@router.post(
    "/{battle_id}/entries/submit",
    response_model=BattleEntryResponse,
    summary="Submit battle entry (finalize)"
)
async def submit_entry(
    battle_id: int = PathParam(..., ge=1, description="Battle ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleEntryResponse:
    """
    Submit (finalize) a battle entry.

    After submission, the entry cannot be edited.
    When both participants submit, voting begins.
    """
    try:
        service = BattleService(db)
        entry = await service.submit_entry(battle_id, current_user.id)

        security_logger.logger.info(
            f"Entry submitted for battle {battle_id} by user {current_user.email}"
        )

        response = BattleEntryResponse.model_validate(entry)
        response.user_name = current_user.full_name or current_user.email.split('@')[0]
        response.user_avatar = current_user.avatar_url

        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to submit entry for battle {battle_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit entry"
        )


@router.get(
    "/{battle_id}/entries",
    response_model=List[BattleEntryResponse],
    summary="Get battle entries"
)
async def get_entries(
    battle_id: int = PathParam(..., ge=1, description="Battle ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[BattleEntryResponse]:
    """
    Get entries for a battle.

    During blind mode (ACTIVE status), other users' entries are hidden.
    """
    try:
        service = BattleService(db)
        entries = await service.get_entries(battle_id, current_user.id)

        return [
            BattleEntryResponse.model_validate(e)
            for e in entries
        ]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(f"Failed to get entries for battle {battle_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve entries"
        )


# ==================== VOTING ====================


@router.post(
    "/{battle_id}/vote",
    response_model=BattleVoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cast a vote"
)
async def cast_vote(
    vote_data: BattleVoteCreate,
    battle_id: int = PathParam(..., ge=1, description="Battle ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> BattleVoteResponse:
    """
    Cast a vote for an entry.

    Rules:
    - One vote per user per battle
    - Cannot vote on your own battle
    - Votes are final
    - Earns karma for voting
    """
    try:
        service = BattleService(db)
        vote = await service.cast_vote(
            battle_id=battle_id,
            voter_id=current_user.id,
            entry_id=vote_data.entry_id
        )

        security_logger.logger.info(
            f"Vote cast for battle {battle_id} by user {current_user.email}"
        )

        return BattleVoteResponse.model_validate(vote)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(
            f"Failed to cast vote for battle {battle_id}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cast vote"
        )


@router.get(
    "/{battle_id}/votes",
    response_model=BattleVoteStats,
    summary="Get vote statistics"
)
async def get_vote_stats(
    battle_id: int = PathParam(..., ge=1, description="Battle ID"),
    db: AsyncSession = Depends(get_db)
) -> BattleVoteStats:
    """
    Get vote statistics for a battle.

    During voting phase, individual vote counts are hidden.
    Full stats are revealed after voting ends.
    """
    try:
        service = BattleService(db)
        stats = await service.get_vote_stats(battle_id)

        if "error" in stats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=stats["error"]
            )

        # Handle hidden stats during voting
        if stats.get("creator_votes") == "Hidden":
            return BattleVoteStats(
                total_votes=stats["total_votes"],
                creator_votes=0,
                opponent_votes=0,
                creator_percentage=0.0,
                opponent_percentage=0.0
            )

        return BattleVoteStats(**stats)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        security_logger.logger.error(f"Failed to get vote stats for battle {battle_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve vote statistics"
        )


# ==================== HELPERS ====================


async def _build_battle_response(
    battle,
    current_user_id: int,
    db: AsyncSession
) -> BattleResponse:
    """Build a complete battle response with all related data."""
    from app.models.user import User

    response = BattleResponse.model_validate(battle)

    # Add prompt info
    if battle.prompt:
        response.prompt = BattlePromptResponse.model_validate(battle.prompt)

    # Add user info for creator
    if battle.creator_id:
        creator = await db.get(User, battle.creator_id)
        if creator:
            response.creator_name = creator.full_name or creator.email.split('@')[0]
            response.creator_avatar = creator.avatar_url

    # Add user info for opponent
    if battle.opponent_id:
        opponent = await db.get(User, battle.opponent_id)
        if opponent:
            response.opponent_name = opponent.full_name or opponent.email.split('@')[0]
            response.opponent_avatar = opponent.avatar_url

    # Add winner info
    if battle.winner_id:
        winner = await db.get(User, battle.winner_id)
        if winner:
            response.winner_name = winner.full_name or winner.email.split('@')[0]

    # Add entries (with blind mode handling)
    service = BattleService(db)
    entries = await service.get_entries(battle.id, current_user_id)
    response.entries = [BattleEntryResponse.model_validate(e) for e in entries]

    # Find current user's entry
    for entry in battle.entries:
        if entry.user_id == current_user_id:
            response.current_user_entry = BattleEntryResponse.model_validate(entry)
            break

    # Check if current user has voted
    vote = await service._get_user_vote(battle.id, current_user_id)
    if vote:
        response.current_user_voted = True
        response.current_user_vote_entry_id = vote.entry_id

    # Add challenge info
    if battle.challenge:
        response.challenge = BattleChallengeResponse.model_validate(battle.challenge)
        # Add challenger/challenged user info
        challenger = await db.get(User, battle.challenge.challenger_id)
        challenged = await db.get(User, battle.challenge.challenged_id)
        if challenger:
            response.challenge.challenger_name = challenger.full_name or challenger.email.split('@')[0]
            response.challenge.challenger_avatar = challenger.avatar_url
        if challenged:
            response.challenge.challenged_name = challenged.full_name or challenged.email.split('@')[0]
            response.challenge.challenged_avatar = challenged.avatar_url

    return response
