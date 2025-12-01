"""Database models for Critvue"""
from app.models.user import User, UserRole, UserTier
from app.models.review_file import ReviewFile
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, AcceptanceType, RejectionReason as SlotRejectionReason, PaymentStatus, DisputeResolution
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
from app.models.reviewer_dna import ReviewerDNA
# Committee system models
from app.models.committee_member import CommitteeMember, CommitteeRole
from app.models.rejection_reason import RejectionReason
from app.models.application_review import ApplicationReview, ReviewStatus as AppReviewStatus, Vote
# NDA system
from app.models.nda_signature import NDASignature, NDARole, CURRENT_NDA_VERSION
# Battle system models
from app.models.battle_prompt import BattlePrompt, PromptDifficulty
from app.models.battle import Battle, BattleStatus, BattleType
from app.models.battle_entry import BattleEntry
from app.models.battle_vote import BattleVote
from app.models.battle_challenge import BattleChallenge, ChallengeStatus

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
    "SlotRejectionReason",
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
    "ReviewerDNA",
    # Committee system
    "CommitteeMember",
    "CommitteeRole",
    "RejectionReason",
    "ApplicationReview",
    "AppReviewStatus",
    "Vote",
    # NDA system
    "NDASignature",
    "NDARole",
    "CURRENT_NDA_VERSION",
    # Battle system
    "BattlePrompt",
    "PromptDifficulty",
    "Battle",
    "BattleStatus",
    "BattleType",
    "BattleEntry",
    "BattleVote",
    "BattleChallenge",
    "ChallengeStatus",
]
