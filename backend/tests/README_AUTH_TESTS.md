# Authentication Integration Tests

Comprehensive integration tests for the Critvue authentication system.

## Overview

This test suite provides complete coverage of the authentication system, including:

- **User Registration**: Email validation, password strength, duplicate detection
- **User Login**: Credential validation, inactive user handling, timing attack resistance
- **Token Management**: JWT creation, validation, refresh, expiration, blacklisting
- **Protected Endpoints**: Authorization, token validation, access control
- **Password Reset**: Request flow, token verification, password update
- **Security Features**: Email enumeration protection, XSS/SQL injection prevention

## Test Structure

```
tests/
├── conftest.py                    # Shared fixtures and configuration
├── test_auth_integration.py       # Main authentication integration tests
├── test_password_reset.py         # Password reset tests (existing)
└── README_AUTH_TESTS.md          # This file
```

## Test Coverage

### 1. User Registration Tests (8 tests)
- ✅ Successful registration with valid data
- ✅ Duplicate email rejection
- ✅ Password validation (uppercase, lowercase, digit, special char)
- ✅ Password length validation
- ✅ Invalid email format rejection
- ✅ Password hashing verification

### 2. Login Tests (5 tests)
- ✅ Successful login with valid credentials
- ✅ Last login timestamp update
- ✅ Failed login with wrong password
- ✅ Failed login with non-existent email
- ✅ Inactive user login rejection
- ✅ Timing attack resistance

### 3. Token Management Tests (8 tests)
- ✅ Access token structure and content
- ✅ Refresh token flow
- ✅ Invalid refresh token handling
- ✅ Wrong token type rejection
- ✅ Inactive user token refresh rejection
- ✅ Token blacklisting on logout
- ✅ Expired token rejection

### 4. Protected Endpoint Tests (6 tests)
- ✅ /me endpoint with valid token
- ✅ /me endpoint without token
- ✅ /me endpoint with invalid token
- ✅ /me endpoint with malformed token
- ✅ /me endpoint with deleted user
- ✅ /me endpoint with wrong token type

### 5. Password Reset Tests (6 tests)
- ✅ Request reset for existing user
- ✅ Request reset for non-existent user (same response)
- ✅ Request reset for inactive user
- ✅ Invalid email format rejection
- ✅ Invalid token verification
- ✅ Weak password rejection

### 6. Security Tests (10 tests)
- ✅ Email enumeration protection (registration)
- ✅ Email enumeration protection (login)
- ✅ Password not exposed in responses
- ✅ Token contains no sensitive data
- ✅ SQL injection protection
- ✅ XSS protection in user input
- ✅ Concurrent login handling
- ✅ Token replay attack prevention
- ✅ Unicode handling in email

### 7. Edge Cases Tests (8 tests)
- ✅ Very long email handling
- ✅ Very long full name handling
- ✅ Empty credentials rejection
- ✅ Missing token in refresh
- ✅ Wrong auth scheme rejection
- ✅ Null full_name acceptance
- ✅ Email case sensitivity

### 8. Performance Tests (2 tests)
- ✅ Password hashing performance
- ✅ Token validation performance

### 9. Integration Scenarios (3 tests)
- ✅ Complete user lifecycle (register → login → access → logout)
- ✅ Token refresh workflow
- ✅ Multiple sessions for same user

## Running the Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   cd /home/user/Critvue/backend
   pip install -r requirements.txt
   ```

2. **Ensure test dependencies are installed:**
   ```bash
   pip install pytest pytest-asyncio httpx
   ```

### Run All Authentication Tests

```bash
# Run all authentication integration tests
pytest tests/test_auth_integration.py -v

# Run with coverage report
pytest tests/test_auth_integration.py --cov=app/api/auth --cov=app/core/security --cov-report=html

# Run specific test class
pytest tests/test_auth_integration.py::TestUserRegistration -v

# Run specific test
pytest tests/test_auth_integration.py::TestUserLogin::test_login_success -v
```

### Run Tests by Category

```bash
# Run only registration tests
pytest tests/test_auth_integration.py::TestUserRegistration -v

# Run only login tests
pytest tests/test_auth_integration.py::TestUserLogin -v

# Run only token tests
pytest tests/test_auth_integration.py::TestTokenManagement -v

# Run only security tests
pytest tests/test_auth_integration.py::TestSecurityFeatures -v

# Run only integration scenarios
pytest tests/test_auth_integration.py::TestIntegrationScenarios -v
```

### Run with Markers

```bash
# Run security-focused tests (when markers are added)
pytest tests/test_auth_integration.py -m security -v

# Run slow tests
pytest tests/test_auth_integration.py -m slow -v

# Skip slow tests
pytest tests/test_auth_integration.py -m "not slow" -v
```

### Parallel Execution

For faster test execution:

```bash
# Install pytest-xdist
pip install pytest-xdist

# Run tests in parallel (4 workers)
pytest tests/test_auth_integration.py -n 4 -v
```

## Test Output Examples

### Successful Test Run
```
tests/test_auth_integration.py::TestUserRegistration::test_register_success PASSED [1%]
tests/test_auth_integration.py::TestUserRegistration::test_register_duplicate_email PASSED [2%]
tests/test_auth_integration.py::TestUserLogin::test_login_success PASSED [3%]
...
================================ 56 passed in 12.45s ================================
```

### With Coverage Report
```
---------- coverage: platform linux, python 3.11.0 ----------
Name                           Stmts   Miss  Cover
--------------------------------------------------
app/api/auth.py                  125      2    98%
app/core/security.py              45      0   100%
app/services/redis_service.py     55      8    85%
--------------------------------------------------
TOTAL                            225     10    96%
```

## Test Data

### Default Test Users

The `conftest.py` file provides several test user fixtures:

| Fixture | Email | Password | Active | Verified | Role |
|---------|-------|----------|--------|----------|------|
| `test_user` | testuser@example.com | ValidPassword123! | Yes | No | creator |
| `verified_user` | verified@example.com | ValidPassword123! | Yes | Yes | creator |
| `inactive_user` | inactive@example.com | ValidPassword123! | No | No | creator |
| `admin_user` | admin@example.com | AdminPassword123! | Yes | Yes | admin |

### Valid Password Format

All test passwords must meet these requirements:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

Example valid passwords:
- `ValidPassword123!`
- `SecurePass123!`
- `TestUser@2024`

## Debugging Failed Tests

### Enable Verbose Logging

```bash
# Run with detailed output
pytest tests/test_auth_integration.py -vv

# Show print statements
pytest tests/test_auth_integration.py -s

# Show locals in tracebacks
pytest tests/test_auth_integration.py -l

# Stop on first failure
pytest tests/test_auth_integration.py -x
```

### Common Issues

**Issue: Tests fail with database errors**
```
Solution: Ensure the test database is using SQLite in-memory mode.
The conftest.py should have: TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
```

**Issue: Redis connection errors**
```
Solution: Tests are designed to work without Redis (graceful degradation).
If Redis is not available, blacklisting tests will be skipped.
To verify: Check redis_service.available in your code.
```

**Issue: Rate limiting errors**
```
Solution: Rate limiting may interfere with tests. Consider disabling
rate limiting in test environment or using a separate rate limit key.
```

**Issue: Token expiration during tests**
```
Solution: Tests use short-lived tokens for expiration testing.
Ensure your system clock is accurate and timezone is set correctly.
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Authentication Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-asyncio pytest-cov

    - name: Run authentication tests
      run: |
        pytest tests/test_auth_integration.py -v --cov=app --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
```

## Test Maintenance

### Adding New Tests

1. **Follow the existing structure:**
   - Group related tests in test classes
   - Use descriptive test names starting with `test_`
   - Add docstrings explaining what each test verifies

2. **Use fixtures:**
   - Leverage existing fixtures from `conftest.py`
   - Create new fixtures for complex test data
   - Keep fixtures focused and reusable

3. **Follow naming conventions:**
   ```python
   async def test_<feature>_<scenario>_<expected_result>(self, fixtures):
       """Test that <feature> <scenario> results in <expected_result>"""
   ```

4. **Example new test:**
   ```python
   @pytest.mark.asyncio
   async def test_login_rate_limiting(self, client: AsyncClient, test_user: User):
       """Test that excessive login attempts trigger rate limiting"""
       # Make multiple rapid login attempts
       for _ in range(10):
           await client.post("/api/v1/auth/login", json={
               "email": test_user.email,
               "password": "WrongPassword123!"
           })

       # Next attempt should be rate limited
       response = await client.post("/api/v1/auth/login", json={
           "email": test_user.email,
           "password": "ValidPassword123!"
       })

       assert response.status_code == 429  # Too Many Requests
   ```

### Updating Tests

When authentication code changes:

1. **Update affected tests** to match new behavior
2. **Add tests** for new features or endpoints
3. **Update docstrings** to reflect changes
4. **Run full test suite** to ensure no regressions

### Code Coverage Goals

- **Overall coverage:** Aim for >90%
- **Critical paths:** 100% coverage for security functions
- **Edge cases:** Cover error handling and validation

## Security Testing Checklist

When adding or modifying authentication features, ensure tests cover:

- [ ] Input validation (email, password, tokens)
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection (if applicable)
- [ ] Rate limiting
- [ ] Email enumeration protection
- [ ] Timing attack resistance
- [ ] Token security (expiration, blacklisting)
- [ ] Password hashing (never store plain text)
- [ ] Sensitive data not exposed in responses
- [ ] Proper HTTP status codes
- [ ] Error message consistency

## Performance Benchmarks

Expected test execution times:

| Test Category | Tests | Approx. Time |
|--------------|-------|--------------|
| Registration | 8 | ~2s |
| Login | 5 | ~2s |
| Token Management | 8 | ~1s |
| Protected Endpoints | 6 | ~1s |
| Password Reset | 6 | ~2s |
| Security | 10 | ~3s |
| Edge Cases | 8 | ~2s |
| Performance | 2 | ~1s |
| Integration | 3 | ~2s |
| **Total** | **56** | **~16s** |

Note: Times may vary based on hardware and system load.

## Additional Resources

- **FastAPI Testing:** https://fastapi.tiangolo.com/tutorial/testing/
- **pytest-asyncio:** https://pytest-asyncio.readthedocs.io/
- **httpx AsyncClient:** https://www.python-httpx.org/async/
- **SQLAlchemy Async:** https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html

## Contributing

When contributing authentication tests:

1. Ensure all new tests pass locally
2. Follow existing code style and patterns
3. Add docstrings to all test functions
4. Update this README if adding new test categories
5. Verify test isolation (tests should not depend on each other)
6. Check for potential race conditions in async tests

## License

Same as the main Critvue project.
