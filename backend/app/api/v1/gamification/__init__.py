"""Gamification API routers.

This module consolidates gamification-related endpoints:
- sparks: Sparks/karma system and transactions
- leaderboard: Rankings and leaderboards
- tiers: User tier system and progression
"""

from fastapi import APIRouter

from .sparks import router as sparks_router
from .leaderboard import router as leaderboard_router
from .tiers import router as tiers_router

# No prefix to maintain backward-compatible URLs
router = APIRouter(tags=["gamification"])

router.include_router(sparks_router)
router.include_router(leaderboard_router)
router.include_router(tiers_router)

__all__ = ["router"]
