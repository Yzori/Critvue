"""Profile API endpoints"""

import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Request, UploadFile, status
from app.core.exceptions import (
    CritvueException,
    NotFoundError,
    InvalidInputError,
    InternalError,
    ForbiddenError,
    NotOwnerError,
    AdminRequiredError,
    ConflictError,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.session import get_db
from app.models.user import User, ReviewerAvailability
from app.api.deps import get_current_user
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdate,
    ProfileStatsResponse,
    AvatarUploadResponse,
    OnboardingStatusResponse,
    OnboardingCompleteRequest,
    OnboardingCompleteResponse,
    ReviewerSettingsUpdate,
    ReviewerSettingsResponse,
    is_username_reserved,
)
from app.crud import profile as profile_crud
from app.core.config import settings
from app.core.logging_config import logging
from app.services.image_service import ImageService, ImageValidationError, ImageProcessingError
from app.services.storage_service import StorageService, StorageError
from app.services.service_factory import get_image_service, get_storage_service
from app.services.reviewer_dna_service import ReviewerDNAService

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
        username=current_user.username,
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
        sparks_points=current_user.sparks_points,
        tier_achieved_at=current_user.tier_achieved_at,
        onboarding_completed=current_user.onboarding_completed,
        primary_interest=current_user.primary_interest,
        is_listed_as_reviewer=current_user.is_listed_as_reviewer,
        reviewer_availability=current_user.reviewer_availability.value if current_user.reviewer_availability else "available",
        reviewer_tagline=current_user.reviewer_tagline,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.get("/check-username/{username}")
@limiter.limit("30/minute")
async def check_username_availability(
    request: Request,
    username: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Check if a username is available

    Args:
        username: Username to check

    Returns:
        Availability status and sanitized username

    Rate limited to 30 requests per minute to prevent enumeration
    """
    # Sanitize the username
    sanitized = username.strip().lower()

    # Basic validation
    import re
    if not re.match(r'^[a-z0-9_-]+$', sanitized):
        return {
            "available": False,
            "username": sanitized,
            "reason": "Username can only contain letters, numbers, underscores, and hyphens"
        }

    if len(sanitized) < 3:
        return {
            "available": False,
            "username": sanitized,
            "reason": "Username must be at least 3 characters"
        }

    if sanitized.isdigit():
        return {
            "available": False,
            "username": sanitized,
            "reason": "Username cannot be purely numeric"
        }

    # Check against reserved usernames (exact match and prefix match)
    if is_username_reserved(sanitized):
        return {
            "available": False,
            "username": sanitized,
            "reason": "This username is reserved and cannot be used"
        }

    # Check availability in database
    is_available = await profile_crud.is_username_available(db, sanitized, exclude_user_id=current_user.id)

    return {
        "available": is_available,
        "username": sanitized,
        "reason": None if is_available else "Username is already taken"
    }


@router.get("/{identifier}", response_model=ProfileResponse)
async def get_user_profile(
    identifier: str,
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """
    Get any user's public profile by ID or username

    Args:
        identifier: User ID (numeric) or username (alphanumeric)

    Returns:
        User's public profile data

    Raises:
        HTTPException: If user not found
    """
    user = await profile_crud.get_user_by_identifier(db, identifier)

    if not user:
        raise NotFoundError(resource="User")

    # Parse JSON fields
    specialty_tags = profile_crud.parse_user_specialty_tags(user)
    badges = profile_crud.parse_user_badges(user)

    return ProfileResponse(
        id=user.id,
        email=user.email,
        username=user.username,
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
        karma_points=user.sparks_points,
        tier_achieved_at=user.tier_achieved_at,
        onboarding_completed=user.onboarding_completed,
        primary_interest=user.primary_interest,
        is_listed_as_reviewer=user.is_listed_as_reviewer,
        reviewer_availability=user.reviewer_availability.value if user.reviewer_availability else "available",
        reviewer_tagline=user.reviewer_tagline,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.put("/me", response_model=ProfileResponse)
@router.patch("/me", response_model=ProfileResponse)
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
        profile_data: Profile fields to update (title, bio, specialty_tags, username)

    Returns:
        Updated user profile

    Rate limited to 10 requests per minute
    """
    # Check if username is being updated and if it's available
    if profile_data.username is not None:
        is_available = await profile_crud.is_username_available(
            db, profile_data.username, exclude_user_id=current_user.id
        )
        if not is_available:
            raise InvalidInputError(message="Username is already taken")

    try:
        updated_user = await profile_crud.update_profile(
            db, current_user.id, profile_data
        )
    except IntegrityError as e:
        # Handle race condition where username was taken between check and update
        await db.rollback()
        logger.warning(f"Username conflict for user {current_user.id}: {e}")
        raise ConflictError(message="Username was taken by another user. Please try a different username.")

    if not updated_user:
        raise NotFoundError(resource="User")

    logger.info(f"Profile updated for user {current_user.id}")

    # Parse JSON fields
    specialty_tags = profile_crud.parse_user_specialty_tags(updated_user)
    badges = profile_crud.parse_user_badges(updated_user)

    return ProfileResponse(
        id=updated_user.id,
        email=updated_user.email,
        username=updated_user.username,
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
        karma_points=updated_user.sparks_points,
        tier_achieved_at=updated_user.tier_achieved_at,
        onboarding_completed=updated_user.onboarding_completed,
        primary_interest=updated_user.primary_interest,
        is_listed_as_reviewer=updated_user.is_listed_as_reviewer,
        reviewer_availability=updated_user.reviewer_availability.value if updated_user.reviewer_availability else "available",
        reviewer_tagline=updated_user.reviewer_tagline,
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
        raise InvalidInputError(message="No filename provided")

    logger.info(f"Avatar upload initiated for user {current_user.id}: {file.filename}")

    try:
        # Read file content
        file_content = await file.read()

        # 1. Validate image
        mime_type, image = await image_service.validate_image(file_content, file.filename)

        # 2. Perform content safety check
        is_safe = await image_service.check_image_content(image)
        if not is_safe:
            raise InvalidInputError(message="Image failed content safety check")

        # 3. Extract metadata (for logging/analytics)
        metadata = await image_service.extract_metadata(image)
        logger.info(f"Image metadata: {metadata}")

        # 4. Generate optimized variants
        # Strip metadata for privacy by default
        strip_metadata = settings.AVATAR_STRIP_METADATA

        # Generate all size variants
        variants_data = await image_service.generate_variants(image, strip_metadata)

        if not variants_data:
            raise InternalError(message="Failed to generate image variants")

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

                raise InternalError(message=f"Failed to save image: {str(e)}")

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

                raise NotFoundError(resource="User")
        except Exception as e:
            # Rollback: Clean up uploaded files on database error
            logger.error(f"Database update failed, rolling back file uploads: {e}")
            for saved_path in saved_paths.values():
                try:
                    await storage_service.delete_file(saved_path)
                except Exception as cleanup_error:
                    logger.error(f"Failed to clean up file during rollback: {cleanup_error}")

            # Re-raise the exception if it's already a known exception type
            if isinstance(e, CritvueException):
                raise
            raise InternalError(message="Failed to update avatar in database")

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
        raise InvalidInputError(message=str(e))

    except ImageProcessingError as e:
        logger.error(f"Image processing failed for user {current_user.id}: {e}")
        raise InternalError(message=f"Image processing failed: {str(e)}")

    except Exception as e:
        logger.error(f"Unexpected error during avatar upload for user {current_user.id}: {e}")
        raise InternalError(message="An unexpected error occurred during upload")


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
        raise NotFoundError(message="No avatar to delete")

    logger.info(f"Avatar deletion initiated for user {current_user.id}")

    try:
        # Delete all avatar files from storage
        deleted_count = await storage_service.delete_user_avatars(current_user.id)

        # Clear avatar URL from database
        updated_user = await profile_crud.update_avatar(db, current_user.id, None)

        if not updated_user:
            raise NotFoundError(resource="User")

        logger.info(f"Avatar deleted for user {current_user.id}: {deleted_count} files removed")

        return {
            "message": "Avatar deleted successfully",
            "files_deleted": deleted_count
        }

    except Exception as e:
        logger.error(f"Failed to delete avatar for user {current_user.id}: {e}")
        raise InternalError(message="Failed to delete avatar")


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
        raise NotFoundError(message="No avatar set")

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
        raise NotFoundError(resource="User")

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
        raise NotFoundError(resource="User")

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
        raise NotFoundError(resource="User")

    badges = profile_crud.parse_user_badges(user)

    return {"badges": badges, "total": len(badges)}


@router.get("/me/dna")
async def get_my_dna(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get authenticated user's Reviewer DNA profile

    Returns DNA fingerprint across 6 dimensions:
    - Speed: How quickly they complete reviews
    - Depth: Thoroughness of feedback
    - Specificity: Actionable suggestions per review
    - Constructiveness: Balance of positive/constructive feedback
    - Technical: Domain expertise accuracy
    - Encouragement: Supportive language score

    Returns:
        DNA profile with all dimensions, overall score, and insights
    """
    dna_service = ReviewerDNAService(db)
    dna_summary = await dna_service.get_dna_summary(current_user.id)

    if not dna_summary:
        raise NotFoundError(resource="DNA profile")

    return dna_summary


@router.get("/{user_id}/dna")
async def get_user_dna(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get any user's public Reviewer DNA profile

    Args:
        user_id: User ID to fetch DNA for

    Returns:
        DNA profile with all dimensions and insights

    Raises:
        HTTPException: If user not found
    """
    user = await profile_crud.get_user_profile(db, user_id)

    if not user:
        raise NotFoundError(resource="User")

    dna_service = ReviewerDNAService(db)
    dna_summary = await dna_service.get_dna_summary(user_id)

    if not dna_summary:
        raise NotFoundError(resource="DNA profile")

    return dna_summary


@router.post("/me/dna/recalculate")
@limiter.limit("3/minute")
async def recalculate_my_dna(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Recalculate authenticated user's Reviewer DNA

    Triggers a full recalculation of DNA dimensions based on
    all review history. Use this after significant review activity.

    Returns:
        Updated DNA profile

    Rate limited to 3 requests per minute
    """
    dna_service = ReviewerDNAService(db)
    dna = await dna_service.calculate_dna(current_user.id)

    if not dna:
        raise NotFoundError(message="Failed to calculate DNA")

    logger.info(f"DNA recalculated for user {current_user.id}")

    # Return full summary
    return await dna_service.get_dna_summary(current_user.id)


@router.get("/me/dna/compare")
async def compare_my_dna(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Compare authenticated user's DNA to platform average

    Returns:
        Comparison data showing user vs. average for each dimension
    """
    dna_service = ReviewerDNAService(db)
    comparison = await dna_service.compare_to_average(current_user.id)

    if not comparison:
        raise NotFoundError(resource="DNA profile")

    return comparison


# ==================== Onboarding Endpoints ====================


@router.get("/me/onboarding", response_model=OnboardingStatusResponse)
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
) -> OnboardingStatusResponse:
    """
    Get current user's onboarding status

    Returns:
        Onboarding status including completion state and preferences
    """
    return OnboardingStatusResponse(
        onboarding_completed=current_user.onboarding_completed,
        primary_interest=current_user.primary_interest,
        is_listed_as_reviewer=current_user.is_listed_as_reviewer,
        reviewer_availability=current_user.reviewer_availability.value if current_user.reviewer_availability else "available",
        reviewer_tagline=current_user.reviewer_tagline,
    )


@router.post("/me/onboarding", response_model=OnboardingCompleteResponse)
async def complete_onboarding(
    request: Request,
    data: OnboardingCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OnboardingCompleteResponse:
    """
    Complete user onboarding

    Sets the user's primary interest (creator, reviewer, or both) and
    optionally lists them in the reviewer directory.

    Args:
        data: Onboarding completion data

    Returns:
        Confirmation of onboarding completion
    """
    # Update user's onboarding fields
    current_user.onboarding_completed = True
    current_user.primary_interest = data.primary_interest
    current_user.is_listed_as_reviewer = data.list_as_reviewer

    if data.reviewer_tagline:
        current_user.reviewer_tagline = data.reviewer_tagline

    # If listing as reviewer, default to available
    if data.list_as_reviewer:
        current_user.reviewer_availability = ReviewerAvailability.AVAILABLE

    await db.commit()
    await db.refresh(current_user)

    logger.info(
        f"Onboarding completed for user {current_user.id}: "
        f"interest={data.primary_interest}, listed={data.list_as_reviewer}"
    )

    return OnboardingCompleteResponse(
        success=True,
        message="Onboarding completed successfully",
        onboarding_completed=True,
        primary_interest=data.primary_interest,
        is_listed_as_reviewer=data.list_as_reviewer,
    )


# ==================== Reviewer Settings Endpoints ====================


@router.get("/me/reviewer-settings", response_model=ReviewerSettingsResponse)
async def get_reviewer_settings(
    current_user: User = Depends(get_current_user),
) -> ReviewerSettingsResponse:
    """
    Get current user's reviewer directory settings

    Returns:
        Reviewer listing settings
    """
    return ReviewerSettingsResponse(
        is_listed_as_reviewer=current_user.is_listed_as_reviewer,
        reviewer_availability=current_user.reviewer_availability.value if current_user.reviewer_availability else "available",
        reviewer_tagline=current_user.reviewer_tagline,
    )


@router.put("/me/reviewer-settings", response_model=ReviewerSettingsResponse)
@router.patch("/me/reviewer-settings", response_model=ReviewerSettingsResponse)
@limiter.limit("10/minute")
async def update_reviewer_settings(
    request: Request,
    data: ReviewerSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewerSettingsResponse:
    """
    Update current user's reviewer directory settings

    Args:
        data: Reviewer settings to update

    Returns:
        Updated reviewer settings

    Rate limited to 10 requests per minute
    """
    if data.is_listed_as_reviewer is not None:
        current_user.is_listed_as_reviewer = data.is_listed_as_reviewer

    if data.reviewer_availability is not None:
        try:
            current_user.reviewer_availability = ReviewerAvailability(data.reviewer_availability)
        except ValueError:
            raise InvalidInputError(message="Invalid availability status")

    if data.reviewer_tagline is not None:
        current_user.reviewer_tagline = data.reviewer_tagline

    await db.commit()
    await db.refresh(current_user)

    logger.info(f"Reviewer settings updated for user {current_user.id}")

    return ReviewerSettingsResponse(
        is_listed_as_reviewer=current_user.is_listed_as_reviewer,
        reviewer_availability=current_user.reviewer_availability.value if current_user.reviewer_availability else "available",
        reviewer_tagline=current_user.reviewer_tagline,
    )
