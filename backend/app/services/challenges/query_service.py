"""
Challenge Query Service - Provides read-only query operations.
"""

from typing import Optional, List, Tuple, Dict, Any

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.review_request import ContentType
from app.models.challenge import Challenge, ChallengeStatus, ChallengeType, InvitationMode
from app.models.challenge_entry import ChallengeEntry
from app.models.challenge_vote import ChallengeVote
from app.models.challenge_invitation import ChallengeInvitation
from app.models.challenge_participant import ChallengeParticipant
from app.services.challenges.base import BaseChallengeService


class ChallengeQueryService(BaseChallengeService):
    """Service for querying challenges (read-only operations)."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)

    async def get_challenge(self, challenge_id: int) -> Optional[Challenge]:
        """Get a challenge by ID with all relations."""
        return await self.get_challenge_with_relations(challenge_id)

    async def get_challenges(
        self,
        status: Optional[ChallengeStatus] = None,
        challenge_type: Optional[ChallengeType] = None,
        content_type: Optional[ContentType] = None,
        is_featured: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Challenge], int]:
        """Get challenges with filters."""
        stmt = select(Challenge)

        if status:
            stmt = stmt.where(Challenge.status == status)
        if challenge_type:
            stmt = stmt.where(Challenge.challenge_type == challenge_type)
        if content_type:
            stmt = stmt.where(Challenge.content_type == content_type)
        if is_featured is not None:
            stmt = stmt.where(Challenge.is_featured == is_featured)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Get paginated results
        stmt = (
            stmt
            .options(
                selectinload(Challenge.entries).selectinload(ChallengeEntry.user),
                selectinload(Challenge.prompt),
                selectinload(Challenge.participant1),
                selectinload(Challenge.participant2),
                selectinload(Challenge.winner),
                selectinload(Challenge.creator),
                selectinload(Challenge.votes),
                selectinload(Challenge.invitations).selectinload(ChallengeInvitation.user),
                selectinload(Challenge.participants)
            )
            .order_by(Challenge.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        challenges = list(result.scalars().all())

        return challenges, total

    async def get_active_challenges(
        self,
        content_type: Optional[ContentType] = None,
        limit: int = 20
    ) -> List[Challenge]:
        """Get challenges currently in voting phase."""
        stmt = (
            select(Challenge)
            .where(Challenge.status == ChallengeStatus.VOTING)
            .options(
                selectinload(Challenge.entries).selectinload(ChallengeEntry.user),
                selectinload(Challenge.prompt),
                selectinload(Challenge.participant1),
                selectinload(Challenge.participant2),
                selectinload(Challenge.winner),
                selectinload(Challenge.creator),
                selectinload(Challenge.votes),
                selectinload(Challenge.invitations).selectinload(ChallengeInvitation.user),
                selectinload(Challenge.participants)
            )
            .order_by(Challenge.voting_started_at.desc())
            .limit(limit)
        )

        if content_type:
            stmt = stmt.where(Challenge.content_type == content_type)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_open_slot_challenges(
        self,
        content_type: Optional[ContentType] = None,
        limit: int = 20
    ) -> List[Challenge]:
        """Get 1v1 challenges with available slots for claiming."""
        from datetime import datetime
        now = datetime.utcnow()

        stmt = (
            select(Challenge)
            .where(
                Challenge.challenge_type == ChallengeType.ONE_ON_ONE,
                Challenge.invitation_mode == InvitationMode.OPEN_SLOTS,
                Challenge.status == ChallengeStatus.OPEN,
                or_(
                    Challenge.slots_close_at.is_(None),
                    Challenge.slots_close_at > now
                )
            )
            .options(
                selectinload(Challenge.prompt),
                selectinload(Challenge.participant1),
                selectinload(Challenge.participant2),
                selectinload(Challenge.creator)
            )
            .order_by(Challenge.created_at.desc())
            .limit(limit)
        )

        if content_type:
            stmt = stmt.where(Challenge.content_type == content_type)

        result = await self.db.execute(stmt)
        challenges = list(result.scalars().all())

        # Filter to only those with available slots
        return [c for c in challenges if c.available_slots > 0]

    async def get_user_challenge_stats(self, user_id: int) -> Dict[str, Any]:
        """Get challenge statistics for a user."""
        user = await self.db.get(User, user_id)
        if not user:
            return {}

        total = user.challenges_won + user.challenges_lost + user.challenges_drawn
        win_rate = (user.challenges_won / total * 100) if total > 0 else 0

        # Get total votes received
        stmt = select(func.sum(ChallengeEntry.vote_count)).where(
            ChallengeEntry.user_id == user_id
        )
        result = await self.db.execute(stmt)
        total_votes_received = result.scalar() or 0

        # Get total votes cast
        stmt = select(func.count(ChallengeVote.id)).where(
            ChallengeVote.voter_id == user_id
        )
        result = await self.db.execute(stmt)
        total_votes_cast = result.scalar() or 0

        # Get category participations
        stmt = select(func.count(ChallengeParticipant.id)).where(
            ChallengeParticipant.user_id == user_id
        )
        result = await self.db.execute(stmt)
        category_participations = result.scalar() or 0

        return {
            "challenges_won": user.challenges_won,
            "challenges_lost": user.challenges_lost,
            "challenges_drawn": user.challenges_drawn,
            "total_challenges": total,
            "win_rate": round(win_rate, 1),
            "current_streak": user.challenge_win_streak,
            "best_streak": user.best_challenge_streak,
            "total_votes_received": total_votes_received,
            "total_votes_cast": total_votes_cast,
            "category_participations": category_participations
        }

    async def get_leaderboard(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get challenge leaderboard."""
        stmt = (
            select(User)
            .where(User.challenges_won > 0)
            .order_by(User.challenges_won.desc(), User.best_challenge_streak.desc())
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        users = list(result.scalars().all())

        leaderboard = []
        for rank, user in enumerate(users, 1):
            total = user.challenges_won + user.challenges_lost + user.challenges_drawn
            win_rate = (user.challenges_won / total * 100) if total > 0 else 0

            leaderboard.append({
                "rank": rank,
                "user_id": user.id,
                "username": user.username,
                "user_name": user.full_name or user.email.split('@')[0],
                "user_avatar": user.avatar_url,
                "user_tier": user.user_tier.value if user.user_tier else None,
                "challenges_won": user.challenges_won,
                "win_rate": round(win_rate, 1),
                "best_streak": user.best_challenge_streak
            })

        return leaderboard

    async def get_user_challenges(
        self,
        user_id: int,
        status: Optional[ChallengeStatus] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Challenge], int]:
        """Get challenges a user is participating in."""
        # Find challenges where user is participant1, participant2, or in participants list
        stmt = select(Challenge).where(
            or_(
                Challenge.participant1_id == user_id,
                Challenge.participant2_id == user_id,
                Challenge.id.in_(
                    select(ChallengeParticipant.challenge_id).where(
                        ChallengeParticipant.user_id == user_id
                    )
                )
            )
        )

        if status:
            stmt = stmt.where(Challenge.status == status)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Get paginated results with relations
        stmt = (
            stmt
            .options(
                selectinload(Challenge.entries).selectinload(ChallengeEntry.user),
                selectinload(Challenge.prompt),
                selectinload(Challenge.participant1),
                selectinload(Challenge.participant2),
                selectinload(Challenge.winner),
            )
            .order_by(Challenge.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        challenges = list(result.scalars().all())

        return challenges, total
