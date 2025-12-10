"""
Base class and shared utilities for challenge services.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import Challenge
from app.models.challenge_entry import ChallengeEntry
from app.models.challenge_vote import ChallengeVote
from app.models.challenge_invitation import ChallengeInvitation
from app.models.challenge_participant import ChallengeParticipant
from app.constants.challenges import (
    KARMA_VALUES,
    DEFAULT_SUBMISSION_HOURS,
    DEFAULT_VOTING_HOURS,
    INVITATION_EXPIRY_HOURS,
    DRAW_THRESHOLD_PERCENT,
)


class BaseChallengeService:
    """Base class for challenge services with shared utilities."""

    # Re-export constants for backward compatibility
    KARMA_VALUES = KARMA_VALUES
    DEFAULT_SUBMISSION_HOURS = DEFAULT_SUBMISSION_HOURS
    DEFAULT_VOTING_HOURS = DEFAULT_VOTING_HOURS
    INVITATION_EXPIRY_HOURS = INVITATION_EXPIRY_HOURS
    DRAW_THRESHOLD = DRAW_THRESHOLD_PERCENT

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_challenge_with_relations(self, challenge_id: int) -> Optional[Challenge]:
        """Get challenge with all relationships loaded."""
        stmt = (
            select(Challenge)
            .where(Challenge.id == challenge_id)
            .options(
                selectinload(Challenge.entries).selectinload(ChallengeEntry.user),
                selectinload(Challenge.votes),
                selectinload(Challenge.invitations).selectinload(ChallengeInvitation.user),
                selectinload(Challenge.participants),
                selectinload(Challenge.prompt),
                selectinload(Challenge.participant1),
                selectinload(Challenge.participant2),
                selectinload(Challenge.winner),
                selectinload(Challenge.creator)
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_entry(self, challenge_id: int, user_id: int) -> Optional[ChallengeEntry]:
        """Get a user's entry for a challenge."""
        stmt = select(ChallengeEntry).where(
            ChallengeEntry.challenge_id == challenge_id,
            ChallengeEntry.user_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_vote(self, challenge_id: int, user_id: int) -> Optional[ChallengeVote]:
        """Check if user has voted in a challenge."""
        stmt = select(ChallengeVote).where(
            ChallengeVote.challenge_id == challenge_id,
            ChallengeVote.voter_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_participant(self, challenge_id: int, user_id: int) -> Optional[ChallengeParticipant]:
        """Get a user's participation record."""
        stmt = select(ChallengeParticipant).where(
            ChallengeParticipant.challenge_id == challenge_id,
            ChallengeParticipant.user_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_invitation(
        self,
        challenge_id: int,
        user_id: int
    ) -> Optional[ChallengeInvitation]:
        """Get a user's invitation for a challenge."""
        stmt = select(ChallengeInvitation).where(
            ChallengeInvitation.challenge_id == challenge_id,
            ChallengeInvitation.user_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
