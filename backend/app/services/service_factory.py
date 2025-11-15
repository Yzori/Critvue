"""
Service factory for dependency injection

Provides centralized service initialization with proper configuration
"""

import logging
from functools import lru_cache
from typing import Optional

from app.core.config import settings
from app.services.image_service import ImageService
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)


class ServiceFactory:
    """Factory for creating and managing service instances"""

    _image_service: Optional[ImageService] = None
    _storage_service: Optional[StorageService] = None

    @classmethod
    def get_image_service(cls) -> ImageService:
        """
        Get or create ImageService instance

        Returns:
            Singleton ImageService instance
        """
        if cls._image_service is None:
            logger.info("Initializing ImageService")
            cls._image_service = ImageService(
                max_file_size=settings.MAX_AVATAR_SIZE
            )
        return cls._image_service

    @classmethod
    def get_storage_service(cls) -> StorageService:
        """
        Get or create StorageService instance

        Returns:
            Singleton StorageService instance
        """
        if cls._storage_service is None:
            logger.info(
                f"Initializing StorageService "
                f"(type: {settings.AVATAR_STORAGE_TYPE}, "
                f"path: {settings.AVATAR_STORAGE_PATH})"
            )
            cls._storage_service = StorageService(
                storage_type=settings.AVATAR_STORAGE_TYPE,
                base_path=settings.AVATAR_STORAGE_PATH,
                base_url=settings.AVATAR_BASE_URL,
            )
        return cls._storage_service

    @classmethod
    def reset_services(cls) -> None:
        """
        Reset all service instances

        Useful for testing or configuration changes
        """
        logger.info("Resetting all services")
        cls._image_service = None
        cls._storage_service = None


# Dependency injection functions for FastAPI

def get_image_service() -> ImageService:
    """
    FastAPI dependency for ImageService

    Usage:
        @router.post("/upload")
        async def upload(image_service: ImageService = Depends(get_image_service)):
            ...
    """
    return ServiceFactory.get_image_service()


def get_storage_service() -> StorageService:
    """
    FastAPI dependency for StorageService

    Usage:
        @router.post("/upload")
        async def upload(storage_service: StorageService = Depends(get_storage_service)):
            ...
    """
    return ServiceFactory.get_storage_service()
