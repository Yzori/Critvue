"""Schemas for admin user management"""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from enum import Enum

from app.models.user import UserRole, UserTier, SubscriptionTier


# ============ Request Schemas ============

class UserRoleChangeRequest(BaseModel):
    """Request to change a user's role"""
    role: UserRole
    reason: Optional[str] = None


class BanUserRequest(BaseModel):
    """Request to ban a user"""
    reason: str = Field(..., min_length=10, description="Reason for banning (required)")


class SuspendUserRequest(BaseModel):
    """Request to suspend a user temporarily"""
    reason: str = Field(..., min_length=10, description="Reason for suspension")
    duration_hours: int = Field(..., ge=1, le=8760, description="Suspension duration in hours (max 1 year)")


class KarmaAdjustRequest(BaseModel):
    """Request to adjust a user's karma"""
    amount: int = Field(..., description="Amount to add (positive) or subtract (negative)")
    reason: str = Field(..., min_length=5, description="Reason for karma adjustment")


class TierOverrideRequest(BaseModel):
    """Request to override a user's tier"""
    tier: UserTier
    reason: Optional[str] = None


class UserSearchParams(BaseModel):
    """Parameters for searching/filtering users"""
    query: Optional[str] = None  # Search in email, full_name
    role: Optional[UserRole] = None
    tier: Optional[UserTier] = None
    subscription: Optional[SubscriptionTier] = None
    is_banned: Optional[bool] = None
    is_suspended: Optional[bool] = None
    is_verified: Optional[bool] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = 1
    page_size: int = 20


# ============ Response Schemas ============

class UserListItem(BaseModel):
    """User item in list view"""
    id: int
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: UserRole
    user_tier: UserTier
    subscription_tier: SubscriptionTier
    karma_points: int
    is_active: bool
    is_verified: bool
    is_banned: bool
    is_suspended: bool
    suspended_until: Optional[datetime]
    total_reviews_given: int
    total_reviews_received: int
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Paginated user list response"""
    users: List[UserListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserDetailResponse(BaseModel):
    """Detailed user information for admin view"""
    id: int
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    title: Optional[str]
    role: UserRole
    user_tier: UserTier
    subscription_tier: SubscriptionTier
    subscription_status: Optional[str]

    # Stats
    karma_points: int
    xp_points: int
    reputation_score: int
    total_reviews_given: int
    total_reviews_received: int
    avg_rating: Optional[float]
    acceptance_rate: Optional[float]
    current_streak: int
    longest_streak: int

    # Challenges
    challenges_won: int
    challenges_lost: int
    challenges_drawn: int

    # Status
    is_active: bool
    is_verified: bool
    is_banned: bool
    banned_at: Optional[datetime]
    ban_reason: Optional[str]
    is_suspended: bool
    suspended_until: Optional[datetime]
    suspended_at: Optional[datetime]
    suspension_reason: Optional[str]

    # Timestamps
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class ModerationActionResponse(BaseModel):
    """Response for moderation actions"""
    success: bool
    message: str
    user_id: int
    action: str


class AdminStatsResponse(BaseModel):
    """Admin dashboard statistics"""
    total_users: int
    new_users_this_week: int
    active_users_today: int
    total_reviewers: int
    total_admins: int
    banned_users: int
    suspended_users: int
    pending_applications: int
    approved_this_month: int
    rejected_this_month: int
    active_challenges: int
    total_reviews: int
    avg_review_time_days: float


# ============ Audit Log Schemas ============

class AuditLogEntry(BaseModel):
    """Single audit log entry"""
    id: int
    admin_id: int
    admin_email: Optional[str]
    admin_name: Optional[str]
    action: str
    target_user_id: Optional[int]
    target_user_email: Optional[str]
    target_entity_type: Optional[str]
    target_entity_id: Optional[int]
    details: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    """Paginated audit log response"""
    entries: List[AuditLogEntry]
    total: int
    page: int
    page_size: int


class BannedUserListResponse(BaseModel):
    """List of banned users"""
    users: List[UserListItem]
    total: int


class SuspendedUserListResponse(BaseModel):
    """List of suspended users"""
    users: List[UserListItem]
    total: int
