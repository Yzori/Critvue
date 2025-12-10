"""
Challenge Facade - Provides backward-compatible interface to challenge services.

This facade maintains the original ChallengeService API while delegating
to the focused sub-services. Use this for backward compatibility or
when you need access to multiple challenge operations.

For new code, prefer importing the specific services directly.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_request import ContentType
from app.models.challenge import Challenge, ChallengeStatus, ChallengeType, InvitationMode
from app.models.challenge_prompt import ChallengePrompt
from app.models.challenge_entry import ChallengeEntry
from app.models.challenge_vote import ChallengeVote
from app.models.challenge_invitation import ChallengeInvitation
from app.models.challenge_participant import ChallengeParticipant

from app.services.challenges.prompt_service import ChallengePromptService
from app.services.challenges.invitation_service import ChallengeInvitationService
from app.services.challenges.entry_service import ChallengeEntryService
from app.services.challenges.lifecycle_service import ChallengeLifecycleService
from app.services.challenges.query_service import ChallengeQueryService
from app.constants.challenges import (
    KARMA_VALUES,
    DEFAULT_SUBMISSION_HOURS,
    DEFAULT_VOTING_HOURS,
    INVITATION_EXPIRY_HOURS,
    DRAW_THRESHOLD_PERCENT,
)


class ChallengeFacade:
    """
    Facade providing unified access to all challenge operations.

    Maintains backward compatibility with the original ChallengeService API
    while delegating to focused sub-services.

    Usage:
        service = ChallengeFacade(db)

        # Use like the original ChallengeService
        challenge = await service.create_challenge(...)
        await service.invite_creator(...)
        await service.cast_vote(...)

        # Or access sub-services directly
        prompts = await service.prompts.get_prompts()
    """

    # Re-export constants for backward compatibility
    KARMA_VALUES = KARMA_VALUES
    DEFAULT_SUBMISSION_HOURS = DEFAULT_SUBMISSION_HOURS
    DEFAULT_VOTING_HOURS = DEFAULT_VOTING_HOURS
    INVITATION_EXPIRY_HOURS = INVITATION_EXPIRY_HOURS
    DRAW_THRESHOLD = DRAW_THRESHOLD_PERCENT

    def __init__(self, db: AsyncSession):
        self.db = db

        # Initialize sub-services
        self.prompts = ChallengePromptService(db)
        self.invitations = ChallengeInvitationService(db)
        self.entries = ChallengeEntryService(db)
        self.lifecycle = ChallengeLifecycleService(db)
        self.queries = ChallengeQueryService(db)

    # ==================== PROMPTS ====================

    async def get_prompts(
        self,
        content_type: Optional[ContentType] = None,
        is_active: bool = True,
        limit: int = 50
    ) -> List[ChallengePrompt]:
        return await self.prompts.get_prompts(content_type, is_active, limit)

    async def get_prompt(self, prompt_id: int) -> Optional[ChallengePrompt]:
        return await self.prompts.get_prompt(prompt_id)

    async def create_prompt(
        self,
        title: str,
        description: str,
        content_type: ContentType,
        difficulty: str = "intermediate",
        is_active: bool = True
    ) -> ChallengePrompt:
        return await self.prompts.create_prompt(title, description, content_type, difficulty, is_active)

    async def update_prompt(self, prompt_id: int, **kwargs) -> Optional[ChallengePrompt]:
        return await self.prompts.update_prompt(prompt_id, **kwargs)

    async def delete_prompt(self, prompt_id: int) -> bool:
        return await self.prompts.delete_prompt(prompt_id)

    # ==================== CHALLENGE CREATION ====================

    async def create_challenge(
        self,
        admin_id: int,
        title: str,
        content_type: ContentType,
        challenge_type: ChallengeType,
        description: Optional[str] = None,
        prompt_id: Optional[int] = None,
        submission_hours: int = DEFAULT_SUBMISSION_HOURS,
        voting_hours: int = DEFAULT_VOTING_HOURS,
        max_winners: int = 1,
        is_featured: bool = False,
        banner_image_url: Optional[str] = None,
        prize_description: Optional[str] = None,
        invitation_mode: InvitationMode = InvitationMode.ADMIN_CURATED
    ) -> Challenge:
        return await self.lifecycle.create_challenge(
            admin_id, title, content_type, challenge_type, description,
            prompt_id, submission_hours, voting_hours, max_winners,
            is_featured, banner_image_url, prize_description, invitation_mode
        )

    async def update_challenge(self, challenge_id: int, **kwargs) -> Optional[Challenge]:
        return await self.lifecycle.update_challenge(challenge_id, **kwargs)

    # ==================== INVITATIONS ====================

    async def invite_creator(
        self,
        challenge_id: int,
        user_id: int,
        slot: int,
        message: Optional[str] = None
    ) -> ChallengeInvitation:
        return await self.invitations.invite_creator(challenge_id, user_id, slot, message)

    async def replace_invitation(
        self,
        challenge_id: int,
        slot: int,
        new_user_id: int,
        message: Optional[str] = None
    ) -> ChallengeInvitation:
        return await self.invitations.replace_invitation(challenge_id, slot, new_user_id, message)

    async def respond_to_invitation(
        self,
        invitation_id: int,
        user_id: int,
        accept: bool
    ) -> ChallengeInvitation:
        return await self.invitations.respond_to_invitation(invitation_id, user_id, accept)

    async def get_user_invitations(self, user_id: int) -> List[ChallengeInvitation]:
        return await self.invitations.get_user_invitations(user_id)

    # ==================== LIFECYCLE ====================

    async def open_challenge(self, challenge_id: int) -> Challenge:
        return await self.lifecycle.open_challenge(challenge_id)

    async def activate_challenge(self, challenge_id: int) -> Challenge:
        return await self.lifecycle.activate_challenge(challenge_id)

    async def open_challenge_slots(
        self,
        challenge_id: int,
        duration_hours: int = 24
    ) -> Challenge:
        return await self.lifecycle.open_challenge_slots(challenge_id, duration_hours)

    async def claim_challenge_slot(
        self,
        challenge_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        return await self.lifecycle.claim_challenge_slot(challenge_id, user_id)

    async def close_submissions(self, challenge_id: int) -> Challenge:
        return await self.lifecycle.close_submissions(challenge_id)

    async def complete_challenge(self, challenge_id: int) -> Challenge:
        return await self.lifecycle.complete_challenge(challenge_id)

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
        return await self.entries.create_entry(
            challenge_id, user_id, title, description,
            file_urls, external_links, thumbnail_url
        )

    async def submit_entry(self, challenge_id: int, user_id: int) -> ChallengeEntry:
        entry = await self.entries.submit_entry(challenge_id, user_id)

        # Check if voting should start for 1v1
        challenge = await self.queries.get_challenge(challenge_id)
        if challenge and challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            if await self.entries.check_both_submitted(challenge):
                await self.lifecycle.start_voting_for_1v1(challenge)

        return entry

    async def get_entries(
        self,
        challenge_id: int,
        current_user_id: Optional[int] = None
    ) -> List[ChallengeEntry]:
        return await self.entries.get_entries(challenge_id, current_user_id)

    async def join_category_challenge(
        self,
        challenge_id: int,
        user_id: int
    ) -> ChallengeParticipant:
        return await self.entries.join_category_challenge(challenge_id, user_id)

    # ==================== VOTING ====================

    async def cast_vote(
        self,
        challenge_id: int,
        voter_id: int,
        entry_id: int
    ) -> ChallengeVote:
        return await self.entries.cast_vote(challenge_id, voter_id, entry_id)

    async def get_vote_stats(self, challenge_id: int) -> Dict[str, Any]:
        return await self.entries.get_vote_stats(challenge_id)

    # ==================== QUERIES ====================

    async def get_challenge(self, challenge_id: int) -> Optional[Challenge]:
        return await self.queries.get_challenge(challenge_id)

    async def get_challenges(
        self,
        status: Optional[ChallengeStatus] = None,
        challenge_type: Optional[ChallengeType] = None,
        content_type: Optional[ContentType] = None,
        is_featured: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Challenge], int]:
        return await self.queries.get_challenges(
            status, challenge_type, content_type, is_featured, skip, limit
        )

    async def get_active_challenges(
        self,
        content_type: Optional[ContentType] = None,
        limit: int = 20
    ) -> List[Challenge]:
        return await self.queries.get_active_challenges(content_type, limit)

    async def get_open_slot_challenges(
        self,
        content_type: Optional[ContentType] = None,
        limit: int = 20
    ) -> List[Challenge]:
        return await self.queries.get_open_slot_challenges(content_type, limit)

    async def get_user_challenge_stats(self, user_id: int) -> Dict[str, Any]:
        return await self.queries.get_user_challenge_stats(user_id)

    async def get_leaderboard(self, limit: int = 50) -> List[Dict[str, Any]]:
        return await self.queries.get_leaderboard(limit)


# Alias for backward compatibility
ChallengeService = ChallengeFacade
