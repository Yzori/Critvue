"""
Desktop Dashboard - Overview, Activity & Search Endpoints

Endpoints for dashboard overview, activity timeline, and global search.
"""

from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, Request, Query
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.dashboard_desktop.common import (
    create_router,
    limiter,
    logger,
    get_current_user,
    get_db,
    RateLimits,
    InternalError,
    InvalidInputError,
    User,
    ReviewSlot,
    ReviewSlotStatus,
    ReviewRequest,
    ReviewStatus,
)

router = create_router("overview")


@router.get("/desktop/overview")
@limiter.limit(RateLimits.DASHBOARD_READ)
async def get_desktop_overview(
    request: Request,
    role: str = Query(..., description="Role: creator or reviewer"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Comprehensive overview data for desktop dashboard.

    **Returns**:
    - Quick stats summary
    - Recent activity
    - Urgent actions
    - Performance metrics
    - Trend data

    **Rate Limit**: 100 requests per minute
    """
    try:
        if role not in ["creator", "reviewer"]:
            raise InvalidInputError(message="Role must be 'creator' or 'reviewer'")

        now = datetime.utcnow()

        if role == "creator":
            overview = await _get_creator_overview(db, current_user, now)
        else:
            overview = await _get_reviewer_overview(db, current_user, now)

        return overview

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting desktop overview for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load overview")


async def _get_creator_overview(db: AsyncSession, current_user: User, now: datetime) -> dict:
    """Build creator overview data."""
    # Pending approvals count
    pending_query = (
        select(func.count(ReviewSlot.id))
        .join(ReviewRequest)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value
            )
        )
    )
    pending_result = await db.execute(pending_query)
    pending_count = pending_result.scalar() or 0

    # Active requests count
    active_query = (
        select(func.count(ReviewRequest.id))
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewRequest.status.in_([
                    ReviewStatus.PENDING.value,
                    ReviewStatus.IN_REVIEW.value
                ])
            )
        )
    )
    active_result = await db.execute(active_query)
    active_requests = active_result.scalar() or 0

    # Critical items (< 24 hours to auto-accept)
    critical_deadline = now + timedelta(hours=24)
    critical_query = (
        select(func.count(ReviewSlot.id))
        .join(ReviewRequest)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value,
                ReviewSlot.auto_accept_at < critical_deadline
            )
        )
    )
    critical_result = await db.execute(critical_query)
    critical_items = critical_result.scalar() or 0

    # This week's reviews received
    week_start = now - timedelta(days=7)
    week_query = (
        select(func.count(ReviewSlot.id))
        .join(ReviewRequest)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.submitted_at >= week_start,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.SUBMITTED.value,
                    ReviewSlotStatus.ACCEPTED.value
                ])
            )
        )
    )
    week_result = await db.execute(week_query)
    week_reviews = week_result.scalar() or 0

    overview = {
        "role": "creator",
        "quick_stats": {
            "pending_approvals": pending_count,
            "active_requests": active_requests,
            "critical_items": critical_items,
            "week_reviews_received": week_reviews
        },
        "alerts": [],
        "trends": {
            "reviews_this_week": week_reviews,
            "avg_response_time_hours": None
        }
    }

    if critical_items > 0:
        overview["alerts"].append({
            "type": "critical",
            "message": f"{critical_items} review(s) will auto-accept within 24 hours",
            "action": "Review and approve/reject now",
            "link": "/dashboard/actions-needed"
        })

    return overview


async def _get_reviewer_overview(db: AsyncSession, current_user: User, now: datetime) -> dict:
    """Build reviewer overview data."""
    # Active claims
    active_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.CLAIMED.value
            )
        )
    )
    active_result = await db.execute(active_query)
    active_claims = active_result.scalar() or 0

    # Submitted reviews
    submitted_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value
            )
        )
    )
    submitted_result = await db.execute(submitted_query)
    submitted_count = submitted_result.scalar() or 0

    # Critical deadlines
    critical_deadline = now + timedelta(hours=24)
    critical_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.CLAIMED.value,
                ReviewSlot.claim_deadline < critical_deadline
            )
        )
    )
    critical_result = await db.execute(critical_query)
    critical_items = critical_result.scalar() or 0

    # Potential earnings
    earnings_query = (
        select(func.sum(ReviewSlot.payment_amount))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.CLAIMED.value,
                    ReviewSlotStatus.SUBMITTED.value
                ])
            )
        )
    )
    earnings_result = await db.execute(earnings_query)
    potential_earnings = earnings_result.scalar() or 0

    # Week stats
    week_start = now - timedelta(days=7)
    week_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewSlot.reviewed_at >= week_start
            )
        )
    )
    week_result = await db.execute(week_query)
    week_reviews = week_result.scalar() or 0

    overview = {
        "role": "reviewer",
        "quick_stats": {
            "active_claims": active_claims,
            "submitted_reviews": submitted_count,
            "critical_deadlines": critical_items,
            "potential_earnings": float(potential_earnings),
            "week_reviews_completed": week_reviews
        },
        "alerts": [],
        "trends": {
            "reviews_this_week": week_reviews,
            "avg_turnaround_hours": None
        }
    }

    if critical_items > 0:
        overview["alerts"].append({
            "type": "critical",
            "message": f"{critical_items} review(s) must be submitted within 24 hours",
            "action": "Complete reviews now",
            "link": "/dashboard/active"
        })

    return overview


@router.get("/desktop/activity-timeline")
@limiter.limit(RateLimits.DASHBOARD_READ)
async def get_activity_timeline(
    request: Request,
    role: str = Query(..., description="Role: creator or reviewer"),
    limit: int = Query(50, ge=1, le=100, description="Number of activity items"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent activity timeline for desktop dashboard.

    **Returns**:
    - Recent review submissions
    - Review acceptances/rejections
    - Claims and abandonments
    - Status changes

    **Rate Limit**: 100 requests per minute
    """
    try:
        if role not in ["creator", "reviewer"]:
            raise InvalidInputError(message="Role must be 'creator' or 'reviewer'")

        activities = []

        if role == "creator":
            activities = await _get_creator_activities(db, current_user, limit)
        else:
            activities = await _get_reviewer_activities(db, current_user, limit)

        return {
            "activities": activities,
            "total": len(activities),
            "role": role
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting activity timeline for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load activity timeline")


async def _get_creator_activities(db: AsyncSession, current_user: User, limit: int) -> list:
    """Get activity items for creator."""
    query = (
        select(ReviewSlot)
        .join(ReviewRequest)
        .where(ReviewRequest.user_id == current_user.id)
        .options(
            selectinload(ReviewSlot.reviewer),
            selectinload(ReviewSlot.review_request)
        )
        .order_by(ReviewSlot.updated_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    slots = list(result.scalars().all())

    activities = []
    for slot in slots:
        activity_type, activity_time = _determine_activity_type(slot)

        activities.append({
            "type": activity_type,
            "timestamp": activity_time.isoformat() if activity_time else None,
            "slot_id": slot.id,
            "review_request": {
                "id": slot.review_request.id,
                "title": slot.review_request.title
            } if slot.review_request else None,
            "reviewer": {
                "id": slot.reviewer.id,
                "name": slot.reviewer.full_name or slot.reviewer.email.split('@')[0],
                "avatar_url": slot.reviewer.avatar_url
            } if slot.reviewer else None,
            "details": {
                "status": slot.status,
                "rating": slot.rating
            }
        })

    return activities


async def _get_reviewer_activities(db: AsyncSession, current_user: User, limit: int) -> list:
    """Get activity items for reviewer."""
    query = (
        select(ReviewSlot)
        .where(ReviewSlot.reviewer_id == current_user.id)
        .options(selectinload(ReviewSlot.review_request))
        .order_by(ReviewSlot.updated_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    slots = list(result.scalars().all())

    activities = []
    for slot in slots:
        activity_type, activity_time = _determine_activity_type(slot)

        activities.append({
            "type": activity_type,
            "timestamp": activity_time.isoformat() if activity_time else None,
            "slot_id": slot.id,
            "review_request": {
                "id": slot.review_request.id,
                "title": slot.review_request.title,
                "content_type": slot.review_request.content_type.value
            } if slot.review_request else None,
            "details": {
                "status": slot.status,
                "payment_amount": float(slot.payment_amount) if slot.payment_amount else 0
            }
        })

    return activities


def _determine_activity_type(slot: ReviewSlot) -> tuple:
    """Determine activity type and time from slot status."""
    activity_type = "unknown"
    activity_time = slot.updated_at

    if slot.status == ReviewSlotStatus.SUBMITTED.value and slot.submitted_at:
        activity_type = "review_submitted"
        activity_time = slot.submitted_at
    elif slot.status == ReviewSlotStatus.ACCEPTED.value and slot.reviewed_at:
        activity_type = "review_accepted"
        activity_time = slot.reviewed_at
    elif slot.status == ReviewSlotStatus.REJECTED.value:
        activity_type = "review_rejected"
    elif slot.status == ReviewSlotStatus.CLAIMED.value and slot.claimed_at:
        activity_type = "slot_claimed"
        activity_time = slot.claimed_at

    return activity_type, activity_time


@router.get("/desktop/search")
@limiter.limit(RateLimits.DASHBOARD_READ)
async def global_dashboard_search(
    request: Request,
    q: str = Query(..., min_length=2, description="Search query"),
    role: str = Query(..., description="Role: creator or reviewer"),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Global search across dashboard data.

    **Searches**:
    - Review request titles and descriptions
    - Review text content
    - Reviewer names
    - Status and metadata

    **Rate Limit**: 100 requests per minute
    """
    try:
        if role not in ["creator", "reviewer"]:
            raise InvalidInputError(message="Role must be 'creator' or 'reviewer'")

        search_pattern = f"%{q}%"
        results = {
            "query": q,
            "role": role,
            "review_requests": [],
            "review_slots": []
        }

        if role == "creator":
            results = await _search_creator_data(db, current_user, search_pattern, q, limit)
        else:
            results = await _search_reviewer_data(db, current_user, search_pattern, q, limit)

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in dashboard search for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to perform search")


async def _search_creator_data(db: AsyncSession, current_user: User, search_pattern: str, query: str, limit: int) -> dict:
    """Search creator's review requests and slots."""
    # Search review requests
    request_query = (
        select(ReviewRequest)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                or_(
                    ReviewRequest.title.ilike(search_pattern),
                    ReviewRequest.description.ilike(search_pattern)
                )
            )
        )
        .limit(limit)
    )
    request_result = await db.execute(request_query)
    requests = list(request_result.scalars().all())

    # Search review slots
    slot_query = (
        select(ReviewSlot)
        .join(ReviewRequest)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.review_text.ilike(search_pattern)
            )
        )
        .options(selectinload(ReviewSlot.review_request))
        .limit(limit)
    )
    slot_result = await db.execute(slot_query)
    slots = list(slot_result.scalars().all())

    return {
        "query": query,
        "role": "creator",
        "review_requests": [
            {
                "id": req.id,
                "title": req.title,
                "status": req.status.value,
                "content_type": req.content_type.value,
                "created_at": req.created_at.isoformat()
            }
            for req in requests
        ],
        "review_slots": [
            {
                "slot_id": slot.id,
                "status": slot.status,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title
                } if slot.review_request else None,
                "review_preview": slot.review_text[:200] if slot.review_text else None
            }
            for slot in slots
        ]
    }


async def _search_reviewer_data(db: AsyncSession, current_user: User, search_pattern: str, query: str, limit: int) -> dict:
    """Search reviewer's slots."""
    slot_query = (
        select(ReviewSlot)
        .join(ReviewRequest)
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                or_(
                    ReviewRequest.title.ilike(search_pattern),
                    ReviewRequest.description.ilike(search_pattern),
                    ReviewSlot.review_text.ilike(search_pattern)
                )
            )
        )
        .options(selectinload(ReviewSlot.review_request))
        .limit(limit)
    )
    slot_result = await db.execute(slot_query)
    slots = list(slot_result.scalars().all())

    return {
        "query": query,
        "role": "reviewer",
        "review_requests": [],
        "review_slots": [
            {
                "slot_id": slot.id,
                "status": slot.status,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "content_type": slot.review_request.content_type.value
                } if slot.review_request else None,
                "payment_amount": float(slot.payment_amount) if slot.payment_amount else 0
            }
            for slot in slots
        ]
    }
