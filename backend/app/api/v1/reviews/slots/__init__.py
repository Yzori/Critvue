"""
Review Slots API Module

This module combines all review slot related endpoints from domain-specific routers.
Organized by functional area for maintainability:

- claim.py: Claim and abandon operations
- submit.py: Submit, accept, reject, and elaboration operations
- draft.py: Draft operations (legacy, smart review, studio formats)
- smart_review.py: Smart Adaptive Review Editor endpoints
- dispute.py: Dispute creation and resolution
- query.py: Query and listing operations
"""

from fastapi import APIRouter

from .claim import router as claim_router
from .submit import router as submit_router
from .draft import router as draft_router
from .smart_review import router as smart_review_router
from .dispute import router as dispute_router
from .query import router as query_router

# Create combined router with prefix
router = APIRouter(prefix="/review-slots", tags=["review-slots"])

# Include all domain routers
# Order matters - more specific routes should come before generic ones
router.include_router(claim_router)
router.include_router(submit_router)
router.include_router(draft_router)
router.include_router(smart_review_router)
router.include_router(dispute_router)
router.include_router(query_router)

__all__ = ["router"]
