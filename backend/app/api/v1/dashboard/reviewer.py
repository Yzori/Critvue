"""
Desktop Dashboard - Reviewer Endpoints

Endpoints for reviewers to manage their active, submitted, and completed reviews.
"""

from typing import Optional, List
from fastapi import Depends, HTTPException, Request, Query
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .common import (
    create_router,
    limiter,
    logger,
    get_current_user,
    get_db,
    RateLimits,
    PaginationDefaults,
    InternalError,
    User,
    ReviewSlot,
    ReviewSlotStatus,
    ReviewRequest,
    calculate_urgency,
    apply_sorting,
    build_pagination_response,
    format_review_request_info,
    calculate_draft_progress,
)

router = create_router("reviewer")


@router.get("/desktop/reviewer/active")
@limiter.limit(RateLimits.DASHBOARD_DESKTOP_READ)
async def get_desktop_reviewer_active(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(PaginationDefaults.DESKTOP_PAGE_SIZE, ge=1, le=PaginationDefaults.DESKTOP_MAX_PAGE_SIZE),
    sort_by: str = Query("claim_deadline", description="Sort by: claim_deadline, claimed_at, payment_amount"),
    sort_order: str = Query("asc", description="Sort order: asc, desc"),
    urgency_filter: Optional[List[str]] = Query(None, description="Filter by urgency"),
    content_type_filter: Optional[List[str]] = Query(None, description="Filter by content type"),
    has_draft: Optional[bool] = Query(None, description="Filter by draft status"),
    min_payment: Optional[float] = Query(None, description="Minimum payment amount"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Desktop-optimized endpoint for active reviews (claimed, not yet submitted).

    **Features**:
    - Advanced filtering (urgency, content type, draft status, payment)
    - Multiple sort options
    - Full review request details
    - Draft progress tracking

    **Rate Limit**: 200 requests per minute
    """
    try:
        skip = (page - 1) * page_size

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
        )

        # Apply content type filter
        if content_type_filter:
            query = query.join(ReviewRequest).where(
                ReviewRequest.content_type.in_(content_type_filter)
            )

        # Apply payment filter
        if min_payment is not None:
            query = query.where(ReviewSlot.payment_amount >= min_payment)

        # Apply draft filter
        if has_draft is not None:
            if has_draft:
                query = query.where(ReviewSlot.draft_sections.isnot(None))
            else:
                query = query.where(ReviewSlot.draft_sections.is_(None))

        # Apply sorting
        query = apply_sorting(query, sort_by, sort_order, ReviewSlot)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        query = query.offset(skip).limit(page_size)
        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Format response
        items = []
        total_potential_earnings = 0
        critical_count = 0

        for slot in slots:
            urgency_level, urgency_seconds, countdown_text = calculate_urgency(slot.claim_deadline)

            # Apply urgency filter
            if urgency_filter and urgency_level not in urgency_filter:
                continue

            if urgency_level == "CRITICAL":
                critical_count += 1

            # Calculate earnings potential
            earnings_potential = float(slot.payment_amount) if slot.payment_amount else 0
            total_potential_earnings += earnings_potential

            items.append({
                "slot_id": slot.id,
                "review_request": format_review_request_info(slot.review_request, include_description=True),
                "claimed_at": slot.claimed_at.isoformat() if slot.claimed_at else None,
                "claim_deadline": slot.claim_deadline.isoformat() if slot.claim_deadline else None,
                "urgency_level": urgency_level,
                "urgency_seconds": urgency_seconds,
                "countdown_text": countdown_text,
                "draft_progress": calculate_draft_progress(slot),
                "earnings_potential": earnings_potential,
                "payment_status": slot.payment_status
            })

        return {
            "items": items,
            "pagination": build_pagination_response(total, page, page_size, len(slots), skip),
            "summary": {
                "active_count": total,
                "potential_earnings": round(total_potential_earnings, 2),
                "critical_count": critical_count
            },
            "filters_applied": {
                "sort_by": sort_by,
                "sort_order": sort_order,
                "urgency_filter": urgency_filter,
                "content_type_filter": content_type_filter,
                "has_draft": has_draft,
                "min_payment": min_payment
            }
        }

    except Exception as e:
        logger.error(f"Error getting desktop active reviews for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load active reviews")


@router.get("/desktop/reviewer/submitted")
@limiter.limit(RateLimits.DASHBOARD_DESKTOP_READ)
async def get_desktop_reviewer_submitted(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(PaginationDefaults.DESKTOP_PAGE_SIZE, ge=1, le=PaginationDefaults.DESKTOP_MAX_PAGE_SIZE),
    sort_by: str = Query("auto_accept_at", description="Sort by: auto_accept_at, submitted_at, payment_amount, rating"),
    sort_order: str = Query("asc", description="Sort order: asc, desc"),
    urgency_filter: Optional[List[str]] = Query(None),
    rating_min: Optional[int] = Query(None, ge=1, le=5),
    min_payment: Optional[float] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Desktop-optimized endpoint for submitted reviews awaiting acceptance.

    **Rate Limit**: 200 requests per minute
    """
    try:
        skip = (page - 1) * page_size

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
        )

        # Apply filters
        if rating_min is not None:
            query = query.where(ReviewSlot.rating >= rating_min)

        if min_payment is not None:
            query = query.where(ReviewSlot.payment_amount >= min_payment)

        # Apply sorting
        query = apply_sorting(query, sort_by, sort_order, ReviewSlot)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        query = query.offset(skip).limit(page_size)
        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Format response
        items = []
        total_potential_earnings = 0

        for slot in slots:
            urgency_level, urgency_seconds, countdown_text = calculate_urgency(slot.auto_accept_at)

            # Apply urgency filter
            if urgency_filter and urgency_level not in urgency_filter:
                continue

            # Calculate potential sparks
            potential_sparks = 50  # Base sparks
            potential_bonus = 10 if slot.rating and slot.rating >= 4 else 0

            payment_amount = float(slot.payment_amount) if slot.payment_amount else 0
            total_potential_earnings += payment_amount

            items.append({
                "slot_id": slot.id,
                "review_request": format_review_request_info(slot.review_request, include_description=True),
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

        return {
            "items": items,
            "pagination": build_pagination_response(total, page, page_size, len(slots), skip),
            "summary": {
                "submitted_count": total,
                "total_potential_earnings": round(total_potential_earnings, 2)
            },
            "filters_applied": {
                "sort_by": sort_by,
                "sort_order": sort_order,
                "urgency_filter": urgency_filter,
                "rating_min": rating_min,
                "min_payment": min_payment
            }
        }

    except Exception as e:
        logger.error(f"Error getting desktop submitted reviews for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load submitted reviews")


@router.get("/desktop/reviewer/completed")
@limiter.limit(RateLimits.DASHBOARD_DESKTOP_READ)
async def get_desktop_reviewer_completed(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(PaginationDefaults.DESKTOP_PAGE_SIZE, ge=1, le=PaginationDefaults.DESKTOP_MAX_PAGE_SIZE),
    sort_by: str = Query("updated_at", description="Sort by: updated_at, rating, payment_amount"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    rating_min: Optional[int] = Query(None, ge=1, le=5),
    min_payment: Optional[float] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Desktop-optimized endpoint for completed reviews (accepted or paid).

    **Rate Limit**: 200 requests per minute
    """
    try:
        skip = (page - 1) * page_size

        # Query completed reviews (accepted or paid status)
        query = (
            select(ReviewSlot)
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
                )
            )
            .options(selectinload(ReviewSlot.review_request))
        )

        # Apply filters
        if rating_min is not None:
            query = query.where(ReviewSlot.rating >= rating_min)

        if min_payment is not None:
            query = query.where(ReviewSlot.payment_amount >= min_payment)

        # Apply sorting
        query = apply_sorting(query, sort_by, sort_order, ReviewSlot)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        query = query.offset(skip).limit(page_size)
        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Format response
        items = []
        total_earned = 0

        for slot in slots:
            payment_amount = float(slot.payment_amount) if slot.payment_amount else 0
            total_earned += payment_amount

            items.append({
                "slot_id": slot.id,
                "review_request": format_review_request_info(slot.review_request, include_description=True),
                "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                "accepted_at": slot.updated_at.isoformat() if slot.updated_at else None,
                "rating": slot.rating,
                "payment_amount": payment_amount,
                "status": slot.status
            })

        return {
            "items": items,
            "pagination": build_pagination_response(total, page, page_size, len(slots), skip),
            "summary": {
                "completed_count": total,
                "total_earned": total_earned
            },
            "filters": {
                "rating_min": rating_min,
                "min_payment": min_payment
            }
        }

    except Exception as e:
        logger.error(f"Error getting desktop completed reviews for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load completed reviews")
