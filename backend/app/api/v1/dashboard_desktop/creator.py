"""
Desktop Dashboard - Creator Endpoints

Endpoints for creators to manage their review requests and pending reviews.
"""

from typing import Optional, List
from datetime import datetime
from fastapi import Depends, Request, Query, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.dashboard_desktop.common import (
    create_router,
    limiter,
    logger,
    get_current_user,
    get_db,
    RateLimits,
    PaginationDefaults,
    InternalError,
    InvalidInputError,
    User,
    ReviewSlot,
    ReviewSlotStatus,
    ReviewRequest,
    ReviewStatus,
    calculate_urgency,
    generate_etag,
    apply_sorting,
    apply_date_range_filter,
    build_pagination_response,
    format_reviewer_info,
)

router = create_router("creator")


@router.get("/desktop/creator/actions-needed")
@limiter.limit(RateLimits.DASHBOARD_DESKTOP_READ)
async def get_desktop_creator_actions_needed(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(PaginationDefaults.DESKTOP_PAGE_SIZE, ge=1, le=PaginationDefaults.DESKTOP_MAX_PAGE_SIZE, description="Items per page (max 100)"),
    sort_by: str = Query("auto_accept_at", description="Sort by: auto_accept_at, submitted_at, rating, reviewer_name"),
    sort_order: str = Query("asc", description="Sort order: asc, desc"),
    urgency_filter: Optional[List[str]] = Query(None, description="Filter by urgency: CRITICAL, HIGH, MEDIUM, LOW"),
    rating_min: Optional[int] = Query(None, ge=1, le=5, description="Minimum rating filter"),
    date_range: Optional[str] = Query(None, description="Date range: last_7_days, last_30_days, last_90_days, custom"),
    date_start: Optional[datetime] = Query(None, description="Custom date range start"),
    date_end: Optional[datetime] = Query(None, description="Custom date range end"),
    search: Optional[str] = Query(None, description="Search in title, reviewer name, review text"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Desktop-optimized endpoint for pending reviews awaiting creator approval.

    **Features**:
    - Advanced filtering (urgency, rating, date range, search)
    - Flexible sorting (multiple columns)
    - Larger page sizes (up to 100 items)
    - Full review text preview
    - Reviewer details with stats

    **Rate Limit**: 200 requests per minute (higher for desktop)
    """
    try:
        skip = (page - 1) * page_size

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
                selectinload(ReviewSlot.reviewer),
                selectinload(ReviewSlot.review_request)
            )
        )

        # Apply date range filter
        if date_range:
            query = apply_date_range_filter(
                query, date_range, ReviewSlot.submitted_at, date_start, date_end
            )

        # Apply rating filter
        if rating_min is not None:
            query = query.where(ReviewSlot.rating >= rating_min)

        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    ReviewRequest.title.ilike(search_pattern),
                    ReviewSlot.review_text.ilike(search_pattern)
                )
            )

        # Apply sorting
        if sort_by == "auto_accept_at":
            query = query.order_by(
                asc(ReviewSlot.auto_accept_at) if sort_order == "asc" else desc(ReviewSlot.auto_accept_at)
            )
        elif sort_by == "submitted_at":
            query = query.order_by(
                asc(ReviewSlot.submitted_at) if sort_order == "asc" else desc(ReviewSlot.submitted_at)
            )
        elif sort_by == "rating":
            query = query.order_by(
                asc(ReviewSlot.rating) if sort_order == "asc" else desc(ReviewSlot.rating)
            )
        else:
            query = query.order_by(ReviewSlot.auto_accept_at.asc())

        # Get total count before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        query = query.offset(skip).limit(page_size)

        # Execute query
        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Format response items
        items = []
        urgency_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

        for slot in slots:
            urgency_level, urgency_seconds, countdown_text = calculate_urgency(slot.auto_accept_at)

            # Apply urgency filter if specified
            if urgency_filter and urgency_level not in urgency_filter:
                continue

            # Count urgency levels
            if urgency_level in urgency_counts:
                urgency_counts[urgency_level] += 1

            # Build item with full details for desktop
            item = {
                "slot_id": slot.id,
                "review_request_id": slot.review_request_id,
                "review_request_title": slot.review_request.title if slot.review_request else None,
                "reviewer": format_reviewer_info(slot.reviewer),
                "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                "auto_accept_at": slot.auto_accept_at.isoformat() if slot.auto_accept_at else None,
                "urgency_level": urgency_level,
                "urgency_seconds": urgency_seconds,
                "countdown_text": countdown_text,
                "rating": slot.rating,
                "review_text": slot.review_text,
                "review_preview": slot.review_text[:200] + "..." if slot.review_text and len(slot.review_text) > 200 else slot.review_text,
                "feedback_sections": slot.feedback_sections,
                "can_batch_accept": True,
                "payment_amount": float(slot.payment_amount) if slot.payment_amount else 0
            }

            items.append(item)

        # Build response
        response_data = {
            "items": items,
            "pagination": build_pagination_response(total, page, page_size, len(slots), skip),
            "summary": {
                "critical_count": urgency_counts["CRITICAL"],
                "high_count": urgency_counts["HIGH"],
                "medium_count": urgency_counts["MEDIUM"],
                "low_count": urgency_counts["LOW"],
                "total_pending": total
            },
            "filters_applied": {
                "sort_by": sort_by,
                "sort_order": sort_order,
                "urgency_filter": urgency_filter,
                "rating_min": rating_min,
                "date_range": date_range,
                "search": search
            }
        }

        # Generate ETag
        etag = generate_etag(response_data)

        # Check If-None-Match header
        if_none_match = request.headers.get("if-none-match")
        if if_none_match == etag:
            return Response(status_code=status.HTTP_304_NOT_MODIFIED)

        # Return with caching headers
        return JSONResponse(
            content=response_data,
            headers={
                "ETag": etag,
                "Cache-Control": "private, max-age=30"
            }
        )

    except Exception as e:
        logger.error(f"Error getting desktop actions needed for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load pending reviews")


@router.get("/desktop/creator/my-requests")
@limiter.limit(RateLimits.DASHBOARD_DESKTOP_READ)
async def get_desktop_creator_my_requests(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(PaginationDefaults.DESKTOP_PAGE_SIZE, ge=1, le=PaginationDefaults.DESKTOP_MAX_PAGE_SIZE),
    status_filter: Optional[List[str]] = Query(None, description="Filter by status (multiple)"),
    content_type_filter: Optional[List[str]] = Query(None, description="Filter by content type"),
    sort_by: str = Query("created_at", description="Sort by: created_at, updated_at, deadline, title, status"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    date_range: Optional[str] = Query(None, description="Date range filter"),
    date_start: Optional[datetime] = Query(None),
    date_end: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None, description="Search in title, description"),
    has_urgent_actions: Optional[bool] = Query(None, description="Filter requests with urgent actions"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Desktop-optimized endpoint for creator's review requests.

    **Features**:
    - Multi-select status filtering
    - Content type filtering
    - Full-text search
    - Date range filtering
    - Urgent actions filter
    - Flexible sorting

    **Rate Limit**: 200 requests per minute
    """
    try:
        skip = (page - 1) * page_size

        # Build base query
        query = (
            select(ReviewRequest)
            .where(ReviewRequest.user_id == current_user.id)
            .options(selectinload(ReviewRequest.slots))
        )

        # Apply status filter (multiple)
        if status_filter:
            try:
                status_enums = [ReviewStatus(s) for s in status_filter]
                query = query.where(ReviewRequest.status.in_([s.value for s in status_enums]))
            except ValueError as e:
                raise InvalidInputError(message=f"Invalid status: {e}")

        # Apply content type filter
        if content_type_filter:
            query = query.where(ReviewRequest.content_type.in_(content_type_filter))

        # Apply date range filter
        if date_range:
            query = apply_date_range_filter(
                query, date_range, ReviewRequest.created_at, date_start, date_end
            )

        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    ReviewRequest.title.ilike(search_pattern),
                    ReviewRequest.description.ilike(search_pattern)
                )
            )

        # Apply sorting
        query = apply_sorting(query, sort_by, sort_order, ReviewRequest)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        query = query.offset(skip).limit(page_size)
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
                if slot.status in slot_statuses:
                    slot_statuses[slot.status] += 1

                if slot.status == ReviewSlotStatus.SUBMITTED.value:
                    urgency_level, _, _ = calculate_urgency(slot.auto_accept_at)
                    if urgency_level == "CRITICAL":
                        has_critical = True
                        urgent_actions += 1
                    elif urgency_level in ["HIGH", "MEDIUM"]:
                        urgent_actions += 1

            # Apply urgent actions filter
            if has_urgent_actions is not None and has_urgent_actions != (urgent_actions > 0):
                continue

            # Calculate progress
            submitted_count = slot_statuses["submitted"]
            accepted_count = slot_statuses["accepted"]
            completed = submitted_count + accepted_count
            percentage = (completed / req.reviews_requested * 100) if req.reviews_requested > 0 else 0

            items.append({
                "id": req.id,
                "title": req.title,
                "description": req.description,
                "status": req.status.value,
                "content_type": req.content_type.value,
                "content_subcategory": req.content_subcategory if hasattr(req, 'content_subcategory') else None,
                "created_at": req.created_at.isoformat(),
                "updated_at": req.updated_at.isoformat() if req.updated_at else None,
                "deadline": req.deadline.isoformat() if req.deadline else None,
                "progress": {
                    "requested": req.reviews_requested,
                    "claimed": req.reviews_claimed,
                    "submitted": submitted_count,
                    "accepted": accepted_count,
                    "percentage": round(percentage, 1)
                },
                "slot_statuses": slot_statuses,
                "urgent_actions": urgent_actions,
                "has_critical": has_critical,
                "review_type": req.review_type.value if hasattr(req, 'review_type') else None
            })

        return {
            "items": items,
            "pagination": build_pagination_response(total, page, page_size, len(requests), skip),
            "filters_applied": {
                "status_filter": status_filter,
                "content_type_filter": content_type_filter,
                "sort_by": sort_by,
                "sort_order": sort_order,
                "date_range": date_range,
                "search": search,
                "has_urgent_actions": has_urgent_actions
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting desktop requests for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load review requests")


# Re-export HTTPException for the except clause
from fastapi import HTTPException
