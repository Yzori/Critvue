"""Redis service for token blacklisting and caching"""

import redis
from typing import Optional
from datetime import datetime, timedelta
from app.core.config import settings


class RedisService:
    """Service for Redis operations"""

    def __init__(self):
        """Initialize Redis connection"""
        try:
            self.client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.client.ping()
            self.available = True
        except (redis.ConnectionError, redis.TimeoutError):
            # Redis not available - graceful degradation
            self.available = False
            self.client = None

    def blacklist_token(self, token: str, expires_in_seconds: int) -> bool:
        """
        Add token to blacklist

        Args:
            token: JWT token to blacklist
            expires_in_seconds: Token TTL (time to live)

        Returns:
            True if successful, False otherwise
        """
        if not self.available:
            return False

        try:
            key = f"blacklist:{token}"
            self.client.setex(key, expires_in_seconds, "1")
            return True
        except Exception:
            return False

    def is_token_blacklisted(self, token: str) -> bool:
        """
        Check if token is blacklisted

        Args:
            token: JWT token to check

        Returns:
            True if blacklisted, False otherwise
        """
        if not self.available:
            # If Redis is down, allow access (fail open)
            # In production, you might want to fail closed instead
            return False

        try:
            key = f"blacklist:{token}"
            return self.client.exists(key) > 0
        except Exception:
            # On error, allow access (fail open)
            return False

    def blacklist_refresh_token(self, token: str, user_id: int) -> bool:
        """
        Blacklist a refresh token

        Args:
            token: Refresh token to blacklist
            user_id: User ID for tracking

        Returns:
            True if successful, False otherwise
        """
        if not self.available:
            return False

        try:
            key = f"blacklist:refresh:{token}"
            # Refresh tokens expire in 30 days
            ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            self.client.setex(key, ttl, str(user_id))
            return True
        except Exception:
            return False

    def is_refresh_token_blacklisted(self, token: str) -> bool:
        """
        Check if refresh token is blacklisted

        Args:
            token: Refresh token to check

        Returns:
            True if blacklisted, False otherwise
        """
        if not self.available:
            return False

        try:
            key = f"blacklist:refresh:{token}"
            return self.client.exists(key) > 0
        except Exception:
            return False


# Global Redis service instance
redis_service = RedisService()
