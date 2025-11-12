"""
Test script for Profile and Portfolio API endpoints

This script tests all the new profile and portfolio endpoints.
Run the backend server before executing this script.
"""

import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000/api/v1"

# Test credentials (you'll need to have a user registered)
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "TestPassword123!"


def print_response(name: str, response: requests.Response):
    """Helper to print response details"""
    print(f"\n{'=' * 60}")
    print(f"Test: {name}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("=" * 60)


def test_profile_endpoints():
    """Test profile endpoints"""
    session = requests.Session()

    # 1. Register a test user
    print("\n1. Registering test user...")
    register_response = session.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test User",
        },
    )
    if register_response.status_code == 201:
        print("✓ User registered successfully")
        user_id = register_response.json()["id"]
    elif register_response.status_code == 400:
        print("✓ User already exists, logging in...")
        # Login instead
        login_response = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        )
        if login_response.status_code == 200:
            print("✓ Logged in successfully")
            user_id = login_response.json()["id"]
        else:
            print(f"✗ Login failed: {login_response.json()}")
            return
    else:
        print(f"✗ Registration failed: {register_response.json()}")
        return

    # 2. Get own profile
    print("\n2. Getting own profile...")
    profile_response = session.get(f"{BASE_URL}/profile/me")
    print_response("GET /profile/me", profile_response)

    # 3. Update profile
    print("\n3. Updating profile...")
    update_response = session.put(
        f"{BASE_URL}/profile/me",
        json={
            "title": "Full Stack Developer & UX Designer",
            "bio": "Passionate about creating accessible and performant web applications. Love helping others improve their work through constructive feedback.",
            "specialty_tags": [
                "React",
                "TypeScript",
                "Python",
                "UI/UX",
                "Accessibility",
            ],
        },
    )
    print_response("PUT /profile/me", update_response)

    # 4. Get public profile
    print("\n4. Getting public profile...")
    public_profile_response = session.get(f"{BASE_URL}/profile/{user_id}")
    print_response(f"GET /profile/{user_id}", public_profile_response)

    # 5. Get profile stats
    print("\n5. Getting profile stats...")
    stats_response = session.get(f"{BASE_URL}/profile/{user_id}/stats")
    print_response(f"GET /profile/{user_id}/stats", stats_response)

    # 6. Refresh stats (trigger calculation)
    print("\n6. Refreshing stats...")
    refresh_response = session.post(f"{BASE_URL}/profile/me/stats/refresh")
    print_response("POST /profile/me/stats/refresh", refresh_response)

    # 7. Get badges
    print("\n7. Getting badges...")
    badges_response = session.get(f"{BASE_URL}/profile/{user_id}/badges")
    print_response(f"GET /profile/{user_id}/badges", badges_response)

    return session, user_id


def test_portfolio_endpoints(session: requests.Session, user_id: int):
    """Test portfolio endpoints"""

    # 1. Create portfolio items
    print("\n\n" + "=" * 60)
    print("TESTING PORTFOLIO ENDPOINTS")
    print("=" * 60)

    portfolio_items = [
        {
            "title": "E-commerce Platform Redesign",
            "description": "Complete UX overhaul of a major e-commerce platform, focusing on checkout flow optimization and mobile responsiveness.",
            "content_type": "design",
            "project_url": "https://example.com/project1",
            "is_featured": True,
        },
        {
            "title": "React Component Library",
            "description": "Comprehensive component library built with React, TypeScript, and Tailwind CSS. Includes 50+ accessible components.",
            "content_type": "code",
            "project_url": "https://github.com/example/components",
            "is_featured": False,
        },
        {
            "title": "API Documentation Site",
            "description": "Technical documentation for a REST API, with interactive examples and code snippets.",
            "content_type": "writing",
            "project_url": "https://docs.example.com",
            "is_featured": False,
        },
    ]

    created_ids = []
    for idx, item in enumerate(portfolio_items, 1):
        print(f"\n{idx}. Creating portfolio item: {item['title']}")
        create_response = session.post(f"{BASE_URL}/portfolio", json=item)
        print_response(f"POST /portfolio (item {idx})", create_response)
        if create_response.status_code == 201:
            created_ids.append(create_response.json()["id"])

    # 2. Get user's portfolio
    print("\n2. Getting user portfolio...")
    portfolio_response = session.get(f"{BASE_URL}/portfolio/user/{user_id}")
    print_response(f"GET /portfolio/user/{user_id}", portfolio_response)

    # 3. Get own portfolio items
    print("\n3. Getting own portfolio items...")
    my_portfolio_response = session.get(f"{BASE_URL}/portfolio/me/items")
    print_response("GET /portfolio/me/items", my_portfolio_response)

    # 4. Filter by content type
    print("\n4. Filtering by content type (design)...")
    filter_response = session.get(
        f"{BASE_URL}/portfolio/user/{user_id}?content_type=design"
    )
    print_response(
        f"GET /portfolio/user/{user_id}?content_type=design", filter_response
    )

    # 5. Get single portfolio item
    if created_ids:
        print(f"\n5. Getting single portfolio item (ID: {created_ids[0]})...")
        single_response = session.get(f"{BASE_URL}/portfolio/{created_ids[0]}")
        print_response(f"GET /portfolio/{created_ids[0]}", single_response)

        # 6. Update portfolio item
        print(f"\n6. Updating portfolio item (ID: {created_ids[0]})...")
        update_response = session.put(
            f"{BASE_URL}/portfolio/{created_ids[0]}",
            json={
                "description": "UPDATED: Complete UX overhaul with improved accessibility and performance metrics.",
                "is_featured": True,
            },
        )
        print_response(f"PUT /portfolio/{created_ids[0]}", update_response)

    # 7. Get featured portfolio items
    print("\n7. Getting featured portfolio items...")
    featured_response = session.get(f"{BASE_URL}/portfolio/featured/all")
    print_response("GET /portfolio/featured/all", featured_response)

    # 8. Pagination test
    print("\n8. Testing pagination...")
    page_response = session.get(
        f"{BASE_URL}/portfolio/user/{user_id}?page=1&page_size=2"
    )
    print_response(
        f"GET /portfolio/user/{user_id}?page=1&page_size=2", page_response
    )

    return created_ids


def test_cleanup(session: requests.Session, portfolio_ids: list):
    """Clean up test data (optional)"""
    print("\n\n" + "=" * 60)
    print("CLEANUP (Optional - uncomment to delete test data)")
    print("=" * 60)

    # Uncomment to delete portfolio items
    # for portfolio_id in portfolio_ids:
    #     print(f"Deleting portfolio item {portfolio_id}...")
    #     delete_response = session.delete(f"{BASE_URL}/portfolio/{portfolio_id}")
    #     print(f"Status: {delete_response.status_code}")


if __name__ == "__main__":
    print("=" * 60)
    print("Profile & Portfolio API Test Suite")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print("=" * 60)

    try:
        # Test profile endpoints
        session, user_id = test_profile_endpoints()

        # Test portfolio endpoints
        portfolio_ids = test_portfolio_endpoints(session, user_id)

        # Optional cleanup
        # test_cleanup(session, portfolio_ids)

        print("\n\n" + "=" * 60)
        print("ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)

    except Exception as e:
        print(f"\n\nERROR: {str(e)}")
        import traceback

        traceback.print_exc()
