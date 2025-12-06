"""
Leaderboard Schemas

Response models for leaderboard endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class LeaderboardEntry(BaseModel):
    """Individual entry in a leaderboard"""
    user_id: int
    username: Optional[str] = Field(None, description="SEO-friendly URL identifier")
    full_name: Optional[str]
    avatar_url: Optional[str]
    user_tier: str
    rank: int
    rank_change: Optional[int] = Field(
        None,
        description="Change in rank from previous period (positive = moved up, negative = moved down)"
    )

    # Stats (which stat is shown depends on the leaderboard type)
    karma_points: Optional[int] = None
    acceptance_rate: Optional[float] = None
    current_streak: Optional[int] = None
    accepted_reviews_count: Optional[int] = None
    avg_rating: Optional[float] = None

    class Config:
        from_attributes = True


class LeaderboardMetadata(BaseModel):
    """Metadata about the leaderboard query"""
    total_entries: int
    limit: int
    offset: int
    period: str
    tier_filter: Optional[str]


class CurrentUserPosition(BaseModel):
    """Current user's position in the leaderboard"""
    user_id: int
    rank: int
    total_users: int
    percentile: float = Field(
        description="User's percentile ranking (0-100, where 100 is top)"
    )
    stat_value: float = Field(
        description="The value of the stat being ranked"
    )


class LeaderboardResponse(BaseModel):
    """Complete leaderboard response"""
    entries: List[LeaderboardEntry]
    metadata: LeaderboardMetadata
    current_user_position: Optional[CurrentUserPosition] = Field(
        None,
        description="Current user's position, even if not in top results"
    )


class UserCategoryPosition(BaseModel):
    """User's position in a specific ranking category"""
    category: str
    rank: int
    total_users: int
    percentile: float
    stat_value: float


class UserPositionResponse(BaseModel):
    """User's position across all leaderboard categories"""
    user_id: int
    user_tier: str
    tier_rank_in_tier: int = Field(
        description="User's rank among users in their same tier"
    )
    tier_total_in_tier: int = Field(
        description="Total number of users in their tier"
    )
    positions: List[UserCategoryPosition]

    class Config:
        from_attributes = True
