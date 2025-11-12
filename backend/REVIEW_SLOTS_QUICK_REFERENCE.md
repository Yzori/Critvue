# Review Slots System - Quick Reference Guide

## Quick Start

### Import Required Modules
```python
from app.crud import review_slot as crud_review_slot
from app.models.review_slot import ReviewSlotStatus, RejectionReason
```

---

## Common Operations

### 1. Create Slots (Automatic)
Slots are automatically created when a review request is created with status `pending`:

```python
# In ReviewCRUD.create_review_request()
# Automatically creates slots based on reviews_requested
review = await ReviewCRUD.create_review_request(db, user_id, data)
# Slots are created automatically!
```

### 2. Get Available Slots
```python
slots, total = await crud_review_slot.get_available_slots(
    db,
    skip=0,
    limit=20,
    content_type="design"
)
```

### 3. Claim a Slot
```python
claimed_slot = await crud_review_slot.claim_review_slot(
    db,
    slot_id=1,
    reviewer_id=2,
    claim_hours=72  # 3 days to submit
)
```

### 4. Submit Review
```python
submitted_slot = await crud_review_slot.submit_review(
    db,
    slot_id=1,
    reviewer_id=2,
    review_text="Detailed review here...",
    rating=4,
    attachments=[{"type": "image", "url": "..."}]
)
```

### 5. Accept Review
```python
accepted_slot = await crud_review_slot.accept_review(
    db,
    slot_id=1,
    requester_id=1,
    helpful_rating=5
)
```

### 6. Reject Review
```python
rejected_slot = await crud_review_slot.reject_review(
    db,
    slot_id=1,
    requester_id=1,
    reason=RejectionReason.LOW_QUALITY,
    notes="Too generic, needs more detail"
)
```

### 7. Create Dispute
```python
disputed_slot = await crud_review_slot.create_dispute(
    db,
    slot_id=1,
    reviewer_id=2,
    dispute_reason="I provided detailed feedback on all requested areas"
)
```

---

## API Endpoints

### Reviewer Actions
```bash
# Claim slot
POST /api/v1/review-slots/{slot_id}/claim

# Submit review
POST /api/v1/review-slots/{slot_id}/submit
{
  "review_text": "...",
  "rating": 5
}

# Abandon slot
POST /api/v1/review-slots/{slot_id}/abandon

# Create dispute
POST /api/v1/review-slots/{slot_id}/dispute
{
  "dispute_reason": "..."
}

# Get my slots
GET /api/v1/review-slots/my-slots?status=claimed&skip=0&limit=20
```

### Requester Actions
```bash
# Accept review
POST /api/v1/review-slots/{slot_id}/accept
{
  "helpful_rating": 5
}

# Reject review
POST /api/v1/review-slots/{slot_id}/reject
{
  "rejection_reason": "low_quality",
  "rejection_notes": "..."
}

# Get slots for my request
GET /api/v1/review-slots/request/{request_id}/slots
```

### Admin Actions
```bash
# Resolve dispute
POST /api/v1/review-slots/{slot_id}/resolve-dispute
{
  "resolution": "admin_accepted",
  "admin_notes": "..."
}

# Get all disputed slots
GET /api/v1/review-slots/admin/disputed?skip=0&limit=20
```

---

## Status States & Transitions

### Status Flow
```
available → claimed → submitted → accepted (final)
                ↓                      ↓
            abandoned              rejected → disputed
                                                ↓
                                           resolved
```

### Check Status Properties
```python
slot = await crud_review_slot.get_review_slot(db, slot_id)

# Check if actions are allowed
if slot.is_claimable:
    # Can claim
if slot.is_submittable:
    # Can submit review
if slot.is_reviewable:
    # Requester can accept/reject
if slot.is_disputable:
    # Reviewer can dispute rejection
```

---

## Important Validations

### Review Text
- **Minimum:** 50 characters
- **Maximum:** 10,000 characters

### Rating
- **Range:** 1-5 (inclusive)
- **Required:** Yes

### Rejection Notes
- **Minimum:** 10 characters (required if reason is "other")
- **Maximum:** 2,000 characters

### Dispute Reason
- **Minimum:** 20 characters
- **Maximum:** 2,000 characters

---

## Deadlines & Timeouts

### Claim Deadline
- **Duration:** 72 hours after claim
- **Action:** Slot automatically abandoned if expired
- **Check:** `slot.claim_deadline`

### Auto-Accept Deadline
- **Duration:** 7 days after submission
- **Action:** Review automatically accepted
- **Check:** `slot.auto_accept_at`

### Dispute Window
- **Duration:** 7 days after rejection
- **Action:** Cannot dispute after window closes
- **Check:** `slot.is_disputable`

---

## Rejection Reasons

```python
from app.models.review_slot import RejectionReason

RejectionReason.LOW_QUALITY  # Too short, unhelpful, generic
RejectionReason.OFF_TOPIC    # Doesn't address the request
RejectionReason.SPAM         # Automated or copy-paste
RejectionReason.ABUSIVE      # Inappropriate language
RejectionReason.OTHER        # Custom reason (requires notes)
```

---

## Error Handling

### Common Exceptions
```python
try:
    slot = await crud_review_slot.claim_review_slot(db, slot_id, reviewer_id)
except ValueError as e:
    # Validation error (slot not claimable, invalid data, etc.)
    return {"error": str(e)}, 400
except PermissionError as e:
    # Authorization error (not the owner/reviewer)
    return {"error": str(e)}, 403
except RuntimeError as e:
    # Not found error
    return {"error": str(e)}, 404
except Exception as e:
    # Unexpected error
    logger.error(f"Error: {e}")
    return {"error": "Internal server error"}, 500
```

---

## Database Queries

### Get Slots by Status
```python
from sqlalchemy import select
from app.models.review_slot import ReviewSlot, ReviewSlotStatus

# Get all available slots
query = select(ReviewSlot).where(
    ReviewSlot.status == ReviewSlotStatus.AVAILABLE.value
)
result = await db.execute(query)
slots = result.scalars().all()
```

### Get Reviewer's Active Slots
```python
slots, total = await crud_review_slot.get_user_review_slots(
    db,
    user_id=reviewer_id,
    status=ReviewSlotStatus.CLAIMED,
    skip=0,
    limit=10
)
```

### Get Slots for Request
```python
slots = await crud_review_slot.get_slots_for_request(
    db,
    review_request_id=5,
    status=ReviewSlotStatus.SUBMITTED
)
```

---

## Background Jobs

### Process Expired Claims
```python
# Run every 15 minutes
abandoned_count = await crud_review_slot.process_expired_claims(db)
print(f"Abandoned {abandoned_count} expired slots")
```

### Process Auto-Accepts
```python
# Run every hour
accepted_count = await crud_review_slot.process_auto_accepts(db)
print(f"Auto-accepted {accepted_count} reviews")
```

---

## Testing Checklist

### Unit Tests
- [ ] Slot creation
- [ ] Claim validation
- [ ] Submit validation
- [ ] State transitions
- [ ] Deadline calculations

### Integration Tests
- [ ] Full workflow (claim → submit → accept)
- [ ] Rejection and dispute flow
- [ ] Concurrent claim attempts (race conditions)
- [ ] Background job execution

### API Tests
- [ ] Authentication required
- [ ] Authorization checks
- [ ] Rate limiting
- [ ] Error responses
- [ ] Pagination

---

## Performance Tips

### Use Row Locking for Claims
```python
# Always use the lock version for claims
slot = await crud_review_slot.get_review_slot_with_lock(db, slot_id)
```

### Eager Load Relationships
```python
from sqlalchemy.orm import selectinload

query = select(ReviewSlot).options(
    selectinload(ReviewSlot.review_request),
    selectinload(ReviewSlot.reviewer)
)
```

### Use Indexes Effectively
- Filter by status: indexed
- Filter by reviewer: indexed
- Sort by created_at: indexed
- Composite filters: composite indexes available

---

## Security Checklist

- [ ] Authentication on all endpoints
- [ ] Verify ownership before accept/reject
- [ ] Verify reviewer before submit/dispute
- [ ] Rate limiting enabled
- [ ] Input validation on all fields
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize review text)

---

## Common Patterns

### Check Before Action
```python
# Always check status before attempting transitions
slot = await crud_review_slot.get_review_slot(db, slot_id)

if not slot.is_claimable:
    raise ValueError("Slot cannot be claimed")

# Proceed with action
```

### Update Counters
```python
# Counters are automatically updated in CRUD operations
# reviews_claimed incremented on claim
# reviews_claimed decremented on reject/abandon
# reviews_completed incremented on accept
```

### Transaction Safety
```python
# All CRUD operations use transactions
try:
    slot = await crud_review_slot.accept_review(db, slot_id, user_id)
    await db.commit()  # Automatically committed in CRUD
except Exception as e:
    await db.rollback()  # Automatically rolled back on error
    raise
```

---

## Debugging Tips

### Check Slot Status
```python
slot = await crud_review_slot.get_review_slot(db, slot_id)
print(f"Status: {slot.status}")
print(f"Claimable: {slot.is_claimable}")
print(f"Submittable: {slot.is_submittable}")
print(f"Deadline: {slot.claim_deadline}")
```

### Check Counters
```python
review = await db.get(ReviewRequest, request_id)
print(f"Requested: {review.reviews_requested}")
print(f"Claimed: {review.reviews_claimed}")
print(f"Completed: {review.reviews_completed}")
print(f"Available: {review.available_slots}")
```

### Enable SQL Logging
```python
# In database.py
engine = create_async_engine(DATABASE_URL, echo=True)  # Show all SQL
```

---

## Contact & Support

For questions or issues:
- Check logs: `/var/log/critvue/backend.log`
- Review this guide
- Check the full implementation summary: `REVIEW_SLOTS_IMPLEMENTATION_SUMMARY.md`

---

**Last Updated:** November 12, 2025
**Version:** 1.0.0
