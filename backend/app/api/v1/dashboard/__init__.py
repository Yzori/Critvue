"""Dashboard API routers.

This module consolidates dashboard-related endpoints:
- mobile: Mobile-optimized dashboard (/dashboard/*)
- creator, reviewer, overview, batch: Desktop dashboard endpoints (/desktop/*)
- platform: Platform-wide stats for elevated dashboard (/platform/*)
"""

from fastapi import APIRouter

from .mobile import router as mobile_router
from .creator import router as creator_router
from .reviewer import router as reviewer_router
from .overview import router as overview_router
from .batch import router as batch_router
from .platform import router as platform_router

# No prefix - each sub-router has its own prefix
router = APIRouter(tags=["dashboard"])

router.include_router(mobile_router)
router.include_router(creator_router)
router.include_router(reviewer_router)
router.include_router(overview_router)
router.include_router(batch_router)
router.include_router(platform_router)

__all__ = ["router"]
