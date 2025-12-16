"""Profile API routers.

This module consolidates user profile-related endpoints:
- public: Public profile view and updates (/profile/*)
- portfolio: Portfolio project management (/portfolio/*)
- settings: User settings (privacy, preferences) (/settings/*)
- growth: Portfolio growth analytics (/growth/*)
- activity: Activity heatmap and timeline (/activity/*)
"""

from fastapi import APIRouter

from .public import router as public_router
from .portfolio import router as portfolio_router
from .settings import router as settings_router
from .growth import router as growth_router
from .activity import router as activity_router

# No prefix - each sub-router has its own prefix
router = APIRouter(tags=["profile"])

router.include_router(public_router)
router.include_router(portfolio_router)
router.include_router(settings_router)
router.include_router(growth_router)
router.include_router(activity_router)

__all__ = ["router"]
