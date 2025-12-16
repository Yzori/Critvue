"""Reviews API routers.

This module consolidates all review-related endpoints:
- requests: Review request CRUD operations (/reviews/*)
- files: Review file uploads (/reviews/*)
- slots: Review slot workflow operations (/review-slots/*)
- applications: Slot application system (/slot-applications/*)
- nda: NDA signing for confidential reviews (/nda/*)
- reviewer_dashboard: Reviewer dashboard (/reviewer/*)
- reviewers: Reviewer directory (/reviewers/*)
"""

from fastapi import APIRouter

from .requests import router as requests_router
from .files import router as files_router, generic_files_router
from .slots import router as slots_router
from .applications import router as applications_router
from .nda import router as nda_router
from .reviewer_dashboard import router as reviewer_dashboard_router
from .reviewers import router as reviewers_router

# No prefix - each sub-router has its own prefix
router = APIRouter(tags=["reviews"])

router.include_router(requests_router)
router.include_router(files_router)
router.include_router(slots_router)
router.include_router(applications_router)
router.include_router(nda_router)
router.include_router(reviewer_dashboard_router)
router.include_router(reviewers_router)

__all__ = ["router", "generic_files_router"]
