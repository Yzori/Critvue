"""API v1 endpoints"""

from fastapi import APIRouter
from app.api.v1 import dashboard, platform, admin_applications

api_router = APIRouter()

# Include dashboard router
api_router.include_router(dashboard.router)

# Include platform router (elevated dashboard data)
api_router.include_router(platform.router)

# Include admin applications router (committee review system)
api_router.include_router(admin_applications.router)
