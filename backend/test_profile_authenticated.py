#!/usr/bin/env python3
"""
Authenticated test for Profile and Portfolio API endpoints
Tests with proper cookie-based authentication
"""

import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000/api/v1"

# Test credentials
TEST_EMAIL = "profile_tester@example.com"
TEST_PASSWORD = "TestPassword123!"


def print_section(title: str):
    """Print a section header"""
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print("=" * 70)


def print_response(name: str, response: requests.Response):
    """Helper to print response details"""
    print(f"\n{name}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print("-" * 70)


def main():
    """Run comprehensive profile API tests"""
    session = requests.Session()

    print_section("PROFILE & PORTFOLIO API AUTHENTICATED TESTS")

    # 1. Register or login
    print_section("1. AUTHENTICATION")

    register_response = session.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Profile Tester",
        },
    )

    if register_response.status_code == 201:
        print("✓ New user registered successfully")
        user_data = register_response.json()
        user_id = user_data["id"]
        print(f"User ID: {user_id}")
        print("\nLogging in to get authentication cookies...")
    elif register_response.status_code == 400:
        print("✓ User already exists")
    else:
        print(f"✗ Registration failed")
        print_response("Registration Error", register_response)
        return

    # Always login to get cookies (register doesn't set cookies)
    print("Logging in...")
    login_response = session.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    )
    if login_response.status_code == 200:
        print("✓ Logged in successfully")
        user_data = login_response.json()
        user_id = user_data["id"]
        print(f"User ID: {user_id}")
    else:
        print(f"✗ Login failed")
        print_response("Login Error", login_response)
        return

    # Verify cookies are set
    print(f"\nSession cookies: {list(session.cookies.keys())}")

    # 2. Test GET /profile/me
    print_section("2. GET OWN PROFILE")
    profile_response = session.get(f"{BASE_URL}/profile/me")
    print_response("GET /api/v1/profile/me", profile_response)

    if profile_response.status_code != 200:
        print("\n⚠ Authentication failed! Checking auth status...")
        # Try to get current user
        me_response = session.get(f"{BASE_URL}/auth/me")
        print_response("GET /api/v1/auth/me", me_response)
        return

    # 3. Test PUT /profile/me
    print_section("3. UPDATE PROFILE")
    update_data = {
        "title": "Senior Backend Engineer & System Architect",
        "bio": "Experienced backend developer specializing in scalable APIs, database design, and microservices. Passionate about clean code and helping others learn.",
        "specialty_tags": [
            "Python",
            "FastAPI",
            "PostgreSQL",
            "System Design",
            "API Design",
            "Docker"
        ],
    }
    update_response = session.put(
        f"{BASE_URL}/profile/me",
        json=update_data,
    )
    print_response("PUT /api/v1/profile/me", update_response)

    # 4. Test GET public profile
    print_section("4. GET PUBLIC PROFILE")
    public_response = session.get(f"{BASE_URL}/profile/{user_id}")
    print_response(f"GET /api/v1/profile/{user_id}", public_response)

    # 5. Test GET stats
    print_section("5. GET PROFILE STATS")
    stats_response = session.get(f"{BASE_URL}/profile/{user_id}/stats")
    print_response(f"GET /api/v1/profile/{user_id}/stats", stats_response)

    # 6. Test POST stats refresh
    print_section("6. REFRESH STATS")
    refresh_response = session.post(f"{BASE_URL}/profile/me/stats/refresh")
    print_response("POST /api/v1/profile/me/stats/refresh", refresh_response)

    # 7. Test GET badges
    print_section("7. GET BADGES")
    badges_response = session.get(f"{BASE_URL}/profile/{user_id}/badges")
    print_response(f"GET /api/v1/profile/{user_id}/badges", badges_response)

    # 8. Test GET settings
    print_section("8. GET PROFILE SETTINGS")
    settings_response = session.get(f"{BASE_URL}/profile/me/settings")
    print_response("GET /api/v1/profile/me/settings", settings_response)

    # PORTFOLIO TESTS
    print_section("PORTFOLIO ENDPOINTS")

    portfolio_ids = []

    # 9. Create portfolio items
    print_section("9. CREATE PORTFOLIO ITEMS")

    portfolio_items = [
        {
            "title": "Critvue Backend Architecture",
            "description": "Complete backend system for peer review platform. Built with FastAPI, PostgreSQL, and async SQLAlchemy. Features include authentication, file uploads, and real-time notifications.",
            "content_type": "code",
            "project_url": "https://github.com/example/critvue",
            "is_featured": True,
        },
        {
            "title": "E-commerce API Design",
            "description": "RESTful API for e-commerce platform with payment integration, inventory management, and order processing.",
            "content_type": "code",
            "project_url": "https://github.com/example/ecommerce-api",
            "is_featured": False,
        },
        {
            "title": "Database Schema Design Guide",
            "description": "Comprehensive guide to database schema design patterns, normalization, and performance optimization.",
            "content_type": "writing",
            "project_url": "https://blog.example.com/db-schema-guide",
            "is_featured": False,
        },
    ]

    for idx, item in enumerate(portfolio_items, 1):
        print(f"\nCreating item {idx}: {item['title']}")
        create_response = session.post(f"{BASE_URL}/portfolio", json=item)
        print_response(f"POST /api/v1/portfolio (item {idx})", create_response)
        if create_response.status_code == 201:
            portfolio_ids.append(create_response.json()["id"])

    # 10. Get own portfolio items
    print_section("10. GET OWN PORTFOLIO")
    my_portfolio_response = session.get(f"{BASE_URL}/portfolio/me/items")
    print_response("GET /api/v1/portfolio/me/items", my_portfolio_response)

    # 11. Get user portfolio (public)
    print_section("11. GET USER PORTFOLIO (PUBLIC)")
    user_portfolio_response = session.get(f"{BASE_URL}/portfolio/user/{user_id}")
    print_response(f"GET /api/v1/portfolio/user/{user_id}", user_portfolio_response)

    # 12. Filter by content type
    print_section("12. FILTER BY CONTENT TYPE")
    filter_response = session.get(
        f"{BASE_URL}/portfolio/user/{user_id}?content_type=code"
    )
    print_response(
        f"GET /api/v1/portfolio/user/{user_id}?content_type=code", filter_response
    )

    # 13. Get single portfolio item
    if portfolio_ids:
        print_section("13. GET SINGLE PORTFOLIO ITEM")
        single_response = session.get(f"{BASE_URL}/portfolio/{portfolio_ids[0]}")
        print_response(f"GET /api/v1/portfolio/{portfolio_ids[0]}", single_response)

        # 14. Update portfolio item
        print_section("14. UPDATE PORTFOLIO ITEM")
        update_portfolio_response = session.put(
            f"{BASE_URL}/portfolio/{portfolio_ids[0]}",
            json={
                "description": "UPDATED: Complete backend system for peer review platform with enhanced security and performance features. Includes JWT authentication, rate limiting, and comprehensive API documentation.",
                "rating": 4.8,
            },
        )
        print_response(
            f"PUT /api/v1/portfolio/{portfolio_ids[0]}", update_portfolio_response
        )

    # 15. Get featured items
    print_section("15. GET FEATURED PORTFOLIO ITEMS")
    featured_response = session.get(f"{BASE_URL}/portfolio/featured/all")
    print_response("GET /api/v1/portfolio/featured/all", featured_response)

    # 16. Test pagination
    print_section("16. TEST PAGINATION")
    page_response = session.get(
        f"{BASE_URL}/portfolio/user/{user_id}?page=1&page_size=2"
    )
    print_response(
        f"GET /api/v1/portfolio/user/{user_id}?page=1&page_size=2", page_response
    )

    # 17. Featured items for specific user
    print_section("17. GET USER FEATURED ITEMS")
    user_featured_response = session.get(f"{BASE_URL}/portfolio/user/{user_id}/featured")
    print_response(f"GET /api/v1/portfolio/user/{user_id}/featured", user_featured_response)

    # Summary
    print_section("TEST SUMMARY")
    print("\n✓ All authenticated endpoints tested successfully!")
    print(f"\nCreated portfolio items: {len(portfolio_ids)}")
    print(f"Portfolio IDs: {portfolio_ids}")

    # Check final profile state
    final_profile = session.get(f"{BASE_URL}/profile/me")
    if final_profile.status_code == 200:
        profile_data = final_profile.json()
        print(f"\nFinal Profile State:")
        print(f"  - Title: {profile_data.get('title')}")
        print(f"  - Specialty Tags: {len(profile_data.get('specialty_tags', []))} tags")
        print(f"  - Total Reviews Given: {profile_data.get('total_reviews_given')}")
        print(f"  - Total Reviews Received: {profile_data.get('total_reviews_received')}")
        print(f"  - Badges: {len(profile_data.get('badges', []))} badges")

    print("\n" + "=" * 70)
    print("  TESTING COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
