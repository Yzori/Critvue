"""Shared service for review slot claiming logic

This module consolidates all claim-related business logic to avoid duplication
between the browse API and review-slots API.
"""

from typing import Optional, Tuple
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_request import ReviewRequest, ReviewStatus
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.user import User


class ClaimValidationError(ValueError):
    """Raised when claim validation fails"""
    pass


class TierPermissionError(ValueError):
    """Raised when user's tier doesn't allow claiming a paid review"""
    pass


class ApplicationRequiredError(ValueError):
    """Raised when a paid review requires application instead of direct claim"""
    pass


class ClaimService:
    """Service for managing review slot claims"""

    @staticmethod
    def is_paid_slot(slot: ReviewSlot) -> bool:
        """Check if a slot is for a paid/expert review."""
        return slot.payment_amount is not None and slot.payment_amount > 0

    @staticmethod
    async def check_application_required(
        db: AsyncSession,
        slot: ReviewSlot,
        reviewer_id: int
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if this slot requires an application instead of direct claiming.

        For paid/expert reviews, experts must apply and be accepted by the creator
        before they can claim a slot.

        Args:
            db: Database session
            slot: Review slot to check
            reviewer_id: User attempting to claim

        Returns:
            Tuple of (requires_application, error_message)
        """
        # Free reviews don't require applications
        if not ClaimService.is_paid_slot(slot):
            return False, None

        # Check if user has an accepted application for this request
        from app.models.slot_application import SlotApplication, SlotApplicationStatus

        accepted_app_query = select(SlotApplication).where(
            and_(
                SlotApplication.review_request_id == slot.review_request_id,
                SlotApplication.applicant_id == reviewer_id,
                SlotApplication.status == SlotApplicationStatus.ACCEPTED.value
            )
        )

        result = await db.execute(accepted_app_query)
        accepted_application = result.scalar_one_or_none()

        if accepted_application:
            # User has been accepted - they can claim
            return False, None

        # User needs to apply first
        return True, (
            "This is a paid expert review. You must apply and be accepted by the creator "
            "before you can claim this slot. Use the application form to submit your pitch."
        )

    @staticmethod
    async def check_tier_permissions(
        db: AsyncSession,
        user: User,
        slot: ReviewSlot
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if user's tier allows claiming this review slot.

        For free reviews: always allowed
        For paid reviews: check tier requirements

        Args:
            db: Database session
            user: User attempting to claim
            slot: Review slot to claim

        Returns:
            Tuple of (can_claim, error_message)
        """
        # If slot has no payment, anyone can claim (free review)
        if not slot.payment_amount or slot.payment_amount <= 0:
            return True, None

        # For paid reviews, check Stripe Connect setup first
        if not user.stripe_connect_payouts_enabled:
            return False, (
                "You need to set up your payment account before claiming paid reviews. "
                "Go to Settings > Payouts to complete setup."
            )

        # Then check tier permissions
        try:
            from app.services.tier_service import TierService
            tier_service = TierService(db)

            can_claim, reason = await tier_service.can_claim_paid_review(
                user=user,
                review_budget=float(slot.payment_amount)
            )

            return can_claim, reason
        except ImportError:
            # Tier system not available, allow claim
            return True, None

    @staticmethod
    async def claim_review_by_request_id(
        db: AsyncSession,
        review_id: int,
        reviewer_id: int,
        claim_hours: int = 72
    ) -> ReviewSlot:
        """
        Claim a review slot by review request ID.

        This method:
        1. Finds an available slot for the review request
        2. Validates the claim (ownership, availability, duplicate check)
        3. Claims the slot
        4. Updates the review request's claimed counter

        Args:
            db: Database session
            review_id: Review request ID
            reviewer_id: User claiming the review
            claim_hours: Hours until claim deadline (default 72)

        Returns:
            The claimed ReviewSlot

        Raises:
            ClaimValidationError: If claim validation fails
            RuntimeError: If review request not found or no slots available
        """
        # Get review request with row lock to prevent race conditions
        review_query = (
            select(ReviewRequest)
            .where(
                ReviewRequest.id == review_id,
                ReviewRequest.deleted_at.is_(None)
            )
            .with_for_update()
        )

        review_result = await db.execute(review_query)
        review = review_result.scalar_one_or_none()

        if not review:
            raise RuntimeError(f"Review request {review_id} not found")

        # Validation: Cannot claim own review
        if review.user_id == reviewer_id:
            raise ClaimValidationError("You cannot claim your own review request")

        # Validation: Review must be in claimable status
        if review.status not in [ReviewStatus.PENDING, ReviewStatus.IN_REVIEW]:
            raise ClaimValidationError(
                f"Cannot claim review with status '{review.status.value}'. "
                "Only pending or in-review requests can be claimed."
            )

        # Find an available slot for this review request
        slot_query = (
            select(ReviewSlot)
            .where(
                and_(
                    ReviewSlot.review_request_id == review_id,
                    ReviewSlot.status == ReviewSlotStatus.AVAILABLE.value
                )
            )
            .with_for_update()  # Lock the slot
            .limit(1)
        )

        slot_result = await db.execute(slot_query)
        slot = slot_result.scalar_one_or_none()

        if not slot:
            raise ClaimValidationError(
                "All review slots are already claimed. "
                f"{review.reviews_claimed}/{review.reviews_requested} slots filled."
            )

        # APPLICATION CHECK: For paid reviews, require application approval
        requires_app, app_error = await ClaimService.check_application_required(
            db=db,
            slot=slot,
            reviewer_id=reviewer_id
        )

        if requires_app:
            raise ApplicationRequiredError(app_error or "Application required for paid reviews")

        # Check if reviewer already has a slot for this request
        existing_claim_query = select(ReviewSlot).where(
            and_(
                ReviewSlot.review_request_id == review_id,
                ReviewSlot.reviewer_id == reviewer_id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.CLAIMED.value,
                    ReviewSlotStatus.SUBMITTED.value
                ])
            )
        )

        existing_result = await db.execute(existing_claim_query)
        existing_claim = existing_result.scalar_one_or_none()

        if existing_claim:
            raise ClaimValidationError(
                "You have already claimed a slot for this review request. "
                "Complete or abandon your current claim before claiming another."
            )

        # TIER PERMISSION CHECK: Verify user's tier allows claiming this slot
        reviewer = await db.get(User, reviewer_id)
        if reviewer:
            can_claim, tier_error = await ClaimService.check_tier_permissions(
                db=db,
                user=reviewer,
                slot=slot
            )

            if not can_claim:
                raise TierPermissionError(tier_error or "Your tier doesn't allow claiming this paid review")

        # Claim the slot
        slot.claim(reviewer_id, claim_hours)

        # Update review request's claimed counter
        review.reviews_claimed += 1

        # If this was the first claim, change status to IN_REVIEW
        if review.reviews_claimed == 1 and review.status == ReviewStatus.PENDING:
            review.status = ReviewStatus.IN_REVIEW

        review.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(slot)
        await db.refresh(review)

        return slot

    @staticmethod
    async def claim_review_by_slot_id(
        db: AsyncSession,
        slot_id: int,
        reviewer_id: int,
        claim_hours: int = 72
    ) -> ReviewSlot:
        """
        Claim a specific review slot by slot ID.

        This method is used when the frontend already knows the slot_id
        (e.g., from browsing available slots directly).

        Args:
            db: Database session
            slot_id: Review slot ID
            reviewer_id: User claiming the review
            claim_hours: Hours until claim deadline (default 72)

        Returns:
            The claimed ReviewSlot

        Raises:
            ClaimValidationError: If claim validation fails
            RuntimeError: If slot not found
        """
        # Get slot with row lock
        slot_query = (
            select(ReviewSlot)
            .where(ReviewSlot.id == slot_id)
            .with_for_update()
        )

        slot_result = await db.execute(slot_query)
        slot = slot_result.scalar_one_or_none()

        if not slot:
            raise RuntimeError(f"Review slot {slot_id} not found")

        # Check if slot is claimable
        if not slot.is_claimable:
            raise ClaimValidationError(
                f"Slot is not available (current status: {slot.status})"
            )

        # Get review request to validate ownership
        review = await db.get(ReviewRequest, slot.review_request_id)
        if not review:
            raise RuntimeError("Review request not found")

        # Validation: Cannot claim own review
        if review.user_id == reviewer_id:
            raise ClaimValidationError(
                "You cannot claim review slots for your own requests"
            )

        # APPLICATION CHECK: For paid reviews, require application approval
        requires_app, app_error = await ClaimService.check_application_required(
            db=db,
            slot=slot,
            reviewer_id=reviewer_id
        )

        if requires_app:
            raise ApplicationRequiredError(app_error or "Application required for paid reviews")

        # Check if reviewer already has a slot for this request
        existing_claim_query = select(ReviewSlot).where(
            and_(
                ReviewSlot.review_request_id == slot.review_request_id,
                ReviewSlot.reviewer_id == reviewer_id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.CLAIMED.value,
                    ReviewSlotStatus.SUBMITTED.value
                ])
            )
        )

        existing_result = await db.execute(existing_claim_query)
        existing_claim = existing_result.scalar_one_or_none()

        if existing_claim:
            raise ClaimValidationError(
                "You have already claimed a slot for this review request. "
                "Complete or abandon your current claim before claiming another."
            )

        # TIER PERMISSION CHECK: Verify user's tier allows claiming this slot
        reviewer = await db.get(User, reviewer_id)
        if reviewer:
            can_claim, tier_error = await ClaimService.check_tier_permissions(
                db=db,
                user=reviewer,
                slot=slot
            )

            if not can_claim:
                raise TierPermissionError(tier_error or "Your tier doesn't allow claiming this paid review")

        # Claim the slot
        slot.claim(reviewer_id, claim_hours)

        # Update review request's claimed counter
        review.reviews_claimed += 1

        # If this was the first claim, change status to IN_REVIEW
        if review.reviews_claimed == 1 and review.status == ReviewStatus.PENDING:
            review.status = ReviewStatus.IN_REVIEW

        review.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(slot)
        await db.refresh(review)

        return slot

    @staticmethod
    async def unclaim_review_slot(
        db: AsyncSession,
        slot_id: int,
        reviewer_id: int
    ) -> ReviewSlot:
        """
        Unclaim (abandon) a previously claimed review slot.

        Args:
            db: Database session
            slot_id: Review slot ID
            reviewer_id: User who claimed the slot

        Returns:
            The abandoned ReviewSlot

        Raises:
            ClaimValidationError: If unclaim validation fails
            RuntimeError: If slot not found
        """
        slot = await db.get(ReviewSlot, slot_id)

        if not slot:
            raise RuntimeError(f"Review slot {slot_id} not found")

        # Validation: Must be the reviewer
        if slot.reviewer_id != reviewer_id:
            raise ClaimValidationError("You cannot abandon a slot you don't own")

        # Abandon the slot (this validates status internally)
        slot.abandon()

        # SPARKS PENALTY: Deduct sparks for abandoning claim
        try:
            from app.services.review_sparks_hooks import deduct_sparks_for_abandonment
            await deduct_sparks_for_abandonment(db, slot)
        except ImportError:
            # Sparks system not available
            pass

        # Update review request's claimed counter
        review = await db.get(ReviewRequest, slot.review_request_id)
        if review:
            review.reviews_claimed = max(0, review.reviews_claimed - 1)

            # If no slots claimed, change status back to PENDING
            if review.reviews_claimed == 0 and review.status == ReviewStatus.IN_REVIEW:
                review.status = ReviewStatus.PENDING

            review.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(slot)

        return slot


# Singleton instance
claim_service = ClaimService()
