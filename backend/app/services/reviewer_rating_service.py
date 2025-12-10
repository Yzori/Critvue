"""Reviewer Rating Service for two-sided reputation"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reviewer_rating import ReviewerRating, ReviewerStats
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.review_request import ReviewRequest
from app.core.exceptions import (
    NotFoundError,
    InvalidInputError,
    InvalidStateError,
    AlreadyExistsError,
    ForbiddenError,
)


class ReviewerRatingService:
    """
    Service for managing two-sided reputation.

    Requesters can rate reviewers on:
    - Quality: Was the review thorough and helpful?
    - Professionalism: Was the tone constructive and appropriate?
    - Helpfulness: Did they respond to follow-up questions?

    This creates accountability on both sides of the marketplace.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_rating(
        self,
        review_slot_id: int,
        requester_id: int,
        quality_rating: int,
        professionalism_rating: int,
        helpfulness_rating: int,
        feedback_text: Optional[str] = None,
        is_anonymous: bool = True
    ) -> ReviewerRating:
        """
        Submit a rating for a reviewer after they complete a review.

        Args:
            review_slot_id: The review slot this rating is for
            requester_id: User submitting the rating (review requester)
            quality_rating: 1-5 rating for review quality/thoroughness
            professionalism_rating: 1-5 rating for professional tone
            helpfulness_rating: 1-5 rating for responsiveness to questions
            feedback_text: Optional written feedback
            is_anonymous: Whether to show requester name (default True)

        Returns:
            The created ReviewerRating

        Raises:
            ValueError: If invalid parameters or already rated
        """
        # Validate ratings
        for rating, name in [
            (quality_rating, "quality"),
            (professionalism_rating, "professionalism"),
            (helpfulness_rating, "helpfulness")
        ]:
            if not 1 <= rating <= 5:
                raise InvalidInputError(message=f"{name} rating must be between 1 and 5")

        # Get the review slot
        slot = await self.db.get(ReviewSlot, review_slot_id)
        if not slot:
            raise NotFoundError(resource="Review slot", resource_id=review_slot_id)

        # Get the review request to verify ownership
        review_request = await self.db.get(ReviewRequest, slot.review_request_id)
        if not review_request:
            raise NotFoundError(resource="Review request", resource_id=slot.review_request_id)

        # Verify this user owns the review request
        if review_request.user_id != requester_id:
            raise ForbiddenError(message="You can only rate reviewers for your own review requests")

        # Verify slot has been submitted or accepted (review is complete)
        if slot.status not in [ReviewSlotStatus.SUBMITTED.value, ReviewSlotStatus.ACCEPTED.value, ReviewSlotStatus.REJECTED.value]:
            raise InvalidStateError(
                message="Can only rate reviewers after they submit their review",
                current_state=slot.status,
                allowed_states=["submitted", "accepted", "rejected"]
            )

        # Check for existing rating
        stmt = select(ReviewerRating).where(
            ReviewerRating.review_slot_id == review_slot_id
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            raise AlreadyExistsError(resource="Rating", message="You have already rated this reviewer for this review")

        # Calculate overall rating (weighted average)
        # Quality is most important for reviewers
        overall_rating = round(
            (quality_rating * 0.40 + professionalism_rating * 0.30 + helpfulness_rating * 0.30)
        )

        # Create the rating
        rating = ReviewerRating(
            review_slot_id=review_slot_id,
            requester_id=requester_id,
            reviewer_id=slot.reviewer_id,
            quality_rating=quality_rating,
            professionalism_rating=professionalism_rating,
            helpfulness_rating=helpfulness_rating,
            overall_rating=overall_rating,
            feedback_text=feedback_text,
            is_anonymous=is_anonymous,
            created_at=datetime.utcnow()
        )

        self.db.add(rating)
        await self.db.commit()
        await self.db.refresh(rating)

        # Update reviewer stats
        await self._update_reviewer_stats(slot.reviewer_id)

        return rating

    async def _update_reviewer_stats(self, reviewer_id: int) -> ReviewerStats:
        """Recalculate and update aggregated stats for a reviewer."""
        # Get or create stats record
        stmt = select(ReviewerStats).where(ReviewerStats.user_id == reviewer_id)
        result = await self.db.execute(stmt)
        stats = result.scalar_one_or_none()

        if not stats:
            stats = ReviewerStats(user_id=reviewer_id)
            self.db.add(stats)

        # Calculate averages from all ratings
        stmt = select(
            func.avg(ReviewerRating.quality_rating),
            func.avg(ReviewerRating.professionalism_rating),
            func.avg(ReviewerRating.helpfulness_rating),
            func.avg(ReviewerRating.overall_rating),
            func.count(ReviewerRating.id)
        ).where(ReviewerRating.reviewer_id == reviewer_id)

        result = await self.db.execute(stmt)
        row = result.first()

        if row and row[4] > 0:  # Has ratings
            stats.avg_quality = Decimal(str(row[0])).quantize(Decimal("0.01")) if row[0] else None
            stats.avg_professionalism = Decimal(str(row[1])).quantize(Decimal("0.01")) if row[1] else None
            stats.avg_helpfulness = Decimal(str(row[2])).quantize(Decimal("0.01")) if row[2] else None
            stats.avg_overall = Decimal(str(row[3])).quantize(Decimal("0.01")) if row[3] else None
            stats.total_ratings = row[4]

            # Update flags
            stats.is_high_quality = float(stats.avg_quality or 0) >= 4.0
            stats.is_professional = float(stats.avg_professionalism or 0) >= 4.0

        # Count total completed reviews
        stmt = select(func.count(ReviewSlot.id)).where(
            ReviewSlot.reviewer_id == reviewer_id,
            ReviewSlot.status.in_([ReviewSlotStatus.ACCEPTED.value, ReviewSlotStatus.SUBMITTED.value])
        )
        result = await self.db.execute(stmt)
        stats.total_reviews_completed = result.scalar() or 0

        # Count accepted/rejected reviews
        stmt = select(func.count(ReviewSlot.id)).where(
            ReviewSlot.reviewer_id == reviewer_id,
            ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
        )
        result = await self.db.execute(stmt)
        stats.reviews_accepted = result.scalar() or 0

        stmt = select(func.count(ReviewSlot.id)).where(
            ReviewSlot.reviewer_id == reviewer_id,
            ReviewSlot.status == ReviewSlotStatus.REJECTED.value
        )
        result = await self.db.execute(stmt)
        stats.reviews_rejected = result.scalar() or 0

        stats.updated_at = datetime.utcnow()

        # Also update the User table to keep profile in sync
        user_stmt = select(User).where(User.id == reviewer_id)
        user_result = await self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        if user:
            if stats.avg_overall is not None:
                user.avg_rating = stats.avg_overall
            # Sync review counts
            user.total_reviews_given = stats.reviews_accepted

        await self.db.commit()
        await self.db.refresh(stats)

        return stats

    async def get_reviewer_stats(self, reviewer_id: int) -> Optional[Dict[str, Any]]:
        """
        Get aggregated stats for a reviewer.

        Returns data suitable for display on profiles and cards.
        """
        stmt = select(ReviewerStats).where(ReviewerStats.user_id == reviewer_id)
        result = await self.db.execute(stmt)
        stats = result.scalar_one_or_none()

        if not stats:
            return None

        return {
            "avg_quality": float(stats.avg_quality) if stats.avg_quality else None,
            "avg_professionalism": float(stats.avg_professionalism) if stats.avg_professionalism else None,
            "avg_helpfulness": float(stats.avg_helpfulness) if stats.avg_helpfulness else None,
            "avg_overall": float(stats.avg_overall) if stats.avg_overall else None,
            "total_ratings": stats.total_ratings,
            "total_reviews_completed": stats.total_reviews_completed,
            "reviews_accepted": stats.reviews_accepted,
            "reviews_rejected": stats.reviews_rejected,
            "is_high_quality": stats.is_high_quality,
            "is_professional": stats.is_professional,
            "badges": self._get_reviewer_badges(stats),
        }

    def _get_reviewer_badges(self, stats: ReviewerStats) -> List[str]:
        """Get badges/labels for reviewer based on their stats."""
        badges = []

        if stats.total_ratings >= 5:  # Minimum ratings for badges
            if stats.avg_overall and float(stats.avg_overall) >= 4.5:
                badges.append("Top Rated")
            if stats.is_high_quality:
                badges.append("Quality Reviews")
            if stats.is_professional:
                badges.append("Professional")
            if stats.total_reviews_completed >= 50:
                badges.append("Experienced Reviewer")
            if stats.reviews_accepted and stats.total_reviews_completed:
                acceptance_rate = (stats.reviews_accepted / stats.total_reviews_completed) * 100
                if acceptance_rate >= 90:
                    badges.append("High Acceptance")

        return badges

    async def get_ratings_for_reviewer(
        self,
        reviewer_id: int,
        limit: int = 10,
        include_anonymous: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get individual ratings received by a reviewer.

        For the reviewer's own view (sees all ratings) or
        public view (may hide anonymous feedback text).
        """
        stmt = (
            select(ReviewerRating)
            .where(ReviewerRating.reviewer_id == reviewer_id)
            .order_by(ReviewerRating.created_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        ratings = []

        for rating in result.scalars():
            requester = await self.db.get(User, rating.requester_id)

            ratings.append({
                "id": rating.id,
                "quality_rating": rating.quality_rating,
                "professionalism_rating": rating.professionalism_rating,
                "helpfulness_rating": rating.helpfulness_rating,
                "overall_rating": rating.overall_rating,
                "feedback_text": rating.feedback_text if include_anonymous or not rating.is_anonymous else None,
                "requester_name": requester.full_name if requester and not rating.is_anonymous else "Anonymous",
                "requester_avatar": requester.avatar_url if requester and not rating.is_anonymous else None,
                "created_at": rating.created_at.isoformat(),
            })

        return ratings

    async def can_rate_reviewer(self, requester_id: int, review_slot_id: int) -> Dict[str, Any]:
        """
        Check if a requester can rate a reviewer for a specific slot.

        Returns eligibility status and reason.
        """
        # Get the review slot
        slot = await self.db.get(ReviewSlot, review_slot_id)
        if not slot:
            return {"can_rate": False, "reason": "Review slot not found"}

        # Get the review request to verify ownership
        review_request = await self.db.get(ReviewRequest, slot.review_request_id)
        if not review_request:
            return {"can_rate": False, "reason": "Review request not found"}

        # Check ownership
        if review_request.user_id != requester_id:
            return {"can_rate": False, "reason": "Not your review request"}

        # Check slot status - must be submitted/accepted/rejected
        if slot.status not in [ReviewSlotStatus.SUBMITTED.value, ReviewSlotStatus.ACCEPTED.value, ReviewSlotStatus.REJECTED.value]:
            return {"can_rate": False, "reason": "Reviewer must submit their review first"}

        # Check for existing rating
        stmt = select(ReviewerRating).where(
            ReviewerRating.review_slot_id == review_slot_id
        )
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            return {"can_rate": False, "reason": "Already rated this reviewer"}

        return {"can_rate": True, "reason": None}

    async def get_reviewer_rating_summary(
        self,
        reviewer_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get a compact rating summary for display on reviewer cards.

        Shows minimal info: overall rating and rating count.
        """
        stats = await self.get_reviewer_stats(reviewer_id)
        if not stats:
            return None

        return {
            "rating": stats["avg_overall"],
            "count": stats["total_ratings"],
            "badges": stats["badges"][:2],  # Max 2 badges on card
        }

    async def get_rating_for_slot(self, review_slot_id: int) -> Optional[ReviewerRating]:
        """Get the rating for a specific review slot if it exists."""
        stmt = select(ReviewerRating).where(
            ReviewerRating.review_slot_id == review_slot_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
