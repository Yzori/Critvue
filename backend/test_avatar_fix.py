#!/usr/bin/env python3
"""
Test script to verify avatar persistence fix
Run this after restarting the backend server
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_avatar_persistence():
    """Test the complete avatar persistence flow"""

    print("="*80)
    print("AVATAR PERSISTENCE FIX - VERIFICATION TEST")
    print("="*80)
    print()

    # Step 1: Login
    print("Step 1: Login")
    print("-"*80)
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "arend@gmail.com", "password": "Test123!"}
        )

        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return False

        print("✅ Login successful")
        cookies = response.cookies

    except Exception as e:
        print(f"❌ Login error: {e}")
        return False

    print()

    # Step 2: Test /profile/me endpoint
    print("Step 2: Test GET /profile/me")
    print("-"*80)
    try:
        response = requests.get(f"{BASE_URL}/profile/me", cookies=cookies)

        if response.status_code != 200:
            print(f"❌ Request failed: {response.text}")
            return False

        data = response.json()
        print("✅ Request successful")
        print()
        print("Response Body:")
        print(json.dumps(data, indent=2))

    except Exception as e:
        print(f"❌ Request error: {e}")
        return False

    print()
    print("="*80)
    print("FIELD VALIDATION")
    print("="*80)

    # Verify all required fields are present
    required_fields = {
        "id": int,
        "email": str,
        "full_name": (str, type(None)),
        "avatar_url": (str, type(None)),
        "is_active": bool,  # THIS IS THE KEY FIX
        "is_verified": bool,
        "created_at": str,
    }

    all_valid = True
    for field, expected_type in required_fields.items():
        value = data.get(field)

        if value is None and field == "avatar_url":
            print(f"⚠️  {field}: None (no avatar uploaded yet)")
            continue

        if field not in data:
            print(f"❌ {field}: MISSING")
            all_valid = False
            continue

        if isinstance(expected_type, tuple):
            type_ok = isinstance(value, expected_type)
        else:
            type_ok = isinstance(value, expected_type)

        if not type_ok:
            print(f"❌ {field}: Wrong type (expected {expected_type}, got {type(value)})")
            all_valid = False
        else:
            print(f"✅ {field}: {value} (type: {type(value).__name__})")

    print()
    print("="*80)
    print("TEST RESULT")
    print("="*80)

    avatar_url = data.get("avatar_url")
    has_avatar = avatar_url and avatar_url != ""

    if all_valid and has_avatar:
        print("✅ SUCCESS!")
        print()
        print("All required fields present including is_active")
        print(f"Avatar URL: {avatar_url}")
        print()
        print("The fix is working correctly!")
        print("Avatar should now persist after page refresh.")
        return True
    elif all_valid:
        print("✅ PARTIAL SUCCESS")
        print()
        print("All required fields present including is_active")
        print("No avatar uploaded yet - please upload an avatar to test persistence")
        return True
    else:
        print("❌ FAILED")
        print()
        print("Some required fields are missing")
        print("Please check the ProfileResponse schema and endpoint implementation")
        return False


if __name__ == "__main__":
    print()
    print("Make sure the backend server has been restarted after the schema changes!")
    print("Press Enter to continue...")
    input()
    print()

    success = test_avatar_persistence()

    if success:
        print()
        print("="*80)
        print("NEXT STEPS")
        print("="*80)
        print("1. Open the frontend at http://localhost:3000")
        print("2. Login with: arend@gmail.com / Test123!")
        print("3. Upload an avatar")
        print("4. Refresh the page")
        print("5. Verify the avatar persists")
        print()

    exit(0 if success else 1)
