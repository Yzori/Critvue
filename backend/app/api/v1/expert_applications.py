"""
Expert Application API Endpoints

Provides endpoints for users to submit and track expert reviewer applications.
"""

import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.expert_application import ExpertApplication, ApplicationStatus
from app.schemas.expert_application import (
    ExpertApplicationCreate,
    ExpertApplicationSubmit,
    ExpertApplicationResponse,
    ExpertApplicationStatusResponse,
)

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/v1/expert-applications", tags=["expert-applications"])


async def get_active_application(user_id: int, db: AsyncSession) -> Optional[ExpertApplication]:
    """
    Get user's most recent non-withdrawn application.

    Returns the most recent application that is not in withdrawn status.
    This prevents users from having multiple active applications.
    """
    stmt = (
        select(ExpertApplication)
        .where(
            and_(
                ExpertApplication.user_id == user_id,
                ExpertApplication.status != ApplicationStatus.WITHDRAWN
            )
        )
        .order_by(ExpertApplication.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def generate_application_number(db: AsyncSession) -> str:
    """
    Generate a unique application number in format CR-{year}-{sequential_number}.

    Example: CR-2025-0001, CR-2025-0002, etc.
    """
    current_year = datetime.utcnow().year

    # Get the count of submitted applications this year
    stmt = (
        select(ExpertApplication)
        .where(
            and_(
                ExpertApplication.status != ApplicationStatus.DRAFT,
                ExpertApplication.application_number.like(f"CR-{current_year}-%")
            )
        )
    )
    result = await db.execute(stmt)
    applications = result.scalars().all()

    # Generate next sequential number
    next_number = len(applications) + 1
    application_number = f"CR-{current_year}-{next_number:04d}"

    return application_number


@router.get("/me/status", response_model=ExpertApplicationStatusResponse)
async def get_my_application_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's expert application status.

    Returns the most recent non-withdrawn application if one exists.
    This prevents duplicate submissions by showing existing application status.
    """
    application = await get_active_application(current_user.id, db)

    if application:
        return ExpertApplicationStatusResponse(
            has_application=True,
            application=ExpertApplicationResponse.model_validate(application)
        )

    return ExpertApplicationStatusResponse(
        has_application=False,
        application=None
    )


@router.post("/", response_model=ExpertApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ExpertApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new expert application in draft status.

    Validates that user doesn't already have an active application.
    Applications are created in draft status and must be explicitly submitted.
    """
    # Check if user already has an active application
    existing_application = await get_active_application(current_user.id, db)
    if existing_application:
        logger.warning(f"User {current_user.id} attempted to create duplicate application. Existing: id={existing_application.id} status={existing_application.status}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an active application with status: {existing_application.status}"
        )

    # Create new application in draft status
    new_application = ExpertApplication(
        user_id=current_user.id,
        email=application_data.email,
        full_name=application_data.full_name,
        status=ApplicationStatus.DRAFT,
        application_data=application_data.application_data,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_application)
    await db.flush()
    await db.refresh(new_application)

    logger.info(f"Application created: id={new_application.id}")
    return ExpertApplicationResponse.model_validate(new_application)


@router.post("/{application_id}/submit", response_model=ExpertApplicationResponse)
async def submit_application(
    application_id: int,
    submission_data: ExpertApplicationSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit an application for review.

    Updates application status to 'submitted', sets submitted_at timestamp,
    generates unique application number, and stores final application data.

    Security: Ensures users can only submit their own applications.
    """
    # Get the application
    stmt = select(ExpertApplication).where(ExpertApplication.id == application_id)
    result = await db.execute(stmt)
    application = result.scalar_one_or_none()

    if not application:
        logger.warning(f"Application {application_id} not found for submission by user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Verify ownership
    if application.user_id != current_user.id:
        logger.warning(f"User {current_user.id} attempted to submit application {application_id} owned by user {application.user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own applications"
        )

    # Verify application is in draft status
    if application.status != ApplicationStatus.DRAFT:
        logger.warning(f"User {current_user.id} attempted to submit application {application_id} with status {application.status}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application cannot be submitted. Current status: {application.status}"
        )

    # Generate application number
    application_number = await generate_application_number(db)

    # Update application
    application.status = ApplicationStatus.SUBMITTED
    application.application_data = submission_data.application_data
    application.submitted_at = datetime.utcnow()
    application.application_number = application_number
    application.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(application)

    logger.info(f"Application submitted successfully: id={application_id}, number={application_number}")
    return ExpertApplicationResponse.model_validate(application)


@router.get("/{application_id}", response_model=ExpertApplicationResponse)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific application by ID.

    Security: Users can only view their own applications.
    Admins could be granted access to all applications (not implemented yet).
    """
    stmt = select(ExpertApplication).where(ExpertApplication.id == application_id)
    result = await db.execute(stmt)
    application = result.scalar_one_or_none()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Verify ownership (could be extended to allow admin access)
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own applications"
        )

    return ExpertApplicationResponse.model_validate(application)


@router.delete("/{application_id}/withdraw", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Withdraw an application.

    Allows users to withdraw submitted applications.
    After withdrawal, users can submit a new application.

    Security: Users can only withdraw their own applications.
    """
    stmt = select(ExpertApplication).where(ExpertApplication.id == application_id)
    result = await db.execute(stmt)
    application = result.scalar_one_or_none()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Verify ownership
    if application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only withdraw your own applications"
        )

    # Verify application can be withdrawn
    if application.status in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application cannot be withdrawn. Current status: {application.status}"
        )

    # Update status to withdrawn
    application.status = ApplicationStatus.WITHDRAWN
    application.updated_at = datetime.utcnow()

    await db.flush()

    return None
