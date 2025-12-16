"""Admin API routers.

This module consolidates all admin-related endpoints:
- users: User management (ban, suspend, role changes)
- applications: Expert application review committee
- expert_applications: Expert reviewer applications (separate prefix for backward compat)
"""

from fastapi import APIRouter

from .users import router as users_router
from .applications import router as applications_router
from .expert_applications import router as expert_applications_router

router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(users_router)
router.include_router(applications_router)

# Export expert_applications separately (has its own /api/v1 prefix)
__all__ = ["router", "expert_applications_router"]
