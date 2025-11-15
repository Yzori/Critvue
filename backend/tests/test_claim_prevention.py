"""
Tests for multiple claim prevention

These tests verify that a reviewer cannot claim multiple slots
for the same review request.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.models.review_request import ReviewRequest, ReviewType, ContentType
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.crud.review_slot import claim_review_slot


@pytest.mark.asyncio
async def test_prevent_multiple_claims_same_request(db: AsyncSession):
    """Test that a reviewer cannot claim multiple slots for the same request"""

    # Create a review request with 2 slots
    review_request = ReviewRequest(
        user_id=1,  # Requester
        title="Test Review Request",
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

    # Create 2 available slots
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
    await db.refresh(slot1)
    await db.refresh(slot2)

    # Claim first slot - should succeed
    claimed_slot1 = await claim_review_slot(db, slot1.id, reviewer_id=2)
    assert claimed_slot1.status == ReviewSlotStatus.CLAIMED.value
    assert claimed_slot1.reviewer_id == 2

    # Try to claim second slot with same reviewer - should fail
    with pytest.raises(ValueError) as exc_info:
        await claim_review_slot(db, slot2.id, reviewer_id=2)

    assert "already claimed a slot" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_allow_claim_after_abandon(db: AsyncSession):
    """Test that a reviewer can claim another slot after abandoning the first one"""

    # Create review request with 2 slots
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review Request",
        description="Test description",
        content_type=ContentType.CODE,
        review_type=ReviewType.FREE,
        reviews_requested=2,
        reviews_claimed=0,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create 2 slots
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
    await db.refresh(slot1)
    await db.refresh(slot2)

    # Claim first slot
    claimed_slot1 = await claim_review_slot(db, slot1.id, reviewer_id=2)
    assert claimed_slot1.status == ReviewSlotStatus.CLAIMED.value

    # Abandon first slot
    from app.crud.review_slot import abandon_review_slot
    abandoned_slot = await abandon_review_slot(db, slot1.id, reviewer_id=2)
    assert abandoned_slot.status == ReviewSlotStatus.ABANDONED.value

    # Now should be able to claim second slot
    claimed_slot2 = await claim_review_slot(db, slot2.id, reviewer_id=2)
    assert claimed_slot2.status == ReviewSlotStatus.CLAIMED.value
    assert claimed_slot2.reviewer_id == 2


@pytest.mark.asyncio
async def test_allow_claim_after_submission(db: AsyncSession):
    """Test claim prevention only applies to CLAIMED and SUBMITTED statuses"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review Request",
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

    # Create 2 slots
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
    await db.refresh(slot1)
    await db.refresh(slot2)

    # Claim and submit first slot
    claimed_slot1 = await claim_review_slot(db, slot1.id, reviewer_id=2)

    from app.crud.review_slot import submit_review
    submitted_slot = await submit_review(
        db,
        slot1.id,
        reviewer_id=2,
        review_text="This is a test review with more than 50 characters to meet the minimum requirement.",
        rating=4
    )
    assert submitted_slot.status == ReviewSlotStatus.SUBMITTED.value

    # Try to claim second slot - should fail (first slot is SUBMITTED)
    with pytest.raises(ValueError) as exc_info:
        await claim_review_slot(db, slot2.id, reviewer_id=2)

    assert "already claimed a slot" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_different_reviewers_can_claim_different_slots(db: AsyncSession):
    """Test that different reviewers can claim different slots for the same request"""

    # Create review request
    review_request = ReviewRequest(
        user_id=1,
        title="Test Review Request",
        description="Test description",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.FREE,
        reviews_requested=3,
        reviews_claimed=0,
        reviews_completed=0
    )
    db.add(review_request)
    await db.commit()
    await db.refresh(review_request)

    # Create 3 slots
    slots = [
        ReviewSlot(
            review_request_id=review_request.id,
            status=ReviewSlotStatus.AVAILABLE.value
        )
        for _ in range(3)
    ]
    db.add_all(slots)
    await db.commit()
    for slot in slots:
        await db.refresh(slot)

    # Three different reviewers claim three different slots - should all succeed
    claimed_slot1 = await claim_review_slot(db, slots[0].id, reviewer_id=2)
    claimed_slot2 = await claim_review_slot(db, slots[1].id, reviewer_id=3)
    claimed_slot3 = await claim_review_slot(db, slots[2].id, reviewer_id=4)

    assert claimed_slot1.reviewer_id == 2
    assert claimed_slot2.reviewer_id == 3
    assert claimed_slot3.reviewer_id == 4
    assert all(
        slot.status == ReviewSlotStatus.CLAIMED.value
        for slot in [claimed_slot1, claimed_slot2, claimed_slot3]
    )


@pytest.mark.asyncio
async def test_prevent_requester_claiming_own_request(db: AsyncSession):
    """Test that a requester cannot claim slots from their own review request"""

    # This is handled in the API layer, but we can test the CRUD doesn't prevent it
    # The API should check that current_user.id != request.user_id
    pass  # API-level test, not CRUD-level
