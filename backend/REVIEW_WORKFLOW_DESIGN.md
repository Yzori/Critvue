# Review Acceptance/Rejection Workflow Design

**Version:** 1.0
**Date:** 2025-11-12
**Status:** Design Specification

---

## Executive Summary

This document specifies the complete review lifecycle system for Critvue, addressing:
1. Review slot claiming and submission workflow
2. Acceptance/rejection mechanisms
3. Free vs Paid review policies
4. Payment timing and escrow
5. Dispute resolution
6. Database schema design

### Key Decisions

- **Free reviews:** 1-3 reviews allowed (prevents abuse, enables multiple perspectives)
- **Expert reviews:** 1-10 reviews allowed
- **Auto-accept period:** 7 days (protects reviewers from indefinite limbo)
- **Rejection allowed:** Yes, with valid reasons and refund protection
- **Payment timing:** On acceptance or auto-accept (escrow model)
- **Claim timeout:** 72 hours to submit review

---

## 1. Review Lifecycle States

### 1.1 Review Slot State Machine

```
ReviewSlot states:
┌─────────────┐
│  AVAILABLE  │ ← Initial state when request is published
└──────┬──────┘
       │ claim_slot()
       ▼
┌─────────────┐
│   CLAIMED   │ ← Reviewer is working on it (72h deadline)
└──────┬──────┘
       │ submit_review() OR timeout
       ├──────────────────┬─────────────────┐
       ▼                  ▼                 ▼
┌─────────────┐    ┌─────────────┐   ┌─────────────┐
│  SUBMITTED  │    │  ABANDONED  │   │  AVAILABLE  │
└──────┬──────┘    └─────────────┘   └─────────────┘
       │ accept() OR reject() OR auto_accept (7 days)
       ├──────────────────┬─────────────────┐
       ▼                  ▼                 ▼
┌─────────────┐    ┌─────────────┐   ┌─────────────┐
│  ACCEPTED   │    │  REJECTED   │   │  ACCEPTED   │
│             │    │ (refund)    │   │ (auto)      │
└─────────────┘    └──────┬──────┘   └─────────────┘
                          │ dispute_review()
                          ▼
                   ┌─────────────┐
                   │  DISPUTED   │
                   │ (admin)     │
                   └─────────────┘
```

### 1.2 State Definitions

| State | Description | Next States | Timeout |
|-------|-------------|-------------|---------|
| `AVAILABLE` | Slot not yet claimed | CLAIMED | N/A |
| `CLAIMED` | Reviewer claimed, working on it | SUBMITTED, ABANDONED, AVAILABLE | 72h |
| `SUBMITTED` | Review submitted, awaiting action | ACCEPTED, REJECTED, DISPUTED | 7 days (auto-accept) |
| `ACCEPTED` | Requester accepted the review | N/A | N/A |
| `REJECTED` | Requester rejected (refund issued) | DISPUTED | N/A |
| `ABANDONED` | Reviewer abandoned/timed out | N/A | N/A |
| `DISPUTED` | In dispute resolution | ACCEPTED, REJECTED | Admin decision |

---

## 2. Database Schema

### 2.1 New Table: `review_slots`

Tracks individual review slots within a review request.

```sql
CREATE TABLE review_slots (
    -- Primary key
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Foreign keys
    review_request_id INTEGER NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- State management
    status VARCHAR(10) NOT NULL DEFAULT 'AVAILABLE',
    -- Status enum: AVAILABLE, CLAIMED, SUBMITTED, ACCEPTED, REJECTED, ABANDONED, DISPUTED

    -- Timestamps for lifecycle tracking
    claimed_at TIMESTAMP,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,  -- When requester accepted/rejected
    claim_deadline TIMESTAMP,  -- Calculated as claimed_at + 72 hours
    auto_accept_at TIMESTAMP,  -- Calculated as submitted_at + 7 days

    -- Review content (denormalized for simplicity)
    -- Alternative: Could be separate 'reviews' table for cleaner separation
    review_text TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_attachments JSON,  -- Array of file URLs/paths

    -- Acceptance/Rejection metadata
    acceptance_type VARCHAR(10),  -- 'manual' or 'auto' for accepted reviews
    rejection_reason VARCHAR(50),  -- Enum: low_quality, off_topic, spam, abusive, other
    rejection_notes TEXT,  -- Optional explanation from requester

    -- Dispute handling
    is_disputed BOOLEAN DEFAULT FALSE NOT NULL,
    dispute_reason TEXT,
    dispute_resolved_at TIMESTAMP,
    dispute_resolution VARCHAR(50),  -- admin_accepted, admin_rejected
    dispute_notes TEXT,  -- Admin notes

    -- Payment tracking (for expert reviews)
    payment_amount DECIMAL(10, 2),  -- Amount reviewer will receive
    payment_status VARCHAR(20),  -- pending, escrowed, released, refunded
    payment_released_at TIMESTAMP,
    transaction_id VARCHAR(100),  -- External payment processor ID

    -- Quality metrics
    requester_helpful_rating INTEGER CHECK (requester_helpful_rating >= 1 AND requester_helpful_rating <= 5),

    -- Audit trail
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_review_request (review_request_id),
    INDEX idx_reviewer (reviewer_id),
    INDEX idx_status (status),
    INDEX idx_status_deadline (status, claim_deadline),  -- For timeout processing
    INDEX idx_status_auto_accept (status, auto_accept_at),  -- For auto-accept processing
    INDEX idx_payment_status (payment_status)
);
```

### 2.2 Modified Table: `review_requests`

Keep existing structure, but clarify:
- `reviews_requested`: Total slots to create (1-10)
- `reviews_claimed`: Count of slots NOT in AVAILABLE state
- `reviews_completed`: Count of slots in ACCEPTED state

```sql
ALTER TABLE review_requests ADD COLUMN reviews_completed INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_reviews_completed ON review_requests(reviews_completed);
```

### 2.3 New Table: `review_payments` (Optional - for audit trail)

Separate payment tracking for better financial auditing.

```sql
CREATE TABLE review_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_slot_id INTEGER NOT NULL REFERENCES review_slots(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,  -- pending, escrowed, released, refunded
    payment_method VARCHAR(50),  -- stripe, paypal, etc.
    transaction_id VARCHAR(100),

    -- Escrow timing
    escrowed_at TIMESTAMP,
    released_at TIMESTAMP,
    refunded_at TIMESTAMP,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_reviewer (reviewer_id),
    INDEX idx_requester (requester_id),
    INDEX idx_status (status),
    INDEX idx_slot (review_slot_id)
);
```

---

## 3. State Transition Rules

### 3.1 Valid Transitions

| From State | To State | Trigger | Conditions | Side Effects |
|------------|----------|---------|------------|--------------|
| AVAILABLE | CLAIMED | `claim_slot()` | - Reviewer not owner<br>- Slots available<br>- Review PENDING/IN_REVIEW | - Set reviewer_id<br>- Set claimed_at<br>- Calculate claim_deadline<br>- Increment reviews_claimed |
| CLAIMED | SUBMITTED | `submit_review()` | - Caller is reviewer<br>- Within deadline<br>- Valid review content | - Set submitted_at<br>- Calculate auto_accept_at<br>- Change request status if needed |
| CLAIMED | ABANDONED | Timeout (72h) | - claim_deadline passed<br>- No submission | - Clear reviewer_id<br>- Clear claimed_at<br>- Decrement reviews_claimed |
| CLAIMED | AVAILABLE | `unclaim_slot()` | - Caller is reviewer<br>- Not yet submitted | - Clear reviewer_id<br>- Clear claimed_at<br>- Decrement reviews_claimed |
| SUBMITTED | ACCEPTED | `accept_review()` | - Caller is requester<br>- Within 7 days | - Set reviewed_at<br>- Set acceptance_type='manual'<br>- Release payment (expert)<br>- Increment reviews_completed |
| SUBMITTED | ACCEPTED | Auto-accept | - 7 days since submitted_at | - Set reviewed_at<br>- Set acceptance_type='auto'<br>- Release payment (expert)<br>- Increment reviews_completed |
| SUBMITTED | REJECTED | `reject_review()` | - Caller is requester<br>- Valid rejection reason<br>- Within 7 days | - Set reviewed_at<br>- Refund payment (expert)<br>- Slot stays rejected |
| REJECTED | DISPUTED | `dispute_review()` | - Caller is reviewer<br>- Within 7 days of rejection | - Set is_disputed=true<br>- Admin review required |
| DISPUTED | ACCEPTED | Admin decision | - Admin intervention | - Release payment<br>- Increment reviews_completed |
| DISPUTED | REJECTED | Admin decision | - Admin intervention | - Confirm refund |

### 3.2 Invalid Transitions

- ACCEPTED → anything (final state)
- ABANDONED → anything (final state, except admin override)
- AVAILABLE → SUBMITTED (must claim first)
- Cannot reject after 7-day window (auto-accepted)

---

## 4. Business Rules & Policies

### 4.1 Free vs Paid Reviews

| Aspect | Free Reviews | Expert Reviews |
|--------|-------------|----------------|
| **Reviews Allowed** | 1-3 | 1-10 |
| **Rationale** | Prevents abuse, reasonable feedback | Professional service, scales up |
| **Payment** | None | Escrow → Release on accept |
| **Rejection Impact** | No refund needed | Full refund to requester |
| **Quality Threshold** | Minimum 50 chars | Minimum 200 chars |
| **Deadline** | No payment pressure | Payment incentivizes speed |
| **Auto-accept** | 7 days | 7 days |
| **Reviewer Incentive** | Reputation points | Money + reputation |

### 4.2 Acceptance/Rejection Policy

**Rejection is allowed** but with protections:

1. **Valid Rejection Reasons:**
   - `low_quality`: Review is too short, unhelpful, or generic
   - `off_topic`: Review doesn't address the request
   - `spam`: Automated or copy-paste content
   - `abusive`: Inappropriate language or harassment
   - `other`: Must provide detailed explanation

2. **Rejection Limits (Anti-Abuse):**
   - Cannot reject more than 50% of received reviews (lifetime)
   - If rejection rate > 50%, flagged for admin review
   - Prevents requesters from farming free reviews then rejecting all

3. **Refund Logic:**
   - **Expert reviews:** Full refund to requester, reviewer gets nothing
   - **Free reviews:** No payment involved, but impacts reviewer reputation

4. **Slot Reopening:**
   - Rejected slots do NOT reopen automatically
   - Requester must manually request additional reviews if needed
   - Prevents exploitation of rejection system

### 4.3 Timeout & Abandonment

**Claim Deadline: 72 hours**

- Reviewer has 72 hours from claim to submit review
- After 72h, slot automatically ABANDONED
- Abandoned slots revert to AVAILABLE
- Reviewer reputation hit for abandonment

**Auto-Accept: 7 days**

- Submitted reviews auto-accept after 7 days
- Protects reviewers from indefinite limbo
- Ensures payment is released (expert reviews)
- Requester loses rejection window after 7 days

### 4.4 Dispute Resolution

**Reviewer can dispute rejection within 7 days:**

1. Reviewer submits dispute with explanation
2. Admin reviews both review content and rejection reason
3. Admin makes final decision:
   - **Uphold rejection:** Reviewer loses, refund stays
   - **Overturn rejection:** Review accepted, payment released, requester warned
4. Repeated invalid rejections → requester account flagged/suspended

**Admin Dashboard Features:**
- View review text vs rejection reason
- See requester's rejection history
- See reviewer's quality metrics
- One-click accept/reject with notes

### 4.5 Quality Thresholds

**Minimum Requirements (Auto-Validation):**

| Review Type | Min Length | Min Rating Required | Attachments |
|-------------|-----------|---------------------|-------------|
| Free | 50 chars | No (optional) | Optional |
| Expert | 200 chars | Yes (1-5 stars) | Recommended |

**Quality Indicators (Reputation Impact):**
- Length > 500 chars: +bonus
- Requester marks as "helpful": +bonus
- Accepted without rejection: +bonus
- Auto-accepted (no action): neutral
- Rejected: -penalty
- Abandoned: -penalty
- Disputed and lost: -big penalty

---

## 5. API Endpoints

### 5.1 Review Slot Management

```python
# Claim a review slot
POST /api/v1/review-requests/{request_id}/slots/claim
Response: {
    "slot_id": 123,
    "review_request_id": 456,
    "reviewer_id": 789,
    "status": "CLAIMED",
    "claimed_at": "2025-11-12T10:00:00Z",
    "claim_deadline": "2025-11-15T10:00:00Z"  # 72h later
}

# Unclaim a review slot (before submission)
POST /api/v1/review-slots/{slot_id}/unclaim
Response: {
    "slot_id": 123,
    "status": "AVAILABLE",
    "message": "Slot unclaimed successfully"
}

# Submit review for a claimed slot
POST /api/v1/review-slots/{slot_id}/submit
Body: {
    "review_text": "Detailed feedback...",
    "rating": 4,
    "attachments": [
        {"url": "https://...", "type": "image"}
    ]
}
Response: {
    "slot_id": 123,
    "status": "SUBMITTED",
    "submitted_at": "2025-11-12T12:00:00Z",
    "auto_accept_at": "2025-11-19T12:00:00Z"  # 7 days later
}

# Get slots for a review request (public)
GET /api/v1/review-requests/{request_id}/slots
Response: {
    "total_slots": 3,
    "available": 1,
    "claimed": 1,
    "submitted": 0,
    "accepted": 1,
    "slots": [
        {
            "id": 123,
            "status": "ACCEPTED",
            "reviewer": {"id": 789, "name": "Jane Doe"},
            "submitted_at": "2025-11-10T10:00:00Z",
            "review_preview": "Great design! I love..."  # First 100 chars
        }
    ]
}
```

### 5.2 Review Acceptance/Rejection

```python
# Accept a submitted review
POST /api/v1/review-slots/{slot_id}/accept
Body: {
    "helpful_rating": 5  # Optional: How helpful was this review?
}
Response: {
    "slot_id": 123,
    "status": "ACCEPTED",
    "acceptance_type": "manual",
    "reviewed_at": "2025-11-12T14:00:00Z",
    "payment_released": true  # For expert reviews
}

# Reject a submitted review
POST /api/v1/review-slots/{slot_id}/reject
Body: {
    "rejection_reason": "low_quality",
    "rejection_notes": "Review was only 2 sentences and didn't address my questions."
}
Response: {
    "slot_id": 123,
    "status": "REJECTED",
    "reviewed_at": "2025-11-12T14:00:00Z",
    "refund_issued": true,  # For expert reviews
    "dispute_deadline": "2025-11-19T14:00:00Z"  # 7 days for reviewer to dispute
}

# Dispute a rejection (reviewer only)
POST /api/v1/review-slots/{slot_id}/dispute
Body: {
    "dispute_reason": "My review was thorough and addressed all feedback areas. The rejection reason is unfair."
}
Response: {
    "slot_id": 123,
    "status": "DISPUTED",
    "message": "Dispute submitted for admin review. You will be notified of the decision."
}
```

### 5.3 Reviewer Dashboard

```python
# Get my claimed/submitted reviews
GET /api/v1/reviewers/me/slots
Query params:
  - status: CLAIMED | SUBMITTED | ACCEPTED | REJECTED
  - limit: 10
  - offset: 0
Response: {
    "items": [
        {
            "slot_id": 123,
            "review_request": {
                "id": 456,
                "title": "Design feedback needed",
                "content_type": "design"
            },
            "status": "CLAIMED",
            "claimed_at": "2025-11-12T10:00:00Z",
            "claim_deadline": "2025-11-15T10:00:00Z",
            "time_remaining": "47h 32m"
        }
    ],
    "total": 5,
    "has_more": false
}

# Get my earnings (expert reviewers)
GET /api/v1/reviewers/me/earnings
Response: {
    "total_earned": 1250.00,
    "pending_payment": 150.00,  # Submitted, not yet accepted
    "available_for_withdrawal": 1100.00,
    "reviews_completed": 25,
    "average_rating": 4.6,
    "acceptance_rate": 0.96  # 96% of reviews accepted
}
```

### 5.4 Admin Endpoints

```python
# Get disputed reviews
GET /api/v1/admin/disputes
Response: {
    "items": [
        {
            "slot_id": 123,
            "review_text": "...",
            "rejection_reason": "low_quality",
            "rejection_notes": "...",
            "dispute_reason": "...",
            "reviewer": {...},
            "requester": {...}
        }
    ]
}

# Resolve dispute
POST /api/v1/admin/disputes/{slot_id}/resolve
Body: {
    "resolution": "admin_accepted" | "admin_rejected",
    "notes": "Admin explanation"
}
```

---

## 6. Payment & Escrow Model

### 6.1 Payment Flow for Expert Reviews

```
1. Requester publishes request
   → Funds HELD (not charged yet)
   → Total hold: reviews_requested × price_per_review

2. Reviewer claims slot
   → No payment action
   → Slot reserved

3. Reviewer submits review
   → Funds ESCROWED (charged from requester, held in escrow)
   → Amount: price_per_review
   → Status: payment_status = 'escrowed'

4a. Requester accepts (or auto-accept after 7 days)
   → Funds RELEASED to reviewer
   → Status: payment_status = 'released'
   → Reviewer can withdraw

4b. Requester rejects
   → Funds REFUNDED to requester
   → Status: payment_status = 'refunded'
   → Reviewer gets nothing

4c. Dispute resolved in reviewer's favor
   → Funds RELEASED to reviewer
   → Requester warned for invalid rejection
```

### 6.2 Payment Security

- **Stripe Connect** recommended for reviewer payouts
- **Escrow period:** Funds held until acceptance/rejection decision
- **Refund window:** 7 days (matching review window)
- **Dispute holds:** Funds remain escrowed during dispute
- **Platform fee:** 15% on expert reviews (deducted from reviewer payout)

---

## 7. Edge Cases & Abuse Prevention

### 7.1 Requester Abuse Scenarios

**Problem:** Requester rejects all reviews to get free feedback
**Solution:**
- 50% rejection rate limit
- Account flagged after excessive rejections
- Required to provide detailed rejection notes
- Admin reviews flagged accounts

**Problem:** Requester publishes, gets reviews, then cancels request
**Solution:**
- Cannot cancel after any slot is CLAIMED
- Must accept/reject submitted reviews first
- Cancellation refunds unused slots only

**Problem:** Requester requests 10 reviews, only wants 1 good one
**Solution:**
- Must pay for all requested slots that get submitted
- Cannot selectively reject without valid reason
- Auto-accept ensures reviewers get paid

### 7.2 Reviewer Abuse Scenarios

**Problem:** Reviewer claims slot, never submits (squatting)
**Solution:**
- 72-hour claim deadline
- Auto-abandonment after timeout
- Reputation penalty for abandonment
- Limit on concurrent claims (e.g., 5 max)

**Problem:** Reviewer submits low-effort spam
**Solution:**
- Minimum length requirements
- Rejection allowed with valid reason
- Reputation system tracks acceptance rate
- Low-reputation reviewers deprioritized

**Problem:** Reviewer disputes all rejections
**Solution:**
- Dispute history tracked
- Frivolous disputes penalize reputation
- Admin can ban repeat offenders

### 7.3 System Edge Cases

**Case:** Review submitted at 6 days 23 hours, requester hasn't checked
**Solution:**
- Auto-accept at exactly 7 days
- Email notifications at submission, 3 days, 6 days
- Clear countdown timer in UI

**Case:** Reviewer and requester both delete accounts during dispute
**Solution:**
- Soft deletes preserve data
- Admin can still resolve dispute
- Payment decisions independent of account status

**Case:** Payment processor fails during refund
**Solution:**
- Retry logic with exponential backoff
- Manual admin intervention available
- Payment status tracking separate from slot status

---

## 8. Notification Strategy

### 8.1 Email Notifications

| Event | Recipient | Timing | Purpose |
|-------|-----------|--------|---------|
| Slot claimed | Requester | Immediate | "Someone is reviewing your work!" |
| Review submitted | Requester | Immediate | "New review ready for your approval" |
| Claim deadline approaching | Reviewer | 48h before | "You have 48 hours to submit" |
| Auto-accept in 24h | Requester | 6 days after submit | "Accept or reject in 24h" |
| Review accepted | Reviewer | Immediate | "Your review was accepted!" (+ payment) |
| Review rejected | Reviewer | Immediate | "Your review was rejected" (+ dispute option) |
| Review auto-accepted | Both | Immediate | "Review automatically accepted" |
| Slot abandoned | Reviewer | Immediate | "Your claim expired" |
| Dispute submitted | Admin | Immediate | "New dispute requires review" |
| Dispute resolved | Both | Immediate | "Dispute decision: ..." |

### 8.2 In-App Notifications

- Real-time notification center
- Badge counts for pending actions
- Dashboard widgets showing:
  - "X reviews awaiting your approval"
  - "X slots closing in 24h"
  - "Your review was accepted! +$25"

---

## 9. Metrics & Analytics

### 9.1 Platform Health Metrics

Track these to monitor system health:

```python
# Review completion funnel
slots_created = 1000
slots_claimed = 850      # 85% claim rate
slots_submitted = 780    # 91.7% submission rate (of claimed)
slots_accepted = 720     # 92.3% acceptance rate (of submitted)
slots_rejected = 60      # 7.7% rejection rate
slots_disputed = 10      # 16.7% dispute rate (of rejected)

# Time metrics
avg_time_to_claim = 4.2 hours
avg_time_to_submit = 18.5 hours  # After claim
avg_time_to_review = 1.2 days    # After submit
auto_accept_rate = 15%           # Requesters who don't review in time

# Quality metrics
avg_review_length = 450 chars
avg_review_rating = 4.2 stars
avg_helpful_rating = 4.5 stars   # From requesters
```

### 9.2 User Reputation Scores

**Reviewer Reputation:**
```python
acceptance_rate = accepted / submitted
avg_helpful_rating = average of requester ratings
abandonment_rate = abandoned / claimed
avg_review_length = characters per review
response_time = avg hours from claim to submit

reputation_score = (
    acceptance_rate * 40 +
    (avg_helpful_rating / 5) * 30 +
    (1 - abandonment_rate) * 20 +
    (min(avg_review_length, 1000) / 1000) * 10
) * 100  # 0-100 scale
```

**Requester Reputation:**
```python
rejection_rate = rejected / submitted_to_me
avg_time_to_review = hours from submit to accept/reject
dispute_loss_rate = disputes_lost / disputes_total

reputation_score = (
    (1 - rejection_rate) * 50 +
    (1 / (1 + avg_time_to_review / 24)) * 30 +  # Faster = better
    (1 - dispute_loss_rate) * 20
) * 100  # 0-100 scale
```

---

## 10. Migration Path

### 10.1 Database Migration Steps

```python
# Step 1: Create review_slots table
# Step 2: Migrate existing data (if any claimed reviews exist)
# Step 3: Add reviews_completed column to review_requests
# Step 4: Update indexes
# Step 5: Deploy new API endpoints
# Step 6: Update frontend to use slot-based system
```

### 10.2 Backward Compatibility

**Current System:**
- `review_requests.reviews_claimed` tracks simple counter

**New System:**
- Create slots automatically when request published
- `reviews_claimed` synced from slot statuses
- Existing claims (if any) migrated to CLAIMED slots

---

## 11. Implementation Checklist

### Phase 1: Database & Models
- [ ] Create `review_slots` table migration
- [ ] Create `ReviewSlot` SQLAlchemy model
- [ ] Create `ReviewSlotStatus` enum
- [ ] Add Pydantic schemas for slots
- [ ] Update `ReviewRequest` model with `reviews_completed`

### Phase 2: Core Business Logic
- [ ] Implement state machine in `crud/review_slot.py`
- [ ] Add slot claiming logic
- [ ] Add review submission logic
- [ ] Add acceptance/rejection logic
- [ ] Add dispute logic
- [ ] Add timeout/auto-accept background jobs

### Phase 3: API Endpoints
- [ ] POST `/review-requests/{id}/slots/claim`
- [ ] POST `/review-slots/{id}/unclaim`
- [ ] POST `/review-slots/{id}/submit`
- [ ] POST `/review-slots/{id}/accept`
- [ ] POST `/review-slots/{id}/reject`
- [ ] POST `/review-slots/{id}/dispute`
- [ ] GET `/review-requests/{id}/slots`
- [ ] GET `/reviewers/me/slots`

### Phase 4: Payment Integration
- [ ] Integrate Stripe Connect for reviewer payouts
- [ ] Implement escrow logic
- [ ] Implement refund logic
- [ ] Add payment status tracking
- [ ] Add webhook handlers for payment events

### Phase 5: Background Jobs
- [ ] Timeout job: Find CLAIMED slots past deadline → ABANDONED
- [ ] Auto-accept job: Find SUBMITTED slots past 7 days → ACCEPTED
- [ ] Notification job: Send deadline reminders
- [ ] Metrics job: Calculate reputation scores

### Phase 6: Admin Tools
- [ ] Dispute resolution dashboard
- [ ] User reputation dashboard
- [ ] Payment audit trail
- [ ] Manual intervention tools

### Phase 7: Frontend Integration
- [ ] Review slot claiming UI
- [ ] Review submission form
- [ ] Accept/reject buttons for requesters
- [ ] Dispute submission form
- [ ] Reviewer dashboard with deadlines
- [ ] Countdown timers and notifications

### Phase 8: Testing
- [ ] Unit tests for state machine
- [ ] Integration tests for payment flow
- [ ] E2E tests for happy path
- [ ] E2E tests for rejection/dispute flow
- [ ] Load tests for concurrent claims
- [ ] Test timeout mechanisms

---

## 12. Open Questions for Discussion

1. **Platform fee structure:**
   - Should free reviews have any platform fee?
   - Should fee be per-review or per-request?
   - Progressive fee based on review count?

2. **Reviewer withdrawal minimums:**
   - Minimum $50 to withdraw earnings?
   - Weekly/monthly payout schedules?

3. **Multi-slot claiming:**
   - Should one reviewer be allowed to claim multiple slots on same request?
   - Prevents monopolization but reduces diversity

4. **Review editing:**
   - Can reviewer edit review after submission?
   - Only before acceptance? Or never?

5. **Requester feedback on rejections:**
   - Should requester be required to provide improvement feedback?
   - Or just rejection reason is enough?

6. **Partial acceptance:**
   - Accept review but with lower payment (50%)?
   - Too complex? Just accept or reject?

---

## 13. Success Metrics

Track these KPIs post-launch:

**Engagement:**
- Claim rate: > 80%
- Submission rate (of claimed): > 85%
- Acceptance rate (of submitted): > 90%

**Quality:**
- Average review length: > 400 chars
- Average helpful rating: > 4.0 / 5.0
- Dispute rate: < 5%

**Timeliness:**
- Average time to claim: < 6 hours
- Average time to submit: < 24 hours
- Average time to review: < 48 hours
- Auto-accept rate: < 20%

**Fairness:**
- Requester rejection rate: < 15%
- Reviewer abandonment rate: < 10%
- Admin dispute overturn rate: < 30% (means rejection reasons are mostly valid)

---

## Conclusion

This design provides a comprehensive, fair, and abuse-resistant review workflow that:

1. Protects reviewers with auto-accept and dispute mechanisms
2. Protects requesters with rejection rights and refunds
3. Prevents abuse through timeouts, limits, and reputation systems
4. Scales from free to paid reviews seamlessly
5. Provides clear payment timing and escrow
6. Enables platform growth through quality incentives

**Next Step:** Review this specification, address open questions, then begin Phase 1 implementation.
