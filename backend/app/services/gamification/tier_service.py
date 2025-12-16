"""Tier Service for managing user tier progression and permissions"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserTier
from app.models.tier_milestone import TierMilestone
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.core.exceptions import NotFoundError


class TierService:
    """
    Service for managing user tier system.

    Handles tier requirements, promotions, and permission checks.
    """

    # Tier requirements structure
    TIER_REQUIREMENTS = {
        UserTier.NEWCOMER: {
            "sparks_min": 0,
            "accepted_reviews_min": 0,
            "acceptance_rate_min": None,
            "avg_helpful_rating_min": None,
            "can_accept_paid": False,
            "weekly_paid_limit": 0,
            "paid_tier_min": None,
            "paid_tier_max": None,
        },
        UserTier.SUPPORTER: {
            "sparks_min": 100,
            "accepted_reviews_min": 5,
            "acceptance_rate_min": None,
            "avg_helpful_rating_min": None,
            "can_accept_paid": False,
            "weekly_paid_limit": 0,
            "paid_tier_min": None,
            "paid_tier_max": None,
        },
        UserTier.GUIDE: {
            "sparks_min": 500,
            "accepted_reviews_min": 25,
            "acceptance_rate_min": 75.0,
            "avg_helpful_rating_min": None,
            "can_accept_paid": False,
            "weekly_paid_limit": 0,
            "paid_tier_min": None,
            "paid_tier_max": None,
        },
        UserTier.MENTOR: {
            "sparks_min": 1500,
            "accepted_reviews_min": 75,
            "acceptance_rate_min": 80.0,
            "avg_helpful_rating_min": 4.0,
            "can_accept_paid": True,
            "weekly_paid_limit": 3,
            "paid_tier_min": None,  # Can accept any budget up to $25
            "paid_tier_max": 25,
        },
        UserTier.CURATOR: {
            "sparks_min": 5000,
            "accepted_reviews_min": 200,
            "acceptance_rate_min": 85.0,
            "avg_helpful_rating_min": 4.3,
            "can_accept_paid": True,
            "weekly_paid_limit": 10,
            "paid_tier_min": None,  # Can accept any budget up to $100
            "paid_tier_max": 100,
        },
        UserTier.VISIONARY: {
            "sparks_min": 15000,
            "accepted_reviews_min": 500,
            "acceptance_rate_min": 90.0,
            "avg_helpful_rating_min": 4.5,
            "can_accept_paid": True,
            "weekly_paid_limit": None,  # Unlimited
            "paid_tier_min": None,  # Can accept all paid reviews
            "paid_tier_max": None,  # No upper limit
        },
    }

    # Tier order for progression
    TIER_ORDER = [
        UserTier.NEWCOMER,
        UserTier.SUPPORTER,
        UserTier.GUIDE,
        UserTier.MENTOR,
        UserTier.CURATOR,
        UserTier.VISIONARY,
    ]

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_tier_requirements(self, tier: UserTier) -> Dict[str, Any]:
        """
        Get requirements for a specific tier.

        Args:
            tier: The tier to get requirements for

        Returns:
            Dictionary of tier requirements
        """
        return self.TIER_REQUIREMENTS[tier].copy()

    async def check_tier_requirements(self, user: User, tier: UserTier) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if user meets requirements for a tier.

        Args:
            user: User to check
            tier: Tier to check requirements for

        Returns:
            Tuple of (meets_requirements, details_dict)
        """
        requirements = self.TIER_REQUIREMENTS[tier]
        details = {}

        # Check sparks
        sparks_met = (user.sparks_points or 0) >= requirements["sparks_min"]
        details["sparks"] = {
            "required": requirements["sparks_min"],
            "current": user.sparks_points or 0,
            "met": sparks_met
        }

        # Check accepted reviews count
        accepted_count_met = user.accepted_reviews_count >= requirements["accepted_reviews_min"]
        details["accepted_reviews"] = {
            "required": requirements["accepted_reviews_min"],
            "current": user.accepted_reviews_count,
            "met": accepted_count_met
        }

        # Check acceptance rate
        if requirements["acceptance_rate_min"] is not None:
            acceptance_rate = float(user.acceptance_rate or 0)
            acceptance_rate_met = acceptance_rate >= requirements["acceptance_rate_min"]
            details["acceptance_rate"] = {
                "required": requirements["acceptance_rate_min"],
                "current": acceptance_rate,
                "met": acceptance_rate_met
            }
        else:
            acceptance_rate_met = True
            details["acceptance_rate"] = {
                "required": None,
                "current": float(user.acceptance_rate or 0),
                "met": True
            }

        # Check average helpful rating
        if requirements["avg_helpful_rating_min"] is not None:
            avg_rating = await self._calculate_avg_helpful_rating(user.id)
            avg_rating_met = avg_rating is not None and avg_rating >= requirements["avg_helpful_rating_min"]
            details["avg_helpful_rating"] = {
                "required": requirements["avg_helpful_rating_min"],
                "current": avg_rating,
                "met": avg_rating_met
            }
        else:
            avg_rating_met = True
            avg_rating = await self._calculate_avg_helpful_rating(user.id)
            details["avg_helpful_rating"] = {
                "required": None,
                "current": avg_rating,
                "met": True
            }

        # All requirements must be met
        meets_requirements = all([
            sparks_met,
            accepted_count_met,
            acceptance_rate_met,
            avg_rating_met
        ])

        return meets_requirements, details

    async def _calculate_avg_helpful_rating(self, user_id: int) -> Optional[float]:
        """
        Calculate average helpful rating from accepted reviews.

        Args:
            user_id: User to calculate for

        Returns:
            Average helpful rating, or None if no ratings
        """
        stmt = select(
            func.avg(ReviewSlot.requester_helpful_rating)
        ).where(
            ReviewSlot.reviewer_id == user_id,
            ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
            ReviewSlot.requester_helpful_rating.isnot(None)
        )

        result = await self.db.execute(stmt)
        avg_rating = result.scalar()

        return float(avg_rating) if avg_rating else None

    async def promote_to_tier(
        self,
        user_id: int,
        new_tier: UserTier,
        reason: str
    ) -> TierMilestone:
        """
        Promote user to a new tier.

        Args:
            user_id: User to promote
            new_tier: Tier to promote to
            reason: Reason for promotion

        Returns:
            Created TierMilestone

        Raises:
            ValueError: If user not found or invalid tier
        """
        user = await self.db.get(User, user_id)
        if not user:
            raise NotFoundError(resource="User", resource_id=user_id)

        # Record old tier
        old_tier = user.user_tier

        # Update user tier
        user.user_tier = new_tier
        user.tier_achieved_at = datetime.utcnow()

        # Create milestone record
        milestone = TierMilestone(
            user_id=user_id,
            from_tier=old_tier,
            to_tier=new_tier,
            reason=reason,
            sparks_at_promotion=user.sparks_points or 0,
            achieved_at=datetime.utcnow()
        )

        self.db.add(milestone)
        await self.db.commit()
        await self.db.refresh(milestone)

        return milestone

    async def check_and_promote_user(self, user_id: int) -> bool:
        """
        Check if user qualifies for tier promotion and promote if eligible.

        Checks the next tier in progression. If user meets requirements,
        promotes them automatically.

        Args:
            user_id: User to check

        Returns:
            True if user was promoted, False otherwise
        """
        user = await self.db.get(User, user_id)
        if not user:
            return False

        current_tier = user.user_tier
        current_index = self.TIER_ORDER.index(current_tier)

        # Check if already at max tier
        if current_index >= len(self.TIER_ORDER) - 1:
            return False

        # Check next tier
        next_tier = self.TIER_ORDER[current_index + 1]
        meets_requirements, details = await self.check_tier_requirements(user, next_tier)

        if meets_requirements:
            # Promote user
            await self.promote_to_tier(
                user_id=user_id,
                new_tier=next_tier,
                reason=f"Achieved {next_tier.value} tier requirements"
            )
            return True

        return False

    async def can_claim_paid_review(
        self,
        user: User,
        review_budget: float
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if user's tier allows claiming a paid review.

        Args:
            user: User attempting to claim
            review_budget: Budget of the review to claim

        Returns:
            Tuple of (can_claim, reason_if_cannot)
        """
        requirements = self.TIER_REQUIREMENTS[user.user_tier]

        # Check if tier allows paid reviews at all
        if not requirements["can_accept_paid"]:
            return False, f"Tier {user.user_tier.value} cannot accept paid reviews. Reach {UserTier.MENTOR.value} tier to unlock paid reviews."

        # Check budget range for tier
        min_budget = requirements["paid_tier_min"]
        max_budget = requirements["paid_tier_max"]

        if min_budget is not None and review_budget < min_budget:
            return False, f"Review budget ${review_budget} is below your tier minimum of ${min_budget}"

        if max_budget is not None and review_budget > max_budget:
            return False, f"Review budget ${review_budget} exceeds your tier maximum of ${max_budget}. Reach {self._get_next_paid_tier(user.user_tier).value} tier to accept higher-paid reviews."

        # Check weekly claim limit
        weekly_limit = requirements["weekly_paid_limit"]
        if weekly_limit is not None:
            claims_this_week = await self._count_weekly_claims(user.id)
            if claims_this_week >= weekly_limit:
                return False, f"Weekly paid review limit reached ({weekly_limit}). Limit resets on Monday."

        return True, None

    def _get_next_paid_tier(self, current_tier: UserTier) -> UserTier:
        """Get the next tier that allows higher paid reviews"""
        if current_tier == UserTier.MENTOR:
            return UserTier.CURATOR
        elif current_tier == UserTier.CURATOR:
            return UserTier.VISIONARY
        return UserTier.VISIONARY

    async def _count_weekly_claims(self, user_id: int) -> int:
        """
        Count number of paid reviews claimed this week.

        Week starts on Monday.

        Args:
            user_id: User to count claims for

        Returns:
            Number of paid reviews claimed this week
        """
        # Calculate start of current week (Monday)
        now = datetime.utcnow()
        days_since_monday = now.weekday()
        week_start = (now - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        stmt = select(func.count(ReviewSlot.id)).where(
            ReviewSlot.reviewer_id == user_id,
            ReviewSlot.claimed_at >= week_start,
            ReviewSlot.payment_amount.isnot(None),
            ReviewSlot.payment_amount > 0
        )

        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def get_tier_progress(self, user_id: int) -> Dict[str, Any]:
        """
        Get user's progress towards next tier.

        Args:
            user_id: User to get progress for

        Returns:
            Dictionary with current tier, next tier, and progress details
        """
        user = await self.db.get(User, user_id)
        if not user:
            return {}

        current_tier = user.user_tier
        current_index = self.TIER_ORDER.index(current_tier)

        result = {
            "current_tier": current_tier.value,
            "tier_achieved_at": user.tier_achieved_at.isoformat() if user.tier_achieved_at else None,
            "sparks_points": user.sparks_points,
            "can_accept_paid": self.TIER_REQUIREMENTS[current_tier]["can_accept_paid"],
            "weekly_paid_limit": self.TIER_REQUIREMENTS[current_tier]["weekly_paid_limit"],
        }

        # Check if at max tier
        if current_index >= len(self.TIER_ORDER) - 1:
            result["next_tier"] = None
            result["progress"] = None
            result["at_max_tier"] = True
        else:
            next_tier = self.TIER_ORDER[current_index + 1]
            meets_requirements, details = await self.check_tier_requirements(user, next_tier)

            result["next_tier"] = next_tier.value
            result["meets_requirements"] = meets_requirements
            result["progress"] = details
            result["at_max_tier"] = False

        return result

    async def get_tier_milestones(
        self,
        user_id: int,
        limit: int = 10
    ) -> list[TierMilestone]:
        """
        Get user's tier progression history.

        Args:
            user_id: User to get milestones for
            limit: Maximum number of milestones to return

        Returns:
            List of TierMilestone objects, most recent first
        """
        stmt = (
            select(TierMilestone)
            .where(TierMilestone.user_id == user_id)
            .order_by(TierMilestone.achieved_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def fast_track_to_visionary(
        self,
        user_id: int,
        reason: str = "Visionary application approved"
    ) -> TierMilestone:
        """
        Fast-track user to VISIONARY tier (expert application path).

        Sets expert_application_approved flag and awards 15,000 sparks
        to match the minimum requirement.

        Args:
            user_id: User to promote
            reason: Reason for fast-track

        Returns:
            Created TierMilestone
        """
        user = await self.db.get(User, user_id)
        if not user:
            raise NotFoundError(resource="User", resource_id=user_id)

        # Set expert application flag
        user.expert_application_approved = True

        # Award minimum sparks if below threshold
        if (user.sparks_points or 0) < 15000:
            user.sparks_points = 15000

        # Promote to VISIONARY
        milestone = await self.promote_to_tier(
            user_id=user_id,
            new_tier=UserTier.VISIONARY,
            reason=reason
        )

        return milestone
