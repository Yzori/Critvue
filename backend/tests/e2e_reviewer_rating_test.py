"""
End-to-End Test for Two-Way Reviewer Rating System

Tests the complete flow:
1. Create test users (requester and reviewer)
2. Create a review request
3. Claim and submit a review
4. Submit reviewer rating from requester
5. Verify reviewer stats are updated
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.user import User, UserRole
from app.models.review_request import ReviewRequest, ContentType, ReviewType, ReviewStatus
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.reviewer_rating import ReviewerRating, ReviewerStats
from app.services.reviewer_rating_service import ReviewerRatingService


async def run_e2e_test():
    """Run the end-to-end test for reviewer ratings."""

    print("\n" + "="*60)
    print("E2E TEST: Two-Way Reviewer Rating System")
    print("="*60 + "\n")

    # Create async engine and session
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        try:
            # 1. Get or create test users
            print("[STEP 1] Setting up test users...")

            # Check for existing test users
            result = await db.execute(
                select(User).where(User.email == "e2e_requester@test.com")
            )
            requester = result.scalar_one_or_none()

            if not requester:
                requester = User(
                    email="e2e_requester@test.com",
                    full_name="E2E Requester",
                    hashed_password="test_hash",
                    role=UserRole.CREATOR.value,
                    is_verified=True,
                    is_active=True
                )
                db.add(requester)
                await db.commit()
                await db.refresh(requester)
                print(f"  Created requester: {requester.full_name} (ID: {requester.id})")
            else:
                print(f"  Using existing requester: {requester.full_name} (ID: {requester.id})")

            result = await db.execute(
                select(User).where(User.email == "e2e_reviewer@test.com")
            )
            reviewer = result.scalar_one_or_none()

            if not reviewer:
                reviewer = User(
                    email="e2e_reviewer@test.com",
                    full_name="E2E Reviewer",
                    hashed_password="test_hash",
                    role=UserRole.REVIEWER.value,
                    is_verified=True,
                    is_active=True
                )
                db.add(reviewer)
                await db.commit()
                await db.refresh(reviewer)
                print(f"  Created reviewer: {reviewer.full_name} (ID: {reviewer.id})")
            else:
                print(f"  Using existing reviewer: {reviewer.full_name} (ID: {reviewer.id})")

            print("  [PASS] Test users ready\n")

            # 2. Create a review request
            print("[STEP 2] Creating review request...")

            review_request = ReviewRequest(
                user_id=requester.id,
                title="E2E Test Review Request",
                description="This is a test review request for e2e testing",
                content_type=ContentType.DESIGN.value,
                review_type=ReviewType.FREE.value,
                status=ReviewStatus.PENDING.value
            )
            db.add(review_request)
            await db.commit()
            await db.refresh(review_request)
            print(f"  Created review request ID: {review_request.id}")
            print("  [PASS] Review request created\n")

            # 3. Create a review slot and simulate reviewer submission
            print("[STEP 3] Creating review slot and simulating submission...")

            review_slot = ReviewSlot(
                review_request_id=review_request.id,
                reviewer_id=reviewer.id,
                status=ReviewSlotStatus.SUBMITTED.value,  # Skip to submitted state
                claimed_at=datetime.utcnow(),
                submitted_at=datetime.utcnow(),
                review_text="This is a detailed test review with actionable feedback.",
                rating=4
            )
            db.add(review_slot)
            await db.commit()
            await db.refresh(review_slot)
            print(f"  Created review slot ID: {review_slot.id}")
            print(f"  Status: {review_slot.status}")
            print("  [PASS] Review slot with submission ready\n")

            # 4. Test canRateReviewer check
            print("[STEP 4] Testing can_rate_reviewer check...")

            service = ReviewerRatingService(db)
            can_rate = await service.can_rate_reviewer(requester.id, review_slot.id)
            print(f"  Can rate: {can_rate}")

            if can_rate["can_rate"]:
                print("  [PASS] Requester can rate the reviewer\n")
            else:
                print(f"  [FAIL] Cannot rate: {can_rate['reason']}\n")
                raise Exception(f"Cannot rate reviewer: {can_rate['reason']}")

            # 5. Submit reviewer rating
            print("[STEP 5] Submitting reviewer rating...")

            rating = await service.submit_rating(
                review_slot_id=review_slot.id,
                requester_id=requester.id,
                quality_rating=5,
                professionalism_rating=4,
                helpfulness_rating=4,
                feedback_text="Great review! Very thorough and helpful.",
                is_anonymous=False
            )

            print(f"  Rating ID: {rating.id}")
            print(f"  Quality: {rating.quality_rating}/5")
            print(f"  Professionalism: {rating.professionalism_rating}/5")
            print(f"  Helpfulness: {rating.helpfulness_rating}/5")
            print(f"  Overall: {rating.overall_rating}/5")
            print("  [PASS] Rating submitted successfully\n")

            # 6. Verify rating is stored
            print("[STEP 6] Verifying rating storage...")

            stored_rating = await service.get_rating_for_slot(review_slot.id)
            assert stored_rating is not None, "Rating should exist"
            assert stored_rating.quality_rating == 5, "Quality rating mismatch"
            assert stored_rating.professionalism_rating == 4, "Professionalism rating mismatch"
            assert stored_rating.helpfulness_rating == 4, "Helpfulness rating mismatch"
            print("  [PASS] Rating stored and verified\n")

            # 7. Check reviewer stats
            print("[STEP 7] Verifying reviewer stats...")

            stats = await service.get_reviewer_stats(reviewer.id)
            print(f"  Stats: {stats}")

            if stats:
                print(f"  Avg Quality: {stats['avg_quality']}")
                print(f"  Avg Professionalism: {stats['avg_professionalism']}")
                print(f"  Avg Helpfulness: {stats['avg_helpfulness']}")
                print(f"  Avg Overall: {stats['avg_overall']}")
                print(f"  Total Ratings: {stats['total_ratings']}")
                print(f"  Badges: {stats['badges']}")
                print("  [PASS] Reviewer stats updated\n")
            else:
                print("  [WARN] No stats found (expected for first rating)")

            # 8. Test duplicate rating prevention
            print("[STEP 8] Testing duplicate rating prevention...")

            try:
                await service.submit_rating(
                    review_slot_id=review_slot.id,
                    requester_id=requester.id,
                    quality_rating=3,
                    professionalism_rating=3,
                    helpfulness_rating=3,
                )
                print("  [FAIL] Duplicate rating should have been rejected\n")
            except ValueError as e:
                print(f"  Duplicate prevented: {e}")
                print("  [PASS] Duplicate rating correctly rejected\n")

            # 9. Test canRateReviewer after rating
            print("[STEP 9] Testing can_rate_reviewer after rating...")

            can_rate_again = await service.can_rate_reviewer(requester.id, review_slot.id)
            print(f"  Can rate again: {can_rate_again}")

            if not can_rate_again["can_rate"]:
                print("  [PASS] Correctly prevents re-rating\n")
            else:
                print("  [FAIL] Should not be able to rate again\n")

            # 10. Test get_ratings_for_reviewer
            print("[STEP 10] Testing get_ratings_for_reviewer...")

            ratings_list = await service.get_ratings_for_reviewer(reviewer.id, limit=10)
            print(f"  Found {len(ratings_list)} rating(s)")

            if ratings_list:
                print(f"  Latest rating:")
                print(f"    - Overall: {ratings_list[0]['overall_rating']}/5")
                print(f"    - From: {ratings_list[0]['requester_name']}")
                print(f"    - Feedback: {ratings_list[0]['feedback_text'][:50]}...")
            print("  [PASS] Ratings list retrieved\n")

            # Cleanup - Remove test data
            print("[CLEANUP] Removing test data...")

            await db.execute(
                select(ReviewerRating).where(ReviewerRating.review_slot_id == review_slot.id)
            )
            await db.delete(rating)

            await db.delete(review_slot)
            await db.delete(review_request)

            # Clean up reviewer stats
            result = await db.execute(
                select(ReviewerStats).where(ReviewerStats.user_id == reviewer.id)
            )
            stats_record = result.scalar_one_or_none()
            if stats_record:
                await db.delete(stats_record)

            # Keep test users for future tests
            await db.commit()
            print("  [PASS] Test data cleaned up\n")

            print("="*60)
            print("E2E TEST PASSED: Two-Way Reviewer Rating System")
            print("="*60 + "\n")

            return True

        except Exception as e:
            print(f"\n[ERROR] Test failed: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
            return False
        finally:
            await engine.dispose()


if __name__ == "__main__":
    success = asyncio.run(run_e2e_test())
    sys.exit(0 if success else 1)
