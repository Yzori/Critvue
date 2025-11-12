# Multi-Review System - Quick Start Guide

## What Was Implemented

A complete multi-review system that allows users to request multiple reviews for a single piece of content. Users can specify "I want 3 reviews" and multiple reviewers can claim slots until all are filled.

---

## Running the Migration

```bash
cd /home/user/Critvue/backend
alembic upgrade head
```

This will:
- Add `reviews_requested` (default 1, range 1-10)
- Add `reviews_claimed` (default 0)
- Create indexes for performance
- Add database constraints for data integrity
- Migrate existing records (set reviews_requested=1)

---

## Key Features

### 1. Request Multiple Reviews
Users can now request 1-10 reviews per content piece:

```python
# In review request form
{
  "title": "My Design Project",
  "reviews_requested": 3,  # NEW FIELD
  # ... other fields
}
```

### 2. Browse Shows Availability
Browse API now shows claim status:

```json
{
  "id": 123,
  "title": "Review my app",
  "reviews_requested": 3,
  "reviews_claimed": 1,
  "available_slots": 2,
  // ... other fields
}
```

### 3. Claim Review Slots
Reviewers can claim available slots:

```bash
# Claim a slot
POST /api/v1/reviews/123/claim

# Response
{
  "success": true,
  "message": "Successfully claimed review slot",
  "reviews_claimed": 2,
  "available_slots": 1,
  "is_fully_claimed": false
}
```

### 4. Auto-Filter Fully Claimed
Browse automatically filters out reviews where all slots are claimed.

---

## API Endpoints

### Browse Reviews (Updated)
```http
GET /api/v1/reviews/browse?content_type=design&limit=50
```

Returns reviews with `reviews_requested`, `reviews_claimed`, `available_slots` fields.

### Claim Slot (New)
```http
POST /api/v1/reviews/{review_id}/claim
Authentication: Required (JWT cookie)
Rate Limit: 20/minute
```

**Validations:**
- Cannot claim own review (403)
- Must have available slots (409)
- Must be PENDING or IN_REVIEW (409)
- Race condition protected

### Unclaim Slot (New)
```http
POST /api/v1/reviews/{review_id}/unclaim
Authentication: Required
Rate Limit: 20/minute
```

---

## Testing

### Quick Manual Test

```bash
# 1. Run migration
cd /home/user/Critvue/backend
alembic upgrade head

# 2. Start server
uvicorn app.main:app --reload

# 3. Create review with 3 slots (via API or UI)
# 4. Browse marketplace (should see available_slots: 3)
# 5. Claim slot as different user
# 6. Browse again (should see available_slots: 2)
# 7. Claim 2 more slots
# 8. Browse again (review should disappear - fully claimed)
```

### Test Race Conditions

```python
# Test concurrent claims on last slot
# Create review with 1 slot
# Try to claim from 3 users simultaneously
# Only 1 should succeed, others get 409 Conflict
```

---

## Database Schema

### New Columns

| Column | Type | Default | Constraints |
|--------|------|---------|-------------|
| reviews_requested | INTEGER | 1 | 1-10, NOT NULL |
| reviews_claimed | INTEGER | 0 | >= 0, <= reviews_requested |

### Computed Properties (Model)

```python
review.available_slots  # reviews_requested - reviews_claimed
review.is_fully_claimed  # reviews_claimed >= reviews_requested
review.is_partially_claimed  # 0 < claimed < requested
review.claim_progress_percentage  # (claimed / requested) * 100
```

---

## Status Management

### Status Flow

```
DRAFT
  ↓
PENDING (0 claimed)
  ↓ (first claim)
IN_REVIEW (1+ claimed, not all)
  ↓ (all claimed)
IN_REVIEW (fully claimed, waiting for reviews)
  ↓ (reviews submitted)
COMPLETED
```

### Unclaim Flow

```
IN_REVIEW (multiple claimed)
  ↓ (unclaim one)
IN_REVIEW (still has claimed slots)

IN_REVIEW (1 claimed)
  ↓ (unclaim last)
PENDING (0 claimed)
```

---

## Race Condition Protection

Uses database-level row locking:

```python
# In claim_review_slot()
query = (
    select(ReviewRequest)
    .where(ReviewRequest.id == review_id)
    .with_for_update()  # Locks row during transaction
)
```

This ensures:
- Only one transaction can increment `reviews_claimed` at a time
- Cannot exceed `reviews_requested`
- Atomic operations

---

## Frontend Integration

### Display Slots

```tsx
<div className="review-card">
  <h3>{review.title}</h3>
  <div className="slots">
    <span>{review.reviews_claimed}/{review.reviews_requested} claimed</span>
    <ProgressBar value={(review.reviews_claimed / review.reviews_requested) * 100} />
    {review.available_slots > 0 ? (
      <Button onClick={() => claimSlot(review.id)}>
        Claim Slot ({review.available_slots} available)
      </Button>
    ) : (
      <span className="full">All slots claimed</span>
    )}
  </div>
</div>
```

### Claim Function

```typescript
async function claimSlot(reviewId: number) {
  try {
    const response = await fetch(`/api/v1/reviews/${reviewId}/claim`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }

    const result = await response.json();
    console.log(`Claimed! ${result.available_slots} slots remaining`);

    // Refresh browse list
    refreshReviews();

  } catch (error) {
    console.error('Failed to claim:', error.message);
  }
}
```

---

## Files Modified

### Created
1. `backend/alembic/versions/g69145efb_add_multi_review_support.py` - Migration
2. `MULTI_REVIEW_IMPLEMENTATION_SUMMARY.md` - Full documentation
3. `MULTI_REVIEW_QUICK_START.md` - This file

### Modified
1. `backend/app/models/review_request.py` - Added fields and properties
2. `backend/app/schemas/review.py` - Updated schemas
3. `backend/app/schemas/browse.py` - Added claim schemas
4. `backend/app/crud/review.py` - Added claim/unclaim operations
5. `backend/app/crud/browse.py` - Updated filters
6. `backend/app/api/v1/browse.py` - Added claim endpoints

---

## Troubleshooting

### Migration Fails

```bash
# Check current revision
alembic current

# Check migration history
alembic history

# If needed, stamp to current version
alembic stamp head
```

### Browse Not Filtering

Check that index was created:

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'review_requests'
AND indexname = 'idx_status_reviews_claimed';
```

### Claims Not Working

1. Check authentication (JWT cookie present)
2. Check logs for validation errors
3. Verify database constraints exist
4. Test with different users (cannot claim own review)

### Race Condition Issues

1. Verify `with_for_update()` is used in query
2. Check database supports row-level locking
3. Monitor for deadlocks in logs
4. Ensure proper transaction handling

---

## Next Steps

### Immediate
1. Run migration on development database
2. Test claim/unclaim operations
3. Update frontend to show slot information
4. Add UI for claiming slots

### Future Enhancements
1. Create `review_claims` table for individual tracking
2. Add claim expiration system
3. Implement notifications for claims
4. Add reviewer selection/approval
5. Dynamic pricing per slot

---

## Support

See `MULTI_REVIEW_IMPLEMENTATION_SUMMARY.md` for:
- Detailed architecture documentation
- Complete testing recommendations
- Deployment checklist
- Future enhancement roadmap
- Database schema reference

---

## Summary

The multi-review system is fully implemented and ready for testing. Key capabilities:

- Users specify how many reviews they want (1-10)
- Browse shows availability and claim progress
- Reviewers claim available slots via API
- Race condition protection prevents over-claiming
- Automatic filtering of fully claimed reviews
- Status management tracks claim state

Run the migration, test the endpoints, and you're ready to go!
