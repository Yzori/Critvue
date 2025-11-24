"""Karma Service for managing user reputation points"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.karma_transaction import KarmaAction, KarmaTransaction
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus


class KarmaService:
    """
    Service for managing karma points and reputation.

    Handles all karma transactions, streak tracking, acceptance rate calculations,
    and tier promotion checks.
    """

    # Karma point values for different actions
    KARMA_VALUES = {
        KarmaAction.REVIEW_SUBMITTED: 5,
        KarmaAction.REVIEW_ACCEPTED: 20,  # Base value, adjusted by rating
        KarmaAction.REVIEW_AUTO_ACCEPTED: 15,
        KarmaAction.REVIEW_REJECTED: -10,
        KarmaAction.DISPUTE_WON: 50,
        KarmaAction.DISPUTE_LOST: -30,
        KarmaAction.CLAIM_ABANDONED: -20,
        KarmaAction.SPAM_PENALTY: -100,
        KarmaAction.STREAK_BONUS_5: 25,
        KarmaAction.STREAK_BONUS_10: 75,
        KarmaAction.STREAK_BONUS_25: 200,
        KarmaAction.PROFILE_COMPLETED: 50,
        KarmaAction.PORTFOLIO_ADDED: 10,
        KarmaAction.PORTFOLIO_FEATURED: 25,
        KarmaAction.DAILY_BONUS: 5,
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def award_karma(
        self,
        user_id: int,
        action: KarmaAction,
        reason: str,
        review_slot_id: Optional[int] = None,
        helpful_rating: Optional[int] = None
    ) -> KarmaTransaction:
        """
        Award or deduct karma points for a user action.

        Args:
            user_id: User to award karma to
            action: The action that triggered karma change
            reason: Human-readable description for user display
            review_slot_id: Optional related review slot
            helpful_rating: Optional helpful rating (1-5) for review acceptance

        Returns:
            The created KarmaTransaction

        Raises:
            ValueError: If user not found or invalid parameters
        """
        # Get user
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        # Calculate points based on action
        points = self.KARMA_VALUES.get(action, 0)

        # Adjust points for review acceptance based on helpful rating
        if action == KarmaAction.REVIEW_ACCEPTED and helpful_rating:
            if helpful_rating == 5:
                points = 40
            elif helpful_rating == 4:
                points = 30
            elif helpful_rating == 3:
                points = 20
            # Below 3 stars, use default (20) or less

        # Update user's total karma
        user.karma_points = (user.karma_points or 0) + points
        balance_after = user.karma_points

        # Ensure karma doesn't go below 0
        if user.karma_points < 0:
            user.karma_points = 0
            balance_after = 0

        # Create transaction record
        transaction = KarmaTransaction(
            user_id=user_id,
            related_review_slot_id=review_slot_id,
            action=action,
            points=points,
            balance_after=balance_after,
            reason=reason,
            created_at=datetime.utcnow()
        )

        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)

        return transaction

    async def update_streak(self, user_id: int) -> Optional[KarmaTransaction]:
        """
        Update user's review streak and award bonuses if applicable.

        Called after a review is submitted. Checks if this is a consecutive day
        and awards streak bonuses at milestones (5, 10, 25 days).

        Args:
            user_id: User to update streak for

        Returns:
            KarmaTransaction if streak bonus was awarded, None otherwise
        """
        user = await self.db.get(User, user_id)
        if not user:
            return None

        now = datetime.utcnow().date()
        last_review = user.last_review_date.date() if user.last_review_date else None

        # Check if this is a new streak day
        if last_review is None:
            # First review ever
            user.current_streak = 1
            user.last_review_date = datetime.utcnow()
        elif last_review == now:
            # Already reviewed today, no streak update
            pass
        elif last_review == now - timedelta(days=1):
            # Consecutive day, increment streak
            user.current_streak += 1
            user.last_review_date = datetime.utcnow()
        else:
            # Streak broken, reset
            user.current_streak = 1
            user.last_review_date = datetime.utcnow()

        # Update longest streak
        if user.current_streak > user.longest_streak:
            user.longest_streak = user.current_streak

        await self.db.commit()

        # Award streak bonuses at milestones
        bonus_transaction = None
        streak = user.current_streak

        if streak == 25:
            bonus_transaction = await self.award_karma(
                user_id=user_id,
                action=KarmaAction.STREAK_BONUS_25,
                reason=f"25-day review streak! Keep up the amazing work!"
            )
        elif streak == 10:
            bonus_transaction = await self.award_karma(
                user_id=user_id,
                action=KarmaAction.STREAK_BONUS_10,
                reason=f"10-day review streak! You're on fire!"
            )
        elif streak == 5:
            bonus_transaction = await self.award_karma(
                user_id=user_id,
                action=KarmaAction.STREAK_BONUS_5,
                reason=f"5-day review streak! Great consistency!"
            )

        return bonus_transaction

    async def calculate_acceptance_rate(self, user_id: int) -> Optional[Decimal]:
        """
        Calculate and cache the user's review acceptance rate.

        Acceptance rate = (accepted reviews) / (accepted + rejected reviews) * 100

        Args:
            user_id: User to calculate rate for

        Returns:
            Acceptance rate as percentage (0-100), or None if no reviews
        """
        user = await self.db.get(User, user_id)
        if not user:
            return None

        # Count accepted and rejected reviews by this user
        stmt = select(
            func.count(ReviewSlot.id).label("total"),
            func.sum(
                case(
                    (ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value, 1),
                    else_=0
                )
            ).label("accepted")
        ).where(
            ReviewSlot.reviewer_id == user_id,
            ReviewSlot.status.in_([
                ReviewSlotStatus.ACCEPTED.value,
                ReviewSlotStatus.REJECTED.value
            ])
        )

        result = await self.db.execute(stmt)
        row = result.first()

        if not row or not row.total or row.total == 0:
            user.acceptance_rate = None
            user.accepted_reviews_count = 0
            await self.db.commit()
            return None

        accepted = row.accepted or 0
        total = row.total

        # Calculate percentage
        acceptance_rate = Decimal(accepted) / Decimal(total) * 100
        acceptance_rate = acceptance_rate.quantize(Decimal("0.01"))

        # Update user record
        user.acceptance_rate = acceptance_rate
        user.accepted_reviews_count = accepted
        await self.db.commit()

        return acceptance_rate

    async def get_karma_history(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[KarmaTransaction]:
        """
        Get karma transaction history for a user.

        Args:
            user_id: User to get history for
            limit: Maximum number of transactions to return
            offset: Number of transactions to skip

        Returns:
            List of KarmaTransaction objects, most recent first
        """
        stmt = (
            select(KarmaTransaction)
            .where(KarmaTransaction.user_id == user_id)
            .order_by(KarmaTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_karma_summary(self, user_id: int) -> Dict[str, Any]:
        """
        Get a summary of user's karma statistics.

        Args:
            user_id: User to get summary for

        Returns:
            Dictionary with karma statistics
        """
        user = await self.db.get(User, user_id)
        if not user:
            return {}

        # Get total transactions by type
        stmt = select(
            KarmaTransaction.action,
            func.count(KarmaTransaction.id).label("count"),
            func.sum(KarmaTransaction.points).label("total_points")
        ).where(
            KarmaTransaction.user_id == user_id
        ).group_by(
            KarmaTransaction.action
        )

        result = await self.db.execute(stmt)
        transactions_by_action = {
            row.action: {
                "count": row.count,
                "total_points": row.total_points
            }
            for row in result
        }

        return {
            "total_karma": user.karma_points,
            "acceptance_rate": float(user.acceptance_rate) if user.acceptance_rate else None,
            "accepted_reviews_count": user.accepted_reviews_count,
            "current_streak": user.current_streak,
            "longest_streak": user.longest_streak,
            "last_review_date": user.last_review_date.isoformat() if user.last_review_date else None,
            "transactions_by_action": transactions_by_action
        }

    async def award_daily_bonus(self, user_id: int) -> Optional[KarmaTransaction]:
        """
        Award daily bonus if this is the user's first review of the day.

        Args:
            user_id: User to check for daily bonus

        Returns:
            KarmaTransaction if bonus was awarded, None otherwise
        """
        user = await self.db.get(User, user_id)
        if not user:
            return None

        now = datetime.utcnow()
        today = now.date()

        # Check if already reviewed today
        if user.last_review_date:
            last_review_date = user.last_review_date.date()
            if last_review_date == today:
                # Already reviewed today, no daily bonus
                return None

        # Award daily bonus
        return await self.award_karma(
            user_id=user_id,
            action=KarmaAction.DAILY_BONUS,
            reason="First review of the day!"
        )

    async def check_tier_promotion(self, user_id: int) -> bool:
        """
        Check if user qualifies for tier promotion.

        This is called after karma changes. The actual promotion logic
        is handled by TierService.

        Args:
            user_id: User to check

        Returns:
            True if user qualifies for promotion
        """
        # Import here to avoid circular dependency
        from app.services.tier_service import TierService

        tier_service = TierService(self.db)
        return await tier_service.check_and_promote_user(user_id)
