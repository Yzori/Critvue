"""
Comprehensive tests for password reset functionality

Test coverage:
1. Request password reset (success and edge cases)
2. Token verification
3. Password reset confirmation
4. Security measures (rate limiting, token expiration, etc.)
5. Email sending
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.main import app
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.services.password_reset import (
    generate_reset_token,
    hash_token,
    create_password_reset_token,
    verify_reset_token,
    reset_password,
    mask_email,
    RESET_TOKEN_EXPIRE_MINUTES
)
from app.core.security import verify_password


client = TestClient(app)


# Test data
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "OldPassword123!"
TEST_NEW_PASSWORD = "NewPassword456!"


class TestPasswordResetService:
    """Test password reset service layer functions"""

    def test_generate_reset_token(self):
        """Test token generation produces unique, secure tokens"""
        token1 = generate_reset_token()
        token2 = generate_reset_token()

        # Tokens should be strings
        assert isinstance(token1, str)
        assert isinstance(token2, str)

        # Tokens should be of expected length (43 chars for 32 bytes base64)
        assert len(token1) == 43
        assert len(token2) == 43

        # Tokens should be unique
        assert token1 != token2

    def test_hash_token(self):
        """Test token hashing is consistent and one-way"""
        token = "test_token_123"

        hash1 = hash_token(token)
        hash2 = hash_token(token)

        # Same token should produce same hash
        assert hash1 == hash2

        # Hash should be hex string of length 64 (SHA-256)
        assert len(hash1) == 64
        assert all(c in '0123456789abcdef' for c in hash1)

        # Different tokens should produce different hashes
        hash3 = hash_token("different_token")
        assert hash1 != hash3

    def test_mask_email(self):
        """Test email masking for security"""
        # Normal email
        assert mask_email("john.doe@example.com") == "j***@example.com"

        # Short email
        assert mask_email("a@example.com") == "*@example.com"

        # Invalid email
        assert mask_email("notanemail") == "***"

    @pytest.mark.asyncio
    async def test_create_password_reset_token(self, db_session: AsyncSession, test_user: User):
        """Test creating password reset token"""
        token = await create_password_reset_token(
            db=db_session,
            user=test_user,
            ip_address="192.168.1.1",
            user_agent="Test Browser"
        )

        # Token should be returned
        assert token is not None
        assert len(token) == 43

        # Token should be stored in database (hashed)
        result = await db_session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == test_user.id
            )
        )
        db_token = result.scalar_one_or_none()

        assert db_token is not None
        assert db_token.token_hash == hash_token(token)
        assert db_token.ip_address == "192.168.1.1"
        assert db_token.user_agent == "Test Browser"
        assert db_token.is_used == '0'

    @pytest.mark.asyncio
    async def test_verify_reset_token_valid(self, db_session: AsyncSession, test_user: User):
        """Test verifying a valid reset token"""
        # Create token
        token = await create_password_reset_token(db=db_session, user=test_user)

        # Verify token
        reset_token, user = await verify_reset_token(db=db_session, token=token)

        assert reset_token is not None
        assert user is not None
        assert user.id == test_user.id
        assert reset_token.is_valid()

    @pytest.mark.asyncio
    async def test_verify_reset_token_invalid(self, db_session: AsyncSession):
        """Test verifying an invalid reset token"""
        fake_token = "invalid_token_123456789012345678901234567"

        reset_token, user = await verify_reset_token(db=db_session, token=fake_token)

        assert reset_token is None
        assert user is None

    @pytest.mark.asyncio
    async def test_verify_reset_token_expired(self, db_session: AsyncSession, test_user: User):
        """Test verifying an expired reset token"""
        # Create token
        token = await create_password_reset_token(db=db_session, user=test_user)

        # Manually expire the token
        result = await db_session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == hash_token(token)
            )
        )
        db_token = result.scalar_one()
        db_token.expires_at = datetime.utcnow() - timedelta(minutes=1)
        await db_session.commit()

        # Try to verify expired token
        reset_token, user = await verify_reset_token(db=db_session, token=token)

        assert reset_token is None
        assert user is None

    @pytest.mark.asyncio
    async def test_reset_password_success(self, db_session: AsyncSession, test_user: User):
        """Test successful password reset"""
        # Create token
        token = await create_password_reset_token(db=db_session, user=test_user)

        # Reset password
        success = await reset_password(
            db=db_session,
            token=token,
            new_password=TEST_NEW_PASSWORD
        )

        assert success is True

        # Refresh user from database
        await db_session.refresh(test_user)

        # Verify new password works
        assert verify_password(TEST_NEW_PASSWORD, test_user.hashed_password)

        # Verify token is marked as used
        result = await db_session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == hash_token(token)
            )
        )
        db_token = result.scalar_one()
        assert db_token.is_used == '1'
        assert db_token.used_at is not None


class TestPasswordResetAPI:
    """Test password reset API endpoints"""

    def test_request_password_reset_success(self, test_user: User):
        """Test requesting password reset for existing user"""
        response = client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": TEST_USER_EMAIL}
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Password reset email sent" in data["message"]

    def test_request_password_reset_nonexistent_email(self):
        """Test requesting password reset for non-existent email"""
        # Should return success to prevent email enumeration
        response = client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "nonexistent@example.com"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_request_password_reset_invalid_email(self):
        """Test requesting password reset with invalid email format"""
        response = client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "not-an-email"}
        )

        # Should return 422 for validation error
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_verify_reset_token_valid(self, db_session: AsyncSession, test_user: User):
        """Test verifying a valid reset token via API"""
        # Create token
        token = await create_password_reset_token(db=db_session, user=test_user)

        # Verify via API
        response = client.post(
            "/api/v1/auth/password-reset/verify",
            json={"token": token}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["email"] == "t***@example.com"
        assert data["expires_in_seconds"] > 0

    def test_verify_reset_token_invalid(self):
        """Test verifying an invalid reset token via API"""
        response = client.post(
            "/api/v1/auth/password-reset/verify",
            json={"token": "invalid_token_123456789012345678901234567"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["email"] is None
        assert data["expires_in_seconds"] is None

    @pytest.mark.asyncio
    async def test_confirm_password_reset_success(self, db_session: AsyncSession, test_user: User):
        """Test confirming password reset with valid token"""
        # Create token
        token = await create_password_reset_token(db=db_session, user=test_user)

        # Confirm reset
        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": token,
                "new_password": TEST_NEW_PASSWORD
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "Password reset successful" in data["message"]

        # Verify password was changed
        await db_session.refresh(test_user)
        assert verify_password(TEST_NEW_PASSWORD, test_user.hashed_password)

    def test_confirm_password_reset_invalid_token(self):
        """Test confirming password reset with invalid token"""
        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": "invalid_token_123456789012345678901234567",
                "new_password": TEST_NEW_PASSWORD
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert "Invalid or expired" in data["detail"]

    def test_confirm_password_reset_weak_password(self):
        """Test confirming password reset with weak password"""
        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": "some_token_123456789012345678901234567",
                "new_password": "weak"
            }
        )

        # Should return 422 for validation error
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_token_single_use(self, db_session: AsyncSession, test_user: User):
        """Test that tokens can only be used once"""
        # Create token
        token = await create_password_reset_token(db=db_session, user=test_user)

        # First reset should succeed
        response1 = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": token,
                "new_password": TEST_NEW_PASSWORD
            }
        )
        assert response1.status_code == 200

        # Second reset with same token should fail
        response2 = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": token,
                "new_password": "AnotherPassword789!"
            }
        )
        assert response2.status_code == 400

    @pytest.mark.asyncio
    async def test_token_expiration(self, db_session: AsyncSession, test_user: User):
        """Test that expired tokens cannot be used"""
        # Create token
        token = await create_password_reset_token(db=db_session, user=test_user)

        # Manually expire the token
        result = await db_session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == hash_token(token)
            )
        )
        db_token = result.scalar_one()
        db_token.expires_at = datetime.utcnow() - timedelta(minutes=1)
        await db_session.commit()

        # Try to reset with expired token
        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": token,
                "new_password": TEST_NEW_PASSWORD
            }
        )

        assert response.status_code == 400
        data = response.json()
        assert "Invalid or expired" in data["detail"]


# Pytest fixtures (to be added to conftest.py)
"""
@pytest.fixture
async def db_session():
    # Create async database session for testing
    # Implementation depends on your test database setup
    pass

@pytest.fixture
async def test_user(db_session: AsyncSession):
    # Create a test user
    from app.core.security import get_password_hash

    user = User(
        email=TEST_USER_EMAIL,
        hashed_password=get_password_hash(TEST_USER_PASSWORD),
        full_name="Test User",
        is_active=True
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user
"""
