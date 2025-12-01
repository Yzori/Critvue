"""Battle-related Pydantic schemas"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator

from app.models.review_request import ContentType
from app.models.battle import BattleStatus, BattleType
from app.models.battle_prompt import PromptDifficulty
from app.models.battle_challenge import ChallengeStatus


# ===== BattlePrompt Schemas =====

class BattlePromptBase(BaseModel):
    """Base schema for battle prompts"""
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=2000)
    content_type: ContentType
    difficulty: PromptDifficulty = PromptDifficulty.INTERMEDIATE


class BattlePromptCreate(BattlePromptBase):
    """Schema for creating a battle prompt (admin only)"""
    is_active: bool = True


class BattlePromptUpdate(BaseModel):
    """Schema for updating a battle prompt"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    content_type: Optional[ContentType] = None
    difficulty: Optional[PromptDifficulty] = None
    is_active: Optional[bool] = None


class BattlePromptResponse(BattlePromptBase):
    """Schema for battle prompt response"""
    id: int
    is_active: bool
    times_used: int
    created_at: datetime

    class Config:
        from_attributes = True


class BattlePromptListResponse(BaseModel):
    """Schema for paginated list of battle prompts"""
    items: List[BattlePromptResponse]
    total: int


# ===== BattleEntry Schemas =====

class BattleEntryBase(BaseModel):
    """Base schema for battle entries"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)


class BattleEntryCreate(BattleEntryBase):
    """Schema for creating/submitting a battle entry"""
    file_urls: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="List of file metadata: [{url, filename, size, type}]"
    )
    external_links: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="List of external links: [{url, type, title}]"
    )
    thumbnail_url: Optional[str] = Field(None, max_length=500)

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        return v.strip()


class BattleEntryUpdate(BaseModel):
    """Schema for updating a battle entry (before submission deadline)"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    file_urls: Optional[List[Dict[str, Any]]] = None
    external_links: Optional[List[Dict[str, Any]]] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)


class BattleEntryResponse(BattleEntryBase):
    """Schema for battle entry response"""
    id: int
    battle_id: int
    user_id: int
    file_urls: Optional[List[Dict[str, Any]]] = None
    external_links: Optional[List[Dict[str, Any]]] = None
    thumbnail_url: Optional[str] = None
    vote_count: int = 0
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None

    # User info
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class BattleEntryRedacted(BaseModel):
    """Redacted entry for blind submission period"""
    id: int
    battle_id: int
    user_id: int
    is_submitted: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===== BattleVote Schemas =====

class BattleVoteCreate(BaseModel):
    """Schema for casting a vote"""
    entry_id: int = Field(..., description="ID of the entry to vote for")


class BattleVoteResponse(BaseModel):
    """Schema for vote response"""
    id: int
    battle_id: int
    voter_id: int
    entry_id: int
    voted_at: datetime

    class Config:
        from_attributes = True


class BattleVoteStats(BaseModel):
    """Schema for vote statistics (after voting ends)"""
    total_votes: int
    creator_votes: int
    opponent_votes: int
    creator_percentage: float
    opponent_percentage: float


# ===== BattleChallenge Schemas =====

class BattleChallengeCreate(BaseModel):
    """Schema for creating a direct challenge"""
    challenged_id: int = Field(..., description="User ID of the person being challenged")
    message: Optional[str] = Field(None, max_length=500, description="Optional message to the challenged user")


class BattleChallengeResponse(BaseModel):
    """Schema for challenge response"""
    id: int
    battle_id: int
    challenger_id: int
    challenged_id: int
    message: Optional[str] = None
    status: ChallengeStatus
    expires_at: datetime
    created_at: datetime
    responded_at: Optional[datetime] = None

    # User info
    challenger_name: Optional[str] = None
    challenger_avatar: Optional[str] = None
    challenged_name: Optional[str] = None
    challenged_avatar: Optional[str] = None

    class Config:
        from_attributes = True


# ===== Battle Schemas =====

class BattleBase(BaseModel):
    """Base schema for battles"""
    title: str = Field(..., min_length=3, max_length=255)
    content_type: ContentType
    prompt_id: int = Field(..., description="ID of the curated prompt for this battle")


class BattleCreate(BattleBase):
    """Schema for creating a battle"""
    battle_type: BattleType = BattleType.QUEUE
    submission_hours: int = Field(default=72, ge=24, le=168)
    voting_hours: int = Field(default=48, ge=24, le=96)

    # For direct challenges
    challenged_user_id: Optional[int] = Field(
        None,
        description="User ID to challenge directly (required if battle_type is DIRECT)"
    )
    challenge_message: Optional[str] = Field(
        None,
        max_length=500,
        description="Message for direct challenge"
    )

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        return v.strip()


class BattleJoinQueue(BaseModel):
    """Schema for joining the matchmaking queue"""
    content_type: ContentType
    prompt_id: int = Field(..., description="ID of the prompt to battle on")


class BattleResponse(BattleBase):
    """Schema for battle response"""
    id: int
    creator_id: int
    opponent_id: Optional[int] = None
    winner_id: Optional[int] = None
    battle_type: BattleType
    status: BattleStatus

    # Timing
    submission_hours: int
    voting_hours: int
    submission_deadline: Optional[datetime] = None
    voting_deadline: Optional[datetime] = None

    # Vote counts (hidden during voting if blind)
    creator_votes: int = 0
    opponent_votes: int = 0
    total_votes: int = 0

    # Rewards
    winner_karma_reward: Optional[int] = None
    loser_karma_change: Optional[int] = None

    # Timestamps
    created_at: datetime
    started_at: Optional[datetime] = None
    voting_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Related objects
    prompt: Optional[BattlePromptResponse] = None
    entries: List[BattleEntryResponse] = []
    challenge: Optional[BattleChallengeResponse] = None

    # User info
    creator_name: Optional[str] = None
    creator_avatar: Optional[str] = None
    opponent_name: Optional[str] = None
    opponent_avatar: Optional[str] = None
    winner_name: Optional[str] = None

    # Current user context
    current_user_entry: Optional[BattleEntryResponse] = None
    current_user_voted: bool = False
    current_user_vote_entry_id: Optional[int] = None

    class Config:
        from_attributes = True


class BattleResponseBlind(BattleResponse):
    """Battle response with blind entries (during submission period)"""
    entries: List[BattleEntryRedacted] = []  # type: ignore


class BattleListResponse(BaseModel):
    """Schema for paginated list of battles"""
    items: List[BattleResponse]
    total: int
    skip: int
    limit: int
    has_more: bool


# ===== Queue Schemas =====

class QueueStatus(BaseModel):
    """Schema for queue status"""
    in_queue: bool
    content_type: Optional[ContentType] = None
    prompt_id: Optional[int] = None
    prompt_title: Optional[str] = None
    joined_at: Optional[datetime] = None
    estimated_wait: Optional[str] = None  # e.g., "~5 minutes"


# ===== Battle Stats Schemas =====

class BattleStats(BaseModel):
    """Schema for user battle statistics"""
    battles_won: int = 0
    battles_lost: int = 0
    battles_drawn: int = 0
    total_battles: int = 0
    win_rate: float = 0.0
    current_streak: int = 0
    best_streak: int = 0
    total_votes_received: int = 0
    total_votes_cast: int = 0


class BattleLeaderboardEntry(BaseModel):
    """Schema for battle leaderboard entry"""
    rank: int
    user_id: int
    user_name: str
    user_avatar: Optional[str] = None
    battles_won: int
    win_rate: float
    best_streak: int


class BattleLeaderboardResponse(BaseModel):
    """Schema for battle leaderboard"""
    entries: List[BattleLeaderboardEntry]
    total_participants: int
    current_user_rank: Optional[int] = None


# ===== Battle Results Schemas =====

class BattleResults(BaseModel):
    """Schema for battle results"""
    battle_id: int
    status: BattleStatus
    winner_id: Optional[int] = None
    winner_name: Optional[str] = None
    loser_id: Optional[int] = None
    loser_name: Optional[str] = None
    is_draw: bool = False
    vote_stats: BattleVoteStats
    winner_karma_reward: Optional[int] = None
    loser_karma_change: Optional[int] = None


# ===== Filter Schemas =====

class BattleFilters(BaseModel):
    """Schema for battle list filters"""
    status: Optional[BattleStatus] = None
    content_type: Optional[ContentType] = None
    user_id: Optional[int] = None
    prompt_id: Optional[int] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)
