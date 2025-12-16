"""
Mobile-First Dashboard API Endpoints

Optimized endpoints for mobile dashboard with:
- Minimal payloads
- Urgency-based sorting
- Batch operations
- Real-time support via ETags
- Efficient queries (no N+1)
"""

import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select, and_, or_, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, get_db
from app.constants import RateLimits, PaginationDefaults
from app.core.exceptions import InternalError, InvalidInputError
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, PaymentStatus
from app.models.review_request import ReviewRequest, ReviewStatus
from app.schemas.review_slot import ReviewAccept
from app.services.gamification.review_sparks_hooks import on_review_accepted
from app.services.notifications.triggers import notify_review_accepted
from app.utils import calculate_urgency, generate_etag, get_display_name

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
limiter = Limiter(key_func=get_remote_address)


# ===== Creator Dashboard Endpoints =====

@router.get("/creator/actions-needed")
@limiter.limit(RateLimits.DASHBOARD_READ)
async def get_creator_actions_needed(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(PaginationDefaults.MOBILE_PAGE_SIZE, ge=1, le=PaginationDefaults.MOBILE_MAX_PAGE_SIZE, description="Items per page"),
    fields: Optional[str] = Query(None, description="Comma-separated field list"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get pending reviews awaiting creator approval, sorted by urgency.

    Optimized for mobile with:
    - Minimal payload
    - Single query with JOIN
    - Urgency-based sorting (most urgent first)
    - Field selection support
    - ETag caching

    **Rate Limit**: 100 requests per minute
    """
    try:
        # Calculate pagination
        skip = (page - 1) * limit

        # Build query for submitted slots on user's review requests
        query = (
            select(ReviewSlot)
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewRequest.user_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value
                )
            )
            .options(
                selectinload(ReviewSlot.reviewer),  # Eager load reviewer
                selectinload(ReviewSlot.review_request)  # Eager load request
            )
            .order_by(ReviewSlot.auto_accept_at.asc())  # Most urgent first
            .offset(skip)
            .limit(limit)
        )

        # Get total count
        count_query = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewRequest.user_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value
                )
            )
        )

        # Execute queries
        result = await db.execute(query)
        slots = list(result.scalars().all())

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Format response items
        items = []
        urgency_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

        for slot in slots:
            urgency_level, urgency_seconds, countdown_text = calculate_urgency(slot.auto_accept_at)

            # Count urgency levels
            if urgency_level in urgency_counts:
                urgency_counts[urgency_level] += 1

            # Build item
            item = {
                "slot_id": slot.id,
                "review_request_id": slot.review_request_id,
                "review_request_title": slot.review_request.title if slot.review_request else None,
                "reviewer": {
                    "id": slot.reviewer.id,
                    "name": get_display_name(slot.reviewer),
                    "avatar_url": slot.reviewer.avatar_url,
                    "tier": slot.reviewer.user_tier.value if slot.reviewer.user_tier else "novice",
                    "avg_rating": float(slot.reviewer.avg_rating) if slot.reviewer.avg_rating else None,
                } if slot.reviewer else None,
                "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                "auto_accept_at": slot.auto_accept_at.isoformat() if slot.auto_accept_at else None,
                "urgency_level": urgency_level,
                "urgency_seconds": urgency_seconds,
                "countdown_text": countdown_text,
                "rating": slot.rating,
                "review_preview": slot.review_text[:100] + "..." if slot.review_text and len(slot.review_text) > 100 else slot.review_text,
                "can_batch_accept": True
            }

            items.append(item)

        # Build response
        response_data = {
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "has_more": (skip + len(slots)) < total
            },
            "summary": {
                "critical_count": urgency_counts["CRITICAL"],
                "high_count": urgency_counts["HIGH"],
                "medium_count": urgency_counts["MEDIUM"],
                "total_pending": total
            }
        }

        # Generate ETag
        etag = generate_etag(response_data)

        # Check If-None-Match header
        if_none_match = request.headers.get("if-none-match")
        if if_none_match == etag:
            return Response(status_code=status.HTTP_304_NOT_MODIFIED)

        # Return with ETag header
        return JSONResponse(
            content=response_data,
            headers={
                "ETag": etag,
                "Cache-Control": "private, max-age=60"
            }
        )

    except Exception as e:
        logger.error(f"Error getting actions needed for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load pending reviews"
        )


@router.get("/creator/my-requests")
@limiter.limit(RateLimits.DASHBOARD_READ)
async def get_creator_my_requests(
    request: Request,
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(PaginationDefaults.MOBILE_PAGE_SIZE, ge=1, le=PaginationDefaults.MOBILE_MAX_PAGE_SIZE),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all creator's review requests with progress overview.

    Shows:
    - Request metadata
    - Slot progress (requested/claimed/submitted/accepted)
    - Urgent actions count
    - Critical flag

    **Rate Limit**: 100 requests per minute
    """
    try:
        skip = (page - 1) * limit

        # Build base query
        query = (
            select(ReviewRequest)
            .where(ReviewRequest.user_id == current_user.id)
            .options(selectinload(ReviewRequest.slots))
        )

        # Apply status filter
        if status_filter:
            try:
                status_enum = ReviewStatus(status_filter)
                query = query.where(ReviewRequest.status == status_enum)
            except ValueError:
                raise InvalidInputError(message=f"Invalid status: {status_filter}"
                )

        # Order by most recent first
        query = query.order_by(ReviewRequest.created_at.desc())

        # Get total count
        count_query = select(func.count(ReviewRequest.id)).where(
            ReviewRequest.user_id == current_user.id
        )
        if status_filter:
            count_query = count_query.where(ReviewRequest.status == status_enum)

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        requests = list(result.scalars().all())

        # Format response
        items = []
        for req in requests:
            # Calculate slot statistics
            slot_statuses = {
                "available": 0,
                "claimed": 0,
                "submitted": 0,
                "accepted": 0,
                "rejected": 0
            }

            urgent_actions = 0
            has_critical = False

            for slot in req.slots:
                # Count statuses
                if slot.status in slot_statuses:
                    slot_statuses[slot.status] += 1

                # Check for urgent submissions
                if slot.status == ReviewSlotStatus.SUBMITTED.value:
                    urgency_level, _, _ = calculate_urgency(slot.auto_accept_at)
                    if urgency_level == "CRITICAL":
                        has_critical = True
                        urgent_actions += 1
                    elif urgency_level in ["HIGH", "MEDIUM"]:
                        urgent_actions += 1

            # Calculate progress
            submitted_count = slot_statuses["submitted"]
            accepted_count = slot_statuses["accepted"]
            completed = submitted_count + accepted_count
            percentage = (completed / req.reviews_requested * 100) if req.reviews_requested > 0 else 0

            items.append({
                "id": req.id,
                "title": req.title,
                "status": req.status.value,
                "content_type": req.content_type.value,
                "created_at": req.created_at.isoformat(),
                "progress": {
                    "requested": req.reviews_requested,
                    "claimed": req.reviews_claimed,
                    "submitted": submitted_count,
                    "accepted": accepted_count,
                    "percentage": round(percentage, 1)
                },
                "slot_statuses": slot_statuses,
                "urgent_actions": urgent_actions,
                "has_critical": has_critical
            })

        return {
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "has_more": (skip + len(requests)) < total
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting requests for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load review requests"
        )


# ===== Reviewer Dashboard Endpoints =====

@router.get("/reviewer/active")
@limiter.limit(RateLimits.DASHBOARD_READ)
async def get_reviewer_active(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(PaginationDefaults.MOBILE_PAGE_SIZE, ge=1, le=PaginationDefaults.MOBILE_MAX_PAGE_SIZE),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get active reviews (claimed, not yet submitted) with draft progress.

    Shows:
    - Claim deadline urgency
    - Draft progress
    - Earnings potential

    **Rate Limit**: 100 requests per minute
    """
    try:
        skip = (page - 1) * limit

        # Query active claims
        query = (
            select(ReviewSlot)
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.CLAIMED.value
                )
            )
            .options(selectinload(ReviewSlot.review_request))
            .order_by(ReviewSlot.claim_deadline.asc())  # Most urgent first
            .offset(skip)
            .limit(limit)
        )

        # Get total count
        count_query = (
            select(func.count(ReviewSlot.id))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.CLAIMED.value
                )
            )
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Format response
        items = []
        total_potential_earnings = 0
        critical_count = 0

        for slot in slots:
            urgency_level, urgency_seconds, countdown_text = calculate_urgency(slot.claim_deadline)

            if urgency_level == "CRITICAL":
                critical_count += 1

            # Calculate draft progress
            draft_progress = {
                "has_draft": bool(slot.draft_sections),
                "last_saved_at": slot.updated_at.isoformat() if slot.updated_at else None
            }

            # If there's a draft, try to calculate progress
            if slot.draft_sections:
                try:
                    draft_data = json.loads(slot.draft_sections) if isinstance(slot.draft_sections, str) else slot.draft_sections
                    # For Smart Review format
                    if isinstance(draft_data, dict):
                        completed = sum([
                            1 if draft_data.get("phase1_quick_assessment") else 0,
                            1 if draft_data.get("phase2_rubric") else 0,
                            1 if draft_data.get("phase3_detailed_feedback") else 0
                        ])
                        draft_progress.update({
                            "sections_completed": completed,
                            "sections_total": 3,
                            "percentage": round(completed / 3 * 100, 1)
                        })
                except (json.JSONDecodeError, TypeError, KeyError, AttributeError):
                    # Draft data is malformed or invalid - continue with empty progress
                    pass

            # Calculate earnings potential
            earnings_potential = float(slot.payment_amount) if slot.payment_amount else 0
            total_potential_earnings += earnings_potential

            items.append({
                "slot_id": slot.id,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "content_type": slot.review_request.content_type.value,
                    "description_preview": slot.review_request.description[:100] + "..." if len(slot.review_request.description) > 100 else slot.review_request.description
                } if slot.review_request else None,
                "claimed_at": slot.claimed_at.isoformat() if slot.claimed_at else None,
                "claim_deadline": slot.claim_deadline.isoformat() if slot.claim_deadline else None,
                "urgency_level": urgency_level,
                "urgency_seconds": urgency_seconds,
                "countdown_text": countdown_text,
                "draft_progress": draft_progress,
                "earnings_potential": earnings_potential,
                "payment_status": slot.payment_status
            })

        return {
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "has_more": (skip + len(slots)) < total
            },
            "summary": {
                "active_count": total,
                "potential_earnings": round(total_potential_earnings, 2),
                "critical_count": critical_count
            }
        }

    except Exception as e:
        logger.error(f"Error getting active reviews for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load active reviews"
        )


@router.get("/reviewer/submitted")
@limiter.limit(RateLimits.DASHBOARD_READ)
async def get_reviewer_submitted(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(PaginationDefaults.MOBILE_PAGE_SIZE, ge=1, le=PaginationDefaults.MOBILE_MAX_PAGE_SIZE),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get submitted reviews awaiting acceptance.

    Shows:
    - Auto-accept countdown
    - Potential karma and bonuses
    - Payment information

    **Rate Limit**: 100 requests per minute
    """
    try:
        skip = (page - 1) * limit

        # Query submitted reviews
        query = (
            select(ReviewSlot)
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value
                )
            )
            .options(selectinload(ReviewSlot.review_request))
            .order_by(ReviewSlot.auto_accept_at.asc())  # Most urgent first
            .offset(skip)
            .limit(limit)
        )

        # Get total count
        count_query = (
            select(func.count(ReviewSlot.id))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value
                )
            )
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Format response
        items = []
        total_potential_earnings = 0

        for slot in slots:
            urgency_level, urgency_seconds, countdown_text = calculate_urgency(slot.auto_accept_at)

            # Calculate potential sparks (base + bonus)
            potential_sparks = 50  # Base sparks for accepted review
            potential_bonus = 10 if slot.rating and slot.rating >= 4 else 0

            payment_amount = float(slot.payment_amount) if slot.payment_amount else 0
            total_potential_earnings += payment_amount

            items.append({
                "slot_id": slot.id,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "content_type": slot.review_request.content_type.value
                } if slot.review_request else None,
                "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                "auto_accept_at": slot.auto_accept_at.isoformat() if slot.auto_accept_at else None,
                "urgency_level": urgency_level,
                "urgency_seconds": urgency_seconds,
                "countdown_text": countdown_text,
                "rating": slot.rating,
                "potential_sparks": potential_sparks,
                "potential_bonus": potential_bonus,
                "payment_amount": payment_amount,
                "status": slot.status
            })

        # Calculate average days to auto-accept
        avg_auto_accept_days = 0
        if slots:
            total_days = sum([
                (slot.auto_accept_at - datetime.utcnow()).days
                for slot in slots if slot.auto_accept_at
            ])
            avg_auto_accept_days = round(total_days / len(slots), 1)

        return {
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "has_more": (skip + len(slots)) < total
            },
            "summary": {
                "submitted_count": total,
                "total_potential_earnings": round(total_potential_earnings, 2),
                "avg_auto_accept_days": avg_auto_accept_days
            }
        }

    except Exception as e:
        logger.error(f"Error getting submitted reviews for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load submitted reviews"
        )


# ===== Dashboard Stats =====

@router.get("/stats")
@limiter.limit(RateLimits.DASHBOARD_WRITE)
async def get_dashboard_stats(
    request: Request,
    role: str = Query(..., description="Role: creator or reviewer"),
    period: str = Query("week", description="Period: week, month, all_time"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get weekly/monthly stats for current user's active role.

    **Query Parameters**:
    - role: creator or reviewer
    - period: week, month, all_time

    **Rate Limit**: 30 requests per minute
    """
    try:
        # Validate role
        if role not in ["creator", "reviewer"]:
            raise InvalidInputError(message="Role must be 'creator' or 'reviewer'"
            )

        # Calculate period boundaries
        now = datetime.utcnow()
        if period == "week":
            period_start = now - timedelta(days=7)
        elif period == "month":
            period_start = now - timedelta(days=30)
        elif period == "all_time":
            period_start = datetime(2000, 1, 1)  # Far past
        else:
            raise InvalidInputError(message="Period must be 'week', 'month', or 'all_time'"
            )

        period_end = now

        if role == "creator":
            # Creator stats: reviews received
            stats_query = (
                select(
                    func.count(ReviewSlot.id).label("total_reviews"),
                    func.sum(case((ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value, 1), else_=0)).label("accepted"),
                    func.sum(case((ReviewSlot.status == ReviewSlotStatus.REJECTED.value, 1), else_=0)).label("rejected"),
                    func.avg(ReviewSlot.rating).label("avg_rating")
                )
                .join(ReviewRequest)
                .where(
                    and_(
                        ReviewRequest.user_id == current_user.id,
                        ReviewSlot.submitted_at.between(period_start, period_end)
                    )
                )
            )

            result = await db.execute(stats_query)
            row = result.first()

            # Calculate total spent on expert reviews (escrowed + released payments)
            spending_query = (
                select(func.sum(ReviewSlot.payment_amount))
                .join(ReviewRequest)
                .where(
                    and_(
                        ReviewRequest.user_id == current_user.id,
                        ReviewSlot.payment_status.in_([
                            PaymentStatus.ESCROWED.value,
                            PaymentStatus.RELEASED.value
                        ]),
                        ReviewSlot.claimed_at.between(period_start, period_end)
                    )
                )
            )
            spending_result = await db.execute(spending_query)
            total_spent = spending_result.scalar() or 0

            stats = {
                "reviews_received": row.total_reviews or 0,
                "reviews_accepted": row.accepted or 0,
                "reviews_rejected": row.rejected or 0,
                "avg_rating": round(float(row.avg_rating), 1) if row.avg_rating else None,
                "avg_response_time_hours": None,  # TODO: Calculate from acceptance timestamps
                "total_spent": float(total_spent),
                "sparks_change": 0  # TODO: Calculate from sparks transactions
            }

        else:  # reviewer
            # Reviewer stats: reviews given
            stats_query = (
                select(
                    func.count(ReviewSlot.id).label("total_reviews"),
                    func.sum(case((ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value, 1), else_=0)).label("accepted"),
                    func.sum(case((ReviewSlot.status == ReviewSlotStatus.REJECTED.value, 1), else_=0)).label("rejected"),
                    func.avg(ReviewSlot.requester_helpful_rating).label("avg_rating")
                )
                .where(
                    and_(
                        ReviewSlot.reviewer_id == current_user.id,
                        ReviewSlot.submitted_at.between(period_start, period_end)
                    )
                )
            )

            result = await db.execute(stats_query)
            row = result.first()

            # Calculate actual earnings from released payments (net amount after platform fee)
            earnings_query = (
                select(func.sum(ReviewSlot.net_amount_to_reviewer))
                .where(
                    and_(
                        ReviewSlot.reviewer_id == current_user.id,
                        ReviewSlot.payment_status == PaymentStatus.RELEASED.value,
                        ReviewSlot.accepted_at.between(period_start, period_end)
                    )
                )
            )
            earnings_result = await db.execute(earnings_query)
            total_earned = earnings_result.scalar() or 0

            acceptance_rate = 0
            if row.total_reviews and row.total_reviews > 0:
                acceptance_rate = (row.accepted or 0) / row.total_reviews

            stats = {
                "reviews_given": row.total_reviews or 0,
                "reviews_accepted": row.accepted or 0,
                "reviews_rejected": row.rejected or 0,
                "acceptance_rate": round(acceptance_rate, 3),
                "avg_rating": round(float(row.avg_rating), 1) if row.avg_rating else None,
                "total_earned": float(total_earned),
                "sparks_change": 0  # TODO: Calculate from sparks transactions
            }

        return {
            "period": period,
            "role": role,
            "stats": stats,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stats for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load statistics"
        )


# ===== Batch Operations =====

@router.post("/batch-accept")
@limiter.limit(RateLimits.DASHBOARD_BATCH)
async def batch_accept_reviews(
    request: Request,
    slot_ids: List[int] = Query(..., description="List of slot IDs to accept"),
    helpful_rating: Optional[int] = Query(None, ge=1, le=5, description="Rating for all reviews"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept multiple reviews at once.

    **Request Body**:
    - slot_ids: List of slot IDs (max 50)
    - helpful_rating: Optional rating to apply to all (1-5)

    **Rate Limit**: 10 requests per minute

    Returns summary of successful and failed acceptances.
    """
    try:
        # Validate batch size
        if len(slot_ids) > 50:
            raise InvalidInputError(message="Maximum 50 reviews can be batch accepted at once"
            )

        if not slot_ids:
            raise InvalidInputError(message="slot_ids cannot be empty"
            )

        # Get all slots
        query = (
            select(ReviewSlot)
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewSlot.id.in_(slot_ids),
                    ReviewRequest.user_id == current_user.id  # Security: only creator's reviews
                )
            )
            .options(selectinload(ReviewSlot.review_request))
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Track results
        accepted = []
        failed = []
        total_sparks_awarded = 0

        # Process each slot
        for slot in slots:
            try:
                # Check if already accepted
                if slot.status != ReviewSlotStatus.SUBMITTED.value:
                    failed.append({
                        "slot_id": slot.id,
                        "error": f"Review is {slot.status}, not submitted",
                        "code": "INVALID_STATUS"
                    })
                    continue

                # Accept the review
                from app.crud import review_slot as crud_review_slot
                accepted_slot = await crud_review_slot.accept_review(
                    db,
                    slot.id,
                    current_user.id,
                    helpful_rating
                )

                # Award sparks
                await on_review_accepted(
                    db,
                    accepted_slot.id,
                    accepted_slot.reviewer_id,
                    helpful_rating=helpful_rating
                )

                # Calculate sparks awarded
                sparks_awarded = 50  # Base sparks
                if helpful_rating and helpful_rating >= 4:
                    sparks_awarded += 10
                total_sparks_awarded += sparks_awarded

                # Send notification
                await notify_review_accepted(
                    db,
                    accepted_slot.id,
                    accepted_slot.reviewer_id,
                    helpful_rating or 0,
                    sparks_awarded,
                    sparks_awarded  # Simplified
                )

                accepted.append({
                    "slot_id": accepted_slot.id,
                    "status": "accepted",
                    "reviewer_id": accepted_slot.reviewer_id,
                    "sparks_awarded": sparks_awarded
                })

            except Exception as e:
                logger.error(f"Error accepting slot {slot.id}: {e}")
                failed.append({
                    "slot_id": slot.id,
                    "error": str(e),
                    "code": "ACCEPTANCE_FAILED"
                })

        # Commit all changes
        await db.commit()

        return {
            "accepted": accepted,
            "failed": failed,
            "summary": {
                "total_requested": len(slot_ids),
                "successful": len(accepted),
                "failed": len(failed),
                "total_sparks_awarded": total_sparks_awarded
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch accept for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to batch accept reviews"
        )
