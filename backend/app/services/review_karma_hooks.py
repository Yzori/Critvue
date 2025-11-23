"""
Karma Hooks for Review Slot Events

This module provides async hook functions to award karma based on review slot events.
These should be called from the API endpoints that handle review state transitions.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_slot import ReviewSlot, ReviewSlotStatus, AcceptanceType, DisputeResolution
from app.models.karma_transaction import KarmaAction
from app.services.karma_service import KarmaService


class ReviewKarmaHooks:
    """
    Provides hook methods to award karma for review slot events.

    Each method corresponds to a ReviewSlot state transition and awards
    appropriate karma points based on the action taken.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.karma_service = KarmaService(db)

    async def on_review_submitted(self, review_slot: ReviewSlot) -> None:
        """
        Hook called when a review is submitted.

        Awards karma for:
        - Submitting a review (+5)
        - Daily bonus if first review of day (+5)
        - Updates streak and checks for streak bonuses
        """
        if not review_slot.reviewer_id:
            return

        # Award submission karma
        await self.karma_service.award_karma(
            user_id=review_slot.reviewer_id,
            action=KarmaAction.REVIEW_SUBMITTED,
            reason=f"Submitted review for request #{review_slot.review_request_id}",
            review_slot_id=review_slot.id
        )

        # Check for daily bonus
        await self.karma_service.award_daily_bonus(review_slot.reviewer_id)

        # Update streak (may award streak bonuses)
        await self.karma_service.update_streak(review_slot.reviewer_id)

    async def on_review_accepted(
        self,
        review_slot: ReviewSlot,
        is_auto: bool = False,
        helpful_rating: Optional[int] = None
    ) -> None:
        """
        Hook called when a review is accepted.

        Awards karma for:
        - Manual acceptance with helpful rating (+20/+30/+40 based on rating)
        - Auto-acceptance (+15)

        Also updates acceptance rate and checks for tier promotion.
        """
        if not review_slot.reviewer_id:
            return

        if is_auto:
            # Auto-accepted review
            await self.karma_service.award_karma(
                user_id=review_slot.reviewer_id,
                action=KarmaAction.REVIEW_AUTO_ACCEPTED,
                reason=f"Review auto-accepted after 7 days (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )
        else:
            # Manual acceptance with helpful rating
            points_msg = ""
            if helpful_rating == 5:
                points_msg = "+40 karma"
            elif helpful_rating == 4:
                points_msg = "+30 karma"
            elif helpful_rating == 3:
                points_msg = "+20 karma"
            else:
                points_msg = "+20 karma"

            await self.karma_service.award_karma(
                user_id=review_slot.reviewer_id,
                action=KarmaAction.REVIEW_ACCEPTED,
                reason=f"Review accepted with {helpful_rating or 3}-star rating ({points_msg})",
                review_slot_id=review_slot.id,
                helpful_rating=helpful_rating
            )

        # Update acceptance rate (cached calculation)
        await self.karma_service.calculate_acceptance_rate(review_slot.reviewer_id)

        # Check for tier promotion
        await self.karma_service.check_tier_promotion(review_slot.reviewer_id)

    async def on_review_rejected(self, review_slot: ReviewSlot) -> None:
        """
        Hook called when a review is rejected.

        Deducts karma for:
        - Review rejection (-10)
        - Spam/abusive content (-100 if rejection reason is spam/abusive)

        Also updates acceptance rate.
        """
        if not review_slot.reviewer_id:
            return

        # Check if spam/abusive
        from app.models.review_slot import RejectionReason
        if review_slot.rejection_reason in [RejectionReason.SPAM.value, RejectionReason.ABUSIVE.value]:
            # Severe penalty for spam/abusive content
            await self.karma_service.award_karma(
                user_id=review_slot.reviewer_id,
                action=KarmaAction.SPAM_PENALTY,
                reason=f"Review rejected for {review_slot.rejection_reason} (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )
        else:
            # Regular rejection penalty
            reason_text = review_slot.rejection_reason.replace('_', ' ').title() if review_slot.rejection_reason else "quality issues"
            await self.karma_service.award_karma(
                user_id=review_slot.reviewer_id,
                action=KarmaAction.REVIEW_REJECTED,
                reason=f"Review rejected: {reason_text} (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )

        # Update acceptance rate
        await self.karma_service.calculate_acceptance_rate(review_slot.reviewer_id)

    async def on_claim_abandoned(self, review_slot: ReviewSlot) -> None:
        """
        Hook called when a reviewer abandons a claimed slot.

        Deducts karma for:
        - Abandoning claim (-20)
        """
        if not review_slot.reviewer_id:
            return

        await self.karma_service.award_karma(
            user_id=review_slot.reviewer_id,
            action=KarmaAction.CLAIM_ABANDONED,
            reason=f"Abandoned claimed review (request #{review_slot.review_request_id})",
            review_slot_id=review_slot.id
        )

    async def on_dispute_resolved(
        self,
        review_slot: ReviewSlot,
        resolution: DisputeResolution
    ) -> None:
        """
        Hook called when a dispute is resolved by admin.

        Awards karma for:
        - Dispute won (admin sides with reviewer) (+50)

        Deducts karma for:
        - Dispute lost (admin sides with requester) (-30)
        """
        if not review_slot.reviewer_id:
            return

        if resolution == DisputeResolution.ADMIN_ACCEPTED:
            # Reviewer won the dispute
            await self.karma_service.award_karma(
                user_id=review_slot.reviewer_id,
                action=KarmaAction.DISPUTE_WON,
                reason=f"Dispute resolved in your favor (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )

            # Recalculate acceptance rate since rejection was overturned
            await self.karma_service.calculate_acceptance_rate(review_slot.reviewer_id)

            # Check for tier promotion
            await self.karma_service.check_tier_promotion(review_slot.reviewer_id)
        else:
            # Reviewer lost the dispute
            await self.karma_service.award_karma(
                user_id=review_slot.reviewer_id,
                action=KarmaAction.DISPUTE_LOST,
                reason=f"Dispute rejected, original rejection upheld (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )


# Convenience functions for direct use in API endpoints

async def award_karma_for_submission(db: AsyncSession, review_slot: ReviewSlot) -> None:
    """Award karma when a review is submitted"""
    hooks = ReviewKarmaHooks(db)
    await hooks.on_review_submitted(review_slot)


async def award_karma_for_acceptance(
    db: AsyncSession,
    review_slot: ReviewSlot,
    is_auto: bool = False,
    helpful_rating: Optional[int] = None
) -> None:
    """Award karma when a review is accepted"""
    hooks = ReviewKarmaHooks(db)
    await hooks.on_review_accepted(review_slot, is_auto, helpful_rating)


async def deduct_karma_for_rejection(db: AsyncSession, review_slot: ReviewSlot) -> None:
    """Deduct karma when a review is rejected"""
    hooks = ReviewKarmaHooks(db)
    await hooks.on_review_rejected(review_slot)


async def deduct_karma_for_abandonment(db: AsyncSession, review_slot: ReviewSlot) -> None:
    """Deduct karma when a claim is abandoned"""
    hooks = ReviewKarmaHooks(db)
    await hooks.on_claim_abandoned(review_slot)


async def award_karma_for_dispute_resolution(
    db: AsyncSession,
    review_slot: ReviewSlot,
    resolution: DisputeResolution
) -> None:
    """Award/deduct karma based on dispute resolution"""
    hooks = ReviewKarmaHooks(db)
    await hooks.on_dispute_resolved(review_slot, resolution)


# Simplified API wrappers (accept slot_id and user_id instead of ReviewSlot object)

async def on_review_submitted(db: AsyncSession, slot_id: int, user_id: int) -> None:
    """Award karma for review submission"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        await award_karma_for_submission(db, slot)


async def on_review_accepted(
    db: AsyncSession,
    slot_id: int,
    user_id: int,
    is_auto: bool = False,
    helpful_rating: Optional[int] = None
) -> None:
    """Award karma for review acceptance"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        await award_karma_for_acceptance(db, slot, is_auto, helpful_rating)


async def on_review_rejected(db: AsyncSession, slot_id: int, user_id: int) -> None:
    """Deduct karma for review rejection"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        await deduct_karma_for_rejection(db, slot)


async def on_claim_abandoned(db: AsyncSession, slot_id: int, user_id: int) -> None:
    """Deduct karma for abandoned claim"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        await deduct_karma_for_abandonment(db, slot)


async def on_dispute_created(db: AsyncSession, slot_id: int, user_id: int) -> None:
    """Log dispute creation (no karma change)"""
    # No karma change on dispute creation, only on resolution
    pass


async def on_dispute_resolved(
    db: AsyncSession,
    slot_id: int,
    user_id: int,
    resolution: str
) -> None:
    """Award/deduct karma based on dispute resolution"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        # Convert string to enum
        resolution_enum = DisputeResolution(resolution)
        await award_karma_for_dispute_resolution(db, slot, resolution_enum)
