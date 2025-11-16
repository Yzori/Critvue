# Critvue Authentication API - Quick Reference

Base URL: `http://localhost:8000`

---

## Authentication Endpoints

### 1. Health Check
Check if the backend is running and database is connected.

```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "critvue-backend",
  "database": "connected",
  "version": "0.1.0",
  "timestamp": "2025-11-11T11:42:09.354820"
}
```

---

### 2. Register New User
Create a new user account.

```http
POST /api/v1/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "creator",
  "is_active": true,
  "is_verified": false,
  "bio": null,
  "avatar_url": null,
  "created_at": "2025-11-11T11:42:09.525575"
}
```

**Errors:**
- `400` - Email already exists
- `422` - Validation error (weak password, invalid email)

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (!@#$%^&*(),.?":{}|<>)

**Rate Limit:** 3 requests per hour per IP

---

### 3. Login
Authenticate and receive JWT tokens.

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3NjI4NjQ5MjksInR5cGUiOiJhY2Nlc3MifQ.xxx",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3NjU0NTMzMjksInR5cGUiOiJyZWZyZXNoIn0.xxx",
  "token_type": "bearer"
}
```

**Errors:**
- `401` - Invalid credentials (wrong email or password)
- `403` - Account inactive

**Rate Limit:** 5 requests per minute per IP

---

### 4. Get Current User
Retrieve authenticated user's information.

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "creator",
  "is_active": true,
  "is_verified": false,
  "bio": null,
  "avatar_url": null,
  "created_at": "2025-11-11T11:42:09.525575"
}
```

**Errors:**
- `401` - Invalid, expired, or malformed token
- `403` - No authorization header provided

---

### 5. Refresh Token
Get new access and refresh tokens using a refresh token.

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
- `401` - Invalid, expired, or malformed refresh token
- `401` - User not found or inactive

**Rate Limit:** 10 requests per minute per IP

---

### 6. Logout
Logout and blacklist the current access token (requires Redis).

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out",
  "detail": "Your session has been terminated. Please log in again to continue."
}
```

**Note:** Token blacklisting requires Redis to be configured.

---

### 7. Request Password Reset
Request a password reset email.

```http
POST /api/v1/auth/password-reset/request
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent",
  "detail": "If an account exists with this email, you will receive a password reset link. The link will expire in 15 minutes."
}
```

**Note:** Always returns 200 OK to prevent email enumeration.

**Rate Limit:** 3 requests per hour per IP

---

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created (registration) |
| 400 | Bad Request | Duplicate email, invalid data |
| 401 | Unauthorized | Invalid/expired token, wrong credentials |
| 403 | Forbidden | Missing authorization, inactive account |
| 422 | Unprocessable Entity | Validation error (password requirements, email format) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (should not happen in production) |

---

## Token Information

### Access Token
- **Expiry:** 60 minutes
- **Purpose:** Authenticate API requests
- **Format:** JWT (HS256)
- **Usage:** `Authorization: Bearer <access_token>`

### Refresh Token
- **Expiry:** 30 days
- **Purpose:** Get new access tokens
- **Format:** JWT (HS256)
- **Usage:** Send in request body to `/auth/refresh`

### Token Payload Structure
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "exp": 1762864929,
  "type": "access" // or "refresh"
}
```

---

## cURL Examples

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "full_name": "New User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
ACCESS_TOKEN="your_access_token_here"

curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
```

---

## JavaScript/Fetch Examples

### Register
```javascript
const response = await fetch('http://localhost:8000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    full_name: 'New User'
  })
});

const user = await response.json();
console.log('User created:', user);
```

### Login
```javascript
const response = await fetch('http://localhost:8000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'SecurePass123!'
  })
});

const { access_token, refresh_token } = await response.json();
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);
```

### Get Current User
```javascript
const access_token = localStorage.getItem('access_token');

const response = await fetch('http://localhost:8000/api/v1/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const user = await response.json();
console.log('Current user:', user);
```

### Refresh Token
```javascript
const refresh_token = localStorage.getItem('refresh_token');

const response = await fetch('http://localhost:8000/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token })
});

const { access_token: newAccessToken, refresh_token: newRefreshToken } = await response.json();
localStorage.setItem('access_token', newAccessToken);
localStorage.setItem('refresh_token', newRefreshToken);
```

---

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`

Credentials (cookies, authorization headers) are allowed.

---

## Testing the API

### Using the Integration Test Suite
```bash
cd /home/user/Critvue/backend
source venv/bin/activate
python3 tests/manual/integration_test.py
```

### Using the Interactive API Documentation
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

---

## Production Checklist

Before deploying to production:

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Change `REFRESH_SECRET_KEY` to a strong random value
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for token blacklisting
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set up email service
- [ ] Enable production logging
- [ ] Configure monitoring and alerts
- [ ] Perform security audit

---

**Last Updated:** November 11, 2025
**API Version:** 0.1.0
**Status:** Production Ready ✅
