"""Challenges API module - aggregates all challenge-related routers."""

from fastapi import APIRouter

from app.api.v1.challenges.public import router as public_router
from app.api.v1.challenges.admin import router as admin_router
from app.api.v1.challenges.participation import router as participation_router
from app.api.v1.challenges.voting import router as voting_router

# Main router that aggregates all sub-routers
router = APIRouter(prefix="/challenges", tags=["Challenges"])

# Include all sub-routers
# Order matters for route matching - more specific routes first

# Admin routes (prompts and challenge management)
router.include_router(admin_router)

# Voting routes (stats routes need to come before {challenge_id} routes)
router.include_router(voting_router)

# Participation routes (invitations, joining, entries)
router.include_router(participation_router)

# Public routes (browsing, viewing) - includes {challenge_id} catch-all, so must be last
router.include_router(public_router)

__all__ = ["router"]
