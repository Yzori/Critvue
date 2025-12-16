"""
Gamification Services Module

This module consolidates all gamification-related services:
- sparks_service: Sparks (karma) system management
- badge_service: Badge awarding and management
- badge_definitions: Badge configuration and definitions
- leaderboard_service: Leaderboard rankings
- tier_service: Tier progression and milestones
- review_sparks_hooks: Review lifecycle sparks triggers

Usage:
    from app.services.gamification import SparksService, BadgeService
    from app.services.gamification import on_review_submitted, on_review_accepted
"""

# Sparks (karma) service
from app.services.gamification.sparks_service import SparksService

# Backward compatibility alias
KarmaService = SparksService

# Badge service and definitions
from app.services.gamification.badge_service import BadgeService
from app.services.gamification.badge_definitions import DEFAULT_BADGES

# Leaderboard service
from app.services.gamification.leaderboard_service import LeaderboardService

# Tier service
from app.services.gamification.tier_service import TierService

# Review sparks hooks
from app.services.gamification.review_sparks_hooks import (
    on_review_submitted,
    on_review_accepted,
    on_review_rejected,
    on_claim_abandoned,
    on_dispute_created,
    on_dispute_resolved,
    deduct_sparks_for_abandonment,
)

__all__ = [
    # Services
    "SparksService",
    "KarmaService",  # Backward compatibility
    "BadgeService",
    "LeaderboardService",
    "TierService",
    # Definitions
    "DEFAULT_BADGES",
    # Hooks
    "on_review_submitted",
    "on_review_accepted",
    "on_review_rejected",
    "on_claim_abandoned",
    "on_dispute_created",
    "on_dispute_resolved",
    "deduct_sparks_for_abandonment",
]
