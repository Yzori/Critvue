"""Settings API endpoints"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.models.privacy_settings import PrivacySettings, ProfileVisibility as DBProfileVisibility
from app.schemas.privacy import PrivacySettingsResponse, PrivacySettingsUpdate, ProfileVisibility
from app.api.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/privacy", response_model=PrivacySettingsResponse)
async def get_privacy_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> PrivacySettingsResponse:
    """
    Get current user's privacy settings.
    Creates default settings if none exist.
    """
    # Try to get existing settings
    result = await db.execute(
        select(PrivacySettings).where(PrivacySettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()

    # Create default settings if none exist
    if not settings:
        settings = PrivacySettings(
            user_id=current_user.id,
            profile_visibility=DBProfileVisibility.PUBLIC,
            show_on_leaderboard=True,
            show_karma_publicly=True,
            show_activity_status=True,
            allow_review_discovery=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return PrivacySettingsResponse(
        profile_visibility=ProfileVisibility(settings.profile_visibility.value),
        show_on_leaderboard=settings.show_on_leaderboard,
        show_karma_publicly=settings.show_karma_publicly,
        show_activity_status=settings.show_activity_status,
        allow_review_discovery=settings.allow_review_discovery,
    )


@router.patch("/privacy", response_model=PrivacySettingsResponse)
async def update_privacy_settings(
    updates: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> PrivacySettingsResponse:
    """
    Update current user's privacy settings.
    Creates default settings first if none exist.
    """
    # Try to get existing settings
    result = await db.execute(
        select(PrivacySettings).where(PrivacySettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()

    # Create default settings if none exist
    if not settings:
        settings = PrivacySettings(
            user_id=current_user.id,
            profile_visibility=DBProfileVisibility.PUBLIC,
            show_on_leaderboard=True,
            show_karma_publicly=True,
            show_activity_status=True,
            allow_review_discovery=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "profile_visibility" and value is not None:
            # Convert schema enum to DB enum
            setattr(settings, field, DBProfileVisibility(value.value))
        elif value is not None:
            setattr(settings, field, value)

    settings.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(settings)

    return PrivacySettingsResponse(
        profile_visibility=ProfileVisibility(settings.profile_visibility.value),
        show_on_leaderboard=settings.show_on_leaderboard,
        show_karma_publicly=settings.show_karma_publicly,
        show_activity_status=settings.show_activity_status,
        allow_review_discovery=settings.allow_review_discovery,
    )
