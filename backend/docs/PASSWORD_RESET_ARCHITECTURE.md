# Password Reset Architecture

## Quick Start

### For Developers

1. **Run migration**: `alembic upgrade head`
2. **Start server**: `uvicorn app.main:app --reload`
3. **Test endpoint**: `POST /api/v1/auth/password-reset/request`
4. **Check emails**: Look in `backend/dev_emails/` or console output

### For Frontend

```javascript
// Request reset
const response = await fetch('http://localhost:8000/api/v1/auth/password-reset/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Confirm reset
const resetResponse = await fetch('http://localhost:8000/api/v1/auth/password-reset/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'token_from_email',
    new_password: 'NewSecureP@ssw0rd'
  })
});
```

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PASSWORD RESET FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

1. REQUEST RESET
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  User    │──────▶│ Frontend │──────▶│  Backend │──────▶│ Database │
│          │       │          │       │   API    │       │          │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
     │                   │                   │                   │
     │                   │             [Generate Token]          │
     │                   │                   │──────────────────▶│
     │                   │                   │  [Store Hash]     │
     │                   │                   │                   │
     │                   │                   ▼                   │
     │                   │             [Send Email]              │
     │                   │             ┌──────────┐              │
     │                   │             │  Email   │              │
     │                   │             │ Service  │              │
     │◀──────────────────┴─────────────┴──────────┘              │
     │           [Generic Success Message]                       │
     │                                                            │

2. RECEIVE EMAIL
┌──────────┐
│  User    │◀──────── Email with Reset Link + Token
│          │          (expires in 15 minutes)
└──────────┘

3. RESET PASSWORD
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  User    │──────▶│ Frontend │──────▶│  Backend │──────▶│ Database │
│          │       │          │       │   API    │       │          │
└──────────┘       └──────────┘       └──────────┘       └──────────┘
     │                   │                   │                   │
     │                   │             [Verify Token]            │
     │                   │                   │◀─────────────────▶│
     │                   │                   │  [Check Valid]    │
     │                   │                   │                   │
     │                   │             [Hash Password]           │
     │                   │                   │                   │
     │                   │             [Update User]             │
     │                   │                   │──────────────────▶│
     │                   │                   │                   │
     │                   │             [Mark Token Used]         │
     │                   │                   │──────────────────▶│
     │                   │                   │                   │
     │◀──────────────────┴───────────────────┴───────────────────┘
     │           [Success - Redirect to Login]
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     password_reset_tokens                                │
├─────────────────────────────────────────────────────────────────────────┤
│ id              INTEGER      PRIMARY KEY                                 │
│ user_id         INTEGER      FK → users.id                              │
│ token_hash      VARCHAR(255) UNIQUE (SHA-256 hash of token)            │
│ is_used         VARCHAR(1)   '0' = unused, '1' = used                  │
│ used_at         DATETIME     Timestamp when token was used             │
│ expires_at      DATETIME     Expiration time (created_at + 15 min)     │
│ created_at      DATETIME     Token creation timestamp                   │
│ ip_address      VARCHAR(45)  IP of requester (IPv6 compatible)         │
│ user_agent      VARCHAR(500) Browser/client user agent                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ FK
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              users                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ id                 INTEGER      PRIMARY KEY                              │
│ email              VARCHAR(255) UNIQUE                                   │
│ hashed_password    VARCHAR(255) Bcrypt hash                             │
│ full_name          VARCHAR(255)                                         │
│ is_active          BOOLEAN                                              │
│ ...                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                  │
└─────────────────────────────────────────────────────────────────────────┘

LAYER 1: NETWORK
├─ HTTPS only (TLS encryption)
├─ Rate limiting (SlowAPI)
│  ├─ 3 requests/hour for reset request
│  ├─ 10 requests/min for token verify
│  └─ 5 requests/min for reset confirm
└─ CORS configuration

LAYER 2: APPLICATION
├─ Anti-enumeration
│  ├─ Generic responses
│  ├─ Consistent timing
│  └─ Email masking
├─ Input validation
│  ├─ Email format
│  └─ Password strength
└─ Token management
   ├─ Cryptographically secure generation
   ├─ SHA-256 hashing before storage
   ├─ 15-minute expiration
   ├─ Single-use enforcement
   └─ Maximum 3 active tokens per user

LAYER 3: DATABASE
├─ Foreign key constraints
├─ Unique constraints
├─ Indexes for performance
└─ Cascade deletion

LAYER 4: AUDIT
├─ IP address tracking
├─ User agent tracking
├─ Timestamp recording
└─ Token usage tracking
```

## File Structure

```
backend/
├── alembic/
│   └── versions/
│       └── 121d28234ca3_add_password_reset_tokens_table.py
├── app/
│   ├── api/
│   │   ├── auth.py (existing)
│   │   └── password_reset.py (NEW)
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   └── session.py
│   ├── models/
│   │   ├── user.py (existing)
│   │   └── password_reset.py (NEW)
│   ├── schemas/
│   │   ├── user.py (existing)
│   │   └── password_reset.py (NEW)
│   ├── services/
│   │   ├── password_reset.py (NEW)
│   │   └── email.py (NEW)
│   └── main.py (updated)
├── tests/
│   └── test_password_reset.py (NEW)
├── docs/
│   ├── PASSWORD_RESET_GUIDE.md (NEW)
│   └── PASSWORD_RESET_ARCHITECTURE.md (NEW)
└── dev_emails/ (created in development)
    └── [timestamp]_[subject].html
```

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TOKEN STATES                                     │
└─────────────────────────────────────────────────────────────────────────┘

[CREATED]
    │
    ├─ Token generated: secrets.token_urlsafe(32)
    ├─ Token hashed: SHA-256
    ├─ Stored in DB with expiration: now + 15 minutes
    ├─ Email sent with plain token
    │
    ▼
[ACTIVE] (is_used='0', expires_at > now)
    │
    ├─────────────┬─────────────┬─────────────┐
    │             │             │             │
    ▼             ▼             ▼             ▼
[USED]      [EXPIRED]    [REPLACED]    [REVOKED]
is_used='1'  expires_at  new token     manually
used_at set  < now       created       deleted
    │             │             │             │
    └─────────────┴─────────────┴─────────────┘
                    │
                    ▼
              [DELETED]
           (cleanup task)
```

## Token Generation Security

```python
# HIGH ENTROPY TOKEN GENERATION

secrets.token_urlsafe(32)  # 32 bytes = 256 bits of entropy
    │
    ├─ Uses os.urandom() (CSPRNG)
    ├─ Base64 URL-safe encoding
    └─ Output: 43 characters
        │
        └─ Example: "dGhpcyBpcyBhIHNlY3VyZSB0b2tlbiB3aXRoIGhpZ2g"
            │
            ▼
hashlib.sha256(token.encode()).hexdigest()
    │
    ├─ One-way hash function
    ├─ Output: 64 character hex string
    └─ Stored in database
        │
        └─ Example: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
```

## Performance Considerations

### Database Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX ix_password_reset_tokens_id ON password_reset_tokens(id);

-- Token lookup (used in verify and reset operations)
CREATE UNIQUE INDEX ix_password_reset_tokens_token_hash
    ON password_reset_tokens(token_hash);

-- User token lookup (used in create operation)
CREATE INDEX ix_password_reset_tokens_user_id_expires_at
    ON password_reset_tokens(user_id, expires_at);

-- Validity check (used in verify operation)
CREATE INDEX ix_password_reset_tokens_token_hash_is_used
    ON password_reset_tokens(token_hash, is_used);
```

### Query Optimization

1. **Token Verification**: O(1) lookup via unique index on token_hash
2. **User Token Cleanup**: O(log n) via composite index on (user_id, expires_at)
3. **Expiration Check**: In-memory comparison after database retrieval

### Expected Load

| Operation | Frequency | Response Time |
|-----------|-----------|---------------|
| Request Reset | ~100/day | <100ms |
| Verify Token | ~200/day | <50ms |
| Confirm Reset | ~100/day | <200ms |

## Error Handling

```
Request → Validation → Business Logic → Database → Response
    │          │              │            │         │
    └─ 422     └─ 400         └─ 400       └─ 500   └─ 200
   (format)   (invalid)     (expired)    (error)  (success)
```

### HTTP Status Codes

| Code | Scenario |
|------|----------|
| 200 | Success (including "email sent" for non-existent emails) |
| 400 | Invalid/expired token, business logic error |
| 422 | Validation error (invalid email format, weak password) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

## Monitoring & Alerting

### Key Metrics

1. **Request Volume**
   - Password reset requests per hour
   - Successful resets per day
   - Failed reset attempts

2. **Security Metrics**
   - Rate limit hits per IP
   - Expired token usage attempts
   - Multiple requests per user

3. **Performance Metrics**
   - API response times
   - Database query times
   - Email delivery success rate

### Alert Thresholds

```
⚠️  Warning: >100 reset requests/hour
🚨 Critical: >1000 reset requests/hour

⚠️  Warning: >10 failed resets from same IP
🚨 Critical: >50 failed resets from same IP

⚠️  Warning: Database query time >500ms
🚨 Critical: Database query time >2000ms
```

## Integration Checklist

### Backend
- [x] Database model created
- [x] Migration file created
- [x] Service layer implemented
- [x] API endpoints created
- [x] Email service abstracted
- [x] Tests written
- [x] Documentation complete

### Frontend (TODO)
- [ ] Request reset page
- [ ] Reset password page (with token)
- [ ] Form validation
- [ ] Password strength indicator
- [ ] Success/error handling
- [ ] Email sent confirmation
- [ ] Redirect after success

### DevOps (TODO)
- [ ] Email service configured
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Backup strategy
- [ ] Cleanup job scheduled

## Common Integration Issues

### Issue: Emails not delivered
**Solution**: Check email service configuration, verify sender authorization

### Issue: Tokens invalid immediately
**Solution**: Check server timezone, verify expiration logic

### Issue: Rate limit too strict
**Solution**: Adjust limits in `/app/api/password_reset.py`

### Issue: Frontend can't extract token
**Solution**: Ensure URL format matches: `?token=...`

### Issue: Password validation failing
**Solution**: Check password requirements match frontend and backend

## Quick Reference

### Key Files
- **API**: `/app/api/password_reset.py`
- **Service**: `/app/services/password_reset.py`
- **Email**: `/app/services/email.py`
- **Model**: `/app/models/password_reset.py`
- **Migration**: `/alembic/versions/121d28234ca3_*.py`

### Key Functions
- `create_password_reset_token()` - Generate and store token
- `verify_reset_token()` - Check token validity
- `reset_password()` - Update password with token
- `send_password_reset_email()` - Send reset email

### Key Constants
- `RESET_TOKEN_EXPIRE_MINUTES = 15`
- `RESET_TOKEN_LENGTH = 32`
- `MAX_ACTIVE_TOKENS_PER_USER = 3`

### Environment Variables
- `EMAIL_FROM` - Sender email address
- `EMAIL_API_KEY` - Email service API key
- `FRONTEND_URL` - Frontend base URL for reset links
