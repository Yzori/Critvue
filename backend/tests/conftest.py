"""
Pytest configuration and shared fixtures for integration tests

This module provides shared test fixtures and configuration for all test files.
Fixtures include database setup, test clients, and common test data.
"""

import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

# IMPORTANT: Import models BEFORE importing app to ensure they're registered with Base.metadata
from app.models.user import Base, User, UserRole
from app.models.review_request import ReviewRequest, ReviewStatus, ContentType, ReviewType
from app.models.review_file import ReviewFile
from app.models.review_slot import ReviewSlot

# Now import app (which won't re-initialize Base since models are already loaded)
from app.main import app
from app.db.session import get_db
from app.core.security import get_password_hash, create_access_token


# Test database configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# Configure pytest-asyncio
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="function")
async def test_engine():
    """
    Create a test database engine with in-memory SQLite.

    This fixture creates a new database for each test function, ensuring
    complete isolation between tests.
    """
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
    """
    Create a test database session.

    This fixture provides a database session for each test, with automatic
    rollback to ensure test isolation.
    """
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


# ============================================================================
# HTTP Client Fixtures
# ============================================================================

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create an async HTTP client for testing API endpoints.

    This fixture overrides the database dependency to use the test database
    session, ensuring all API calls use the test database.
    """

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ============================================================================
# User Fixtures
# ============================================================================

@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """
    Create a standard test user.

    Email: testuser@example.com
    Password: ValidPassword123!
    Status: Active
    """
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
async def verified_user(db_session: AsyncSession) -> User:
    """
    Create a verified test user.

    Email: verified@example.com
    Password: ValidPassword123!
    Status: Active and Verified
    """
    user = User(
        email="verified@example.com",
        hashed_password=get_password_hash("ValidPassword123!"),
        full_name="Verified User",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def inactive_user(db_session: AsyncSession) -> User:
    """
    Create an inactive test user.

    Email: inactive@example.com
    Password: ValidPassword123!
    Status: Inactive
    """
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
async def admin_user(db_session: AsyncSession) -> User:
    """
    Create an admin test user.

    Email: admin@example.com
    Password: AdminPassword123!
    Status: Active, Verified, Admin Role
    """
    from app.models.user import UserRole

    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("AdminPassword123!"),
        full_name="Admin User",
        is_active=True,
        is_verified=True,
        role=UserRole.ADMIN
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# ============================================================================
# Authentication Fixtures
# ============================================================================

@pytest.fixture
async def auth_headers(test_user: User) -> dict[str, str]:
    """
    Create authentication headers with a valid access token for test_user.

    Returns:
        Dictionary with Authorization header containing Bearer token
    """
    token = create_access_token(
        data={"user_id": test_user.id, "email": test_user.email}
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def admin_auth_headers(admin_user: User) -> dict[str, str]:
    """
    Create authentication headers with a valid access token for admin_user.

    Returns:
        Dictionary with Authorization header containing Bearer token
    """
    token = create_access_token(
        data={"user_id": admin_user.id, "email": admin_user.email}
    )
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# Helper Fixtures
# ============================================================================

@pytest.fixture
def valid_user_data() -> dict:
    """
    Provide valid user registration data.

    This can be used as a template for creating new users in tests.
    """
    return {
        "email": "newuser@example.com",
        "password": "ValidPassword123!",
        "full_name": "New User"
    }


@pytest.fixture
def valid_login_credentials() -> dict:
    """
    Provide valid login credentials matching test_user.
    """
    return {
        "email": "testuser@example.com",
        "password": "ValidPassword123!"
    }


# ============================================================================
# Pytest Configuration
# ============================================================================

def pytest_configure(config):
    """
    Configure pytest with custom markers.
    """
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "security: mark test as security-focused"
    )


def pytest_collection_modifyitems(config, items):
    """
    Automatically mark asyncio tests.
    """
    for item in items:
        if asyncio.iscoroutinefunction(item.function):
            item.add_marker(pytest.mark.asyncio)
