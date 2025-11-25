"""Badge Service for skill-based achievements and rewards"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.badge import Badge, UserBadge, BadgeCategory, BadgeRarity
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.karma_transaction import KarmaAction


class BadgeService:
    """
    Service for managing skill-based badges and achievements.

    Features:
    - Skill mastery badges (e.g., "React Expert" after 10 React reviews)
    - Milestone badges (100 reviews, 1000 karma, etc.)
    - Quality badges (high acceptance rate, helpful ratings)
    - Streak badges (long streaks)
    - Seasonal badges (leaderboard placements)
    """

    # Default badge definitions (seeded into database)
    DEFAULT_BADGES = [
        # Skill badges - earned by reviewing X projects with specific skill
        {
            "code": "skill_react_apprentice",
            "name": "React Apprentice",
            "description": "Completed 5 reviews for React projects",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "skill_reviews",
            "requirement_value": 5,
            "requirement_skill": "React",
        },
        {
            "code": "skill_react_expert",
            "name": "React Expert",
            "description": "Completed 25 reviews for React projects",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "skill_reviews",
            "requirement_value": 25,
            "requirement_skill": "React",
        },
        {
            "code": "skill_typescript_apprentice",
            "name": "TypeScript Apprentice",
            "description": "Completed 5 reviews for TypeScript projects",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "skill_reviews",
            "requirement_value": 5,
            "requirement_skill": "TypeScript",
        },
        {
            "code": "skill_typescript_expert",
            "name": "TypeScript Expert",
            "description": "Completed 25 reviews for TypeScript projects",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "skill_reviews",
            "requirement_value": 25,
            "requirement_skill": "TypeScript",
        },
        {
            "code": "skill_python_apprentice",
            "name": "Python Apprentice",
            "description": "Completed 5 reviews for Python projects",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "skill_reviews",
            "requirement_value": 5,
            "requirement_skill": "Python",
        },
        {
            "code": "skill_design_apprentice",
            "name": "Design Apprentice",
            "description": "Completed 5 design reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "design",
        },
        {
            "code": "skill_design_expert",
            "name": "Design Expert",
            "description": "Completed 25 design reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "design",
        },

        # Milestone badges
        {
            "code": "milestone_first_review",
            "name": "First Steps",
            "description": "Submitted your first review",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 5,
            "xp_reward": 5,
            "requirement_type": "total_reviews",
            "requirement_value": 1,
        },
        {
            "code": "milestone_10_reviews",
            "name": "Getting Started",
            "description": "Completed 10 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 15,
            "xp_reward": 15,
            "requirement_type": "total_reviews",
            "requirement_value": 10,
        },
        {
            "code": "milestone_50_reviews",
            "name": "Dedicated Reviewer",
            "description": "Completed 50 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 30,
            "xp_reward": 30,
            "requirement_type": "total_reviews",
            "requirement_value": 50,
        },
        {
            "code": "milestone_100_reviews",
            "name": "Century Club",
            "description": "Completed 100 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 75,
            "xp_reward": 75,
            "requirement_type": "total_reviews",
            "requirement_value": 100,
        },
        {
            "code": "milestone_500_reviews",
            "name": "Review Legend",
            "description": "Completed 500 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 200,
            "xp_reward": 200,
            "requirement_type": "total_reviews",
            "requirement_value": 500,
        },

        # Quality badges
        {
            "code": "quality_helpful_10",
            "name": "Helpful Hand",
            "description": "Received 10 five-star helpful ratings",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 25,
            "xp_reward": 25,
            "requirement_type": "five_star_ratings",
            "requirement_value": 10,
        },
        {
            "code": "quality_helpful_50",
            "name": "Invaluable Reviewer",
            "description": "Received 50 five-star helpful ratings",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 75,
            "xp_reward": 75,
            "requirement_type": "five_star_ratings",
            "requirement_value": 50,
        },
        {
            "code": "quality_acceptance_90",
            "name": "Trusted Voice",
            "description": "Maintained 90%+ acceptance rate (min 20 reviews)",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "acceptance_rate",
            "requirement_value": 90,
        },

        # Streak badges
        {
            "code": "streak_7_days",
            "name": "Week Warrior",
            "description": "Maintained a 7-day review streak",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 15,
            "xp_reward": 15,
            "requirement_type": "streak_days",
            "requirement_value": 7,
        },
        {
            "code": "streak_30_days",
            "name": "Month Master",
            "description": "Maintained a 30-day review streak",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 100,
            "xp_reward": 100,
            "requirement_type": "streak_days",
            "requirement_value": 30,
        },
        {
            "code": "streak_100_days",
            "name": "Unstoppable",
            "description": "Maintained a 100-day review streak",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.LEGENDARY,
            "karma_reward": 500,
            "xp_reward": 500,
            "requirement_type": "streak_days",
            "requirement_value": 100,
        },

        # Special badges
        {
            "code": "special_early_adopter",
            "name": "Early Adopter",
            "description": "Joined during the beta period",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 100,
            "xp_reward": 100,
            "requirement_type": "manual",
            "requirement_value": 0,
        },
        {
            "code": "special_community_helper",
            "name": "Community Helper",
            "description": "Helped improve the platform through feedback",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "manual",
            "requirement_value": 0,
        },
    ]

    def __init__(self, db: AsyncSession):
        self.db = db

    async def seed_default_badges(self) -> int:
        """
        Seed default badges into database if they don't exist.

        Returns:
            Number of badges created
        """
        created_count = 0

        for badge_data in self.DEFAULT_BADGES:
            # Check if badge already exists
            stmt = select(Badge).where(Badge.code == badge_data["code"])
            result = await self.db.execute(stmt)
            existing = result.scalar_one_or_none()

            if not existing:
                badge = Badge(**badge_data)
                self.db.add(badge)
                created_count += 1

        await self.db.commit()
        return created_count

    async def check_and_award_badges(self, user_id: int) -> List[UserBadge]:
        """
        Check if user qualifies for any new badges and award them.

        Called after review submission, acceptance, etc.

        Args:
            user_id: User to check badges for

        Returns:
            List of newly awarded badges
        """
        user = await self.db.get(User, user_id)
        if not user:
            return []

        # Get all badges user doesn't have yet
        stmt = (
            select(Badge)
            .where(
                Badge.is_active == True,
                ~Badge.id.in_(
                    select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
                )
            )
        )
        result = await self.db.execute(stmt)
        available_badges = list(result.scalars().all())

        awarded = []

        for badge in available_badges:
            if await self._check_badge_requirements(user, badge):
                user_badge = await self._award_badge(user, badge)
                awarded.append(user_badge)

        return awarded

    async def _check_badge_requirements(self, user: User, badge: Badge) -> bool:
        """Check if user meets requirements for a specific badge."""
        req_type = badge.requirement_type
        req_value = badge.requirement_value

        if req_type == "total_reviews":
            return user.total_reviews_given >= req_value

        elif req_type == "streak_days":
            return user.longest_streak >= req_value

        elif req_type == "acceptance_rate":
            if user.accepted_reviews_count < 20:  # Minimum reviews required
                return False
            return user.acceptance_rate is not None and float(user.acceptance_rate) >= req_value

        elif req_type == "five_star_ratings":
            count = await self._count_five_star_ratings(user.id)
            return count >= req_value

        elif req_type == "skill_reviews":
            count = await self._count_skill_reviews(user.id, badge.requirement_skill)
            return count >= req_value

        elif req_type == "content_type_reviews":
            count = await self._count_content_type_reviews(user.id, badge.requirement_skill)
            return count >= req_value

        elif req_type == "manual":
            return False  # Manual badges are awarded programmatically

        return False

    async def _count_five_star_ratings(self, user_id: int) -> int:
        """Count number of 5-star helpful ratings received."""
        stmt = select(func.count(ReviewSlot.id)).where(
            ReviewSlot.reviewer_id == user_id,
            ReviewSlot.requester_helpful_rating == 5
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_skill_reviews(self, user_id: int, skill: str) -> int:
        """Count reviews for projects with a specific skill."""
        from app.models.review_request import ReviewRequest

        # Join ReviewSlot with ReviewRequest and check skills_needed
        stmt = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
            .where(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewRequest.skills_needed.ilike(f"%{skill}%")
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_content_type_reviews(self, user_id: int, content_type: str) -> int:
        """Count reviews for a specific content type."""
        from app.models.review_request import ReviewRequest

        stmt = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
            .where(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewRequest.content_type == content_type
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _award_badge(self, user: User, badge: Badge) -> UserBadge:
        """Award a badge to user and grant karma/XP rewards."""
        # Create user badge record
        user_badge = UserBadge(
            user_id=user.id,
            badge_id=badge.id,
            earned_at=datetime.utcnow(),
            earning_reason=f"Earned {badge.name} badge"
        )
        self.db.add(user_badge)

        # Award karma and XP
        if badge.karma_reward > 0:
            user.karma_points = (user.karma_points or 0) + badge.karma_reward
        if badge.xp_reward > 0:
            user.xp_points = (user.xp_points or 0) + badge.xp_reward

        # Create karma transaction for tracking
        from app.models.karma_transaction import KarmaTransaction

        transaction = KarmaTransaction(
            user_id=user.id,
            action=KarmaAction.BADGE_EARNED,
            points=badge.karma_reward,
            balance_after=user.karma_points,
            reason=f"Earned badge: {badge.name}",
            created_at=datetime.utcnow()
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(user_badge)

        return user_badge

    async def get_user_badges(
        self,
        user_id: int,
        include_hidden: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get all badges earned by a user.

        Args:
            user_id: User to get badges for
            include_hidden: Include badges user has hidden

        Returns:
            List of badge details with earning info
        """
        stmt = (
            select(UserBadge, Badge)
            .join(Badge, UserBadge.badge_id == Badge.id)
            .where(UserBadge.user_id == user_id)
        )

        if not include_hidden:
            stmt = stmt.where(UserBadge.is_hidden == False)

        stmt = stmt.order_by(UserBadge.earned_at.desc())

        result = await self.db.execute(stmt)
        badges = []

        for user_badge, badge in result:
            badges.append({
                "id": user_badge.id,
                "badge_code": badge.code,
                "badge_name": badge.name,
                "badge_description": badge.description,
                "category": badge.category.value,
                "rarity": badge.rarity.value,
                "icon_url": badge.icon_url,
                "color": badge.color,
                "earned_at": user_badge.earned_at.isoformat(),
                "level": user_badge.level,
                "is_featured": user_badge.is_featured,
                "is_hidden": user_badge.is_hidden,
            })

        return badges

    async def get_available_badges(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get badges user hasn't earned yet with progress info.

        Args:
            user_id: User to get available badges for

        Returns:
            List of available badges with progress towards earning
        """
        user = await self.db.get(User, user_id)
        if not user:
            return []

        # Get badges user doesn't have
        stmt = (
            select(Badge)
            .where(
                Badge.is_active == True,
                ~Badge.id.in_(
                    select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
                )
            )
            .order_by(Badge.rarity, Badge.name)
        )

        result = await self.db.execute(stmt)
        available = []

        for badge in result.scalars():
            progress = await self._get_badge_progress(user, badge)
            available.append({
                "badge_code": badge.code,
                "badge_name": badge.name,
                "badge_description": badge.description,
                "category": badge.category.value,
                "rarity": badge.rarity.value,
                "icon_url": badge.icon_url,
                "color": badge.color,
                "karma_reward": badge.karma_reward,
                "xp_reward": badge.xp_reward,
                "progress": progress,
            })

        return available

    async def _get_badge_progress(self, user: User, badge: Badge) -> Dict[str, Any]:
        """Get user's progress towards earning a badge."""
        req_type = badge.requirement_type
        req_value = badge.requirement_value
        current = 0

        if req_type == "total_reviews":
            current = user.total_reviews_given

        elif req_type == "streak_days":
            current = user.longest_streak

        elif req_type == "acceptance_rate":
            if user.accepted_reviews_count >= 20:
                current = float(user.acceptance_rate or 0)

        elif req_type == "five_star_ratings":
            current = await self._count_five_star_ratings(user.id)

        elif req_type == "skill_reviews":
            current = await self._count_skill_reviews(user.id, badge.requirement_skill)

        elif req_type == "content_type_reviews":
            current = await self._count_content_type_reviews(user.id, badge.requirement_skill)

        elif req_type == "manual":
            return {"type": "manual", "description": "Awarded manually"}

        percentage = min(100, int((current / req_value) * 100)) if req_value > 0 else 0

        return {
            "type": req_type,
            "current": current,
            "required": req_value,
            "percentage": percentage,
        }

    async def toggle_badge_featured(self, user_id: int, badge_id: int) -> bool:
        """Toggle whether a badge is featured on user's profile."""
        stmt = select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge_id
        )
        result = await self.db.execute(stmt)
        user_badge = result.scalar_one_or_none()

        if not user_badge:
            return False

        user_badge.is_featured = not user_badge.is_featured
        await self.db.commit()
        return True

    async def award_special_badge(
        self,
        user_id: int,
        badge_code: str,
        reason: str
    ) -> Optional[UserBadge]:
        """
        Manually award a special badge (Early Adopter, etc.)

        Args:
            user_id: User to award badge to
            badge_code: Badge code to award
            reason: Reason for awarding

        Returns:
            UserBadge if awarded, None if already has badge
        """
        user = await self.db.get(User, user_id)
        if not user:
            return None

        # Get the badge
        stmt = select(Badge).where(Badge.code == badge_code)
        result = await self.db.execute(stmt)
        badge = result.scalar_one_or_none()

        if not badge:
            return None

        # Check if user already has this badge
        stmt = select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge.id
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            return None

        # Create user badge with custom reason
        user_badge = UserBadge(
            user_id=user_id,
            badge_id=badge.id,
            earned_at=datetime.utcnow(),
            earning_reason=reason
        )
        self.db.add(user_badge)

        # Award karma and XP
        user.karma_points = (user.karma_points or 0) + badge.karma_reward
        user.xp_points = (user.xp_points or 0) + badge.xp_reward

        await self.db.commit()
        await self.db.refresh(user_badge)

        return user_badge
