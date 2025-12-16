"""
Infrastructure Services Module

This module consolidates infrastructure-related services:
- redis_service: Redis connection and operations
- storage_service: File storage (S3/local)
- image_service: Image processing and validation
- scheduler: Background job scheduler

Usage:
    from app.services.infrastructure import redis_service
    from app.services.infrastructure import StorageService, ImageService
"""

from app.services.infrastructure.redis_service import redis_service
from app.services.infrastructure.storage_service import StorageService, StorageError
from app.services.infrastructure.image_service import (
    ImageService,
    ImageValidationError,
    ImageProcessingError,
)
from app.services.infrastructure.scheduler import (
    start_background_jobs,
    stop_background_jobs,
    scheduler,
)

__all__ = [
    # Redis
    "redis_service",
    # Storage
    "StorageService",
    "StorageError",
    # Image
    "ImageService",
    "ImageValidationError",
    "ImageProcessingError",
    # Scheduler
    "start_background_jobs",
    "stop_background_jobs",
    "scheduler",
]
