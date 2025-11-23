"""Pydantic schemas for notification API"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.notification import (
    NotificationType,
    NotificationPriority,
    NotificationChannel,
    EntityType,
    EmailDigestFrequency,
)


# ==================== Base Schemas ====================

class NotificationBase(BaseModel):
    """Base notification schema"""
    type: NotificationType
    title: str = Field(..., max_length=255)
    message: str
    data: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = Field(None, max_length=500)
    action_label: Optional[str] = Field(None, max_length=100)
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channels: List[NotificationChannel]
    entity_type: Optional[EntityType] = None
    entity_id: Optional[int] = None


# ==================== API Response Schemas ====================

class NotificationResponse(BaseModel):
    """Notification response for API"""
    id: int
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]]
    read: bool
    archived: bool
    action_url: Optional[str]
    action_label: Optional[str]
    priority: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    created_at: datetime
    read_at: Optional[datetime]
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Paginated list of notifications"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    page_size: int
    total_pages: int


class NotificationStatsResponse(BaseModel):
    """Notification statistics"""
    total: int
    unread: int
    archived: int
    by_priority: Dict[str, int]
    by_type: Dict[str, int]


# ==================== Create/Update Schemas ====================

class NotificationCreate(NotificationBase):
    """Schema for creating a notification (internal use)"""
    user_id: int
    expires_at: Optional[datetime] = None


class NotificationMarkRead(BaseModel):
    """Mark notification as read"""
    read: bool = True


class NotificationMarkAllRead(BaseModel):
    """Mark all notifications as read"""
    pass


class NotificationArchive(BaseModel):
    """Archive notification"""
    archived: bool = True


# ==================== Notification Preferences ====================

class NotificationPreferencesBase(BaseModel):
    """Base preferences schema"""
    email_enabled: bool = True
    push_enabled: bool = False
    sms_enabled: bool = False
    email_digest_frequency: EmailDigestFrequency = EmailDigestFrequency.IMMEDIATE
    email_digest_time: int = Field(9, ge=0, le=23, description="Hour of day (0-23)")
    email_digest_day: int = Field(1, ge=1, le=7, description="Day of week (1=Monday)")
    quiet_hours_enabled: bool = False
    quiet_hours_start: Optional[int] = Field(None, ge=0, le=23)
    quiet_hours_end: Optional[int] = Field(None, ge=0, le=23)
    category_preferences: Optional[Dict[str, Dict[str, bool]]] = None


class NotificationPreferencesResponse(NotificationPreferencesBase):
    """Response for notification preferences"""
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationPreferencesUpdate(BaseModel):
    """Update notification preferences"""
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    email_digest_frequency: Optional[EmailDigestFrequency] = None
    email_digest_time: Optional[int] = Field(None, ge=0, le=23)
    email_digest_day: Optional[int] = Field(None, ge=1, le=7)
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[int] = Field(None, ge=0, le=23)
    quiet_hours_end: Optional[int] = Field(None, ge=0, le=23)
    category_preferences: Optional[Dict[str, Dict[str, bool]]] = None


# ==================== Query Parameters ====================

class NotificationFilters(BaseModel):
    """Filters for querying notifications"""
    read: Optional[bool] = None
    archived: Optional[bool] = None
    type: Optional[NotificationType] = None
    priority: Optional[NotificationPriority] = None
    entity_type: Optional[EntityType] = None
    entity_id: Optional[int] = None
    since: Optional[datetime] = None  # Only notifications after this date
    before: Optional[datetime] = None  # Only notifications before this date


# ==================== Notification Templates (for creating notifications) ====================

class ReviewSlotClaimedData(BaseModel):
    """Data for review slot claimed notification"""
    slot_id: int
    review_request_id: int
    review_request_title: str
    reviewer_id: int
    reviewer_name: str
    reviewer_avatar: Optional[str]
    claim_deadline: datetime
    remaining_slots: int


class ReviewSubmittedData(BaseModel):
    """Data for review submitted notification"""
    slot_id: int
    review_request_id: int
    review_request_title: str
    reviewer_id: int
    reviewer_name: str
    reviewer_avatar: Optional[str]
    rating_given: int
    review_preview: str
    auto_accept_deadline: datetime


class ReviewAcceptedData(BaseModel):
    """Data for review accepted notification"""
    slot_id: int
    review_request_id: int
    review_request_title: str
    karma_earned: int
    new_karma_balance: int
    helpful_rating: float
    acceptance_type: str  # "manual" or "auto"


class ReviewRejectedData(BaseModel):
    """Data for review rejected notification"""
    slot_id: int
    review_request_id: int
    review_request_title: str
    rejection_reason: str
    rejection_notes: Optional[str]
    karma_penalty: int
    new_karma_balance: int
    can_dispute: bool
    dispute_deadline: Optional[datetime]


class TierPromotedData(BaseModel):
    """Data for tier promotion notification"""
    old_tier: str
    new_tier: str
    karma_points: int
    total_reviews: int
    acceptance_rate: float
    benefits_unlocked: List[str]
    next_tier: Optional[str]
    karma_to_next: Optional[int]


class KarmaEarnedData(BaseModel):
    """Data for karma earned notification"""
    action: str
    points_earned: int
    new_balance: int
    reason: str
    related_entity_type: Optional[str]
    related_entity_id: Optional[int]


class DeadlineWarningData(BaseModel):
    """Data for deadline warning notifications"""
    slot_id: int
    review_request_id: int
    review_request_title: str
    deadline: datetime
    hours_remaining: int
    warning_type: str  # "claim_timeout", "auto_accept", "submission"


class SubscriptionEventData(BaseModel):
    """Data for subscription event notifications"""
    subscription_id: Optional[str]
    tier: str
    status: str
    event_type: str  # "created", "canceled", "payment_succeeded", "payment_failed"
    amount: Optional[float]
    next_billing_date: Optional[datetime]
