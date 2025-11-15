"""
Configuration validators for services

Validates configuration at startup to catch issues early
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)


class ConfigValidationError(Exception):
    """Raised when configuration validation fails"""
    pass


def validate_avatar_config() -> Tuple[bool, List[str]]:
    """
    Validate avatar upload configuration

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    # Validate storage type
    if settings.AVATAR_STORAGE_TYPE not in ['local', 'cloud']:
        errors.append(
            f"Invalid AVATAR_STORAGE_TYPE: {settings.AVATAR_STORAGE_TYPE}. "
            f"Must be 'local' or 'cloud'"
        )

    # Validate max file size
    if settings.MAX_AVATAR_SIZE <= 0:
        errors.append(
            f"Invalid MAX_AVATAR_SIZE: {settings.MAX_AVATAR_SIZE}. "
            f"Must be positive"
        )

    if settings.MAX_AVATAR_SIZE > 50 * 1024 * 1024:  # 50MB
        logger.warning(
            f"MAX_AVATAR_SIZE is very large: {settings.MAX_AVATAR_SIZE / 1024 / 1024}MB. "
            f"This may cause performance issues."
        )

    # Validate storage path for local storage
    if settings.AVATAR_STORAGE_TYPE == 'local':
        storage_path = Path(settings.AVATAR_STORAGE_PATH)

        # Check if path is absolute
        if not storage_path.is_absolute():
            errors.append(
                f"AVATAR_STORAGE_PATH must be an absolute path: {settings.AVATAR_STORAGE_PATH}"
            )

        # Try to create directory if it doesn't exist
        try:
            storage_path.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            errors.append(
                f"Cannot create storage directory {settings.AVATAR_STORAGE_PATH}: {str(e)}"
            )

        # Check write permissions
        if storage_path.exists() and not os.access(storage_path, os.W_OK):
            errors.append(
                f"No write permission for storage directory: {settings.AVATAR_STORAGE_PATH}"
            )

    # Validate base URL
    if not settings.AVATAR_BASE_URL:
        errors.append("AVATAR_BASE_URL cannot be empty")

    if not settings.AVATAR_BASE_URL.startswith('/'):
        logger.warning(
            f"AVATAR_BASE_URL should start with '/': {settings.AVATAR_BASE_URL}"
        )

    return (len(errors) == 0, errors)


def validate_database_config() -> Tuple[bool, List[str]]:
    """
    Validate database configuration

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    # Validate DATABASE_URL
    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL is required")

    # Validate pool settings
    if settings.DATABASE_POOL_SIZE < 1:
        errors.append(
            f"DATABASE_POOL_SIZE must be at least 1: {settings.DATABASE_POOL_SIZE}"
        )

    if settings.DATABASE_MAX_OVERFLOW < 0:
        errors.append(
            f"DATABASE_MAX_OVERFLOW must be non-negative: {settings.DATABASE_MAX_OVERFLOW}"
        )

    if settings.DATABASE_POOL_TIMEOUT <= 0:
        errors.append(
            f"DATABASE_POOL_TIMEOUT must be positive: {settings.DATABASE_POOL_TIMEOUT}"
        )

    if settings.DATABASE_POOL_RECYCLE <= 0:
        errors.append(
            f"DATABASE_POOL_RECYCLE must be positive: {settings.DATABASE_POOL_RECYCLE}"
        )

    return (len(errors) == 0, errors)


def validate_security_config() -> Tuple[bool, List[str]]:
    """
    Validate security configuration

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    warnings = []

    # Check secret keys
    if settings.SECRET_KEY == "CHANGE_THIS_IN_PRODUCTION_USE_LONG_RANDOM_STRING":
        errors.append(
            "SECRET_KEY is using default value. Set a secure random key in production!"
        )

    if settings.REFRESH_SECRET_KEY == "CHANGE_THIS_REFRESH_KEY_IN_PRODUCTION":
        errors.append(
            "REFRESH_SECRET_KEY is using default value. Set a secure random key in production!"
        )

    # Check key length
    if len(settings.SECRET_KEY) < 32:
        warnings.append(
            f"SECRET_KEY is short ({len(settings.SECRET_KEY)} chars). "
            f"Recommend at least 32 characters."
        )

    if len(settings.REFRESH_SECRET_KEY) < 32:
        warnings.append(
            f"REFRESH_SECRET_KEY is short ({len(settings.REFRESH_SECRET_KEY)} chars). "
            f"Recommend at least 32 characters."
        )

    # Validate token expiration
    if settings.ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
        errors.append(
            f"ACCESS_TOKEN_EXPIRE_MINUTES must be positive: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}"
        )

    if settings.REFRESH_TOKEN_EXPIRE_DAYS <= 0:
        errors.append(
            f"REFRESH_TOKEN_EXPIRE_DAYS must be positive: {settings.REFRESH_TOKEN_EXPIRE_DAYS}"
        )

    # Log warnings
    for warning in warnings:
        logger.warning(warning)

    return (len(errors) == 0, errors)


def validate_all_config() -> Dict[str, Tuple[bool, List[str]]]:
    """
    Validate all configuration

    Returns:
        Dictionary mapping config category to (is_valid, errors)
    """
    results = {
        'avatar': validate_avatar_config(),
        'database': validate_database_config(),
        'security': validate_security_config(),
    }

    return results


def check_config_or_exit() -> None:
    """
    Validate all configuration and exit if any validation fails

    This should be called at application startup
    """
    logger.info("Validating configuration...")

    results = validate_all_config()
    has_errors = False

    for category, (is_valid, errors) in results.items():
        if not is_valid:
            has_errors = True
            logger.error(f"Configuration validation failed for {category}:")
            for error in errors:
                logger.error(f"  - {error}")
        else:
            logger.info(f"Configuration validation passed for {category}")

    if has_errors:
        raise ConfigValidationError(
            "Configuration validation failed. Please check the logs and fix configuration errors."
        )

    logger.info("All configuration validation passed")
