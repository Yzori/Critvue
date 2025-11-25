"""Requester Rating Service for two-sided reputation"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.requester_rating import RequesterRating, RequesterStats
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.review_request import ReviewRequest


class RequesterRatingService:
    """
    Service for managing two-sided reputation.

    Reviewers can rate requesters on:
    - Clarity: Were the review requirements clear?
    - Responsiveness: Did they respond to questions promptly?
    - Fairness: Was their feedback/acceptance fair?

    This creates accountability on both sides of the marketplace.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_rating(
        self,
        review_slot_id: int,
        reviewer_id: int,
        clarity_rating: int,
        responsiveness_rating: int,
        fairness_rating: int,
        feedback_text: Optional[str] = None,
        is_anonymous: bool = True
    ) -> RequesterRating:
        """
        Submit a rating for a requester after completing a review.

        Args:
            review_slot_id: The review slot this rating is for
            reviewer_id: User submitting the rating
            clarity_rating: 1-5 rating for clarity of requirements
            responsiveness_rating: 1-5 rating for response time
            fairness_rating: 1-5 rating for fairness of feedback
            feedback_text: Optional written feedback (private)
            is_anonymous: Whether to show reviewer name (default True)

        Returns:
            The created RequesterRating

        Raises:
            ValueError: If invalid parameters or already rated
        """
        # Validate ratings
        for rating, name in [
            (clarity_rating, "clarity"),
            (responsiveness_rating, "responsiveness"),
            (fairness_rating, "fairness")
        ]:
            if not 1 <= rating <= 5:
                raise ValueError(f"{name} rating must be between 1 and 5")

        # Get the review slot
        slot = await self.db.get(ReviewSlot, review_slot_id)
        if not slot:
            raise ValueError(f"Review slot {review_slot_id} not found")

        # Verify this reviewer owns this slot
        if slot.reviewer_id != reviewer_id:
            raise ValueError("You can only rate requesters for your own reviews")

        # Verify slot is in a completed state
        if slot.status not in [ReviewSlotStatus.SUBMITTED.value, ReviewSlotStatus.ACCEPTED.value]:
            raise ValueError("Can only rate requesters after submitting a review")

        # Check for existing rating
        stmt = select(RequesterRating).where(
            RequesterRating.review_slot_id == review_slot_id
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            raise ValueError("You have already rated this requester for this review")

        # Get the review request to find requester
        review_request = await self.db.get(ReviewRequest, slot.review_request_id)
        if not review_request:
            raise ValueError("Review request not found")

        # Calculate overall rating (weighted average)
        overall_rating = round(
            (clarity_rating * 0.35 + responsiveness_rating * 0.30 + fairness_rating * 0.35)
        )

        # Create the rating
        rating = RequesterRating(
            review_slot_id=review_slot_id,
            reviewer_id=reviewer_id,
            requester_id=review_request.user_id,
            clarity_rating=clarity_rating,
            responsiveness_rating=responsiveness_rating,
            fairness_rating=fairness_rating,
            overall_rating=overall_rating,
            feedback_text=feedback_text,
            is_anonymous=is_anonymous,
            created_at=datetime.utcnow()
        )

        self.db.add(rating)
        await self.db.commit()
        await self.db.refresh(rating)

        # Update requester stats
        await self._update_requester_stats(review_request.user_id)

        return rating

    async def _update_requester_stats(self, requester_id: int) -> RequesterStats:
        """Recalculate and update aggregated stats for a requester."""
        # Get or create stats record
        stmt = select(RequesterStats).where(RequesterStats.user_id == requester_id)
        result = await self.db.execute(stmt)
        stats = result.scalar_one_or_none()

        if not stats:
            stats = RequesterStats(user_id=requester_id)
            self.db.add(stats)

        # Calculate averages from all ratings
        stmt = select(
            func.avg(RequesterRating.clarity_rating),
            func.avg(RequesterRating.responsiveness_rating),
            func.avg(RequesterRating.fairness_rating),
            func.avg(RequesterRating.overall_rating),
            func.count(RequesterRating.id)
        ).where(RequesterRating.requester_id == requester_id)

        result = await self.db.execute(stmt)
        row = result.first()

        if row and row[4] > 0:  # Has ratings
            stats.avg_clarity = Decimal(str(row[0])).quantize(Decimal("0.01")) if row[0] else None
            stats.avg_responsiveness = Decimal(str(row[1])).quantize(Decimal("0.01")) if row[1] else None
            stats.avg_fairness = Decimal(str(row[2])).quantize(Decimal("0.01")) if row[2] else None
            stats.avg_overall = Decimal(str(row[3])).quantize(Decimal("0.01")) if row[3] else None
            stats.total_ratings = row[4]

            # Update flags
            stats.is_responsive = float(stats.avg_responsiveness or 0) >= 4.0
            stats.is_fair = float(stats.avg_fairness or 0) >= 4.0

        # Count total reviews requested
        stmt = select(func.count(ReviewRequest.id)).where(
            ReviewRequest.user_id == requester_id
        )
        result = await self.db.execute(stmt)
        stats.total_reviews_requested = result.scalar() or 0

        stats.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(stats)

        return stats

    async def get_requester_stats(self, requester_id: int) -> Optional[Dict[str, Any]]:
        """
        Get aggregated stats for a requester.

        Returns data suitable for display on browse cards and profiles.
        """
        stmt = select(RequesterStats).where(RequesterStats.user_id == requester_id)
        result = await self.db.execute(stmt)
        stats = result.scalar_one_or_none()

        if not stats:
            return None

        return {
            "avg_clarity": float(stats.avg_clarity) if stats.avg_clarity else None,
            "avg_responsiveness": float(stats.avg_responsiveness) if stats.avg_responsiveness else None,
            "avg_fairness": float(stats.avg_fairness) if stats.avg_fairness else None,
            "avg_overall": float(stats.avg_overall) if stats.avg_overall else None,
            "total_ratings": stats.total_ratings,
            "total_reviews_requested": stats.total_reviews_requested,
            "is_responsive": stats.is_responsive,
            "is_fair": stats.is_fair,
            "badges": self._get_requester_badges(stats),
        }

    def _get_requester_badges(self, stats: RequesterStats) -> List[str]:
        """Get badges/labels for requester based on their stats."""
        badges = []

        if stats.total_ratings >= 5:  # Minimum ratings for badges
            if stats.avg_overall and float(stats.avg_overall) >= 4.5:
                badges.append("Highly Rated")
            if stats.is_responsive:
                badges.append("Responsive")
            if stats.is_fair:
                badges.append("Fair Reviewer")
            if stats.total_ratings >= 20:
                badges.append("Experienced Requester")

        return badges

    async def get_ratings_for_requester(
        self,
        requester_id: int,
        limit: int = 10,
        include_anonymous: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get individual ratings received by a requester.

        For the requester's own view (sees all ratings) or
        public view (may hide anonymous feedback text).
        """
        stmt = (
            select(RequesterRating)
            .where(RequesterRating.requester_id == requester_id)
            .order_by(RequesterRating.created_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        ratings = []

        for rating in result.scalars():
            reviewer = await self.db.get(User, rating.reviewer_id)

            ratings.append({
                "id": rating.id,
                "clarity_rating": rating.clarity_rating,
                "responsiveness_rating": rating.responsiveness_rating,
                "fairness_rating": rating.fairness_rating,
                "overall_rating": rating.overall_rating,
                "feedback_text": rating.feedback_text if include_anonymous or not rating.is_anonymous else None,
                "reviewer_name": reviewer.full_name if reviewer and not rating.is_anonymous else "Anonymous Reviewer",
                "reviewer_avatar": reviewer.avatar_url if reviewer and not rating.is_anonymous else None,
                "created_at": rating.created_at.isoformat(),
            })

        return ratings

    async def can_rate_requester(self, reviewer_id: int, review_slot_id: int) -> Dict[str, Any]:
        """
        Check if a reviewer can rate a requester for a specific slot.

        Returns eligibility status and reason.
        """
        # Get the review slot
        slot = await self.db.get(ReviewSlot, review_slot_id)
        if not slot:
            return {"can_rate": False, "reason": "Review slot not found"}

        # Check ownership
        if slot.reviewer_id != reviewer_id:
            return {"can_rate": False, "reason": "Not your review"}

        # Check slot status
        if slot.status not in [ReviewSlotStatus.SUBMITTED.value, ReviewSlotStatus.ACCEPTED.value]:
            return {"can_rate": False, "reason": "Review must be submitted first"}

        # Check for existing rating
        stmt = select(RequesterRating).where(
            RequesterRating.review_slot_id == review_slot_id
        )
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            return {"can_rate": False, "reason": "Already rated this requester"}

        return {"can_rate": True, "reason": None}

    async def get_requester_rating_summary_for_browse(
        self,
        requester_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get a compact rating summary for display on browse cards.

        Shows minimal info: overall rating and rating count.
        """
        stats = await self.get_requester_stats(requester_id)
        if not stats:
            return None

        return {
            "rating": stats["avg_overall"],
            "count": stats["total_ratings"],
            "badges": stats["badges"][:2],  # Max 2 badges on card
        }

    async def update_response_time(
        self,
        requester_id: int,
        response_hours: int
    ):
        """
        Track requester response time for stats.

        Called when requester accepts/rejects a review.
        """
        stmt = select(RequesterStats).where(RequesterStats.user_id == requester_id)
        result = await self.db.execute(stmt)
        stats = result.scalar_one_or_none()

        if stats:
            # Running average
            if stats.avg_response_hours is None:
                stats.avg_response_hours = response_hours
            else:
                # Weighted toward recent responses
                stats.avg_response_hours = int(
                    (stats.avg_response_hours * 0.7) + (response_hours * 0.3)
                )

            # Update responsiveness flag based on 48-hour threshold
            if stats.avg_response_hours <= 48:
                stats.is_responsive = True

            await self.db.commit()
