"""
Critvue FastAPI Application
Main entry point for the backend API
"""

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from app.core.config import settings
from app.api import auth, password_reset, webhooks
from app.api.v1 import reviews, files, browse, review_slots, profile, portfolio, reviewer_dashboard, expert_applications, subscriptions, tier_system, leaderboard, notifications, dashboard, dashboard_desktop, karma, platform, admin_applications, admin_users, nda, activity, challenges
from app.core.logging_config import setup_logging
from app.db.session import close_db, get_db
from app.services.scheduler import start_background_jobs, stop_background_jobs

# Setup logging
setup_logging(level=settings.LOG_LEVEL)

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.ENABLE_RATE_LIMITING
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI & Human Feedback Platform for Creators",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Add rate limiter to app state
app.state.limiter = limiter
if settings.ENABLE_RATE_LIMITING:
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(password_reset.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")  # Webhooks (no auth required)
app.include_router(browse.router, prefix="/api/v1")  # Public browse marketplace (must be before reviews to avoid conflicts)
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
app.include_router(review_slots.router, prefix="/api/v1")  # Review slots workflow
app.include_router(reviewer_dashboard.router, prefix="/api/v1")  # Reviewer dashboard
app.include_router(profile.router, prefix="/api/v1")  # User profiles
app.include_router(portfolio.router, prefix="/api/v1")  # Portfolio projects
app.include_router(expert_applications.router)  # Expert reviewer applications (already has /api/v1 prefix)
app.include_router(subscriptions.router, prefix="/api/v1")  # Subscription management
app.include_router(tier_system.router, prefix="/api/v1")  # Tier/karma system
app.include_router(leaderboard.router, prefix="/api/v1")  # Leaderboard rankings
app.include_router(notifications.router, prefix="/api/v1")  # Notifications
app.include_router(dashboard.router, prefix="/api/v1")  # Mobile-optimized dashboard
app.include_router(dashboard_desktop.router, prefix="/api/v1")  # Desktop-optimized dashboard
app.include_router(karma.router, prefix="/api/v1")  # Modern karma system with badges, leaderboards, requester ratings
app.include_router(platform.router, prefix="/api/v1")  # Platform-wide activity and stats for elevated dashboard
app.include_router(admin_applications.router, prefix="/api/v1")  # Admin expert application review
app.include_router(admin_users.router, prefix="/api/v1")  # Admin user management
app.include_router(nda.router, prefix="/api/v1")  # NDA signing for confidential reviews
app.include_router(activity.router, prefix="/api/v1")  # User activity heatmap and timeline
app.include_router(challenges.router, prefix="/api/v1")  # Platform-curated creative challenges

# Security headers middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # XSS protection (legacy but still useful)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Permissions policy (disable dangerous features)
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Session middleware for OAuth state management
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Configure CORS with explicit allowed methods and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=["X-Total-Count", "X-Page", "X-Page-Size"],
)

# Mount static files for uploaded content
uploads_dir = Path("/home/user/Critvue/backend/uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(uploads_dir)), name="files")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Critvue API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Detailed health check endpoint with database connectivity test

    Returns:
        - status: overall system health status
        - service: service name
        - database: database connectivity status
        - version: API version
        - timestamp: current server time
    """
    from datetime import datetime
    from sqlalchemy import text

    # Test database connectivity
    db_status = "unknown"
    try:
        # Simple query to verify database is responsive
        result = await db.execute(text("SELECT 1"))
        if result:
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"

    # Determine overall health
    is_healthy = db_status == "connected"

    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": "critvue-backend",
        "database": db_status,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup"""
    import logging
    import os
    logger = logging.getLogger(__name__)

    logger.info("Starting Critvue backend...")

    # Security: Validate secret keys are not defaults in production
    INSECURE_DEFAULTS = [
        "CHANGE_THIS_IN_PRODUCTION_USE_LONG_RANDOM_STRING",
        "CHANGE_THIS_REFRESH_KEY_IN_PRODUCTION",
    ]

    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"

    if settings.SECRET_KEY in INSECURE_DEFAULTS:
        if is_production:
            logger.critical("SECURITY CRITICAL: SECRET_KEY is using default value in production!")
            raise RuntimeError("Cannot start with default SECRET_KEY in production")
        else:
            logger.warning("⚠️  SECRET_KEY is using default value - change before deploying to production!")

    if settings.REFRESH_SECRET_KEY in INSECURE_DEFAULTS:
        if is_production:
            logger.critical("SECURITY CRITICAL: REFRESH_SECRET_KEY is using default value in production!")
            raise RuntimeError("Cannot start with default REFRESH_SECRET_KEY in production")
        else:
            logger.warning("⚠️  REFRESH_SECRET_KEY is using default value - change before deploying to production!")

    # Start background job scheduler
    try:
        start_background_jobs()
        logger.info("Background job scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start background job scheduler: {e}", exc_info=True)
        # Don't fail startup if scheduler fails

    logger.info("Critvue backend startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    import logging
    logger = logging.getLogger(__name__)

    logger.info("Shutting down Critvue backend...")

    # Stop background job scheduler
    try:
        stop_background_jobs()
        logger.info("Background job scheduler stopped successfully")
    except Exception as e:
        logger.error(f"Error stopping background job scheduler: {e}", exc_info=True)

    # Close database connections
    await close_db()

    logger.info("Critvue backend shutdown complete")
