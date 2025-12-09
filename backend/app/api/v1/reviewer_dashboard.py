"""
Reviewer-specific API endpoints

Provides endpoints for reviewers to:
- View their dashboard with active claims, submitted reviews, and stats
- Track earnings and payment history
- Monitor their review performance
"""

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, PaymentStatus
from app.models.review_request import ReviewRequest
from app.schemas.review_slot import ReviewerEarnings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reviewer", tags=["reviewer"])


@router.get("/dashboard")
async def get_reviewer_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get reviewer dashboard data

    Returns comprehensive data for reviewer dashboard:
    - Active claims: Slots currently claimed (not yet submitted)
    - Submitted reviews: Reviews awaiting acceptance/rejection
    - Completed reviews: Recent accepted reviews (last 10)
    - Stats: Reviewer performance metrics

    **Authenticated endpoint - requires valid JWT token**
    """
    try:
        # Get active claims (CLAIMED status)
        active_claims_query = (
            select(ReviewSlot)
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.CLAIMED.value
                )
            )
            .options(selectinload(ReviewSlot.review_request))
            .order_by(ReviewSlot.claim_deadline.asc())
        )
        active_claims_result = await db.execute(active_claims_query)
        active_claims = list(active_claims_result.scalars().all())

        # Get submitted reviews (SUBMITTED status)
        submitted_query = (
            select(ReviewSlot)
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.SUBMITTED.value
                )
            )
            .options(selectinload(ReviewSlot.review_request))
            .order_by(ReviewSlot.auto_accept_at.asc())
        )
        submitted_result = await db.execute(submitted_query)
        submitted_reviews = list(submitted_result.scalars().all())

        # Get completed reviews (ACCEPTED status, last 10)
        completed_query = (
            select(ReviewSlot)
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
                )
            )
            .options(selectinload(ReviewSlot.review_request))
            .order_by(ReviewSlot.reviewed_at.desc())
            .limit(10)
        )
        completed_result = await db.execute(completed_query)
        completed_reviews = list(completed_result.scalars().all())

        # Calculate stats
        # Total reviews (accepted + rejected)
        total_reviews_query = (
            select(func.count(ReviewSlot.id))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status.in_([
                        ReviewSlotStatus.ACCEPTED.value,
                        ReviewSlotStatus.REJECTED.value
                    ])
                )
            )
        )
        total_reviews_result = await db.execute(total_reviews_query)
        total_reviews = total_reviews_result.scalar() or 0

        # Accepted reviews
        accepted_reviews_query = (
            select(func.count(ReviewSlot.id))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
                )
            )
        )
        accepted_reviews_result = await db.execute(accepted_reviews_query)
        accepted_reviews = accepted_reviews_result.scalar() or 0

        # Acceptance rate
        acceptance_rate = accepted_reviews / total_reviews if total_reviews > 0 else 0

        # Average rating (from requester_helpful_rating)
        avg_rating_query = (
            select(func.avg(ReviewSlot.requester_helpful_rating))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.requester_helpful_rating.isnot(None)
                )
            )
        )
        avg_rating_result = await db.execute(avg_rating_query)
        average_rating = avg_rating_result.scalar() or None

        # Total earned (released payments)
        total_earned_query = (
            select(func.sum(ReviewSlot.payment_amount))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                    ReviewSlot.payment_status == PaymentStatus.RELEASED.value
                )
            )
        )
        total_earned_result = await db.execute(total_earned_query)
        total_earned = total_earned_result.scalar() or 0

        # Pending payment (escrowed or submitted)
        pending_payment_query = (
            select(func.sum(ReviewSlot.payment_amount))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status.in_([
                        ReviewSlotStatus.CLAIMED.value,
                        ReviewSlotStatus.SUBMITTED.value
                    ]),
                    ReviewSlot.payment_status == PaymentStatus.ESCROWED.value
                )
            )
        )
        pending_payment_result = await db.execute(pending_payment_query)
        pending_payment = pending_payment_result.scalar() or 0

        # Format response
        return {
            "active_claims": [
                {
                    "slot_id": slot.id,
                    "review_request": {
                        "id": slot.review_request.id,
                        "title": slot.review_request.title,
                        "content_type": slot.review_request.content_type.value,
                        "review_type": slot.review_request.review_type.value,
                        "external_links": getattr(slot.review_request, 'external_links', None),
                    },
                    "claimed_at": slot.claimed_at.isoformat() if slot.claimed_at else None,
                    "claim_deadline": slot.claim_deadline.isoformat() if slot.claim_deadline else None,
                    "payment_amount": float(slot.payment_amount) if slot.payment_amount else None,
                }
                for slot in active_claims
            ],
            "submitted_reviews": [
                {
                    "slot_id": slot.id,
                    "review_request": {
                        "id": slot.review_request.id,
                        "title": slot.review_request.title,
                        "content_type": slot.review_request.content_type.value,
                    },
                    "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                    "auto_accept_at": slot.auto_accept_at.isoformat() if slot.auto_accept_at else None,
                    "payment_amount": float(slot.payment_amount) if slot.payment_amount else None,
                }
                for slot in submitted_reviews
            ],
            "completed_reviews": [
                {
                    "slot_id": slot.id,
                    "review_request": {
                        "id": slot.review_request.id,
                        "title": slot.review_request.title,
                    },
                    "reviewed_at": slot.reviewed_at.isoformat() if slot.reviewed_at else None,
                    "requester_helpful_rating": slot.requester_helpful_rating,
                    "payment_amount": float(slot.payment_amount) if slot.payment_amount else None,
                }
                for slot in completed_reviews
            ],
            "stats": {
                "total_reviews": total_reviews,
                "accepted_reviews": accepted_reviews,
                "acceptance_rate": round(acceptance_rate, 3),
                "average_rating": round(average_rating, 2) if average_rating else None,
                "total_earned": float(total_earned),
                "pending_payment": float(pending_payment),
            }
        }

    except Exception as e:
        logger.error(f"Error getting reviewer dashboard for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load reviewer dashboard"
        )


@router.get("/my-reviews")
async def get_my_reviews(
    status_filter: str = None,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all reviews for the current user with optional filtering

    **Query Parameters:**
    - status_filter: Filter by status (claimed, submitted, accepted, rejected, etc.)
    - skip: Pagination offset (default: 0)
    - limit: Items per page (default: 20, max: 100)

    **Authenticated endpoint - requires valid JWT token**
    """
    try:
        # Validate status filter
        if status_filter:
            try:
                status_enum = ReviewSlotStatus(status_filter)
            except ValueError:
                raise InvalidInputError(message=f"Invalid status filter: {status_filter}. Valid values: {[s.value for s in ReviewSlotStatus]}"
                )
        else:
            status_enum = None

        # Limit max page size
        limit = min(limit, 100)

        # Build query
        query = (
            select(ReviewSlot)
            .where(ReviewSlot.reviewer_id == current_user.id)
            .options(selectinload(ReviewSlot.review_request))
        )

        if status_enum:
            query = query.where(ReviewSlot.status == status_enum.value)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(ReviewSlot.updated_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        slots = list(result.scalars().all())

        # Format response
        return {
            "items": [
                {
                    "slot_id": slot.id,
                    "status": slot.status,
                    "review_request": {
                        "id": slot.review_request.id,
                        "title": slot.review_request.title,
                        "content_type": slot.review_request.content_type.value,
                    },
                    "claimed_at": slot.claimed_at.isoformat() if slot.claimed_at else None,
                    "submitted_at": slot.submitted_at.isoformat() if slot.submitted_at else None,
                    "reviewed_at": slot.reviewed_at.isoformat() if slot.reviewed_at else None,
                    "payment_amount": float(slot.payment_amount) if slot.payment_amount else None,
                    "requester_helpful_rating": slot.requester_helpful_rating,
                }
                for slot in slots
            ],
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + len(slots)) < total
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting reviews for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load reviews"
        )


@router.get("/earnings", response_model=ReviewerEarnings)
async def get_reviewer_earnings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed earnings summary for reviewer

    Returns:
    - total_earned: Total payments released to reviewer
    - pending_payment: Payments currently escrowed
    - available_for_withdrawal: Amount available to withdraw
    - reviews_completed: Number of accepted reviews
    - average_rating: Average helpful rating from requesters
    - acceptance_rate: Percentage of submitted reviews accepted

    **Authenticated endpoint - requires valid JWT token**
    """
    try:
        # Total earned (released payments)
        total_earned_query = (
            select(func.sum(ReviewSlot.payment_amount))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.payment_status == PaymentStatus.RELEASED.value
                )
            )
        )
        total_earned_result = await db.execute(total_earned_query)
        total_earned = total_earned_result.scalar() or 0

        # Pending payment (escrowed)
        pending_payment_query = (
            select(func.sum(ReviewSlot.payment_amount))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.payment_status == PaymentStatus.ESCROWED.value
                )
            )
        )
        pending_payment_result = await db.execute(pending_payment_query)
        pending_payment = pending_payment_result.scalar() or 0

        # Reviews completed (accepted)
        reviews_completed_query = (
            select(func.count(ReviewSlot.id))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
                )
            )
        )
        reviews_completed_result = await db.execute(reviews_completed_query)
        reviews_completed = reviews_completed_result.scalar() or 0

        # Average rating
        avg_rating_query = (
            select(func.avg(ReviewSlot.requester_helpful_rating))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.requester_helpful_rating.isnot(None)
                )
            )
        )
        avg_rating_result = await db.execute(avg_rating_query)
        average_rating = avg_rating_result.scalar()

        # Acceptance rate
        total_submitted_query = (
            select(func.count(ReviewSlot.id))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.status.in_([
                        ReviewSlotStatus.ACCEPTED.value,
                        ReviewSlotStatus.REJECTED.value
                    ])
                )
            )
        )
        total_submitted_result = await db.execute(total_submitted_query)
        total_submitted = total_submitted_result.scalar() or 0

        acceptance_rate = reviews_completed / total_submitted if total_submitted > 0 else 0

        return ReviewerEarnings(
            total_earned=total_earned,
            pending_payment=pending_payment,
            available_for_withdrawal=total_earned,  # Simplified (in production, check withdrawal limits)
            reviews_completed=reviews_completed,
            average_rating=float(average_rating) if average_rating else None,
            acceptance_rate=acceptance_rate
        )

    except Exception as e:
        logger.error(f"Error getting earnings for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load earnings"
        )


@router.get("/stats")
async def get_reviewer_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed reviewer statistics

    Returns comprehensive stats including:
    - Review counts by status
    - Performance metrics
    - Time-based analytics

    **Authenticated endpoint - requires valid JWT token**
    """
    try:
        # Get all slots for reviewer
        all_slots_query = (
            select(ReviewSlot)
            .where(ReviewSlot.reviewer_id == current_user.id)
        )
        all_slots_result = await db.execute(all_slots_query)
        all_slots = list(all_slots_result.scalars().all())

        # Count by status
        status_counts = {
            "claimed": 0,
            "submitted": 0,
            "accepted": 0,
            "rejected": 0,
            "abandoned": 0,
            "disputed": 0
        }

        for slot in all_slots:
            if slot.status in status_counts:
                status_counts[slot.status] += 1

        # Calculate averages
        accepted_slots = [s for s in all_slots if s.status == ReviewSlotStatus.ACCEPTED.value]
        ratings = [s.requester_helpful_rating for s in accepted_slots if s.requester_helpful_rating]

        return {
            "status_counts": status_counts,
            "total_reviews": len(all_slots),
            "acceptance_rate": status_counts["accepted"] / (status_counts["accepted"] + status_counts["rejected"]) if (status_counts["accepted"] + status_counts["rejected"]) > 0 else 0,
            "average_rating": sum(ratings) / len(ratings) if ratings else None,
            "total_earned": sum(float(s.payment_amount) for s in accepted_slots if s.payment_amount and s.payment_status == PaymentStatus.RELEASED.value),
            "active_claims": status_counts["claimed"],
            "pending_reviews": status_counts["submitted"]
        }

    except Exception as e:
        logger.error(f"Error getting stats for user {current_user.id}: {e}", exc_info=True)
        raise InternalError(message="Failed to load stats"
        )
