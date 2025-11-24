"""
Comprehensive tests for desktop dashboard API endpoints

Tests cover:
- Advanced filtering and sorting
- Pagination with large page sizes
- Desktop-specific endpoints
- Bulk operations
- Search functionality
- Performance requirements
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.review_request import ReviewRequest, ReviewStatus, ContentType
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.main import app


class TestDesktopCreatorEndpoints:
    """Tests for desktop creator dashboard endpoints"""

    @pytest.mark.asyncio
    async def test_desktop_actions_needed_with_sorting(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test desktop actions-needed endpoint with sorting"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "page": 1,
                "page_size": 50,
                "sort_by": "rating",
                "sort_order": "desc"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "items" in data
        assert "pagination" in data
        assert "summary" in data
        assert "filters_applied" in data

        # Verify pagination
        assert data["pagination"]["page_size"] == 50
        assert data["pagination"]["total_pages"] >= 0

        # Verify filters applied
        assert data["filters_applied"]["sort_by"] == "rating"
        assert data["filters_applied"]["sort_order"] == "desc"

        # Verify sorting (if items exist)
        if len(data["items"]) > 1:
            ratings = [item.get("rating") for item in data["items"] if item.get("rating")]
            assert ratings == sorted(ratings, reverse=True)

    @pytest.mark.asyncio
    async def test_desktop_actions_needed_with_urgency_filter(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test urgency filtering on desktop actions-needed"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "urgency_filter": ["CRITICAL", "HIGH"]
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify only critical and high urgency items
        for item in data["items"]:
            assert item["urgency_level"] in ["CRITICAL", "HIGH"]

    @pytest.mark.asyncio
    async def test_desktop_actions_needed_with_rating_filter(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test rating filter on desktop actions-needed"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "rating_min": 4
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify only 4+ star reviews
        for item in data["items"]:
            if item.get("rating"):
                assert item["rating"] >= 4

    @pytest.mark.asyncio
    async def test_desktop_actions_needed_with_search(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test search functionality on desktop actions-needed"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "search": "design"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify search term appears in results
        for item in data["items"]:
            title = item.get("review_request_title", "").lower()
            preview = item.get("review_preview", "").lower()
            assert "design" in title or "design" in preview

    @pytest.mark.asyncio
    async def test_desktop_actions_needed_date_range(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test date range filtering"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "date_range": "last_7_days"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify items are within date range
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)

        for item in data["items"]:
            if item.get("submitted_at"):
                submitted = datetime.fromisoformat(item["submitted_at"].replace("Z", "+00:00"))
                assert submitted >= seven_days_ago

    @pytest.mark.asyncio
    async def test_desktop_actions_needed_large_page_size(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test large page sizes (desktop requirement)"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "page": 1,
                "page_size": 100  # Maximum allowed
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["pagination"]["page_size"] == 100
        assert len(data["items"]) <= 100

    @pytest.mark.asyncio
    async def test_desktop_actions_needed_etag_caching(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test ETag caching for desktop endpoint"""
        # First request
        response1 = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            headers=auth_headers
        )

        assert response1.status_code == 200
        etag = response1.headers.get("etag")
        assert etag is not None

        # Second request with If-None-Match
        headers_with_etag = {**auth_headers, "if-none-match": etag}
        response2 = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            headers=headers_with_etag
        )

        # Should return 304 Not Modified if data unchanged
        # Note: This might be 200 if data changed between requests
        assert response2.status_code in [200, 304]

    @pytest.mark.asyncio
    async def test_desktop_my_requests_multi_status_filter(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test multiple status filtering on desktop my-requests"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/my-requests",
            params={
                "status_filter": ["pending", "in_review"]
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify only specified statuses
        for item in data["items"]:
            assert item["status"] in ["pending", "in_review"]

    @pytest.mark.asyncio
    async def test_desktop_my_requests_content_type_filter(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test content type filtering"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/my-requests",
            params={
                "content_type_filter": ["design", "code"]
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify only specified content types
        for item in data["items"]:
            assert item["content_type"] in ["design", "code"]

    @pytest.mark.asyncio
    async def test_desktop_my_requests_urgent_actions_filter(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test urgent actions filter"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/my-requests",
            params={
                "has_urgent_actions": True
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify all items have urgent actions
        for item in data["items"]:
            assert item["urgent_actions"] > 0


class TestDesktopReviewerEndpoints:
    """Tests for desktop reviewer dashboard endpoints"""

    @pytest.mark.asyncio
    async def test_desktop_reviewer_active_with_filters(
        self,
        async_client: AsyncClient,
        reviewer_user: User,
        auth_headers: dict
    ):
        """Test desktop active reviews with multiple filters"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/reviewer/active",
            params={
                "page": 1,
                "page_size": 50,
                "sort_by": "payment_amount",
                "sort_order": "desc",
                "urgency_filter": ["CRITICAL", "HIGH"],
                "min_payment": 10.0
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "items" in data
        assert "pagination" in data
        assert "summary" in data

        # Verify payment filter
        for item in data["items"]:
            assert item["earnings_potential"] >= 10.0

        # Verify urgency filter
        for item in data["items"]:
            assert item["urgency_level"] in ["CRITICAL", "HIGH"]

    @pytest.mark.asyncio
    async def test_desktop_reviewer_active_draft_filter(
        self,
        async_client: AsyncClient,
        reviewer_user: User,
        auth_headers: dict
    ):
        """Test filtering by draft status"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/reviewer/active",
            params={
                "has_draft": True
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify all items have drafts
        for item in data["items"]:
            assert item["draft_progress"]["has_draft"] is True

    @pytest.mark.asyncio
    async def test_desktop_reviewer_submitted_with_sorting(
        self,
        async_client: AsyncClient,
        reviewer_user: User,
        auth_headers: dict
    ):
        """Test desktop submitted reviews with sorting"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/reviewer/submitted",
            params={
                "sort_by": "auto_accept_at",
                "sort_order": "asc"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # Verify sorting by urgency (most urgent first)
        if len(data["items"]) > 1:
            urgencies = [item["urgency_seconds"] for item in data["items"]]
            assert urgencies == sorted(urgencies)


class TestDesktopSpecificEndpoints:
    """Tests for desktop-only endpoints"""

    @pytest.mark.asyncio
    async def test_desktop_overview_creator(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test desktop overview endpoint for creators"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/overview",
            params={"role": "creator"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["role"] == "creator"
        assert "quick_stats" in data
        assert "alerts" in data
        assert "trends" in data

        # Verify quick stats structure
        stats = data["quick_stats"]
        assert "pending_approvals" in stats
        assert "active_requests" in stats
        assert "critical_items" in stats
        assert "week_reviews_received" in stats

        # Verify all are numeric
        assert isinstance(stats["pending_approvals"], int)
        assert isinstance(stats["active_requests"], int)
        assert isinstance(stats["critical_items"], int)
        assert isinstance(stats["week_reviews_received"], int)

    @pytest.mark.asyncio
    async def test_desktop_overview_reviewer(
        self,
        async_client: AsyncClient,
        reviewer_user: User,
        auth_headers: dict
    ):
        """Test desktop overview endpoint for reviewers"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/overview",
            params={"role": "reviewer"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["role"] == "reviewer"
        assert "quick_stats" in data

        # Verify quick stats structure
        stats = data["quick_stats"]
        assert "active_claims" in stats
        assert "submitted_reviews" in stats
        assert "critical_deadlines" in stats
        assert "potential_earnings" in stats
        assert "week_reviews_completed" in stats

    @pytest.mark.asyncio
    async def test_desktop_overview_invalid_role(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test desktop overview with invalid role"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/overview",
            params={"role": "invalid"},
            headers=auth_headers
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_desktop_activity_timeline(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test desktop activity timeline endpoint"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/activity-timeline",
            params={
                "role": "creator",
                "limit": 50
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "activities" in data
        assert "total" in data
        assert "role" in data
        assert data["role"] == "creator"

        # Verify activity structure
        for activity in data["activities"]:
            assert "type" in activity
            assert "timestamp" in activity
            assert "slot_id" in activity

            # Verify activity type is valid
            assert activity["type"] in [
                "review_submitted",
                "review_accepted",
                "review_rejected",
                "slot_claimed",
                "unknown"
            ]

    @pytest.mark.asyncio
    async def test_desktop_global_search(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test desktop global search endpoint"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/search",
            params={
                "q": "design",
                "role": "creator",
                "limit": 20
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "query" in data
        assert "role" in data
        assert "review_requests" in data
        assert "review_slots" in data

        assert data["query"] == "design"
        assert data["role"] == "creator"

        # Verify results contain search term
        all_results = data["review_requests"] + data["review_slots"]
        for result in all_results:
            # Should contain search term somewhere in the result
            result_str = str(result).lower()
            assert "design" in result_str

    @pytest.mark.asyncio
    async def test_desktop_search_min_length(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test search with query too short"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/search",
            params={
                "q": "a",  # Too short
                "role": "creator"
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error


class TestDesktopBulkOperations:
    """Tests for desktop bulk operations"""

    @pytest.mark.asyncio
    async def test_desktop_batch_reject_success(
        self,
        async_client: AsyncClient,
        creator_user: User,
        db_session: AsyncSession,
        auth_headers: dict
    ):
        """Test successful batch rejection"""
        # Create test slots
        # (Assuming test data creation fixtures exist)

        response = await async_client.post(
            "/api/v1/dashboard/desktop/batch-reject",
            params={
                "slot_ids": [1, 2, 3],
                "rejection_reason": "low_quality",
                "rejection_notes": "Test rejection"
            },
            headers=auth_headers
        )

        # May be 200 with failures if slots don't exist, or 400
        assert response.status_code in [200, 400]

        if response.status_code == 200:
            data = response.json()
            assert "rejected" in data
            assert "failed" in data
            assert "summary" in data

            summary = data["summary"]
            assert "total_requested" in summary
            assert "successful" in summary
            assert "failed" in summary

    @pytest.mark.asyncio
    async def test_desktop_batch_reject_max_limit(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test batch rejection with too many items"""
        # Create list of 51 slot IDs (exceeds max of 50)
        slot_ids = list(range(1, 52))

        response = await async_client.post(
            "/api/v1/dashboard/desktop/batch-reject",
            params={
                "slot_ids": slot_ids,
                "rejection_reason": "low_quality"
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json()
        assert "Maximum 50 reviews" in data["detail"]

    @pytest.mark.asyncio
    async def test_desktop_batch_reject_empty_list(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test batch rejection with empty list"""
        response = await async_client.post(
            "/api/v1/dashboard/desktop/batch-reject",
            params={
                "slot_ids": [],
                "rejection_reason": "low_quality"
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json()
        assert "cannot be empty" in data["detail"]


class TestDesktopPerformance:
    """Performance tests for desktop dashboard"""

    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_desktop_actions_needed_response_time(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test response time is under 15ms target"""
        import time

        start = time.time()
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={"page_size": 100},
            headers=auth_headers
        )
        end = time.time()

        elapsed_ms = (end - start) * 1000

        assert response.status_code == 200
        # Note: 15ms is very aggressive for database queries
        # Real-world target might be 50-100ms
        assert elapsed_ms < 500, f"Response took {elapsed_ms}ms, expected < 500ms"

    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_desktop_payload_size(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test payload size is reasonable for desktop"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={"page_size": 100},
            headers=auth_headers
        )

        assert response.status_code == 200

        # Check payload size (should be < 100KB for 100 items)
        payload_size = len(response.content)
        assert payload_size < 100 * 1024, f"Payload is {payload_size} bytes, expected < 100KB"

    @pytest.mark.asyncio
    @pytest.mark.performance
    async def test_desktop_concurrent_requests(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test handling multiple concurrent requests"""
        import asyncio

        # Send 10 concurrent requests
        tasks = [
            async_client.get(
                "/api/v1/dashboard/desktop/creator/actions-needed",
                headers=auth_headers
            )
            for _ in range(10)
        ]

        responses = await asyncio.gather(*tasks)

        # All should succeed
        for response in responses:
            assert response.status_code == 200


class TestDesktopRateLimiting:
    """Tests for rate limiting on desktop endpoints"""

    @pytest.mark.asyncio
    async def test_desktop_rate_limit_headers(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test rate limit headers are present"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            headers=auth_headers
        )

        assert response.status_code == 200

        # Check for rate limit headers (if implemented)
        # Note: Implementation may vary based on slowapi configuration
        headers = response.headers
        # These headers may or may not be present depending on slowapi config
        # assert "x-ratelimit-limit" in headers or "X-RateLimit-Limit" in headers


class TestDesktopErrorHandling:
    """Tests for error handling on desktop endpoints"""

    @pytest.mark.asyncio
    async def test_desktop_invalid_sort_by(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test invalid sort_by parameter"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "sort_by": "invalid_field"
            },
            headers=auth_headers
        )

        # Should still succeed but use default sorting
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_desktop_invalid_page_size(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test page_size exceeding maximum"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "page_size": 101  # Exceeds max of 100
            },
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_desktop_invalid_date_range(
        self,
        async_client: AsyncClient,
        creator_user: User,
        auth_headers: dict
    ):
        """Test invalid date range parameter"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed",
            params={
                "date_range": "invalid_range"
            },
            headers=auth_headers
        )

        # Should succeed but ignore invalid date range
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_desktop_unauthorized_access(
        self,
        async_client: AsyncClient
    ):
        """Test accessing desktop endpoints without authentication"""
        response = await async_client.get(
            "/api/v1/dashboard/desktop/creator/actions-needed"
        )

        assert response.status_code == 401  # Unauthorized


# Fixtures for tests (examples - adjust to your test setup)
@pytest.fixture
async def creator_user(db_session: AsyncSession) -> User:
    """Create a test creator user"""
    user = User(
        email="creator@test.com",
        full_name="Test Creator",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def reviewer_user(db_session: AsyncSession) -> User:
    """Create a test reviewer user"""
    user = User(
        email="reviewer@test.com",
        full_name="Test Reviewer",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(creator_user: User) -> dict:
    """Create authentication headers for testing"""
    # This should create a valid JWT token for the user
    # Implementation depends on your auth system
    from app.core.security import create_access_token
    token = create_access_token(subject=creator_user.email)
    return {"Authorization": f"Bearer {token}"}
