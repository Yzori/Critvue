"""Admin API endpoints for expert application review committee"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.committee_member import CommitteeMember
from app.models.rejection_reason import RejectionReason
from app.services.committee_service import CommitteeService
from app.schemas.committee import (
    VoteRequest,
    ReleaseApplicationRequest,
    ApplicationQueueResponse,
    ApplicationDetailForReview,
    ApplicationReviewResponse,
    MyReviewsResponse,
    RejectionReasonResponse,
    DecisionResult,
    CommitteeStats,
    CommitteeMemberCreate,
    CommitteeMemberResponse,
    CommitteeMemberUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/applications", tags=["admin-applications"])


# ============ Dependencies ============

async def get_committee_member(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> CommitteeMember:
    """
    Dependency to verify current user is an active committee member.
    Admins are auto-enrolled as committee members if not already.
    """
    stmt = select(CommitteeMember).where(
        CommitteeMember.user_id == current_user.id,
        CommitteeMember.is_active == True
    )
    result = await db.execute(stmt)
    member = result.scalar_one_or_none()

    if not member:
        # Auto-create committee membership for admins
        if current_user.role == UserRole.ADMIN:
            member = CommitteeMember(
                user_id=current_user.id,
                is_active=True,
                role="admin"  # ADMIN role has full approval power
            )
            db.add(member)
            await db.commit()
            await db.refresh(member)
            logger.info(f"Auto-created committee membership for admin user {current_user.id}")
        else:
            raise ForbiddenError(message="You are not a committee member"
            )

    return member


async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to verify current user is an admin.
    """
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenError(message="Admin access required"
        )
    return current_user


# ============ Queue Endpoints ============

@router.get("/queue", response_model=ApplicationQueueResponse)
async def get_application_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    escalated_only: bool = Query(False),
    committee_member: CommitteeMember = Depends(get_committee_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get applications waiting for review.

    - **page**: Page number (default 1)
    - **page_size**: Items per page (default 20, max 100)
    - **escalated_only**: Only show applications waiting > 7 days
    """
    service = CommitteeService(db)
    applications, total = await service.get_application_queue(
        page=page,
        page_size=page_size,
        include_escalated_only=escalated_only
    )

    return ApplicationQueueResponse(
        applications=applications,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/stats", response_model=CommitteeStats)
async def get_committee_stats(
    committee_member: CommitteeMember = Depends(get_committee_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get committee dashboard statistics.
    """
    service = CommitteeService(db)
    return await service.get_committee_stats(committee_member)


# ============ My Reviews Endpoints ============
# NOTE: These must be defined BEFORE /{application_id} routes to avoid path conflicts

@router.get("/my/reviews", response_model=MyReviewsResponse)
async def get_my_reviews(
    committee_member: CommitteeMember = Depends(get_committee_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get your claimed and recently voted applications.
    """
    service = CommitteeService(db)
    result = await service.get_my_reviews(committee_member)

    return MyReviewsResponse(
        claimed=result["claimed"],
        voted=result["voted"],
        total_voted=result["total_voted"]
    )


# ============ Rejection Reasons Endpoints ============
# NOTE: These must be defined BEFORE /{application_id} routes to avoid path conflicts

@router.get("/rejection-reasons", response_model=list[RejectionReasonResponse])
async def get_rejection_reasons(
    committee_member: CommitteeMember = Depends(get_committee_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all active rejection reasons.
    """
    service = CommitteeService(db)
    reasons = await service.get_rejection_reasons(active_only=True)

    return [
        RejectionReasonResponse(
            id=r.id,
            code=r.code,
            label=r.label,
            description=r.description,
            applicant_message=r.applicant_message,
            display_order=r.display_order,
            is_active=r.is_active,
            created_at=r.created_at
        )
        for r in reasons
    ]


# ============ Application Detail Endpoints ============

@router.get("/{application_id}", response_model=ApplicationDetailForReview)
async def get_application_details(
    application_id: int,
    committee_member: CommitteeMember = Depends(get_committee_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get full application details for committee review.
    """
    service = CommitteeService(db)
    application = await service.get_application_for_review(application_id)

    if not application:
        raise NotFoundError(message="Application not found"
        )

    return application


# ============ Claim/Release Endpoints ============

@router.post("/{application_id}/claim", response_model=ApplicationReviewResponse)
async def claim_application(
    application_id: int,
    committee_member: CommitteeMember = Depends(get_committee_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Claim an application for review.

    Claims the application so you can review it. You can have up to
    your max_concurrent_reviews claimed at once.
    """
    service = CommitteeService(db)

    try:
        review = await service.claim_application(application_id, committee_member)
        return ApplicationReviewResponse(
            id=review.id,
            application_id=review.application_id,
            reviewer_id=review.reviewer_id,
            status=review.status,
            vote=review.vote,
            rejection_reason_id=review.rejection_reason_id,
            additional_feedback=review.additional_feedback,
            internal_notes=review.internal_notes,
            claimed_at=review.claimed_at,
            voted_at=review.voted_at,
            released_at=review.released_at
        )
    except ValueError as e:
        raise InvalidInputError(message=str(e)
        )


@router.post("/{application_id}/release")
async def release_application(
    application_id: int,
    release_request: Optional[ReleaseApplicationRequest] = None,
    committee_member: CommitteeMember = Depends(get_committee_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Release a claimed application back to the queue.

    Use this if you can't complete the review or want to let
    someone else handle it.
    """
    service = CommitteeService(db)

    try:
        reason = release_request.reason if release_request else None
        await service.release_application(application_id, committee_member, reason)
        return {"message": "Application released successfully"}
    except ValueError as e:
        raise InvalidInputError(message=str(e)
        )


# ============ Voting Endpoints ============

@router.post("/{application_id}/vote")
async def submit_vote(
    application_id: int,
    vote_request: VoteRequest,
    committee_member: CommitteeMember = Depends(get_committee_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit your vote on an application.

    - **APPROVE**: Approve the application (applicant becomes a reviewer)
    - **REJECT**: Reject the application (requires rejection_reason_id)
    - **REQUEST_CHANGES**: Ask applicant to make changes and resubmit

    For admins, a single vote is the final decision.
    For other committee members, 2/3 majority is required.
    """
    service = CommitteeService(db)

    try:
        review, decision_result = await service.submit_vote(
            application_id, committee_member, vote_request
        )

        response = {
            "review": ApplicationReviewResponse(
                id=review.id,
                application_id=review.application_id,
                reviewer_id=review.reviewer_id,
                status=review.status,
                vote=review.vote,
                rejection_reason_id=review.rejection_reason_id,
                additional_feedback=review.additional_feedback,
                internal_notes=review.internal_notes,
                claimed_at=review.claimed_at,
                voted_at=review.voted_at,
                released_at=review.released_at
            ),
            "decision": decision_result
        }

        return response

    except ValueError as e:
        raise InvalidInputError(message=str(e)
        )


# ============ Committee Management (Admin Only) ============

@router.post("/committee/members", response_model=CommitteeMemberResponse)
async def add_committee_member(
    member_data: CommitteeMemberCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a user to the review committee. (Admin only)
    """
    # Check if user exists
    user_stmt = select(User).where(User.id == member_data.user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    if not user:
        raise NotFoundError(message="User not found"
        )

    # Check if already a committee member
    existing_stmt = select(CommitteeMember).where(
        CommitteeMember.user_id == member_data.user_id
    )
    existing_result = await db.execute(existing_stmt)
    existing = existing_result.scalar_one_or_none()

    if existing:
        if existing.is_active:
            raise InvalidInputError(message="User is already a committee member"
            )
        # Reactivate
        existing.is_active = True
        existing.role = member_data.role
        existing.max_concurrent_reviews = member_data.max_concurrent_reviews
        existing.deactivated_at = None
        await db.commit()
        await db.refresh(existing)

        return CommitteeMemberResponse(
            id=existing.id,
            user_id=existing.user_id,
            role=existing.role,
            is_active=existing.is_active,
            max_concurrent_reviews=existing.max_concurrent_reviews,
            created_at=existing.created_at,
            deactivated_at=existing.deactivated_at,
            user_email=user.email,
            user_name=user.full_name
        )

    # Create new member
    member = CommitteeMember(
        user_id=member_data.user_id,
        role=member_data.role,
        max_concurrent_reviews=member_data.max_concurrent_reviews
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    logger.info(f"User {member_data.user_id} added to committee by admin {admin.id}")

    return CommitteeMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        is_active=member.is_active,
        max_concurrent_reviews=member.max_concurrent_reviews,
        created_at=member.created_at,
        deactivated_at=member.deactivated_at,
        user_email=user.email,
        user_name=user.full_name
    )


@router.patch("/committee/members/{member_id}", response_model=CommitteeMemberResponse)
async def update_committee_member(
    member_id: int,
    update_data: CommitteeMemberUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a committee member's settings. (Admin only)
    """
    stmt = select(CommitteeMember).where(CommitteeMember.id == member_id)
    result = await db.execute(stmt)
    member = result.scalar_one_or_none()

    if not member:
        raise NotFoundError(message="Committee member not found"
        )

    if update_data.role is not None:
        member.role = update_data.role
    if update_data.is_active is not None:
        member.is_active = update_data.is_active
        if not update_data.is_active:
            member.deactivated_at = __import__('datetime').datetime.utcnow()
    if update_data.max_concurrent_reviews is not None:
        member.max_concurrent_reviews = update_data.max_concurrent_reviews

    await db.commit()
    await db.refresh(member)

    # Get user info
    user_stmt = select(User).where(User.id == member.user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    return CommitteeMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        is_active=member.is_active,
        max_concurrent_reviews=member.max_concurrent_reviews,
        created_at=member.created_at,
        deactivated_at=member.deactivated_at,
        user_email=user.email if user else None,
        user_name=user.full_name if user else None
    )


@router.get("/committee/members", response_model=list[CommitteeMemberResponse])
async def list_committee_members(
    include_inactive: bool = Query(False),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    List all committee members. (Admin only)
    """
    conditions = []
    if not include_inactive:
        conditions.append(CommitteeMember.is_active == True)

    stmt = select(CommitteeMember).where(*conditions) if conditions else select(CommitteeMember)
    result = await db.execute(stmt)
    members = result.scalars().all()

    response = []
    for member in members:
        user_stmt = select(User).where(User.id == member.user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        response.append(CommitteeMemberResponse(
            id=member.id,
            user_id=member.user_id,
            role=member.role,
            is_active=member.is_active,
            max_concurrent_reviews=member.max_concurrent_reviews,
            created_at=member.created_at,
            deactivated_at=member.deactivated_at,
            user_email=user.email if user else None,
            user_name=user.full_name if user else None
        ))

    return response
