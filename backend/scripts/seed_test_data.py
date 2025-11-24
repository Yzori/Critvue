#!/usr/bin/env python3
"""
Seed Test Data Script

Creates test users and sample data for E2E testing.

Usage:
    # From backend directory:
    python scripts/seed_test_data.py

    # Or with custom passwords:
    CREATOR_PASSWORD=mypass REVIEWER_PASSWORD=mypass python scripts/seed_test_data.py

    # Reset (delete and recreate) test users:
    python scripts/seed_test_data.py --reset

Environment Variables:
    CREATOR_EMAIL     - Email for creator test user (default: creator@test.com)
    CREATOR_PASSWORD  - Password for creator (default: TestPassword123!)
    REVIEWER_EMAIL    - Email for reviewer test user (default: reviewer@test.com)
    REVIEWER_PASSWORD - Password for reviewer (default: TestPassword123!)
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_maker, engine
from app.models.user import User, UserRole, UserTier, Base
from app.models.review_request import ReviewRequest, ReviewType, ContentType, ReviewStatus
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.core.security import get_password_hash


# Test user configuration
TEST_USERS = {
    "creator": {
        "email": os.getenv("CREATOR_EMAIL", "creator@test.com"),
        "password": os.getenv("CREATOR_PASSWORD", "TestPassword123"),
        "full_name": "Test Creator",
        "role": UserRole.CREATOR,
        "bio": "I'm a test creator account for E2E testing.",
        "user_tier": UserTier.CONTRIBUTOR,
        "karma_points": 100,
    },
    "reviewer": {
        "email": os.getenv("REVIEWER_EMAIL", "reviewer@test.com"),
        "password": os.getenv("REVIEWER_PASSWORD", "TestPassword123"),
        "full_name": "Test Reviewer",
        "role": UserRole.REVIEWER,
        "bio": "I'm a test reviewer account for E2E testing.",
        "user_tier": UserTier.SKILLED,
        "karma_points": 500,
        "total_reviews_given": 25,
        "avg_rating": 4.5,
        "acceptance_rate": 92.0,
    },
    "admin": {
        "email": os.getenv("ADMIN_EMAIL", "admin@test.com"),
        "password": os.getenv("ADMIN_PASSWORD", "AdminPassword123"),
        "full_name": "Test Admin",
        "role": UserRole.ADMIN,
        "bio": "I'm a test admin account.",
        "user_tier": UserTier.MASTER,
        "karma_points": 10000,
    },
}

# Sample review requests to create for the creator
SAMPLE_REVIEW_REQUESTS = [
    {
        "title": "E2E Test - Landing Page Design Review",
        "description": """Please review my landing page design for a SaaS product.

I'm looking for feedback on:
- Visual hierarchy and layout
- Color scheme and typography choices
- Call-to-action placement and effectiveness
- Mobile responsiveness considerations
- Overall user experience

The design follows a modern, minimal aesthetic with a focus on conversion.""",
        "content_type": ContentType.DESIGN,
        "review_type": ReviewType.FREE,
        "status": ReviewStatus.PENDING,
        "reviews_requested": 3,
    },
    {
        "title": "E2E Test - Mobile App UI Feedback",
        "description": """I need feedback on my mobile app's onboarding flow.

Key areas to review:
- User flow from signup to first action
- Visual design consistency
- Accessibility considerations
- Micro-interactions and animations
- Overall usability

Target audience: Young professionals aged 25-35.""",
        "content_type": ContentType.DESIGN,
        "review_type": ReviewType.FREE,
        "status": ReviewStatus.PENDING,
        "reviews_requested": 2,
    },
]


async def create_test_user(session: AsyncSession, user_config: dict, user_key: str) -> User:
    """Create a test user if it doesn't exist."""

    # Check if user already exists
    result = await session.execute(
        select(User).where(User.email == user_config["email"])
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        print(f"  [EXISTS] {user_key}: {user_config['email']} (ID: {existing_user.id})")
        return existing_user

    # Create new user
    user = User(
        email=user_config["email"],
        hashed_password=get_password_hash(user_config["password"]),
        full_name=user_config["full_name"],
        role=user_config["role"],
        bio=user_config.get("bio"),
        user_tier=user_config.get("user_tier", UserTier.NOVICE),
        karma_points=user_config.get("karma_points", 0),
        total_reviews_given=user_config.get("total_reviews_given", 0),
        avg_rating=user_config.get("avg_rating"),
        acceptance_rate=user_config.get("acceptance_rate"),
        is_active=True,
        is_verified=True,  # Pre-verified for testing
    )

    session.add(user)
    await session.flush()

    print(f"  [CREATED] {user_key}: {user_config['email']} (ID: {user.id})")
    return user


async def create_review_request(
    session: AsyncSession,
    creator: User,
    request_config: dict
) -> ReviewRequest:
    """Create a sample review request with slots."""

    # Check if a similar review request already exists
    result = await session.execute(
        select(ReviewRequest).where(
            ReviewRequest.user_id == creator.id,
            ReviewRequest.title == request_config["title"]
        )
    )
    existing_request = result.scalar_one_or_none()

    if existing_request:
        print(f"  [EXISTS] Review Request: {request_config['title'][:40]}... (ID: {existing_request.id})")
        return existing_request

    # Create the review request
    review_request = ReviewRequest(
        user_id=creator.id,
        title=request_config["title"],
        description=request_config["description"],
        content_type=request_config["content_type"],
        review_type=request_config["review_type"],
        status=request_config["status"],
        reviews_requested=request_config["reviews_requested"],
        deadline=datetime.utcnow() + timedelta(days=7),
    )

    session.add(review_request)
    await session.flush()

    # Create review slots
    for i in range(request_config["reviews_requested"]):
        slot = ReviewSlot(
            review_request_id=review_request.id,
            status=ReviewSlotStatus.AVAILABLE,
        )
        session.add(slot)

    await session.flush()

    print(f"  [CREATED] Review Request: {request_config['title'][:40]}... (ID: {review_request.id})")
    return review_request


async def delete_test_users(session: AsyncSession):
    """Delete all test users and their data."""

    test_emails = [config["email"] for config in TEST_USERS.values()]

    # Find test users
    result = await session.execute(
        select(User).where(User.email.in_(test_emails))
    )
    test_users = result.scalars().all()

    if not test_users:
        print("  No test users found to delete.")
        return

    for user in test_users:
        # Delete related review requests (cascades to slots)
        await session.execute(
            delete(ReviewRequest).where(ReviewRequest.user_id == user.id)
        )

        # Delete the user
        await session.delete(user)
        print(f"  [DELETED] {user.email}")

    await session.flush()


async def seed_database(reset: bool = False):
    """Main seeding function."""

    print("\n" + "=" * 60)
    print("Critvue Test Data Seeder")
    print("=" * 60)

    async with async_session_maker() as session:
        try:
            # Reset if requested
            if reset:
                print("\n[Step 1/3] Deleting existing test data...")
                await delete_test_users(session)
                await session.commit()
                print("  Done!")

            # Create test users
            print("\n[Step 2/3] Creating test users...")
            created_users = {}
            for user_key, user_config in TEST_USERS.items():
                user = await create_test_user(session, user_config, user_key)
                created_users[user_key] = user

            await session.commit()

            # Create sample review requests for creator
            print("\n[Step 3/3] Creating sample review requests...")
            creator = created_users.get("creator")
            if creator:
                for request_config in SAMPLE_REVIEW_REQUESTS:
                    await create_review_request(session, creator, request_config)

            await session.commit()

            print("\n" + "=" * 60)
            print("Seeding completed successfully!")
            print("=" * 60)

            # Print summary
            print("\nTest Accounts:")
            print("-" * 40)
            for user_key, user_config in TEST_USERS.items():
                print(f"  {user_key.capitalize()}:")
                print(f"    Email:    {user_config['email']}")
                print(f"    Password: {user_config['password']}")
                print()

            print("You can now run E2E tests with:")
            print("  cd frontend && npm run test:e2e")
            print()

        except Exception as e:
            await session.rollback()
            print(f"\nError during seeding: {e}")
            raise


async def main():
    """Entry point."""
    reset = "--reset" in sys.argv or "-r" in sys.argv

    if reset:
        print("\nReset mode enabled - will delete and recreate test data.")

    await seed_database(reset=reset)


if __name__ == "__main__":
    asyncio.run(main())
