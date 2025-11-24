"""User and Profile database models"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, Numeric, String, Text
from sqlalchemy.orm import DeclarativeBase, relationship

if TYPE_CHECKING:
    from app.models.review_request import ReviewRequest


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


class UserRole(str, enum.Enum):
    """User role types"""
    CREATOR = "creator"
    REVIEWER = "reviewer"
    ADMIN = "admin"


class SubscriptionTier(str, enum.Enum):
    """Subscription tier types"""
    FREE = "free"
    PRO = "pro"


class SubscriptionStatus(str, enum.Enum):
    """Subscription status types"""
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    TRIALING = "trialing"
    UNPAID = "unpaid"


class UserTier(str, enum.Enum):
    """User tier/reputation levels"""
    NOVICE = "novice"
    CONTRIBUTOR = "contributor"
    SKILLED = "skilled"
    TRUSTED_ADVISOR = "trusted_advisor"
    EXPERT = "expert"
    MASTER = "master"


class User(Base):
    """User model for authentication and basic info"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)

    # Role
    role = Column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.CREATOR,
        nullable=False
    )

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Profile
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    title = Column(String(255), nullable=True)
    specialty_tags = Column(Text, nullable=True)  # JSON stored as Text for SQLite
    badges = Column(Text, nullable=True)  # JSON stored as Text for SQLite

    # Stats
    total_reviews_given = Column(Integer, nullable=False, default=0, server_default='0')
    total_reviews_received = Column(Integer, nullable=False, default=0, server_default='0')
    avg_rating = Column(Numeric(precision=3, scale=2), nullable=True)
    avg_response_time_hours = Column(Integer, nullable=True)

    # Tier/Reputation System
    user_tier = Column(Enum(UserTier, values_callable=lambda x: [e.value for e in x]), default=UserTier.NOVICE, nullable=False, index=True)
    karma_points = Column(Integer, default=0, nullable=False, server_default='0', index=True)
    tier_achieved_at = Column(DateTime, nullable=True)  # When current tier was achieved
    expert_application_approved = Column(Boolean, default=False, nullable=False)  # Fast-track to MASTER
    acceptance_rate = Column(Numeric(5, 2), nullable=True)  # Cached % of accepted reviews
    accepted_reviews_count = Column(Integer, default=0, nullable=False, server_default='0')  # Count of accepted reviews
    current_streak = Column(Integer, default=0, nullable=False, server_default='0')  # Current consecutive review days
    longest_streak = Column(Integer, default=0, nullable=False, server_default='0')  # Best streak ever
    last_review_date = Column(DateTime, nullable=True)  # For streak tracking

    # Subscription fields
    subscription_tier = Column(
        Enum(SubscriptionTier, values_callable=lambda x: [e.value for e in x]),
        default=SubscriptionTier.FREE,
        nullable=False
    )
    subscription_status = Column(
        Enum(SubscriptionStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=True
    )
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True, unique=True, index=True)
    subscription_end_date = Column(DateTime, nullable=True)

    # Review limit tracking for free tier
    monthly_reviews_used = Column(Integer, nullable=False, default=0, server_default='0')
    reviews_reset_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    review_requests = relationship("ReviewRequest", back_populates="user", cascade="all, delete-orphan")
    expert_applications = relationship("ExpertApplication", back_populates="user", cascade="all, delete-orphan")
    karma_transactions = relationship("KarmaTransaction", back_populates="user", cascade="all, delete-orphan")
    tier_milestones = relationship("TierMilestone", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    notification_preferences = relationship("NotificationPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
