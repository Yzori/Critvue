"""Test that expert reviews can only be claimed by users with appropriate tier status.

This script tests the tier-based claim restrictions:
- NOVICE, CONTRIBUTOR, SKILLED tiers: Cannot claim paid/expert reviews
- TRUSTED_ADVISOR: Can claim $5-$25 expert reviews
- EXPERT: Can claim $5-$100 expert reviews
- MASTER: Can claim any expert reviews ($5+)
"""

import asyncio
import sys
from decimal import Decimal
from datetime import datetime

# Add the app directory to path
sys.path.insert(0, '.')

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.user import User, UserTier
from app.models.review_request import ReviewRequest, ReviewType, ReviewStatus, ContentType
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.services.tier_service import TierService
from app.services.claim_service import ClaimService, TierPermissionError, ClaimValidationError


async def get_async_session():
    """Create async database session."""
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return async_session()


async def ensure_test_users_with_tiers(db: AsyncSession):
    """Create test users for each tier if they don't exist."""
    users_by_tier = {}

    tier_emails = {
        UserTier.NOVICE: "tier_novice@test.com",
        UserTier.CONTRIBUTOR: "tier_contributor@test.com",
        UserTier.SKILLED: "tier_skilled@test.com",
        UserTier.TRUSTED_ADVISOR: "tier_trusted_advisor@test.com",
        UserTier.EXPERT: "tier_expert@test.com",
        UserTier.MASTER: "tier_master@test.com",
    }

    for tier, email in tier_emails.items():
        # Check if user exists
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            # Create user with this tier
            user = User(
                email=email,
                full_name=f"Test {tier.value.title()} User",
                hashed_password="$2b$12$test",
                user_tier=tier,
                karma_points=TierService.TIER_REQUIREMENTS[tier]["karma_min"],
                accepted_reviews_count=TierService.TIER_REQUIREMENTS[tier]["accepted_reviews_min"],
                is_verified=True
            )
            db.add(user)
            await db.flush()
            print(f"  Created {tier.value} user: {email} (ID: {user.id})")
        else:
            # Ensure tier is correct
            if user.user_tier != tier:
                user.user_tier = tier
                print(f"  Updated {user.email} to tier: {tier.value}")

        users_by_tier[tier] = user

    await db.commit()
    return users_by_tier


async def create_expert_review_with_price(db: AsyncSession, creator_id: int, price: float) -> ReviewSlot:
    """Create an expert review request with specific price."""
    expert_review = ReviewRequest(
        user_id=creator_id,
        title=f"Test Expert Review ${price}",
        description=f"Expert review for testing tier restrictions at ${price}",
        content_type=ContentType.CODE,
        review_type=ReviewType.EXPERT,
        status=ReviewStatus.PENDING,
        budget=Decimal(str(price)),
        reviews_requested=1
    )
    db.add(expert_review)
    await db.flush()

    expert_slot = ReviewSlot(
        review_request_id=expert_review.id,
        status=ReviewSlotStatus.AVAILABLE.value,
        payment_amount=Decimal(str(price))
    )
    db.add(expert_slot)
    await db.commit()
    await db.refresh(expert_slot)

    return expert_slot


async def reset_slot(db: AsyncSession, slot: ReviewSlot, review: ReviewRequest):
    """Reset a slot to available state."""
    slot.status = ReviewSlotStatus.AVAILABLE.value
    slot.reviewer_id = None
    slot.claimed_at = None
    slot.claim_deadline = None
    review.reviews_claimed = max(0, review.reviews_claimed - 1)
    await db.commit()


async def test_expert_tier_restrictions():
    """Test that expert reviews can only be claimed by users with appropriate tier."""

    print("\n" + "="*70)
    print("EXPERT TIER CLAIM RESTRICTION TEST")
    print("="*70)

    db = await get_async_session()

    try:
        # 1. Create test users for each tier
        print("\n[1] Ensuring test users for each tier...")
        users_by_tier = await ensure_test_users_with_tiers(db)

        for tier, user in users_by_tier.items():
            print(f"  - {tier.value}: {user.email} (ID: {user.id})")

        # 2. Find a user who can be the review creator (not in our test users)
        result = await db.execute(
            select(User)
            .where(User.email.notin_([u.email for u in users_by_tier.values()]))
            .limit(1)
        )
        creator = result.scalar_one_or_none()

        if not creator:
            # Use novice as creator, they can't claim their own review anyway
            creator = users_by_tier[UserTier.NOVICE]
            print(f"\n  Using NOVICE user as creator: {creator.email}")
        else:
            print(f"\n  Using separate creator: {creator.email}")

        # 3. Test with different price points
        test_prices = [
            (15.00, "Within TRUSTED_ADVISOR range ($5-$25)"),
            (50.00, "Within EXPERT range ($5-$100, above TRUSTED_ADVISOR)"),
            (150.00, "Above EXPERT range, MASTER only ($100+)"),
        ]

        test_results = []

        for price, description in test_prices:
            print(f"\n" + "="*70)
            print(f"TESTING: ${price} Expert Review - {description}")
            print("="*70)

            # Create expert review at this price
            print(f"\n[2] Creating ${price} expert review...")
            slot = await create_expert_review_with_price(db, creator.id, price)
            review = await db.get(ReviewRequest, slot.review_request_id)
            print(f"  Created slot ID: {slot.id}, Review ID: {review.id}")

            tier_service = TierService(db)

            # Test each tier
            tiers_to_test = [
                (UserTier.NOVICE, False),
                (UserTier.CONTRIBUTOR, False),
                (UserTier.SKILLED, False),
                (UserTier.TRUSTED_ADVISOR, price <= 25),  # Max $25
                (UserTier.EXPERT, price <= 100),  # Max $100
                (UserTier.MASTER, price >= 5),  # Min $5, no max
            ]

            print(f"\n[3] Testing tier restrictions for ${price} review...")
            print("-" * 50)

            for tier, expected_can_claim in tiers_to_test:
                user = users_by_tier[tier]

                # Skip if user is the creator
                if user.id == creator.id:
                    print(f"\n  {tier.value}: SKIPPED (is review creator)")
                    continue

                # Ensure slot is available
                await reset_slot(db, slot, review)

                # Test permission check
                can_claim, reason = await tier_service.can_claim_paid_review(
                    user=user,
                    review_budget=price
                )

                status = "PASS" if can_claim == expected_can_claim else "FAIL"

                print(f"\n  {tier.value}:")
                print(f"    Expected: {'CAN claim' if expected_can_claim else 'CANNOT claim'}")
                print(f"    Actual: {'CAN claim' if can_claim else 'CANNOT claim'}")
                if reason:
                    print(f"    Reason: {reason}")
                print(f"    Result: {status}")

                test_results.append((f"${price} - {tier.value}", status, reason if not can_claim else "Allowed"))

                # Also test actual claim attempt for key cases
                if expected_can_claim:
                    # Should succeed
                    try:
                        await reset_slot(db, slot, review)
                        claimed_slot = await ClaimService.claim_review_by_slot_id(
                            db=db,
                            slot_id=slot.id,
                            reviewer_id=user.id,
                            claim_hours=72
                        )
                        claim_status = "PASS"
                        print(f"    Claim test: SUCCESS (slot claimed)")
                    except Exception as e:
                        claim_status = "FAIL"
                        print(f"    Claim test: FAILED - {type(e).__name__}: {str(e)}")
                    test_results.append((f"${price} - {tier.value} (actual claim)", claim_status, ""))
                elif not expected_can_claim and tier == UserTier.NOVICE:
                    # Test that claim is properly rejected
                    try:
                        await reset_slot(db, slot, review)
                        await ClaimService.claim_review_by_slot_id(
                            db=db,
                            slot_id=slot.id,
                            reviewer_id=user.id,
                            claim_hours=72
                        )
                        claim_status = "FAIL"  # Should have been rejected
                        print(f"    Claim test: FAILED - Should have been rejected!")
                    except TierPermissionError as e:
                        claim_status = "PASS"  # Correctly rejected
                        print(f"    Claim test: CORRECTLY REJECTED - {str(e)}")
                    except Exception as e:
                        claim_status = "ERROR"
                        print(f"    Claim test: ERROR - {type(e).__name__}: {str(e)}")
                    test_results.append((f"${price} - {tier.value} (rejection test)", claim_status, ""))

            # Clean up - delete the test review
            await db.delete(slot)
            await db.delete(review)
            await db.commit()

        # Summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)

        passed = sum(1 for _, status, _ in test_results if status == "PASS")
        failed = sum(1 for _, status, _ in test_results if status == "FAIL")
        errors = sum(1 for _, status, _ in test_results if status == "ERROR")

        for test_name, status, reason in test_results:
            emoji = "✓" if status == "PASS" else "✗" if status == "FAIL" else "?"
            print(f"  {emoji} {test_name}: {status}")

        print(f"\nTotal: {passed} passed, {failed} failed, {errors} errors")

        return failed == 0 and errors == 0

    except Exception as e:
        print(f"\nERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await db.close()


if __name__ == "__main__":
    success = asyncio.run(test_expert_tier_restrictions())
    sys.exit(0 if success else 1)
