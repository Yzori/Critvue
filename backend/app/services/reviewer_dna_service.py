"""
Reviewer DNA Service

Calculates and manages the unique "DNA fingerprint" for each reviewer
based on their review history across 6 dimensions:
- Speed: How quickly they complete reviews
- Depth: Thoroughness of feedback
- Specificity: Actionable suggestions per review
- Constructiveness: Balance of positive/constructive feedback
- Technical: Domain expertise accuracy
- Encouragement: Supportive language score
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reviewer_dna import ReviewerDNA
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.review_request import ReviewRequest


class ReviewerDNAService:
    """
    Service for calculating and managing Reviewer DNA profiles.

    DNA dimensions are calculated on a 0-100 scale based on
    actual review performance data.
    """

    # Minimum reviews needed for reliable DNA calculation
    MIN_REVIEWS_FOR_DNA = 3

    # Weight configuration for overall score
    DIMENSION_WEIGHTS = {
        "speed": 0.15,
        "depth": 0.20,
        "specificity": 0.20,
        "constructiveness": 0.20,
        "technical": 0.15,
        "encouragement": 0.10,
    }

    # Target values for normalization
    TARGETS = {
        "response_time_hours": 24,  # Ideal response time
        "word_count": 200,  # Target feedback length
        "action_items": 3,  # Target actionable items
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_dna(self, user_id: int) -> Optional[ReviewerDNA]:
        """
        Get existing DNA profile or create one with defaults.

        Args:
            user_id: The reviewer's user ID

        Returns:
            ReviewerDNA object or None if user doesn't exist
        """
        # Check if user exists
        user = await self.db.get(User, user_id)
        if not user:
            return None

        # Try to get existing DNA
        stmt = select(ReviewerDNA).where(ReviewerDNA.user_id == user_id)
        result = await self.db.execute(stmt)
        dna = result.scalar_one_or_none()

        if dna:
            return dna

        # Create new DNA with defaults (all at 50 = baseline)
        dna = ReviewerDNA(
            user_id=user_id,
            speed=50.0,
            depth=50.0,
            specificity=50.0,
            constructiveness=50.0,
            technical=50.0,
            encouragement=50.0,
            overall_score=50.0,
            reviews_analyzed=0,
            version=1,
        )

        self.db.add(dna)
        await self.db.commit()
        await self.db.refresh(dna)

        return dna

    async def calculate_dna(self, user_id: int) -> Optional[ReviewerDNA]:
        """
        Calculate DNA dimensions based on review history.

        Args:
            user_id: The reviewer's user ID

        Returns:
            Updated ReviewerDNA object
        """
        dna = await self.get_or_create_dna(user_id)
        if not dna:
            return None

        # Get completed reviews by this user
        reviews_data = await self._get_review_metrics(user_id)

        if reviews_data["total_reviews"] < self.MIN_REVIEWS_FOR_DNA:
            # Not enough data - return defaults
            return dna

        # Calculate each dimension
        dna.speed = self._calculate_speed(reviews_data)
        dna.depth = self._calculate_depth(reviews_data)
        dna.specificity = self._calculate_specificity(reviews_data)
        dna.constructiveness = self._calculate_constructiveness(reviews_data)
        dna.technical = self._calculate_technical(reviews_data)
        dna.encouragement = self._calculate_encouragement(reviews_data)

        # Calculate overall weighted score
        dna.overall_score = dna.calculate_overall()

        # Update metadata
        dna.reviews_analyzed = reviews_data["total_reviews"]
        dna.version += 1
        dna.calculated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(dna)

        return dna

    async def _get_review_metrics(self, user_id: int) -> Dict[str, Any]:
        """
        Gather raw metrics from review history for DNA calculation.

        Returns dict with aggregated review statistics.
        """
        # Get review slots completed by this reviewer
        stmt = select(ReviewSlot).where(
            ReviewSlot.reviewer_id == user_id,
            ReviewSlot.status.in_([
                ReviewSlotStatus.SUBMITTED.value,
                ReviewSlotStatus.ACCEPTED.value,
                ReviewSlotStatus.REJECTED.value,
                ReviewSlotStatus.AUTO_ACCEPTED.value,
            ])
        )
        result = await self.db.execute(stmt)
        slots = list(result.scalars().all())

        if not slots:
            return {"total_reviews": 0}

        # Calculate metrics
        total_reviews = len(slots)
        response_times = []
        word_counts = []
        action_items_counts = []
        ratings = []
        accepted_count = 0
        rejected_count = 0

        for slot in slots:
            # Response time (hours from claim to submit)
            if slot.claimed_at and slot.submitted_at:
                delta = slot.submitted_at - slot.claimed_at
                hours = delta.total_seconds() / 3600
                response_times.append(min(hours, 168))  # Cap at 1 week

            # Feedback analysis
            if slot.feedback_text:
                word_counts.append(len(slot.feedback_text.split()))
                # Count actionable items (sentences with "should", "try", "consider", etc.)
                action_items_counts.append(self._count_action_items(slot.feedback_text))

            # Ratings and acceptance
            if slot.helpful_rating:
                ratings.append(slot.helpful_rating)

            if slot.status == ReviewSlotStatus.ACCEPTED.value:
                accepted_count += 1
            elif slot.status == ReviewSlotStatus.REJECTED.value:
                rejected_count += 1

        return {
            "total_reviews": total_reviews,
            "response_times": response_times,
            "avg_response_time": sum(response_times) / len(response_times) if response_times else 48,
            "word_counts": word_counts,
            "avg_word_count": sum(word_counts) / len(word_counts) if word_counts else 100,
            "action_items_counts": action_items_counts,
            "avg_action_items": sum(action_items_counts) / len(action_items_counts) if action_items_counts else 2,
            "ratings": ratings,
            "avg_rating": sum(ratings) / len(ratings) if ratings else 3.5,
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "acceptance_rate": accepted_count / (accepted_count + rejected_count) if (accepted_count + rejected_count) > 0 else 0.8,
        }

    def _count_action_items(self, feedback_text: str) -> int:
        """Count actionable suggestions in feedback text."""
        action_keywords = [
            "should", "could", "try", "consider", "recommend",
            "suggest", "would", "improve", "add", "remove",
            "change", "update", "fix", "refactor", "optimize"
        ]

        text_lower = feedback_text.lower()
        count = 0

        for keyword in action_keywords:
            count += text_lower.count(keyword)

        # Rough estimate: 1 action item per 2-3 keywords
        return max(1, count // 2)

    def _calculate_speed(self, data: Dict[str, Any]) -> float:
        """
        Calculate speed score (0-100).

        Lower response times = higher score.
        24 hours or less = 100, scales down from there.
        """
        avg_time = data.get("avg_response_time", 48)
        target = self.TARGETS["response_time_hours"]

        if avg_time <= target:
            return 100.0
        elif avg_time >= target * 4:  # 4 days
            return 20.0
        else:
            # Linear scale from 100 to 20 between target and 4x target
            ratio = (avg_time - target) / (target * 3)
            return max(20.0, 100.0 - (ratio * 80))

    def _calculate_depth(self, data: Dict[str, Any]) -> float:
        """
        Calculate depth score (0-100).

        Based on average word count of feedback.
        200+ words = 100, scales down below that.
        """
        avg_words = data.get("avg_word_count", 100)
        target = self.TARGETS["word_count"]

        if avg_words >= target:
            # Bonus for very thorough reviews, cap at 100
            return min(100.0, 50 + (avg_words / target) * 50)
        else:
            # Scale up to 50 below target
            return max(20.0, (avg_words / target) * 50)

    def _calculate_specificity(self, data: Dict[str, Any]) -> float:
        """
        Calculate specificity score (0-100).

        Based on actionable items per review.
        3+ items = 100, scales down below that.
        """
        avg_items = data.get("avg_action_items", 2)
        target = self.TARGETS["action_items"]

        if avg_items >= target:
            return min(100.0, 50 + (avg_items / target) * 50)
        else:
            return max(20.0, (avg_items / target) * 50)

    def _calculate_constructiveness(self, data: Dict[str, Any]) -> float:
        """
        Calculate constructiveness score (0-100).

        Based on acceptance rate and average rating.
        High acceptance + high ratings = constructive feedback.
        """
        acceptance_rate = data.get("acceptance_rate", 0.8)
        avg_rating = data.get("avg_rating", 3.5)

        # Combine acceptance rate (0-1) and rating (1-5) into score
        acceptance_component = acceptance_rate * 50  # 0-50
        rating_component = ((avg_rating - 1) / 4) * 50  # 0-50

        return min(100.0, max(20.0, acceptance_component + rating_component))

    def _calculate_technical(self, data: Dict[str, Any]) -> float:
        """
        Calculate technical accuracy score (0-100).

        For now, based on ratings as a proxy for technical accuracy.
        Future: could incorporate specific domain expertise signals.
        """
        avg_rating = data.get("avg_rating", 3.5)

        # Rating 5 = 100, Rating 1 = 20
        return max(20.0, 20 + ((avg_rating - 1) / 4) * 80)

    def _calculate_encouragement(self, data: Dict[str, Any]) -> float:
        """
        Calculate encouragement score (0-100).

        Based on a combination of acceptance rate (proxy for tone)
        and depth (thorough feedback tends to be more supportive).
        """
        acceptance_rate = data.get("acceptance_rate", 0.8)
        avg_words = data.get("avg_word_count", 100)

        # Accepted reviews indicate positive, helpful tone
        acceptance_component = acceptance_rate * 60  # 0-60

        # Longer feedback often has more encouraging language
        depth_component = min(40.0, (avg_words / 200) * 40)  # 0-40

        return min(100.0, max(20.0, acceptance_component + depth_component))

    async def get_dna_summary(self, user_id: int) -> Dict[str, Any]:
        """
        Get DNA summary for API response.

        Args:
            user_id: The reviewer's user ID

        Returns:
            Dictionary with DNA data and insights
        """
        dna = await self.get_or_create_dna(user_id)
        if not dna:
            return {}

        # Get dimension data
        dimensions = [
            {"name": "Speed", "key": "speed", "value": round(dna.speed, 1)},
            {"name": "Depth", "key": "depth", "value": round(dna.depth, 1)},
            {"name": "Specificity", "key": "specificity", "value": round(dna.specificity, 1)},
            {"name": "Constructiveness", "key": "constructiveness", "value": round(dna.constructiveness, 1)},
            {"name": "Technical", "key": "technical", "value": round(dna.technical, 1)},
            {"name": "Encouragement", "key": "encouragement", "value": round(dna.encouragement, 1)},
        ]

        # Find strengths (top 2 dimensions)
        sorted_dims = sorted(dimensions, key=lambda x: x["value"], reverse=True)
        strengths = [d["name"] for d in sorted_dims[:2]]

        # Find growth areas (bottom 2 dimensions)
        growth_areas = [d["name"] for d in sorted_dims[-2:]]

        return {
            "user_id": user_id,
            "overall_score": round(dna.overall_score, 1),
            "dimensions": dimensions,
            "strengths": strengths,
            "growth_areas": growth_areas,
            "reviews_analyzed": dna.reviews_analyzed,
            "version": dna.version,
            "calculated_at": dna.calculated_at.isoformat() if dna.calculated_at else None,
            "has_sufficient_data": dna.reviews_analyzed >= self.MIN_REVIEWS_FOR_DNA,
        }

    async def recalculate_all_dna(self) -> int:
        """
        Recalculate DNA for all reviewers.

        Called periodically or after system updates.

        Returns:
            Number of profiles updated
        """
        # Get all users who have given reviews
        stmt = select(ReviewSlot.reviewer_id).where(
            ReviewSlot.reviewer_id.isnot(None),
            ReviewSlot.status.in_([
                ReviewSlotStatus.SUBMITTED.value,
                ReviewSlotStatus.ACCEPTED.value,
                ReviewSlotStatus.AUTO_ACCEPTED.value,
            ])
        ).distinct()

        result = await self.db.execute(stmt)
        reviewer_ids = [row[0] for row in result.all()]

        updated = 0
        for user_id in reviewer_ids:
            dna = await self.calculate_dna(user_id)
            if dna:
                updated += 1

        return updated

    async def compare_to_average(self, user_id: int) -> Dict[str, Any]:
        """
        Compare user's DNA to platform average.

        Returns difference from average for each dimension.
        """
        dna = await self.get_or_create_dna(user_id)
        if not dna:
            return {}

        # Get platform averages
        stmt = select(
            func.avg(ReviewerDNA.speed).label("avg_speed"),
            func.avg(ReviewerDNA.depth).label("avg_depth"),
            func.avg(ReviewerDNA.specificity).label("avg_specificity"),
            func.avg(ReviewerDNA.constructiveness).label("avg_constructiveness"),
            func.avg(ReviewerDNA.technical).label("avg_technical"),
            func.avg(ReviewerDNA.encouragement).label("avg_encouragement"),
            func.avg(ReviewerDNA.overall_score).label("avg_overall"),
        ).where(ReviewerDNA.reviews_analyzed >= self.MIN_REVIEWS_FOR_DNA)

        result = await self.db.execute(stmt)
        row = result.first()

        if not row or row.avg_overall is None:
            # No data to compare against
            return {"comparison_available": False}

        return {
            "comparison_available": True,
            "speed": {
                "user": round(dna.speed, 1),
                "average": round(float(row.avg_speed), 1),
                "diff": round(dna.speed - float(row.avg_speed), 1),
            },
            "depth": {
                "user": round(dna.depth, 1),
                "average": round(float(row.avg_depth), 1),
                "diff": round(dna.depth - float(row.avg_depth), 1),
            },
            "specificity": {
                "user": round(dna.specificity, 1),
                "average": round(float(row.avg_specificity), 1),
                "diff": round(dna.specificity - float(row.avg_specificity), 1),
            },
            "constructiveness": {
                "user": round(dna.constructiveness, 1),
                "average": round(float(row.avg_constructiveness), 1),
                "diff": round(dna.constructiveness - float(row.avg_constructiveness), 1),
            },
            "technical": {
                "user": round(dna.technical, 1),
                "average": round(float(row.avg_technical), 1),
                "diff": round(dna.technical - float(row.avg_technical), 1),
            },
            "encouragement": {
                "user": round(dna.encouragement, 1),
                "average": round(float(row.avg_encouragement), 1),
                "diff": round(dna.encouragement - float(row.avg_encouragement), 1),
            },
            "overall": {
                "user": round(dna.overall_score, 1),
                "average": round(float(row.avg_overall), 1),
                "diff": round(dna.overall_score - float(row.avg_overall), 1),
            },
        }
