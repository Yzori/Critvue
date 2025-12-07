"""
Application configuration using Pydantic settings
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Project info
    PROJECT_NAME: str = "Critvue API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Logging
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL

    # Security
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_USE_LONG_RANDOM_STRING"
    REFRESH_SECRET_KEY: str = "CHANGE_THIS_REFRESH_KEY_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days

    # CORS - comma-separated list in .env file
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into a list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/critvue"
    DATABASE_ECHO: bool = False  # Set to True for SQL query logging

    # Connection Pool Settings (for PostgreSQL)
    DATABASE_POOL_SIZE: int = 5  # Number of connections to maintain in pool
    DATABASE_MAX_OVERFLOW: int = 10  # Max connections beyond pool_size
    DATABASE_POOL_TIMEOUT: int = 30  # Seconds to wait for connection from pool
    DATABASE_POOL_RECYCLE: int = 3600  # Recycle connections after N seconds (1 hour)
    DATABASE_POOL_PRE_PING: bool = True  # Verify connections before using them

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI APIs
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # File Upload
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads"

    # Avatar Upload Settings
    MAX_AVATAR_SIZE: int = 5 * 1024 * 1024  # 5MB
    AVATAR_STORAGE_TYPE: str = "local"  # "local" or "cloud"
    AVATAR_STORAGE_PATH: str = "/home/user/Critvue/backend/uploads/avatars"
    AVATAR_BASE_URL: str = "/files/avatars"
    AVATAR_STRIP_METADATA: bool = True  # Strip EXIF data for privacy
    BACKEND_URL: str = "http://localhost:8000"  # Backend URL for absolute avatar URLs

    # Stripe
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_PRICE_ID: str = ""  # Stripe Price ID for Pro subscription ($9/month)
    STRIPE_PUBLISHABLE_KEY: str = ""  # Frontend publishable key

    # Stripe Connect (for reviewer payouts)
    STRIPE_PLATFORM_FEE_PERCENT: float = 0.25  # 25% platform fee on expert reviews

    # Email
    EMAIL_FROM: str = "noreply@critvue.com"
    EMAIL_API_KEY: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:3000"

    # Rate Limiting
    ENABLE_RATE_LIMITING: bool = True  # Set to False to disable rate limiting entirely
    RATE_LIMIT_REGISTRATION: str = "3/hour"  # Registrations per IP (dev: 1000/hour, prod: 3/hour)
    RATE_LIMIT_LOGIN: str = "5/minute"  # Login attempts per IP (dev: 1000/minute, prod: 5/minute)
    RATE_LIMIT_REFRESH: str = "10/minute"  # Token refresh per IP (dev: 1000/minute, prod: 10/minute)
    RATE_LIMIT_PASSWORD_RESET: str = "3/hour"  # Password reset requests per IP (dev: 1000/hour, prod: 3/hour)
    RATE_LIMIT_RESET_VERIFY: str = "10/minute"  # Reset token verification per IP (dev: 1000/minute, prod: 10/minute)
    RATE_LIMIT_RESET_CONFIRM: str = "5/minute"  # Password reset confirmation per IP (dev: 1000/minute, prod: 5/minute)

    # Background Job Scheduler (Reviewer Workflow)
    SCHEDULER_ENABLED: bool = True  # Enable/disable background job scheduler
    SCHEDULER_CLAIM_TIMEOUT_HOURS: int = 72  # Hours before claimed reviews are abandoned
    SCHEDULER_AUTO_ACCEPT_DAYS: int = 7  # Days before submitted reviews are auto-accepted
    SCHEDULER_DISPUTE_WINDOW_DAYS: int = 7  # Days reviewers have to dispute rejections
    SCHEDULER_INTERVAL_MINUTES: int = 60  # How often scheduler jobs run (in minutes)

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )


settings = Settings()
