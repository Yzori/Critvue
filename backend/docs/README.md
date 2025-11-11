# Critvue Backend Documentation

Comprehensive documentation for the Critvue FastAPI backend.

## Quick Links

### API Documentation
- **[API Reference](api/API_REFERENCE.md)** - Complete API endpoint reference with cURL and JavaScript examples

### Testing Documentation
- **[Testing Guide](testing/TESTING.md)** - Comprehensive authentication testing guide (56 tests)
- **[Integration Test Report](testing/INTEGRATION_TEST_REPORT.md)** - Latest integration test results and security assessment
- **[Integration Test Summary](testing/INTEGRATION_TEST_SUMMARY.md)** - Quick reference for test results

### Feature Documentation
- **[Password Reset](features/PASSWORD_RESET.md)** - Password reset system implementation guide

## Documentation Structure

```
docs/
├── README.md           # This file - documentation index
├── api/                # API documentation
│   └── API_REFERENCE.md
├── testing/            # Testing guides and reports
│   ├── TESTING.md
│   ├── INTEGRATION_TEST_REPORT.md
│   └── INTEGRATION_TEST_SUMMARY.md
└── features/           # Feature-specific guides
    └── PASSWORD_RESET.md
```

## Getting Started

### For New Developers
1. Read the [API Reference](api/API_REFERENCE.md) to understand available endpoints
2. Review the [Testing Guide](testing/TESTING.md) to learn how to run tests
3. Check feature-specific docs in `features/` for implementation details

### For Frontend Developers
1. See [API Reference](api/API_REFERENCE.md) for endpoint specifications
2. Review [Integration Test Report](testing/INTEGRATION_TEST_REPORT.md) for API behavior and examples
3. Use the JavaScript examples in API docs for quick integration

### For QA/Testing
1. Review [Testing Guide](testing/TESTING.md) for comprehensive test documentation
2. Check [Integration Test Summary](testing/INTEGRATION_TEST_SUMMARY.md) for latest test results
3. Run tests using instructions in the testing guide

## Backend Overview

### Tech Stack
- **Framework**: FastAPI (async Python web framework)
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT with refresh tokens
- **Password Hashing**: bcrypt
- **ORM**: SQLAlchemy (async)
- **Validation**: Pydantic
- **Testing**: pytest with pytest-asyncio

### Key Features
- **JWT Authentication**: Access and refresh token system
- **User Management**: Registration, login, profile management
- **Password Reset**: Secure token-based password reset flow
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Pydantic models with comprehensive validation
- **Security**: bcrypt hashing, CORS configuration, token expiration

### Project Structure
```
backend/
├── app/
│   ├── api/            # API endpoints
│   ├── core/           # Core utilities (security, config)
│   ├── db/             # Database configuration
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   └── main.py         # Application entry point
├── tests/              # Test suite
│   ├── integration/    # Integration tests
│   └── conftest.py     # Test fixtures
├── docs/               # Documentation (you are here)
└── alembic/            # Database migrations
```

## Running the Backend

### Development Server
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Access the API at: http://localhost:8000

### Interactive API Documentation
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Running Tests
```bash
# Run all tests
cd backend
source venv/bin/activate
python -m pytest

# Run specific test file
python -m pytest tests/integration/test_auth_integration.py

# Run with coverage
python -m pytest --cov=app

# Run using test script
bash run_auth_tests.sh all
```

## API Endpoints

See [API Reference](api/API_REFERENCE.md) for complete endpoint documentation.

**Quick Reference:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/password-reset/request` - Request password reset
- `POST /api/v1/password-reset/reset` - Reset password with token

## Environment Variables

Create `.env` file in backend directory:

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./critvue_dev.db

# Security
SECRET_KEY=your-secret-key-change-in-production
REFRESH_SECRET_KEY=your-refresh-secret-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Application
PROJECT_NAME=Critvue
VERSION=0.1.0
LOG_LEVEL=INFO
```

## Security Considerations

### Development
- Default secret keys are for development only
- SQLite database for local development
- CORS allows localhost origins

### Production Checklist
- [ ] Change `SECRET_KEY` to strong random value
- [ ] Change `REFRESH_SECRET_KEY` to strong random value
- [ ] Migrate to PostgreSQL database
- [ ] Update `ALLOWED_ORIGINS` to production domains
- [ ] Enable HTTPS/TLS for all traffic
- [ ] Set up Redis for token blacklisting
- [ ] Configure email service for password reset
- [ ] Set up logging and monitoring
- [ ] Configure database backups
- [ ] Review rate limiting settings

## Contributing

When adding new documentation:

1. **API Changes**: Update [API Reference](api/API_REFERENCE.md)
2. **New Features**: Create new file in `features/`
3. **Testing Changes**: Update [Testing Guide](testing/TESTING.md)
4. **Test Results**: Update integration test reports
5. **This Index**: Update this README with links

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [pytest Documentation](https://docs.pytest.org/)

---

**Project Documentation**: See main [Critvue Documentation](../../docs/README.md) for complete project documentation.
