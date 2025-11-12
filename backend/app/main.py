"""
Critvue FastAPI Application
Main entry point for the backend API
"""

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path

from app.core.config import settings
from app.api import auth, password_reset
from app.api.v1 import reviews, files, browse
# from app.api.v1 import review_slots  # Temporarily disabled - has import issues
from app.core.logging_config import setup_logging
from app.db.session import close_db, get_db

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
app.include_router(browse.router, prefix="/api/v1")  # Public browse marketplace (must be before reviews to avoid conflicts)
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
# app.include_router(review_slots.router, prefix="/api/v1")  # Review slots workflow - temporarily disabled

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    await close_db()
