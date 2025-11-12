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

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["Profile"])
limiter = Limiter(key_func=get_remote_address, enabled=settings.ENABLE_RATE_LIMITING)

# Allowed image extensions for avatar upload
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB


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
        avatar_url=current_user.avatar_url,
        role=current_user.role.value,
        is_verified=current_user.is_verified,
        specialty_tags=specialty_tags,
        badges=badges,
        total_reviews_given=current_user.total_reviews_given,
        total_reviews_received=current_user.total_reviews_received,
        avg_rating=current_user.avg_rating,
        avg_response_time_hours=current_user.avg_response_time_hours,
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
        avatar_url=user.avatar_url,
        role=user.role.value,
        is_verified=user.is_verified,
        specialty_tags=specialty_tags,
        badges=badges,
        total_reviews_given=user.total_reviews_given,
        total_reviews_received=user.total_reviews_received,
        avg_rating=user.avg_rating,
        avg_response_time_hours=user.avg_response_time_hours,
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
        avatar_url=updated_user.avatar_url,
        role=updated_user.role.value,
        is_verified=updated_user.is_verified,
        specialty_tags=specialty_tags,
        badges=badges,
        total_reviews_given=updated_user.total_reviews_given,
        total_reviews_received=updated_user.total_reviews_received,
        avg_rating=updated_user.avg_rating,
        avg_response_time_hours=updated_user.avg_response_time_hours,
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
) -> AvatarUploadResponse:
    """
    Upload user avatar image

    Args:
        file: Image file to upload (jpg, jpeg, png, gif, webp)

    Returns:
        New avatar URL

    Raises:
        HTTPException: If file type invalid or too large

    Rate limited to 5 requests per minute
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided"
        )

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content and check size
    file_content = await file.read()
    if len(file_content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {MAX_AVATAR_SIZE / 1024 / 1024}MB",
        )

    # Generate unique filename
    unique_filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{file_ext}"

    # Save file to uploads directory
    uploads_dir = Path("/home/user/Critvue/backend/uploads/avatars")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    file_path = uploads_dir / unique_filename

    with open(file_path, "wb") as f:
        f.write(file_content)

    # Update user avatar URL
    avatar_url = f"/files/avatars/{unique_filename}"
    updated_user = await profile_crud.update_avatar(db, current_user.id, avatar_url)

    if not updated_user:
        # Clean up uploaded file if user update fails
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    logger.info(f"Avatar uploaded for user {current_user.id}: {avatar_url}")

    return AvatarUploadResponse(avatar_url=avatar_url)


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
