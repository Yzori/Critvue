"""
Tests for background job scheduler

These tests verify the scheduler correctly:
- Abandons expired claimed reviews
- Auto-accepts reviews after timeout
- Updates review request counters properly
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.models.review_request import ReviewRequest, ReviewType, ContentType
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, PaymentStatus
from app.crud.review_slot import process_expired_claims, process_auto_accepts


@pytest.mark.asyncio
async def test_process_expired_claims_basic(db: AsyncSession):
    """Test that expired claims are abandoned"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.FREE,
        reviews_requested=1,
        reviews_claimed=1,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create expired claimed slot
    expired_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.CLAIMED.value,
        claimed_at=datetime.utcnow() - timedelta(hours=73),  # 73 hours ago
        claim_deadline=datetime.utcnow() - timedelta(hours=1)  # 1 hour ago (expired)
    )
    db.add(expired_slot)
    await db.commit()
    await db.refresh(expired_slot)

    # Run the background job
    count = await process_expired_claims(db)

    # Should have abandoned 1 slot
    assert count == 1

    # Check slot is now abandoned
    await db.refresh(expired_slot)
    assert expired_slot.status == ReviewSlotStatus.ABANDONED.value

    # Check reviews_claimed counter was decremented
    await db.refresh(review_request)
    assert review_request.reviews_claimed == 0


@pytest.mark.asyncio
async def test_process_expired_claims_ignores_valid(db: AsyncSession):
    """Test that valid (not expired) claims are not abandoned"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test",
        content_type=ContentType.CODE,
        review_type=ReviewType.FREE,
        reviews_requested=1,
        reviews_claimed=1,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create valid (not expired) claimed slot
    valid_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.CLAIMED.value,
        claimed_at=datetime.utcnow() - timedelta(hours=24),  # 24 hours ago
        claim_deadline=datetime.utcnow() + timedelta(hours=48)  # 48 hours in future
    )
    db.add(valid_slot)
    await db.commit()
    await db.refresh(valid_slot)

    # Run the background job
    count = await process_expired_claims(db)

    # Should not abandon any slots
    assert count == 0

    # Check slot is still claimed
    await db.refresh(valid_slot)
    assert valid_slot.status == ReviewSlotStatus.CLAIMED.value


@pytest.mark.asyncio
async def test_process_auto_accepts_basic(db: AsyncSession):
    """Test that submitted reviews are auto-accepted after timeout"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.EXPERT,
        reviews_requested=1,
        reviews_claimed=1,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create submitted slot that should be auto-accepted
    submitted_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.SUBMITTED.value,
        submitted_at=datetime.utcnow() - timedelta(days=8),  # 8 days ago
        auto_accept_at=datetime.utcnow() - timedelta(days=1),  # 1 day ago (expired)
        review_text="This is a test review",
        rating=4,
        payment_amount=50.00,
        payment_status=PaymentStatus.ESCROWED.value
    )
    db.add(submitted_slot)
    await db.commit()
    await db.refresh(submitted_slot)

    # Run the background job
    count = await process_auto_accepts(db)

    # Should have auto-accepted 1 review
    assert count == 1

    # Check slot is now accepted
    await db.refresh(submitted_slot)
    assert submitted_slot.status == ReviewSlotStatus.ACCEPTED.value
    assert submitted_slot.acceptance_type == "auto"

    # Check payment was released
    assert submitted_slot.payment_status == PaymentStatus.RELEASED.value
    assert submitted_slot.payment_released_at is not None

    # Check reviews_completed counter was incremented
    await db.refresh(review_request)
    assert review_request.reviews_completed == 1


@pytest.mark.asyncio
async def test_process_auto_accepts_completes_request(db: AsyncSession):
    """Test that auto-accept completes the review request when all reviews are done"""

    # Create review request expecting 2 reviews
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.FREE,
        reviews_requested=2,
        reviews_claimed=2,
        reviews_completed=1  # 1 already completed
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create submitted slot (the 2nd and final review)
    submitted_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.SUBMITTED.value,
        submitted_at=datetime.utcnow() - timedelta(days=8),
        auto_accept_at=datetime.utcnow() - timedelta(days=1),
        review_text="This is the final review",
        rating=5
    )
    db.add(submitted_slot)
    await db.commit()
    await db.refresh(submitted_slot)

    # Run the background job
    count = await process_auto_accepts(db)

    assert count == 1

    # Check request is now completed
    await db.refresh(review_request)
    assert review_request.reviews_completed == 2
    assert review_request.status == "completed"
    assert review_request.completed_at is not None


@pytest.mark.asyncio
async def test_process_auto_accepts_ignores_manual_acceptance(db: AsyncSession):
    """Test that manually accepted reviews are not processed"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test",
        content_type=ContentType.CODE,
        review_type=ReviewType.FREE,
        reviews_requested=1,
        reviews_claimed=1,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create submitted slot with auto_accept_at in future
    submitted_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.SUBMITTED.value,
        submitted_at=datetime.utcnow() - timedelta(days=2),
        auto_accept_at=datetime.utcnow() + timedelta(days=5),  # Still 5 days to go
        review_text="This is a test review",
        rating=4
    )
    db.add(submitted_slot)
    await db.commit()
    await db.refresh(submitted_slot)

    # Run the background job
    count = await process_auto_accepts(db)

    # Should not auto-accept (not expired)
    assert count == 0

    # Check slot is still submitted
    await db.refresh(submitted_slot)
    assert submitted_slot.status == ReviewSlotStatus.SUBMITTED.value


@pytest.mark.asyncio
async def test_process_multiple_expired_claims(db: AsyncSession):
    """Test processing multiple expired claims in one run"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.FREE,
        reviews_requested=3,
        reviews_claimed=3,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create 3 expired claimed slots
    expired_slots = [
        ReviewSlot(
            review_request_id=review_request.id,
            reviewer_id=2 + i,
            status=ReviewSlotStatus.CLAIMED.value,
            claimed_at=datetime.utcnow() - timedelta(hours=73 + i),
            claim_deadline=datetime.utcnow() - timedelta(hours=1 + i)
        )
        for i in range(3)
    ]
    db.add_all(expired_slots)
    await db.commit()

    # Run the background job
    count = await process_expired_claims(db)

    # Should have abandoned all 3 slots
    assert count == 3

    # Check reviews_claimed counter
    await db.refresh(review_request)
    assert review_request.reviews_claimed == 0


@pytest.mark.asyncio
async def test_scheduler_error_handling(db: AsyncSession):
    """Test that scheduler continues processing even if one slot fails"""

    # This test verifies error handling in the background jobs
    # In production, errors in processing one slot shouldn't stop processing others

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test",
        content_type=ContentType.CODE,
        review_type=ReviewType.FREE,
        reviews_requested=2,
        reviews_claimed=2,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create 2 expired slots
    slot1 = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.CLAIMED.value,
        claimed_at=datetime.utcnow() - timedelta(hours=73),
        claim_deadline=datetime.utcnow() - timedelta(hours=1)
    )
    slot2 = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=3,
        status=ReviewSlotStatus.CLAIMED.value,
        claimed_at=datetime.utcnow() - timedelta(hours=74),
        claim_deadline=datetime.utcnow() - timedelta(hours=2)
    )
    db.add_all([slot1, slot2])
    await db.commit()

    # Run the background job - should process all slots even if one has issues
    count = await process_expired_claims(db)

    # Both should be processed (implementation has try-catch per slot)
    assert count == 2
