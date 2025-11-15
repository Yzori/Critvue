"""Test endpoints to debug avatar persistence"""
import asyncio
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.profile import ProfileResponse
from app.crud import profile as profile_crud
from sqlalchemy import select


async def test_schemas():
    """Test what data each schema returns"""

    async for db in get_db():
        # Get user from database
        result = await db.execute(
            select(User).where(User.email == 'arend@gmail.com')
        )
        user = result.scalar_one_or_none()

        if not user:
            print("User not found!")
            break

        print("=" * 80)
        print("DATABASE USER OBJECT")
        print("=" * 80)
        print(f"ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Full Name: {user.full_name}")
        print(f"Avatar URL: {user.avatar_url}")
        print(f"Role: {user.role}")
        print()

        # Test UserResponse (used by /auth/me)
        print("=" * 80)
        print("UserResponse SCHEMA (used by /auth/me)")
        print("=" * 80)
        try:
            user_response = UserResponse.model_validate(user)
            print(user_response.model_dump_json(indent=2))
        except Exception as e:
            print(f"Error: {e}")
        print()

        # Test ProfileResponse (used by /profile/me)
        print("=" * 80)
        print("ProfileResponse SCHEMA (used by /profile/me)")
        print("=" * 80)
        try:
            # Parse JSON fields
            specialty_tags = profile_crud.parse_user_specialty_tags(user)
            badges = profile_crud.parse_user_badges(user)

            profile_response = ProfileResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                title=user.title,
                bio=user.bio,
                avatar_url=user.avatar_url,
                role=user.role.value,
                is_verified=user.is_verified,
                specialty_tags=specialty_tags,
                badges=badges,
                total_reviews_given=user.total_reviews_given,
                total_reviews_received=user.total_reviews_received,
                avg_rating=user.avg_rating,
                avg_response_time_hours=user.avg_response_time_hours,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
            print(profile_response.model_dump_json(indent=2))
        except Exception as e:
            print(f"Error: {e}")
        print()

        # Compare
        print("=" * 80)
        print("COMPARISON")
        print("=" * 80)
        print(f"Database avatar_url:      {user.avatar_url}")
        print(f"UserResponse avatar_url:  {user_response.avatar_url}")
        print(f"ProfileResponse avatar_url: {profile_response.avatar_url}")
        print()

        if user.avatar_url == user_response.avatar_url == profile_response.avatar_url:
            print("✅ All schemas correctly include avatar_url")
        else:
            print("❌ MISMATCH DETECTED!")
            if user.avatar_url != user_response.avatar_url:
                print(f"  - UserResponse missing or different")
            if user.avatar_url != profile_response.avatar_url:
                print(f"  - ProfileResponse missing or different")

        break


if __name__ == "__main__":
    asyncio.run(test_schemas())
