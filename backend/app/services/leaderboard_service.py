"""Leaderboard Service for seasonal competitions and rankings"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import func, select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.leaderboard import Season, LeaderboardEntry, SeasonType, LeaderboardCategory
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.sparks_transaction import SparksAction as KarmaAction, SparksTransaction as KarmaTransaction


class LeaderboardService:
    """
    Service for managing seasonal leaderboards.

    Features:
    - Weekly, monthly, and quarterly seasons
    - Multiple categories (overall, reviews, quality, skill-specific)
    - Automatic season transitions
    - End-of-season rewards
    """

    # Leaderboard reward tiers
    REWARDS = {
        1: {"karma": 500, "xp": 500, "title": "Champion"},
        2: {"karma": 300, "xp": 300, "title": "Runner-up"},
        3: {"karma": 200, "xp": 200, "title": "Third Place"},
        # Top 10 get smaller rewards
        10: {"karma": 100, "xp": 100, "title": "Top 10"},
        # Top 10% get participation rewards
        "percentile_10": {"karma": 50, "xp": 50, "title": "Top 10%"},
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_season(
        self,
        name: str,
        season_type: SeasonType,
        start_date: datetime,
        end_date: datetime,
        rewards_description: Optional[str] = None
    ) -> Season:
        """Create a new season."""
        season = Season(
            name=name,
            season_type=season_type,
            start_date=start_date,
            end_date=end_date,
            is_active=False,
            is_finalized=False,
            rewards_description=rewards_description,
            created_at=datetime.utcnow()
        )
        self.db.add(season)
        await self.db.commit()
        await self.db.refresh(season)
        return season

    async def get_active_season(self, season_type: SeasonType) -> Optional[Season]:
        """Get the currently active season of a given type."""
        stmt = select(Season).where(
            Season.season_type == season_type,
            Season.is_active == True
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def activate_season(self, season_id: int) -> Season:
        """Activate a season and deactivate others of same type."""
        season = await self.db.get(Season, season_id)
        if not season:
            raise ValueError(f"Season {season_id} not found")

        # Deactivate other seasons of same type
        stmt = select(Season).where(
            Season.season_type == season.season_type,
            Season.is_active == True
        )
        result = await self.db.execute(stmt)
        for other in result.scalars():
            other.is_active = False

        season.is_active = True
        await self.db.commit()
        await self.db.refresh(season)
        return season

    async def update_user_score(
        self,
        user_id: int,
        season_id: int,
        category: LeaderboardCategory,
        score_delta: int,
        karma_earned: int = 0,
        xp_earned: int = 0,
        skill: Optional[str] = None
    ) -> LeaderboardEntry:
        """
        Update or create a user's leaderboard entry.

        Called after review submission, acceptance, etc.
        """
        # Find existing entry or create new one
        stmt = select(LeaderboardEntry).where(
            LeaderboardEntry.user_id == user_id,
            LeaderboardEntry.season_id == season_id,
            LeaderboardEntry.category == category
        )
        if skill:
            stmt = stmt.where(LeaderboardEntry.skill == skill)
        else:
            stmt = stmt.where(LeaderboardEntry.skill.is_(None))

        result = await self.db.execute(stmt)
        entry = result.scalar_one_or_none()

        if entry:
            entry.score += score_delta
            entry.karma_earned += karma_earned
            entry.xp_earned += xp_earned
            if category == LeaderboardCategory.REVIEWS:
                entry.reviews_count += 1
            entry.updated_at = datetime.utcnow()
        else:
            entry = LeaderboardEntry(
                user_id=user_id,
                season_id=season_id,
                category=category,
                skill=skill,
                score=score_delta,
                reviews_count=1 if category == LeaderboardCategory.REVIEWS else 0,
                karma_earned=karma_earned,
                xp_earned=xp_earned,
                updated_at=datetime.utcnow()
            )
            self.db.add(entry)

        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def record_review_activity(self, user_id: int, karma_earned: int, xp_earned: int):
        """
        Record review activity in all relevant leaderboards.

        Called after a review is submitted or accepted.
        """
        # Get active seasons (weekly and monthly)
        for season_type in [SeasonType.WEEKLY, SeasonType.MONTHLY]:
            season = await self.get_active_season(season_type)
            if not season:
                continue

            # Update overall leaderboard
            await self.update_user_score(
                user_id=user_id,
                season_id=season.id,
                category=LeaderboardCategory.OVERALL,
                score_delta=karma_earned,
                karma_earned=karma_earned,
                xp_earned=xp_earned
            )

            # Update reviews leaderboard
            await self.update_user_score(
                user_id=user_id,
                season_id=season.id,
                category=LeaderboardCategory.REVIEWS,
                score_delta=1,  # Score is count for reviews
                karma_earned=karma_earned,
                xp_earned=xp_earned
            )

    async def get_leaderboard(
        self,
        season_id: int,
        category: LeaderboardCategory,
        limit: int = 100,
        skill: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get leaderboard rankings for a season/category.

        Returns top users with their scores and ranks.
        """
        stmt = (
            select(LeaderboardEntry, User)
            .join(User, LeaderboardEntry.user_id == User.id)
            .where(
                LeaderboardEntry.season_id == season_id,
                LeaderboardEntry.category == category
            )
        )

        if skill:
            stmt = stmt.where(LeaderboardEntry.skill == skill)
        else:
            stmt = stmt.where(LeaderboardEntry.skill.is_(None))

        stmt = stmt.order_by(desc(LeaderboardEntry.score)).limit(limit)

        result = await self.db.execute(stmt)
        rankings = []

        for rank, (entry, user) in enumerate(result, start=1):
            rankings.append({
                "rank": rank,
                "user_id": user.id,
                "username": user.full_name or f"User {user.id}",
                "avatar_url": user.avatar_url,
                "user_tier": user.user_tier.value,
                "score": entry.score,
                "reviews_count": entry.reviews_count,
                "karma_earned": entry.karma_earned,
                "xp_earned": entry.xp_earned,
            })

        return rankings

    async def get_user_ranking(
        self,
        user_id: int,
        season_id: int,
        category: LeaderboardCategory = LeaderboardCategory.OVERALL,
        skill: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get a specific user's ranking in a leaderboard."""
        # Get user's entry
        stmt = select(LeaderboardEntry).where(
            LeaderboardEntry.user_id == user_id,
            LeaderboardEntry.season_id == season_id,
            LeaderboardEntry.category == category
        )
        if skill:
            stmt = stmt.where(LeaderboardEntry.skill == skill)
        else:
            stmt = stmt.where(LeaderboardEntry.skill.is_(None))

        result = await self.db.execute(stmt)
        entry = result.scalar_one_or_none()

        if not entry:
            return None

        # Calculate rank
        stmt = select(func.count(LeaderboardEntry.id)).where(
            LeaderboardEntry.season_id == season_id,
            LeaderboardEntry.category == category,
            LeaderboardEntry.score > entry.score
        )
        if skill:
            stmt = stmt.where(LeaderboardEntry.skill == skill)
        else:
            stmt = stmt.where(LeaderboardEntry.skill.is_(None))

        result = await self.db.execute(stmt)
        users_above = result.scalar() or 0
        rank = users_above + 1

        # Calculate total participants
        stmt = select(func.count(LeaderboardEntry.id)).where(
            LeaderboardEntry.season_id == season_id,
            LeaderboardEntry.category == category
        )
        if skill:
            stmt = stmt.where(LeaderboardEntry.skill == skill)
        else:
            stmt = stmt.where(LeaderboardEntry.skill.is_(None))

        result = await self.db.execute(stmt)
        total = result.scalar() or 1

        percentile = int(((total - rank) / total) * 100) if total > 0 else 0

        return {
            "rank": rank,
            "total_participants": total,
            "percentile": percentile,
            "score": entry.score,
            "reviews_count": entry.reviews_count,
            "karma_earned": entry.karma_earned,
            "xp_earned": entry.xp_earned,
        }

    async def finalize_season(self, season_id: int) -> List[Dict[str, Any]]:
        """
        Finalize a season, calculate final ranks, and distribute rewards.

        Returns list of reward recipients.
        """
        season = await self.db.get(Season, season_id)
        if not season:
            raise ValueError(f"Season {season_id} not found")

        if season.is_finalized:
            raise ValueError(f"Season {season_id} already finalized")

        reward_recipients = []

        # Process each category
        for category in [LeaderboardCategory.OVERALL, LeaderboardCategory.REVIEWS]:
            # Get all entries sorted by score
            stmt = (
                select(LeaderboardEntry)
                .where(
                    LeaderboardEntry.season_id == season_id,
                    LeaderboardEntry.category == category,
                    LeaderboardEntry.skill.is_(None)
                )
                .order_by(desc(LeaderboardEntry.score))
            )
            result = await self.db.execute(stmt)
            entries = list(result.scalars().all())

            total = len(entries)

            for rank, entry in enumerate(entries, start=1):
                # Update entry with final rank
                entry.rank = rank
                entry.percentile = int(((total - rank) / total) * 100) if total > 0 else 0

                # Determine rewards
                reward = None
                if rank == 1:
                    reward = self.REWARDS[1]
                elif rank == 2:
                    reward = self.REWARDS[2]
                elif rank == 3:
                    reward = self.REWARDS[3]
                elif rank <= 10:
                    reward = self.REWARDS[10]
                elif entry.percentile >= 90:  # Top 10%
                    reward = self.REWARDS["percentile_10"]

                if reward:
                    # Award karma and XP
                    user = await self.db.get(User, entry.user_id)
                    if user:
                        user.sparks_points = (user.sparks_points or 0) + reward["karma"]
                        user.xp_points = (user.xp_points or 0) + reward["xp"]

                        # Record transaction
                        transaction = KarmaTransaction(
                            user_id=user.id,
                            action=KarmaAction.LEADERBOARD_REWARD,
                            points=reward["karma"],
                            balance_after=user.sparks_points,
                            reason=f"Seasonal reward: {reward['title']} in {category.value} ({season.name})",
                            created_at=datetime.utcnow()
                        )
                        self.db.add(transaction)

                        reward_recipients.append({
                            "user_id": user.id,
                            "category": category.value,
                            "rank": rank,
                            "karma_reward": reward["karma"],
                            "xp_reward": reward["xp"],
                            "title": reward["title"],
                        })

        # Mark season as finalized
        season.is_finalized = True
        season.is_active = False

        await self.db.commit()

        return reward_recipients

    async def auto_create_next_season(self, season_type: SeasonType) -> Season:
        """
        Automatically create and activate the next season.

        Called when finalizing a season or on schedule.
        """
        now = datetime.utcnow()

        if season_type == SeasonType.WEEKLY:
            # Start on Monday
            days_until_monday = (7 - now.weekday()) % 7
            if days_until_monday == 0:
                days_until_monday = 7
            start_date = (now + timedelta(days=days_until_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=7)
            name = f"Week of {start_date.strftime('%B %d, %Y')}"

        elif season_type == SeasonType.MONTHLY:
            # Start on first of next month
            if now.month == 12:
                start_date = datetime(now.year + 1, 1, 1)
            else:
                start_date = datetime(now.year, now.month + 1, 1)
            # End on last day of that month
            if start_date.month == 12:
                end_date = datetime(start_date.year + 1, 1, 1)
            else:
                end_date = datetime(start_date.year, start_date.month + 1, 1)
            name = f"{start_date.strftime('%B %Y')}"

        elif season_type == SeasonType.QUARTERLY:
            # Start on first of next quarter
            quarter = (now.month - 1) // 3 + 1
            if quarter == 4:
                start_date = datetime(now.year + 1, 1, 1)
            else:
                start_date = datetime(now.year, quarter * 3 + 1, 1)
            # End on last day of quarter
            end_quarter = (start_date.month - 1) // 3 + 1
            if end_quarter == 4:
                end_date = datetime(start_date.year + 1, 1, 1)
            else:
                end_date = datetime(start_date.year, end_quarter * 3 + 1, 1)
            quarter_names = {1: "Q1", 2: "Q2", 3: "Q3", 4: "Q4"}
            name = f"{quarter_names[(start_date.month - 1) // 3 + 1]} {start_date.year}"

        else:
            raise ValueError(f"Unknown season type: {season_type}")

        # Create and activate
        season = await self.create_season(
            name=name,
            season_type=season_type,
            start_date=start_date,
            end_date=end_date
        )
        await self.activate_season(season.id)

        return season

    async def get_all_seasons(
        self,
        season_type: Optional[SeasonType] = None,
        include_finalized: bool = True,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get list of seasons with basic info."""
        stmt = select(Season).order_by(desc(Season.start_date))

        if season_type:
            stmt = stmt.where(Season.season_type == season_type)

        if not include_finalized:
            stmt = stmt.where(Season.is_finalized == False)

        stmt = stmt.limit(limit)

        result = await self.db.execute(stmt)
        seasons = []

        for season in result.scalars():
            seasons.append({
                "id": season.id,
                "name": season.name,
                "season_type": season.season_type.value,
                "start_date": season.start_date.isoformat(),
                "end_date": season.end_date.isoformat(),
                "is_active": season.is_active,
                "is_finalized": season.is_finalized,
            })

        return seasons
