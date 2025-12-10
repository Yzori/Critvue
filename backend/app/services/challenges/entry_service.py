"""
Challenge Entry Service - Manages entry submission and voting.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challenge import Challenge, ChallengeStatus, ChallengeType
from app.models.challenge_entry import ChallengeEntry
from app.models.challenge_vote import ChallengeVote
from app.models.challenge_participant import ChallengeParticipant
from app.models.sparks_transaction import SparksAction as KarmaAction
from app.services.sparks_service import SparksService as KarmaService
from app.services.challenges.base import BaseChallengeService
from app.constants.challenges import KARMA_VALUES
from app.core.exceptions import (
    NotFoundError,
    InvalidInputError,
    InvalidStateError,
    AlreadyExistsError,
    ForbiddenError,
)


class ChallengeEntryService(BaseChallengeService):
    """Service for managing challenge entries and voting."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.karma_service = KarmaService(db)

    # ==================== ENTRIES ====================

    async def create_entry(
        self,
        challenge_id: int,
        user_id: int,
        title: str,
        description: Optional[str] = None,
        file_urls: Optional[List[Dict]] = None,
        external_links: Optional[List[Dict]] = None,
        thumbnail_url: Optional[str] = None
    ) -> ChallengeEntry:
        """Create or update a challenge entry (before submission)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        # Verify user is a participant
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            if user_id not in [challenge.participant1_id, challenge.participant2_id]:
                raise ForbiddenError(message="You are not a participant in this challenge")
            if challenge.status != ChallengeStatus.ACTIVE:
                raise InvalidStateError(
                    message="Challenge is not accepting entries",
                    current_state=challenge.status.value,
                    allowed_states=["active"]
                )
        else:
            participant = await self.get_participant(challenge_id, user_id)
            if not participant:
                raise ForbiddenError(message="You have not joined this challenge")
            if challenge.status not in [ChallengeStatus.OPEN, ChallengeStatus.ACTIVE]:
                raise InvalidStateError(
                    message="Challenge is not accepting entries",
                    current_state=challenge.status.value,
                    allowed_states=["open", "active"]
                )

        # Check if entry already exists
        existing_entry = await self.get_user_entry(challenge_id, user_id)
        if existing_entry and existing_entry.submitted_at:
            raise InvalidStateError(message="Entry already submitted")

        if existing_entry:
            # Update existing entry
            existing_entry.title = title
            existing_entry.description = description
            existing_entry.file_urls = file_urls
            existing_entry.external_links = external_links
            existing_entry.thumbnail_url = thumbnail_url
            existing_entry.updated_at = datetime.utcnow()
            await self.db.commit()
            await self.db.refresh(existing_entry)
            return existing_entry

        # Create new entry
        entry = ChallengeEntry(
            challenge_id=challenge_id,
            user_id=user_id,
            title=title,
            description=description,
            file_urls=file_urls,
            external_links=external_links,
            thumbnail_url=thumbnail_url,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)

        return entry

    async def submit_entry(self, challenge_id: int, user_id: int) -> ChallengeEntry:
        """Submit an entry (mark as final)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        entry = await self.get_user_entry(challenge_id, user_id)
        if not entry:
            raise NotFoundError(resource="Entry", message="No entry found. Create an entry first.")

        if entry.submitted_at:
            raise InvalidStateError(message="Entry already submitted")

        if not entry.has_content:
            raise InvalidInputError(message="Entry must have at least one file or link")

        # Check deadline
        if challenge.submission_deadline and datetime.utcnow() > challenge.submission_deadline:
            raise InvalidStateError(message="Submission deadline has passed")

        entry.submitted_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(entry)

        return entry

    async def get_entries(
        self,
        challenge_id: int,
        current_user_id: Optional[int] = None
    ) -> List[ChallengeEntry]:
        """
        Get entries for a challenge.

        For 1v1 ACTIVE status (blind mode):
        - Returns redacted entries except for current user's entry
        """
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        entries = list(challenge.entries)

        # In 1v1 blind mode, redact content for opponent's entry
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            if challenge.status == ChallengeStatus.ACTIVE:
                for entry in entries:
                    if entry.user_id != current_user_id:
                        entry.title = "[Hidden until both submit]"
                        entry.description = None
                        entry.file_urls = None
                        entry.external_links = None
                        entry.thumbnail_url = None

        return entries

    async def check_both_submitted(self, challenge: Challenge) -> bool:
        """Check if both 1v1 entries are submitted."""
        submitted_count = sum(
            1 for entry in challenge.entries
            if entry.submitted_at is not None
        )
        return submitted_count >= 2

    # ==================== VOTING ====================

    async def cast_vote(
        self,
        challenge_id: int,
        voter_id: int,
        entry_id: int
    ) -> ChallengeVote:
        """
        Cast a vote for an entry.

        Rules:
        - One vote per user per challenge
        - Cannot vote on challenge you're participating in
        - Votes are final
        """
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.status != ChallengeStatus.VOTING:
            raise InvalidStateError(
                message="Challenge is not in voting phase",
                current_state=challenge.status.value,
                allowed_states=["voting"]
            )

        if challenge.voting_deadline and datetime.utcnow() > challenge.voting_deadline:
            raise InvalidStateError(message="Voting deadline has passed")

        # Check if voter is a participant
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            if voter_id in [challenge.participant1_id, challenge.participant2_id]:
                raise ForbiddenError(message="Cannot vote on your own challenge")
        else:
            participant = await self.get_participant(challenge_id, voter_id)
            if participant:
                raise ForbiddenError(message="Cannot vote on a challenge you're participating in")

        # Check if already voted
        existing_vote = await self.get_user_vote(challenge_id, voter_id)
        if existing_vote:
            raise AlreadyExistsError(resource="Vote", message="Already voted in this challenge")

        # Validate entry belongs to this challenge
        entry = await self.db.get(ChallengeEntry, entry_id)
        if not entry or entry.challenge_id != challenge_id:
            raise NotFoundError(resource="Entry", resource_id=entry_id)

        # Create vote
        vote = ChallengeVote(
            challenge_id=challenge_id,
            voter_id=voter_id,
            entry_id=entry_id,
            voted_at=datetime.utcnow()
        )

        self.db.add(vote)

        # Update vote counts
        entry.vote_count += 1
        challenge.total_votes += 1

        # For 1v1, track participant votes
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            if entry.user_id == challenge.participant1_id:
                challenge.participant1_votes += 1
            else:
                challenge.participant2_votes += 1

        await self.db.commit()
        await self.db.refresh(vote)

        # Award karma for voting
        await self.karma_service.award_karma(
            user_id=voter_id,
            action=KarmaAction.CHALLENGE_VOTE_CAST,
            reason="Voted in a challenge",
            custom_points=KARMA_VALUES["vote_cast"]
        )

        return vote

    async def get_vote_stats(self, challenge_id: int) -> Dict[str, Any]:
        """Get vote statistics for a challenge (only after voting ends)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        # Only show full stats after voting ends
        if challenge.status not in [ChallengeStatus.COMPLETED, ChallengeStatus.DRAW]:
            if challenge.status == ChallengeStatus.VOTING:
                return {
                    "total_votes": challenge.total_votes,
                    "participant1_votes": "Hidden",
                    "participant2_votes": "Hidden",
                }
            return {"error": "Voting not started"}

        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            total = challenge.total_votes or 1
            return {
                "total_votes": challenge.total_votes,
                "participant1_votes": challenge.participant1_votes,
                "participant2_votes": challenge.participant2_votes,
                "participant1_percentage": round((challenge.participant1_votes / total) * 100, 1),
                "participant2_percentage": round((challenge.participant2_votes / total) * 100, 1)
            }
        else:
            # Category challenge - return top entries
            entries_sorted = sorted(challenge.entries, key=lambda e: e.vote_count, reverse=True)
            return {
                "total_votes": challenge.total_votes,
                "top_entries": [
                    {"entry_id": e.id, "user_id": e.user_id, "votes": e.vote_count}
                    for e in entries_sorted[:10]
                ]
            }

    # ==================== CATEGORY PARTICIPATION ====================

    async def join_category_challenge(
        self,
        challenge_id: int,
        user_id: int
    ) -> ChallengeParticipant:
        """Join a category challenge (user action)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.challenge_type != ChallengeType.CATEGORY:
            raise InvalidInputError(message="This is not a category challenge")

        if challenge.status != ChallengeStatus.OPEN:
            raise InvalidStateError(
                message="Challenge is not open for entries",
                current_state=challenge.status.value,
                allowed_states=["open"]
            )

        # Check if already joined
        existing = await self.get_participant(challenge_id, user_id)
        if existing:
            raise AlreadyExistsError(resource="Challenge participation")

        participant = ChallengeParticipant(
            challenge_id=challenge_id,
            user_id=user_id,
            joined_at=datetime.utcnow()
        )

        self.db.add(participant)
        challenge.total_entries += 1

        await self.db.commit()
        await self.db.refresh(participant)

        return participant
