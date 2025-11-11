# Review Request API Reference

## Base URL
```
/api/v1/reviews
```

## Authentication
All endpoints require authentication via httpOnly cookie containing JWT access token.

## Endpoints

### 1. Create Review Request

**POST** `/api/v1/reviews`

Create a new review request for the authenticated user.

**Request Body:**
```json
{
  "title": "string (3-255 chars, required)",
  "description": "string (10-5000 chars, required)",
  "content_type": "design|code|video|audio|writing|art (required)",
  "review_type": "free|expert (default: free)",
  "status": "draft|pending (default: draft)",
  "feedback_areas": "string (optional, max 1000 chars)",
  "budget": "number (required if review_type=expert, 2 decimal places)"
}
```

**Example:**
```json
{
  "title": "Logo Design Review",
  "description": "Need feedback on my new logo design for a tech startup. Looking for opinions on color choice and overall impact.",
  "content_type": "design",
  "review_type": "free",
  "status": "draft",
  "feedback_areas": "Color scheme, Typography, Brand impact"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "user_id": 123,
  "title": "Logo Design Review",
  "description": "Need feedback on my new logo design...",
  "content_type": "design",
  "review_type": "free",
  "status": "draft",
  "feedback_areas": "Color scheme, Typography, Brand impact",
  "budget": null,
  "created_at": "2025-11-11T15:30:00",
  "updated_at": "2025-11-11T15:30:00",
  "completed_at": null,
  "deleted_at": null,
  "files": []
}
```

**Errors:**
- `400 Bad Request` - Invalid input (validation errors)
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### 2. List Review Requests

**GET** `/api/v1/reviews`

Get a paginated list of the current user's review requests.

**Query Parameters:**
- `skip` (integer, default: 0) - Number of records to skip
- `limit` (integer, default: 10, max: 100) - Max records to return
- `status_filter` (optional) - Filter by status: draft|pending|in_review|completed|cancelled

**Example:**
```
GET /api/v1/reviews?skip=0&limit=20&status_filter=pending
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 123,
      "title": "Logo Design Review",
      "description": "...",
      "content_type": "design",
      "review_type": "free",
      "status": "pending",
      "feedback_areas": "Color scheme, Typography",
      "budget": null,
      "created_at": "2025-11-11T15:30:00",
      "updated_at": "2025-11-11T15:35:00",
      "completed_at": null,
      "deleted_at": null,
      "files": [
        {
          "id": 1,
          "review_request_id": 1,
          "filename": "logo_v1.png",
          "original_filename": "my-logo.png",
          "file_size": 524288,
          "file_type": "image/png",
          "file_url": "https://...",
          "file_path": "/uploads/...",
          "content_hash": "abc123...",
          "uploaded_at": "2025-11-11T15:32:00"
        }
      ]
    }
  ],
  "total": 15,
  "skip": 0,
  "limit": 20,
  "has_more": false
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### 3. Get Review Statistics

**GET** `/api/v1/reviews/stats`

Get statistics for the current user's review requests.

**Response:** `200 OK`
```json
{
  "total_requests": 15,
  "draft_count": 3,
  "pending_count": 5,
  "in_review_count": 2,
  "completed_count": 4,
  "cancelled_count": 1
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### 4. Get Single Review Request

**GET** `/api/v1/reviews/{review_id}`

Get a specific review request by ID. User must own the review.

**Path Parameters:**
- `review_id` (integer, required) - Review request ID

**Example:**
```
GET /api/v1/reviews/123
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "user_id": 456,
  "title": "Code Review for Authentication Module",
  "description": "...",
  "content_type": "code",
  "review_type": "expert",
  "status": "in_review",
  "feedback_areas": "Security, Best practices, Performance",
  "budget": 49.99,
  "created_at": "2025-11-10T10:00:00",
  "updated_at": "2025-11-11T09:00:00",
  "completed_at": null,
  "deleted_at": null,
  "files": [...]
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Review not found or user doesn't own it
- `500 Internal Server Error` - Server error

---

### 5. Update Review Request

**PATCH** `/api/v1/reviews/{review_id}`

Update a review request. Only draft and pending reviews can be edited.

**Path Parameters:**
- `review_id` (integer, required) - Review request ID

**Request Body (all fields optional):**
```json
{
  "title": "string (3-255 chars, optional)",
  "description": "string (10-5000 chars, optional)",
  "content_type": "design|code|video|audio|writing|art (optional)",
  "review_type": "free|expert (optional)",
  "status": "draft|pending|in_review|completed|cancelled (optional)",
  "feedback_areas": "string (optional, max 1000 chars)",
  "budget": "number (optional, 2 decimal places)"
}
```

**Example:**
```json
{
  "status": "pending",
  "feedback_areas": "Updated: Focus on security vulnerabilities"
}
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "user_id": 456,
  "title": "Code Review for Authentication Module",
  "status": "pending",
  "feedback_areas": "Updated: Focus on security vulnerabilities",
  ...
}
```

**Errors:**
- `400 Bad Request` - Invalid input or review cannot be edited (wrong status)
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Review not found or user doesn't own it
- `500 Internal Server Error` - Server error

**Note:** Reviews in `in_review`, `completed`, or `cancelled` status cannot be edited.

---

### 6. Delete Review Request

**DELETE** `/api/v1/reviews/{review_id}`

Delete a review request. Soft delete by default (sets deleted_at timestamp).

**Path Parameters:**
- `review_id` (integer, required) - Review request ID

**Query Parameters:**
- `hard_delete` (boolean, default: false) - If true, permanently delete

**Example:**
```
DELETE /api/v1/reviews/123?hard_delete=false
```

**Response:** `204 No Content`

No response body.

**Errors:**
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Review not found or user doesn't own it
- `500 Internal Server Error` - Server error

**Note:** Soft-deleted reviews are hidden from list/get operations but remain in database. Use `hard_delete=true` to permanently remove.

---

## Content Types

- `design` - UI/UX designs, mockups, wireframes, graphics
- `code` - Source code, algorithms, architecture
- `video` - Video content, editing, production
- `audio` - Music, podcasts, sound design
- `writing` - Articles, documentation, creative writing
- `art` - Digital art, illustrations, traditional art

## Review Types

- `free` - AI-powered and community reviews (no cost)
- `expert` - Professional expert reviews (paid, requires budget)

## Review Status Flow

```
draft → pending → in_review → completed
   ↓                             ↑
   └──────→ cancelled ←──────────┘
```

- `draft` - Initial state, still being prepared
- `pending` - Submitted and waiting for reviewer
- `in_review` - Currently being reviewed
- `completed` - Review finished
- `cancelled` - Review was cancelled

**Note:** Only `draft` and `pending` reviews can be edited.

## Error Response Format

All errors return a consistent format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

## Rate Limiting

API endpoints may be rate-limited. Check response headers:
- `X-RateLimit-Limit` - Request limit per time window
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time when limit resets

## Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no response body
- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## cURL Examples

### Create a review request
```bash
curl -X POST http://localhost:8000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -b "access_token=YOUR_JWT_TOKEN" \
  -d '{
    "title": "Logo Design Review",
    "description": "Need feedback on my logo design",
    "content_type": "design",
    "review_type": "free",
    "status": "draft"
  }'
```

### List reviews with pagination
```bash
curl -X GET "http://localhost:8000/api/v1/reviews?skip=0&limit=10" \
  -b "access_token=YOUR_JWT_TOKEN"
```

### Get single review
```bash
curl -X GET http://localhost:8000/api/v1/reviews/123 \
  -b "access_token=YOUR_JWT_TOKEN"
```

### Update review status
```bash
curl -X PATCH http://localhost:8000/api/v1/reviews/123 \
  -H "Content-Type: application/json" \
  -b "access_token=YOUR_JWT_TOKEN" \
  -d '{"status": "pending"}'
```

### Delete review (soft delete)
```bash
curl -X DELETE http://localhost:8000/api/v1/reviews/123 \
  -b "access_token=YOUR_JWT_TOKEN"
```

### Get statistics
```bash
curl -X GET http://localhost:8000/api/v1/reviews/stats \
  -b "access_token=YOUR_JWT_TOKEN"
```

## Python Client Example

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login first to get cookie
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "user@example.com", "password": "Password123!"}
)
cookies = login_response.cookies

# Create review request
review = requests.post(
    f"{BASE_URL}/reviews",
    json={
        "title": "Logo Design Review",
        "description": "Need feedback on my logo",
        "content_type": "design",
        "review_type": "free",
        "status": "draft"
    },
    cookies=cookies
).json()

print(f"Created review: {review['id']}")

# List all reviews
reviews = requests.get(
    f"{BASE_URL}/reviews?limit=20",
    cookies=cookies
).json()

print(f"Total reviews: {reviews['total']}")

# Update review
updated = requests.patch(
    f"{BASE_URL}/reviews/{review['id']}",
    json={"status": "pending"},
    cookies=cookies
).json()

print(f"Updated status: {updated['status']}")
```

## Frontend Integration Notes

1. **Authentication**: Ensure cookies are sent with every request
2. **Pagination**: Implement infinite scroll or pagination controls
3. **Error Handling**: Display validation errors from 400 responses
4. **Loading States**: Show loaders during async operations
5. **Optimistic Updates**: Update UI before API confirmation for better UX
6. **File Uploads**: Will be implemented in Phase 2
7. **Real-time Updates**: Consider WebSocket for review status changes (future)
