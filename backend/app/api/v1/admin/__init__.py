"""Admin API routers.

This module consolidates all admin-related endpoints:
- users: User management (ban, suspend, role changes)
- applications: Expert application review committee
"""

from fastapi import APIRouter

from .users import router as users_router
from .applications import router as applications_router

router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(users_router)
router.include_router(applications_router)

__all__ = ["router"]
