"""API endpoints for slot applications (expert review slot application system)"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, status, Request
from app.core.exceptions import (
    NotFoundError,
    InvalidInputError,
    InternalError,
    ForbiddenError,
    NotOwnerError,
    AdminRequiredError,
    ConflictError,
)
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, get_db
from app.crud import slot_application as crud_slot_application
from app.crud.slot_application import (
    ApplicationError,
    DuplicateApplicationError,
    NotPaidRequestError,
    NoSlotsAvailableError,
    NotRequestOwnerError,
    NotApplicantError,
    SelfApplicationError,
)
from app.models.user import User
from app.models.slot_application import SlotApplicationStatus
from app.schemas.slot_application import (
    SlotApplicationCreate,
    SlotApplicationReject,
    SlotApplicationResponse,
    SlotApplicationWithApplicant,
    SlotApplicationListResponse,
    RequestApplicationsResponse,
    MyApplicationsResponse,
    ApplicantInfo,
)
from app.services.notification_triggers import (
    notify_slot_application_received,
    notify_slot_application_accepted,
    notify_slot_application_rejected,
    notify_slot_application_withdrawn,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/slot-applications", tags=["slot-applications"])

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


# ===== Helper Functions =====

def _build_applicant_info(user: User) -> ApplicantInfo:
    """Build applicant info from user model."""
    return ApplicantInfo(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        user_tier=user.user_tier.value if user.user_tier else None,
        sparks_points=user.sparks_points,
        total_reviews_given=user.total_reviews_given,
        avg_rating=float(user.avg_rating) if user.avg_rating else None,
        acceptance_rate=float(user.acceptance_rate) if user.acceptance_rate else None,
    )


def _build_application_response(application, include_applicant: bool = False) -> SlotApplicationResponse:
    """Build application response from model."""
    response = SlotApplicationResponse(
        id=application.id,
        review_request_id=application.review_request_id,
        applicant_id=application.applicant_id,
        assigned_slot_id=application.assigned_slot_id,
        status=application.status,
        pitch_message=application.pitch_message,
        rejection_reason=application.rejection_reason,
        created_at=application.created_at,
        updated_at=application.updated_at,
        decided_at=application.decided_at,
        applicant=_build_applicant_info(application.applicant) if include_applicant and application.applicant else None,
    )
    return response


# ===== Apply for a Slot =====

@router.post(
    "/apply",
    response_model=SlotApplicationResponse,
    status_code=status.HTTP_201_CREATED
)
@limiter.limit("10/minute")
async def apply_for_slot(
    request: Request,
    application_data: SlotApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Apply to review a paid expert review request.

    **Requirements:**
    - Request must be a paid/expert review (applications are not for free reviews)
    - User cannot apply to their own request
    - User cannot have multiple pending applications for the same request
    - There must be available slots

    **Rate Limit:** 10 requests per minute
    """
    try:
        application = await crud_slot_application.create_application(
            db,
            review_request_id=application_data.review_request_id,
            applicant_id=current_user.id,
            pitch_message=application_data.pitch_message
        )

        logger.info(
            f"User {current_user.id} applied for request {application_data.review_request_id}"
        )

        # Send notification to request owner about new application
        await notify_slot_application_received(db, application.id, current_user.id)

        return _build_application_response(application)

    except DuplicateApplicationError as e:
        raise ConflictError(message=str(e))
    except NotPaidRequestError as e:
        raise InvalidInputError(message=str(e))
    except SelfApplicationError as e:
        raise InvalidInputError(message=str(e))
    except NoSlotsAvailableError as e:
        raise InvalidInputError(message=str(e))
    except ValueError as e:
        raise NotFoundError(message=str(e))
    except Exception as e:
        logger.error(f"Error creating application: {e}")
        raise InternalError(message="An error occurred while creating the application")


# ===== Get Applications for a Request (Creator View) =====

@router.get(
    "/request/{review_request_id}",
    response_model=RequestApplicationsResponse
)
async def get_request_applications(
    review_request_id: int,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all applications for a review request (creator view).

    **Requirements:**
    - User must be the owner of the review request

    **Query Parameters:**
    - status_filter: Optional filter by status (pending, accepted, rejected, etc.)
    """
    # Parse status filter
    app_status = None
    if status_filter:
        try:
            app_status = SlotApplicationStatus(status_filter)
        except ValueError:
            raise InvalidInputError(message=f"Invalid status filter: {status_filter}")

    # Get applications
    applications, total = await crud_slot_application.get_applications_for_request(
        db, review_request_id, status=app_status
    )

    # Verify ownership (check the first application's request, or fetch the request directly)
    if applications:
        if applications[0].review_request.user_id != current_user.id:
            raise ForbiddenError(message="Only the request owner can view applications")
    else:
        # No applications yet - verify request exists and user owns it
        from app.models.review_request import ReviewRequest
        from sqlalchemy import select

        query = select(ReviewRequest).where(ReviewRequest.id == review_request_id)
        result = await db.execute(query)
        review_request = result.scalar_one_or_none()

        if not review_request:
            raise NotFoundError(resource="Review request")

        if review_request.user_id != current_user.id:
            raise ForbiddenError(message="Only the request owner can view applications")

    # Get counts
    counts = await crud_slot_application.get_application_counts_for_request(
        db, review_request_id
    )

    # Get available slot count
    available_slots = await crud_slot_application.get_available_slot_count(
        db, review_request_id
    )

    # Build response with applicant info
    app_responses = [
        SlotApplicationWithApplicant(
            id=app.id,
            review_request_id=app.review_request_id,
            applicant_id=app.applicant_id,
            assigned_slot_id=app.assigned_slot_id,
            status=app.status,
            pitch_message=app.pitch_message,
            rejection_reason=app.rejection_reason,
            created_at=app.created_at,
            updated_at=app.updated_at,
            decided_at=app.decided_at,
            applicant=_build_applicant_info(app.applicant) if app.applicant else None,
        )
        for app in applications
    ]

    return RequestApplicationsResponse(
        review_request_id=review_request_id,
        total_applications=counts["total"],
        pending_count=counts["pending"],
        accepted_count=counts["accepted"],
        rejected_count=counts["rejected"],
        available_slots=available_slots,
        applications=app_responses
    )


# ===== Get My Applications (Applicant View) =====

@router.get(
    "/my-applications",
    response_model=MyApplicationsResponse
)
async def get_my_applications(
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's slot applications.

    **Query Parameters:**
    - status_filter: Optional filter by status (pending, accepted, rejected, etc.)
    - skip: Pagination offset (default 0)
    - limit: Pagination limit (default 20, max 100)
    """
    # Clamp limit
    limit = min(limit, 100)

    # Parse status filter
    app_status = None
    if status_filter:
        try:
            app_status = SlotApplicationStatus(status_filter)
        except ValueError:
            raise InvalidInputError(message=f"Invalid status filter: {status_filter}")

    # Get applications
    applications, total = await crud_slot_application.get_user_applications(
        db, current_user.id, status=app_status, skip=skip, limit=limit
    )

    # Get counts
    counts = await crud_slot_application.get_user_application_counts(db, current_user.id)

    # Build responses
    app_responses = [_build_application_response(app) for app in applications]

    return MyApplicationsResponse(
        items=app_responses,
        total=total,
        pending_count=counts["pending"],
        accepted_count=counts["accepted"],
        rejected_count=counts["rejected"]
    )


# ===== Accept an Application (Creator Action) =====

@router.post(
    "/{application_id}/accept",
    response_model=SlotApplicationResponse
)
@limiter.limit("30/minute")
async def accept_application(
    request: Request,
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept a slot application and assign a review slot to the applicant.

    **Requirements:**
    - User must be the owner of the review request
    - Application must be in 'pending' status
    - There must be an available slot to assign

    **Rate Limit:** 30 requests per minute
    """
    try:
        application = await crud_slot_application.accept_application(
            db, application_id, current_user.id
        )

        logger.info(
            f"Application {application_id} accepted, slot {application.assigned_slot_id} "
            f"assigned to user {application.applicant_id}"
        )

        # Send notification to applicant about acceptance
        await notify_slot_application_accepted(db, application.id, application.assigned_slot_id)

        return _build_application_response(application, include_applicant=True)

    except NotRequestOwnerError as e:
        raise ForbiddenError(message=str(e))
    except NoSlotsAvailableError as e:
        raise InvalidInputError(message=str(e))
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Error accepting application {application_id}: {e}")
        raise InternalError(message="An error occurred while accepting the application")


# ===== Reject an Application (Creator Action) =====

@router.post(
    "/{application_id}/reject",
    response_model=SlotApplicationResponse
)
@limiter.limit("30/minute")
async def reject_application(
    request: Request,
    application_id: int,
    rejection_data: SlotApplicationReject,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a slot application.

    **Requirements:**
    - User must be the owner of the review request
    - Application must be in 'pending' status

    **Rate Limit:** 30 requests per minute
    """
    try:
        application = await crud_slot_application.reject_application(
            db,
            application_id,
            current_user.id,
            reason=rejection_data.rejection_reason
        )

        logger.info(f"Application {application_id} rejected")

        # Send notification to applicant about rejection
        await notify_slot_application_rejected(db, application.id, rejection_data.rejection_reason)

        return _build_application_response(application, include_applicant=True)

    except NotRequestOwnerError as e:
        raise ForbiddenError(message=str(e))
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Error rejecting application {application_id}: {e}")
        raise InternalError(message="An error occurred while rejecting the application")


# ===== Withdraw an Application (Applicant Action) =====

@router.post(
    "/{application_id}/withdraw",
    response_model=SlotApplicationResponse
)
@limiter.limit("20/minute")
async def withdraw_application(
    request: Request,
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Withdraw your own slot application.

    **Requirements:**
    - User must be the applicant
    - Application must be in 'pending' status

    **Rate Limit:** 20 requests per minute
    """
    try:
        application = await crud_slot_application.withdraw_application(
            db, application_id, current_user.id
        )

        logger.info(f"Application {application_id} withdrawn by user {current_user.id}")

        # Send notification to creator about withdrawal
        await notify_slot_application_withdrawn(db, application.id, current_user.id)

        return _build_application_response(application)

    except NotApplicantError as e:
        raise ForbiddenError(message=str(e))
    except ValueError as e:
        raise InvalidInputError(message=str(e))
    except Exception as e:
        logger.error(f"Error withdrawing application {application_id}: {e}")
        raise InternalError(message="An error occurred while withdrawing the application")


# ===== Get Single Application =====

@router.get(
    "/{application_id}",
    response_model=SlotApplicationResponse
)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single application by ID.

    **Requirements:**
    - User must be either the applicant or the request owner
    """
    application = await crud_slot_application.get_application_with_request(
        db, application_id
    )

    if not application:
        raise NotFoundError(resource="Application")

    # Check access: user must be applicant or request owner
    is_applicant = application.applicant_id == current_user.id
    is_owner = application.review_request.user_id == current_user.id

    if not (is_applicant or is_owner):
        raise ForbiddenError(message="You don't have permission to view this application")

    return _build_application_response(application, include_applicant=is_owner)


# ===== Check if User Can Apply =====

@router.get(
    "/can-apply/{review_request_id}",
    response_model=dict
)
async def can_apply_to_request(
    review_request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if the current user can apply to a review request.

    Returns:
    - can_apply: bool - whether user can apply
    - reason: str - reason if cannot apply (null if can apply)
    - existing_application: dict - existing application if user already applied
    """
    from app.models.review_request import ReviewRequest, ReviewType
    from sqlalchemy import select

    # Get the review request
    query = select(ReviewRequest).where(ReviewRequest.id == review_request_id)
    result = await db.execute(query)
    review_request = result.scalar_one_or_none()

    if not review_request:
        raise NotFoundError(resource="Review request")

    # Check if it's a paid review
    if review_request.review_type != ReviewType.EXPERT:
        return {
            "can_apply": False,
            "reason": "Applications are only for paid expert reviews. Free reviews can be claimed directly.",
            "existing_application": None
        }

    # Check if user owns the request
    if review_request.user_id == current_user.id:
        return {
            "can_apply": False,
            "reason": "You cannot apply to your own review request",
            "existing_application": None
        }

    # Check for existing application
    existing = await crud_slot_application.check_existing_application(
        db, review_request_id, current_user.id
    )

    if existing:
        return {
            "can_apply": False,
            "reason": f"You already have an active application (status: {existing.status})",
            "existing_application": {
                "id": existing.id,
                "status": existing.status,
                "created_at": existing.created_at.isoformat(),
                "assigned_slot_id": existing.assigned_slot_id
            }
        }

    # Check for available slots
    available_slots = await crud_slot_application.get_available_slot_count(
        db, review_request_id
    )

    if available_slots == 0:
        return {
            "can_apply": False,
            "reason": "All slots for this review request have been filled",
            "existing_application": None
        }

    return {
        "can_apply": True,
        "reason": None,
        "existing_application": None,
        "available_slots": available_slots
    }
