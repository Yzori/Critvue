"""
Sparks Hooks for Review Slot Events

This module provides async hook functions to award sparks based on review slot events.
These should be called from the API endpoints that handle review state transitions.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_slot import ReviewSlot, ReviewSlotStatus, AcceptanceType, DisputeResolution
from app.models.sparks_transaction import SparksAction
from app.services.gamification.sparks_service import SparksService


class ReviewSparksHooks:
    """
    Provides hook methods to award sparks for review slot events.

    Each method corresponds to a ReviewSlot state transition and awards
    appropriate sparks points based on the action taken.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.sparks_service = SparksService(db)

    async def on_review_submitted(self, review_slot: ReviewSlot) -> None:
        """
        Hook called when a review is submitted.

        Awards sparks for:
        - Submitting a review (+5)
        - Daily bonus if first review of day (+5)
        - Updates streak and checks for streak bonuses
        """
        if not review_slot.reviewer_id:
            return

        # Award submission sparks
        await self.sparks_service.award_sparks(
            user_id=review_slot.reviewer_id,
            action=SparksAction.REVIEW_SUBMITTED,
            reason=f"Submitted review for request #{review_slot.review_request_id}",
            review_slot_id=review_slot.id
        )

        # Check for daily bonus
        await self.sparks_service.award_daily_bonus(review_slot.reviewer_id)

        # Update streak (may award streak bonuses)
        await self.sparks_service.update_streak(review_slot.reviewer_id)

    async def on_review_accepted(
        self,
        review_slot: ReviewSlot,
        is_auto: bool = False,
        helpful_rating: Optional[int] = None
    ) -> None:
        """
        Hook called when a review is accepted.

        Awards sparks for:
        - Manual acceptance with helpful rating (+20/+30/+40 based on rating)
        - Auto-acceptance (+15)

        Also updates acceptance rate and checks for tier promotion.
        """
        if not review_slot.reviewer_id:
            return

        if is_auto:
            # Auto-accepted review
            await self.sparks_service.award_sparks(
                user_id=review_slot.reviewer_id,
                action=SparksAction.REVIEW_AUTO_ACCEPTED,
                reason=f"Review auto-accepted after 7 days (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )
        else:
            # Manual acceptance with helpful rating
            points_msg = ""
            if helpful_rating == 5:
                points_msg = "+40 sparks"
            elif helpful_rating == 4:
                points_msg = "+30 sparks"
            elif helpful_rating == 3:
                points_msg = "+20 sparks"
            else:
                points_msg = "+20 sparks"

            await self.sparks_service.award_sparks(
                user_id=review_slot.reviewer_id,
                action=SparksAction.REVIEW_ACCEPTED,
                reason=f"Review accepted with {helpful_rating or 3}-star rating ({points_msg})",
                review_slot_id=review_slot.id,
                helpful_rating=helpful_rating
            )

        # Update acceptance rate (cached calculation)
        await self.sparks_service.calculate_acceptance_rate(review_slot.reviewer_id)

        # Check for tier promotion
        await self.sparks_service.check_tier_promotion(review_slot.reviewer_id)

    async def on_review_rejected(self, review_slot: ReviewSlot) -> None:
        """
        Hook called when a review is rejected.

        Deducts sparks for:
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
            await self.sparks_service.award_sparks(
                user_id=review_slot.reviewer_id,
                action=SparksAction.SPAM_PENALTY,
                reason=f"Review rejected for {review_slot.rejection_reason} (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )
        else:
            # Regular rejection penalty
            reason_text = review_slot.rejection_reason.replace('_', ' ').title() if review_slot.rejection_reason else "quality issues"
            await self.sparks_service.award_sparks(
                user_id=review_slot.reviewer_id,
                action=SparksAction.REVIEW_REJECTED,
                reason=f"Review rejected: {reason_text} (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )

        # Update acceptance rate
        await self.sparks_service.calculate_acceptance_rate(review_slot.reviewer_id)

    async def on_claim_abandoned(self, review_slot: ReviewSlot) -> None:
        """
        Hook called when a reviewer abandons a claimed slot.

        Deducts sparks for:
        - Abandoning claim (-20)
        """
        if not review_slot.reviewer_id:
            return

        await self.sparks_service.award_sparks(
            user_id=review_slot.reviewer_id,
            action=SparksAction.CLAIM_ABANDONED,
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

        Awards sparks for:
        - Dispute won (admin sides with reviewer) (+50)

        Deducts sparks for:
        - Dispute lost (admin sides with requester) (-30)
        """
        if not review_slot.reviewer_id:
            return

        if resolution == DisputeResolution.ADMIN_ACCEPTED:
            # Reviewer won the dispute
            await self.sparks_service.award_sparks(
                user_id=review_slot.reviewer_id,
                action=SparksAction.DISPUTE_WON,
                reason=f"Dispute resolved in your favor (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )

            # Recalculate acceptance rate since rejection was overturned
            await self.sparks_service.calculate_acceptance_rate(review_slot.reviewer_id)

            # Check for tier promotion
            await self.sparks_service.check_tier_promotion(review_slot.reviewer_id)
        else:
            # Reviewer lost the dispute
            await self.sparks_service.award_sparks(
                user_id=review_slot.reviewer_id,
                action=SparksAction.DISPUTE_LOST,
                reason=f"Dispute rejected, original rejection upheld (request #{review_slot.review_request_id})",
                review_slot_id=review_slot.id
            )


# Convenience functions for direct use in API endpoints

async def award_sparks_for_submission(db: AsyncSession, review_slot: ReviewSlot) -> None:
    """Award sparks when a review is submitted"""
    hooks = ReviewSparksHooks(db)
    await hooks.on_review_submitted(review_slot)


async def award_sparks_for_acceptance(
    db: AsyncSession,
    review_slot: ReviewSlot,
    is_auto: bool = False,
    helpful_rating: Optional[int] = None
) -> None:
    """Award sparks when a review is accepted"""
    hooks = ReviewSparksHooks(db)
    await hooks.on_review_accepted(review_slot, is_auto, helpful_rating)


async def deduct_sparks_for_rejection(db: AsyncSession, review_slot: ReviewSlot) -> None:
    """Deduct sparks when a review is rejected"""
    hooks = ReviewSparksHooks(db)
    await hooks.on_review_rejected(review_slot)


async def deduct_sparks_for_abandonment(db: AsyncSession, review_slot: ReviewSlot) -> None:
    """Deduct sparks when a claim is abandoned"""
    hooks = ReviewSparksHooks(db)
    await hooks.on_claim_abandoned(review_slot)


async def award_sparks_for_dispute_resolution(
    db: AsyncSession,
    review_slot: ReviewSlot,
    resolution: DisputeResolution
) -> None:
    """Award/deduct sparks based on dispute resolution"""
    hooks = ReviewSparksHooks(db)
    await hooks.on_dispute_resolved(review_slot, resolution)


# Simplified API wrappers (accept slot_id and user_id instead of ReviewSlot object)

async def on_review_submitted(db: AsyncSession, slot_id: int, user_id: int) -> None:
    """Award sparks for review submission"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        await award_sparks_for_submission(db, slot)


async def on_review_accepted(
    db: AsyncSession,
    slot_id: int,
    user_id: int,
    is_auto: bool = False,
    helpful_rating: Optional[int] = None
) -> None:
    """Award sparks for review acceptance"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        await award_sparks_for_acceptance(db, slot, is_auto, helpful_rating)


async def on_review_rejected(db: AsyncSession, slot_id: int, user_id: int) -> None:
    """Deduct sparks for review rejection"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        await deduct_sparks_for_rejection(db, slot)


async def on_claim_abandoned(db: AsyncSession, slot_id: int, user_id: int) -> None:
    """Deduct sparks for abandoned claim"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        await deduct_sparks_for_abandonment(db, slot)


async def on_dispute_created(db: AsyncSession, slot_id: int, user_id: int) -> None:
    """Log dispute creation (no sparks change)"""
    # No sparks change on dispute creation, only on resolution
    pass


async def on_dispute_resolved(
    db: AsyncSession,
    slot_id: int,
    user_id: int,
    resolution: str
) -> None:
    """Award/deduct sparks based on dispute resolution"""
    from app.crud import review_slot as crud_review_slot
    slot = await crud_review_slot.get_review_slot(db, slot_id, user_id)
    if slot:
        # Convert string to enum
        resolution_enum = DisputeResolution(resolution)
        await award_sparks_for_dispute_resolution(db, slot, resolution_enum)


# Backward compatibility aliases
ReviewKarmaHooks = ReviewSparksHooks
award_karma_for_submission = award_sparks_for_submission
award_karma_for_acceptance = award_sparks_for_acceptance
deduct_karma_for_rejection = deduct_sparks_for_rejection
deduct_karma_for_abandonment = deduct_sparks_for_abandonment
award_karma_for_dispute_resolution = award_sparks_for_dispute_resolution
