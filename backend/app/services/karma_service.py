"""Karma Service for managing user reputation points - Modern System"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import func, select, case, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.karma_transaction import KarmaAction, KarmaTransaction
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus


class KarmaService:
    """
    Modern Karma Service for managing XP, reputation, and engagement.

    Key improvements over legacy system:
    - XP (permanent) + Reputation (variable) split
    - Graduated penalty system with warnings
    - Streak shields and weekend grace
    - Weekly goal system
    - Low rating karma reduction
    - Reputation decay for inactivity
    """

    # Karma point values for different actions
    KARMA_VALUES = {
        # Core review actions
        KarmaAction.REVIEW_SUBMITTED: 5,
        KarmaAction.REVIEW_ACCEPTED: 20,  # Base value, adjusted by rating
        KarmaAction.REVIEW_AUTO_ACCEPTED: 15,
        KarmaAction.REVIEW_REJECTED: -10,

        # Rating-based karma (replaces flat REVIEW_ACCEPTED)
        KarmaAction.HELPFUL_RATING_5: 40,
        KarmaAction.HELPFUL_RATING_4: 30,
        KarmaAction.HELPFUL_RATING_3: 20,
        KarmaAction.HELPFUL_RATING_2: 5,   # Reduced for poor ratings
        KarmaAction.HELPFUL_RATING_1: 0,   # No reward for very poor

        # Disputes
        KarmaAction.DISPUTE_WON: 50,
        KarmaAction.DISPUTE_LOST: -30,

        # Penalties (graduated system)
        KarmaAction.WARNING_ISSUED: 0,  # Just a warning, no karma
        KarmaAction.CLAIM_ABANDONED: -20,
        KarmaAction.CLAIM_ABANDONED_REPEAT: -40,  # Harsher for repeat offenders
        KarmaAction.SPAM_PENALTY: -100,

        # Daily streaks
        KarmaAction.STREAK_BONUS_5: 25,
        KarmaAction.STREAK_BONUS_10: 75,
        KarmaAction.STREAK_BONUS_25: 200,
        KarmaAction.STREAK_SHIELD_USED: 0,
        KarmaAction.STREAK_SHIELD_EARNED: 0,

        # Weekly goals
        KarmaAction.WEEKLY_GOAL_MET: 30,
        KarmaAction.WEEKLY_GOAL_EXCEEDED: 50,
        KarmaAction.WEEKLY_STREAK_BONUS_4: 100,
        KarmaAction.WEEKLY_STREAK_BONUS_12: 500,

        # Badges (base value, actual varies by badge)
        KarmaAction.BADGE_EARNED: 25,

        # Profile
        KarmaAction.PROFILE_COMPLETED: 50,
        KarmaAction.PORTFOLIO_ADDED: 10,
        KarmaAction.PORTFOLIO_FEATURED: 25,

        # Misc
        KarmaAction.DAILY_BONUS: 5,
        KarmaAction.TIER_PROMOTION: 100,
        KarmaAction.QUALITY_BONUS: 10,

        # Reputation (not karma points)
        KarmaAction.REPUTATION_DECAY: 0,  # Affects reputation_score, not karma
        KarmaAction.REPUTATION_RESTORED: 0,

        # Seasonal
        KarmaAction.LEADERBOARD_REWARD: 0,  # Variable based on rank
        KarmaAction.SEASONAL_BONUS: 0,  # Variable
    }

    # XP multipliers (XP = karma * multiplier for positive actions)
    XP_MULTIPLIER = 1.0  # 1:1 ratio by default

    # Reputation decay settings
    DECAY_START_DAYS = 14  # Start decaying after 14 days inactive
    DECAY_RATE_PER_WEEK = 5  # Lose 5 reputation points per week
    DECAY_FLOOR = 50  # Reputation can't go below 50

    # Warning expiry
    WARNING_EXPIRY_DAYS = 30  # Warnings expire after 30 days

    def __init__(self, db: AsyncSession):
        self.db = db

    async def award_karma(
        self,
        user_id: int,
        action: KarmaAction,
        reason: str,
        review_slot_id: Optional[int] = None,
        helpful_rating: Optional[int] = None,
        custom_points: Optional[int] = None
    ) -> KarmaTransaction:
        """
        Award or deduct karma/XP points for a user action.

        Modern system:
        - Positive actions add to both karma_points and xp_points
        - Negative actions only reduce karma_points (XP is permanent)
        - reputation_score is updated separately via decay/activity

        Args:
            user_id: User to award karma to
            action: The action that triggered karma change
            reason: Human-readable description for user display
            review_slot_id: Optional related review slot
            helpful_rating: Optional helpful rating (1-5) for review acceptance
            custom_points: Override default points (for badges, rewards)

        Returns:
            The created KarmaTransaction
        """
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        # Calculate points based on action
        if custom_points is not None:
            points = custom_points
        else:
            points = self.KARMA_VALUES.get(action, 0)

        # Use rating-specific action if helpful_rating provided
        if action == KarmaAction.REVIEW_ACCEPTED and helpful_rating:
            rating_action = {
                5: KarmaAction.HELPFUL_RATING_5,
                4: KarmaAction.HELPFUL_RATING_4,
                3: KarmaAction.HELPFUL_RATING_3,
                2: KarmaAction.HELPFUL_RATING_2,
                1: KarmaAction.HELPFUL_RATING_1,
            }.get(helpful_rating, action)
            points = self.KARMA_VALUES.get(rating_action, points)
            action = rating_action

        # Update user's karma (can go negative temporarily)
        user.karma_points = (user.karma_points or 0) + points
        if user.karma_points < 0:
            user.karma_points = 0

        # Update XP (only for positive actions - XP never decreases)
        if points > 0:
            xp_earned = int(points * self.XP_MULTIPLIER)
            user.xp_points = (user.xp_points or 0) + xp_earned

        # Update last active date (resets decay timer)
        user.last_active_date = datetime.utcnow()

        # Restore reputation if returning from inactivity
        if user.reputation_score < 100:
            user.reputation_score = min(100, user.reputation_score + 5)

        balance_after = user.karma_points

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

    async def process_claim_abandoned(
        self,
        user_id: int,
        review_slot_id: Optional[int] = None
    ) -> Tuple[KarmaTransaction, bool]:
        """
        Process an abandoned claim with graduated penalty system.

        First offense: Warning only (no karma loss)
        Second offense within 30 days: -20 karma
        Third+ offense: -40 karma

        Args:
            user_id: User who abandoned the claim
            review_slot_id: The abandoned review slot

        Returns:
            Tuple of (transaction, was_warning_only)
        """
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        # Check if warnings have expired
        warning_count = user.warning_count or 0
        if user.last_warning_at:
            days_since_warning = (datetime.utcnow() - user.last_warning_at).days
            if days_since_warning > self.WARNING_EXPIRY_DAYS:
                warning_count = 0  # Reset warnings
                user.warning_count = 0

        # Determine action based on warning count
        if warning_count == 0:
            # First offense: warning only
            user.warning_count = 1
            user.last_warning_at = datetime.utcnow()
            transaction = await self.award_karma(
                user_id=user_id,
                action=KarmaAction.WARNING_ISSUED,
                reason="Warning: Abandoned claim. Future abandonments will result in karma penalties.",
                review_slot_id=review_slot_id
            )
            return transaction, True  # Was warning only
        elif warning_count == 1:
            # Second offense: standard penalty
            user.warning_count = 2
            user.last_warning_at = datetime.utcnow()
            transaction = await self.award_karma(
                user_id=user_id,
                action=KarmaAction.CLAIM_ABANDONED,
                reason="Penalty: Abandoned claim (second offense within 30 days)",
                review_slot_id=review_slot_id
            )
            return transaction, False
        else:
            # Third+ offense: harsh penalty
            user.warning_count += 1
            user.last_warning_at = datetime.utcnow()
            user.penalty_multiplier = min(Decimal("2.0"), (user.penalty_multiplier or Decimal("1.0")) + Decimal("0.25"))
            transaction = await self.award_karma(
                user_id=user_id,
                action=KarmaAction.CLAIM_ABANDONED_REPEAT,
                reason=f"Penalty: Abandoned claim (repeat offense #{user.warning_count})",
                review_slot_id=review_slot_id
            )
            return transaction, False

    async def update_streak(self, user_id: int) -> Optional[KarmaTransaction]:
        """
        Update user's review streak with shield and weekend grace support.

        Features:
        - Weekend grace: Missing Sat/Sun doesn't break streak
        - Streak shields: Can use a shield to protect streak once
        - Progressive bonuses at 5, 10, 25 days

        Args:
            user_id: User to update streak for

        Returns:
            KarmaTransaction if streak bonus was awarded, None otherwise
        """
        user = await self.db.get(User, user_id)
        if not user:
            return None

        now = datetime.utcnow()
        today = now.date()
        last_review = user.last_review_date.date() if user.last_review_date else None

        # Check if this is a new streak day
        if last_review is None:
            # First review ever
            user.current_streak = 1
            user.last_review_date = now
        elif last_review == today:
            # Already reviewed today, no streak update
            pass
        elif last_review == today - timedelta(days=1):
            # Consecutive day, increment streak
            user.current_streak += 1
            user.last_review_date = now
        else:
            # Check weekend grace
            days_missed = (today - last_review).days - 1
            weekend_protected = self._is_weekend_grace_applicable(last_review, today)

            if weekend_protected and days_missed <= 2:
                # Weekend grace: streak continues
                user.current_streak += 1
                user.last_review_date = now
            elif user.streak_protected_until and now <= user.streak_protected_until:
                # Protected by extension
                user.current_streak += 1
                user.last_review_date = now
                user.streak_protected_until = None  # Used up
            elif (user.streak_shield_count or 0) > 0:
                # Use a streak shield
                user.streak_shield_count -= 1
                user.streak_shield_used_at = now
                user.last_review_date = now
                # Don't increment streak, but don't reset either
                await self.award_karma(
                    user_id=user_id,
                    action=KarmaAction.STREAK_SHIELD_USED,
                    reason=f"Streak shield used! Your {user.current_streak}-day streak is protected."
                )
            else:
                # Streak broken, reset
                user.current_streak = 1
                user.last_review_date = now

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
                reason="25-day review streak! Amazing dedication!"
            )
            # Award a bonus streak shield
            user.streak_shield_count = (user.streak_shield_count or 0) + 1
            await self.db.commit()
        elif streak == 10:
            bonus_transaction = await self.award_karma(
                user_id=user_id,
                action=KarmaAction.STREAK_BONUS_10,
                reason="10-day review streak! You're on fire!"
            )
        elif streak == 5:
            bonus_transaction = await self.award_karma(
                user_id=user_id,
                action=KarmaAction.STREAK_BONUS_5,
                reason="5-day review streak! Great consistency!"
            )

        return bonus_transaction

    def _is_weekend_grace_applicable(self, last_review_date, today) -> bool:
        """
        Check if weekend grace should protect the streak.

        Weekend grace applies if:
        - Last review was Friday and today is Monday (missed Sat/Sun)
        - Last review was Saturday and today is Monday (missed Sun)
        """
        last_weekday = last_review_date.weekday()  # 0=Mon, 4=Fri, 5=Sat, 6=Sun
        today_weekday = today.weekday()
        days_diff = (today - last_review_date).days

        # Friday -> Monday (missed Sat+Sun)
        if last_weekday == 4 and today_weekday == 0 and days_diff == 3:
            return True

        # Saturday -> Monday (missed Sun)
        if last_weekday == 5 and today_weekday == 0 and days_diff == 2:
            return True

        # Thursday -> Monday (missed Fri+Sat+Sun) - be generous
        if last_weekday == 4 and today_weekday == 0 and days_diff <= 3:
            return True

        return False

    async def update_weekly_goal(self, user_id: int) -> Optional[KarmaTransaction]:
        """
        Update user's weekly review goal progress.

        Weekly goals are the primary engagement metric, replacing
        the pressure of daily streaks with more sustainable goals.

        Args:
            user_id: User to update

        Returns:
            KarmaTransaction if goal achieved, None otherwise
        """
        user = await self.db.get(User, user_id)
        if not user:
            return None

        now = datetime.utcnow()

        # Check if we need to start a new week
        if user.week_start_date:
            days_since_start = (now - user.week_start_date).days
            if days_since_start >= 7:
                # Week ended - check if goal was met
                was_goal_met = user.weekly_reviews_count >= user.weekly_goal_target

                if was_goal_met:
                    user.weekly_goal_streak += 1
                else:
                    user.weekly_goal_streak = 0

                # Reset for new week
                user.weekly_reviews_count = 1  # Count current review
                user.week_start_date = now

                # Award weekly streak bonuses
                if user.weekly_goal_streak == 12:
                    await self.award_karma(
                        user_id=user_id,
                        action=KarmaAction.WEEKLY_STREAK_BONUS_12,
                        reason="12 consecutive weeks meeting your goal! Quarterly champion!"
                    )
                elif user.weekly_goal_streak == 4:
                    await self.award_karma(
                        user_id=user_id,
                        action=KarmaAction.WEEKLY_STREAK_BONUS_4,
                        reason="4 consecutive weeks meeting your goal! Monthly milestone!"
                    )
            else:
                # Same week, increment count
                user.weekly_reviews_count += 1
        else:
            # First review ever - start tracking
            user.week_start_date = now
            user.weekly_reviews_count = 1

        await self.db.commit()

        # Check if goal just achieved this review
        if user.weekly_reviews_count == user.weekly_goal_target:
            return await self.award_karma(
                user_id=user_id,
                action=KarmaAction.WEEKLY_GOAL_MET,
                reason=f"Weekly goal of {user.weekly_goal_target} reviews achieved!"
            )
        elif user.weekly_reviews_count == user.weekly_goal_target + 2:
            # Bonus for significantly exceeding goal
            return await self.award_karma(
                user_id=user_id,
                action=KarmaAction.WEEKLY_GOAL_EXCEEDED,
                reason=f"Exceeded weekly goal by 2+ reviews! Bonus karma earned!"
            )

        return None

    async def apply_reputation_decay(self, user_id: int) -> Optional[KarmaTransaction]:
        """
        Apply reputation decay for inactive users.

        - Decay starts after DECAY_START_DAYS of inactivity
        - Loses DECAY_RATE_PER_WEEK reputation per week inactive
        - Floor is DECAY_FLOOR (reputation can't go below this)

        Args:
            user_id: User to check for decay

        Returns:
            KarmaTransaction if decay applied, None otherwise
        """
        user = await self.db.get(User, user_id)
        if not user or not user.last_active_date:
            return None

        days_inactive = (datetime.utcnow() - user.last_active_date).days

        if days_inactive < self.DECAY_START_DAYS:
            return None  # Not inactive long enough

        if user.reputation_score <= self.DECAY_FLOOR:
            return None  # Already at floor

        # Calculate decay amount
        weeks_inactive = (days_inactive - self.DECAY_START_DAYS) // 7
        decay_amount = min(
            weeks_inactive * self.DECAY_RATE_PER_WEEK,
            user.reputation_score - self.DECAY_FLOOR
        )

        if decay_amount <= 0:
            return None

        # Apply decay
        user.reputation_score -= decay_amount

        transaction = KarmaTransaction(
            user_id=user_id,
            action=KarmaAction.REPUTATION_DECAY,
            points=0,  # Doesn't affect karma
            balance_after=user.karma_points,
            reason=f"Reputation decreased by {decay_amount} due to {days_inactive} days of inactivity",
            created_at=datetime.utcnow()
        )

        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)

        return transaction

    async def calculate_acceptance_rate(self, user_id: int) -> Optional[Decimal]:
        """
        Calculate and cache the user's review acceptance rate.

        Acceptance rate = (accepted reviews) / (accepted + rejected reviews) * 100
        """
        user = await self.db.get(User, user_id)
        if not user:
            return None

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

        acceptance_rate = Decimal(accepted) / Decimal(total) * 100
        acceptance_rate = acceptance_rate.quantize(Decimal("0.01"))

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
        """Get karma transaction history for a user."""
        stmt = (
            select(KarmaTransaction)
            .where(KarmaTransaction.user_id == user_id)
            .order_by(KarmaTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_karma_breakdown(self, user_id: int) -> Dict[str, Any]:
        """
        Get detailed karma breakdown for transparency.

        Shows exactly where karma came from and provides
        percentile ranking among all users.
        """
        user = await self.db.get(User, user_id)
        if not user:
            return {}

        # Get totals by action type
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
        breakdown_by_action = {}
        positive_total = 0
        negative_total = 0

        for row in result:
            points = row.total_points or 0
            breakdown_by_action[row.action.value] = {
                "count": row.count,
                "total_points": points
            }
            if points > 0:
                positive_total += points
            else:
                negative_total += abs(points)

        # Calculate percentile
        percentile = await self._calculate_karma_percentile(user.karma_points)

        return {
            "total_karma": user.karma_points,
            "total_xp": user.xp_points,
            "reputation_score": user.reputation_score,
            "positive_karma_earned": positive_total,
            "negative_karma_incurred": negative_total,
            "net_karma": positive_total - negative_total,
            "breakdown_by_action": breakdown_by_action,
            "percentile": percentile,
            "acceptance_rate": float(user.acceptance_rate) if user.acceptance_rate else None,
            "current_streak": user.current_streak,
            "longest_streak": user.longest_streak,
            "streak_shields": user.streak_shield_count,
            "weekly_progress": {
                "current": user.weekly_reviews_count,
                "target": user.weekly_goal_target,
                "streak": user.weekly_goal_streak
            },
            "warning_count": user.warning_count,
            "warnings_expire_at": (
                (user.last_warning_at + timedelta(days=self.WARNING_EXPIRY_DAYS)).isoformat()
                if user.last_warning_at else None
            )
        }

    async def _calculate_karma_percentile(self, karma: int) -> int:
        """Calculate what percentile a karma score falls into."""
        # Count users with less karma
        stmt = select(func.count(User.id)).where(
            User.karma_points < karma,
            User.is_active == True
        )
        result = await self.db.execute(stmt)
        users_below = result.scalar() or 0

        # Count total active users
        stmt = select(func.count(User.id)).where(User.is_active == True)
        result = await self.db.execute(stmt)
        total_users = result.scalar() or 1

        percentile = int((users_below / total_users) * 100)
        return min(99, percentile)  # Cap at 99

    async def get_karma_summary(self, user_id: int) -> Dict[str, Any]:
        """Get a summary of user's karma statistics."""
        user = await self.db.get(User, user_id)
        if not user:
            return {}

        return {
            "total_karma": user.karma_points,
            "total_xp": user.xp_points,
            "reputation_score": user.reputation_score,
            "acceptance_rate": float(user.acceptance_rate) if user.acceptance_rate else None,
            "accepted_reviews_count": user.accepted_reviews_count,
            "current_streak": user.current_streak,
            "longest_streak": user.longest_streak,
            "streak_shields": user.streak_shield_count,
            "weekly_reviews": user.weekly_reviews_count,
            "weekly_goal": user.weekly_goal_target,
            "weekly_goal_streak": user.weekly_goal_streak,
            "last_review_date": user.last_review_date.isoformat() if user.last_review_date else None,
            "last_active_date": user.last_active_date.isoformat() if user.last_active_date else None,
        }

    async def award_daily_bonus(self, user_id: int) -> Optional[KarmaTransaction]:
        """Award daily bonus if this is the user's first review of the day."""
        user = await self.db.get(User, user_id)
        if not user:
            return None

        now = datetime.utcnow()
        today = now.date()

        if user.last_review_date:
            last_review_date = user.last_review_date.date()
            if last_review_date == today:
                return None

        return await self.award_karma(
            user_id=user_id,
            action=KarmaAction.DAILY_BONUS,
            reason="First review of the day!"
        )

    async def check_tier_promotion(self, user_id: int) -> bool:
        """Check if user qualifies for tier promotion."""
        from app.services.tier_service import TierService

        tier_service = TierService(self.db)
        return await tier_service.check_and_promote_user(user_id)
