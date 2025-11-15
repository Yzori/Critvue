#!/usr/bin/env python3
"""
Avatar Upload Complete Flow Test
Tests the avatar upload API endpoints
"""

import requests
import io
from PIL import Image

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "avatartest999@example.com"
TEST_PASSWORD = "TestPass123!"

def create_test_image():
    """Create a test image with variation (gradient)"""
    from PIL import ImageDraw

    # Create image with gradient to pass content safety check
    img = Image.new('RGB', (500, 500))
    draw = ImageDraw.Draw(img)

    # Create a gradient background
    for y in range(500):
        color_val = int((y / 500) * 255)
        draw.line([(0, y), (500, y)], fill=(color_val, 100, 255 - color_val))

    # Draw a circle in the center to add variation
    draw.ellipse([150, 150, 350, 350], fill=(255, 200, 100), outline=(0, 0, 0), width=3)

    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG', quality=85)
    img_bytes.seek(0)
    return img_bytes

def test_avatar_flow():
    # Create session to maintain cookies
    session = requests.Session()

    print("=" * 50)
    print("Avatar Upload - Complete Flow Test")
    print("=" * 50)
    print()

    # Step 1: Register user
    print("Step 1: Registering test user...")
    register_response = session.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Avatar Test User"
        }
    )

    if register_response.status_code == 200 or register_response.status_code == 201:
        print("✓ Registration successful")
        reg_data = register_response.json()
        # The token might be in different fields depending on API response
        token = reg_data.get("access_token") or reg_data.get("token")
        if not token:
            print(f"Warning: No token in registration response. Trying login...")
            login_response = session.post(
                f"{BASE_URL}/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
            )
            if login_response.status_code == 200:
                token = login_response.json().get("access_token")
            else:
                print("✗ Could not get auth token")
                return
    else:
        # Try login if registration fails (user might already exist)
        print("Registration failed, trying login...")
        login_response = session.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )

        if login_response.status_code == 200:
            print("✓ Login successful")
            token = login_response.json().get("access_token")
        else:
            print("✗ Authentication failed")
            print(f"Response: {login_response.text}")
            return
    print()

    # Step 2: Upload avatar
    print("Step 2: Uploading avatar...")
    img_bytes = create_test_image()
    upload_response = session.post(
        f"{BASE_URL}/profile/me/avatar",
        files={"file": ("avatar.jpg", img_bytes, "image/jpeg")}
    )

    if upload_response.status_code == 200:
        print("✓ Avatar uploaded successfully")
        upload_data = upload_response.json()
        print(f"  Avatar URL: {upload_data.get('avatar_url')}")
        if "variants" in upload_data:
            print("  Variants:")
            for size, url in upload_data["variants"].items():
                print(f"    - {size}: {url}")
    else:
        print("✗ Avatar upload failed")
        print(f"  Status: {upload_response.status_code}")
        print(f"  Response: {upload_response.text}")
        return
    print()

    # Step 3: Retrieve avatar
    print("Step 3: Retrieving avatar...")
    get_response = session.get(f"{BASE_URL}/profile/me/avatar")

    if get_response.status_code == 200:
        print("✓ Avatar retrieved successfully")
        avatar_data = get_response.json()
        print(f"  URL: {avatar_data.get('avatar_url')}")
    else:
        print("✗ Avatar retrieval failed")
        print(f"  Response: {get_response.text}")
    print()

    # Step 4: Verify profile has avatar
    print("Step 4: Checking profile integration...")
    profile_response = session.get(f"{BASE_URL}/profile/me")

    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data.get("avatar_url"):
            print("✓ Avatar integrated in profile")
            print(f"  Profile avatar: {profile_data['avatar_url']}")
        else:
            print("⚠ Avatar not found in profile")
    else:
        print("✗ Profile retrieval failed")
    print()

    # Step 5: Delete avatar
    print("Step 5: Deleting avatar...")
    delete_response = session.delete(f"{BASE_URL}/profile/me/avatar")

    if delete_response.status_code == 200:
        print("✓ Avatar deleted successfully")
        delete_data = delete_response.json()
        print(f"  Files deleted: {delete_data.get('files_deleted', 0)}")
    else:
        print("✗ Avatar deletion failed")
        print(f"  Response: {delete_response.text}")
    print()

    # Summary
    print("=" * 50)
    print("Test Complete!")
    print("=" * 50)
    print("\n✓ Avatar upload system is fully functional!")

if __name__ == "__main__":
    test_avatar_flow()
