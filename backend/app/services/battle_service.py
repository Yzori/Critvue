"""Battle Service for managing 1v1 creative competitions"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import func, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, UserTier
from app.models.review_request import ContentType
from app.models.battle import Battle, BattleStatus, BattleType
from app.models.battle_entry import BattleEntry
from app.models.battle_vote import BattleVote
from app.models.battle_challenge import BattleChallenge, ChallengeStatus
from app.models.battle_prompt import BattlePrompt
from app.models.karma_transaction import KarmaAction
from app.models.notification import NotificationType, NotificationPriority, EntityType
from app.services.karma_service import KarmaService
from app.services.notification_service import NotificationService


class BattleService:
    """
    Service for managing 1v1 creative battles.

    Features:
    - Battle creation and lifecycle management
    - Queue-based matchmaking
    - Direct challenges
    - Entry submission with blind mode
    - Community voting
    - Karma rewards
    """

    # Karma rewards for battle outcomes
    KARMA_VALUES = {
        "win_base": 50,
        "win_margin_bonus_max": 50,  # Up to 50 extra based on vote margin
        "loss_participation": 5,
        "draw": 25,
        "vote_cast": 2,
        "win_streak_3": 50,
        "win_streak_5": 100,
    }

    # Timing defaults (hours)
    DEFAULT_SUBMISSION_HOURS = 72
    DEFAULT_VOTING_HOURS = 48
    CHALLENGE_EXPIRY_HOURS = 48

    # Draw threshold (percentage)
    DRAW_THRESHOLD = 5.0  # Within 5% is considered a draw

    def __init__(self, db: AsyncSession):
        self.db = db
        self.karma_service = KarmaService(db)
        self.notification_service = NotificationService(db)

    # ==================== PROMPTS ====================

    async def get_prompts(
        self,
        content_type: Optional[ContentType] = None,
        is_active: bool = True,
        limit: int = 50
    ) -> List[BattlePrompt]:
        """Get available battle prompts."""
        stmt = select(BattlePrompt).where(BattlePrompt.is_active == is_active)

        if content_type:
            stmt = stmt.where(BattlePrompt.content_type == content_type)

        stmt = stmt.order_by(BattlePrompt.times_used.desc()).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_prompt(self, prompt_id: int) -> Optional[BattlePrompt]:
        """Get a specific prompt by ID."""
        return await self.db.get(BattlePrompt, prompt_id)

    async def create_prompt(
        self,
        title: str,
        description: str,
        content_type: ContentType,
        difficulty: str = "intermediate",
        is_active: bool = True
    ) -> BattlePrompt:
        """Create a new battle prompt (admin only)."""
        from app.models.battle_prompt import PromptDifficulty

        prompt = BattlePrompt(
            title=title,
            description=description,
            content_type=content_type,
            difficulty=PromptDifficulty(difficulty) if isinstance(difficulty, str) else difficulty,
            is_active=is_active,
            times_used=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.db.add(prompt)
        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def update_prompt(
        self,
        prompt_id: int,
        **kwargs
    ) -> Optional[BattlePrompt]:
        """Update an existing battle prompt (admin only)."""
        prompt = await self.get_prompt(prompt_id)
        if not prompt:
            return None

        for key, value in kwargs.items():
            if hasattr(prompt, key) and value is not None:
                setattr(prompt, key, value)

        prompt.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(prompt)

        return prompt

    async def delete_prompt(self, prompt_id: int) -> bool:
        """Soft-delete a battle prompt by setting is_active=False."""
        prompt = await self.get_prompt(prompt_id)
        if not prompt:
            return False

        prompt.is_active = False
        prompt.updated_at = datetime.utcnow()
        await self.db.commit()

        return True

    # ==================== BATTLE CREATION ====================

    async def create_battle(
        self,
        creator_id: int,
        title: str,
        content_type: ContentType,
        prompt_id: int,
        battle_type: BattleType = BattleType.QUEUE,
        submission_hours: int = DEFAULT_SUBMISSION_HOURS,
        voting_hours: int = DEFAULT_VOTING_HOURS,
        challenged_user_id: Optional[int] = None,
        challenge_message: Optional[str] = None
    ) -> Battle:
        """
        Create a new battle.

        For QUEUE type: Battle waits in pending until matched.
        For DIRECT type: Creates a challenge for the specified user.
        """
        # Validate prompt exists and matches content type
        prompt = await self.get_prompt(prompt_id)
        if not prompt:
            raise ValueError("Invalid prompt ID")
        if prompt.content_type != content_type:
            raise ValueError("Prompt content type doesn't match battle content type")

        # Get creator for tier-based matching
        creator = await self.db.get(User, creator_id)
        if not creator:
            raise ValueError("Creator not found")

        battle = Battle(
            title=title,
            content_type=content_type,
            prompt_id=prompt_id,
            creator_id=creator_id,
            battle_type=battle_type,
            status=BattleStatus.PENDING,
            submission_hours=submission_hours,
            voting_hours=voting_hours,
            min_tier=creator.user_tier.value if creator.user_tier else UserTier.NOVICE.value,
            max_tier=creator.user_tier.value if creator.user_tier else UserTier.MASTER.value,
            created_at=datetime.utcnow()
        )

        self.db.add(battle)
        await self.db.flush()  # Get battle ID

        # Increment prompt usage
        prompt.times_used += 1

        # Create direct challenge if specified
        if battle_type == BattleType.DIRECT_CHALLENGE:
            if not challenged_user_id:
                raise ValueError("challenged_user_id required for direct challenges")

            challenge = BattleChallenge(
                battle_id=battle.id,
                challenger_id=creator_id,
                challenged_id=challenged_user_id,
                message=challenge_message,
                status=ChallengeStatus.PENDING,
                expires_at=datetime.utcnow() + timedelta(hours=self.CHALLENGE_EXPIRY_HOURS),
                created_at=datetime.utcnow()
            )
            self.db.add(challenge)

        await self.db.commit()
        await self.db.refresh(battle)

        # Notify challenged user for direct challenges
        if battle_type == BattleType.DIRECT_CHALLENGE and challenged_user_id:
            await self._notify_challenge_received(battle, creator, challenged_user_id)

        return battle

    async def join_battle(self, battle_id: int, user_id: int) -> Battle:
        """
        Join an existing pending battle as opponent.

        This starts the battle and sets deadlines.
        """
        battle = await self._get_battle_with_relations(battle_id)
        if not battle:
            raise ValueError("Battle not found")

        if battle.status != BattleStatus.PENDING:
            raise ValueError("Battle is not accepting participants")

        if battle.creator_id == user_id:
            raise ValueError("Cannot join your own battle")

        if battle.opponent_id:
            raise ValueError("Battle already has an opponent")

        # For direct challenges, verify this is the challenged user
        if battle.battle_type == BattleType.DIRECT_CHALLENGE:
            if not battle.challenge or battle.challenge.challenged_id != user_id:
                raise ValueError("You were not challenged to this battle")
            battle.challenge.status = ChallengeStatus.ACCEPTED
            battle.challenge.responded_at = datetime.utcnow()

        # Start the battle
        now = datetime.utcnow()
        battle.opponent_id = user_id
        battle.status = BattleStatus.ACTIVE
        battle.started_at = now
        battle.submission_deadline = now + timedelta(hours=battle.submission_hours)

        await self.db.commit()
        await self.db.refresh(battle)

        # Notify both participants that battle has started
        await self._notify_battle_started(battle)

        return battle

    # ==================== QUEUE MATCHMAKING ====================

    async def find_match_in_queue(
        self,
        content_type: ContentType,
        prompt_id: int,
        user_id: int,
        user_tier: str
    ) -> Optional[Battle]:
        """
        Find a matching battle in the queue for the user.

        Matches based on:
        - Same content type
        - Same prompt
        - Compatible tier (same tier first, then adjacent)
        """
        # First, try exact tier match
        stmt = (
            select(Battle)
            .where(
                Battle.status == BattleStatus.PENDING,
                Battle.battle_type == BattleType.QUEUE,
                Battle.content_type == content_type,
                Battle.prompt_id == prompt_id,
                Battle.creator_id != user_id,
                Battle.opponent_id.is_(None),
                Battle.min_tier == user_tier,
                Battle.deleted_at.is_(None)
            )
            .order_by(Battle.created_at.asc())
            .limit(1)
        )

        result = await self.db.execute(stmt)
        battle = result.scalar_one_or_none()

        if battle:
            return battle

        # If no exact match, expand to adjacent tiers
        tier_order = [t.value for t in UserTier]
        user_tier_idx = tier_order.index(user_tier) if user_tier in tier_order else 0

        adjacent_tiers = []
        if user_tier_idx > 0:
            adjacent_tiers.append(tier_order[user_tier_idx - 1])
        if user_tier_idx < len(tier_order) - 1:
            adjacent_tiers.append(tier_order[user_tier_idx + 1])

        if adjacent_tiers:
            stmt = (
                select(Battle)
                .where(
                    Battle.status == BattleStatus.PENDING,
                    Battle.battle_type == BattleType.QUEUE,
                    Battle.content_type == content_type,
                    Battle.prompt_id == prompt_id,
                    Battle.creator_id != user_id,
                    Battle.opponent_id.is_(None),
                    Battle.min_tier.in_(adjacent_tiers),
                    Battle.deleted_at.is_(None)
                )
                .order_by(Battle.created_at.asc())
                .limit(1)
            )

            result = await self.db.execute(stmt)
            battle = result.scalar_one_or_none()

        return battle

    # ==================== ENTRIES ====================

    async def create_entry(
        self,
        battle_id: int,
        user_id: int,
        title: str,
        description: Optional[str] = None,
        file_urls: Optional[List[Dict]] = None,
        external_links: Optional[List[Dict]] = None,
        thumbnail_url: Optional[str] = None
    ) -> BattleEntry:
        """Create or update a battle entry (before submission)."""
        battle = await self._get_battle_with_relations(battle_id)
        if not battle:
            raise ValueError("Battle not found")

        if battle.status != BattleStatus.ACTIVE:
            raise ValueError("Battle is not accepting entries")

        if user_id not in [battle.creator_id, battle.opponent_id]:
            raise ValueError("You are not a participant in this battle")

        # Check if entry already exists
        existing_entry = await self._get_user_entry(battle_id, user_id)
        if existing_entry and existing_entry.submitted_at:
            raise ValueError("Entry already submitted")

        if existing_entry:
            # Update existing entry
            existing_entry.title = title
            existing_entry.description = description
            existing_entry.file_urls = file_urls
            existing_entry.external_links = external_links
            existing_entry.thumbnail_url = thumbnail_url
            existing_entry.updated_at = datetime.utcnow()
            await self.db.commit()
            await self.db.refresh(existing_entry)
            return existing_entry

        # Create new entry
        entry = BattleEntry(
            battle_id=battle_id,
            user_id=user_id,
            title=title,
            description=description,
            file_urls=file_urls,
            external_links=external_links,
            thumbnail_url=thumbnail_url,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)

        return entry

    async def submit_entry(self, battle_id: int, user_id: int) -> BattleEntry:
        """
        Submit an entry (mark as final).

        After submission, entry cannot be edited.
        When both entries are submitted, voting begins.
        """
        battle = await self._get_battle_with_relations(battle_id)
        if not battle:
            raise ValueError("Battle not found")

        if battle.status != BattleStatus.ACTIVE:
            raise ValueError("Battle is not accepting entries")

        if battle.submission_deadline and datetime.utcnow() > battle.submission_deadline:
            raise ValueError("Submission deadline has passed")

        entry = await self._get_user_entry(battle_id, user_id)
        if not entry:
            raise ValueError("No entry found. Create an entry first.")

        if entry.submitted_at:
            raise ValueError("Entry already submitted")

        if not entry.has_content:
            raise ValueError("Entry must have at least one file or link")

        entry.submitted_at = datetime.utcnow()
        await self.db.commit()

        # Check if both entries are submitted
        await self._check_and_start_voting(battle)

        await self.db.refresh(entry)
        return entry

    async def get_entries(
        self,
        battle_id: int,
        current_user_id: Optional[int] = None
    ) -> List[BattleEntry]:
        """
        Get entries for a battle.

        During ACTIVE status (blind mode):
        - Returns redacted entries (no content) except for current user's entry
        """
        battle = await self._get_battle_with_relations(battle_id)
        if not battle:
            raise ValueError("Battle not found")

        entries = battle.entries

        # In blind mode, redact content for other users' entries
        if battle.status == BattleStatus.ACTIVE:
            for entry in entries:
                if entry.user_id != current_user_id:
                    # Clear content fields for blind mode
                    entry.title = "[Hidden until both submit]"
                    entry.description = None
                    entry.file_urls = None
                    entry.external_links = None
                    entry.thumbnail_url = None

        return entries

    # ==================== VOTING ====================

    async def cast_vote(
        self,
        battle_id: int,
        voter_id: int,
        entry_id: int
    ) -> BattleVote:
        """
        Cast a vote for an entry.

        Rules:
        - One vote per user per battle
        - Cannot vote on own battle
        - Votes are final
        """
        battle = await self._get_battle_with_relations(battle_id)
        if not battle:
            raise ValueError("Battle not found")

        if battle.status != BattleStatus.VOTING:
            raise ValueError("Battle is not in voting phase")

        if battle.voting_deadline and datetime.utcnow() > battle.voting_deadline:
            raise ValueError("Voting deadline has passed")

        if voter_id in [battle.creator_id, battle.opponent_id]:
            raise ValueError("Cannot vote on your own battle")

        # Check if already voted
        existing_vote = await self._get_user_vote(battle_id, voter_id)
        if existing_vote:
            raise ValueError("Already voted in this battle")

        # Validate entry belongs to this battle
        entry = await self.db.get(BattleEntry, entry_id)
        if not entry or entry.battle_id != battle_id:
            raise ValueError("Invalid entry")

        # Create vote
        vote = BattleVote(
            battle_id=battle_id,
            voter_id=voter_id,
            entry_id=entry_id,
            voted_at=datetime.utcnow()
        )

        self.db.add(vote)

        # Update vote counts
        entry.vote_count += 1
        battle.total_votes += 1

        if entry.user_id == battle.creator_id:
            battle.creator_votes += 1
        else:
            battle.opponent_votes += 1

        await self.db.commit()
        await self.db.refresh(vote)

        # Award karma for voting
        await self.karma_service.award_karma(
            user_id=voter_id,
            action=KarmaAction.BATTLE_VOTE_CAST,
            reason="Voted in a battle",
            custom_points=self.KARMA_VALUES["vote_cast"]
        )

        return vote

    async def get_vote_stats(self, battle_id: int) -> Dict[str, Any]:
        """Get vote statistics for a battle (only after voting ends)."""
        battle = await self._get_battle_with_relations(battle_id)
        if not battle:
            raise ValueError("Battle not found")

        # Only show stats after voting ends
        if battle.status not in [BattleStatus.COMPLETED, BattleStatus.DRAW]:
            if battle.status == BattleStatus.VOTING:
                return {
                    "total_votes": battle.total_votes,
                    "creator_votes": "Hidden",
                    "opponent_votes": "Hidden",
                    "creator_percentage": "Hidden",
                    "opponent_percentage": "Hidden"
                }
            return {"error": "Voting not started"}

        total = battle.total_votes or 1
        return {
            "total_votes": battle.total_votes,
            "creator_votes": battle.creator_votes,
            "opponent_votes": battle.opponent_votes,
            "creator_percentage": round((battle.creator_votes / total) * 100, 1),
            "opponent_percentage": round((battle.opponent_votes / total) * 100, 1)
        }

    # ==================== BATTLE COMPLETION ====================

    async def complete_battle(self, battle_id: int) -> Battle:
        """
        Complete a battle and determine winner.

        Called when voting deadline passes or manually by admin.
        """
        battle = await self._get_battle_with_relations(battle_id)
        if not battle:
            raise ValueError("Battle not found")

        if battle.status != BattleStatus.VOTING:
            raise ValueError("Battle is not in voting phase")

        # Determine winner
        total = battle.total_votes
        if total == 0:
            # No votes - cancel battle
            battle.status = BattleStatus.CANCELLED
            await self.db.commit()
            return battle

        vote_margin = abs(battle.creator_votes - battle.opponent_votes)
        margin_percentage = (vote_margin / total) * 100

        if margin_percentage <= self.DRAW_THRESHOLD:
            # Draw
            battle.status = BattleStatus.DRAW
            await self._award_draw(battle)
        else:
            # Winner determined
            battle.status = BattleStatus.COMPLETED
            if battle.creator_votes > battle.opponent_votes:
                battle.winner_id = battle.creator_id
                await self._award_winner(battle, battle.creator_id, battle.opponent_id, margin_percentage)
            else:
                battle.winner_id = battle.opponent_id
                await self._award_winner(battle, battle.opponent_id, battle.creator_id, margin_percentage)

        battle.completed_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(battle)

        # Notify participants of battle results
        await self._notify_battle_completed(battle)

        return battle

    async def _award_winner(
        self,
        battle: Battle,
        winner_id: int,
        loser_id: int,
        margin_percentage: float
    ) -> None:
        """Award karma to winner and loser."""
        # Calculate winner karma (base + margin bonus)
        margin_bonus = int((margin_percentage / 100) * self.KARMA_VALUES["win_margin_bonus_max"])
        winner_karma = self.KARMA_VALUES["win_base"] + margin_bonus
        battle.winner_karma_reward = winner_karma

        # Winner gets karma
        await self.karma_service.award_karma(
            user_id=winner_id,
            action=KarmaAction.BATTLE_WIN,
            reason=f"Won battle: {battle.title}",
            custom_points=winner_karma
        )

        # Loser gets participation karma
        battle.loser_karma_change = self.KARMA_VALUES["loss_participation"]
        await self.karma_service.award_karma(
            user_id=loser_id,
            action=KarmaAction.BATTLE_LOSS,
            reason=f"Participated in battle: {battle.title}",
            custom_points=self.KARMA_VALUES["loss_participation"]
        )

        # Update user battle stats
        await self._update_user_battle_stats(winner_id, "win")
        await self._update_user_battle_stats(loser_id, "loss")

    async def _award_draw(self, battle: Battle) -> None:
        """Award karma for a draw."""
        draw_karma = self.KARMA_VALUES["draw"]

        await self.karma_service.award_karma(
            user_id=battle.creator_id,
            action=KarmaAction.BATTLE_DRAW,
            reason=f"Draw in battle: {battle.title}",
            custom_points=draw_karma
        )

        await self.karma_service.award_karma(
            user_id=battle.opponent_id,
            action=KarmaAction.BATTLE_DRAW,
            reason=f"Draw in battle: {battle.title}",
            custom_points=draw_karma
        )

        await self._update_user_battle_stats(battle.creator_id, "draw")
        await self._update_user_battle_stats(battle.opponent_id, "draw")

    async def _update_user_battle_stats(self, user_id: int, result: str) -> None:
        """Update user's battle statistics."""
        user = await self.db.get(User, user_id)
        if not user:
            return

        if result == "win":
            user.battles_won += 1
            user.battle_win_streak += 1
            if user.battle_win_streak > user.best_battle_streak:
                user.best_battle_streak = user.battle_win_streak

            # Check for streak bonuses
            if user.battle_win_streak == 3:
                await self.karma_service.award_karma(
                    user_id=user_id,
                    action=KarmaAction.BATTLE_WIN_STREAK_3,
                    reason="3-battle win streak!",
                    custom_points=self.KARMA_VALUES["win_streak_3"]
                )
            elif user.battle_win_streak == 5:
                await self.karma_service.award_karma(
                    user_id=user_id,
                    action=KarmaAction.BATTLE_WIN_STREAK_5,
                    reason="5-battle win streak!",
                    custom_points=self.KARMA_VALUES["win_streak_5"]
                )

        elif result == "loss":
            user.battles_lost += 1
            user.battle_win_streak = 0

        elif result == "draw":
            user.battles_drawn += 1
            # Draws don't break win streak

        await self.db.commit()

    # ==================== QUERIES ====================

    async def get_battle(self, battle_id: int) -> Optional[Battle]:
        """Get a battle by ID with all relations."""
        return await self._get_battle_with_relations(battle_id)

    async def get_battles(
        self,
        status: Optional[BattleStatus] = None,
        content_type: Optional[ContentType] = None,
        user_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Battle], int]:
        """Get battles with filters."""
        stmt = select(Battle).where(Battle.deleted_at.is_(None))

        if status:
            stmt = stmt.where(Battle.status == status)
        if content_type:
            stmt = stmt.where(Battle.content_type == content_type)
        if user_id:
            stmt = stmt.where(
                or_(Battle.creator_id == user_id, Battle.opponent_id == user_id)
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # Get paginated results
        stmt = (
            stmt
            .options(
                selectinload(Battle.entries),
                selectinload(Battle.prompt),
                selectinload(Battle.challenge)
            )
            .order_by(Battle.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        battles = list(result.scalars().all())

        return battles, total

    async def get_active_battles(
        self,
        content_type: Optional[ContentType] = None,
        limit: int = 20
    ) -> List[Battle]:
        """Get battles currently in voting phase."""
        stmt = (
            select(Battle)
            .where(
                Battle.status == BattleStatus.VOTING,
                Battle.deleted_at.is_(None)
            )
            .options(
                selectinload(Battle.entries),
                selectinload(Battle.prompt),
                selectinload(Battle.challenge)
            )
            .order_by(Battle.voting_started_at.desc())
            .limit(limit)
        )

        if content_type:
            stmt = stmt.where(Battle.content_type == content_type)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_user_battle_stats(self, user_id: int) -> Dict[str, Any]:
        """Get battle statistics for a user."""
        user = await self.db.get(User, user_id)
        if not user:
            return {}

        total = user.battles_won + user.battles_lost + user.battles_drawn
        win_rate = (user.battles_won / total * 100) if total > 0 else 0

        # Get total votes received
        stmt = select(func.sum(BattleEntry.vote_count)).where(
            BattleEntry.user_id == user_id
        )
        result = await self.db.execute(stmt)
        total_votes_received = result.scalar() or 0

        # Get total votes cast
        stmt = select(func.count(BattleVote.id)).where(
            BattleVote.voter_id == user_id
        )
        result = await self.db.execute(stmt)
        total_votes_cast = result.scalar() or 0

        return {
            "battles_won": user.battles_won,
            "battles_lost": user.battles_lost,
            "battles_drawn": user.battles_drawn,
            "total_battles": total,
            "win_rate": round(win_rate, 1),
            "current_streak": user.battle_win_streak,
            "best_streak": user.best_battle_streak,
            "total_votes_received": total_votes_received,
            "total_votes_cast": total_votes_cast
        }

    # ==================== CHALLENGES ====================

    async def decline_challenge(self, battle_id: int, user_id: int) -> Battle:
        """Decline a direct challenge."""
        battle = await self._get_battle_with_relations(battle_id)
        if not battle:
            raise ValueError("Battle not found")

        if not battle.challenge:
            raise ValueError("No challenge found for this battle")

        if battle.challenge.challenged_id != user_id:
            raise ValueError("You were not challenged to this battle")

        if battle.challenge.status != ChallengeStatus.PENDING:
            raise ValueError("Challenge is no longer pending")

        battle.challenge.status = ChallengeStatus.DECLINED
        battle.challenge.responded_at = datetime.utcnow()
        battle.status = BattleStatus.CANCELLED

        await self.db.commit()
        await self.db.refresh(battle)

        # Notify challenger that challenge was declined
        await self._notify_challenge_declined(battle, user_id)

        return battle

    async def get_pending_challenges(self, user_id: int) -> List[Battle]:
        """Get pending challenges for a user."""
        stmt = (
            select(Battle)
            .join(BattleChallenge)
            .where(
                BattleChallenge.challenged_id == user_id,
                BattleChallenge.status == ChallengeStatus.PENDING,
                Battle.deleted_at.is_(None)
            )
            .options(
                selectinload(Battle.challenge),
                selectinload(Battle.prompt)
            )
            .order_by(Battle.created_at.desc())
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ==================== PRIVATE HELPERS ====================

    async def _get_battle_with_relations(self, battle_id: int) -> Optional[Battle]:
        """Get battle with all relationships loaded."""
        stmt = (
            select(Battle)
            .where(Battle.id == battle_id)
            .options(
                selectinload(Battle.entries),
                selectinload(Battle.votes),
                selectinload(Battle.challenge),
                selectinload(Battle.prompt)
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_user_entry(self, battle_id: int, user_id: int) -> Optional[BattleEntry]:
        """Get a user's entry for a battle."""
        stmt = select(BattleEntry).where(
            BattleEntry.battle_id == battle_id,
            BattleEntry.user_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_user_vote(self, battle_id: int, user_id: int) -> Optional[BattleVote]:
        """Check if user has voted in a battle."""
        stmt = select(BattleVote).where(
            BattleVote.battle_id == battle_id,
            BattleVote.voter_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _check_and_start_voting(self, battle: Battle) -> None:
        """Check if both entries submitted and start voting phase."""
        if battle.status != BattleStatus.ACTIVE:
            return

        # Count submitted entries
        submitted_count = sum(
            1 for entry in battle.entries
            if entry.submitted_at is not None
        )

        if submitted_count >= 2:
            now = datetime.utcnow()
            battle.status = BattleStatus.VOTING
            battle.voting_started_at = now
            battle.voting_deadline = now + timedelta(hours=battle.voting_hours)
            await self.db.commit()

            # Notify participants that voting has started
            await self._notify_voting_started(battle)

    # ==================== NOTIFICATION HELPERS ====================

    async def _notify_challenge_received(
        self,
        battle: Battle,
        challenger: User,
        challenged_id: int
    ) -> None:
        """Notify user that they've received a battle challenge."""
        challenger_name = challenger.full_name or challenger.email.split('@')[0]

        await self.notification_service.create_notification(
            user_id=challenged_id,
            notification_type=NotificationType.BATTLE_CHALLENGE_RECEIVED,
            title="You've been challenged!",
            message=f"{challenger_name} has challenged you to a battle: {battle.title}",
            priority=NotificationPriority.HIGH,
            entity_type=EntityType.BATTLE_CHALLENGE,
            entity_id=battle.id,
            action_url=f"/battles/{battle.id}",
            action_label="View Challenge",
            data={
                "battle_id": battle.id,
                "challenger_id": challenger.id,
                "challenger_name": challenger_name,
                "content_type": battle.content_type.value,
            }
        )

    async def _notify_battle_started(self, battle: Battle) -> None:
        """Notify both participants that their battle has begun."""
        creator = await self.db.get(User, battle.creator_id)
        opponent = await self.db.get(User, battle.opponent_id)

        if not creator or not opponent:
            return

        creator_name = creator.full_name or creator.email.split('@')[0]
        opponent_name = opponent.full_name or opponent.email.split('@')[0]

        # Notify creator
        await self.notification_service.create_notification(
            user_id=battle.creator_id,
            notification_type=NotificationType.BATTLE_STARTED,
            title="Battle has started!",
            message=f"Your battle against {opponent_name} has begun. Submit your entry before the deadline!",
            priority=NotificationPriority.HIGH,
            entity_type=EntityType.BATTLE,
            entity_id=battle.id,
            action_url=f"/battles/{battle.id}",
            action_label="Submit Entry",
            data={
                "battle_id": battle.id,
                "opponent_id": opponent.id,
                "opponent_name": opponent_name,
                "submission_deadline": battle.submission_deadline.isoformat() if battle.submission_deadline else None,
            }
        )

        # Notify opponent
        await self.notification_service.create_notification(
            user_id=battle.opponent_id,
            notification_type=NotificationType.BATTLE_STARTED,
            title="Battle has started!",
            message=f"Your battle against {creator_name} has begun. Submit your entry before the deadline!",
            priority=NotificationPriority.HIGH,
            entity_type=EntityType.BATTLE,
            entity_id=battle.id,
            action_url=f"/battles/{battle.id}",
            action_label="Submit Entry",
            data={
                "battle_id": battle.id,
                "opponent_id": creator.id,
                "opponent_name": creator_name,
                "submission_deadline": battle.submission_deadline.isoformat() if battle.submission_deadline else None,
            }
        )

    async def _notify_voting_started(self, battle: Battle) -> None:
        """Notify participants that voting has begun."""
        for user_id in [battle.creator_id, battle.opponent_id]:
            if user_id:
                await self.notification_service.create_notification(
                    user_id=user_id,
                    notification_type=NotificationType.BATTLE_VOTING_STARTED,
                    title="Voting has begun!",
                    message=f"Both entries have been submitted for '{battle.title}'. Community voting is now open!",
                    priority=NotificationPriority.MEDIUM,
                    entity_type=EntityType.BATTLE,
                    entity_id=battle.id,
                    action_url=f"/battles/{battle.id}",
                    action_label="View Battle",
                    data={
                        "battle_id": battle.id,
                        "voting_deadline": battle.voting_deadline.isoformat() if battle.voting_deadline else None,
                    }
                )

    async def _notify_battle_completed(self, battle: Battle) -> None:
        """Notify participants of battle results."""
        creator = await self.db.get(User, battle.creator_id)
        opponent = await self.db.get(User, battle.opponent_id)

        if not creator or not opponent:
            return

        if battle.status == BattleStatus.DRAW:
            # Both get draw notification
            for user_id in [battle.creator_id, battle.opponent_id]:
                await self.notification_service.create_notification(
                    user_id=user_id,
                    notification_type=NotificationType.BATTLE_ENDED_DRAW,
                    title="Battle ended in a draw!",
                    message=f"The battle '{battle.title}' has ended in a draw. Both participants receive karma!",
                    priority=NotificationPriority.HIGH,
                    entity_type=EntityType.BATTLE,
                    entity_id=battle.id,
                    action_url=f"/battles/{battle.id}",
                    action_label="View Results",
                    data={
                        "battle_id": battle.id,
                        "total_votes": battle.total_votes,
                    }
                )
        elif battle.winner_id:
            loser_id = battle.creator_id if battle.winner_id == battle.opponent_id else battle.opponent_id
            winner = await self.db.get(User, battle.winner_id)
            loser = await self.db.get(User, loser_id)

            if winner and loser:
                winner_name = winner.full_name or winner.email.split('@')[0]
                loser_name = loser.full_name or loser.email.split('@')[0]

                # Notify winner
                await self.notification_service.create_notification(
                    user_id=battle.winner_id,
                    notification_type=NotificationType.BATTLE_WON,
                    title="You won the battle!",
                    message=f"Congratulations! You won the battle '{battle.title}' against {loser_name}!",
                    priority=NotificationPriority.HIGH,
                    entity_type=EntityType.BATTLE,
                    entity_id=battle.id,
                    action_url=f"/battles/{battle.id}",
                    action_label="View Results",
                    data={
                        "battle_id": battle.id,
                        "karma_reward": battle.winner_karma_reward,
                        "total_votes": battle.total_votes,
                        "your_votes": battle.creator_votes if battle.winner_id == battle.creator_id else battle.opponent_votes,
                    }
                )

                # Notify loser
                await self.notification_service.create_notification(
                    user_id=loser_id,
                    notification_type=NotificationType.BATTLE_LOST,
                    title="Battle completed",
                    message=f"The battle '{battle.title}' has ended. {winner_name} won this round, but you earned participation karma!",
                    priority=NotificationPriority.MEDIUM,
                    entity_type=EntityType.BATTLE,
                    entity_id=battle.id,
                    action_url=f"/battles/{battle.id}",
                    action_label="View Results",
                    data={
                        "battle_id": battle.id,
                        "karma_reward": battle.loser_karma_change,
                        "total_votes": battle.total_votes,
                        "your_votes": battle.creator_votes if loser_id == battle.creator_id else battle.opponent_votes,
                    }
                )

    async def _notify_challenge_declined(self, battle: Battle, decliner_id: int) -> None:
        """Notify challenger that their challenge was declined."""
        decliner = await self.db.get(User, decliner_id)
        if not decliner:
            return

        decliner_name = decliner.full_name or decliner.email.split('@')[0]

        await self.notification_service.create_notification(
            user_id=battle.creator_id,
            notification_type=NotificationType.BATTLE_CHALLENGE_DECLINED,
            title="Challenge declined",
            message=f"{decliner_name} declined your battle challenge for '{battle.title}'.",
            priority=NotificationPriority.MEDIUM,
            entity_type=EntityType.BATTLE,
            entity_id=battle.id,
            action_url="/battles",
            action_label="Find Opponent",
            data={
                "battle_id": battle.id,
                "decliner_id": decliner_id,
                "decliner_name": decliner_name,
            }
        )
