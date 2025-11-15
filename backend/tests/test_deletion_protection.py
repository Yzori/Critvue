"""
Tests for review request deletion protection

These tests verify that review requests cannot be deleted
when there are active claims or submitted reviews.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.models.review_request import ReviewRequest, ReviewType, ContentType
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.crud.review import ReviewCRUD


@pytest.mark.asyncio
async def test_prevent_deletion_with_claimed_slot(db: AsyncSession):
    """Test that review request cannot be deleted when a slot is claimed"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test description",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.FREE,
        reviews_requested=1,
        reviews_claimed=1,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create claimed slot
    claimed_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.CLAIMED.value,
        claimed_at=datetime.utcnow(),
        claim_deadline=datetime.utcnow() + timedelta(hours=72)
    )
    db.add(claimed_slot)
    await db.commit()

    # Try to delete the review request - should fail
    with pytest.raises(ValueError) as exc_info:
        await ReviewCRUD.delete_review_request(
            db,
            review_request.id,
            user_id=1,
            soft_delete=True
        )

    assert "cannot delete" in str(exc_info.value).lower()
    assert "active claim" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_prevent_deletion_with_submitted_review(db: AsyncSession):
    """Test that review request cannot be deleted when a review is submitted"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test description",
        content_type=ContentType.CODE,
        review_type=ReviewType.EXPERT,
        reviews_requested=1,
        reviews_claimed=1,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create submitted slot
    submitted_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.SUBMITTED.value,
        submitted_at=datetime.utcnow(),
        auto_accept_at=datetime.utcnow() + timedelta(days=7),
        review_text="This is a test review with sufficient length",
        rating=4
    )
    db.add(submitted_slot)
    await db.commit()

    # Try to delete the review request - should fail
    with pytest.raises(ValueError) as exc_info:
        await ReviewCRUD.delete_review_request(
            db,
            review_request.id,
            user_id=1,
            soft_delete=False  # Even hard delete should be prevented
        )

    assert "cannot delete" in str(exc_info.value).lower()
    assert "submitted" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_allow_deletion_with_available_slots(db: AsyncSession):
    """Test that review request can be deleted when all slots are available"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test description",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.FREE,
        reviews_requested=2,
        reviews_claimed=0,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create available slots (no claims)
    slot1 = ReviewSlot(
        review_request_id=review_request.id,
        status=ReviewSlotStatus.AVAILABLE.value
    )
    slot2 = ReviewSlot(
        review_request_id=review_request.id,
        status=ReviewSlotStatus.AVAILABLE.value
    )
    db.add_all([slot1, slot2])
    await db.commit()

    # Delete should succeed
    deleted = await ReviewCRUD.delete_review_request(
        db,
        review_request.id,
        user_id=1,
        soft_delete=True
    )

    assert deleted is True

    # Check soft delete worked
    await db.refresh(review_request)
    assert review_request.deleted_at is not None


@pytest.mark.asyncio
async def test_allow_deletion_with_rejected_slots(db: AsyncSession):
    """Test that review request can be deleted when reviews are rejected"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test description",
        content_type=ContentType.CODE,
        review_type=ReviewType.FREE,
        reviews_requested=1,
        reviews_claimed=0,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create rejected slot
    rejected_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.REJECTED.value,
        rejection_reason="low_quality",
        rejection_notes="Not detailed enough",
        reviewed_at=datetime.utcnow()
    )
    db.add(rejected_slot)
    await db.commit()

    # Delete should succeed (rejected reviews don't block deletion)
    deleted = await ReviewCRUD.delete_review_request(
        db,
        review_request.id,
        user_id=1,
        soft_delete=True
    )

    assert deleted is True


@pytest.mark.asyncio
async def test_allow_deletion_with_accepted_slots(db: AsyncSession):
    """Test that review request can be deleted when reviews are accepted"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test description",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.FREE,
        reviews_requested=1,
        reviews_claimed=1,
        reviews_completed=1,
        status="completed"
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create accepted slot
    accepted_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.ACCEPTED.value,
        acceptance_type="manual",
        reviewed_at=datetime.utcnow(),
        review_text="Great review",
        rating=5
    )
    db.add(accepted_slot)
    await db.commit()

    # Delete should succeed (accepted reviews don't block deletion)
    deleted = await ReviewCRUD.delete_review_request(
        db,
        review_request.id,
        user_id=1,
        soft_delete=True
    )

    assert deleted is True


@pytest.mark.asyncio
async def test_allow_deletion_with_abandoned_slots(db: AsyncSession):
    """Test that review request can be deleted when slots are abandoned"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test description",
        content_type=ContentType.CODE,
        review_type=ReviewType.FREE,
        reviews_requested=1,
        reviews_claimed=0,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create abandoned slot
    abandoned_slot = ReviewSlot(
        review_request_id=review_request.id,
        status=ReviewSlotStatus.ABANDONED.value
    )
    db.add(abandoned_slot)
    await db.commit()

    # Delete should succeed (abandoned slots don't block deletion)
    deleted = await ReviewCRUD.delete_review_request(
        db,
        review_request.id,
        user_id=1,
        soft_delete=True
    )

    assert deleted is True


@pytest.mark.asyncio
async def test_prevent_deletion_with_multiple_active_slots(db: AsyncSession):
    """Test deletion protection with multiple claimed/submitted slots"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review",
        description="Test description",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.EXPERT,
        reviews_requested=3,
        reviews_claimed=2,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create 1 claimed and 1 submitted slot
    claimed_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=2,
        status=ReviewSlotStatus.CLAIMED.value,
        claimed_at=datetime.utcnow(),
        claim_deadline=datetime.utcnow() + timedelta(hours=72)
    )
    submitted_slot = ReviewSlot(
        review_request_id=review_request.id,
        reviewer_id=3,
        status=ReviewSlotStatus.SUBMITTED.value,
        submitted_at=datetime.utcnow(),
        auto_accept_at=datetime.utcnow() + timedelta(days=7),
        review_text="Test review content",
        rating=4
    )
    available_slot = ReviewSlot(
        review_request_id=review_request.id,
        status=ReviewSlotStatus.AVAILABLE.value
    )
    db.add_all([claimed_slot, submitted_slot, available_slot])
    await db.commit()

    # Try to delete - should fail due to active slots
    with pytest.raises(ValueError) as exc_info:
        await ReviewCRUD.delete_review_request(
            db,
            review_request.id,
            user_id=1,
            soft_delete=True
        )

    error_msg = str(exc_info.value).lower()
    assert "cannot delete" in error_msg
    # Should mention there are 2 active claims/submissions
    assert "2" in str(exc_info.value)
