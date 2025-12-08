"""
Script to create review requests for stress testing.
Creates one review request per category for a specific user.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.user import User
from app.models.review_request import ReviewRequest, ContentType, ReviewType, ReviewStatus


# Content types and sample data (valid types: design, photography, video, stream, audio, writing, art)
CATEGORIES = [
    {
        "content_type": "design",
        "title": "E-commerce Dashboard UI Redesign",
        "description": "Looking for feedback on my dashboard redesign for an e-commerce analytics platform. I've focused on making data visualization more accessible and actionable. Need critique on layout, color choices, and overall UX flow.",
    },
    {
        "content_type": "video",
        "title": "Product Demo Video - SaaS Tool",
        "description": "I've created a 2-minute product demo for our project management SaaS. Looking for feedback on pacing, visual storytelling, and whether the value proposition comes through clearly.",
    },
    {
        "content_type": "photography",
        "title": "Street Photography Portfolio Review",
        "description": "I'm putting together a portfolio of urban street photography. Need feedback on composition, editing style consistency, and which images work best together as a cohesive collection.",
    },
    {
        "content_type": "writing",
        "title": "Blog Post: AI in Healthcare",
        "description": "Written a 2000-word article about AI applications in healthcare diagnostics. Looking for feedback on structure, technical accuracy for a general audience, and engagement.",
    },
    {
        "content_type": "audio",
        "title": "Podcast Intro Music & Sound Design",
        "description": "Created intro music and sound effects for a tech podcast. Need feedback on tone, energy level, and whether it sets the right mood for the content.",
    },
    {
        "content_type": "stream",
        "title": "Twitch Stream Overlay & Scene Transitions",
        "description": "Designed custom overlays and scene transitions for my gaming Twitch channel. Looking for feedback on visual consistency, readability, and whether the branding comes through.",
    },
    {
        "content_type": "art",
        "title": "Digital Illustration Series - Fantasy Landscapes",
        "description": "Working on a series of digital fantasy landscape illustrations. Need feedback on composition, color palette choices, lighting, and overall artistic style consistency.",
    },
]


async def create_stress_test_reviews():
    """Create review requests for stress testing."""

    print("\n" + "="*60)
    print("Creating Stress Test Review Requests")
    print("="*60 + "\n")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        try:
            # Find the user
            result = await db.execute(
                select(User).where(User.email == "florannn@gmail.com")
            )
            user = result.scalar_one_or_none()

            if not user:
                print("ERROR: User florannn@gmail.com not found!")
                return False

            print(f"Found user: {user.full_name} (ID: {user.id})")
            print()

            created_count = 0
            for category in CATEGORIES:
                # Check if similar review already exists
                result = await db.execute(
                    select(ReviewRequest).where(
                        ReviewRequest.user_id == user.id,
                        ReviewRequest.content_type == category["content_type"],
                        ReviewRequest.title == category["title"]
                    )
                )
                existing = result.scalar_one_or_none()

                if existing:
                    print(f"  [SKIP] {category['content_type']}: Already exists (ID: {existing.id})")
                    continue

                # Create new review request
                review_request = ReviewRequest(
                    user_id=user.id,
                    title=category["title"],
                    description=category["description"],
                    content_type=category["content_type"],
                    review_type=ReviewType.FREE.value,
                    status=ReviewStatus.PENDING.value
                )
                db.add(review_request)
                await db.commit()
                await db.refresh(review_request)

                print(f"  [CREATED] {category['content_type']}: {category['title']} (ID: {review_request.id})")
                created_count += 1

            print()
            print(f"Created {created_count} new review requests")
            print("="*60 + "\n")

            return True

        except Exception as e:
            print(f"\n[ERROR] Failed: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
            return False
        finally:
            await engine.dispose()


if __name__ == "__main__":
    success = asyncio.run(create_stress_test_reviews())
    sys.exit(0 if success else 1)
