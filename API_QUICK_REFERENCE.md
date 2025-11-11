# Critvue API Quick Reference

**Base URL:** `http://localhost:8000`  
**Authentication:** Cookie-based JWT (httpOnly)

---

## Authentication

### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"  // optional
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

# Response sets cookies:
# - access_token (15min expiry)
# - refresh_token (7 days expiry)
```

### Get Current User
```bash
GET /api/v1/auth/me
# Requires authentication cookie
```

### Logout
```bash
POST /api/v1/auth/logout
# Clears authentication cookies
```

---

## Reviews

### Create Review
```bash
POST /api/v1/reviews
Content-Type: application/json
Cookie: access_token=<jwt>

{
  "title": "My Project Title",
  "description": "Detailed description...",
  "content_type": "design",  // design|code|video|audio|writing|art
  "review_type": "free",      // free|expert
  "feedback_areas": "UI/UX, Performance",  // optional
  "budget": 99.00             // optional, for expert reviews only
}
```

### List Reviews (Paginated)
```bash
GET /api/v1/reviews?skip=0&limit=10&status=draft
Cookie: access_token=<jwt>

# Query Parameters:
# - skip: offset for pagination (default: 0)
# - limit: items per page (default: 10, max: 100)
# - status: filter by status (optional)
#   - draft, pending, in_review, completed, cancelled
```

### Get Single Review
```bash
GET /api/v1/reviews/{review_id}
Cookie: access_token=<jwt>
```

### Update Review
```bash
PATCH /api/v1/reviews/{review_id}
Content-Type: application/json
Cookie: access_token=<jwt>

{
  "title": "Updated Title",           // optional
  "description": "Updated desc",      // optional
  "status": "pending",                // optional
  "feedback_areas": "New areas",      // optional
  "budget": 150.00                    // optional
}
```

### Delete Review (Soft Delete)
```bash
DELETE /api/v1/reviews/{review_id}
Cookie: access_token=<jwt>

# Sets deleted_at timestamp
# Review is hidden from all queries
```

### Get Statistics
```bash
GET /api/v1/reviews/stats
Cookie: access_token=<jwt>

# Response:
{
  "total_requests": 10,
  "draft_count": 3,
  "pending_count": 5,
  "in_review_count": 1,
  "completed_count": 1,
  "cancelled_count": 0
}
```

---

## Files

### Upload File
```bash
POST /api/v1/files/upload
Content-Type: multipart/form-data
Cookie: access_token=<jwt>

# Form data:
# - file: File object
# - review_request_id: integer (required)
```

### Download File
```bash
GET /files/{filename}
# Static file serving, no auth required if public
```

---

## Response Formats

### List Response
```json
{
  "items": [...],
  "total": 100,
  "skip": 0,
  "limit": 10,
  "has_more": true
}
```

### Review Object
```json
{
  "id": 1,
  "user_id": 1,
  "title": "My Review",
  "description": "Description...",
  "content_type": "design",
  "review_type": "free",
  "status": "draft",
  "feedback_areas": "UI/UX, Performance",
  "budget": null,
  "created_at": "2025-11-11T19:20:11.795687",
  "updated_at": "2025-11-11T19:20:11.795689",
  "completed_at": null,
  "deleted_at": null,
  "files": []
}
```

### User Object
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "creator",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-11-11T19:00:00.000000",
  "last_login": "2025-11-11T19:30:00.000000"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Unable to complete registration. Please try a different email."
}
```

### 401 Unauthorized
```json
{
  "detail": "Incorrect email or password"
}
```

### 404 Not Found
```json
{
  "detail": "Review request not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "description"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Enums

### ContentType
- `design` - UI/UX, graphics, visual design
- `code` - Source code, architecture
- `video` - Video content, editing
- `audio` - Music, podcasts, sound
- `writing` - Articles, documentation, copy
- `art` - Digital art, illustrations

### ReviewType
- `free` - AI + community reviews
- `expert` - Paid expert reviews

### ReviewStatus
- `draft` - Initial state, not submitted
- `pending` - Submitted, waiting for review
- `in_review` - Currently being reviewed
- `completed` - Review finished
- `cancelled` - Review cancelled

### UserRole
- `creator` - Creates review requests
- `reviewer` - Provides reviews
- `admin` - System administrator

---

## Frontend Integration Example

### 5-Step Review Flow

```typescript
// Step 1: Create draft review with content type
const createResponse = await fetch('/api/v1/reviews', {
  method: 'POST',
  credentials: 'include',  // Include cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Draft',
    description: 'Draft',
    content_type: selectedType,
    review_type: 'free'
  })
});
const review = await createResponse.json();

// Step 2: Update with basic info
await fetch(`/api/v1/reviews/${review.id}`, {
  method: 'PATCH',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: formData.title,
    description: formData.description
  })
});

// Step 3: Update feedback areas
await fetch(`/api/v1/reviews/${review.id}`, {
  method: 'PATCH',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    feedback_areas: selectedAreas.join(', ')
  })
});

// Step 4: Upload files (optional)
const formData = new FormData();
formData.append('file', fileObject);
formData.append('review_request_id', review.id);
await fetch('/api/v1/files/upload', {
  method: 'POST',
  credentials: 'include',
  body: formData
});

// Step 5: Set review type and submit
await fetch(`/api/v1/reviews/${review.id}`, {
  method: 'PATCH',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    review_type: isExpert ? 'expert' : 'free',
    budget: isExpert ? budgetAmount : null,
    status: 'pending'  // Submit the review
  })
});
```

---

## Testing with curl

### Complete Flow
```bash
# 1. Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 2. Login (save cookies)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt

# 3. Create review
curl -X POST http://localhost:8000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title":"My Project",
    "description":"Please review",
    "content_type":"design",
    "review_type":"free"
  }'

# 4. List reviews
curl -X GET "http://localhost:8000/api/v1/reviews?skip=0&limit=10" \
  -b cookies.txt

# 5. Get stats
curl -X GET http://localhost:8000/api/v1/reviews/stats \
  -b cookies.txt
```

---

## Database Schema

### Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(10) DEFAULT 'creator',
  is_active BOOLEAN DEFAULT 1,
  is_verified BOOLEAN DEFAULT 0,
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

### Review Requests
```sql
CREATE TABLE review_requests (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  review_type VARCHAR(10) DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'draft',
  feedback_areas TEXT,
  budget DECIMAL(10, 2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  deleted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_user_status_created ON review_requests(user_id, status, created_at);
CREATE INDEX idx_user_deleted ON review_requests(user_id, deleted_at);
CREATE INDEX idx_status_created ON review_requests(status, created_at);
```

---

## Rate Limits

Default rate limits (configurable):
- Registration: 5 per hour
- Login: 10 per minute
- Token Refresh: 20 per hour
- General API: 100 per minute

---

## Security Notes

1. **Cookies are httpOnly** - Cannot be accessed by JavaScript (XSS protection)
2. **SameSite=Lax** - CSRF protection
3. **Access tokens expire in 15 minutes** - Limited exposure window
4. **Refresh tokens expire in 7 days** - Balance of security and UX
5. **User isolation** - Users can only access their own data
6. **Soft deletes** - Data preserved for audit trail
7. **Input validation** - All inputs validated via Pydantic
8. **SQL injection protection** - SQLAlchemy ORM with parameterized queries
9. **Path traversal protection** - File operations secured

---

**Version:** 0.1.0  
**Last Updated:** 2025-11-11  
**Status:** Production Ready
