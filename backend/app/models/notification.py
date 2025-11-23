"""Notification models for in-app and email notifications"""

import enum
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.models.user import Base


class NotificationType(str, enum.Enum):
    """Types of notifications in the system"""

    # Review Lifecycle
    REVIEW_SLOT_CLAIMED = "review_slot_claimed"
    REVIEW_SUBMITTED = "review_submitted"
    REVIEW_ACCEPTED = "review_accepted"
    REVIEW_REJECTED = "review_rejected"
    REVIEW_AUTO_ACCEPTED = "review_auto_accepted"
    REVIEW_ABANDONED = "review_abandoned"
    REVIEW_ABANDONED_TIMEOUT = "review_abandoned_timeout"
    ALL_SLOTS_CLAIMED = "all_slots_claimed"
    ALL_REVIEWS_COMPLETED = "all_reviews_completed"

    # Deadlines & Reminders
    CLAIM_DEADLINE_24H = "claim_deadline_24h"
    CLAIM_DEADLINE_6H = "claim_deadline_6h"
    AUTO_ACCEPT_DEADLINE_48H = "auto_accept_deadline_48h"
    AUTO_ACCEPT_DEADLINE_24H = "auto_accept_deadline_24h"
    SUBMISSION_DEADLINE_APPROACHING = "submission_deadline_approaching"

    # Disputes
    DISPUTE_CREATED = "dispute_created"
    DISPUTE_RESOLVED_REVIEWER_WINS = "dispute_resolved_reviewer_wins"
    DISPUTE_RESOLVED_CREATOR_WINS = "dispute_resolved_creator_wins"

    # Karma & Tier
    KARMA_EARNED = "karma_earned"
    KARMA_LOST = "karma_lost"
    STREAK_MILESTONE = "streak_milestone"
    TIER_PROMOTED = "tier_promoted"
    TIER_PROGRESS = "tier_progress"
    ACCEPTANCE_RATE_WARNING = "acceptance_rate_warning"

    # Expert Applications
    EXPERT_APPLICATION_SUBMITTED = "expert_application_submitted"
    EXPERT_APPLICATION_UNDER_REVIEW = "expert_application_under_review"
    EXPERT_APPLICATION_APPROVED = "expert_application_approved"
    EXPERT_APPLICATION_REJECTED = "expert_application_rejected"

    # Subscriptions & Payments
    REVIEW_LIMIT_APPROACHING = "review_limit_approaching"
    REVIEW_LIMIT_REACHED = "review_limit_reached"
    REVIEW_LIMIT_RESET = "review_limit_reset"
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_CANCELED = "subscription_canceled"
    PAYMENT_SUCCEEDED = "payment_succeeded"
    PAYMENT_FAILED = "payment_failed"

    # Expert/Paid Reviews
    EXPERT_REVIEW_CLAIMED = "expert_review_claimed"
    EXPERT_PAYMENT_RELEASED = "expert_payment_released"
    EXPERT_PAYMENT_REFUNDED = "expert_payment_refunded"
    WEEKLY_PAID_LIMIT_REACHED = "weekly_paid_limit_reached"

    # Account & Security
    PASSWORD_CHANGED = "password_changed"
    EMAIL_CHANGED = "email_changed"
    NEW_LOGIN_DEVICE = "new_login_device"

    # System
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    FEATURE_ANNOUNCEMENT = "feature_announcement"


class NotificationPriority(str, enum.Enum):
    """Priority levels for notifications"""
    URGENT = "urgent"        # Immediate delivery, all channels
    HIGH = "high"            # Real-time delivery
    MEDIUM = "medium"        # Near real-time, batching allowed
    LOW = "low"              # Can be batched, digest allowed


class NotificationChannel(str, enum.Enum):
    """Delivery channels for notifications"""
    IN_APP = "in_app"
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"


class EntityType(str, enum.Enum):
    """Types of entities that can trigger notifications"""
    REVIEW_REQUEST = "review_request"
    REVIEW_SLOT = "review_slot"
    USER = "user"
    EXPERT_APPLICATION = "expert_application"
    SUBSCRIPTION = "subscription"
    PAYMENT = "payment"
    DISPUTE = "dispute"
    SYSTEM = "system"


class Notification(Base):
    """
    Notification model for in-app notifications.

    Stores all notifications sent to users with support for:
    - Multiple delivery channels
    - Read/unread tracking
    - Archiving
    - Priority levels
    - Rich data payloads
    - Action buttons
    - Expiration
    """

    __tablename__ = "notifications"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Recipient
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Notification content
    type = Column(Enum(NotificationType), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    # Rich data payload (JSON)
    # Examples:
    # - review_slot_id, reviewer_name, avatar_url
    # - karma_earned, new_balance, action_type
    # - tier_old, tier_new, benefits_unlocked
    data = Column(JSON, nullable=True)

    # Status tracking
    read = Column(Boolean, default=False, nullable=False, index=True)
    archived = Column(Boolean, default=False, nullable=False, index=True)

    # Action button (optional)
    action_url = Column(String(500), nullable=True)  # URL to navigate when clicked
    action_label = Column(String(100), nullable=True)  # Button text (e.g., "View Review", "Claim Now")

    # Priority and channels
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM, nullable=False)
    channels = Column(JSON, nullable=False)  # Array of NotificationChannel values

    # Related entity tracking
    entity_type = Column(Enum(EntityType), nullable=True, index=True)
    entity_id = Column(Integer, nullable=True, index=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True, index=True)  # Auto-delete after expiration

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification {self.id} [{self.type}] for User {self.user_id}>"

    def mark_as_read(self) -> None:
        """Mark notification as read"""
        if not self.read:
            self.read = True
            self.read_at = datetime.utcnow()

    def archive(self) -> None:
        """Archive notification"""
        self.archived = True

    def is_expired(self) -> bool:
        """Check if notification has expired"""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert notification to dictionary for API response"""
        return {
            "id": self.id,
            "type": self.type.value,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "read": self.read,
            "archived": self.archived,
            "action_url": self.action_url,
            "action_label": self.action_label,
            "priority": self.priority.value,
            "entity_type": self.entity_type.value if self.entity_type else None,
            "entity_id": self.entity_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


class EmailDigestFrequency(str, enum.Enum):
    """Email digest frequency preferences"""
    IMMEDIATE = "immediate"  # Send each notification immediately
    DAILY = "daily"          # Daily digest at preferred time
    WEEKLY = "weekly"        # Weekly digest on preferred day
    NEVER = "never"          # Never send emails (except critical)


class NotificationPreferences(Base):
    """
    User preferences for notifications.

    Controls how and when users receive notifications across different channels.
    """

    __tablename__ = "notification_preferences"

    # Primary key (one-to-one with users)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    # Global channel toggles
    email_enabled = Column(Boolean, default=True, nullable=False)
    push_enabled = Column(Boolean, default=False, nullable=False)
    sms_enabled = Column(Boolean, default=False, nullable=False)

    # Email digest settings
    email_digest_frequency = Column(
        Enum(EmailDigestFrequency),
        default=EmailDigestFrequency.IMMEDIATE,
        nullable=False
    )
    email_digest_time = Column(Integer, default=9, nullable=False)  # Hour of day (0-23) for digest
    email_digest_day = Column(Integer, default=1, nullable=False)   # Day of week (1=Monday) for weekly

    # Quiet hours (no push notifications during this time)
    quiet_hours_enabled = Column(Boolean, default=False, nullable=False)
    quiet_hours_start = Column(Integer, nullable=True)  # Hour (0-23)
    quiet_hours_end = Column(Integer, nullable=True)    # Hour (0-23)

    # Category-specific preferences (JSON)
    # Structure: {"review_lifecycle": {"email": true, "push": false}, ...}
    category_preferences = Column(JSON, nullable=True)

    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notification_preferences")

    def __repr__(self) -> str:
        return f"<NotificationPreferences for User {self.user_id}>"

    def get_category_preference(self, category: str, channel: str) -> bool:
        """
        Get preference for a specific notification category and channel.

        Args:
            category: Category name (e.g., "review_lifecycle", "karma")
            channel: Channel name (e.g., "email", "push")

        Returns:
            True if enabled, False if disabled, defaults to True if not set
        """
        if self.category_preferences is None:
            return True

        category_prefs = self.category_preferences.get(category, {})
        return category_prefs.get(channel, True)

    def is_quiet_hours(self) -> bool:
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_enabled or self.quiet_hours_start is None or self.quiet_hours_end is None:
            return False

        current_hour = datetime.utcnow().hour

        # Handle overnight quiet hours (e.g., 22:00 - 08:00)
        if self.quiet_hours_start > self.quiet_hours_end:
            return current_hour >= self.quiet_hours_start or current_hour < self.quiet_hours_end

        # Normal quiet hours (e.g., 08:00 - 17:00)
        return self.quiet_hours_start <= current_hour < self.quiet_hours_end
