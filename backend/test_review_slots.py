#!/usr/bin/env python3
"""
Test script for review slots system

This script tests the critical paths of the review slots workflow:
1. Create review request with automatic slot creation
2. Claim a slot
3. Submit a review
4. Accept/reject review
5. Dispute handling
"""

import sys
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

# Add backend directory to path
sys.path.insert(0, '/home/user/Critvue/backend')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.review_request import ReviewRequest, ReviewStatus, ReviewType, ContentType
from app.models.review_slot import ReviewSlot, ReviewSlotStatus, RejectionReason
from app.models.user import User, Base
from app.crud import review_slot as crud_review_slot


# Database setup
DATABASE_URL = str(settings.DATABASE_URL)
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def create_test_users(db: AsyncSession):
    """Create test users for testing"""
    print("\n=== Creating Test Users ===")

    # Check if users already exist
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.email == "requester@test.com"))
    requester = result.scalar_one_or_none()

    if not requester:
        requester = User(
            email="requester@test.com",
            hashed_password="fake_hash",
            full_name="Test Requester",
            is_active=True
        )
        db.add(requester)
        print("✓ Created requester user")
    else:
        print("✓ Requester user already exists")

    result = await db.execute(select(User).where(User.email == "reviewer@test.com"))
    reviewer = result.scalar_one_or_none()

    if not reviewer:
        reviewer = User(
            email="reviewer@test.com",
            hashed_password="fake_hash",
            full_name="Test Reviewer",
            is_active=True
        )
        db.add(reviewer)
        print("✓ Created reviewer user")
    else:
        print("✓ Reviewer user already exists")

    await db.commit()
    await db.refresh(requester)
    await db.refresh(reviewer)

    return requester, reviewer


async def test_create_review_with_slots(db: AsyncSession, requester_id: int):
    """Test creating a review request with automatic slot creation"""
    print("\n=== Test 1: Create Review Request with Auto-Slots ===")

    review = ReviewRequest(
        user_id=requester_id,
        title="Test Design Review",
        description="Please review my UI design for constructive feedback",
        content_type=ContentType.DESIGN,
        review_type=ReviewType.FREE,
        status=ReviewStatus.PENDING,
        feedback_areas="UI/UX, Color scheme, Typography",
        reviews_requested=3
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    print(f"✓ Created review request (ID: {review.id})")

    # Create slots manually (simulating what would happen in CRUD)
    slots = await crud_review_slot.create_review_slots(
        db, review.id, review.reviews_requested
    )

    print(f"✓ Created {len(slots)} review slots")

    # Verify slots were created
    from sqlalchemy import select
    result = await db.execute(
        select(ReviewSlot).where(ReviewSlot.review_request_id == review.id)
    )
    created_slots = list(result.scalars().all())

    assert len(created_slots) == 3, f"Expected 3 slots, got {len(created_slots)}"
    assert all(s.status == ReviewSlotStatus.AVAILABLE.value for s in created_slots), "All slots should be available"

    print(f"✓ Verified {len(created_slots)} slots with AVAILABLE status")

    return review, created_slots


async def test_claim_slot(db: AsyncSession, slot_id: int, reviewer_id: int):
    """Test claiming a review slot"""
    print(f"\n=== Test 2: Claim Review Slot (ID: {slot_id}) ===")

    # Claim the slot
    claimed_slot = await crud_review_slot.claim_review_slot(
        db, slot_id, reviewer_id
    )

    assert claimed_slot.status == ReviewSlotStatus.CLAIMED.value, "Slot should be claimed"
    assert claimed_slot.reviewer_id == reviewer_id, "Reviewer ID should match"
    assert claimed_slot.claim_deadline is not None, "Claim deadline should be set"

    print(f"✓ Claimed slot {slot_id}")
    print(f"  - Status: {claimed_slot.status}")
    print(f"  - Reviewer ID: {claimed_slot.reviewer_id}")
    print(f"  - Claim deadline: {claimed_slot.claim_deadline}")

    return claimed_slot


async def test_submit_review(db: AsyncSession, slot_id: int, reviewer_id: int):
    """Test submitting a review"""
    print(f"\n=== Test 3: Submit Review for Slot (ID: {slot_id}) ===")

    review_text = "Great design overall! Here are my detailed thoughts: " + "x" * 100
    rating = 5

    submitted_slot = await crud_review_slot.submit_review(
        db, slot_id, reviewer_id, review_text, rating
    )

    assert submitted_slot.status == ReviewSlotStatus.SUBMITTED.value, "Slot should be submitted"
    assert submitted_slot.review_text == review_text, "Review text should match"
    assert submitted_slot.rating == rating, "Rating should match"
    assert submitted_slot.auto_accept_at is not None, "Auto-accept deadline should be set"

    print(f"✓ Submitted review for slot {slot_id}")
    print(f"  - Status: {submitted_slot.status}")
    print(f"  - Rating: {submitted_slot.rating}")
    print(f"  - Auto-accept at: {submitted_slot.auto_accept_at}")

    return submitted_slot


async def test_accept_review(db: AsyncSession, slot_id: int, requester_id: int):
    """Test accepting a submitted review"""
    print(f"\n=== Test 4: Accept Review (Slot ID: {slot_id}) ===")

    accepted_slot = await crud_review_slot.accept_review(
        db, slot_id, requester_id, helpful_rating=5
    )

    assert accepted_slot.status == ReviewSlotStatus.ACCEPTED.value, "Slot should be accepted"
    assert accepted_slot.requester_helpful_rating == 5, "Helpful rating should match"

    print(f"✓ Accepted review for slot {slot_id}")
    print(f"  - Status: {accepted_slot.status}")
    print(f"  - Helpful rating: {accepted_slot.requester_helpful_rating}")

    return accepted_slot


async def test_reject_review(db: AsyncSession, slot_id: int, requester_id: int):
    """Test rejecting a submitted review"""
    print(f"\n=== Test 5: Reject Review (Slot ID: {slot_id}) ===")

    rejected_slot = await crud_review_slot.reject_review(
        db, slot_id, requester_id,
        RejectionReason.LOW_QUALITY,
        "The review is too generic and doesn't provide specific feedback."
    )

    assert rejected_slot.status == ReviewSlotStatus.REJECTED.value, "Slot should be rejected"
    assert rejected_slot.rejection_reason == RejectionReason.LOW_QUALITY.value, "Rejection reason should match"

    print(f"✓ Rejected review for slot {slot_id}")
    print(f"  - Status: {rejected_slot.status}")
    print(f"  - Reason: {rejected_slot.rejection_reason}")
    print(f"  - Notes: {rejected_slot.rejection_notes}")

    return rejected_slot


async def test_create_dispute(db: AsyncSession, slot_id: int, reviewer_id: int):
    """Test creating a dispute for a rejected review"""
    print(f"\n=== Test 6: Create Dispute (Slot ID: {slot_id}) ===")

    dispute_reason = "I believe my review was detailed and constructive. It addressed all the key points mentioned in the request."

    disputed_slot = await crud_review_slot.create_dispute(
        db, slot_id, reviewer_id, dispute_reason
    )

    assert disputed_slot.status == ReviewSlotStatus.DISPUTED.value, "Slot should be disputed"
    assert disputed_slot.is_disputed == True, "Dispute flag should be set"

    print(f"✓ Created dispute for slot {slot_id}")
    print(f"  - Status: {disputed_slot.status}")
    print(f"  - Dispute reason: {disputed_slot.dispute_reason[:50]}...")

    return disputed_slot


async def test_abandon_slot(db: AsyncSession, slot_id: int, reviewer_id: int):
    """Test abandoning a claimed slot"""
    print(f"\n=== Test 7: Abandon Claimed Slot (ID: {slot_id}) ===")

    abandoned_slot = await crud_review_slot.abandon_review_slot(
        db, slot_id, reviewer_id
    )

    assert abandoned_slot.status == ReviewSlotStatus.ABANDONED.value, "Slot should be abandoned"

    print(f"✓ Abandoned slot {slot_id}")
    print(f"  - Status: {abandoned_slot.status}")

    return abandoned_slot


async def test_model_state_transitions():
    """Test ReviewSlot model state transitions"""
    print("\n=== Test 8: Model State Transitions ===")

    # Create a slot in memory (not in DB)
    slot = ReviewSlot(
        review_request_id=1,
        status=ReviewSlotStatus.AVAILABLE.value
    )

    # Test is_claimable
    assert slot.is_claimable, "Available slot should be claimable"
    print("✓ Available slot is claimable")

    # Test claim transition
    slot.claim(reviewer_id=1, claim_hours=72)
    assert slot.status == ReviewSlotStatus.CLAIMED.value, "Slot should be claimed"
    assert slot.reviewer_id == 1, "Reviewer ID should be set"
    assert slot.claim_deadline is not None, "Claim deadline should be set"
    print("✓ Claim transition works correctly")

    # Test submit_review transition
    slot.submit_review("Test review text " + "x" * 50, 4)
    assert slot.status == ReviewSlotStatus.SUBMITTED.value, "Slot should be submitted"
    assert slot.rating == 4, "Rating should be set"
    print("✓ Submit transition works correctly")

    # Test accept transition
    slot.accept(is_auto=False, helpful_rating=5)
    assert slot.status == ReviewSlotStatus.ACCEPTED.value, "Slot should be accepted"
    print("✓ Accept transition works correctly")

    print("\n✓ All model state transitions passed")


async def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("REVIEW SLOTS SYSTEM - COMPREHENSIVE TEST SUITE")
    print("="*60)

    async with async_session() as db:
        try:
            # Create test users
            requester, reviewer = await create_test_users(db)

            # Test 1: Create review with auto-slots
            review, slots = await test_create_review_with_slots(db, requester.id)

            # Test 2: Claim first slot
            claimed_slot = await test_claim_slot(db, slots[0].id, reviewer.id)

            # Test 3: Submit review for first slot
            submitted_slot = await test_submit_review(db, slots[0].id, reviewer.id)

            # Test 4: Accept the review
            accepted_slot = await test_accept_review(db, slots[0].id, requester.id)

            # Test 5: Claim, submit, and reject second slot
            claimed_slot_2 = await test_claim_slot(db, slots[1].id, reviewer.id)
            submitted_slot_2 = await test_submit_review(db, slots[1].id, reviewer.id)
            rejected_slot = await test_reject_review(db, slots[1].id, requester.id)

            # Test 6: Create dispute for rejected review
            disputed_slot = await test_create_dispute(db, slots[1].id, reviewer.id)

            # Test 7: Claim and abandon third slot
            claimed_slot_3 = await test_claim_slot(db, slots[2].id, reviewer.id)
            abandoned_slot = await test_abandon_slot(db, slots[2].id, reviewer.id)

            # Test 8: Model state transitions
            await test_model_state_transitions()

            print("\n" + "="*60)
            print("ALL TESTS PASSED SUCCESSFULLY!")
            print("="*60)
            print("\nSummary:")
            print(f"  ✓ Created review request (ID: {review.id})")
            print(f"  ✓ Created 3 review slots")
            print(f"  ✓ Slot 1: Claimed → Submitted → Accepted")
            print(f"  ✓ Slot 2: Claimed → Submitted → Rejected → Disputed")
            print(f"  ✓ Slot 3: Claimed → Abandoned")
            print(f"  ✓ All model state transitions validated")
            print("\n✅ Review slots system is working correctly!\n")

            return True

        except AssertionError as e:
            print(f"\n❌ TEST FAILED: {e}\n")
            import traceback
            traceback.print_exc()
            return False

        except Exception as e:
            print(f"\n❌ UNEXPECTED ERROR: {e}\n")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
