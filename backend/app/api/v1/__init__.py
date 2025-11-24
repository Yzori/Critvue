"""API v1 endpoints"""

from fastapi import APIRouter
from app.api.v1 import dashboard

api_router = APIRouter()

# Include dashboard router
api_router.include_router(dashboard.router)
