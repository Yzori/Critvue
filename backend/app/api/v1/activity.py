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


# ==================== Enhanced Stats Schemas ====================

class TrendInfo(BaseModel):
    """Trend information for a stat"""
    value: int  # percentage change
    direction: str  # 'up', 'down', 'neutral'
    label: Optional[str] = None  # e.g., "from last month"


class StatWithContext(BaseModel):
    """A stat with contextual information"""
    value: float
    trend: Optional[TrendInfo] = None
    percentile: Optional[int] = None  # 0-100
    comparison: Optional[str] = None  # e.g., "Top 8% of reviewers"
    sparkline_data: Optional[List[int]] = None  # Historical data points


class ProfileStatsWithContextResponse(BaseModel):
    """Enhanced profile stats with trends and percentiles"""
    reviews_given: StatWithContext
    karma_points: StatWithContext
    avg_rating: StatWithContext
    avg_response_time: StatWithContext


@router.get("/stats/enhanced", response_model=ProfileStatsWithContextResponse)
async def get_enhanced_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get enhanced profile stats with trends, percentiles, and sparkline data.

    Returns:
    - Reviews given with monthly trend and percentile
    - Karma points with trend and percentile
    - Average rating with percentile
    - Average response time with trend and percentile
    """
    from datetime import date
    from calendar import monthrange

    now = datetime.utcnow()
    today = now.date()

    # Calculate date ranges
    # Current month
    current_month_start = date(today.year, today.month, 1)
    # Previous month
    if today.month == 1:
        prev_month_start = date(today.year - 1, 12, 1)
        prev_month_end = date(today.year - 1, 12, 31)
    else:
        prev_month_start = date(today.year, today.month - 1, 1)
        prev_month_end = date(today.year, today.month - 1, monthrange(today.year, today.month - 1)[1])

    # ========== REVIEWS GIVEN ==========
    # Current value
    reviews_given_current = current_user.total_reviews_given or 0

    # Get reviews this month vs last month for trend
    reviews_this_month_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.submitted_at.isnot(None),
                func.date(ReviewSlot.submitted_at) >= current_month_start,
            )
        )
    )
    reviews_this_month = (await db.execute(reviews_this_month_query)).scalar() or 0

    reviews_last_month_query = (
        select(func.count(ReviewSlot.id))
        .where(
            and_(
                ReviewSlot.reviewer_id == current_user.id,
                ReviewSlot.submitted_at.isnot(None),
                func.date(ReviewSlot.submitted_at) >= prev_month_start,
                func.date(ReviewSlot.submitted_at) <= prev_month_end,
            )
        )
    )
    reviews_last_month = (await db.execute(reviews_last_month_query)).scalar() or 0

    # Calculate trend percentage
    if reviews_last_month > 0:
        reviews_trend_pct = int(((reviews_this_month - reviews_last_month) / reviews_last_month) * 100)
    else:
        reviews_trend_pct = 100 if reviews_this_month > 0 else 0

    reviews_trend_direction = 'up' if reviews_trend_pct > 0 else ('down' if reviews_trend_pct < 0 else 'neutral')

    # Get percentile (rank among all users with reviews)
    reviews_percentile_query = (
        select(func.count(User.id))
        .where(User.total_reviews_given < reviews_given_current)
    )
    users_below = (await db.execute(reviews_percentile_query)).scalar() or 0

    total_users_with_reviews_query = (
        select(func.count(User.id))
        .where(User.total_reviews_given > 0)
    )
    total_users_with_reviews = (await db.execute(total_users_with_reviews_query)).scalar() or 1

    reviews_percentile = int((users_below / total_users_with_reviews) * 100) if total_users_with_reviews > 0 else 50

    # Get sparkline data (last 12 months)
    reviews_sparkline = []
    for i in range(11, -1, -1):
        month_offset = today.month - i - 1
        year = today.year + (month_offset // 12)
        month = ((month_offset % 12) + 12) % 12 + 1

        month_start = date(year, month, 1)
        if month == 12:
            month_end = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = date(year, month + 1, 1) - timedelta(days=1)

        count_query = (
            select(func.count(ReviewSlot.id))
            .where(
                and_(
                    ReviewSlot.reviewer_id == current_user.id,
                    ReviewSlot.submitted_at.isnot(None),
                    func.date(ReviewSlot.submitted_at) >= month_start,
                    func.date(ReviewSlot.submitted_at) <= month_end,
                )
            )
        )
        count = (await db.execute(count_query)).scalar() or 0
        reviews_sparkline.append(count)

    # ========== KARMA POINTS ==========
    karma_current = current_user.karma_points or 0

    # Get karma gained this month vs last month
    karma_this_month_query = (
        select(func.coalesce(func.sum(KarmaTransaction.points), 0))
        .where(
            and_(
                KarmaTransaction.user_id == current_user.id,
                func.date(KarmaTransaction.created_at) >= current_month_start,
            )
        )
    )
    karma_this_month = (await db.execute(karma_this_month_query)).scalar() or 0

    karma_last_month_query = (
        select(func.coalesce(func.sum(KarmaTransaction.points), 0))
        .where(
            and_(
                KarmaTransaction.user_id == current_user.id,
                func.date(KarmaTransaction.created_at) >= prev_month_start,
                func.date(KarmaTransaction.created_at) <= prev_month_end,
            )
        )
    )
    karma_last_month = (await db.execute(karma_last_month_query)).scalar() or 0

    if karma_last_month > 0:
        karma_trend_pct = int(((karma_this_month - karma_last_month) / karma_last_month) * 100)
    else:
        karma_trend_pct = 100 if karma_this_month > 0 else 0

    karma_trend_direction = 'up' if karma_trend_pct > 0 else ('down' if karma_trend_pct < 0 else 'neutral')

    # Karma percentile
    karma_percentile_query = (
        select(func.count(User.id))
        .where(User.karma_points < karma_current)
    )
    karma_users_below = (await db.execute(karma_percentile_query)).scalar() or 0

    total_users_query = select(func.count(User.id)).where(User.is_active == True)
    total_users = (await db.execute(total_users_query)).scalar() or 1

    karma_percentile = int((karma_users_below / total_users) * 100) if total_users > 0 else 50

    # Karma sparkline (monthly totals for last 12 months, cumulative style)
    karma_sparkline = []
    cumulative_karma = karma_current
    # Work backwards to calculate what karma was at each month
    for i in range(11, -1, -1):
        karma_sparkline.append(max(0, cumulative_karma))
        # For simplicity, subtract this month's gains to approximate previous totals
        if i > 0:
            month_offset = today.month - i
            year = today.year + ((month_offset - 1) // 12)
            month = ((month_offset - 1) % 12) + 1

            month_start = date(year, month, 1)
            if month == 12:
                month_end = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                month_end = date(year, month + 1, 1) - timedelta(days=1)

            monthly_karma_query = (
                select(func.coalesce(func.sum(KarmaTransaction.points), 0))
                .where(
                    and_(
                        KarmaTransaction.user_id == current_user.id,
                        func.date(KarmaTransaction.created_at) >= month_start,
                        func.date(KarmaTransaction.created_at) <= month_end,
                    )
                )
            )
            monthly_karma = (await db.execute(monthly_karma_query)).scalar() or 0
            cumulative_karma -= monthly_karma

    karma_sparkline.reverse()

    # ========== AVERAGE RATING ==========
    avg_rating_current = float(current_user.avg_rating or 0)

    # Rating percentile
    rating_percentile_query = (
        select(func.count(User.id))
        .where(
            and_(
                User.avg_rating.isnot(None),
                User.avg_rating < avg_rating_current,
            )
        )
    )
    rating_users_below = (await db.execute(rating_percentile_query)).scalar() or 0

    total_rated_users_query = (
        select(func.count(User.id))
        .where(User.avg_rating.isnot(None))
    )
    total_rated_users = (await db.execute(total_rated_users_query)).scalar() or 1

    rating_percentile = int((rating_users_below / total_rated_users) * 100) if total_rated_users > 0 else 50

    # Platform average for comparison
    platform_avg_query = (
        select(func.avg(User.avg_rating))
        .where(User.avg_rating.isnot(None))
    )
    platform_avg = (await db.execute(platform_avg_query)).scalar() or 0

    rating_comparison = "Above platform average" if avg_rating_current > float(platform_avg) else "At platform average"

    # ========== AVERAGE RESPONSE TIME ==========
    avg_response_current = current_user.avg_response_time_hours or 0

    # For response time, lower is better, so percentile calculation is inverted
    response_percentile_query = (
        select(func.count(User.id))
        .where(
            and_(
                User.avg_response_time_hours.isnot(None),
                User.avg_response_time_hours > avg_response_current,  # Higher (slower) is worse
            )
        )
    )
    response_users_slower = (await db.execute(response_percentile_query)).scalar() or 0

    total_response_users_query = (
        select(func.count(User.id))
        .where(User.avg_response_time_hours.isnot(None))
    )
    total_response_users = (await db.execute(total_response_users_query)).scalar() or 1

    response_percentile = int((response_users_slower / total_response_users) * 100) if total_response_users > 0 else 50

    response_comparison = f"Faster than {response_percentile}% of peers" if response_percentile > 0 else "Average response time"

    # Response time trend (estimate based on recent reviews)
    # This is simplified - we'd need to track historical response times for accurate trends
    response_trend_pct = 0
    response_trend_direction = 'neutral'

    return ProfileStatsWithContextResponse(
        reviews_given=StatWithContext(
            value=reviews_given_current,
            trend=TrendInfo(
                value=abs(reviews_trend_pct),
                direction=reviews_trend_direction,
                label="from last month",
            ) if reviews_trend_pct != 0 else None,
            percentile=reviews_percentile,
            comparison=f"Top {100 - reviews_percentile}% of reviewers" if reviews_percentile >= 50 else None,
            sparkline_data=reviews_sparkline,
        ),
        karma_points=StatWithContext(
            value=karma_current,
            trend=TrendInfo(
                value=abs(karma_trend_pct),
                direction=karma_trend_direction,
                label="from last month",
            ) if karma_trend_pct != 0 else None,
            percentile=karma_percentile,
            sparkline_data=karma_sparkline,
        ),
        avg_rating=StatWithContext(
            value=avg_rating_current,
            percentile=rating_percentile,
            comparison=rating_comparison,
        ),
        avg_response_time=StatWithContext(
            value=avg_response_current,
            trend=TrendInfo(
                value=abs(response_trend_pct),
                direction=response_trend_direction,
                label="faster than last month",
            ) if response_trend_pct != 0 else None,
            percentile=response_percentile,
            comparison=response_comparison,
        ),
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
