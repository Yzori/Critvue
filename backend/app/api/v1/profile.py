"""Profile API endpoints"""

import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdate,
    ProfileStatsResponse,
    AvatarUploadResponse,
)
from app.crud import profile as profile_crud
from app.core.config import settings
from app.core.logging_config import logging
from app.services.image_service import ImageService, ImageValidationError, ImageProcessingError
from app.services.storage_service import StorageService, StorageError
from app.services.service_factory import get_image_service, get_storage_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["Profile"])
limiter = Limiter(key_func=get_remote_address, enabled=settings.ENABLE_RATE_LIMITING)


def _ensure_absolute_avatar_url(avatar_url: Optional[str]) -> Optional[str]:
    """
    Convert relative avatar URLs to absolute URLs for cross-origin access

    This handles backward compatibility with avatars uploaded before BACKEND_URL
    was configured. New uploads already use absolute URLs.

    Args:
        avatar_url: Avatar URL from database (may be relative or absolute)

    Returns:
        Absolute URL or None if avatar_url is None
    """
    if not avatar_url:
        return avatar_url

    # If URL is already absolute (starts with http:// or https://), return as-is
    if avatar_url.startswith('http://') or avatar_url.startswith('https://'):
        return avatar_url

    # Convert relative URL to absolute by prepending BACKEND_URL
    # This ensures frontend at localhost:3000 can access files from backend at localhost:8000
    if settings.BACKEND_URL:
        return f"{settings.BACKEND_URL}{avatar_url}"

    return avatar_url


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """
    Get authenticated user's own profile

    Returns:
        Current user's profile data including stats and badges
    """
    # Parse JSON fields
    specialty_tags = profile_crud.parse_user_specialty_tags(current_user)
    badges = profile_crud.parse_user_badges(current_user)

    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        title=current_user.title,
        bio=current_user.bio,
        avatar_url=_ensure_absolute_avatar_url(current_user.avatar_url),
        role=current_user.role.value,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        specialty_tags=specialty_tags,
        badges=badges,
        total_reviews_given=current_user.total_reviews_given,
        total_reviews_received=current_user.total_reviews_received,
        avg_rating=current_user.avg_rating,
        avg_response_time_hours=current_user.avg_response_time_hours,
        user_tier=current_user.user_tier.value,
        karma_points=current_user.karma_points,
        tier_achieved_at=current_user.tier_achieved_at,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.get("/{user_id}", response_model=ProfileResponse)
async def get_user_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """
    Get any user's public profile by ID

    Args:
        user_id: User ID to fetch

    Returns:
        User's public profile data

    Raises:
        HTTPException: If user not found
    """
    user = await profile_crud.get_user_profile(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Parse JSON fields
    specialty_tags = profile_crud.parse_user_specialty_tags(user)
    badges = profile_crud.parse_user_badges(user)

    return ProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        title=user.title,
        bio=user.bio,
        avatar_url=_ensure_absolute_avatar_url(user.avatar_url),
        role=user.role.value,
        is_active=user.is_active,
        is_verified=user.is_verified,
        specialty_tags=specialty_tags,
        badges=badges,
        total_reviews_given=user.total_reviews_given,
        total_reviews_received=user.total_reviews_received,
        avg_rating=user.avg_rating,
        avg_response_time_hours=user.avg_response_time_hours,
        user_tier=user.user_tier.value,
        karma_points=user.karma_points,
        tier_achieved_at=user.tier_achieved_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.put("/me", response_model=ProfileResponse)
@limiter.limit("10/minute")
async def update_my_profile(
    request: Request,
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """
    Update authenticated user's profile

    Args:
        profile_data: Profile fields to update (title, bio, specialty_tags)

    Returns:
        Updated user profile

    Rate limited to 10 requests per minute
    """
    updated_user = await profile_crud.update_profile(
        db, current_user.id, profile_data
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    logger.info(f"Profile updated for user {current_user.id}")

    # Parse JSON fields
    specialty_tags = profile_crud.parse_user_specialty_tags(updated_user)
    badges = profile_crud.parse_user_badges(updated_user)

    return ProfileResponse(
        id=updated_user.id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        title=updated_user.title,
        bio=updated_user.bio,
        avatar_url=_ensure_absolute_avatar_url(updated_user.avatar_url),
        role=updated_user.role.value,
        is_active=updated_user.is_active,
        is_verified=updated_user.is_verified,
        specialty_tags=specialty_tags,
        badges=badges,
        total_reviews_given=updated_user.total_reviews_given,
        total_reviews_received=updated_user.total_reviews_received,
        avg_rating=updated_user.avg_rating,
        avg_response_time_hours=updated_user.avg_response_time_hours,
        user_tier=updated_user.user_tier.value,
        karma_points=updated_user.karma_points,
        tier_achieved_at=updated_user.tier_achieved_at,
        created_at=updated_user.created_at,
        updated_at=updated_user.updated_at,
    )


@router.post("/me/avatar", response_model=AvatarUploadResponse)
@limiter.limit("5/minute")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    image_service: ImageService = Depends(get_image_service),
    storage_service: StorageService = Depends(get_storage_service),
) -> AvatarUploadResponse:
    """
    Upload and process user avatar image

    This endpoint performs comprehensive validation and processing:
    - Validates file type using magic numbers (not just extensions)
    - Checks file size (max 5MB)
    - Validates image dimensions (100-4096px)
    - Generates multiple optimized variants (thumbnail, small, medium, large, full)
    - Strips EXIF metadata for privacy
    - Applies security checks

    Args:
        file: Image file to upload (JPEG, PNG, WebP, GIF)

    Returns:
        Response with avatar URL and variant URLs

    Raises:
        HTTPException: If validation fails or processing errors occur

    Rate limited to 5 requests per minute per user
    """
    # Validate filename exists
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided"
        )

    logger.info(f"Avatar upload initiated for user {current_user.id}: {file.filename}")

    try:
        # Read file content
        file_content = await file.read()

        # 1. Validate image
        mime_type, image = await image_service.validate_image(file_content, file.filename)

        # 2. Perform content safety check
        is_safe = await image_service.check_image_content(image)
        if not is_safe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image failed content safety check"
            )

        # 3. Extract metadata (for logging/analytics)
        metadata = await image_service.extract_metadata(image)
        logger.info(f"Image metadata: {metadata}")

        # 4. Generate optimized variants
        # Strip metadata for privacy by default
        strip_metadata = settings.AVATAR_STRIP_METADATA

        # Generate all size variants
        variants_data = await image_service.generate_variants(image, strip_metadata)

        if not variants_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate image variants"
            )

        # 5. Store old avatar URL for rollback
        old_avatar_url = current_user.avatar_url

        # Delete old avatar files for this user (cleanup)
        if old_avatar_url:
            try:
                await storage_service.delete_user_avatars(current_user.id)
                logger.info(f"Deleted old avatars for user {current_user.id}")
            except Exception as e:
                logger.warning(f"Failed to delete old avatars: {e}")
                # Continue even if cleanup fails

        # 6. Generate secure filename
        # Extract format from the 'full' variant
        _, full_format = variants_data.get('full', (b'', 'jpg'))
        base_filename = image_service.generate_secure_filename(
            current_user.id,
            file.filename,
            full_format
        )

        # 7. Save all variants to storage
        saved_paths = {}
        for size_name, (image_bytes, fmt) in variants_data.items():
            try:
                # Adjust filename for each variant
                name_parts = base_filename.rsplit('.', 1)
                if len(name_parts) == 2:
                    variant_filename = f"{name_parts[0]}_{size_name}.{name_parts[1]}"
                else:
                    variant_filename = f"{base_filename}_{size_name}.{fmt}"

                relative_path = await storage_service.save_file(
                    image_bytes,
                    variant_filename,
                    subdirectory=size_name
                )

                saved_paths[size_name] = storage_service.get_file_url(relative_path)

            except StorageError as e:
                logger.error(f"Failed to save {size_name} variant: {e}")
                # Clean up already saved files
                for saved_path in saved_paths.values():
                    try:
                        await storage_service.delete_file(saved_path)
                    except Exception:
                        pass

                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to save image: {str(e)}"
                )

        # 8. Update user avatar URL in database
        # Use the medium variant as the default avatar URL
        avatar_url = saved_paths.get('medium', saved_paths.get('full', ''))

        try:
            updated_user = await profile_crud.update_avatar(db, current_user.id, avatar_url)

            if not updated_user:
                # Clean up uploaded files if database update fails
                for saved_path in saved_paths.values():
                    try:
                        await storage_service.delete_file(saved_path)
                    except Exception:
                        pass

                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
        except Exception as e:
            # Rollback: Clean up uploaded files on database error
            logger.error(f"Database update failed, rolling back file uploads: {e}")
            for saved_path in saved_paths.values():
                try:
                    await storage_service.delete_file(saved_path)
                except Exception as cleanup_error:
                    logger.error(f"Failed to clean up file during rollback: {cleanup_error}")

            # Re-raise the exception
            if isinstance(e, HTTPException):
                raise
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update avatar in database"
                )

        logger.info(
            f"Avatar uploaded successfully for user {current_user.id}: "
            f"{avatar_url} ({len(file_content)} bytes -> {len(variants_data)} variants)"
        )

        return AvatarUploadResponse(
            avatar_url=avatar_url,
            message="Avatar uploaded and processed successfully",
            variants=saved_paths,
            metadata={
                'original_size': len(file_content),
                'original_dimensions': f"{metadata['width']}x{metadata['height']}",
                'format': metadata['format'],
            }
        )

    except ImageValidationError as e:
        logger.warning(f"Image validation failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except ImageProcessingError as e:
        logger.error(f"Image processing failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image processing failed: {str(e)}"
        )

    except Exception as e:
        logger.error(f"Unexpected error during avatar upload for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during upload"
        )


@router.delete("/me/avatar")
@limiter.limit("10/minute")
async def delete_avatar(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage_service: StorageService = Depends(get_storage_service),
) -> dict:
    """
    Delete user's avatar

    Removes all avatar variants from storage and clears avatar URL from database

    Returns:
        Success message

    Raises:
        HTTPException: If user has no avatar or deletion fails

    Rate limited to 10 requests per minute
    """
    if not current_user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No avatar to delete"
        )

    logger.info(f"Avatar deletion initiated for user {current_user.id}")

    try:
        # Delete all avatar files from storage
        deleted_count = await storage_service.delete_user_avatars(current_user.id)

        # Clear avatar URL from database
        updated_user = await profile_crud.update_avatar(db, current_user.id, None)

        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.info(f"Avatar deleted for user {current_user.id}: {deleted_count} files removed")

        return {
            "message": "Avatar deleted successfully",
            "files_deleted": deleted_count
        }

    except Exception as e:
        logger.error(f"Failed to delete avatar for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete avatar"
        )


@router.get("/me/avatar")
async def get_my_avatar(
    current_user: User = Depends(get_current_user),
    size: Optional[str] = "medium"
) -> dict:
    """
    Get authenticated user's avatar URL

    Args:
        size: Avatar size variant (thumbnail, small, medium, large, full)

    Returns:
        Avatar URL and available variants

    Raises:
        HTTPException: If user has no avatar
    """
    if not current_user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No avatar set"
        )

    # Extract base filename from current avatar URL
    # This is a simplified approach - in production you'd store variant paths
    response = {
        "avatar_url": current_user.avatar_url,
        "size": size,
    }

    return response


@router.get("/{user_id}/stats", response_model=ProfileStatsResponse)
async def get_user_stats(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> ProfileStatsResponse:
    """
    Get detailed statistics for a user

    Args:
        user_id: User ID

    Returns:
        User statistics

    Raises:
        HTTPException: If user not found
    """
    user = await profile_crud.get_user_profile(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return ProfileStatsResponse(
        total_reviews_given=user.total_reviews_given,
        total_reviews_received=user.total_reviews_received,
        avg_rating=user.avg_rating,
        avg_response_time_hours=user.avg_response_time_hours,
        member_since=user.created_at,
    )


@router.post("/me/stats/refresh", response_model=ProfileStatsResponse)
@limiter.limit("3/minute")
async def refresh_my_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileStatsResponse:
    """
    Recalculate and update authenticated user's statistics

    Returns:
        Updated user statistics

    Rate limited to 3 requests per minute
    """
    updated_user = await profile_crud.update_user_stats(db, current_user.id)

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Also award badges based on updated stats
    await profile_crud.award_badges(db, current_user.id)

    logger.info(f"Stats refreshed for user {current_user.id}")

    return ProfileStatsResponse(
        total_reviews_given=updated_user.total_reviews_given,
        total_reviews_received=updated_user.total_reviews_received,
        avg_rating=updated_user.avg_rating,
        avg_response_time_hours=updated_user.avg_response_time_hours,
        member_since=updated_user.created_at,
    )


@router.get("/{user_id}/badges")
async def get_user_badges(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get user's achievement badges

    Args:
        user_id: User ID

    Returns:
        User's badges

    Raises:
        HTTPException: If user not found
    """
    user = await profile_crud.get_user_profile(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    badges = profile_crud.parse_user_badges(user)

    return {"badges": badges, "total": len(badges)}
