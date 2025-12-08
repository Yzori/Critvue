"""CRUD operations for slot applications"""

import logging
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.slot_application import SlotApplication, SlotApplicationStatus
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.review_request import ReviewRequest, ReviewType
from app.models.user import User

logger = logging.getLogger(__name__)


# ===== Validation Errors =====

class ApplicationError(Exception):
    """Base exception for application errors"""
    pass


class DuplicateApplicationError(ApplicationError):
    """User already has a pending application for this request"""
    pass


class NotPaidRequestError(ApplicationError):
    """Request is not a paid/expert review, applications not required"""
    pass


class NoSlotsAvailableError(ApplicationError):
    """No available slots to assign"""
    pass


class NotRequestOwnerError(ApplicationError):
    """User is not the owner of the review request"""
    pass


class NotApplicantError(ApplicationError):
    """User is not the applicant"""
    pass


class SelfApplicationError(ApplicationError):
    """Cannot apply to own review request"""
    pass


# ===== Create Operations =====

async def create_application(
    db: AsyncSession,
    review_request_id: int,
    applicant_id: int,
    pitch_message: str
) -> SlotApplication:
    """
    Create a new slot application.

    Args:
        db: Database session
        review_request_id: ID of the review request
        applicant_id: ID of the applying user
        pitch_message: The applicant's pitch message

    Returns:
        Created SlotApplication

    Raises:
        DuplicateApplicationError: User already has a pending application
        NotPaidRequestError: Request is not a paid/expert review
        SelfApplicationError: Cannot apply to own request
        NoSlotsAvailableError: All slots are already filled
    """
    # Get the review request
    query = select(ReviewRequest).where(ReviewRequest.id == review_request_id)
    result = await db.execute(query)
    review_request = result.scalar_one_or_none()

    if not review_request:
        raise ValueError("Review request not found")

    # Check it's a paid/expert review
    if review_request.review_type != ReviewType.EXPERT:
        raise NotPaidRequestError("Applications are only for paid expert reviews")

    # Check user is not applying to their own request
    if review_request.user_id == applicant_id:
        raise SelfApplicationError("Cannot apply to your own review request")

    # Check for existing pending application
    existing_query = select(SlotApplication).where(
        and_(
            SlotApplication.review_request_id == review_request_id,
            SlotApplication.applicant_id == applicant_id,
            SlotApplication.status == SlotApplicationStatus.PENDING.value
        )
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalar_one_or_none():
        raise DuplicateApplicationError("You already have a pending application for this request")

    # Check if there are still slots to fill
    available_slots_query = select(func.count(ReviewSlot.id)).where(
        and_(
            ReviewSlot.review_request_id == review_request_id,
            ReviewSlot.status == ReviewSlotStatus.AVAILABLE.value
        )
    )
    available_count_result = await db.execute(available_slots_query)
    available_count = available_count_result.scalar()

    if available_count == 0:
        raise NoSlotsAvailableError("All slots for this review request have been filled")

    # Create the application
    application = SlotApplication(
        review_request_id=review_request_id,
        applicant_id=applicant_id,
        pitch_message=pitch_message.strip(),
        status=SlotApplicationStatus.PENDING.value
    )

    db.add(application)
    await db.commit()
    await db.refresh(application)

    logger.info(
        f"Created slot application {application.id} for request {review_request_id} "
        f"from user {applicant_id}"
    )

    return application


# ===== Read Operations =====

async def get_application(
    db: AsyncSession,
    application_id: int,
    with_applicant: bool = False
) -> Optional[SlotApplication]:
    """
    Get a single application by ID.

    Args:
        db: Database session
        application_id: Application ID
        with_applicant: Whether to eager load applicant info

    Returns:
        SlotApplication or None
    """
    query = select(SlotApplication).where(SlotApplication.id == application_id)

    if with_applicant:
        query = query.options(selectinload(SlotApplication.applicant))

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_application_with_request(
    db: AsyncSession,
    application_id: int
) -> Optional[SlotApplication]:
    """
    Get an application with its review request loaded.

    Args:
        db: Database session
        application_id: Application ID

    Returns:
        SlotApplication with review_request loaded, or None
    """
    query = (
        select(SlotApplication)
        .where(SlotApplication.id == application_id)
        .options(
            selectinload(SlotApplication.review_request),
            selectinload(SlotApplication.applicant)
        )
    )

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_applications_for_request(
    db: AsyncSession,
    review_request_id: int,
    status: Optional[SlotApplicationStatus] = None,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[SlotApplication], int]:
    """
    Get all applications for a review request.

    Args:
        db: Database session
        review_request_id: Review request ID
        status: Optional status filter
        skip: Pagination offset
        limit: Pagination limit

    Returns:
        Tuple of (applications, total_count)
    """
    # Base query with applicant and review_request info (review_request needed for ownership check)
    query = (
        select(SlotApplication)
        .where(SlotApplication.review_request_id == review_request_id)
        .options(
            selectinload(SlotApplication.applicant),
            selectinload(SlotApplication.review_request)
        )
    )

    if status:
        query = query.where(SlotApplication.status == status.value)

    # Count query
    count_query = select(func.count(SlotApplication.id)).where(
        SlotApplication.review_request_id == review_request_id
    )
    if status:
        count_query = count_query.where(SlotApplication.status == status.value)

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Get paginated results, ordered by newest first
    query = query.order_by(SlotApplication.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    applications = list(result.scalars().all())

    return applications, total


async def get_user_applications(
    db: AsyncSession,
    user_id: int,
    status: Optional[SlotApplicationStatus] = None,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[SlotApplication], int]:
    """
    Get all applications for a user (applicant view).

    Args:
        db: Database session
        user_id: Applicant user ID
        status: Optional status filter
        skip: Pagination offset
        limit: Pagination limit

    Returns:
        Tuple of (applications, total_count)
    """
    # Base query with review request info
    query = (
        select(SlotApplication)
        .where(SlotApplication.applicant_id == user_id)
        .options(
            selectinload(SlotApplication.review_request),
            selectinload(SlotApplication.assigned_slot)
        )
    )

    if status:
        query = query.where(SlotApplication.status == status.value)

    # Count query
    count_query = select(func.count(SlotApplication.id)).where(
        SlotApplication.applicant_id == user_id
    )
    if status:
        count_query = count_query.where(SlotApplication.status == status.value)

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Get paginated results, ordered by newest first
    query = query.order_by(SlotApplication.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    applications = list(result.scalars().all())

    return applications, total


async def get_application_counts_for_request(
    db: AsyncSession,
    review_request_id: int
) -> dict:
    """
    Get application counts by status for a request.

    Args:
        db: Database session
        review_request_id: Review request ID

    Returns:
        Dict with counts: {pending, accepted, rejected, withdrawn, expired, total}
    """
    query = (
        select(SlotApplication.status, func.count(SlotApplication.id))
        .where(SlotApplication.review_request_id == review_request_id)
        .group_by(SlotApplication.status)
    )

    result = await db.execute(query)
    counts = {row[0]: row[1] for row in result.all()}

    return {
        "pending": counts.get(SlotApplicationStatus.PENDING.value, 0),
        "accepted": counts.get(SlotApplicationStatus.ACCEPTED.value, 0),
        "rejected": counts.get(SlotApplicationStatus.REJECTED.value, 0),
        "withdrawn": counts.get(SlotApplicationStatus.WITHDRAWN.value, 0),
        "expired": counts.get(SlotApplicationStatus.EXPIRED.value, 0),
        "total": sum(counts.values())
    }


async def get_user_application_counts(
    db: AsyncSession,
    user_id: int
) -> dict:
    """
    Get application counts by status for a user.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Dict with counts: {pending, accepted, rejected, withdrawn, expired, total}
    """
    query = (
        select(SlotApplication.status, func.count(SlotApplication.id))
        .where(SlotApplication.applicant_id == user_id)
        .group_by(SlotApplication.status)
    )

    result = await db.execute(query)
    counts = {row[0]: row[1] for row in result.all()}

    return {
        "pending": counts.get(SlotApplicationStatus.PENDING.value, 0),
        "accepted": counts.get(SlotApplicationStatus.ACCEPTED.value, 0),
        "rejected": counts.get(SlotApplicationStatus.REJECTED.value, 0),
        "withdrawn": counts.get(SlotApplicationStatus.WITHDRAWN.value, 0),
        "expired": counts.get(SlotApplicationStatus.EXPIRED.value, 0),
        "total": sum(counts.values())
    }


async def check_existing_application(
    db: AsyncSession,
    review_request_id: int,
    user_id: int
) -> Optional[SlotApplication]:
    """
    Check if user has an existing active application for this request.

    Args:
        db: Database session
        review_request_id: Review request ID
        user_id: User ID

    Returns:
        Existing application or None
    """
    query = select(SlotApplication).where(
        and_(
            SlotApplication.review_request_id == review_request_id,
            SlotApplication.applicant_id == user_id,
            SlotApplication.status.in_([
                SlotApplicationStatus.PENDING.value,
                SlotApplicationStatus.ACCEPTED.value
            ])
        )
    )

    result = await db.execute(query)
    return result.scalar_one_or_none()


# ===== Update Operations =====

async def accept_application(
    db: AsyncSession,
    application_id: int,
    creator_id: int
) -> SlotApplication:
    """
    Accept an application and assign a slot.

    Args:
        db: Database session
        application_id: Application ID
        creator_id: ID of user accepting (must be request owner)

    Returns:
        Updated SlotApplication

    Raises:
        NotRequestOwnerError: User is not the request owner
        NoSlotsAvailableError: No available slots
        ValueError: Application not found or invalid state
    """
    # Get application with request
    application = await get_application_with_request(db, application_id)

    if not application:
        raise ValueError("Application not found")

    if not application.is_pending:
        raise ValueError(f"Cannot accept application in status '{application.status}'")

    # Check creator owns the request
    if application.review_request.user_id != creator_id:
        raise NotRequestOwnerError("Only the request owner can accept applications")

    # Find an available slot
    slot_query = (
        select(ReviewSlot)
        .where(
            and_(
                ReviewSlot.review_request_id == application.review_request_id,
                ReviewSlot.status == ReviewSlotStatus.AVAILABLE.value
            )
        )
        .with_for_update()  # Lock the slot
        .limit(1)
    )

    result = await db.execute(slot_query)
    slot = result.scalar_one_or_none()

    if not slot:
        raise NoSlotsAvailableError("No available slots remaining")

    # Claim the slot for the applicant
    slot.claim(application.applicant_id)

    # Accept the application
    application.accept(slot.id)

    # Update the review request claim count
    application.review_request.reviews_claimed += 1

    await db.commit()
    await db.refresh(application)

    logger.info(
        f"Accepted application {application_id}, assigned slot {slot.id} "
        f"to user {application.applicant_id}"
    )

    return application


async def reject_application(
    db: AsyncSession,
    application_id: int,
    creator_id: int,
    reason: Optional[str] = None
) -> SlotApplication:
    """
    Reject an application.

    Args:
        db: Database session
        application_id: Application ID
        creator_id: ID of user rejecting (must be request owner)
        reason: Optional rejection reason

    Returns:
        Updated SlotApplication

    Raises:
        NotRequestOwnerError: User is not the request owner
        ValueError: Application not found or invalid state
    """
    # Get application with request
    application = await get_application_with_request(db, application_id)

    if not application:
        raise ValueError("Application not found")

    if not application.is_pending:
        raise ValueError(f"Cannot reject application in status '{application.status}'")

    # Check creator owns the request
    if application.review_request.user_id != creator_id:
        raise NotRequestOwnerError("Only the request owner can reject applications")

    # Reject the application
    application.reject(reason)

    await db.commit()
    await db.refresh(application)

    logger.info(f"Rejected application {application_id}")

    return application


async def withdraw_application(
    db: AsyncSession,
    application_id: int,
    applicant_id: int
) -> SlotApplication:
    """
    Withdraw an application (by the applicant).

    Args:
        db: Database session
        application_id: Application ID
        applicant_id: ID of user withdrawing (must be the applicant)

    Returns:
        Updated SlotApplication

    Raises:
        NotApplicantError: User is not the applicant
        ValueError: Application not found or invalid state
    """
    application = await get_application(db, application_id)

    if not application:
        raise ValueError("Application not found")

    if application.applicant_id != applicant_id:
        raise NotApplicantError("Only the applicant can withdraw their application")

    if not application.is_withdrawable:
        raise ValueError(f"Cannot withdraw application in status '{application.status}'")

    application.withdraw()

    await db.commit()
    await db.refresh(application)

    logger.info(f"Withdrawn application {application_id} by user {applicant_id}")

    return application


async def expire_pending_applications(
    db: AsyncSession,
    review_request_id: int
) -> int:
    """
    Expire all pending applications for a request (when request is completed/cancelled).

    Args:
        db: Database session
        review_request_id: Review request ID

    Returns:
        Number of expired applications
    """
    # Get pending applications
    query = select(SlotApplication).where(
        and_(
            SlotApplication.review_request_id == review_request_id,
            SlotApplication.status == SlotApplicationStatus.PENDING.value
        )
    )

    result = await db.execute(query)
    applications = list(result.scalars().all())

    count = 0
    for application in applications:
        application.expire()
        count += 1

    if count > 0:
        await db.commit()
        logger.info(f"Expired {count} applications for request {review_request_id}")

    return count


# ===== Helper Functions =====

async def is_paid_request(
    db: AsyncSession,
    review_request_id: int
) -> bool:
    """
    Check if a review request is a paid/expert review.

    Args:
        db: Database session
        review_request_id: Review request ID

    Returns:
        True if it's a paid expert review
    """
    query = select(ReviewRequest.review_type).where(
        ReviewRequest.id == review_request_id
    )
    result = await db.execute(query)
    review_type = result.scalar_one_or_none()

    return review_type == ReviewType.EXPERT


async def get_available_slot_count(
    db: AsyncSession,
    review_request_id: int
) -> int:
    """
    Get count of available slots for a request.

    Args:
        db: Database session
        review_request_id: Review request ID

    Returns:
        Number of available slots
    """
    query = select(func.count(ReviewSlot.id)).where(
        and_(
            ReviewSlot.review_request_id == review_request_id,
            ReviewSlot.status == ReviewSlotStatus.AVAILABLE.value
        )
    )

    result = await db.execute(query)
    return result.scalar() or 0
