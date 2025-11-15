#!/usr/bin/env python3
"""
Avatar Persistence Debug Script
Tests the full authentication and profile flow to identify avatar persistence issue
"""

import asyncio
import httpx
import json
from typing import Optional


BASE_URL = "http://localhost:8000/api/v1"
TEST_USER = {
    "email": "arend@gmail.com",
    "password": "Test123!"
}


async def test_avatar_persistence():
    """Test the complete flow to identify avatar persistence issue"""

    print("=" * 80)
    print("AVATAR PERSISTENCE DEBUG TEST")
    print("=" * 80)
    print()

    async with httpx.AsyncClient(base_url=BASE_URL, follow_redirects=True) as client:

        # Step 1: Login
        print("1. LOGIN TEST")
        print("-" * 80)
        try:
            login_response = await client.post(
                "/auth/login",
                json=TEST_USER
            )
            print(f"Status Code: {login_response.status_code}")
            print(f"Response Headers (Cookies): {login_response.headers.get('set-cookie', 'None')}")

            if login_response.status_code == 200:
                login_data = login_response.json()
                print("\nLogin Response Body:")
                print(json.dumps(login_data, indent=2))
                print(f"\navatar_url in login response: {login_data.get('avatar_url', 'NOT PRESENT')}")

                # Extract cookies
                cookies = login_response.cookies
                print(f"\nCookies received: {dict(cookies)}")
            else:
                print(f"Login failed: {login_response.text}")
                return

        except Exception as e:
            print(f"Error during login: {e}")
            return

        print("\n")

        # Step 2: Test /auth/me endpoint
        print("2. GET /auth/me TEST")
        print("-" * 80)
        try:
            auth_me_response = await client.get(
                "/auth/me",
                cookies=cookies
            )
            print(f"Status Code: {auth_me_response.status_code}")

            if auth_me_response.status_code == 200:
                auth_me_data = auth_me_response.json()
                print("\n/auth/me Response Body:")
                print(json.dumps(auth_me_data, indent=2))
                print(f"\navatar_url in /auth/me: {auth_me_data.get('avatar_url', 'NOT PRESENT')}")
            else:
                print(f"/auth/me failed: {auth_me_response.text}")

        except Exception as e:
            print(f"Error calling /auth/me: {e}")

        print("\n")

        # Step 3: Test /profile/me endpoint
        print("3. GET /profile/me TEST")
        print("-" * 80)
        try:
            profile_me_response = await client.get(
                "/profile/me",
                cookies=cookies
            )
            print(f"Status Code: {profile_me_response.status_code}")

            if profile_me_response.status_code == 200:
                profile_me_data = profile_me_response.json()
                print("\n/profile/me Response Body:")
                print(json.dumps(profile_me_data, indent=2))
                print(f"\navatar_url in /profile/me: {profile_me_data.get('avatar_url', 'NOT PRESENT')}")
            else:
                print(f"/profile/me failed: {profile_me_response.text}")

        except Exception as e:
            print(f"Error calling /profile/me: {e}")

        print("\n")

        # Step 4: Check database directly
        print("4. DATABASE VERIFICATION")
        print("-" * 80)
        print("Run this SQL query to verify database state:")
        print(f"SELECT id, email, avatar_url FROM users WHERE email = '{TEST_USER['email']}';")

        print("\n")

        # Step 5: Comparison
        print("5. COMPARISON ANALYSIS")
        print("-" * 80)

        if login_response.status_code == 200 and auth_me_response.status_code == 200 and profile_me_response.status_code == 200:
            login_avatar = login_data.get('avatar_url')
            auth_me_avatar = auth_me_data.get('avatar_url')
            profile_me_avatar = profile_me_data.get('avatar_url')

            print(f"Login Response avatar_url:      {login_avatar}")
            print(f"/auth/me Response avatar_url:    {auth_me_avatar}")
            print(f"/profile/me Response avatar_url: {profile_me_avatar}")

            print("\n" + "=" * 80)
            print("DIAGNOSIS:")
            print("=" * 80)

            if login_avatar == auth_me_avatar == profile_me_avatar:
                if profile_me_avatar:
                    print("✅ All endpoints return the same avatar_url")
                    print(f"   Avatar URL: {profile_me_avatar}")
                else:
                    print("❌ All endpoints return NULL avatar_url")
                    print("   Issue: Database doesn't have avatar_url saved")
            else:
                print("⚠️  MISMATCH DETECTED!")
                if login_avatar != auth_me_avatar:
                    print(f"   - Login vs /auth/me differ")
                if auth_me_avatar != profile_me_avatar:
                    print(f"   - /auth/me vs /profile/me differ")
                if login_avatar != profile_me_avatar:
                    print(f"   - Login vs /profile/me differ")

            print("\n" + "=" * 80)
            print("ROOT CAUSE ANALYSIS:")
            print("=" * 80)

            # Check schema differences
            print("\n1. Schema Comparison:")
            print(f"   /auth/me uses:    UserResponse (from user.py)")
            print(f"   /profile/me uses: ProfileResponse (from profile.py)")

            # Check if both schemas include avatar_url
            auth_me_keys = set(auth_me_data.keys())
            profile_me_keys = set(profile_me_data.keys())

            print(f"\n2. Field Comparison:")
            print(f"   /auth/me fields:    {sorted(auth_me_keys)}")
            print(f"   /profile/me fields: {sorted(profile_me_keys)}")

            # Check for avatar_url field specifically
            print(f"\n3. avatar_url Field Check:")
            print(f"   /auth/me has 'avatar_url':    {'avatar_url' in auth_me_keys}")
            print(f"   /profile/me has 'avatar_url': {'avatar_url' in profile_me_keys}")

            # Check getCurrentUser() on frontend
            print(f"\n4. Frontend getCurrentUser() Status:")
            print(f"   getCurrentUser() calls: /profile/me")
            print(f"   Expected to receive: {profile_me_data.get('avatar_url', 'NULL')}")

            # Check User type on frontend
            print(f"\n5. Frontend User Type Check:")
            print(f"   User interface includes avatar_url?: Yes (optional)")
            print(f"   Type: avatar_url?: string | null")

        print("\n")


async def verify_database():
    """Direct database query to verify avatar_url"""
    print("6. DIRECT DATABASE CHECK")
    print("-" * 80)

    try:
        # Import database utilities
        import sys
        import os
        sys.path.insert(0, '/home/user/Critvue/backend')

        from app.db.session import get_db
        from app.models.user import User
        from sqlalchemy import select

        async for db in get_db():
            result = await db.execute(
                select(User.id, User.email, User.avatar_url)
                .where(User.email == TEST_USER['email'])
            )
            user_data = result.first()

            if user_data:
                print(f"Database Record Found:")
                print(f"  ID: {user_data[0]}")
                print(f"  Email: {user_data[1]}")
                print(f"  avatar_url: {user_data[2]}")
            else:
                print(f"No user found with email: {TEST_USER['email']}")

            break

    except Exception as e:
        print(f"Could not query database directly: {e}")
        print("Please run this SQL manually:")
        print(f"  SELECT id, email, avatar_url FROM users WHERE email = '{TEST_USER['email']}';")


if __name__ == "__main__":
    print("\nMake sure the backend is running on http://localhost:8000")
    print("Press Enter to continue...")
    input()

    asyncio.run(test_avatar_persistence())
    print("\n")
    asyncio.run(verify_database())
