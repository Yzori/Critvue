# Rate Limiting Configuration

## Overview

The Critvue backend uses `slowapi` for rate limiting to protect against abuse and ensure fair resource usage. Rate limiting can be configured via environment variables to support different behaviors in development, testing, and production environments.

## Configuration

Rate limiting is controlled through the following environment variables in your `.env` file:

### Main Control

- **`ENABLE_RATE_LIMITING`** (boolean, default: `true`)
  - Set to `false` to completely disable rate limiting
  - Set to `true` to enable rate limiting with configured limits
  - **Recommendation**: `false` for development/testing, `true` for production

### Rate Limits

All rate limits use the format: `<count>/<period>` (e.g., "5/minute", "100/hour")

- **`RATE_LIMIT_REGISTRATION`** (default: `3/hour`)
  - Controls registration endpoint rate limit
  - Production: `3/hour` | Development: `1000/hour`

- **`RATE_LIMIT_LOGIN`** (default: `5/minute`)
  - Controls login endpoint rate limit
  - Production: `5/minute` | Development: `1000/minute`

- **`RATE_LIMIT_REFRESH`** (default: `10/minute`)
  - Controls token refresh endpoint rate limit
  - Production: `10/minute` | Development: `1000/minute`

- **`RATE_LIMIT_PASSWORD_RESET`** (default: `3/hour`)
  - Controls password reset request endpoint rate limit
  - Production: `3/hour` | Development: `1000/hour`

- **`RATE_LIMIT_RESET_VERIFY`** (default: `10/minute`)
  - Controls reset token verification endpoint rate limit
  - Production: `10/minute` | Development: `1000/minute`

- **`RATE_LIMIT_RESET_CONFIRM`** (default: `5/minute`)
  - Controls password reset confirmation endpoint rate limit
  - Production: `5/minute` | Development: `1000/minute`

## Environment-Specific Configurations

### Development / Testing (.env)

```bash
# Disable rate limiting entirely for E2E tests
ENABLE_RATE_LIMITING=false
RATE_LIMIT_REGISTRATION=1000/hour
RATE_LIMIT_LOGIN=1000/minute
RATE_LIMIT_REFRESH=1000/minute
RATE_LIMIT_PASSWORD_RESET=1000/hour
RATE_LIMIT_RESET_VERIFY=1000/minute
RATE_LIMIT_RESET_CONFIRM=1000/minute
```

**Why?** E2E tests may make many rapid requests to authentication endpoints. Disabling rate limiting prevents test failures due to hitting limits.

### Staging (.env.staging)

```bash
# Enable rate limiting with moderate limits for staging
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REGISTRATION=50/hour
RATE_LIMIT_LOGIN=100/minute
RATE_LIMIT_REFRESH=100/minute
RATE_LIMIT_PASSWORD_RESET=50/hour
RATE_LIMIT_RESET_VERIFY=100/minute
RATE_LIMIT_RESET_CONFIRM=100/minute
```

### Production (.env.production)

```bash
# Enable rate limiting with strict security limits
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REGISTRATION=3/hour
RATE_LIMIT_LOGIN=5/minute
RATE_LIMIT_REFRESH=10/minute
RATE_LIMIT_PASSWORD_RESET=3/hour
RATE_LIMIT_RESET_VERIFY=10/minute
RATE_LIMIT_RESET_CONFIRM=5/minute
```

**Why?** Strict limits protect against:
- Brute force attacks on login
- Spam registrations
- Resource exhaustion
- Credential stuffing attacks

## Testing

### Verify Current Configuration

Run the test script to check your current rate limiting configuration:

```bash
python test_rate_limit.py
```

This will show:
- Whether rate limiting is enabled
- Current rate limits for all endpoints
- Assessment of whether configuration is suitable for testing

### Running E2E Tests

Before running E2E tests, ensure rate limiting is disabled or configured with lenient limits:

```bash
# Option 1: Disable rate limiting (recommended)
ENABLE_RATE_LIMITING=false

# Option 2: Use lenient limits
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REGISTRATION=1000/hour
RATE_LIMIT_LOGIN=1000/minute
# ... etc
```

Then run your tests:

```bash
pytest tests/integration/
```

## Troubleshooting

### E2E Tests Failing with "Too Many Requests" (429)

**Problem**: Tests are hitting rate limits and failing.

**Solution**:
1. Set `ENABLE_RATE_LIMITING=false` in your `.env` file
2. Restart the backend server
3. Re-run the tests

### Verifying Rate Limiting is Working

To test that rate limiting is working in production-like settings:

1. Set `ENABLE_RATE_LIMITING=true` and `RATE_LIMIT_LOGIN=3/minute`
2. Start the server
3. Make 4 rapid login requests to the same endpoint
4. The 4th request should return HTTP 429 (Too Many Requests)

### Rate Limiting Not Working

**Problem**: Rate limiting seems disabled even when `ENABLE_RATE_LIMITING=true`

**Possible causes**:
1. Check that your `.env` file is being loaded correctly
2. Verify the value: `python -c "from app.core.config import settings; print(settings.ENABLE_RATE_LIMITING)"`
3. Restart the server after changing environment variables
4. Check for typos in the environment variable names (they are case-sensitive)

## Implementation Details

### How It Works

1. **Limiter Initialization** (`app/main.py`):
   ```python
   limiter = Limiter(
       key_func=get_remote_address,
       enabled=settings.ENABLE_RATE_LIMITING
   )
   ```

2. **Endpoint Decoration** (`app/api/auth.py`):
   ```python
   @router.post("/login")
   @limiter.limit(settings.RATE_LIMIT_LOGIN)
   async def login(...):
       ...
   ```

3. **Storage**: Rate limiting uses in-memory storage by default. For distributed systems, consider using Redis as a backend.

### Rate Limit Headers

When rate limiting is enabled, responses include headers:
- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

### IP Address Detection

Rate limits are applied per IP address. The system:
1. First checks for `X-Forwarded-For` header (for proxied requests)
2. Falls back to direct client IP address

## Security Considerations

### Production Best Practices

1. **Always enable rate limiting in production**
   ```bash
   ENABLE_RATE_LIMITING=true
   ```

2. **Use strict limits for authentication endpoints**
   - Registration: 3-5 per hour
   - Login: 5-10 per minute
   - Password reset: 3-5 per hour

3. **Monitor rate limit hits**
   - Check logs for frequent 429 responses
   - May indicate attack attempts or legitimate users with issues

4. **Consider using Redis for distributed systems**
   - In-memory storage doesn't work across multiple server instances
   - Redis provides shared rate limit counters

### Attack Scenarios Prevented

- **Brute Force**: Login rate limiting prevents password guessing
- **Spam Registration**: Registration limits prevent account creation abuse
- **Resource Exhaustion**: Overall rate limiting prevents API abuse
- **Credential Stuffing**: Login rate limiting slows down automated attacks

## Migration Guide

### Upgrading from Previous Version

If you're upgrading from a version without configurable rate limiting:

1. Add the new environment variables to your `.env` file:
   ```bash
   # Copy from .env.example
   ENABLE_RATE_LIMITING=false  # for dev
   RATE_LIMIT_REGISTRATION=1000/hour
   # ... etc
   ```

2. Restart your backend server

3. Run tests to verify everything works:
   ```bash
   python test_rate_limit.py
   pytest tests/integration/
   ```

### For CI/CD Pipelines

Add these environment variables to your CI/CD configuration:

```yaml
# GitHub Actions example
env:
  ENABLE_RATE_LIMITING: false
  RATE_LIMIT_REGISTRATION: 1000/hour
  RATE_LIMIT_LOGIN: 1000/minute
  # ... etc
```

## Support

If you encounter issues with rate limiting:

1. Check this documentation first
2. Run `python test_rate_limit.py` to verify configuration
3. Check the backend logs for rate limit messages
4. Review the `.env` file for correct settings

## Further Reading

- [slowapi Documentation](https://github.com/laurentS/slowapi)
- [Flask-Limiter Documentation](https://flask-limiter.readthedocs.io/) (slowapi is based on this)
- [OWASP Rate Limiting Guide](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
