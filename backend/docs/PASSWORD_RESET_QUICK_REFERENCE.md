# Password Reset - Quick Reference Card

## API Endpoints

### 1. Request Password Reset
```bash
POST /api/v1/auth/password-reset/request
Content-Type: application/json

{
  "email": "user@example.com"
}
```
**Rate Limit**: 3/hour per IP

### 2. Verify Token (Optional)
```bash
POST /api/v1/auth/password-reset/verify
Content-Type: application/json

{
  "token": "your-token-here"
}
```
**Rate Limit**: 10/minute per IP

### 3. Confirm Reset
```bash
POST /api/v1/auth/password-reset/confirm
Content-Type: application/json

{
  "token": "your-token-here",
  "new_password": "NewSecureP@ssw0rd"
}
```
**Rate Limit**: 5/minute per IP

## cURL Examples

```bash
# Request reset
curl -X POST http://localhost:8000/api/v1/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Verify token
curl -X POST http://localhost:8000/api/v1/auth/password-reset/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123..."}'

# Confirm reset
curl -X POST http://localhost:8000/api/v1/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123...","new_password":"NewSecureP@ssw0rd"}'
```

## Frontend Integration

### React/Next.js Example

```typescript
// Request password reset
async function requestPasswordReset(email: string) {
  const response = await fetch('/api/v1/auth/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return await response.json();
}

// Verify token
async function verifyResetToken(token: string) {
  const response = await fetch('/api/v1/auth/password-reset/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return await response.json();
}

// Confirm reset
async function confirmPasswordReset(token: string, newPassword: string) {
  const response = await fetch('/api/v1/auth/password-reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword })
  });
  return await response.json();
}
```

### Vue.js Example

```javascript
// Request password reset
async requestPasswordReset(email) {
  const response = await this.$axios.post('/api/v1/auth/password-reset/request', {
    email
  });
  return response.data;
}

// Verify token
async verifyResetToken(token) {
  const response = await this.$axios.post('/api/v1/auth/password-reset/verify', {
    token
  });
  return response.data;
}

// Confirm reset
async confirmPasswordReset(token, newPassword) {
  const response = await this.$axios.post('/api/v1/auth/password-reset/confirm', {
    token,
    new_password: newPassword
  });
  return response.data;
}
```

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character (!@#$%^&*(),.?":{}|<>)

## Token Details

- **Length**: 43 characters
- **Expiration**: 15 minutes
- **Format**: URL-safe base64 string
- **Usage**: Single-use only
- **Example**: `dGhpcyBpcyBhIHNlY3VyZSB0b2tlbiB3aXRoIGhpZ2g`

## Development Testing

### 1. Check Email Output
Emails are saved to: `/backend/dev_emails/`

### 2. Console Output
Watch server console for email content during development

### 3. Test with pytest
```bash
cd backend
source venv/bin/activate
pytest tests/test_password_reset.py -v
```

## Database Queries

### View Active Tokens
```sql
SELECT * FROM password_reset_tokens
WHERE is_used = '0' AND expires_at > datetime('now');
```

### Count Tokens by User
```sql
SELECT user_id, COUNT(*) as count
FROM password_reset_tokens
GROUP BY user_id;
```

### Clean Up Expired Tokens
```sql
DELETE FROM password_reset_tokens
WHERE expires_at < datetime('now', '-24 hours');
```

## Common Error Responses

### Invalid Email Format (422)
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### Invalid Token (400)
```json
{
  "detail": "Invalid or expired password reset token"
}
```

### Weak Password (422)
```json
{
  "detail": [
    {
      "loc": ["body", "new_password"],
      "msg": "Password must contain at least one uppercase letter",
      "type": "value_error"
    }
  ]
}
```

### Rate Limit Exceeded (429)
```json
{
  "error": "Rate limit exceeded: 3 per 1 hour"
}
```

## Configuration

### Environment Variables
```bash
# .env
EMAIL_FROM=noreply@critvue.com
EMAIL_API_KEY=your_api_key_here
FRONTEND_URL=http://localhost:3000
```

### Adjust Token Expiration
Edit `/app/services/password_reset.py`:
```python
RESET_TOKEN_EXPIRE_MINUTES = 15  # Change this value
```

### Adjust Rate Limits
Edit `/app/api/password_reset.py`:
```python
@limiter.limit("3/hour")  # Request reset
@limiter.limit("10/minute")  # Verify token
@limiter.limit("5/minute")  # Confirm reset
```

### Max Tokens Per User
Edit `/app/services/password_reset.py`:
```python
MAX_ACTIVE_TOKENS_PER_USER = 3  # Change this value
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Email not received | Check `dev_emails/` folder or console output |
| Token expired | Request new reset (tokens expire in 15 min) |
| Token invalid | Ensure token wasn't modified, check if already used |
| Password rejected | Check password meets all requirements |
| Rate limited | Wait before retrying (limits reset hourly/minutely) |

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] Email service configured
- [ ] Rate limiting active
- [ ] Strong password requirements enforced
- [ ] Monitoring/logging enabled
- [ ] Backup strategy in place
- [ ] Token cleanup job scheduled

## Production Deployment

1. Configure email service in `/app/services/email.py`
2. Update environment variables
3. Change email service mode to "production"
4. Update frontend URL in reset emails
5. Test end-to-end flow
6. Set up monitoring

## Support

- **Full Documentation**: `/docs/PASSWORD_RESET_GUIDE.md`
- **Architecture**: `/docs/PASSWORD_RESET_ARCHITECTURE.md`
- **API Docs**: `http://localhost:8000/api/docs`
- **Tests**: `/tests/test_password_reset.py`
