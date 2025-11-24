"""
Desktop Dashboard API Endpoints

Enhanced endpoints optimized for desktop usage with:
- Advanced filtering and sorting
- Larger page sizes
- Complex queries
- Bulk operations
- Search functionality
- Activity timeline
- Comprehensive overviews
"""

import logging
import hashlib
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select, and_, or_, func, case, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, PaymentStatus
from app.models.review_request import ReviewRequest, ReviewStatus
from app.models.notification import Notification
from app.schemas.review_slot import ReviewAccept

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard-desktop"])
limiter = Limiter(key_func=get_remote_address)


# ===== Utility Functions =====

def calculate_urgency(deadline: Optional[datetime]) -> tuple[str, int, str]:
    """
    Calculate urgency level, seconds remaining, and human-readable countdown.

    Returns:
        (urgency_level, seconds_remaining, countdown_text)
    """
    if deadline is None:
        return "NONE", 0, "No deadline"

    now = datetime.utcnow()
    delta = deadline - now
    seconds = int(delta.total_seconds())

    if seconds < 0:
        return "EXPIRED", 0, "Expired"

    # Calculate urgency level
    if seconds < 86400:  # < 24 hours
        urgency_level = "CRITICAL"
    elif seconds < 259200:  # < 3 days
        urgency_level = "HIGH"
    elif seconds < 604800:  # < 7 days
        urgency_level = "MEDIUM"
    else:
        urgency_level = "LOW"

    # Format countdown text
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60

    if days > 0:
        countdown_text = f"{days}d {hours}h"
    elif hours > 0:
        countdown_text = f"{hours}h {minutes}m"
    else:
        countdown_text = f"{minutes}m"

    return urgency_level, seconds, countdown_text


def generate_etag(data: Any) -> str:
    """Generate ETag for response caching"""
    content = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(content.encode()).hexdigest()


def apply_sorting(query, sort_by: str, sort_order: str, model):
    """Apply sorting to a query based on sort_by and sort_order"""
    order_func = asc if sort_order == "asc" else desc

    sort_mapping = {
        "created_at": model.created_at,
        "updated_at": model.updated_at,
        "deadline": getattr(model, "claim_deadline", None) or getattr(model, "deadline", None),
        "status": model.status,
        "title": getattr(model, "title", None),
    }

    sort_col = sort_mapping.get(sort_by)
    if sort_col is not None:
        return query.order_by(order_func(sort_col))

    return query


def apply_date_range_filter(query, date_range: str, date_column, custom_start: Optional[datetime] = None, custom_end: Optional[datetime] = None):
    """Apply date range filter to a query"""
    now = datetime.utcnow()

    if date_range == "last_7_days":
        start_date = now - timedelta(days=7)
        return query.where(date_column >= start_date)
    elif date_range == "last_30_days":
        start_date = now - timedelta(days=30)
        return query.where(date_column >= start_date)
    elif date_range == "last_90_days":
        start_date = now - timedelta(days=90)
        return query.where(date_column >= start_date)
    elif date_range == "custom" and custom_start and custom_end:
        return query.where(and_(
            date_column >= custom_start,
            date_column <= custom_end
        ))

    return query


# ===== Desktop Creator Endpoints =====

@router.get("/desktop/creator/actions-needed")
@limiter.limit("200/minute")
async def get_desktop_creator_actions_needed(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
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
        # Calculate pagination
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
                "reviewer": {
                    "id": slot.reviewer.id,
                    "name": slot.reviewer.full_name or slot.reviewer.email.split('@')[0],
                    "avatar_url": slot.reviewer.avatar_url,
                    "tier": slot.reviewer.user_tier.value if slot.reviewer.user_tier else "novice",
                    "avg_rating": float(slot.reviewer.avg_rating) if slot.reviewer.avg_rating else None,
                    "total_reviews": slot.reviewer.reviews_given if hasattr(slot.reviewer, 'reviews_given') else 0
                } if slot.reviewer else None,
                "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                "auto_accept_at": slot.auto_accept_at.isoformat() if slot.auto_accept_at else None,
                "urgency_level": urgency_level,
                "urgency_seconds": urgency_seconds,
                "countdown_text": countdown_text,
                "rating": slot.rating,
                "review_text": slot.review_text,  # Full text for desktop
                "review_preview": slot.review_text[:200] + "..." if slot.review_text and len(slot.review_text) > 200 else slot.review_text,
                "feedback_sections": slot.feedback_sections,
                "can_batch_accept": True,
                "payment_amount": float(slot.payment_amount) if slot.payment_amount else 0
            }

            items.append(item)

        # Build response
        response_data = {
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
                "has_more": (skip + len(slots)) < total
            },
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
                "Cache-Control": "private, max-age=30"  # Shorter for desktop (more frequent updates)
            }
        )

    except Exception as e:
        logger.error(f"Error getting desktop actions needed for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load pending reviews"
        )


@router.get("/desktop/creator/my-requests")
@limiter.limit("200/minute")
async def get_desktop_creator_my_requests(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
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
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {e}"
                )

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
                "description": req.description,  # Full description for desktop
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
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
                "has_more": (skip + len(requests)) < total
            },
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load review requests"
        )


# ===== Desktop Reviewer Endpoints =====

@router.get("/desktop/reviewer/active")
@limiter.limit("200/minute")
async def get_desktop_reviewer_active(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
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
                except:
                    pass

            # Calculate earnings potential
            earnings_potential = float(slot.payment_amount) if slot.payment_amount else 0
            total_potential_earnings += earnings_potential

            items.append({
                "slot_id": slot.id,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "description": slot.review_request.description,  # Full description for desktop
                    "content_type": slot.review_request.content_type.value,
                    "content_subcategory": getattr(slot.review_request, 'content_subcategory', None),
                    "review_type": slot.review_request.review_type.value if hasattr(slot.review_request, 'review_type') else None
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
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
                "has_more": (skip + len(slots)) < total
            },
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load active reviews"
        )


@router.get("/desktop/reviewer/submitted")
@limiter.limit("200/minute")
async def get_desktop_reviewer_submitted(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
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

            # Calculate potential karma
            potential_karma = 50  # Base karma
            potential_bonus = 10 if slot.rating and slot.rating >= 4 else 0

            payment_amount = float(slot.payment_amount) if slot.payment_amount else 0
            total_potential_earnings += payment_amount

            items.append({
                "slot_id": slot.id,
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "content_type": slot.review_request.content_type.value,
                    "description": slot.review_request.description  # Full description
                } if slot.review_request else None,
                "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                "auto_accept_at": slot.auto_accept_at.isoformat() if slot.auto_accept_at else None,
                "urgency_level": urgency_level,
                "urgency_seconds": urgency_seconds,
                "countdown_text": countdown_text,
                "rating": slot.rating,
                "potential_karma": potential_karma,
                "potential_bonus": potential_bonus,
                "payment_amount": payment_amount,
                "status": slot.status
            })

        return {
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
                "has_more": (skip + len(slots)) < total
            },
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load submitted reviews"
        )


@router.get("/desktop/reviewer/completed")
@limiter.limit("200/minute")
async def get_desktop_reviewer_completed(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
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
                    or_(
                        ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                        ReviewSlot.status == ReviewSlotStatus.PAID.value
                    )
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
                "review_request": {
                    "id": slot.review_request.id,
                    "title": slot.review_request.title,
                    "content_type": slot.review_request.content_type.value,
                    "description": slot.review_request.description  # Full description
                } if slot.review_request else None,
                "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                "accepted_at": slot.updated_at.isoformat() if slot.updated_at else None,
                "rating": slot.rating,
                "payment_amount": payment_amount,
                "status": slot.status
            })

        return {
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
                "has_more": (skip + len(slots)) < total
            },
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load completed reviews"
        )


# ===== Desktop-Specific Endpoints =====

@router.get("/desktop/overview")
@limiter.limit("100/minute")
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'creator' or 'reviewer'"
            )

        now = datetime.utcnow()

        if role == "creator":
            # Creator overview

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
                    "avg_response_time_hours": None  # TODO: Calculate
                }
            }

            # Add alerts
            if critical_items > 0:
                overview["alerts"].append({
                    "type": "critical",
                    "message": f"{critical_items} review(s) will auto-accept within 24 hours",
                    "action": "Review and approve/reject now",
                    "link": "/dashboard/actions-needed"
                })

        else:  # reviewer
            # Reviewer overview

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
                    "avg_turnaround_hours": None  # TODO: Calculate
                }
            }

            # Add alerts
            if critical_items > 0:
                overview["alerts"].append({
                    "type": "critical",
                    "message": f"{critical_items} review(s) must be submitted within 24 hours",
                    "action": "Complete reviews now",
                    "link": "/dashboard/active"
                })

        return overview

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting desktop overview for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load overview"
        )


@router.get("/desktop/activity-timeline")
@limiter.limit("100/minute")
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'creator' or 'reviewer'"
            )

        activities = []

        if role == "creator":
            # Get recent slots for creator's requests
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

            for slot in slots:
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

        else:  # reviewer
            # Get recent slots for reviewer
            query = (
                select(ReviewSlot)
                .where(ReviewSlot.reviewer_id == current_user.id)
                .options(selectinload(ReviewSlot.review_request))
                .order_by(ReviewSlot.updated_at.desc())
                .limit(limit)
            )
            result = await db.execute(query)
            slots = list(result.scalars().all())

            for slot in slots:
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

        return {
            "activities": activities,
            "total": len(activities),
            "role": role
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting activity timeline for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load activity timeline"
        )


@router.get("/desktop/search")
@limiter.limit("100/minute")
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'creator' or 'reviewer'"
            )

        search_pattern = f"%{q}%"
        results = {
            "query": q,
            "role": role,
            "review_requests": [],
            "review_slots": []
        }

        if role == "creator":
            # Search creator's review requests
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

            results["review_requests"] = [
                {
                    "id": req.id,
                    "title": req.title,
                    "status": req.status.value,
                    "content_type": req.content_type.value,
                    "created_at": req.created_at.isoformat()
                }
                for req in requests
            ]

            # Search review slots (by review text)
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

            results["review_slots"] = [
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

        else:  # reviewer
            # Search reviewer's review requests (by title)
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

            results["review_slots"] = [
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

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in dashboard search for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform search"
        )


# ===== Enhanced Bulk Operations =====

@router.post("/desktop/batch-reject")
@limiter.limit("10/minute")
async def batch_reject_reviews(
    request: Request,
    slot_ids: List[int] = Query(..., description="List of slot IDs to reject"),
    rejection_reason: str = Query(..., description="Rejection reason (same for all)"),
    rejection_notes: Optional[str] = Query(None, description="Optional notes"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reject multiple reviews at once.

    **Request Body**:
    - slot_ids: List of slot IDs (max 50)
    - rejection_reason: Reason (low_quality, off_topic, spam, abusive, other)
    - rejection_notes: Optional explanation

    **Rate Limit**: 10 requests per minute

    Returns summary of successful and failed rejections.
    """
    try:
        # Validate batch size
        if len(slot_ids) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 50 reviews can be batch rejected at once"
            )

        if not slot_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="slot_ids cannot be empty"
            )

        # Get all slots
        query = (
            select(ReviewSlot)
            .join(ReviewRequest)
            .where(
                and_(
                    ReviewSlot.id.in_(slot_ids),
                    ReviewRequest.user_id == current_user.id  # Security check
                )
            )
            .options(selectinload(ReviewSlot.review_request))
        )

        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Track results
        rejected = []
        failed = []

        # Process each slot
        for slot in slots:
            try:
                if slot.status != ReviewSlotStatus.SUBMITTED.value:
                    failed.append({
                        "slot_id": slot.id,
                        "error": f"Review is {slot.status}, not submitted",
                        "code": "INVALID_STATUS"
                    })
                    continue

                # Reject the review
                from app.crud import review_slot as crud_review_slot
                from app.models.review_slot import RejectionReason

                rejected_slot = await crud_review_slot.reject_review(
                    db,
                    slot.id,
                    current_user.id,
                    RejectionReason(rejection_reason),
                    rejection_notes
                )

                # Deduct karma
                from app.services.review_karma_hooks import on_review_rejected
                await on_review_rejected(db, rejected_slot.id, rejected_slot.reviewer_id)

                rejected.append({
                    "slot_id": rejected_slot.id,
                    "status": "rejected",
                    "reviewer_id": rejected_slot.reviewer_id
                })

            except Exception as e:
                logger.error(f"Error rejecting slot {slot.id}: {e}")
                failed.append({
                    "slot_id": slot.id,
                    "error": str(e),
                    "code": "REJECTION_FAILED"
                })

        # Commit all changes
        await db.commit()

        return {
            "rejected": rejected,
            "failed": failed,
            "summary": {
                "total_requested": len(slot_ids),
                "successful": len(rejected),
                "failed": len(failed)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch reject for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to batch reject reviews"
        )
