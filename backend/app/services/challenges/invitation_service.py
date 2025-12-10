"""
Challenge Invitation Service - Handles 1v1 challenge invitations.
"""

from datetime import datetime, timedelta
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import Challenge, ChallengeStatus, ChallengeType
from app.models.challenge_invitation import ChallengeInvitation, InvitationStatus
from app.models.user import User
from app.models.notification import NotificationType, NotificationPriority, EntityType
from app.services.notification_service import NotificationService
from app.services.challenges.base import BaseChallengeService
from app.constants.challenges import INVITATION_EXPIRY_HOURS
from app.core.exceptions import (
    NotFoundError,
    InvalidInputError,
    InvalidStateError,
    AlreadyExistsError,
    ForbiddenError,
)
from app.utils import get_display_name


class ChallengeInvitationService(BaseChallengeService):
    """Service for managing 1v1 challenge invitations."""

    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.notification_service = NotificationService(db)

    async def invite_creator(
        self,
        challenge_id: int,
        user_id: int,
        slot: int,
        message: Optional[str] = None
    ) -> ChallengeInvitation:
        """
        Invite a creator to a 1v1 challenge (admin only).

        Args:
            challenge_id: Challenge ID
            user_id: User ID to invite
            slot: Which participant position (1 or 2)
            message: Optional invitation message

        Returns:
            Created invitation
        """
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.challenge_type != ChallengeType.ONE_ON_ONE:
            raise InvalidInputError(message="Can only invite creators to 1v1 challenges")

        if challenge.status not in [ChallengeStatus.DRAFT, ChallengeStatus.INVITING]:
            raise InvalidStateError(
                message="Challenge is not accepting invitations",
                current_state=challenge.status.value,
                allowed_states=["draft", "inviting"]
            )

        if slot not in [1, 2]:
            raise InvalidInputError(message="Slot must be 1 or 2")

        # Check if slot already has an active invitation
        existing = await self._get_active_invitation_for_slot(challenge_id, slot)
        if existing:
            raise AlreadyExistsError(resource="Invitation", message=f"Slot {slot} already has an active invitation")

        # Check if user already invited to this challenge
        existing_user = await self.get_user_invitation(challenge_id, user_id)
        if existing_user and existing_user.status == InvitationStatus.PENDING:
            raise AlreadyExistsError(resource="Invitation", message="User already has a pending invitation to this challenge")

        # Create invitation
        invitation = ChallengeInvitation(
            challenge_id=challenge_id,
            user_id=user_id,
            slot=slot,
            status=InvitationStatus.PENDING,
            message=message,
            expires_at=datetime.utcnow() + timedelta(hours=INVITATION_EXPIRY_HOURS),
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
        """Replace a declined/expired invitation with a new one (admin only)."""
        challenge = await self.get_challenge_with_relations(challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=challenge_id)

        if challenge.status != ChallengeStatus.INVITING:
            raise InvalidStateError(
                message="Challenge is not in inviting status",
                current_state=challenge.status.value,
                allowed_states=["inviting"]
            )

        # Mark any existing invitation for this slot as REPLACED
        existing = await self._get_invitation_for_slot(challenge_id, slot)
        if existing:
            if existing.status == InvitationStatus.PENDING:
                raise InvalidStateError(message="Cannot replace a pending invitation")
            existing.status = InvitationStatus.REPLACED

        # Create new invitation
        return await self.invite_creator(challenge_id, new_user_id, slot, message)

    async def respond_to_invitation(
        self,
        invitation_id: int,
        user_id: int,
        accept: bool
    ) -> ChallengeInvitation:
        """Respond to a challenge invitation (accept or decline)."""
        invitation = await self.db.get(ChallengeInvitation, invitation_id)
        if not invitation:
            raise NotFoundError(resource="Invitation", resource_id=invitation_id)

        if invitation.user_id != user_id:
            raise ForbiddenError(message="This invitation is not for you")

        if invitation.status != InvitationStatus.PENDING:
            raise InvalidStateError(
                message="Invitation is no longer pending",
                current_state=invitation.status.value,
                allowed_states=["pending"]
            )

        if invitation.is_expired:
            invitation.status = InvitationStatus.EXPIRED
            await self.db.commit()
            raise InvalidStateError(message="Invitation has expired")

        challenge = await self.get_challenge_with_relations(invitation.challenge_id)
        if not challenge:
            raise NotFoundError(resource="Challenge", resource_id=invitation.challenge_id)

        if accept:
            invitation.accept()

            # Set participant on challenge
            if invitation.slot == 1:
                challenge.participant1_id = user_id
            else:
                challenge.participant2_id = user_id
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

    async def check_both_accepted(self, challenge: Challenge) -> bool:
        """Check if both 1v1 participants have accepted invitations."""
        accepted_count = sum(
            1 for inv in challenge.invitations
            if inv.status == InvitationStatus.ACCEPTED
        )
        return accepted_count >= 2

    # Private helpers

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

        decliner_name = get_display_name(decliner)

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
