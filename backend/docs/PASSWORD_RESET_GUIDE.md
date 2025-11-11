# Password Reset Implementation Guide

## Overview

This document provides comprehensive documentation for the password reset functionality implemented in the Critvue authentication system.

## Architecture

### Components

1. **Database Model** (`app/models/password_reset.py`)
   - `PasswordResetToken` model for storing reset tokens
   - Includes audit trail (IP, user agent, timestamps)
   - Tokens are hashed before storage for security

2. **Service Layer** (`app/services/password_reset.py`)
   - Token generation and hashing utilities
   - Token verification logic
   - Password reset logic
   - Cleanup utilities

3. **Email Service** (`app/services/email.py`)
   - Abstraction layer for email sending
   - Development mode: logs to console and saves to file
   - Production mode: ready for integration with email providers

4. **API Endpoints** (`app/api/password_reset.py`)
   - Request password reset
   - Verify token validity
   - Confirm password reset

5. **Schemas** (`app/schemas/password_reset.py`)
   - Request/response models
   - Input validation

## Security Features

### 1. Token Security

- **Cryptographically Secure Generation**: Uses `secrets.token_urlsafe(32)` for unpredictable tokens
- **Hashed Storage**: Tokens are hashed with SHA-256 before database storage
- **Single-Use**: Tokens are marked as used after successful reset
- **Time-Limited**: Tokens expire after 15 minutes
- **Token Rotation**: Old unused tokens are invalidated when new ones are requested

### 2. Anti-Enumeration

- **Generic Responses**: Same response for existing and non-existing emails
- **Email Masking**: Email addresses are masked in responses (e.g., `j***@example.com`)
- **Consistent Timing**: Responses take similar time regardless of email existence

### 3. Rate Limiting

- **Request Reset**: 3 requests per hour per IP
- **Verify Token**: 10 requests per minute per IP
- **Confirm Reset**: 5 requests per minute per IP

### 4. Audit Trail

- IP address of requester
- User agent string
- Timestamp of token creation
- Timestamp of token usage

### 5. Token Limits

- Maximum 3 active tokens per user
- Automatic cleanup of expired tokens
- All tokens invalidated after successful password reset

## API Endpoints

### 1. Request Password Reset

```http
POST /api/v1/auth/password-reset/request
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset email sent",
  "detail": "If an account exists with this email, you will receive a password reset link. The link will expire in 15 minutes."
}
```

**Rate Limit**: 3 requests per hour per IP

**Security Notes**:
- Returns same response for existing and non-existing emails
- Prevents email enumeration attacks

### 2. Verify Token (Optional)

```http
POST /api/v1/auth/password-reset/verify
Content-Type: application/json

{
  "token": "abc123def456..."
}
```

**Response** (200 OK - Valid Token):
```json
{
  "valid": true,
  "email": "u***@example.com",
  "expires_in_seconds": 600
}
```

**Response** (200 OK - Invalid Token):
```json
{
  "valid": false,
  "email": null,
  "expires_in_seconds": null
}
```

**Rate Limit**: 10 requests per minute per IP

**Use Case**: Frontend validation before showing password reset form

### 3. Confirm Password Reset

```http
POST /api/v1/auth/password-reset/confirm
Content-Type: application/json

{
  "token": "abc123def456...",
  "new_password": "NewSecureP@ssw0rd"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successful",
  "detail": "Your password has been updated. You can now log in with your new password."
}
```

**Response** (400 Bad Request - Invalid Token):
```json
{
  "detail": "Invalid or expired password reset token"
}
```

**Rate Limit**: 5 requests per minute per IP

**Password Requirements**:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

## Database Schema

```sql
CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    is_used VARCHAR(1) NOT NULL DEFAULT '0',
    used_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX ix_password_reset_tokens_id ON password_reset_tokens(id);
CREATE UNIQUE INDEX ix_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX ix_password_reset_tokens_user_id_expires_at ON password_reset_tokens(user_id, expires_at);
CREATE INDEX ix_password_reset_tokens_token_hash_is_used ON password_reset_tokens(token_hash, is_used);
```

## Development Setup

### 1. Run Database Migration

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

This will create the `password_reset_tokens` table.

### 2. Test Email Sending

In development mode, emails are logged to console and saved to `/backend/dev_emails/` directory.

To test:
```bash
# Request password reset
curl -X POST http://localhost:8000/api/v1/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Check console output for the reset link
# Or check the dev_emails/ directory for the HTML email
```

### 3. Testing with Frontend

The frontend should:

1. **Request Reset Page**:
   - Form with email input
   - Submit to `/api/v1/auth/password-reset/request`
   - Show generic success message

2. **Reset Password Page**:
   - Extract token from URL query parameter (`?token=...`)
   - Optionally verify token with `/api/v1/auth/password-reset/verify`
   - Form with new password input (with strength indicator)
   - Submit to `/api/v1/auth/password-reset/confirm`
   - Show success message and redirect to login

## Production Deployment

### 1. Configure Email Service

Edit `/app/services/email.py` and implement `_send_email_production()`:

**Option A: SendGrid**
```python
# Install: pip install sendgrid
import sendgrid
from sendgrid.helpers.mail import Mail

async def _send_email_production(self, to_email, subject, html_content, text_content):
    sg = sendgrid.SendGridAPIClient(api_key=settings.EMAIL_API_KEY)
    message = Mail(
        from_email=self.email_from,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    response = sg.send(message)
    return response.status_code in [200, 201, 202]
```

**Option B: AWS SES**
```python
# Install: pip install boto3
import boto3

async def _send_email_production(self, to_email, subject, html_content, text_content):
    ses = boto3.client('ses', region_name='us-east-1')
    response = ses.send_email(
        Source=self.email_from,
        Destination={'ToAddresses': [to_email]},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': html_content}}
        }
    )
    return response['ResponseMetadata']['HTTPStatusCode'] == 200
```

### 2. Update Environment Variables

```bash
# .env
EMAIL_FROM=noreply@critvue.com
EMAIL_API_KEY=your_email_service_api_key
```

### 3. Change Email Service Environment

In `/app/services/email.py`, update:
```python
email_service = EmailService(environment="production")
```

Or use environment variable:
```python
import os
email_service = EmailService(environment=os.getenv("ENVIRONMENT", "development"))
```

### 4. Configure Frontend URL

Update the reset URL base in production:
```python
# In app/api/password_reset.py
reset_url_base = "https://critvue.com/reset-password"
```

Or use environment variable:
```python
# app/core/config.py
FRONTEND_URL: str = "https://critvue.com"

# app/api/password_reset.py
from app.core.config import settings
reset_url_base = f"{settings.FRONTEND_URL}/reset-password"
```

## Maintenance

### Cleanup Expired Tokens

Set up a periodic task (cron job or background worker) to clean up expired tokens:

```python
from app.services.password_reset import cleanup_expired_tokens

# Run daily
async def cleanup_task():
    db = get_db_session()
    deleted_count = await cleanup_expired_tokens(db)
    print(f"Cleaned up {deleted_count} expired tokens")
```

### Monitor Token Usage

Query to check token usage:
```sql
-- Active tokens
SELECT COUNT(*) FROM password_reset_tokens
WHERE is_used = '0' AND expires_at > datetime('now');

-- Used tokens
SELECT COUNT(*) FROM password_reset_tokens
WHERE is_used = '1';

-- Expired unused tokens
SELECT COUNT(*) FROM password_reset_tokens
WHERE is_used = '0' AND expires_at <= datetime('now');

-- Tokens by user
SELECT user_id, COUNT(*) as token_count
FROM password_reset_tokens
GROUP BY user_id
ORDER BY token_count DESC;
```

## Security Best Practices

### 1. HTTPS Only

Always use HTTPS in production. Never send reset tokens over HTTP.

### 2. Token Length

The default token length (32 bytes = 43 characters) provides ~256 bits of entropy, making brute force attacks infeasible.

### 3. Email Validation

The system validates email format but intentionally doesn't reveal whether emails exist in the system.

### 4. Password Strength

Password validation is enforced on both frontend and backend. Never rely solely on frontend validation.

### 5. Rate Limiting

Rate limits are implemented per IP address. Consider additional rate limiting per email address or user account in high-security scenarios.

### 6. Monitoring

Monitor for:
- Unusual spikes in password reset requests
- Multiple reset requests from same IP
- Failed reset attempts with valid tokens (potential token theft)

### 7. User Notifications

Consider sending notification emails when:
- Password is successfully reset
- Multiple reset requests are made
- Reset token is used from unusual location/device

## Testing

Run the test suite:

```bash
cd backend
source venv/bin/activate
pytest tests/test_password_reset.py -v
```

Test coverage:
- Token generation and hashing
- Token verification
- Password reset flow
- API endpoints
- Security measures (expiration, single-use, etc.)

## Troubleshooting

### Tokens Not Being Created

1. Check database connection
2. Verify user exists and is active
3. Check console logs for errors

### Emails Not Sending (Development)

1. Check console output
2. Check `dev_emails/` directory
3. Verify logger configuration

### Emails Not Sending (Production)

1. Verify email service API key
2. Check email service quotas/limits
3. Verify sender email is authorized
4. Check email service logs

### Tokens Not Working

1. Verify token hasn't expired (15 minutes)
2. Check if token has already been used
3. Verify token wasn't modified during transmission
4. Check database for token record

### Rate Limiting Issues

1. Check if IP address extraction is working correctly
2. Verify SlowAPI configuration
3. Consider adjusting rate limits for your use case

## Future Enhancements

Potential improvements for production:

1. **Two-Factor Authentication**: Require 2FA code in addition to email token
2. **SMS Reset**: Alternative to email via SMS
3. **Redis Integration**: Store tokens in Redis instead of database for better performance
4. **Account Lockout**: Temporarily lock accounts after too many failed reset attempts
5. **IP Geolocation**: Alert users if reset request comes from unusual location
6. **Email Verification**: Require email verification before allowing password reset
7. **Security Questions**: Additional verification via security questions
8. **Audit Dashboard**: Admin interface to monitor reset activity

## Support

For questions or issues:
- Check the test suite for usage examples
- Review API documentation at `/api/docs`
- Check application logs for detailed error messages
