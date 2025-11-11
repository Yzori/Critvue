# Quick Start Guide - Authentication Integration Tests

## 🚀 Quick Commands

### Run All Authentication Tests
```bash
cd /home/user/Critvue/backend
source venv/bin/activate
pytest tests/test_auth_integration.py -v
```

### Run Tests with Coverage
```bash
pytest tests/test_auth_integration.py --cov=app/api/auth --cov=app/core/security --cov-report=html
```

### View Coverage Report
```bash
# After running tests with coverage
open htmlcov/index.html  # On macOS
xdg-open htmlcov/index.html  # On Linux
```

## 📋 Test Categories (56 Total Tests)

### 1. User Registration (9 tests)
```bash
pytest tests/test_auth_integration.py::TestUserRegistration -v
```

**What's tested:**
- ✅ Successful registration
- ✅ Duplicate email rejection
- ✅ Password strength validation (uppercase, lowercase, digit, special char)
- ✅ Invalid email format
- ✅ Password hashing verification

**Example test:**
```bash
pytest tests/test_auth_integration.py::TestUserRegistration::test_register_success -v
```

---

### 2. User Login (6 tests)
```bash
pytest tests/test_auth_integration.py::TestUserLogin -v
```

**What's tested:**
- ✅ Successful login
- ✅ Last login timestamp update
- ✅ Wrong password handling
- ✅ Non-existent user handling
- ✅ Inactive user rejection
- ✅ Timing attack resistance

**Example test:**
```bash
pytest tests/test_auth_integration.py::TestUserLogin::test_login_success -v
```

---

### 3. Token Management (7 tests)
```bash
pytest tests/test_auth_integration.py::TestTokenManagement -v
```

**What's tested:**
- ✅ Access token structure
- ✅ Refresh token flow
- ✅ Invalid token handling
- ✅ Token type validation
- ✅ Token blacklisting on logout
- ✅ Expired token rejection

**Example test:**
```bash
pytest tests/test_auth_integration.py::TestTokenManagement::test_refresh_token_flow -v
```

---

### 4. Protected Endpoints (6 tests)
```bash
pytest tests/test_auth_integration.py::TestProtectedEndpoints -v
```

**What's tested:**
- ✅ /me endpoint with valid token
- ✅ /me endpoint without token
- ✅ /me endpoint with invalid token
- ✅ /me endpoint with malformed token
- ✅ /me endpoint with deleted user
- ✅ /me endpoint with wrong token type

**Example test:**
```bash
pytest tests/test_auth_integration.py::TestProtectedEndpoints::test_me_endpoint_with_valid_token -v
```

---

### 5. Password Reset (7 tests)
```bash
pytest tests/test_auth_integration.py::TestPasswordReset -v
```

**What's tested:**
- ✅ Request reset for existing user
- ✅ Request reset for non-existent user (email enumeration protection)
- ✅ Request reset for inactive user
- ✅ Invalid email format
- ✅ Invalid token verification
- ✅ Invalid token confirmation
- ✅ Weak password rejection

**Example test:**
```bash
pytest tests/test_auth_integration.py::TestPasswordReset::test_request_password_reset_existing_user -v
```

---

### 6. Security Features (9 tests)
```bash
pytest tests/test_auth_integration.py::TestSecurityFeatures -v
```

**What's tested:**
- ✅ Email enumeration protection
- ✅ Password exposure prevention
- ✅ Token security (no sensitive data)
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Concurrent login handling
- ✅ Token replay attack prevention
- ✅ Unicode handling

**Example test:**
```bash
pytest tests/test_auth_integration.py::TestSecurityFeatures::test_email_enumeration_protection_registration -v
```

---

### 7. Edge Cases (7 tests)
```bash
pytest tests/test_auth_integration.py::TestEdgeCases -v
```

**What's tested:**
- ✅ Very long email/name handling
- ✅ Empty credentials
- ✅ Missing tokens
- ✅ Wrong auth scheme
- ✅ Null values
- ✅ Email case sensitivity

**Example test:**
```bash
pytest tests/test_auth_integration.py::TestEdgeCases::test_register_very_long_email -v
```

---

### 8. Performance Tests (2 tests)
```bash
pytest tests/test_auth_integration.py::TestPerformance -v
```

**What's tested:**
- ✅ Password hashing performance (< 2 seconds)
- ✅ Token validation performance (< 100ms)

---

### 9. Integration Scenarios (3 tests)
```bash
pytest tests/test_auth_integration.py::TestIntegrationScenarios -v
```

**What's tested:**
- ✅ Complete user lifecycle (register → login → access → logout)
- ✅ Token refresh workflow
- ✅ Multiple concurrent sessions

**Example test:**
```bash
pytest tests/test_auth_integration.py::TestIntegrationScenarios::test_complete_user_lifecycle -v
```

## 🐛 Debugging

### Run with detailed output
```bash
pytest tests/test_auth_integration.py -vv -s
```

### Stop on first failure
```bash
pytest tests/test_auth_integration.py -x
```

### Run specific test
```bash
pytest tests/test_auth_integration.py::TestUserLogin::test_login_success -v
```

### Show test duration
```bash
pytest tests/test_auth_integration.py --durations=10
```

## 📊 Test Summary

| Category | Tests | Purpose |
|----------|-------|---------|
| Registration | 9 | User account creation and validation |
| Login | 6 | Authentication and session creation |
| Token Management | 7 | JWT lifecycle management |
| Protected Endpoints | 6 | Authorization and access control |
| Password Reset | 7 | Password recovery flow |
| Security | 9 | Security features and attack prevention |
| Edge Cases | 7 | Error handling and boundary conditions |
| Performance | 2 | Response time benchmarks |
| Integration | 3 | End-to-end user workflows |
| **TOTAL** | **56** | **Complete authentication coverage** |

## 🔍 Test Status Indicators

When running tests, you'll see:
- `.` = Test passed
- `F` = Test failed
- `E` = Test error
- `s` = Test skipped
- `x` = Expected failure
- `X` = Unexpected pass

## 📝 Expected Output

```
tests/test_auth_integration.py::TestUserRegistration::test_register_success PASSED [1%]
tests/test_auth_integration.py::TestUserRegistration::test_register_duplicate_email PASSED [3%]
tests/test_auth_integration.py::TestUserLogin::test_login_success PASSED [5%]
...
================================ 56 passed in 15.42s ================================
```

## ⚡ Performance Tips

1. **Parallel execution** (faster):
   ```bash
   pip install pytest-xdist
   pytest tests/test_auth_integration.py -n 4
   ```

2. **Only failed tests**:
   ```bash
   pytest tests/test_auth_integration.py --lf
   ```

3. **Skip slow tests** (if marked):
   ```bash
   pytest tests/test_auth_integration.py -m "not slow"
   ```

## 🔒 Security Test Focus

For security-focused testing:
```bash
pytest tests/test_auth_integration.py::TestSecurityFeatures -v
pytest tests/test_auth_integration.py::TestUserLogin::test_login_timing_attack_resistance -v
```

## 📦 Requirements

All dependencies are in `/home/user/Critvue/backend/requirements.txt`:
- pytest
- pytest-asyncio
- pytest-cov
- httpx
- sqlalchemy[asyncio]
- aiosqlite

Install with:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## 🎯 Next Steps

1. **Run all tests** to verify everything works
2. **Check coverage report** to identify gaps
3. **Add new tests** for any new authentication features
4. **Keep tests updated** as authentication code evolves

## 💡 Tips

- Tests are **independent** - can run in any order
- Each test uses **in-memory SQLite** - no database setup needed
- Tests **clean up after themselves** - no manual cleanup required
- **Redis is optional** - tests work with or without Redis
- All tests are **async** - using pytest-asyncio

## 📚 Further Reading

See `/home/user/Critvue/backend/tests/README_AUTH_TESTS.md` for comprehensive documentation.
