"""
Challenge Lifecycle Service - Handles challenge state transitions and completion.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.review_request import ContentType
from app.models.challenge import Challenge, ChallengeStatus, ChallengeType, InvitationMode
from app.models.challenge_entry import ChallengeEntry
from app.models.challenge_invitation import ChallengeInvitation, InvitationStatus
from app.models.sparks_transaction import SparksAction as KarmaAction
from app.models.notification import NotificationType, NotificationPriority, EntityType
from app.services.gamification.sparks_service import SparksService as KarmaService
from app.services.notifications.core import NotificationService
from app.services.challenges.base import BaseChallengeService
from app.services.challenges.prompt_service import ChallengePromptService
from app.constants.challenges import (
    KARMA_VALUES,
    DEFAULT_SUBMISSION_HOURS,
    DEFAULT_VOTING_HOURS,
    DRAW_THRESHOLD_PERCENT,
)
from app.core.exceptions import (
    NotFoundError,
    InvalidInputError,
    InvalidStateError,
    AlreadyExistsError,
)
from app.utils import get_display_name


class ChallengeLifecycleService(BaseChallengeService):
    """Service for managing challenge lifecycle and state transitions."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.karma_service = KarmaService(db)
        self.notification_service = NotificationService(db)
        self.prompt_service = ChallengePromptService(db)

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
        """Create a new challenge (admin only)."""
        # Validate prompt if provided
        if prompt_id:
            prompt = await self.prompt_service.get_prompt(prompt_id)
            if not prompt:
                raise NotFoundError(resource="Prompt", resource_id=prompt_id)
            if prompt.content_type != content_type:
                raise InvalidInputError(message="Prompt content type doesn't match challenge content type")

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
            invitation_mode=invitation_mode if challenge_type == ChallengeType.ONE_ON_ONE else InvitationMode.ADMIN_CURATED,
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
            await self.prompt_service.increment_usage(prompt_id)

        await self.db.commit()
        await self.db.refresh(challenge)

        return challenge

    async def update_challenge(self, challenge_id: int, **kwargs) -> Optional[Challenge]:
        """Update a challenge (admin only). Only allowed in DRAFT status."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            return None

        if challenge.status != ChallengeStatus.DRAFT:
            raise InvalidStateError(
                message="Can only update challenges in DRAFT status",
                current_state=challenge.status.value,
                allowed_states=["draft"]
            )

        for key, value in kwargs.items():
            if hasattr(challenge, key) and value is not None:
                setattr(challenge, key, value)

        await self.db.commit()
        await self.db.refresh(challenge)

        return challenge

    # ==================== STATE TRANSITIONS ====================

    async def open_challenge(self, challenge_id: int) -> Challenge:
        """Open a category challenge for entries (admin only)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.challenge_type != ChallengeType.CATEGORY:
            raise InvalidInputError(message="Only category challenges can be opened")

        if challenge.status != ChallengeStatus.DRAFT:
            raise InvalidStateError(
                message="Challenge must be in DRAFT status to open",
                current_state=challenge.status.value,
                allowed_states=["draft"]
            )

        now = datetime.utcnow()
        challenge.status = ChallengeStatus.OPEN
        challenge.started_at = now
        challenge.submission_deadline = now + timedelta(hours=challenge.submission_hours)

        await self.db.commit()
        await self.db.refresh(challenge)

        return challenge

    async def activate_challenge(self, challenge_id: int) -> Challenge:
        """Activate a 1v1 challenge (admin action after both creators accepted)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.challenge_type != ChallengeType.ONE_ON_ONE:
            raise InvalidInputError(message="Use open_challenge for category challenges")

        if challenge.status != ChallengeStatus.INVITING:
            raise InvalidStateError(
                message="Challenge must be in INVITING status",
                current_state=challenge.status.value,
                allowed_states=["inviting"]
            )

        # Verify both participants have accepted
        accepted_count = sum(
            1 for inv in challenge.invitations
            if inv.status == InvitationStatus.ACCEPTED
        )
        if accepted_count < 2:
            raise InvalidStateError(message="Both participants must accept before activating")

        now = datetime.utcnow()
        challenge.status = ChallengeStatus.ACTIVE
        challenge.started_at = now
        challenge.submission_deadline = now + timedelta(hours=challenge.submission_hours)

        await self.db.commit()
        await self.db.refresh(challenge)

        # Notify participants
        await self._notify_challenge_started(challenge)

        return challenge

    async def open_challenge_slots(
        self,
        challenge_id: int,
        duration_hours: int = 24
    ) -> Challenge:
        """Open slots for a 1v1 challenge (admin action)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.challenge_type != ChallengeType.ONE_ON_ONE:
            raise InvalidInputError(message="Only 1v1 challenges support open slots")

        if challenge.invitation_mode != InvitationMode.OPEN_SLOTS:
            raise InvalidInputError(message="Challenge must be configured for open slots mode")

        if challenge.status != ChallengeStatus.DRAFT:
            raise InvalidStateError(
                message="Challenge must be in DRAFT status to open slots",
                current_state=challenge.status.value,
                allowed_states=["draft"]
            )

        now = datetime.utcnow()
        challenge.status = ChallengeStatus.OPEN
        challenge.slots_open_at = now
        challenge.slots_close_at = now + timedelta(hours=duration_hours)

        await self.db.commit()
        await self.db.refresh(challenge)

        return challenge

    async def claim_challenge_slot(
        self,
        challenge_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """Claim a slot in an open slots 1v1 challenge."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.challenge_type != ChallengeType.ONE_ON_ONE:
            raise InvalidInputError(message="Only 1v1 challenges support slot claiming")

        if challenge.invitation_mode != InvitationMode.OPEN_SLOTS:
            raise InvalidInputError(message="Challenge is not in open slots mode")

        if challenge.status != ChallengeStatus.OPEN:
            raise InvalidStateError(
                message="Challenge is not open for slot claiming",
                current_state=challenge.status.value,
                allowed_states=["open"]
            )

        # Check deadline
        if challenge.slots_close_at and datetime.utcnow() > challenge.slots_close_at:
            raise InvalidStateError(message="Slot claiming deadline has passed")

        # Check if user already claimed
        if user_id in [challenge.participant1_id, challenge.participant2_id]:
            raise AlreadyExistsError(resource="Challenge slot claim")

        # Determine which slot to fill
        now = datetime.utcnow()
        slot = 0
        challenge_activated = False

        if challenge.participant1_id is None:
            challenge.participant1_id = user_id
            slot = 1
        elif challenge.participant2_id is None:
            challenge.participant2_id = user_id
            slot = 2

            # Both slots filled - auto-activate!
            challenge.status = ChallengeStatus.ACTIVE
            challenge.started_at = now
            challenge.submission_deadline = now + timedelta(hours=challenge.submission_hours)
            challenge_activated = True
        else:
            raise InvalidStateError(message="All slots are already taken")

        await self.db.commit()
        await self.db.refresh(challenge)

        # Notify if challenge was activated
        if challenge_activated:
            await self._notify_challenge_started(challenge)

        return {
            "challenge_id": challenge.id,
            "user_id": user_id,
            "slot": slot,
            "claimed_at": now,
            "challenge_activated": challenge_activated
        }

    async def close_submissions(self, challenge_id: int) -> Challenge:
        """Close submissions and start voting (admin only or automatic)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.status not in [ChallengeStatus.OPEN, ChallengeStatus.ACTIVE]:
            raise InvalidStateError(
                message="Challenge submissions cannot be closed",
                current_state=challenge.status.value,
                allowed_states=["open", "active"]
            )

        now = datetime.utcnow()
        challenge.status = ChallengeStatus.VOTING
        challenge.voting_started_at = now
        challenge.voting_deadline = now + timedelta(hours=challenge.voting_hours)

        await self.db.commit()
        await self.db.refresh(challenge)

        # Notify participants
        await self._notify_voting_started(challenge)

        return challenge

    async def start_voting_for_1v1(self, challenge: Challenge) -> None:
        """Start voting phase for 1v1 after both entries submitted."""
        if challenge.status != ChallengeStatus.ACTIVE:
            return

        now = datetime.utcnow()
        challenge.status = ChallengeStatus.VOTING
        challenge.voting_started_at = now
        challenge.voting_deadline = now + timedelta(hours=challenge.voting_hours)
        await self.db.commit()

        await self._notify_voting_started(challenge)

    # ==================== CHALLENGE COMPLETION ====================

    async def complete_challenge(self, challenge_id: int) -> Challenge:
        """Complete a challenge and determine winner(s)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.status != ChallengeStatus.VOTING:
            raise InvalidStateError(
                message="Challenge is not in voting phase",
                current_state=challenge.status.value,
                allowed_states=["voting"]
            )

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

        if margin_percentage <= DRAW_THRESHOLD_PERCENT:
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
            KARMA_VALUES["category_1st"],
            KARMA_VALUES["category_2nd"],
            KARMA_VALUES["category_3rd"],
        ]

        for i, entry in enumerate(entries_sorted[:challenge.max_winners]):
            participant = await self.get_participant(challenge.id, entry.user_id)
            if participant:
                placement = i + 1
                karma = karma_rewards[i] if i < len(karma_rewards) else KARMA_VALUES["category_participation"]
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
                    custom_points=KARMA_VALUES["category_participation"]
                )

    async def _award_1v1_winner(
        self,
        challenge: Challenge,
        winner_id: int,
        loser_id: int,
        margin_percentage: float
    ) -> None:
        """Award karma to 1v1 winner and loser."""
        margin_bonus = int((margin_percentage / 100) * KARMA_VALUES["win_margin_bonus_max"])
        winner_karma = KARMA_VALUES["win_base"] + margin_bonus
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
            custom_points=KARMA_VALUES["loss_participation"]
        )

        await self._update_user_challenge_stats(winner_id, "win")
        await self._update_user_challenge_stats(loser_id, "loss")

    async def _award_1v1_draw(self, challenge: Challenge) -> None:
        """Award karma for a 1v1 draw."""
        draw_karma = KARMA_VALUES["draw"]

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
                    custom_points=KARMA_VALUES["win_streak_3"]
                )
            elif user.challenge_win_streak == 5:
                await self.karma_service.award_karma(
                    user_id=user_id,
                    action=KarmaAction.CHALLENGE_WIN_STREAK_5,
                    reason="5-challenge win streak!",
                    custom_points=KARMA_VALUES["win_streak_5"]
                )

        elif result == "loss":
            user.challenges_lost += 1
            user.challenge_win_streak = 0

        elif result == "draw":
            user.challenges_drawn += 1

        await self.db.commit()

    # ==================== NOTIFICATION HELPERS ====================

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
                winner_name = get_display_name(winner)
                loser_name = get_display_name(loser)

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
        for participant in challenge.participants:
            user_placement = participant.placement

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
