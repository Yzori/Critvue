"""Challenge-related Pydantic schemas"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator

from app.models.review_request import ContentType
from app.models.challenge import ChallengeStatus, ChallengeType, InvitationMode
from app.models.challenge_prompt import PromptDifficulty
from app.models.challenge_invitation import InvitationStatus


# ===== ChallengePrompt Schemas =====

class ChallengePromptBase(BaseModel):
    """Base schema for challenge prompts"""
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=2000)
    content_type: ContentType
    difficulty: PromptDifficulty = PromptDifficulty.INTERMEDIATE


class ChallengePromptCreate(ChallengePromptBase):
    """Schema for creating a challenge prompt (admin only)"""
    is_active: bool = True


class ChallengePromptUpdate(BaseModel):
    """Schema for updating a challenge prompt"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    content_type: Optional[ContentType] = None
    difficulty: Optional[PromptDifficulty] = None
    is_active: Optional[bool] = None


class ChallengePromptResponse(ChallengePromptBase):
    """Schema for challenge prompt response"""
    id: int
    is_active: bool
    times_used: int
    created_at: datetime

    class Config:
        from_attributes = True


class ChallengePromptListResponse(BaseModel):
    """Schema for paginated list of challenge prompts"""
    items: List[ChallengePromptResponse]
    total: int


# ===== ChallengeEntry Schemas =====

class ChallengeEntryBase(BaseModel):
    """Base schema for challenge entries"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)


class ChallengeEntryCreate(ChallengeEntryBase):
    """Schema for creating/submitting a challenge entry"""
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


class ChallengeEntryUpdate(BaseModel):
    """Schema for updating a challenge entry (before submission deadline)"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    file_urls: Optional[List[Dict[str, Any]]] = None
    external_links: Optional[List[Dict[str, Any]]] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)


class ChallengeEntryResponse(ChallengeEntryBase):
    """Schema for challenge entry response"""
    id: int
    challenge_id: int
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
    user_tier: Optional[str] = None

    class Config:
        from_attributes = True


class ChallengeEntryRedacted(BaseModel):
    """Redacted entry for blind submission period (1v1 challenges)"""
    id: int
    challenge_id: int
    user_id: int
    is_submitted: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ===== ChallengeVote Schemas =====

class ChallengeVoteCreate(BaseModel):
    """Schema for casting a vote"""
    entry_id: int = Field(..., description="ID of the entry to vote for")


class ChallengeVoteResponse(BaseModel):
    """Schema for vote response"""
    id: int
    challenge_id: int
    voter_id: int
    entry_id: int
    voted_at: datetime

    class Config:
        from_attributes = True


class ChallengeVoteStats(BaseModel):
    """Schema for vote statistics (after voting ends)"""
    total_votes: int
    # For 1v1 challenges
    participant1_votes: Optional[int] = None
    participant2_votes: Optional[int] = None
    participant1_percentage: Optional[float] = None
    participant2_percentage: Optional[float] = None
    # For category challenges - top entries
    top_entries: Optional[List[Dict[str, Any]]] = None


# ===== ChallengeInvitation Schemas =====

class ChallengeInvitationCreate(BaseModel):
    """Schema for creating an invitation (admin only)"""
    user_id: int = Field(..., description="User ID to invite")
    slot: int = Field(..., ge=1, le=2, description="Participant slot (1 or 2)")
    message: Optional[str] = Field(None, max_length=500, description="Optional invitation message")


class ChallengeInvitationResponse(BaseModel):
    """Schema for invitation response"""
    id: int
    challenge_id: int
    user_id: int
    slot: int
    status: InvitationStatus
    message: Optional[str] = None
    expires_at: datetime
    created_at: datetime
    responded_at: Optional[datetime] = None

    # User info
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    user_tier: Optional[str] = None

    class Config:
        from_attributes = True


class InvitationRespondRequest(BaseModel):
    """Schema for responding to an invitation"""
    accept: bool = Field(..., description="True to accept, False to decline")


# ===== ChallengeParticipant Schemas =====

class ChallengeParticipantResponse(BaseModel):
    """Schema for participant response"""
    id: int
    challenge_id: int
    user_id: int
    joined_at: datetime
    placement: Optional[int] = None
    karma_earned: Optional[int] = None

    # User info
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    user_tier: Optional[str] = None

    class Config:
        from_attributes = True


# ===== Challenge Schemas =====

class ChallengeBase(BaseModel):
    """Base schema for challenges"""
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    content_type: ContentType
    prompt_id: Optional[int] = Field(None, description="ID of the curated prompt for this challenge")


class ChallengeCreateAdmin(ChallengeBase):
    """Schema for admin creating a challenge"""
    challenge_type: ChallengeType
    submission_hours: int = Field(default=72, ge=24, le=168)
    voting_hours: int = Field(default=48, ge=24, le=96)

    # 1v1-specific: how participants are selected
    invitation_mode: InvitationMode = Field(
        default=InvitationMode.ADMIN_CURATED,
        description="For 1v1: admin_curated (invite specific users) or open_slots (first-come-first-served)"
    )

    # Category-specific
    max_winners: int = Field(default=1, ge=1, le=10, description="Number of winners (for category challenges)")

    # Display options
    is_featured: bool = False
    banner_image_url: Optional[str] = Field(None, max_length=500)
    prize_description: Optional[str] = Field(None, max_length=1000)

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        return v.strip()


class ChallengeUpdateAdmin(BaseModel):
    """Schema for admin updating a challenge"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    submission_hours: Optional[int] = Field(None, ge=24, le=168)
    voting_hours: Optional[int] = Field(None, ge=24, le=96)
    max_winners: Optional[int] = Field(None, ge=1, le=10)
    is_featured: Optional[bool] = None
    banner_image_url: Optional[str] = Field(None, max_length=500)
    prize_description: Optional[str] = Field(None, max_length=1000)


class ChallengeResponse(ChallengeBase):
    """Schema for challenge response"""
    id: int
    challenge_type: ChallengeType
    status: ChallengeStatus

    # Timing
    submission_hours: int
    voting_hours: int
    submission_deadline: Optional[datetime] = None
    voting_deadline: Optional[datetime] = None

    # Category-specific
    max_winners: int = 1
    total_entries: int = 0

    # 1v1-specific
    participant1_id: Optional[int] = None
    participant2_id: Optional[int] = None
    winner_id: Optional[int] = None
    participant1_votes: int = 0
    participant2_votes: int = 0

    # 1v1 invitation mode
    invitation_mode: InvitationMode = InvitationMode.ADMIN_CURATED
    slots_open_at: Optional[datetime] = None
    slots_close_at: Optional[datetime] = None
    has_open_slots: bool = False  # Computed property
    available_slots: int = 0      # Computed property

    # Display
    is_featured: bool = False
    banner_image_url: Optional[str] = None
    prize_description: Optional[str] = None

    # Stats
    total_votes: int = 0

    # Rewards
    winner_karma_reward: Optional[int] = None

    # Timestamps
    created_at: datetime
    started_at: Optional[datetime] = None
    voting_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Admin who created
    created_by: int

    # Related objects
    prompt: Optional[ChallengePromptResponse] = None
    entries: List[ChallengeEntryResponse] = []
    invitations: List[ChallengeInvitationResponse] = []

    # User info (for 1v1)
    participant1_name: Optional[str] = None
    participant1_avatar: Optional[str] = None
    participant2_name: Optional[str] = None
    participant2_avatar: Optional[str] = None
    winner_name: Optional[str] = None

    # Creator info
    creator_name: Optional[str] = None

    # Current user context
    current_user_entry: Optional[ChallengeEntryResponse] = None
    current_user_voted: bool = False
    current_user_vote_entry_id: Optional[int] = None
    current_user_invitation: Optional[ChallengeInvitationResponse] = None
    current_user_is_participant: bool = False

    class Config:
        from_attributes = True


class ChallengeResponseBlind(ChallengeResponse):
    """Challenge response with blind entries (during 1v1 submission period)"""
    entries: List[ChallengeEntryRedacted] = []  # type: ignore


class ChallengeListResponse(BaseModel):
    """Schema for paginated list of challenges"""
    items: List[ChallengeResponse]
    total: int
    skip: int
    limit: int
    has_more: bool


# ===== Challenge Stats Schemas =====

class ChallengeStats(BaseModel):
    """Schema for user challenge statistics"""
    challenges_won: int = 0
    challenges_lost: int = 0
    challenges_drawn: int = 0
    total_challenges: int = 0
    win_rate: float = 0.0
    current_streak: int = 0
    best_streak: int = 0
    total_votes_received: int = 0
    total_votes_cast: int = 0
    # Category challenge stats
    category_participations: int = 0
    category_wins: int = 0


class ChallengeLeaderboardEntry(BaseModel):
    """Schema for challenge leaderboard entry"""
    rank: int
    user_id: int
    username: Optional[str] = None  # SEO-friendly URL identifier
    user_name: str
    user_avatar: Optional[str] = None
    user_tier: Optional[str] = None
    challenges_won: int
    win_rate: float
    best_streak: int


class ChallengeLeaderboardResponse(BaseModel):
    """Schema for challenge leaderboard"""
    entries: List[ChallengeLeaderboardEntry]
    total_participants: int
    current_user_rank: Optional[int] = None


# ===== Challenge Results Schemas =====

class ChallengeResults(BaseModel):
    """Schema for challenge results"""
    challenge_id: int
    challenge_type: ChallengeType
    status: ChallengeStatus

    # 1v1 results
    winner_id: Optional[int] = None
    winner_name: Optional[str] = None
    loser_id: Optional[int] = None
    loser_name: Optional[str] = None
    is_draw: bool = False

    # Category results (top placements)
    placements: Optional[List[Dict[str, Any]]] = None

    # Vote stats
    vote_stats: ChallengeVoteStats
    winner_karma_reward: Optional[int] = None


# ===== Filter Schemas =====

class ChallengeFilters(BaseModel):
    """Schema for challenge list filters"""
    status: Optional[ChallengeStatus] = None
    challenge_type: Optional[ChallengeType] = None
    content_type: Optional[ContentType] = None
    is_featured: Optional[bool] = None
    prompt_id: Optional[int] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)


# ===== Admin Action Schemas =====

class ActivateChallengeRequest(BaseModel):
    """Schema for activating a challenge (admin)"""
    # No body needed, just confirmation


class ReplaceInvitationRequest(BaseModel):
    """Schema for replacing a declined invitation"""
    new_user_id: int = Field(..., description="User ID of the replacement invitee")
    message: Optional[str] = Field(None, max_length=500, description="Optional invitation message")


# ===== Open Slots Schemas =====

class OpenSlotsRequest(BaseModel):
    """Schema for opening slots for a 1v1 challenge"""
    duration_hours: int = Field(
        default=24,
        ge=1,
        le=168,
        description="How long slots remain open for claiming (1-168 hours)"
    )


class SlotClaimResponse(BaseModel):
    """Schema for slot claim response"""
    challenge_id: int
    user_id: int
    slot: int  # 1 or 2
    claimed_at: datetime
    challenge_activated: bool  # True if this claim filled both slots and activated the challenge

    class Config:
        from_attributes = True


class OpenSlotChallengeResponse(BaseModel):
    """Schema for challenge with open slots (simplified for listing)"""
    id: int
    title: str
    description: Optional[str] = None
    content_type: ContentType
    prompt: Optional[ChallengePromptResponse] = None
    available_slots: int
    slots_close_at: Optional[datetime] = None
    submission_hours: int
    voting_hours: int
    prize_description: Optional[str] = None
    winner_karma_reward: Optional[int] = None
    is_featured: bool = False

    # Who's already claimed a slot
    participant1_id: Optional[int] = None
    participant1_name: Optional[str] = None
    participant1_avatar: Optional[str] = None

    class Config:
        from_attributes = True
