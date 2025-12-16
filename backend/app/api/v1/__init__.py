"""API v1 endpoints"""

from fastapi import APIRouter
from app.api.v1 import dashboard, admin

api_router = APIRouter()

# Include dashboard router (includes platform)
api_router.include_router(dashboard.router)

# Include admin router (users, applications)
api_router.include_router(admin.router)
