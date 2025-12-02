"""Challenge Service for managing platform-curated creative competitions"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import func, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, UserTier
from app.models.review_request import ContentType
from app.models.challenge import Challenge, ChallengeStatus, ChallengeType
from app.models.challenge_entry import ChallengeEntry
from app.models.challenge_vote import ChallengeVote
from app.models.challenge_invitation import ChallengeInvitation, InvitationStatus
from app.models.challenge_participant import ChallengeParticipant
from app.models.challenge_prompt import ChallengePrompt
from app.models.karma_transaction import KarmaAction
from app.models.notification import NotificationType, NotificationPriority, EntityType
from app.services.karma_service import KarmaService
from app.services.notification_service import NotificationService


class ChallengeService:
    """
    Service for managing platform-curated creative challenges.

    Two challenge types:
    1. ONE_ON_ONE: Platform invites two creators (blind invitations)
    2. CATEGORY: Open competition where anyone can enter

    Features:
    - Admin-only challenge creation
    - Invitation system for 1v1 challenges
    - Open enrollment for category challenges
    - Entry submission with blind mode (1v1)
    - Community voting
    - Configurable winners (category)
    - Karma rewards
    """

    # Karma rewards for challenge outcomes
    KARMA_VALUES = {
        # 1v1 challenges
        "win_base": 50,
        "win_margin_bonus_max": 50,
        "loss_participation": 5,
        "draw": 25,
        # Category challenges
        "category_1st": 100,
        "category_2nd": 50,
        "category_3rd": 25,
        "category_participation": 5,
        # General
        "vote_cast": 2,
        "win_streak_3": 50,
        "win_streak_5": 100,
    }

    # Timing defaults (hours)
    DEFAULT_SUBMISSION_HOURS = 72
    DEFAULT_VOTING_HOURS = 48
    INVITATION_EXPIRY_HOURS = 48

    # Draw threshold (percentage)
    DRAW_THRESHOLD = 5.0

    def __init__(self, db: AsyncSession):
        self.db = db
        self.karma_service = KarmaService(db)
        self.notification_service = NotificationService(db)

    # ==================== PROMPTS ====================

    async def get_prompts(
        self,
        content_type: Optional[ContentType] = None,
        is_active: bool = True,
        limit: int = 50
    ) -> List[ChallengePrompt]:
        """Get available challenge prompts."""
        stmt = select(ChallengePrompt).where(ChallengePrompt.is_active == is_active)

        if content_type:
            stmt = stmt.where(ChallengePrompt.content_type == content_type)

        stmt = stmt.order_by(ChallengePrompt.times_used.desc()).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_prompt(self, prompt_id: int) -> Optional[ChallengePrompt]:
        """Get a specific prompt by ID."""
        return await self.db.get(ChallengePrompt, prompt_id)

    async def create_prompt(
        self,
        title: str,
        description: str,
        content_type: ContentType,
        difficulty: str = "intermediate",
        is_active: bool = True
    ) -> ChallengePrompt:
        """Create a new challenge prompt (admin only)."""
        from app.models.challenge_prompt import PromptDifficulty

        prompt = ChallengePrompt(
            title=title,
            description=description,
            content_type=content_type,
            difficulty=PromptDifficulty(difficulty) if isinstance(difficulty, str) else difficulty,
            is_active=is_active,
            times_used=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.db.add(prompt)
        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def update_prompt(self, prompt_id: int, **kwargs) -> Optional[ChallengePrompt]:
        """Update an existing challenge prompt (admin only)."""
        prompt = await self.get_prompt(prompt_id)
        if not prompt:
            return None

        for key, value in kwargs.items():
            if hasattr(prompt, key) and value is not None:
                setattr(prompt, key, value)

        prompt.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def delete_prompt(self, prompt_id: int) -> bool:
        """Soft-delete a challenge prompt by setting is_active=False."""
        prompt = await self.get_prompt(prompt_id)
        if not prompt:
            return False

        prompt.is_active = False
        prompt.updated_at = datetime.utcnow()
        await self.db.commit()

        return True

    # ==================== CHALLENGE CREATION (ADMIN) ====================

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
        prize_description: Optional[str] = None
    ) -> Challenge:
        """
        Create a new challenge (admin only).

        For ONE_ON_ONE: Challenge starts in DRAFT, then moves to INVITING after invites sent.
        For CATEGORY: Challenge starts in DRAFT, admin opens it when ready.
        """
        # Validate prompt if provided
        if prompt_id:
            prompt = await self.get_prompt(prompt_id)
            if not prompt:
                raise ValueError("Invalid prompt ID")
            if prompt.content_type != content_type:
                raise ValueError("Prompt content type doesn't match challenge content type")

        challenge = Challenge(
            title=title,
            description=description,
            challenge_type=challenge_type,
            content_type=content_type,
            prompt_id=prompt_id,
            status=ChallengeStatus.DRAFT,
            submission_hours=submission_hours,
            voting_hours=voting_hours,
            max_winners=max_winners if challenge_type == ChallengeType.CATEGORY else 1,
            is_featured=is_featured,
            banner_image_url=banner_image_url,
            prize_description=prize_description,
            created_by=admin_id,
            created_at=datetime.utcnow()
        )

        self.db.add(challenge)
        await self.db.flush()

        # Increment prompt usage if used
        if prompt_id:
            prompt = await self.get_prompt(prompt_id)
            if prompt:
                prompt.times_used += 1

        await self.db.commit()
        await self.db.refresh(challenge)

        return challenge

    async def update_challenge(self, challenge_id: int, **kwargs) -> Optional[Challenge]:
        """Update a challenge (admin only). Only allowed in DRAFT status."""
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            return None

        if challenge.status != ChallengeStatus.DRAFT:
            raise ValueError("Can only update challenges in DRAFT status")

        for key, value in kwargs.items():
            if hasattr(challenge, key) and value is not None:
                setattr(challenge, key, value)

        await self.db.commit()
        await self.db.refresh(challenge)

        return challenge

    # ==================== 1v1 INVITATIONS ====================

    async def invite_creator(
        self,
        challenge_id: int,
        user_id: int,
        slot: int,
        message: Optional[str] = None
    ) -> ChallengeInvitation:
        """
        Invite a creator to a 1v1 challenge (admin only).

        slot: 1 or 2 (which participant position)
        """
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if challenge.challenge_type != ChallengeType.ONE_ON_ONE:
            raise ValueError("Can only invite creators to 1v1 challenges")

        if challenge.status not in [ChallengeStatus.DRAFT, ChallengeStatus.INVITING]:
            raise ValueError("Challenge is not accepting invitations")

        if slot not in [1, 2]:
            raise ValueError("Slot must be 1 or 2")

        # Check if slot already has an active invitation
        existing = await self._get_active_invitation_for_slot(challenge_id, slot)
        if existing:
            raise ValueError(f"Slot {slot} already has an active invitation")

        # Check if user already invited to this challenge
        existing_user = await self._get_user_invitation(challenge_id, user_id)
        if existing_user and existing_user.status == InvitationStatus.PENDING:
            raise ValueError("User already has a pending invitation to this challenge")

        # Create invitation
        invitation = ChallengeInvitation(
            challenge_id=challenge_id,
            user_id=user_id,
            slot=slot,
            status=InvitationStatus.PENDING,
            message=message,
            expires_at=datetime.utcnow() + timedelta(hours=self.INVITATION_EXPIRY_HOURS),
            created_at=datetime.utcnow()
        )

        self.db.add(invitation)

        # Update challenge status to INVITING if in DRAFT
        if challenge.status == ChallengeStatus.DRAFT:
            challenge.status = ChallengeStatus.INVITING

        await self.db.commit()
        await self.db.refresh(invitation)

        # Notify the invited user
        await self._notify_invitation_received(challenge, user_id, message)

        return invitation

    async def replace_invitation(
        self,
        challenge_id: int,
        slot: int,
        new_user_id: int,
        message: Optional[str] = None
    ) -> ChallengeInvitation:
        """
        Replace a declined/expired invitation with a new one (admin only).
        """
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if challenge.status != ChallengeStatus.INVITING:
            raise ValueError("Challenge is not in inviting status")

        # Mark any existing invitation for this slot as REPLACED
        existing = await self._get_invitation_for_slot(challenge_id, slot)
        if existing:
            if existing.status == InvitationStatus.PENDING:
                raise ValueError("Cannot replace a pending invitation")
            existing.status = InvitationStatus.REPLACED

        # Create new invitation
        return await self.invite_creator(challenge_id, new_user_id, slot, message)

    async def respond_to_invitation(
        self,
        invitation_id: int,
        user_id: int,
        accept: bool
    ) -> ChallengeInvitation:
        """
        Respond to a challenge invitation (accept or decline).
        """
        invitation = await self.db.get(ChallengeInvitation, invitation_id)
        if not invitation:
            raise ValueError("Invitation not found")

        if invitation.user_id != user_id:
            raise ValueError("This invitation is not for you")

        if invitation.status != InvitationStatus.PENDING:
            raise ValueError("Invitation is no longer pending")

        if invitation.is_expired:
            invitation.status = InvitationStatus.EXPIRED
            await self.db.commit()
            raise ValueError("Invitation has expired")

        challenge = await self._get_challenge_with_relations(invitation.challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if accept:
            invitation.accept()

            # Set participant on challenge
            if invitation.slot == 1:
                challenge.participant1_id = user_id
            else:
                challenge.participant2_id = user_id

            # Check if both participants have accepted
            await self._check_and_start_challenge(challenge)
        else:
            invitation.decline()
            # Notify admin that invitation was declined
            await self._notify_invitation_declined(challenge, user_id)

        await self.db.commit()
        await self.db.refresh(invitation)

        return invitation

    async def get_user_invitations(self, user_id: int) -> List[ChallengeInvitation]:
        """Get pending invitations for a user."""
        stmt = (
            select(ChallengeInvitation)
            .where(
                ChallengeInvitation.user_id == user_id,
                ChallengeInvitation.status == InvitationStatus.PENDING
            )
            .options(selectinload(ChallengeInvitation.challenge))
            .order_by(ChallengeInvitation.created_at.desc())
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ==================== CATEGORY CHALLENGES ====================

    async def open_challenge(self, challenge_id: int) -> Challenge:
        """
        Open a category challenge for entries (admin only).
        """
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if challenge.challenge_type != ChallengeType.CATEGORY:
            raise ValueError("Only category challenges can be opened")

        if challenge.status != ChallengeStatus.DRAFT:
            raise ValueError("Challenge must be in DRAFT status to open")

        now = datetime.utcnow()
        challenge.status = ChallengeStatus.OPEN
        challenge.started_at = now
        challenge.submission_deadline = now + timedelta(hours=challenge.submission_hours)

        await self.db.commit()
        await self.db.refresh(challenge)

        return challenge

    async def join_category_challenge(
        self,
        challenge_id: int,
        user_id: int
    ) -> ChallengeParticipant:
        """
        Join a category challenge (user action).
        """
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if challenge.challenge_type != ChallengeType.CATEGORY:
            raise ValueError("This is not a category challenge")

        if challenge.status != ChallengeStatus.OPEN:
            raise ValueError("Challenge is not open for entries")

        # Check if already joined
        existing = await self._get_participant(challenge_id, user_id)
        if existing:
            raise ValueError("Already joined this challenge")

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

    async def close_submissions(self, challenge_id: int) -> Challenge:
        """
        Close submissions and start voting (admin only or automatic).
        """
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if challenge.status not in [ChallengeStatus.OPEN, ChallengeStatus.ACTIVE]:
            raise ValueError("Challenge submissions cannot be closed")

        now = datetime.utcnow()
        challenge.status = ChallengeStatus.VOTING
        challenge.voting_started_at = now
        challenge.voting_deadline = now + timedelta(hours=challenge.voting_hours)

        await self.db.commit()
        await self.db.refresh(challenge)

        # Notify participants
        await self._notify_voting_started(challenge)

        return challenge

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
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        # Verify user is a participant
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            if user_id not in [challenge.participant1_id, challenge.participant2_id]:
                raise ValueError("You are not a participant in this challenge")
            if challenge.status != ChallengeStatus.ACTIVE:
                raise ValueError("Challenge is not accepting entries")
        else:
            participant = await self._get_participant(challenge_id, user_id)
            if not participant:
                raise ValueError("You have not joined this challenge")
            if challenge.status not in [ChallengeStatus.OPEN, ChallengeStatus.ACTIVE]:
                raise ValueError("Challenge is not accepting entries")

        # Check if entry already exists
        existing_entry = await self._get_user_entry(challenge_id, user_id)
        if existing_entry and existing_entry.submitted_at:
            raise ValueError("Entry already submitted")

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
        """
        Submit an entry (mark as final).

        For 1v1: When both entries are submitted, voting begins.
        For Category: Entry is visible immediately.
        """
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        entry = await self._get_user_entry(challenge_id, user_id)
        if not entry:
            raise ValueError("No entry found. Create an entry first.")

        if entry.submitted_at:
            raise ValueError("Entry already submitted")

        if not entry.has_content:
            raise ValueError("Entry must have at least one file or link")

        # Check deadline
        if challenge.submission_deadline and datetime.utcnow() > challenge.submission_deadline:
            raise ValueError("Submission deadline has passed")

        entry.submitted_at = datetime.utcnow()
        await self.db.commit()

        # For 1v1, check if both entries are submitted
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            await self._check_and_start_voting_1v1(challenge)

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
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        entries = challenge.entries

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
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if challenge.status != ChallengeStatus.VOTING:
            raise ValueError("Challenge is not in voting phase")

        if challenge.voting_deadline and datetime.utcnow() > challenge.voting_deadline:
            raise ValueError("Voting deadline has passed")

        # Check if voter is a participant
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            if voter_id in [challenge.participant1_id, challenge.participant2_id]:
                raise ValueError("Cannot vote on your own challenge")
        else:
            participant = await self._get_participant(challenge_id, voter_id)
            if participant:
                raise ValueError("Cannot vote on a challenge you're participating in")

        # Check if already voted
        existing_vote = await self._get_user_vote(challenge_id, voter_id)
        if existing_vote:
            raise ValueError("Already voted in this challenge")

        # Validate entry belongs to this challenge
        entry = await self.db.get(ChallengeEntry, entry_id)
        if not entry or entry.challenge_id != challenge_id:
            raise ValueError("Invalid entry")

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
            custom_points=self.KARMA_VALUES["vote_cast"]
        )

        return vote

    async def get_vote_stats(self, challenge_id: int) -> Dict[str, Any]:
        """Get vote statistics for a challenge (only after voting ends)."""
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

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

    # ==================== CHALLENGE COMPLETION ====================

    async def complete_challenge(self, challenge_id: int) -> Challenge:
        """
        Complete a challenge and determine winner(s).

        Called when voting deadline passes or manually by admin.
        """
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if challenge.status != ChallengeStatus.VOTING:
            raise ValueError("Challenge is not in voting phase")

        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            await self._complete_1v1_challenge(challenge)
        else:
            await self._complete_category_challenge(challenge)

        challenge.completed_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(challenge)

        # Notify participants
        await self._notify_challenge_completed(challenge)

        return challenge

    async def _complete_1v1_challenge(self, challenge: Challenge) -> None:
        """Complete a 1v1 challenge."""
        total = challenge.total_votes

        if total == 0:
            challenge.status = ChallengeStatus.CANCELLED
            return

        vote_margin = abs(challenge.participant1_votes - challenge.participant2_votes)
        margin_percentage = (vote_margin / total) * 100

        if margin_percentage <= self.DRAW_THRESHOLD:
            challenge.status = ChallengeStatus.DRAW
            await self._award_1v1_draw(challenge)
        else:
            challenge.status = ChallengeStatus.COMPLETED
            if challenge.participant1_votes > challenge.participant2_votes:
                challenge.winner_id = challenge.participant1_id
                await self._award_1v1_winner(
                    challenge,
                    challenge.participant1_id,
                    challenge.participant2_id,
                    margin_percentage
                )
            else:
                challenge.winner_id = challenge.participant2_id
                await self._award_1v1_winner(
                    challenge,
                    challenge.participant2_id,
                    challenge.participant1_id,
                    margin_percentage
                )

    async def _complete_category_challenge(self, challenge: Challenge) -> None:
        """Complete a category challenge with multiple winners."""
        challenge.status = ChallengeStatus.COMPLETED

        # Sort entries by votes
        entries_sorted = sorted(challenge.entries, key=lambda e: e.vote_count, reverse=True)

        # Award placements
        karma_rewards = [
            self.KARMA_VALUES["category_1st"],
            self.KARMA_VALUES["category_2nd"],
            self.KARMA_VALUES["category_3rd"],
        ]

        for i, entry in enumerate(entries_sorted[:challenge.max_winners]):
            participant = await self._get_participant(challenge.id, entry.user_id)
            if participant:
                placement = i + 1
                karma = karma_rewards[i] if i < len(karma_rewards) else self.KARMA_VALUES["category_participation"]
                participant.placement = placement
                participant.karma_earned = karma

                # Set winner_id to first place
                if i == 0:
                    challenge.winner_id = entry.user_id
                    challenge.winner_karma_reward = karma

                await self.karma_service.award_karma(
                    user_id=entry.user_id,
                    action=KarmaAction.CHALLENGE_WIN,
                    reason=f"Placed #{placement} in challenge: {challenge.title}",
                    custom_points=karma
                )

                # Update user stats for 1st place
                if placement == 1:
                    await self._update_user_challenge_stats(entry.user_id, "win")

        # Award participation karma to non-winners
        winners = {e.user_id for e in entries_sorted[:challenge.max_winners]}
        for entry in entries_sorted[challenge.max_winners:]:
            if entry.user_id not in winners:
                await self.karma_service.award_karma(
                    user_id=entry.user_id,
                    action=KarmaAction.CHALLENGE_LOSS,
                    reason=f"Participated in challenge: {challenge.title}",
                    custom_points=self.KARMA_VALUES["category_participation"]
                )

    async def _award_1v1_winner(
        self,
        challenge: Challenge,
        winner_id: int,
        loser_id: int,
        margin_percentage: float
    ) -> None:
        """Award karma to 1v1 winner and loser."""
        margin_bonus = int((margin_percentage / 100) * self.KARMA_VALUES["win_margin_bonus_max"])
        winner_karma = self.KARMA_VALUES["win_base"] + margin_bonus
        challenge.winner_karma_reward = winner_karma

        await self.karma_service.award_karma(
            user_id=winner_id,
            action=KarmaAction.CHALLENGE_WIN,
            reason=f"Won challenge: {challenge.title}",
            custom_points=winner_karma
        )

        await self.karma_service.award_karma(
            user_id=loser_id,
            action=KarmaAction.CHALLENGE_LOSS,
            reason=f"Participated in challenge: {challenge.title}",
            custom_points=self.KARMA_VALUES["loss_participation"]
        )

        await self._update_user_challenge_stats(winner_id, "win")
        await self._update_user_challenge_stats(loser_id, "loss")

    async def _award_1v1_draw(self, challenge: Challenge) -> None:
        """Award karma for a 1v1 draw."""
        draw_karma = self.KARMA_VALUES["draw"]

        for user_id in [challenge.participant1_id, challenge.participant2_id]:
            if user_id:
                await self.karma_service.award_karma(
                    user_id=user_id,
                    action=KarmaAction.CHALLENGE_DRAW,
                    reason=f"Draw in challenge: {challenge.title}",
                    custom_points=draw_karma
                )
                await self._update_user_challenge_stats(user_id, "draw")

    async def _update_user_challenge_stats(self, user_id: int, result: str) -> None:
        """Update user's challenge statistics."""
        user = await self.db.get(User, user_id)
        if not user:
            return

        if result == "win":
            user.challenges_won += 1
            user.challenge_win_streak += 1
            if user.challenge_win_streak > user.best_challenge_streak:
                user.best_challenge_streak = user.challenge_win_streak

            # Check for streak bonuses
            if user.challenge_win_streak == 3:
                await self.karma_service.award_karma(
                    user_id=user_id,
                    action=KarmaAction.CHALLENGE_WIN_STREAK_3,
                    reason="3-challenge win streak!",
                    custom_points=self.KARMA_VALUES["win_streak_3"]
                )
            elif user.challenge_win_streak == 5:
                await self.karma_service.award_karma(
                    user_id=user_id,
                    action=KarmaAction.CHALLENGE_WIN_STREAK_5,
                    reason="5-challenge win streak!",
                    custom_points=self.KARMA_VALUES["win_streak_5"]
                )

        elif result == "loss":
            user.challenges_lost += 1
            user.challenge_win_streak = 0

        elif result == "draw":
            user.challenges_drawn += 1

        await self.db.commit()

    # ==================== QUERIES ====================

    async def get_challenge(self, challenge_id: int) -> Optional[Challenge]:
        """Get a challenge by ID with all relations."""
        return await self._get_challenge_with_relations(challenge_id)

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
                "user_name": user.full_name or user.email.split('@')[0],
                "user_avatar": user.avatar_url,
                "user_tier": user.user_tier.value if user.user_tier else None,
                "challenges_won": user.challenges_won,
                "win_rate": round(win_rate, 1),
                "best_streak": user.best_challenge_streak
            })

        return leaderboard

    # ==================== ADMIN ACTIONS ====================

    async def activate_challenge(self, challenge_id: int) -> Challenge:
        """
        Activate a 1v1 challenge (admin action after both creators accepted).
        """
        challenge = await self._get_challenge_with_relations(challenge_id)
        if not challenge:
            raise ValueError("Challenge not found")

        if challenge.challenge_type != ChallengeType.ONE_ON_ONE:
            raise ValueError("Use open_challenge for category challenges")

        if challenge.status != ChallengeStatus.INVITING:
            raise ValueError("Challenge must be in INVITING status")

        # Verify both participants have accepted
        accepted_count = sum(
            1 for inv in challenge.invitations
            if inv.status == InvitationStatus.ACCEPTED
        )
        if accepted_count < 2:
            raise ValueError("Both participants must accept before activating")

        now = datetime.utcnow()
        challenge.status = ChallengeStatus.ACTIVE
        challenge.started_at = now
        challenge.submission_deadline = now + timedelta(hours=challenge.submission_hours)

        await self.db.commit()
        await self.db.refresh(challenge)

        # Notify participants
        await self._notify_challenge_started(challenge)

        return challenge

    # ==================== PRIVATE HELPERS ====================

    async def _get_challenge_with_relations(self, challenge_id: int) -> Optional[Challenge]:
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

    async def _get_user_entry(self, challenge_id: int, user_id: int) -> Optional[ChallengeEntry]:
        """Get a user's entry for a challenge."""
        stmt = select(ChallengeEntry).where(
            ChallengeEntry.challenge_id == challenge_id,
            ChallengeEntry.user_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_user_vote(self, challenge_id: int, user_id: int) -> Optional[ChallengeVote]:
        """Check if user has voted in a challenge."""
        stmt = select(ChallengeVote).where(
            ChallengeVote.challenge_id == challenge_id,
            ChallengeVote.voter_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_participant(self, challenge_id: int, user_id: int) -> Optional[ChallengeParticipant]:
        """Get a user's participation record."""
        stmt = select(ChallengeParticipant).where(
            ChallengeParticipant.challenge_id == challenge_id,
            ChallengeParticipant.user_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_user_invitation(
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

    async def _get_active_invitation_for_slot(
        self,
        challenge_id: int,
        slot: int
    ) -> Optional[ChallengeInvitation]:
        """Get active (pending/accepted) invitation for a slot."""
        stmt = select(ChallengeInvitation).where(
            ChallengeInvitation.challenge_id == challenge_id,
            ChallengeInvitation.slot == slot,
            ChallengeInvitation.status.in_([InvitationStatus.PENDING, InvitationStatus.ACCEPTED])
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_invitation_for_slot(
        self,
        challenge_id: int,
        slot: int
    ) -> Optional[ChallengeInvitation]:
        """Get latest invitation for a slot."""
        stmt = (
            select(ChallengeInvitation)
            .where(
                ChallengeInvitation.challenge_id == challenge_id,
                ChallengeInvitation.slot == slot
            )
            .order_by(ChallengeInvitation.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _check_and_start_challenge(self, challenge: Challenge) -> None:
        """Check if both 1v1 participants accepted and auto-activate if so."""
        if challenge.status != ChallengeStatus.INVITING:
            return

        accepted_count = sum(
            1 for inv in challenge.invitations
            if inv.status == InvitationStatus.ACCEPTED
        )

        # Don't auto-activate - admin must explicitly activate
        # This is just for tracking
        if accepted_count >= 2:
            # Both accepted, ready for admin activation
            pass

    async def _check_and_start_voting_1v1(self, challenge: Challenge) -> None:
        """Check if both 1v1 entries submitted and start voting phase."""
        if challenge.status != ChallengeStatus.ACTIVE:
            return

        submitted_count = sum(
            1 for entry in challenge.entries
            if entry.submitted_at is not None
        )

        if submitted_count >= 2:
            now = datetime.utcnow()
            challenge.status = ChallengeStatus.VOTING
            challenge.voting_started_at = now
            challenge.voting_deadline = now + timedelta(hours=challenge.voting_hours)
            await self.db.commit()

            await self._notify_voting_started(challenge)

    # ==================== NOTIFICATION HELPERS ====================

    async def _notify_invitation_received(
        self,
        challenge: Challenge,
        user_id: int,
        message: Optional[str]
    ) -> None:
        """Notify user that they've been invited to a challenge."""
        await self.notification_service.create_notification(
            user_id=user_id,
            notification_type=NotificationType.CHALLENGE_INVITATION_RECEIVED,
            title="You've been invited to a challenge!",
            message=message or f"You've been selected to participate in: {challenge.title}",
            priority=NotificationPriority.HIGH,
            entity_type=EntityType.CHALLENGE_INVITATION,
            entity_id=challenge.id,
            action_url=f"/challenges/{challenge.id}",
            action_label="View Invitation",
            data={
                "challenge_id": challenge.id,
                "challenge_type": challenge.challenge_type.value,
                "content_type": challenge.content_type.value,
            }
        )

    async def _notify_invitation_declined(
        self,
        challenge: Challenge,
        decliner_id: int
    ) -> None:
        """Notify admin that an invitation was declined."""
        decliner = await self.db.get(User, decliner_id)
        if not decliner:
            return

        decliner_name = decliner.full_name or decliner.email.split('@')[0]

        await self.notification_service.create_notification(
            user_id=challenge.created_by,
            notification_type=NotificationType.CHALLENGE_INVITATION_DECLINED,
            title="Challenge invitation declined",
            message=f"{decliner_name} declined the invitation for '{challenge.title}'.",
            priority=NotificationPriority.MEDIUM,
            entity_type=EntityType.CHALLENGE,
            entity_id=challenge.id,
            action_url=f"/challenges/admin/{challenge.id}",
            action_label="Replace Invitee",
            data={
                "challenge_id": challenge.id,
                "decliner_id": decliner_id,
                "decliner_name": decliner_name,
            }
        )

    async def _notify_challenge_started(self, challenge: Challenge) -> None:
        """Notify participants that the challenge has started."""
        for user_id in [challenge.participant1_id, challenge.participant2_id]:
            if user_id:
                await self.notification_service.create_notification(
                    user_id=user_id,
                    notification_type=NotificationType.CHALLENGE_STARTED,
                    title="Challenge has started!",
                    message=f"Your challenge '{challenge.title}' has begun. Submit your entry before the deadline!",
                    priority=NotificationPriority.HIGH,
                    entity_type=EntityType.CHALLENGE,
                    entity_id=challenge.id,
                    action_url=f"/challenges/{challenge.id}",
                    action_label="Submit Entry",
                    data={
                        "challenge_id": challenge.id,
                        "submission_deadline": challenge.submission_deadline.isoformat() if challenge.submission_deadline else None,
                    }
                )

    async def _notify_voting_started(self, challenge: Challenge) -> None:
        """Notify participants that voting has begun."""
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            user_ids = [challenge.participant1_id, challenge.participant2_id]
        else:
            user_ids = [p.user_id for p in challenge.participants]

        for user_id in user_ids:
            if user_id:
                await self.notification_service.create_notification(
                    user_id=user_id,
                    notification_type=NotificationType.CHALLENGE_VOTING_STARTED,
                    title="Voting has begun!",
                    message=f"Voting is now open for '{challenge.title}'. Community voting is now open!",
                    priority=NotificationPriority.MEDIUM,
                    entity_type=EntityType.CHALLENGE,
                    entity_id=challenge.id,
                    action_url=f"/challenges/{challenge.id}",
                    action_label="View Challenge",
                    data={
                        "challenge_id": challenge.id,
                        "voting_deadline": challenge.voting_deadline.isoformat() if challenge.voting_deadline else None,
                    }
                )

    async def _notify_challenge_completed(self, challenge: Challenge) -> None:
        """Notify participants of challenge results."""
        if challenge.challenge_type == ChallengeType.ONE_ON_ONE:
            await self._notify_1v1_completed(challenge)
        else:
            await self._notify_category_completed(challenge)

    async def _notify_1v1_completed(self, challenge: Challenge) -> None:
        """Notify 1v1 challenge results."""
        if challenge.status == ChallengeStatus.DRAW:
            for user_id in [challenge.participant1_id, challenge.participant2_id]:
                if user_id:
                    await self.notification_service.create_notification(
                        user_id=user_id,
                        notification_type=NotificationType.CHALLENGE_DRAW,
                        title="Challenge ended in a draw!",
                        message=f"The challenge '{challenge.title}' has ended in a draw. Both participants receive karma!",
                        priority=NotificationPriority.HIGH,
                        entity_type=EntityType.CHALLENGE,
                        entity_id=challenge.id,
                        action_url=f"/challenges/{challenge.id}",
                        action_label="View Results",
                        data={"challenge_id": challenge.id, "total_votes": challenge.total_votes}
                    )
        elif challenge.winner_id:
            loser_id = (
                challenge.participant1_id
                if challenge.winner_id == challenge.participant2_id
                else challenge.participant2_id
            )

            winner = await self.db.get(User, challenge.winner_id)
            loser = await self.db.get(User, loser_id)

            if winner and loser:
                winner_name = winner.full_name or winner.email.split('@')[0]
                loser_name = loser.full_name or loser.email.split('@')[0]

                await self.notification_service.create_notification(
                    user_id=challenge.winner_id,
                    notification_type=NotificationType.CHALLENGE_WON,
                    title="You won the challenge!",
                    message=f"Congratulations! You won '{challenge.title}' against {loser_name}!",
                    priority=NotificationPriority.HIGH,
                    entity_type=EntityType.CHALLENGE,
                    entity_id=challenge.id,
                    action_url=f"/challenges/{challenge.id}",
                    action_label="View Results",
                    data={
                        "challenge_id": challenge.id,
                        "karma_reward": challenge.winner_karma_reward,
                        "total_votes": challenge.total_votes,
                    }
                )

                await self.notification_service.create_notification(
                    user_id=loser_id,
                    notification_type=NotificationType.CHALLENGE_LOST,
                    title="Challenge completed",
                    message=f"The challenge '{challenge.title}' has ended. {winner_name} won this round!",
                    priority=NotificationPriority.MEDIUM,
                    entity_type=EntityType.CHALLENGE,
                    entity_id=challenge.id,
                    action_url=f"/challenges/{challenge.id}",
                    action_label="View Results",
                    data={"challenge_id": challenge.id, "total_votes": challenge.total_votes}
                )

    async def _notify_category_completed(self, challenge: Challenge) -> None:
        """Notify category challenge results."""
        # Get top 3 for announcement
        entries_sorted = sorted(challenge.entries, key=lambda e: e.vote_count, reverse=True)
        winners = entries_sorted[:min(challenge.max_winners, 3)]

        for participant in challenge.participants:
            user_placement = next(
                (p.placement for p in challenge.participants if p.user_id == participant.user_id),
                None
            )

            if user_placement and user_placement <= challenge.max_winners:
                await self.notification_service.create_notification(
                    user_id=participant.user_id,
                    notification_type=NotificationType.CHALLENGE_WON,
                    title=f"You placed #{user_placement} in the challenge!",
                    message=f"Congratulations! You placed #{user_placement} in '{challenge.title}'!",
                    priority=NotificationPriority.HIGH,
                    entity_type=EntityType.CHALLENGE,
                    entity_id=challenge.id,
                    action_url=f"/challenges/{challenge.id}",
                    action_label="View Results",
                    data={
                        "challenge_id": challenge.id,
                        "placement": user_placement,
                        "karma_earned": participant.karma_earned,
                    }
                )
            else:
                await self.notification_service.create_notification(
                    user_id=participant.user_id,
                    notification_type=NotificationType.CHALLENGE_LOST,
                    title="Challenge completed",
                    message=f"The challenge '{challenge.title}' has ended. Thanks for participating!",
                    priority=NotificationPriority.MEDIUM,
                    entity_type=EntityType.CHALLENGE,
                    entity_id=challenge.id,
                    action_url=f"/challenges/{challenge.id}",
                    action_label="View Results",
                    data={"challenge_id": challenge.id}
                )
