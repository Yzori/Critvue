"""
Comprehensive integration tests for review request creation and browse marketplace flow.

This test suite covers:
1. Review Creation Flow - Create review request and verify it appears in browse
2. Security Tests - Authorization, ownership, and access control
3. Review Slot Tests - Slot creation, claiming, and state management
4. Data Validation Tests - Input validation and error handling
5. Edge Cases - Race conditions, state transitions, and boundary conditions

Test Structure:
- Uses pytest with async support
- Uses local fixtures for database to avoid import order issues
- Tests critical paths: review creation → status update → browse visibility → slot claiming
- Validates security controls and business logic constraints
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Import models FIRST to ensure they're registered with Base.metadata
from app.models.user import Base, User, UserRole
from app.models.review_request import ReviewRequest, ReviewStatus, ContentType, ReviewType
from app.models.review_file import ReviewFile
from app.models.review_slot import ReviewSlot, ReviewSlotStatus

# Then import app
from app.main import app
from app.db.session import get_db
from app.core.security import get_password_hash, create_access_token


# Test database configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# ============================================================================
# Local Database Fixtures (to avoid import order issues in conftest)
# ============================================================================

@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine with in-memory SQLite."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()



@pytest.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create an async HTTP client for testing API endpoints."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a standard test user."""
    user = User(
        email="testuser@example.com",
        hashed_password=get_password_hash("ValidPassword123!"),
        full_name="Test User",
        is_active=True,
        is_verified=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def auth_cookies(test_user: User) -> dict[str, str]:
    """Create authentication cookies for test_user."""
    token = create_access_token(
        data={"user_id": test_user.id, "email": test_user.email}
    )
    # Return token to be used as cookie in httpx client
    return {"access_token": token}


# ============================================================================
# Fixtures for Review Testing
# ============================================================================

@pytest.fixture
async def second_user(db_session: AsyncSession) -> User:
    """
    Create a second test user for multi-user testing.

    Email: reviewer@example.com
    Password: ValidPassword123!
    Status: Active
    """
    from app.core.security import get_password_hash

    user = User(
        email="reviewer@example.com",
        hashed_password=get_password_hash("ValidPassword123!"),
        full_name="Reviewer User",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def second_auth_headers(second_user: User) -> dict[str, str]:
    """
    Create authentication headers for second_user.

    Returns:
        Dictionary with Authorization header containing Bearer token
    """
    from app.core.security import create_access_token

    token = create_access_token(
        data={"user_id": second_user.id, "email": second_user.email}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def valid_review_data() -> dict:
    """
    Provide valid review request creation data.
    """
    return {
        "title": "Design Review for Mobile App",
        "description": "Looking for feedback on my mobile app's UI/UX design. Specifically interested in color scheme and navigation flow.",
        "content_type": "design",
        "review_type": "expert",
        "budget": 49.00,
        "reviews_requested": 2,
        "feedback_areas": "UI/UX, Color scheme, Typography",
        "status": "draft"
    }


@pytest.fixture
def free_review_data() -> dict:
    """
    Provide valid free review request data.
    """
    return {
        "title": "Code Review for Python Script",
        "description": "Need feedback on my Python script for web scraping. Looking for suggestions on code quality and performance.",
        "content_type": "code",
        "review_type": "free",
        "reviews_requested": 2,
        "feedback_areas": "Code quality, Performance, Best practices",
        "status": "draft"
    }


# ============================================================================
# Test 1: Review Creation Flow
# ============================================================================

class TestReviewCreationFlow:
    """Test complete flow from creation to browse marketplace visibility"""

    @pytest.mark.asyncio
    async def test_create_draft_review(
        self,
        client: AsyncClient,
        auth_cookies: dict,
        valid_review_data: dict
    ):
        """
        Test creating a draft review request.

        Expected: Review is created with draft status and does not appear in browse.
        """
        # Create review
        response = await client.post(
            "/api/v1/reviews",
            json=valid_review_data,
            cookies=auth_cookies
        )

        assert response.status_code == 201
        data = response.json()

        # Verify response structure
        assert data["title"] == valid_review_data["title"]
        assert data["description"] == valid_review_data["description"]
        assert data["content_type"] == valid_review_data["content_type"]
        assert data["review_type"] == valid_review_data["review_type"]
        assert float(data["budget"]) == valid_review_data["budget"]
        assert data["reviews_requested"] == valid_review_data["reviews_requested"]
        assert data["status"] == "draft"
        assert data["reviews_claimed"] == 0
        assert data["reviews_completed"] == 0
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

        # Verify draft review does NOT appear in browse marketplace
        browse_response = await client.get("/api/v1/reviews/browse")
        assert browse_response.status_code == 200
        browse_data = browse_response.json()

        # Should not find our draft review
        review_ids = [r["id"] for r in browse_data["reviews"]]
        assert data["id"] not in review_ids

    @pytest.mark.asyncio
    async def test_create_and_publish_review(
        self,
        client: AsyncClient,
        auth_headers: dict,
        valid_review_data: dict
    ):
        """
        Test creating a review and updating it to pending status.

        Expected:
        - Review slots are created automatically when status changes to pending
        - Review appears in browse marketplace
        - available_slots equals reviews_requested
        """
        # Step 1: Create draft review
        create_response = await client.post(
            "/api/v1/reviews",
            json=valid_review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Step 2: Update status to pending
        update_response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"status": "pending"},
            headers=auth_headers
        )
        assert update_response.status_code == 200
        updated_data = update_response.json()

        # Verify status change
        assert updated_data["status"] == "pending"
        assert updated_data["reviews_claimed"] == 0

        # Verify slots were created
        assert "slots" in updated_data
        assert len(updated_data["slots"]) == valid_review_data["reviews_requested"]

        # Verify all slots are available
        for slot in updated_data["slots"]:
            assert slot["status"] == "available"
            assert slot["reviewer_id"] is None
            assert float(slot["payment_amount"]) == valid_review_data["budget"] / valid_review_data["reviews_requested"]

        # Step 3: Verify review appears in browse marketplace
        browse_response = await client.get("/api/v1/reviews/browse")
        assert browse_response.status_code == 200
        browse_data = browse_response.json()

        # Find our review in browse results
        our_review = next((r for r in browse_data["reviews"] if r["id"] == review_id), None)
        assert our_review is not None
        assert our_review["title"] == valid_review_data["title"]
        assert our_review["content_type"] == valid_review_data["content_type"]
        assert our_review["review_type"] == valid_review_data["review_type"]
        assert our_review["reviews_requested"] == valid_review_data["reviews_requested"]
        assert our_review["reviews_claimed"] == 0
        assert our_review["available_slots"] == valid_review_data["reviews_requested"]

    @pytest.mark.asyncio
    async def test_browse_filters_work(
        self,
        client: AsyncClient,
        auth_headers: dict,
        valid_review_data: dict
    ):
        """
        Test browse marketplace filtering by content_type and review_type.

        Expected: Filters correctly return only matching reviews.
        """
        # Create and publish a design expert review
        design_data = valid_review_data.copy()
        design_data["status"] = "pending"

        design_response = await client.post(
            "/api/v1/reviews",
            json=design_data,
            headers=auth_headers
        )
        assert design_response.status_code == 201
        design_id = design_response.json()["id"]

        # Create and publish a code free review
        code_data = {
            "title": "Code Review Needed",
            "description": "Need feedback on my Python code for a data analysis project.",
            "content_type": "code",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "pending"
        }

        code_response = await client.post(
            "/api/v1/reviews",
            json=code_data,
            headers=auth_headers
        )
        assert code_response.status_code == 201
        code_id = code_response.json()["id"]

        # Test filter by content_type=design
        design_filter_response = await client.get(
            "/api/v1/reviews/browse?content_type=design"
        )
        assert design_filter_response.status_code == 200
        design_results = design_filter_response.json()["reviews"]
        design_ids = [r["id"] for r in design_results]

        assert design_id in design_ids
        assert code_id not in design_ids

        # Test filter by review_type=expert
        expert_filter_response = await client.get(
            "/api/v1/reviews/browse?review_type=expert"
        )
        assert expert_filter_response.status_code == 200
        expert_results = expert_filter_response.json()["reviews"]
        expert_ids = [r["id"] for r in expert_results]

        assert design_id in expert_ids
        assert code_id not in expert_ids

        # Test combined filter
        combined_response = await client.get(
            "/api/v1/reviews/browse?content_type=design&review_type=expert"
        )
        assert combined_response.status_code == 200
        combined_results = combined_response.json()["reviews"]
        combined_ids = [r["id"] for r in combined_results]

        assert design_id in combined_ids
        assert code_id not in combined_ids


# ============================================================================
# Test 2: Security Tests
# ============================================================================

class TestReviewSecurity:
    """Test authorization, ownership, and access control"""

    @pytest.mark.asyncio
    async def test_cannot_edit_other_users_review(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict,
        valid_review_data: dict
    ):
        """
        Test that User B cannot edit User A's review.

        Expected: 404 Not Found (to avoid information disclosure)
        """
        # User A creates a review
        create_response = await client.post(
            "/api/v1/reviews",
            json=valid_review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # User B tries to edit User A's review
        edit_response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"title": "Hacked Title"},
            headers=second_auth_headers
        )

        # Should return 404 (not 403) to avoid information disclosure
        assert edit_response.status_code == 404

        # Verify original review is unchanged
        get_response = await client.get(
            f"/api/v1/reviews/{review_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["title"] == valid_review_data["title"]

    @pytest.mark.asyncio
    async def test_cannot_claim_own_review(
        self,
        client: AsyncClient,
        auth_headers: dict,
        valid_review_data: dict
    ):
        """
        Test that user cannot claim their own review request.

        Expected: 403 Forbidden with clear error message
        """
        # Create and publish review
        review_data = valid_review_data.copy()
        review_data["status"] = "pending"

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Try to claim own review
        claim_response = await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=auth_headers
        )

        assert claim_response.status_code == 403
        assert "cannot claim your own" in claim_response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_anonymous_cannot_create_review(
        self,
        client: AsyncClient,
        valid_review_data: dict
    ):
        """
        Test that anonymous users cannot create reviews.

        Expected: 401 Unauthorized
        """
        response = await client.post(
            "/api/v1/reviews",
            json=valid_review_data
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_anonymous_can_browse_reviews(
        self,
        client: AsyncClient,
        auth_headers: dict,
        valid_review_data: dict
    ):
        """
        Test that anonymous users can browse marketplace (public endpoint).

        Expected: 200 OK with reviews list
        """
        # First, create some reviews as authenticated user
        review_data = valid_review_data.copy()
        review_data["status"] = "pending"

        await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )

        # Browse without authentication
        browse_response = await client.get("/api/v1/reviews/browse")

        assert browse_response.status_code == 200
        data = browse_response.json()
        assert "reviews" in data
        assert "total" in data
        assert isinstance(data["reviews"], list)


# ============================================================================
# Test 3: Review Slot Tests
# ============================================================================

class TestReviewSlots:
    """Test slot creation, claiming, and state management"""

    @pytest.mark.asyncio
    async def test_slots_created_on_pending_transition(
        self,
        client: AsyncClient,
        auth_headers: dict,
        valid_review_data: dict
    ):
        """
        Test that review slots are created when status changes to pending.

        Expected:
        - Number of slots equals reviews_requested
        - All slots have status "available"
        - Payment amount is budget divided by reviews_requested
        """
        # Create draft review
        create_response = await client.post(
            "/api/v1/reviews",
            json=valid_review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Update to pending
        update_response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"status": "pending"},
            headers=auth_headers
        )
        assert update_response.status_code == 200
        data = update_response.json()

        # Verify slots
        assert len(data["slots"]) == valid_review_data["reviews_requested"]

        expected_payment_per_slot = Decimal(str(valid_review_data["budget"])) / Decimal(str(valid_review_data["reviews_requested"]))

        for slot in data["slots"]:
            assert slot["status"] == "available"
            assert slot["reviewer_id"] is None
            assert Decimal(str(slot["payment_amount"])) == expected_payment_per_slot

    @pytest.mark.asyncio
    async def test_claim_review_slot_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict,
        valid_review_data: dict
    ):
        """
        Test successful review slot claiming.

        Expected:
        - reviews_claimed increments
        - Status changes to IN_REVIEW on first claim
        - available_slots decrements
        """
        # User A creates and publishes review
        review_data = valid_review_data.copy()
        review_data["status"] = "pending"

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # User B claims the review
        claim_response = await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=second_auth_headers
        )

        assert claim_response.status_code == 200
        claim_data = claim_response.json()

        # Verify claim response
        assert claim_data["success"] is True
        assert claim_data["reviews_claimed"] == 1
        assert claim_data["available_slots"] == valid_review_data["reviews_requested"] - 1
        assert claim_data["is_fully_claimed"] is False

        # Verify review status changed to IN_REVIEW
        get_response = await client.get(
            f"/api/v1/reviews/{review_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        review = get_response.json()

        assert review["status"] == "in_review"
        assert review["reviews_claimed"] == 1

    @pytest.mark.asyncio
    async def test_claim_all_slots(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict,
        db_session: AsyncSession
    ):
        """
        Test claiming all available slots.

        Expected:
        - All slots get claimed
        - Review disappears from browse (no available slots)
        - is_fully_claimed becomes True
        """
        # Create review with reviews_requested=2
        review_data = {
            "title": "Test Review",
            "description": "Testing slot claiming functionality with multiple reviewers.",
            "content_type": "design",
            "review_type": "expert",
            "budget": 50.00,
            "reviews_requested": 2,
            "status": "pending"
        }

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Create third user for second claim
        from app.core.security import get_password_hash, create_access_token

        third_user = User(
            email="third@example.com",
            hashed_password=get_password_hash("ValidPassword123!"),
            full_name="Third User",
            is_active=True,
            is_verified=True
        )
        db_session.add(third_user)
        await db_session.commit()
        await db_session.refresh(third_user)

        third_auth_token = create_access_token(
            data={"user_id": third_user.id, "email": third_user.email}
        )
        third_auth_headers = {"Authorization": f"Bearer {third_auth_token}"}

        # First claim by second_user
        claim1_response = await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=second_auth_headers
        )
        assert claim1_response.status_code == 200
        assert claim1_response.json()["reviews_claimed"] == 1
        assert claim1_response.json()["is_fully_claimed"] is False

        # Second claim by third_user
        claim2_response = await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=third_auth_headers
        )
        assert claim2_response.status_code == 200
        claim2_data = claim2_response.json()

        assert claim2_data["reviews_claimed"] == 2
        assert claim2_data["available_slots"] == 0
        assert claim2_data["is_fully_claimed"] is True

        # Verify review no longer appears in browse (no available slots)
        browse_response = await client.get("/api/v1/reviews/browse")
        assert browse_response.status_code == 200
        browse_data = browse_response.json()

        review_ids = [r["id"] for r in browse_data["reviews"]]
        assert review_id not in review_ids

    @pytest.mark.asyncio
    async def test_cannot_claim_fully_claimed_review(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict,
        db_session: AsyncSession
    ):
        """
        Test that users cannot claim a review when all slots are filled.

        Expected: 409 Conflict with appropriate error message
        """
        # Create review with reviews_requested=1
        review_data = {
            "title": "Single Slot Review",
            "description": "Testing slot claiming with only one slot available.",
            "content_type": "design",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "pending"
        }

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # User B claims the only slot
        claim_response = await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=second_auth_headers
        )
        assert claim_response.status_code == 200

        # Create third user
        from app.core.security import get_password_hash, create_access_token

        third_user = User(
            email="fourth@example.com",
            hashed_password=get_password_hash("ValidPassword123!"),
            full_name="Fourth User",
            is_active=True,
            is_verified=True
        )
        db_session.add(third_user)
        await db_session.commit()
        await db_session.refresh(third_user)

        third_auth_token = create_access_token(
            data={"user_id": third_user.id, "email": third_user.email}
        )
        third_auth_headers = {"Authorization": f"Bearer {third_auth_token}"}

        # Third user tries to claim (should fail)
        failed_claim_response = await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=third_auth_headers
        )

        assert failed_claim_response.status_code == 409
        assert "already claimed" in failed_claim_response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_unclaim_review_slot(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict
    ):
        """
        Test unclaiming a previously claimed review slot.

        Expected:
        - reviews_claimed decrements
        - Status changes back to PENDING if all slots unclaimed
        - available_slots increments
        """
        # Create and publish review
        review_data = {
            "title": "Unclaim Test Review",
            "description": "Testing unclaim functionality for review slots.",
            "content_type": "code",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "pending"
        }

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Claim the review
        claim_response = await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=second_auth_headers
        )
        assert claim_response.status_code == 200

        # Unclaim the review
        unclaim_response = await client.post(
            f"/api/v1/reviews/{review_id}/unclaim",
            headers=second_auth_headers
        )

        assert unclaim_response.status_code == 200
        unclaim_data = unclaim_response.json()

        assert unclaim_data["success"] is True
        assert unclaim_data["reviews_claimed"] == 0
        assert unclaim_data["available_slots"] == 1
        assert unclaim_data["is_fully_claimed"] is False

        # Verify status changed back to PENDING
        get_response = await client.get(
            f"/api/v1/reviews/{review_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        review = get_response.json()

        assert review["status"] == "pending"
        assert review["reviews_claimed"] == 0


# ============================================================================
# Test 4: Data Validation Tests
# ============================================================================

class TestDataValidation:
    """Test input validation and error handling"""

    @pytest.mark.asyncio
    async def test_invalid_content_type_rejected(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that invalid content_type is rejected.

        Expected: 422 Unprocessable Entity
        """
        invalid_data = {
            "title": "Invalid Review",
            "description": "This should fail due to invalid content type.",
            "content_type": "invalid_type",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_negative_budget_rejected(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that negative budget is rejected.

        Expected: 422 Unprocessable Entity
        """
        invalid_data = {
            "title": "Negative Budget Review",
            "description": "This should fail due to negative budget value.",
            "content_type": "design",
            "review_type": "expert",
            "budget": -10.00,
            "reviews_requested": 1,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_reviews_requested_out_of_range(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that reviews_requested must be between 1-10.

        Expected: 422 Unprocessable Entity for values outside range
        """
        # Test 0 reviews
        zero_data = {
            "title": "Zero Reviews",
            "description": "This should fail due to zero reviews requested.",
            "content_type": "code",
            "review_type": "free",
            "reviews_requested": 0,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=zero_data,
            headers=auth_headers
        )
        assert response.status_code == 422

        # Test 11 reviews (exceeds max)
        too_many_data = {
            "title": "Too Many Reviews",
            "description": "This should fail due to too many reviews requested.",
            "content_type": "code",
            "review_type": "expert",
            "budget": 500.00,
            "reviews_requested": 11,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=too_many_data,
            headers=auth_headers
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_free_review_with_budget_rejected(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that free reviews cannot have a budget.

        Expected: 400 Bad Request
        """
        invalid_data = {
            "title": "Free Review with Budget",
            "description": "This should fail because free reviews shouldn't have budgets.",
            "content_type": "design",
            "review_type": "free",
            "budget": 25.00,
            "reviews_requested": 1,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "budget" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_expert_review_requires_budget(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that expert reviews require a budget.

        Expected: 400 Bad Request
        """
        invalid_data = {
            "title": "Expert Review Without Budget",
            "description": "This should fail because expert reviews require a budget.",
            "content_type": "design",
            "review_type": "expert",
            "reviews_requested": 1,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "budget" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_title_too_short_rejected(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that titles must be at least 3 characters.

        Expected: 400 Bad Request
        """
        invalid_data = {
            "title": "AB",
            "description": "This should fail due to title being too short (less than 3 characters).",
            "content_type": "design",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_description_too_short_rejected(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that descriptions must be at least 10 characters.

        Expected: 400 Bad Request
        """
        invalid_data = {
            "title": "Valid Title",
            "description": "Short",
            "content_type": "design",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 400


# ============================================================================
# Test 5: Edge Cases and Status Transitions
# ============================================================================

class TestEdgeCases:
    """Test edge cases, race conditions, and state transitions"""

    @pytest.mark.asyncio
    async def test_cannot_reduce_reviews_requested_below_claimed(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict
    ):
        """
        Test that reviews_requested cannot be set below reviews_claimed.

        Expected: 400 Bad Request
        """
        # Create review with reviews_requested=3
        review_data = {
            "title": "Multi-Slot Review",
            "description": "Testing constraint that prevents reducing slots below claimed count.",
            "content_type": "design",
            "review_type": "expert",
            "budget": 90.00,
            "reviews_requested": 3,
            "status": "draft"
        }

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Update to pending (creates slots)
        await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"status": "pending"},
            headers=auth_headers
        )

        # Claim one slot
        await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=second_auth_headers
        )

        # Try to reduce reviews_requested to 0 (should fail)
        update_response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"reviews_requested": 0},
            headers=auth_headers
        )

        assert update_response.status_code == 400
        assert "reviews_claimed" in update_response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_cannot_edit_in_review_status(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict
    ):
        """
        Test that reviews in IN_REVIEW status cannot be edited.

        Expected: 400 Bad Request
        """
        # Create and publish review
        review_data = {
            "title": "Locked Review",
            "description": "This review will be locked after claiming.",
            "content_type": "code",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "pending"
        }

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Claim the review (changes status to IN_REVIEW)
        await client.post(
            f"/api/v1/reviews/{review_id}/claim",
            headers=second_auth_headers
        )

        # Try to edit (should fail)
        edit_response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"title": "New Title"},
            headers=auth_headers
        )

        assert edit_response.status_code == 400
        assert "cannot edit" in edit_response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_invalid_status_transitions_rejected(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that invalid status transitions are rejected.

        Expected: 400 Bad Request for invalid transitions
        """
        # Create draft review
        review_data = {
            "title": "Status Transition Test",
            "description": "Testing that only valid status transitions are allowed.",
            "content_type": "design",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "draft"
        }

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Try to jump directly to COMPLETED (should fail)
        invalid_response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"status": "completed"},
            headers=auth_headers
        )

        assert invalid_response.status_code == 400
        assert "invalid status transition" in invalid_response.json()["detail"].lower()

        # Valid transition: draft -> pending
        valid_response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"status": "pending"},
            headers=auth_headers
        )
        assert valid_response.status_code == 200

    @pytest.mark.asyncio
    async def test_cannot_edit_critical_fields_when_pending(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that critical fields cannot be edited after review is pending.

        Expected: 400 Bad Request when trying to change review_type, budget, etc.
        """
        # Create and publish review
        review_data = {
            "title": "Pending Review",
            "description": "Testing field locking for pending reviews.",
            "content_type": "design",
            "review_type": "free",
            "reviews_requested": 1,
            "status": "pending"
        }

        create_response = await client.post(
            "/api/v1/reviews",
            json=review_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        review_id = create_response.json()["id"]

        # Try to change review_type (should fail)
        response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"review_type": "expert", "budget": 50.00},
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "cannot modify" in response.json()["detail"].lower()

        # Changing title should work (non-critical field)
        response = await client.patch(
            f"/api/v1/reviews/{review_id}",
            json={"title": "Updated Title"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"

    @pytest.mark.asyncio
    async def test_free_review_max_3_reviewers(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that free reviews are limited to 3 reviewers maximum.

        Expected: 400 Bad Request for reviews_requested > 3
        """
        invalid_data = {
            "title": "Too Many Free Reviews",
            "description": "Testing the 3 reviewer limit for free reviews.",
            "content_type": "code",
            "review_type": "free",
            "reviews_requested": 4,
            "status": "draft"
        }

        response = await client.post(
            "/api/v1/reviews",
            json=invalid_data,
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "limited to 3" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_pagination_works_in_browse(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        Test that pagination works correctly in browse marketplace.

        Expected: Limit and offset parameters control result set
        """
        # Create multiple reviews
        for i in range(5):
            review_data = {
                "title": f"Review {i}",
                "description": f"Description for review number {i} in pagination test.",
                "content_type": "design",
                "review_type": "free",
                "reviews_requested": 1,
                "status": "pending"
            }
            await client.post(
                "/api/v1/reviews",
                json=review_data,
                headers=auth_headers
            )

        # Test limit
        response1 = await client.get("/api/v1/reviews/browse?limit=2")
        assert response1.status_code == 200
        data1 = response1.json()
        assert len(data1["reviews"]) <= 2
        assert data1["total"] >= 5

        # Test offset
        response2 = await client.get("/api/v1/reviews/browse?limit=2&offset=2")
        assert response2.status_code == 200
        data2 = response2.json()

        # Reviews should be different due to offset
        ids1 = [r["id"] for r in data1["reviews"]]
        ids2 = [r["id"] for r in data2["reviews"]]
        assert ids1 != ids2
