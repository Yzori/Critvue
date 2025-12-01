"""
Activity API Endpoints

Provides activity data for user profiles including:
- Activity heatmap (daily contribution counts)
- Activity timeline (recent events)
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.review_slot import ReviewSlot
from app.models.review_request import ReviewRequest
from app.models.karma_transaction import KarmaTransaction, KarmaAction
from app.models.notification import Notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/activity", tags=["Activity"])


# ==================== Schemas ====================

class DayActivity(BaseModel):
    """Activity data for a single day"""
    date: str  # YYYY-MM-DD
    reviews_given: int
    reviews_received: int
    karma_events: int
    total: int


class ActivityHeatmapResponse(BaseModel):
    """Activity heatmap data"""
    data: List[DayActivity]
    current_streak: int
    longest_streak: int
    total_contributions: int


class TimelineEvent(BaseModel):
    """A single timeline event"""
    id: str
    type: str  # review_given, review_received, badge_earned, milestone, karma_change
    title: str
    description: Optional[str] = None
    timestamp: str
    metadata: Optional[dict] = None


class ActivityTimelineResponse(BaseModel):
    """Activity timeline response"""
    events: List[TimelineEvent]
    total: int
    has_more: bool


# ==================== Endpoints ====================

@router.get("/heatmap", response_model=ActivityHeatmapResponse)
async def get_activity_heatmap(
    days: int = Query(365, ge=30, le=365, description="Number of days to include"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get activity heatmap data for the current user.

    Returns daily activity counts for the specified number of days,
    along with streak information.
    """
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)

    # Get reviews given (as reviewer) grouped by date
    reviews_given_query = (
        select(
            func.date(ReviewSlot.submitted_at).label('date'),
            func.count(ReviewSlot.id).label('count')
        )
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.submitted_at.isnot(None),
                func.date(ReviewSlot.submitted_at) >= start_date,
                func.date(ReviewSlot.submitted_at) <= end_date,
            )
        )
        .group_by(func.date(ReviewSlot.submitted_at))
    )
    reviews_given_result = await db.execute(reviews_given_query)
    reviews_given_by_date = {str(row.date): row.count for row in reviews_given_result.all()}

    # Get reviews received (as creator) grouped by date
    reviews_received_query = (
        select(
            func.date(ReviewSlot.submitted_at).label('date'),
            func.count(ReviewSlot.id).label('count')
        )
        .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.submitted_at.isnot(None),
                func.date(ReviewSlot.submitted_at) >= start_date,
                func.date(ReviewSlot.submitted_at) <= end_date,
            )
        )
        .group_by(func.date(ReviewSlot.submitted_at))
    )
    reviews_received_result = await db.execute(reviews_received_query)
    reviews_received_by_date = {str(row.date): row.count for row in reviews_received_result.all()}

    # Get karma events grouped by date
    karma_query = (
        select(
            func.date(KarmaTransaction.created_at).label('date'),
            func.count(KarmaTransaction.id).label('count')
        )
        .where(
            and_(
                KarmaTransaction.user_id == current_user.id,
                func.date(KarmaTransaction.created_at) >= start_date,
                func.date(KarmaTransaction.created_at) <= end_date,
            )
        )
        .group_by(func.date(KarmaTransaction.created_at))
    )
    karma_result = await db.execute(karma_query)
    karma_by_date = {str(row.date): row.count for row in karma_result.all()}

    # Build activity data for each day
    activity_data: List[DayActivity] = []
    total_contributions = 0

    current_date = start_date
    while current_date <= end_date:
        date_str = str(current_date)
        reviews_given = reviews_given_by_date.get(date_str, 0)
        reviews_received = reviews_received_by_date.get(date_str, 0)
        karma_events = karma_by_date.get(date_str, 0)
        total = reviews_given + reviews_received + karma_events

        activity_data.append(DayActivity(
            date=date_str,
            reviews_given=reviews_given,
            reviews_received=reviews_received,
            karma_events=karma_events,
            total=total,
        ))

        total_contributions += total
        current_date += timedelta(days=1)

    # Calculate streaks from user model (already tracked)
    current_streak = current_user.current_streak or 0
    longest_streak = current_user.longest_streak or 0

    return ActivityHeatmapResponse(
        data=activity_data,
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_contributions=total_contributions,
    )


@router.get("/timeline", response_model=ActivityTimelineResponse)
async def get_activity_timeline(
    limit: int = Query(20, ge=1, le=50, description="Number of events to return"),
    offset: int = Query(0, ge=0, description="Number of events to skip"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get activity timeline for the current user.

    Returns recent activity events including reviews, karma changes,
    and milestones in chronological order (newest first).
    """
    events: List[TimelineEvent] = []

    # Get reviews given (submitted by user as reviewer)
    reviews_given_query = (
        select(ReviewSlot, ReviewRequest)
        .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.submitted_at.isnot(None),
            )
        )
        .order_by(ReviewSlot.submitted_at.desc())
        .limit(limit)
    )
    reviews_given_result = await db.execute(reviews_given_query)

    for slot, request in reviews_given_result.all():
        status_suffix = ""
        if slot.status == "accepted":
            status_suffix = " (Accepted)"
        elif slot.status == "rejected":
            status_suffix = " (Rejected)"

        # Get human-readable content type
        content_type_display = request.content_type.value.replace("_", " ") if request.content_type else "content"

        events.append(TimelineEvent(
            id=f"review_given_{slot.id}",
            type="review_given",
            title=f'Reviewed "{request.title}"{status_suffix}',
            description=f"Provided feedback on {content_type_display} review",
            timestamp=slot.submitted_at.isoformat() if slot.submitted_at else "",
            metadata={
                "slot_id": slot.id,
                "request_id": request.id,
                "project_name": request.title,
                "rating": slot.rating,
                "status": slot.status,
            }
        ))

    # Get reviews received (submitted on user's requests)
    reviews_received_query = (
        select(ReviewSlot, ReviewRequest, User)
        .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
        .join(User, ReviewSlot.reviewer_id == User.id)
        .where(
            and_(
                ReviewRequest.user_id == current_user.id,
                ReviewSlot.submitted_at.isnot(None),
            )
        )
        .order_by(ReviewSlot.submitted_at.desc())
        .limit(limit)
    )
    reviews_received_result = await db.execute(reviews_received_query)

    for slot, request, reviewer in reviews_received_result.all():
        events.append(TimelineEvent(
            id=f"review_received_{slot.id}",
            type="review_received",
            title=f'Received review on "{request.title}"',
            description=f"From {reviewer.full_name or reviewer.email}",
            timestamp=slot.submitted_at.isoformat() if slot.submitted_at else "",
            metadata={
                "slot_id": slot.id,
                "request_id": request.id,
                "project_name": request.title,
                "reviewer_name": reviewer.full_name or reviewer.email,
                "rating": slot.rating,
            }
        ))

    # Get significant karma transactions
    karma_query = (
        select(KarmaTransaction)
        .where(
            and_(
                KarmaTransaction.user_id == current_user.id,
                # Only include significant karma events
                or_(
                    KarmaTransaction.action.in_([
                        KarmaAction.REVIEW_ACCEPTED,
                        KarmaAction.REVIEW_REJECTED,
                        KarmaAction.BADGE_EARNED,
                        KarmaAction.TIER_PROMOTION,
                        KarmaAction.STREAK_BONUS_5,
                        KarmaAction.STREAK_BONUS_10,
                        KarmaAction.STREAK_BONUS_25,
                        KarmaAction.WEEKLY_GOAL_MET,
                        KarmaAction.DISPUTE_WON,
                        KarmaAction.DISPUTE_LOST,
                    ]),
                    # Or any karma change >= 20 or <= -20
                    KarmaTransaction.points >= 20,
                    KarmaTransaction.points <= -20,
                )
            )
        )
        .order_by(KarmaTransaction.created_at.desc())
        .limit(limit)
    )
    karma_result = await db.execute(karma_query)

    for transaction in karma_result.scalars().all():
        sign = "+" if transaction.points >= 0 else ""

        # Generate appropriate title based on action
        if transaction.action == KarmaAction.BADGE_EARNED:
            title = "Earned a new badge"
            event_type = "badge_earned"
        elif transaction.action == KarmaAction.TIER_PROMOTION:
            title = "Tier promotion!"
            event_type = "milestone"
        elif transaction.action in [KarmaAction.STREAK_BONUS_5, KarmaAction.STREAK_BONUS_10, KarmaAction.STREAK_BONUS_25]:
            title = "Streak milestone reached"
            event_type = "milestone"
        elif transaction.action == KarmaAction.WEEKLY_GOAL_MET:
            title = "Weekly goal achieved"
            event_type = "milestone"
        else:
            title = f"{sign}{transaction.points} karma"
            event_type = "karma_change"

        events.append(TimelineEvent(
            id=f"karma_{transaction.id}",
            type=event_type,
            title=title,
            description=transaction.reason,
            timestamp=transaction.created_at.isoformat(),
            metadata={
                "points": transaction.points,
                "action": transaction.action.value,
                "balance_after": transaction.balance_after,
            }
        ))

    # Sort all events by timestamp (newest first) and apply pagination
    events.sort(key=lambda e: e.timestamp, reverse=True)
    total = len(events)
    events = events[offset:offset + limit]

    return ActivityTimelineResponse(
        events=events,
        total=total,
        has_more=offset + limit < total,
    )
