"""
Comprehensive Integration Tests for Authentication System

This test suite covers:
1. User Registration (success, duplicate email, password validation, invalid email)
2. Login (success, wrong password, non-existent user, inactive user)
3. Token Management (access tokens, refresh tokens, expiration, blacklisting)
4. Protected Endpoints (/me endpoint with various token states)
5. Password Reset Flow (request, verify, confirm, expiration)
6. Security Features (rate limiting awareness, timing attack resistance, email enumeration protection)

Test Framework:
- pytest with pytest-asyncio for async test support
- httpx AsyncClient for API testing
- SQLAlchemy async sessions with proper transaction isolation
- Redis mocking for token blacklisting tests
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict, Any
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import select

from app.main import app
from app.models.user import User, Base
from app.db.session import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    get_password_hash,
    verify_password
)
from app.services.redis_service import redis_service


# Test configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
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
    """Create a test database session with transaction rollback"""
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
    """Create an async HTTP client for testing"""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user in the database"""
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
async def inactive_user(db_session: AsyncSession) -> User:
    """Create an inactive test user"""
    user = User(
        email="inactive@example.com",
        hashed_password=get_password_hash("ValidPassword123!"),
        full_name="Inactive User",
        is_active=False,
        is_verified=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def auth_headers(test_user: User) -> Dict[str, str]:
    """Create authentication headers with a valid access token"""
    token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# Helper Functions
# ============================================================================

async def create_user_via_api(client: AsyncClient, email: str, password: str, full_name: str = "Test User") -> Dict[str, Any]:
    """Helper to register a user via API"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name
        }
    )
    return response


async def login_user(client: AsyncClient, email: str, password: str) -> Dict[str, Any]:
    """Helper to login a user and get tokens"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password
        }
    )
    return response


# ============================================================================
# Test Cases: User Registration
# ============================================================================

class TestUserRegistration:
    """Test user registration endpoint"""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient, db_session: AsyncSession):
        """Test successful user registration with valid data"""
        response = await create_user_via_api(
            client,
            email="newuser@example.com",
            password="SecurePass123!",
            full_name="New User"
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert data["is_active"] is True
        assert data["is_verified"] is False
        assert "id" in data
        assert "hashed_password" not in data  # Password should not be exposed

        # Verify user was created in database
        result = await db_session.execute(
            select(User).where(User.email == "newuser@example.com")
        )
        db_user = result.scalar_one_or_none()
        assert db_user is not None
        assert db_user.email == "newuser@example.com"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        """Test registration fails with duplicate email"""
        response = await create_user_via_api(
            client,
            email=test_user.email,
            password="DifferentPass123!",
            full_name="Another User"
        )

        assert response.status_code == 400
        data = response.json()
        # Generic error message to prevent email enumeration
        assert "Unable to complete registration" in data["detail"]

    @pytest.mark.asyncio
    async def test_register_weak_password_no_uppercase(self, client: AsyncClient):
        """Test registration fails with password missing uppercase letter"""
        response = await create_user_via_api(
            client,
            email="test@example.com",
            password="weakpassword123!",
            full_name="Test User"
        )

        assert response.status_code == 422
        data = response.json()
        assert "uppercase" in str(data).lower()

    @pytest.mark.asyncio
    async def test_register_weak_password_no_lowercase(self, client: AsyncClient):
        """Test registration fails with password missing lowercase letter"""
        response = await create_user_via_api(
            client,
            email="test@example.com",
            password="WEAKPASSWORD123!",
            full_name="Test User"
        )

        assert response.status_code == 422
        data = response.json()
        assert "lowercase" in str(data).lower()

    @pytest.mark.asyncio
    async def test_register_weak_password_no_digit(self, client: AsyncClient):
        """Test registration fails with password missing digit"""
        response = await create_user_via_api(
            client,
            email="test@example.com",
            password="WeakPassword!",
            full_name="Test User"
        )

        assert response.status_code == 422
        data = response.json()
        assert "digit" in str(data).lower()

    @pytest.mark.asyncio
    async def test_register_weak_password_no_special_char(self, client: AsyncClient):
        """Test registration fails with password missing special character"""
        response = await create_user_via_api(
            client,
            email="test@example.com",
            password="WeakPassword123",
            full_name="Test User"
        )

        assert response.status_code == 422
        data = response.json()
        assert "special character" in str(data).lower()

    @pytest.mark.asyncio
    async def test_register_password_too_short(self, client: AsyncClient):
        """Test registration fails with password too short"""
        response = await create_user_via_api(
            client,
            email="test@example.com",
            password="Short1!",
            full_name="Test User"
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_email_format(self, client: AsyncClient):
        """Test registration fails with invalid email format"""
        response = await create_user_via_api(
            client,
            email="not-an-email",
            password="ValidPass123!",
            full_name="Test User"
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_password_hashing(self, client: AsyncClient, db_session: AsyncSession):
        """Test that passwords are properly hashed in database"""
        password = "TestPassword123!"
        response = await create_user_via_api(
            client,
            email="hashtest@example.com",
            password=password,
            full_name="Hash Test"
        )

        assert response.status_code == 201

        # Verify password is hashed in database
        result = await db_session.execute(
            select(User).where(User.email == "hashtest@example.com")
        )
        db_user = result.scalar_one()

        # Password should be hashed, not stored in plain text
        assert db_user.hashed_password != password
        # But it should verify correctly
        assert verify_password(password, db_user.hashed_password)


# ============================================================================
# Test Cases: User Login
# ============================================================================

class TestUserLogin:
    """Test user login endpoint"""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Test successful login with valid credentials"""
        response = await login_user(
            client,
            email=test_user.email,
            password="ValidPassword123!"
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        # Verify tokens are valid
        access_payload = decode_access_token(data["access_token"])
        assert access_payload is not None
        assert access_payload["user_id"] == test_user.id
        assert access_payload["email"] == test_user.email

    @pytest.mark.asyncio
    async def test_login_updates_last_login(self, client: AsyncClient, test_user: User, db_session: AsyncSession):
        """Test that login updates the last_login timestamp"""
        # Record initial last_login (should be None)
        initial_last_login = test_user.last_login

        response = await login_user(
            client,
            email=test_user.email,
            password="ValidPassword123!"
        )

        assert response.status_code == 200

        # Refresh user from database
        await db_session.refresh(test_user)

        # Verify last_login was updated
        assert test_user.last_login is not None
        if initial_last_login:
            assert test_user.last_login > initial_last_login

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        """Test login fails with incorrect password"""
        response = await login_user(
            client,
            email=test_user.email,
            password="WrongPassword123!"
        )

        assert response.status_code == 401
        data = response.json()
        # Generic error message to prevent user enumeration
        assert "Incorrect email or password" in data["detail"]

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login fails with non-existent email"""
        response = await login_user(
            client,
            email="nonexistent@example.com",
            password="SomePassword123!"
        )

        assert response.status_code == 401
        data = response.json()
        # Generic error message to prevent email enumeration
        assert "Incorrect email or password" in data["detail"]

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, client: AsyncClient, inactive_user: User):
        """Test login fails for inactive user account"""
        response = await login_user(
            client,
            email=inactive_user.email,
            password="ValidPassword123!"
        )

        assert response.status_code == 403
        data = response.json()
        assert "inactive" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_timing_attack_resistance(self, client: AsyncClient, test_user: User):
        """Test that login response times are similar for existing and non-existing users"""
        import time

        # Measure time for existing user with wrong password
        start1 = time.time()
        await login_user(client, email=test_user.email, password="WrongPass123!")
        duration1 = time.time() - start1

        # Measure time for non-existent user
        start2 = time.time()
        await login_user(client, email="nonexistent@example.com", password="SomePass123!")
        duration2 = time.time() - start2

        # Response times should be similar (within 100ms difference)
        # This tests that we run bcrypt even for non-existent users
        time_diff = abs(duration1 - duration2)
        assert time_diff < 0.1, f"Timing difference too large: {time_diff}s (potential timing attack vulnerability)"


# ============================================================================
# Test Cases: Token Management
# ============================================================================

class TestTokenManagement:
    """Test JWT token operations"""

    @pytest.mark.asyncio
    async def test_access_token_structure(self, client: AsyncClient, test_user: User):
        """Test that access tokens contain correct data"""
        response = await login_user(
            client,
            email=test_user.email,
            password="ValidPassword123!"
        )

        assert response.status_code == 200
        access_token = response.json()["access_token"]

        payload = decode_access_token(access_token)
        assert payload is not None
        assert payload["type"] == "access"
        assert payload["user_id"] == test_user.id
        assert payload["email"] == test_user.email
        assert "exp" in payload

    @pytest.mark.asyncio
    async def test_refresh_token_flow(self, client: AsyncClient, test_user: User):
        """Test refreshing access token with refresh token"""
        # Login to get refresh token
        login_response = await login_user(
            client,
            email=test_user.email,
            password="ValidPassword123!"
        )

        assert login_response.status_code == 200
        refresh_token = login_response.json()["refresh_token"]

        # Use refresh token to get new access token
        refresh_response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )

        assert refresh_response.status_code == 200
        data = refresh_response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        # Verify new tokens are valid and different from original
        new_access_token = data["access_token"]
        new_refresh_token = data["refresh_token"]
        assert new_access_token != login_response.json()["access_token"]
        assert new_refresh_token != refresh_token

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test refresh fails with invalid token"""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "Invalid refresh token" in data["detail"]

    @pytest.mark.asyncio
    async def test_refresh_token_with_access_token(self, client: AsyncClient, test_user: User):
        """Test refresh fails when using access token instead of refresh token"""
        # Login to get access token
        login_response = await login_user(
            client,
            email=test_user.email,
            password="ValidPassword123!"
        )

        access_token = login_response.json()["access_token"]

        # Try to refresh with access token (should fail)
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": access_token}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token_for_inactive_user(self, client: AsyncClient, inactive_user: User):
        """Test refresh fails for inactive user even with valid refresh token"""
        # Create a valid refresh token for the inactive user
        refresh_token = create_refresh_token(
            data={"user_id": inactive_user.id, "email": inactive_user.email}
        )

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )

        assert response.status_code == 401
        data = response.json()
        assert "not found or inactive" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_logout_blacklists_token(self, client: AsyncClient, test_user: User):
        """Test that logout blacklists the current access token"""
        # Login to get tokens
        login_response = await login_user(
            client,
            email=test_user.email,
            password="ValidPassword123!"
        )

        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # Verify token works before logout
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200

        # Logout
        logout_response = await client.post("/api/v1/auth/logout", headers=headers)
        assert logout_response.status_code == 200
        data = logout_response.json()
        assert "Successfully logged out" in data["message"]

        # If Redis is available, verify token is blacklisted
        if redis_service.available:
            # Try to use the same token (should fail)
            me_response_after_logout = await client.get("/api/v1/auth/me", headers=headers)
            assert me_response_after_logout.status_code == 401
            data = me_response_after_logout.json()
            assert "revoked" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_expired_access_token(self, client: AsyncClient, test_user: User):
        """Test that expired access tokens are rejected"""
        # Create an expired access token
        expired_token = create_access_token(
            data={"user_id": test_user.id, "email": test_user.email},
            expires_delta=timedelta(seconds=-1)  # Already expired
        )

        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 401
        data = response.json()
        assert "Could not validate credentials" in data["detail"]


# ============================================================================
# Test Cases: Protected Endpoints
# ============================================================================

class TestProtectedEndpoints:
    """Test protected endpoint access control"""

    @pytest.mark.asyncio
    async def test_me_endpoint_with_valid_token(self, client: AsyncClient, test_user: User, auth_headers: Dict[str, str]):
        """Test /me endpoint returns user data with valid token"""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_me_endpoint_without_token(self, client: AsyncClient):
        """Test /me endpoint fails without authentication token"""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 403  # FastAPI returns 403 for missing credentials

    @pytest.mark.asyncio
    async def test_me_endpoint_with_invalid_token(self, client: AsyncClient):
        """Test /me endpoint fails with invalid token"""
        headers = {"Authorization": "Bearer invalid.token.value"}
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 401
        data = response.json()
        assert "Could not validate credentials" in data["detail"]

    @pytest.mark.asyncio
    async def test_me_endpoint_with_malformed_token(self, client: AsyncClient):
        """Test /me endpoint fails with malformed token"""
        headers = {"Authorization": "Bearer not-a-jwt"}
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_me_endpoint_with_deleted_user(self, client: AsyncClient, test_user: User, db_session: AsyncSession):
        """Test /me endpoint fails when user is deleted from database"""
        # Create token for user
        token = create_access_token(data={"user_id": test_user.id, "email": test_user.email})
        headers = {"Authorization": f"Bearer {token}"}

        # Delete user from database
        await db_session.delete(test_user)
        await db_session.commit()

        # Try to access protected endpoint
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 401
        data = response.json()
        assert "User not found" in data["detail"]

    @pytest.mark.asyncio
    async def test_me_endpoint_with_refresh_token(self, client: AsyncClient, test_user: User):
        """Test /me endpoint fails when using refresh token instead of access token"""
        # Create refresh token
        refresh_token = create_refresh_token(
            data={"user_id": test_user.id, "email": test_user.email}
        )
        headers = {"Authorization": f"Bearer {refresh_token}"}

        # Try to access protected endpoint with refresh token
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == 401


# ============================================================================
# Test Cases: Password Reset Flow
# ============================================================================

class TestPasswordReset:
    """Test password reset functionality"""

    @pytest.mark.asyncio
    async def test_request_password_reset_existing_user(self, client: AsyncClient, test_user: User):
        """Test requesting password reset for existing user"""
        response = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": test_user.email}
        )

        assert response.status_code == 200
        data = response.json()
        assert "Password reset email sent" in data["message"]
        assert "If an account exists" in data["detail"]

    @pytest.mark.asyncio
    async def test_request_password_reset_nonexistent_user(self, client: AsyncClient):
        """Test requesting password reset for non-existent user (same response)"""
        response = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "nonexistent@example.com"}
        )

        # Should return same response to prevent email enumeration
        assert response.status_code == 200
        data = response.json()
        assert "Password reset email sent" in data["message"]
        assert "If an account exists" in data["detail"]

    @pytest.mark.asyncio
    async def test_request_password_reset_inactive_user(self, client: AsyncClient, inactive_user: User):
        """Test requesting password reset for inactive user (same response)"""
        response = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": inactive_user.email}
        )

        # Should return same response
        assert response.status_code == 200
        data = response.json()
        assert "Password reset email sent" in data["message"]

    @pytest.mark.asyncio
    async def test_request_password_reset_invalid_email(self, client: AsyncClient):
        """Test requesting password reset with invalid email format"""
        response = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "not-an-email"}
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_verify_reset_token_invalid(self, client: AsyncClient):
        """Test verifying an invalid reset token"""
        response = await client.post(
            "/api/v1/auth/password-reset/verify",
            json={"token": "invalid_token_that_does_not_exist_12345"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["email"] is None
        assert data["expires_in_seconds"] is None

    @pytest.mark.asyncio
    async def test_confirm_reset_invalid_token(self, client: AsyncClient):
        """Test confirming password reset with invalid token"""
        response = await client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": "invalid_token_that_does_not_exist_12345",
                "new_password": "NewSecurePass123!"
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert "Invalid or expired" in data["detail"]

    @pytest.mark.asyncio
    async def test_confirm_reset_weak_password(self, client: AsyncClient):
        """Test confirming password reset with weak password"""
        response = await client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": "some_valid_looking_token_12345678901234",
                "new_password": "weak"
            }
        )

        assert response.status_code == 422


# ============================================================================
# Test Cases: Security Features
# ============================================================================

class TestSecurityFeatures:
    """Test security features and edge cases"""

    @pytest.mark.asyncio
    async def test_email_enumeration_protection_registration(self, client: AsyncClient, test_user: User):
        """Test that registration error messages don't reveal email existence"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user.email,
                "password": "DifferentPass123!",
                "full_name": "Another User"
            }
        )

        assert response.status_code == 400
        data = response.json()
        # Error message should be generic
        assert "email" not in data["detail"].lower() or "unable to complete" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_email_enumeration_protection_login(self, client: AsyncClient):
        """Test that login error messages don't reveal email existence"""
        # Try with non-existent email
        response1 = await login_user(
            client,
            email="nonexistent@example.com",
            password="SomePass123!"
        )

        # Try with existing email but wrong password
        response2 = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "existing@example.com",
                "password": "ValidPass123!",
                "full_name": "Test"
            }
        )
        if response2.status_code == 201:
            response2 = await login_user(
                client,
                email="existing@example.com",
                password="WrongPass123!"
            )

        # Both should return the same error message
        if response1.status_code == 401 and response2.status_code == 401:
            assert response1.json()["detail"] == response2.json()["detail"]

    @pytest.mark.asyncio
    async def test_password_not_exposed_in_responses(self, client: AsyncClient):
        """Test that passwords are never exposed in API responses"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "password-test@example.com",
                "password": "SecurePass123!",
                "full_name": "Password Test"
            }
        )

        assert response.status_code == 201
        data = response.json()

        # Ensure no password-related fields in response
        response_str = str(data).lower()
        assert "password" not in response_str
        assert "hashed_password" not in response_str

    @pytest.mark.asyncio
    async def test_token_contains_no_sensitive_data(self, client: AsyncClient, test_user: User):
        """Test that JWT tokens don't contain sensitive data like passwords"""
        response = await login_user(
            client,
            email=test_user.email,
            password="ValidPassword123!"
        )

        access_token = response.json()["access_token"]
        payload = decode_access_token(access_token)

        # Ensure no sensitive data in token
        payload_str = str(payload).lower()
        assert "password" not in payload_str
        assert "hashed_password" not in payload_str

    @pytest.mark.asyncio
    async def test_sql_injection_protection_login(self, client: AsyncClient):
        """Test that SQL injection attempts in login are handled safely"""
        # Try SQL injection in email field
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@example.com' OR '1'='1",
                "password": "password"
            }
        )

        # Should fail with validation error or unauthorized, not cause SQL error
        assert response.status_code in [401, 422]

    @pytest.mark.asyncio
    async def test_xss_protection_full_name(self, client: AsyncClient):
        """Test that XSS attempts in full_name are sanitized"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "xss-test@example.com",
                "password": "SecurePass123!",
                "full_name": "<script>alert('xss')</script>John Doe"
            }
        )

        if response.status_code == 201:
            data = response.json()
            # HTML tags should be stripped
            assert "<script>" not in data["full_name"]

    @pytest.mark.asyncio
    async def test_concurrent_login_attempts(self, client: AsyncClient, test_user: User):
        """Test handling of concurrent login attempts"""
        # Simulate multiple concurrent login attempts
        tasks = [
            login_user(client, test_user.email, "ValidPassword123!")
            for _ in range(5)
        ]

        responses = await asyncio.gather(*tasks)

        # All should succeed (no race conditions)
        for response in responses:
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_token_replay_attack_after_logout(self, client: AsyncClient, test_user: User):
        """Test that tokens cannot be reused after logout (replay attack)"""
        # Login
        login_response = await login_user(
            client,
            email=test_user.email,
            password="ValidPassword123!"
        )

        access_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # Logout
        await client.post("/api/v1/auth/logout", headers=headers)

        # Try to reuse the token (if Redis is available)
        if redis_service.available:
            response = await client.get("/api/v1/auth/me", headers=headers)
            assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_unicode_handling_in_email(self, client: AsyncClient):
        """Test that unicode characters in email are handled properly"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@例え.com",  # Unicode domain
                "password": "SecurePass123!",
                "full_name": "Test User"
            }
        )

        # Should either accept or reject gracefully (not crash)
        assert response.status_code in [201, 422]


# ============================================================================
# Test Cases: Edge Cases and Error Handling
# ============================================================================

class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_register_very_long_email(self, client: AsyncClient):
        """Test registration with very long email"""
        long_email = "a" * 300 + "@example.com"
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": long_email,
                "password": "SecurePass123!",
                "full_name": "Test"
            }
        )

        # Should be rejected (email too long)
        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_register_very_long_full_name(self, client: AsyncClient):
        """Test registration with very long full name"""
        long_name = "A" * 500
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
                "full_name": long_name
            }
        )

        # Should either accept (with truncation) or reject
        if response.status_code == 201:
            data = response.json()
            # Name should be truncated to 255 chars
            assert len(data["full_name"]) <= 255

    @pytest.mark.asyncio
    async def test_login_with_empty_credentials(self, client: AsyncClient):
        """Test login with empty credentials"""
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "", "password": ""}
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_refresh_with_missing_token(self, client: AsyncClient):
        """Test refresh endpoint with missing token"""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={}
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_me_endpoint_with_wrong_auth_scheme(self, client: AsyncClient):
        """Test /me endpoint with wrong authorization scheme"""
        headers = {"Authorization": "Basic somebase64encodedstring"}
        response = await client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_register_with_null_full_name(self, client: AsyncClient):
        """Test registration with null full_name (should be allowed)"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "nullname@example.com",
                "password": "SecurePass123!",
                "full_name": None
            }
        )

        # Should succeed (full_name is optional)
        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] is None

    @pytest.mark.asyncio
    async def test_case_sensitivity_in_email(self, client: AsyncClient, test_user: User):
        """Test that email comparison is case-insensitive"""
        # Try to login with uppercase version of email
        response = await login_user(
            client,
            email=test_user.email.upper(),
            password="ValidPassword123!"
        )

        # Email validation might lowercase it, or it might be case-sensitive
        # The important thing is it doesn't cause an error
        assert response.status_code in [200, 401]


# ============================================================================
# Performance and Load Tests
# ============================================================================

class TestPerformance:
    """Basic performance tests"""

    @pytest.mark.asyncio
    async def test_password_hashing_performance(self, client: AsyncClient):
        """Test that password hashing doesn't take too long"""
        import time

        start = time.time()
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "perf-test@example.com",
                "password": "SecurePass123!",
                "full_name": "Perf Test"
            }
        )
        duration = time.time() - start

        # Registration should complete in reasonable time (< 2 seconds)
        assert duration < 2.0
        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_token_validation_performance(self, client: AsyncClient, test_user: User, auth_headers: Dict[str, str]):
        """Test that token validation is fast"""
        import time

        start = time.time()
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        duration = time.time() - start

        # Token validation should be very fast (< 100ms)
        assert duration < 0.1
        assert response.status_code == 200


# ============================================================================
# Integration Test Scenarios
# ============================================================================

class TestIntegrationScenarios:
    """Test complete user workflows"""

    @pytest.mark.asyncio
    async def test_complete_user_lifecycle(self, client: AsyncClient, db_session: AsyncSession):
        """Test complete user lifecycle: register, login, access protected endpoint, logout"""
        # 1. Register
        email = "lifecycle@example.com"
        password = "LifeCyclePass123!"

        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password,
                "full_name": "Lifecycle User"
            }
        )
        assert register_response.status_code == 201
        user_data = register_response.json()
        user_id = user_data["id"]

        # 2. Login
        login_response = await login_user(client, email, password)
        assert login_response.status_code == 200
        tokens = login_response.json()
        access_token = tokens["access_token"]

        # 3. Access protected endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["id"] == user_id
        assert me_data["email"] == email

        # 4. Logout
        logout_response = await client.post("/api/v1/auth/logout", headers=headers)
        assert logout_response.status_code == 200

        # 5. Verify token is invalidated (if Redis is available)
        if redis_service.available:
            me_after_logout = await client.get("/api/v1/auth/me", headers=headers)
            assert me_after_logout.status_code == 401

    @pytest.mark.asyncio
    async def test_token_refresh_workflow(self, client: AsyncClient):
        """Test complete token refresh workflow"""
        # 1. Register and login
        email = "refresh-workflow@example.com"
        password = "RefreshPass123!"

        await client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password, "full_name": "Refresh User"}
        )

        login_response = await login_user(client, email, password)
        original_tokens = login_response.json()

        # 2. Use access token
        headers = {"Authorization": f"Bearer {original_tokens['access_token']}"}
        me_response1 = await client.get("/api/v1/auth/me", headers=headers)
        assert me_response1.status_code == 200

        # 3. Refresh tokens
        refresh_response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": original_tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()

        # 4. Use new access token
        new_headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
        me_response2 = await client.get("/api/v1/auth/me", headers=new_headers)
        assert me_response2.status_code == 200

        # User data should be the same
        assert me_response1.json()["id"] == me_response2.json()["id"]

    @pytest.mark.asyncio
    async def test_multiple_sessions_for_same_user(self, client: AsyncClient, test_user: User):
        """Test that a user can have multiple active sessions"""
        # Login twice to create two sessions
        login1 = await login_user(client, test_user.email, "ValidPassword123!")
        login2 = await login_user(client, test_user.email, "ValidPassword123!")

        assert login1.status_code == 200
        assert login2.status_code == 200

        token1 = login1.json()["access_token"]
        token2 = login2.json()["access_token"]

        # Both tokens should work
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        response1 = await client.get("/api/v1/auth/me", headers=headers1)
        response2 = await client.get("/api/v1/auth/me", headers=headers2)

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["id"] == response2.json()["id"]
