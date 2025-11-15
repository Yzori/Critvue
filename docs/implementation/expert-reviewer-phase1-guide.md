# Expert Reviewer System - Phase 1 Implementation Guide

## Overview

This guide provides detailed implementation instructions for **Phase 1: Foundation** of the Expert Reviewer System.

**Timeline**: 3 weeks
**Team**: 1 Backend Engineer, 1 Frontend Engineer
**Dependencies**: Current review slot system, user authentication

---

## Week 1: Database Schema & Models

### Task 1.1: Create Database Migration

**File**: `/home/user/Critvue/backend/alembic/versions/XXXXXX_add_expert_reviewer_system.py`

```python
"""Add expert reviewer system - Phase 1

Revision ID: XXXXXX
Revises: [previous_revision]
Create Date: 2025-11-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'XXXXXX'
down_revision = '[previous_revision]'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create reviewer_profiles table
    op.create_table(
        'reviewer_profiles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),

        # Tier & Status
        sa.Column('tier', sa.String(20), nullable=False, default='beginner', server_default='beginner'),
        sa.Column('tier_since', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('previous_tier', sa.String(20), nullable=True),
        sa.Column('tier_downgraded_at', sa.DateTime(), nullable=True),

        # Qualification Status
        sa.Column('is_active_reviewer', sa.Boolean(), default=True, server_default='true'),
        sa.Column('is_accepting_reviews', sa.Boolean(), default=True, server_default='true'),
        sa.Column('last_review_at', sa.DateTime(), nullable=True),

        # Performance Metrics (cached)
        sa.Column('total_reviews_completed', sa.Integer(), default=0, server_default='0'),
        sa.Column('total_paid_reviews', sa.Integer(), default=0, server_default='0'),
        sa.Column('acceptance_rate', sa.Numeric(5, 4), nullable=True),  # 0.0000 to 1.0000
        sa.Column('average_helpful_rating', sa.Numeric(3, 2), nullable=True),  # 1.00 to 5.00
        sa.Column('avg_response_time_hours', sa.Integer(), nullable=True),

        # Quality Indicators
        sa.Column('exceptional_review_count', sa.Integer(), default=0, server_default='0'),
        sa.Column('total_earnings', sa.Numeric(12, 2), default=0, server_default='0.00'),
        sa.Column('dispute_count', sa.Integer(), default=0, server_default='0'),
        sa.Column('successful_dispute_count', sa.Integer(), default=0, server_default='0'),

        # Probation/Warning System
        sa.Column('on_probation', sa.Boolean(), default=False, server_default='false'),
        sa.Column('probation_started_at', sa.DateTime(), nullable=True),
        sa.Column('probation_reason', sa.Text(), nullable=True),
        sa.Column('warning_count', sa.Integer(), default=0, server_default='0'),
        sa.Column('last_warning_at', sa.DateTime(), nullable=True),

        # Activity Tracking
        sa.Column('reviews_this_month', sa.Integer(), default=0, server_default='0'),
        sa.Column('reviews_last_30_days', sa.Integer(), default=0, server_default='0'),
        sa.Column('longest_streak_days', sa.Integer(), default=0, server_default='0'),
        sa.Column('current_streak_days', sa.Integer(), default=0, server_default='0'),

        # Profile Completeness
        sa.Column('profile_completeness_pct', sa.Integer(), default=0, server_default='0'),
        sa.Column('has_portfolio', sa.Boolean(), default=False, server_default='false'),
        sa.Column('portfolio_reviewed', sa.Boolean(), default=False, server_default='false'),

        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Indexes for reviewer_profiles
    op.create_index('idx_reviewer_tier', 'reviewer_profiles', ['tier'])
    op.create_index('idx_reviewer_active', 'reviewer_profiles', ['is_active_reviewer', 'is_accepting_reviews'])
    op.create_index('idx_reviewer_performance', 'reviewer_profiles', ['tier', 'acceptance_rate', 'average_helpful_rating'])

    # 2. Create reviewer_tier_history table
    op.create_table(
        'reviewer_tier_history',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('reviewer_profile_id', sa.Integer(), sa.ForeignKey('reviewer_profiles.id', ondelete='CASCADE'), nullable=False),

        # Change Details
        sa.Column('from_tier', sa.String(20), nullable=True),
        sa.Column('to_tier', sa.String(20), nullable=False),
        sa.Column('change_type', sa.String(20), nullable=False),  # 'promotion', 'demotion', 'reinstatement'

        # Reason & Context
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('triggered_by', sa.String(20), nullable=True),  # 'automatic', 'admin_review', 'performance', 'inactivity'
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('changed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),  # Admin who made change

        # Metrics Snapshot
        sa.Column('metrics_snapshot', postgresql.JSONB(), nullable=True),

        # Timestamp
        sa.Column('changed_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_index('idx_tier_history_profile', 'reviewer_tier_history', ['reviewer_profile_id', 'changed_at'])

    # 3. Create review_quality_feedback table
    op.create_table(
        'review_quality_feedback',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('review_slot_id', sa.Integer(), sa.ForeignKey('review_slots.id', ondelete='CASCADE'), nullable=False, unique=True),

        # Multi-dimensional Quality Ratings (1-5 scale)
        sa.Column('thoroughness_rating', sa.Integer(), nullable=True),
        sa.Column('accuracy_rating', sa.Integer(), nullable=True),
        sa.Column('clarity_rating', sa.Integer(), nullable=True),
        sa.Column('actionability_rating', sa.Integer(), nullable=True),
        sa.Column('professionalism_rating', sa.Integer(), nullable=True),

        # Overall Impact
        sa.Column('would_recommend_reviewer', sa.Boolean(), nullable=True),
        sa.Column('exceptional_review', sa.Boolean(), default=False, server_default='false'),

        # Qualitative Feedback
        sa.Column('feedback_text', sa.Text(), nullable=True),
        sa.Column('private_notes', sa.Text(), nullable=True),

        # Metadata
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_index('idx_quality_exceptional', 'review_quality_feedback', ['exceptional_review'])

    # 4. Add columns to review_slots table
    op.add_column('review_slots', sa.Column('reviewer_tier', sa.String(20), nullable=True))
    op.add_column('review_slots', sa.Column('complexity_level', sa.String(20), nullable=True))
    op.add_column('review_slots', sa.Column('quality_score', sa.Numeric(5, 2), nullable=True))

    op.create_index('idx_slot_reviewer_tier', 'review_slots', ['reviewer_tier'])


def downgrade():
    # Remove indexes
    op.drop_index('idx_slot_reviewer_tier', 'review_slots')
    op.drop_index('idx_quality_exceptional', 'review_quality_feedback')
    op.drop_index('idx_tier_history_profile', 'reviewer_tier_history')
    op.drop_index('idx_reviewer_performance', 'reviewer_profiles')
    op.drop_index('idx_reviewer_active', 'reviewer_profiles')
    op.drop_index('idx_reviewer_tier', 'reviewer_profiles')

    # Remove columns from review_slots
    op.drop_column('review_slots', 'quality_score')
    op.drop_column('review_slots', 'complexity_level')
    op.drop_column('review_slots', 'reviewer_tier')

    # Drop tables
    op.drop_table('review_quality_feedback')
    op.drop_table('reviewer_tier_history')
    op.drop_table('reviewer_profiles')
```

### Task 1.2: Create SQLAlchemy Models

**File**: `/home/user/Critvue/backend/app/models/reviewer_profile.py`

```python
"""Reviewer Profile database models"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.user import User


class ReviewerTier(str, enum.Enum):
    """Reviewer tier levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERT = "expert"
    MASTER = "master"
    ELITE = "elite"


class TierChangeType(str, enum.Enum):
    """Types of tier changes"""
    PROMOTION = "promotion"
    DEMOTION = "demotion"
    REINSTATEMENT = "reinstatement"


class ReviewerProfile(Base):
    """Extended profile for reviewers with tier and performance tracking"""

    __tablename__ = "reviewer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Tier & Status
    tier = Column(String(20), nullable=False, default=ReviewerTier.BEGINNER.value)
    tier_since = Column(DateTime, nullable=False, default=datetime.utcnow)
    previous_tier = Column(String(20), nullable=True)
    tier_downgraded_at = Column(DateTime, nullable=True)

    # Qualification Status
    is_active_reviewer = Column(Boolean, default=True, nullable=False)
    is_accepting_reviews = Column(Boolean, default=True, nullable=False)
    last_review_at = Column(DateTime, nullable=True)

    # Performance Metrics (cached for quick access)
    total_reviews_completed = Column(Integer, default=0, nullable=False)
    total_paid_reviews = Column(Integer, default=0, nullable=False)
    acceptance_rate = Column(Numeric(5, 4), nullable=True)
    average_helpful_rating = Column(Numeric(3, 2), nullable=True)
    avg_response_time_hours = Column(Integer, nullable=True)

    # Quality Indicators
    exceptional_review_count = Column(Integer, default=0, nullable=False)
    total_earnings = Column(Numeric(12, 2), default=0, nullable=False)
    dispute_count = Column(Integer, default=0, nullable=False)
    successful_dispute_count = Column(Integer, default=0, nullable=False)

    # Probation/Warning System
    on_probation = Column(Boolean, default=False, nullable=False)
    probation_started_at = Column(DateTime, nullable=True)
    probation_reason = Column(Text, nullable=True)
    warning_count = Column(Integer, default=0, nullable=False)
    last_warning_at = Column(DateTime, nullable=True)

    # Activity Tracking
    reviews_this_month = Column(Integer, default=0, nullable=False)
    reviews_last_30_days = Column(Integer, default=0, nullable=False)
    longest_streak_days = Column(Integer, default=0, nullable=False)
    current_streak_days = Column(Integer, default=0, nullable=False)

    # Profile Completeness
    profile_completeness_pct = Column(Integer, default=0, nullable=False)
    has_portfolio = Column(Boolean, default=False, nullable=False)
    portfolio_reviewed = Column(Boolean, default=False, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="reviewer_profile")
    tier_history = relationship("ReviewerTierHistory", back_populates="reviewer_profile", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ReviewerProfile user_id={self.user_id} tier={self.tier}>"

    # ===== Tier Qualification Methods =====

    @property
    def tier_enum(self) -> ReviewerTier:
        """Get tier as enum"""
        return ReviewerTier(self.tier)

    def get_tier_requirements(self) -> dict:
        """Get requirements for current tier"""
        return TIER_REQUIREMENTS.get(self.tier_enum, {})

    def get_next_tier_requirements(self) -> Optional[dict]:
        """Get requirements for next tier"""
        tier_order = [ReviewerTier.BEGINNER, ReviewerTier.INTERMEDIATE, ReviewerTier.EXPERT, ReviewerTier.MASTER, ReviewerTier.ELITE]
        current_idx = tier_order.index(self.tier_enum)

        if current_idx < len(tier_order) - 1:
            next_tier = tier_order[current_idx + 1]
            return TIER_REQUIREMENTS.get(next_tier, {})

        return None  # Already at highest tier

    def meets_tier_requirements(self, target_tier: ReviewerTier) -> tuple[bool, list[str]]:
        """
        Check if reviewer meets requirements for target tier

        Returns:
            (meets_requirements: bool, missing_criteria: list[str])
        """
        requirements = TIER_REQUIREMENTS.get(target_tier, {})
        if not requirements:
            return False, ["Invalid tier"]

        missing = []

        # Check minimum reviews
        if self.total_reviews_completed < requirements.get('min_total_reviews', 0):
            missing.append(f"Need {requirements['min_total_reviews']} total reviews (have {self.total_reviews_completed})")

        # Check paid reviews (if applicable)
        if requirements.get('min_paid_reviews', 0) > 0 and self.total_paid_reviews < requirements['min_paid_reviews']:
            missing.append(f"Need {requirements['min_paid_reviews']} paid reviews (have {self.total_paid_reviews})")

        # Check acceptance rate
        if self.acceptance_rate is None or float(self.acceptance_rate) < requirements.get('min_acceptance_rate', 0):
            current_rate = float(self.acceptance_rate) if self.acceptance_rate else 0
            missing.append(f"Acceptance rate must be ≥{requirements['min_acceptance_rate']*100:.0f}% (currently {current_rate*100:.1f}%)")

        # Check average rating
        if self.average_helpful_rating is None or float(self.average_helpful_rating) < requirements.get('min_avg_rating', 0):
            current_rating = float(self.average_helpful_rating) if self.average_helpful_rating else 0
            missing.append(f"Average rating must be ≥{requirements['min_avg_rating']:.1f} (currently {current_rating:.1f})")

        # Check response time (if specified)
        if requirements.get('max_response_time_hours'):
            if self.avg_response_time_hours is None or self.avg_response_time_hours > requirements['max_response_time_hours']:
                missing.append(f"Response time must be ≤{requirements['max_response_time_hours']}h (currently {self.avg_response_time_hours or 'N/A'}h)")

        # Check profile completeness
        if self.profile_completeness_pct < requirements.get('min_profile_completeness', 0):
            missing.append(f"Profile must be {requirements['min_profile_completeness']}% complete (currently {self.profile_completeness_pct}%)")

        # Check if on probation
        if self.on_probation and target_tier != ReviewerTier.BEGINNER:
            missing.append("Cannot advance while on probation")

        return len(missing) == 0, missing


# Tier Requirements Configuration
TIER_REQUIREMENTS = {
    ReviewerTier.BEGINNER: {
        'min_total_reviews': 0,
        'min_paid_reviews': 0,
        'min_acceptance_rate': 0.0,
        'min_avg_rating': 0.0,
        'min_profile_completeness': 0,
        'description': 'Starting tier for all new reviewers'
    },
    ReviewerTier.INTERMEDIATE: {
        'min_total_reviews': 10,
        'min_paid_reviews': 0,
        'min_acceptance_rate': 0.85,
        'min_avg_rating': 4.0,
        'min_profile_completeness': 80,
        'max_response_time_hours': None,
        'description': 'Proven quality, entry to paid market'
    },
    ReviewerTier.EXPERT: {
        'min_total_reviews': 30,
        'min_paid_reviews': 15,
        'min_acceptance_rate': 0.90,
        'min_avg_rating': 4.3,
        'min_profile_completeness': 90,
        'max_response_time_hours': 48,
        'description': 'Established expertise, specialized skills'
    },
    ReviewerTier.MASTER: {
        'min_total_reviews': 100,
        'min_paid_reviews': 50,
        'min_acceptance_rate': 0.93,
        'min_avg_rating': 4.5,
        'min_profile_completeness': 100,
        'max_response_time_hours': 36,
        'exceptional_review_percentage': 0.25,
        'description': 'Top performers, domain authority'
    },
    ReviewerTier.ELITE: {
        'min_total_reviews': 250,
        'min_paid_reviews': 100,
        'min_acceptance_rate': 0.95,
        'min_avg_rating': 4.7,
        'min_profile_completeness': 100,
        'max_response_time_hours': 24,
        'exceptional_review_percentage': 0.40,
        'description': 'Platform ambassadors, proven excellence'
    }
}


class ReviewerTierHistory(Base):
    """History of tier changes for audit trail"""

    __tablename__ = "reviewer_tier_history"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_profile_id = Column(Integer, ForeignKey("reviewer_profiles.id", ondelete="CASCADE"), nullable=False)

    # Change Details
    from_tier = Column(String(20), nullable=True)
    to_tier = Column(String(20), nullable=False)
    change_type = Column(String(20), nullable=False)

    # Reason & Context
    reason = Column(Text, nullable=True)
    triggered_by = Column(String(20), nullable=True)
    admin_notes = Column(Text, nullable=True)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Metrics Snapshot
    metrics_snapshot = Column(JSONB, nullable=True)

    # Timestamp
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    reviewer_profile = relationship("ReviewerProfile", back_populates="tier_history")

    def __repr__(self) -> str:
        return f"<ReviewerTierHistory {self.from_tier} → {self.to_tier} ({self.change_type})>"


class ReviewQualityFeedback(Base):
    """Multi-dimensional quality feedback for reviews"""

    __tablename__ = "review_quality_feedback"

    id = Column(Integer, primary_key=True, index=True)
    review_slot_id = Column(Integer, ForeignKey("review_slots.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Multi-dimensional Quality Ratings (1-5 scale)
    thoroughness_rating = Column(Integer, nullable=True)
    accuracy_rating = Column(Integer, nullable=True)
    clarity_rating = Column(Integer, nullable=True)
    actionability_rating = Column(Integer, nullable=True)
    professionalism_rating = Column(Integer, nullable=True)

    # Overall Impact
    would_recommend_reviewer = Column(Boolean, nullable=True)
    exceptional_review = Column(Boolean, default=False, nullable=False)

    # Qualitative Feedback
    feedback_text = Column(Text, nullable=True)
    private_notes = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    review_slot = relationship("ReviewSlot", backref="quality_feedback")

    def __repr__(self) -> str:
        return f"<ReviewQualityFeedback slot_id={self.review_slot_id} exceptional={self.exceptional_review}>"

    @property
    def quality_score(self) -> Optional[float]:
        """
        Calculate composite quality score (0-100)
        """
        ratings = [
            self.thoroughness_rating,
            self.accuracy_rating,
            self.clarity_rating,
            self.actionability_rating,
            self.professionalism_rating
        ]

        # Filter out None values
        valid_ratings = [r for r in ratings if r is not None]

        if not valid_ratings:
            return None

        # Weights for each dimension
        weights = {
            'thoroughness': 0.25,
            'accuracy': 0.25,
            'clarity': 0.20,
            'actionability': 0.20,
            'professionalism': 0.10
        }

        # Normalize each 1-5 rating to 0-100 scale
        weighted_score = 0
        if self.thoroughness_rating:
            weighted_score += ((self.thoroughness_rating - 1) / 4 * 100) * weights['thoroughness']
        if self.accuracy_rating:
            weighted_score += ((self.accuracy_rating - 1) / 4 * 100) * weights['accuracy']
        if self.clarity_rating:
            weighted_score += ((self.clarity_rating - 1) / 4 * 100) * weights['clarity']
        if self.actionability_rating:
            weighted_score += ((self.actionability_rating - 1) / 4 * 100) * weights['actionability']
        if self.professionalism_rating:
            weighted_score += ((self.professionalism_rating - 1) / 4 * 100) * weights['professionalism']

        # Bonus for exceptional reviews
        if self.exceptional_review:
            weighted_score = min(100, weighted_score + 5)

        return round(weighted_score, 2)
```

---

## Week 2: Backend API & Business Logic

### Task 2.1: CRUD Operations for Reviewer Profiles

**File**: `/home/user/Critvue/backend/app/crud/reviewer_profile.py`

```python
"""CRUD operations for reviewer profiles"""

import logging
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reviewer_profile import (
    ReviewerProfile,
    ReviewerTier,
    ReviewerTierHistory,
    TierChangeType,
    ReviewQualityFeedback,
    TIER_REQUIREMENTS
)
from app.models.review_slot import ReviewSlot, ReviewSlotStatus

logger = logging.getLogger(__name__)


# ===== Create Operations =====

async def create_reviewer_profile(
    db: AsyncSession,
    user_id: int
) -> ReviewerProfile:
    """
    Create a new reviewer profile (default Beginner tier)
    """
    profile = ReviewerProfile(
        user_id=user_id,
        tier=ReviewerTier.BEGINNER.value,
        tier_since=datetime.utcnow()
    )

    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    # Create tier history entry
    await _create_tier_history_entry(
        db=db,
        reviewer_profile_id=profile.id,
        from_tier=None,
        to_tier=ReviewerTier.BEGINNER.value,
        change_type=TierChangeType.PROMOTION,
        reason="Initial reviewer registration",
        triggered_by="automatic"
    )

    logger.info(f"Created reviewer profile for user_id={user_id}")
    return profile


# ===== Read Operations =====

async def get_reviewer_profile(
    db: AsyncSession,
    user_id: int
) -> Optional[ReviewerProfile]:
    """Get reviewer profile by user_id"""
    query = select(ReviewerProfile).where(ReviewerProfile.user_id == user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_or_create_reviewer_profile(
    db: AsyncSession,
    user_id: int
) -> ReviewerProfile:
    """Get existing profile or create new one"""
    profile = await get_reviewer_profile(db, user_id)

    if not profile:
        profile = await create_reviewer_profile(db, user_id)

    return profile


# ===== Update Operations =====

async def update_reviewer_metrics(
    db: AsyncSession,
    user_id: int
) -> ReviewerProfile:
    """
    Recalculate and update all performance metrics for a reviewer
    Called after review acceptance/rejection
    """
    profile = await get_or_create_reviewer_profile(db, user_id)

    # Get all review slots for this reviewer
    slots_query = select(ReviewSlot).where(ReviewSlot.reviewer_id == user_id)
    slots_result = await db.execute(slots_query)
    all_slots = list(slots_result.scalars().all())

    # Calculate total reviews completed
    completed_slots = [
        s for s in all_slots
        if s.status in [ReviewSlotStatus.ACCEPTED.value, ReviewSlotStatus.REJECTED.value]
    ]
    profile.total_reviews_completed = len(completed_slots)

    # Calculate paid reviews
    paid_slots = [s for s in completed_slots if s.payment_amount and s.payment_amount > 0]
    profile.total_paid_reviews = len(paid_slots)

    # Calculate acceptance rate
    if completed_slots:
        accepted = len([s for s in completed_slots if s.status == ReviewSlotStatus.ACCEPTED.value])
        profile.acceptance_rate = accepted / len(completed_slots)
    else:
        profile.acceptance_rate = None

    # Calculate average helpful rating
    rated_slots = [s for s in completed_slots if s.requester_helpful_rating is not None]
    if rated_slots:
        profile.average_helpful_rating = sum(s.requester_helpful_rating for s in rated_slots) / len(rated_slots)
    else:
        profile.average_helpful_rating = None

    # Calculate average response time
    slots_with_times = [
        s for s in completed_slots
        if s.claimed_at and s.submitted_at
    ]
    if slots_with_times:
        response_times = [(s.submitted_at - s.claimed_at).total_seconds() / 3600 for s in slots_with_times]
        profile.avg_response_time_hours = int(sum(response_times) / len(response_times))
    else:
        profile.avg_response_time_hours = None

    # Count exceptional reviews
    exceptional_query = (
        select(func.count(ReviewQualityFeedback.id))
        .join(ReviewSlot)
        .where(
            and_(
                ReviewSlot.reviewer_id == user_id,
                ReviewQualityFeedback.exceptional_review == True
            )
        )
    )
    exceptional_result = await db.execute(exceptional_query)
    profile.exceptional_review_count = exceptional_result.scalar() or 0

    # Calculate total earnings
    accepted_paid = [
        s for s in all_slots
        if s.status == ReviewSlotStatus.ACCEPTED.value and s.payment_amount
    ]
    profile.total_earnings = sum(float(s.payment_amount) for s in accepted_paid)

    # Count disputes
    profile.dispute_count = len([s for s in all_slots if s.is_disputed])
    # Note: successful_dispute_count updated when dispute resolved in favor of creator

    # Reviews in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_reviews = [
        s for s in completed_slots
        if s.reviewed_at and s.reviewed_at >= thirty_days_ago
    ]
    profile.reviews_last_30_days = len(recent_reviews)

    # Last review date
    if completed_slots:
        latest_review = max(completed_slots, key=lambda s: s.reviewed_at or s.updated_at)
        profile.last_review_at = latest_review.reviewed_at or latest_review.updated_at

    profile.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(profile)

    logger.info(f"Updated metrics for reviewer profile user_id={user_id}")
    return profile


async def check_and_advance_tier(
    db: AsyncSession,
    user_id: int
) -> Optional[ReviewerProfile]:
    """
    Check if reviewer qualifies for tier advancement and promote if eligible
    Returns updated profile if promoted, None otherwise
    """
    profile = await get_reviewer_profile(db, user_id)
    if not profile:
        return None

    # Don't advance if on probation
    if profile.on_probation:
        return None

    # Check next tier requirements
    tier_order = [ReviewerTier.BEGINNER, ReviewerTier.INTERMEDIATE, ReviewerTier.EXPERT, ReviewerTier.MASTER, ReviewerTier.ELITE]
    current_idx = tier_order.index(profile.tier_enum)

    # Already at highest tier
    if current_idx >= len(tier_order) - 1:
        return None

    next_tier = tier_order[current_idx + 1]

    # Check if meets requirements
    meets_requirements, missing = profile.meets_tier_requirements(next_tier)

    if meets_requirements:
        # Promote!
        await promote_reviewer(
            db=db,
            reviewer_profile_id=profile.id,
            to_tier=next_tier,
            reason="Automatic advancement - met all requirements",
            triggered_by="automatic"
        )

        logger.info(f"Promoted reviewer user_id={user_id} from {profile.tier} to {next_tier.value}")
        return profile

    return None


async def promote_reviewer(
    db: AsyncSession,
    reviewer_profile_id: int,
    to_tier: ReviewerTier,
    reason: str,
    triggered_by: str = "automatic",
    admin_id: Optional[int] = None
) -> ReviewerProfile:
    """Promote reviewer to higher tier"""
    profile = await db.get(ReviewerProfile, reviewer_profile_id)
    if not profile:
        raise ValueError(f"Reviewer profile {reviewer_profile_id} not found")

    from_tier = profile.tier

    # Update tier
    profile.previous_tier = from_tier
    profile.tier = to_tier.value
    profile.tier_since = datetime.utcnow()
    profile.updated_at = datetime.utcnow()

    # Create history entry
    await _create_tier_history_entry(
        db=db,
        reviewer_profile_id=profile.id,
        from_tier=from_tier,
        to_tier=to_tier.value,
        change_type=TierChangeType.PROMOTION,
        reason=reason,
        triggered_by=triggered_by,
        changed_by=admin_id,
        metrics_snapshot=_capture_metrics_snapshot(profile)
    )

    await db.commit()
    await db.refresh(profile)

    return profile


# ===== Helper Functions =====

async def _create_tier_history_entry(
    db: AsyncSession,
    reviewer_profile_id: int,
    from_tier: Optional[str],
    to_tier: str,
    change_type: TierChangeType,
    reason: str,
    triggered_by: str,
    changed_by: Optional[int] = None,
    metrics_snapshot: Optional[dict] = None
):
    """Create tier history entry"""
    history = ReviewerTierHistory(
        reviewer_profile_id=reviewer_profile_id,
        from_tier=from_tier,
        to_tier=to_tier,
        change_type=change_type.value,
        reason=reason,
        triggered_by=triggered_by,
        changed_by=changed_by,
        metrics_snapshot=metrics_snapshot
    )

    db.add(history)
    await db.commit()


def _capture_metrics_snapshot(profile: ReviewerProfile) -> dict:
    """Capture current metrics for history"""
    return {
        'total_reviews_completed': profile.total_reviews_completed,
        'total_paid_reviews': profile.total_paid_reviews,
        'acceptance_rate': float(profile.acceptance_rate) if profile.acceptance_rate else None,
        'average_helpful_rating': float(profile.average_helpful_rating) if profile.average_helpful_rating else None,
        'avg_response_time_hours': profile.avg_response_time_hours,
        'exceptional_review_count': profile.exceptional_review_count,
        'total_earnings': float(profile.total_earnings),
        'timestamp': datetime.utcnow().isoformat()
    }
```

This implementation guide provides all the database schemas, models, and core CRUD operations needed for Phase 1. Would you like me to continue with the API endpoints and frontend components?

---

## Summary of Phase 1 Deliverables

**Database**:
- reviewer_profiles table
- reviewer_tier_history table
- review_quality_feedback table
- Enhanced review_slots table

**Models**:
- ReviewerProfile with tier qualification logic
- ReviewerTierHistory for audit trail
- ReviewQualityFeedback for multi-dimensional ratings
- TIER_REQUIREMENTS configuration

**CRUD Operations**:
- Create/get reviewer profiles
- Update performance metrics automatically
- Check and advance tiers based on criteria
- Track tier history for transparency

**Next Steps** (Week 3):
- API endpoints for reviewer profile management
- Quality feedback submission endpoints
- Frontend components for tier display
- Reviewer dashboard with progress tracking
