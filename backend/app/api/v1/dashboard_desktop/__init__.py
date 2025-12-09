"""
Desktop Dashboard API Endpoints Package

This package contains desktop-optimized dashboard endpoints organized into modules:
- creator: Creator-focused endpoints (actions-needed, my-requests)
- reviewer: Reviewer-focused endpoints (active, submitted, completed)
- overview: Dashboard overview, activity timeline, and search
- batch: Bulk operations (batch-reject)

Usage:
    from app.api.v1.dashboard_desktop import router

    # Include in main app
    app.include_router(router)
"""

from fastapi import APIRouter

from app.api.v1.dashboard_desktop.creator import router as creator_router
from app.api.v1.dashboard_desktop.reviewer import router as reviewer_router
from app.api.v1.dashboard_desktop.overview import router as overview_router
from app.api.v1.dashboard_desktop.batch import router as batch_router

# Create main router that combines all sub-routers
router = APIRouter(tags=["dashboard-desktop"])

# Include all sub-routers
router.include_router(creator_router)
router.include_router(reviewer_router)
router.include_router(overview_router)
router.include_router(batch_router)

__all__ = ["router"]
