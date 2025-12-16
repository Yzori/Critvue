"""Reviews API routers.

This module consolidates all review-related endpoints:
- requests: Review request CRUD operations (/reviews/*)
- slots: Review slot workflow operations (/review-slots/*)
"""

from fastapi import APIRouter

from .requests import router as requests_router
from .slots import router as slots_router

# No prefix - each sub-router has its own prefix
router = APIRouter(tags=["reviews"])

router.include_router(requests_router)
router.include_router(slots_router)

__all__ = ["router"]
