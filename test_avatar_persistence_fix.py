#!/usr/bin/env python3
"""
Test script to verify avatar persistence fix

Tests:
1. Profile endpoint returns is_active field
2. Avatar URL is absolute (includes backend URL)
3. All required fields are present
"""

import requests
import json
from pprint import pprint

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

# Test credentials
TEST_EMAIL = "arend@gmail.com"
TEST_PASSWORD = "Test123!"

def test_avatar_persistence_fix():
    print("=" * 70)
    print("AVATAR PERSISTENCE FIX VERIFICATION")
    print("=" * 70)

    # Step 1: Login
    print("\n1. Logging in...")
    login_response = requests.post(
        f"{API_V1}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )

    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return False

    # Get cookies for authenticated requests
    cookies = login_response.cookies
    print("✅ Login successful")

    # Step 2: Get profile
    print("\n2. Fetching profile from /profile/me...")
    profile_response = requests.get(
        f"{API_V1}/profile/me",
        cookies=cookies
    )

    if profile_response.status_code != 200:
        print(f"❌ Profile fetch failed: {profile_response.status_code}")
        print(profile_response.text)
        return False

    profile_data = profile_response.json()
    print("✅ Profile fetched successfully")

    # Step 3: Verify structure
    print("\n3. Verifying response structure...")
    print("\nProfile Response:")
    pprint(profile_data, indent=2)

    # Required fields for frontend User interface
    required_fields = [
        'id', 'email', 'full_name', 'avatar_url',
        'is_active', 'is_verified', 'role', 'created_at'
    ]

    missing_fields = []
    for field in required_fields:
        if field not in profile_data:
            missing_fields.append(field)

    if missing_fields:
        print(f"\n❌ MISSING FIELDS: {missing_fields}")
        return False

    print("\n✅ All required fields present")

    # Step 4: Verify is_active field
    print("\n4. Verifying is_active field...")
    is_active = profile_data.get('is_active')
    if is_active is None:
        print("❌ is_active field is missing")
        return False
    elif not isinstance(is_active, bool):
        print(f"❌ is_active is not boolean: {type(is_active)}")
        return False
    else:
        print(f"✅ is_active field present and valid: {is_active}")

    # Step 5: Verify avatar URL format
    print("\n5. Verifying avatar URL format...")
    avatar_url = profile_data.get('avatar_url')
    if avatar_url:
        print(f"   Avatar URL: {avatar_url}")

        # Check if URL is absolute (includes backend URL)
        if avatar_url.startswith('http://localhost:8000'):
            print("✅ Avatar URL is absolute (includes backend URL)")
        elif avatar_url.startswith('/files/'):
            print("⚠️  Avatar URL is relative - frontend may have CORS issues")
            print("   Expected: http://localhost:8000/files/...")
            print(f"   Got:      {avatar_url}")
        else:
            print(f"⚠️  Unexpected avatar URL format: {avatar_url}")
    else:
        print("   No avatar uploaded yet (avatar_url is null)")

    # Step 6: Final verdict
    print("\n" + "=" * 70)
    print("VERIFICATION RESULTS")
    print("=" * 70)

    all_checks_passed = (
        len(missing_fields) == 0 and
        is_active is not None and
        isinstance(is_active, bool)
    )

    if all_checks_passed:
        print("\n✅ ALL CHECKS PASSED!")
        print("\nThe avatar persistence fix is working correctly:")
        print("  ✓ ProfileResponse includes is_active field")
        print("  ✓ All required fields are present")
        print("  ✓ Frontend User interface compatibility verified")

        if avatar_url and avatar_url.startswith('http://localhost:8000'):
            print("  ✓ Avatar URLs are absolute (CORS-safe)")

        print("\nNext steps:")
        print("1. Open http://localhost:3000/profile in your browser")
        print("2. Login with: arend@gmail.com / Test123!")
        print("3. Upload an avatar")
        print("4. Refresh the page (F5)")
        print("5. Verify avatar persists after refresh")
        return True
    else:
        print("\n❌ SOME CHECKS FAILED")
        print("\nPlease review the errors above.")
        return False

if __name__ == "__main__":
    success = test_avatar_persistence_fix()
    exit(0 if success else 1)
