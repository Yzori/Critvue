"""Database models for Critvue"""
from app.models.user import User, UserRole, UserTier
from app.models.review_file import ReviewFile
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, AcceptanceType, RejectionReason, PaymentStatus, DisputeResolution
from app.models.review_request import (
    ReviewRequest,
    ContentType,
    ReviewType,
    ReviewStatus,
    ReviewTier,
    FeedbackPriority
)
from app.models.expert_application import ExpertApplication, ApplicationStatus
from app.models.karma_transaction import KarmaTransaction, KarmaAction
from app.models.tier_milestone import TierMilestone
from app.models.notification import Notification, NotificationPreferences, NotificationType, NotificationPriority, EntityType
# New karma system models
from app.models.badge import Badge, UserBadge, BadgeCategory, BadgeRarity
from app.models.leaderboard import Season, LeaderboardEntry, SeasonType, LeaderboardCategory
from app.models.requester_rating import RequesterRating, RequesterStats

__all__ = [
    "User",
    "UserRole",
    "UserTier",
    "ReviewRequest",
    "ReviewFile",
    "ReviewSlot",
    "ContentType",
    "ReviewType",
    "ReviewStatus",
    "ReviewTier",
    "FeedbackPriority",
    "ReviewSlotStatus",
    "AcceptanceType",
    "RejectionReason",
    "PaymentStatus",
    "DisputeResolution",
    "ExpertApplication",
    "ApplicationStatus",
    "KarmaTransaction",
    "KarmaAction",
    "TierMilestone",
    "Notification",
    "NotificationPreferences",
    "NotificationType",
    "NotificationPriority",
    "EntityType",
    # New karma system
    "Badge",
    "UserBadge",
    "BadgeCategory",
    "BadgeRarity",
    "Season",
    "LeaderboardEntry",
    "SeasonType",
    "LeaderboardCategory",
    "RequesterRating",
    "RequesterStats",
]
