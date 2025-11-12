# Review Workflow Implementation Summary

## Overview

This document summarizes the design decisions and implementation for Critvue's review acceptance/rejection workflow.

---

## Key Design Decisions

### 1. Free vs Paid Review Limits

**Decision:**
- **Free reviews:** 1-3 reviews allowed
- **Expert reviews:** 1-10 reviews allowed

**Rationale:**
- Free reviews limited to 3 to prevent abuse and spam
- Still allows multiple perspectives without overwhelming reviewers
- Expert reviews scale higher (10) as payment provides quality incentive
- Prevents farming free reviews at scale

**Implementation:**
- Validation in `ReviewRequestCreate` schema
- Business logic enforces limits based on `review_type`

---

### 2. Review Slot Architecture

**Decision:** Separate `review_slots` table instead of embedding in `review_requests`

**Rationale:**
- **Scalability:** Each slot has independent lifecycle (claimed, submitted, accepted)
- **State tracking:** Clean state machine per slot vs complex status in parent
- **Payment tracking:** Per-slot payment status for expert reviews
- **Concurrency:** Row-level locking prevents race conditions on individual slots
- **Audit trail:** Full history of each review from claim to acceptance

**Trade-offs:**
- Slightly more complex queries (join required)
- More database rows (N slots per request)
- BUT: Much cleaner business logic and better performance

---

### 3. State Machine Design

**States:**
```
AVAILABLE → CLAIMED → SUBMITTED → ACCEPTED (final)
                ↓         ↓
            ABANDONED  REJECTED → DISPUTED → ACCEPTED/REJECTED (admin)
```

**Auto-transitions:**
- **CLAIMED → ABANDONED:** After 72 hours without submission
- **SUBMITTED → ACCEPTED:** After 7 days without requester action

**Rationale:**
- 72h claim deadline prevents slot squatting
- 7-day auto-accept protects reviewers from indefinite payment limbo
- ABANDONED/ACCEPTED are final states (no further transitions)
- DISPUTED requires admin intervention (fairness)

---

### 4. Acceptance/Rejection Policy

**Decision:** Rejection is ALLOWED with protections

**Why allow rejection?**
- Quality control: Requesters should reject spam/low-quality reviews
- Fairness: Requesters paid (expert) or invested time (free)
- Platform quality: Incentivizes reviewers to provide value

**Anti-abuse protections:**
1. **Rejection reasons required:** Must select from enum + provide notes
2. **Rejection rate tracking:** Flagged if >50% lifetime rejection rate
3. **No slot reopening:** Rejected slots don't auto-reopen (prevents farming)
4. **Dispute mechanism:** Reviewers can challenge unfair rejections
5. **7-day window:** After 7 days, auto-accept prevents gaming

**Rejection reasons:**
- `low_quality`: Too short, unhelpful, generic
- `off_topic`: Doesn't address the request
- `spam`: Automated or copy-paste
- `abusive`: Inappropriate content
- `other`: Must provide detailed notes

---

### 5. Payment Timing & Escrow

**Decision:** Escrow model with release on acceptance

**Flow:**
```
1. Request published → Funds AUTHORIZED (not charged)
2. Reviewer claims → No payment action
3. Reviewer submits → Funds ESCROWED (charged, held)
4. Acceptance → Funds RELEASED to reviewer
   Rejection → Funds REFUNDED to requester
   Auto-accept (7d) → Funds RELEASED
```

**Rationale:**
- Protects requester: Only pay for accepted reviews
- Protects reviewer: Auto-accept ensures eventual payment
- Platform security: Escrow prevents fraud
- Clear timing: No ambiguity on when payment happens

**Platform fee:** 15% deducted from reviewer payout (industry standard)

---

### 6. Dispute Resolution

**Decision:** Reviewer can dispute within 7 days, admin decides

**Process:**
1. Requester rejects review with reason
2. Reviewer has 7 days to dispute
3. Dispute freezes payment status
4. Admin reviews both sides
5. Admin decision is final

**Admin options:**
- **Uphold rejection:** Reviewer loses, refund stands
- **Overturn rejection:** Review accepted, payment released, requester warned

**Tracking:**
- Requester rejection history
- Reviewer dispute win rate
- Admin notes for audit trail

**Abuse prevention:**
- Repeated invalid rejections → requester flagged/suspended
- Frivolous disputes → reviewer reputation penalty

---

### 7. Timeout Mechanisms

**Claim deadline: 72 hours**
- Reviewer has 72h from claim to submit
- Auto-ABANDONED after deadline
- Slot returns to AVAILABLE
- Reputation penalty for reviewer

**Auto-accept: 7 days**
- Requester has 7 days to accept/reject
- Auto-ACCEPTED after deadline
- Payment released (expert reviews)
- Ensures reviewers get paid

**Notification strategy:**
- Claim deadline approaching (48h warning)
- Auto-accept in 24h (6-day warning)
- Immediate emails for submit/accept/reject

---

## Database Schema

### New Table: `review_slots`

**Primary fields:**
- `id`: Primary key
- `review_request_id`: FK to review_requests
- `reviewer_id`: FK to users (nullable, SET NULL on delete)
- `status`: Enum (available, claimed, submitted, accepted, rejected, abandoned, disputed)

**Lifecycle timestamps:**
- `claimed_at`: When slot was claimed
- `submitted_at`: When review was submitted
- `reviewed_at`: When requester accepted/rejected
- `claim_deadline`: claimed_at + 72h
- `auto_accept_at`: submitted_at + 7 days

**Review content:**
- `review_text`: Full review (TEXT)
- `rating`: 1-5 stars (INTEGER)
- `review_attachments`: JSON array of file metadata

**Acceptance/Rejection:**
- `acceptance_type`: manual | auto
- `rejection_reason`: Enum (low_quality, off_topic, spam, abusive, other)
- `rejection_notes`: TEXT

**Dispute:**
- `is_disputed`: Boolean
- `dispute_reason`: TEXT
- `dispute_resolved_at`: TIMESTAMP
- `dispute_resolution`: admin_accepted | admin_rejected
- `dispute_notes`: Admin notes

**Payment:**
- `payment_amount`: DECIMAL(10,2)
- `payment_status`: pending | escrowed | released | refunded
- `payment_released_at`: TIMESTAMP
- `transaction_id`: External payment ID

**Quality:**
- `requester_helpful_rating`: 1-5 (how helpful was review?)

**Indexes:**
- `(status, claim_deadline)` - Timeout processing
- `(status, auto_accept_at)` - Auto-accept processing
- `(reviewer_id, status)` - Reviewer dashboard
- `(review_request_id, status)` - Request detail

### Modified Table: `review_requests`

**Added column:**
- `reviews_completed`: Count of ACCEPTED slots

**Why track separately from reviews_claimed?**
- `reviews_claimed`: Tracks active claims (CLAIMED + SUBMITTED + ACCEPTED)
- `reviews_completed`: Tracks only accepted reviews
- Enables "3/5 reviews completed" UI
- Simplifies completion logic

---

## API Endpoints (Designed, Not Yet Implemented)

### Slot Management
- `POST /review-requests/{id}/slots/claim` - Claim a slot
- `POST /review-slots/{id}/unclaim` - Give up claim
- `POST /review-slots/{id}/submit` - Submit review
- `GET /review-requests/{id}/slots` - Get all slots for request

### Acceptance/Rejection
- `POST /review-slots/{id}/accept` - Accept review
- `POST /review-slots/{id}/reject` - Reject review
- `POST /review-slots/{id}/dispute` - Dispute rejection

### Reviewer Dashboard
- `GET /reviewers/me/slots` - My claimed/submitted reviews
- `GET /reviewers/me/earnings` - Earnings summary (expert)

### Admin
- `GET /admin/disputes` - List disputed reviews
- `POST /admin/disputes/{id}/resolve` - Resolve dispute

---

## Business Rules Summary

### Free Reviews
- Limit: 1-3 reviews
- No payment
- Min review length: 50 chars
- Rating optional
- Rejection allowed (no refund needed)
- Auto-accept: 7 days

### Expert Reviews
- Limit: 1-10 reviews
- Payment: Escrow → Release on accept
- Min review length: 200 chars
- Rating required (1-5)
- Rejection: Full refund
- Auto-accept: 7 days (payment released)
- Platform fee: 15%

### Quality Thresholds
- Minimum review length: 50 chars (free), 200 chars (expert)
- Rating range: 1-5 stars
- Rejection requires valid reason + notes
- Dispute requires 20+ char explanation

### Anti-Abuse
- Rejection rate limit: 50% lifetime (flagged)
- Claim timeout: 72h (auto-abandon)
- Auto-accept: 7 days (protects reviewer)
- Dispute tracking: Win/loss rate per user
- Reputation system (to be implemented)

---

## Implementation Status

### Completed
- [x] Design document (REVIEW_WORKFLOW_DESIGN.md)
- [x] Database models (`ReviewSlot`)
- [x] Pydantic schemas (`review_slot.py`)
- [x] Migration file (788b36ab8d73)
- [x] State machine logic (in model methods)

### Not Yet Implemented
- [ ] CRUD operations (`crud/review_slot.py`)
- [ ] API endpoints (`api/v1/review_slots.py`)
- [ ] Background jobs (timeout, auto-accept)
- [ ] Payment integration (Stripe)
- [ ] Notification system
- [ ] Admin dashboard
- [ ] Frontend UI
- [ ] Reputation system

---

## Next Steps

### Phase 1: Core Workflow (Backend)
1. **Run migration:**
   ```bash
   alembic upgrade head
   ```

2. **Implement CRUD operations:**
   - `crud/review_slot.py` with all state transitions
   - Atomic operations with SELECT FOR UPDATE
   - Payment status updates

3. **Create API endpoints:**
   - Slot claiming endpoints
   - Review submission endpoints
   - Acceptance/rejection endpoints

### Phase 2: Automation
1. **Background jobs:**
   - Timeout job: Find CLAIMED slots past 72h → ABANDONED
   - Auto-accept job: Find SUBMITTED slots past 7d → ACCEPTED
   - Notification job: Send deadline reminders

2. **Scheduled tasks:**
   - Run every 5 minutes via cron/Celery
   - Update slot statuses atomically
   - Send email notifications

### Phase 3: Payment Integration
1. **Stripe Connect setup:**
   - Create connected accounts for reviewers
   - Implement payment escrow
   - Implement refund logic

2. **Webhook handlers:**
   - Payment success → Update payment_status
   - Payment failure → Retry logic
   - Refund confirmation

### Phase 4: Frontend
1. **Reviewer UI:**
   - Claim slot button
   - Review submission form
   - Dashboard with deadlines/timers

2. **Requester UI:**
   - View submitted reviews
   - Accept/reject buttons
   - Countdown to auto-accept

3. **Admin UI:**
   - Dispute resolution dashboard
   - User reputation view
   - Manual intervention tools

### Phase 5: Testing
1. **Unit tests:**
   - State machine transitions
   - Validation rules
   - Edge cases

2. **Integration tests:**
   - Full claim → submit → accept flow
   - Rejection and dispute flow
   - Payment escrow flow

3. **Load tests:**
   - Concurrent slot claiming
   - Race condition testing

---

## Edge Cases Handled

1. **Multiple reviewers claim same slot simultaneously:**
   - Solution: SELECT FOR UPDATE in claim operation
   - First to commit wins, others get error

2. **Reviewer submits at 71h 59m, then claim expires:**
   - Solution: Validate deadline before submit
   - Return error if deadline passed

3. **Requester tries to reject after 7 days:**
   - Solution: Check auto_accept_at deadline
   - Return error if window closed

4. **Admin overturns rejection, payment already refunded:**
   - Solution: Re-charge requester, pay reviewer
   - Payment status: REFUNDED → RELEASED

5. **User deletes account mid-review:**
   - Solution: Soft deletes, reviewer_id SET NULL
   - Review data preserved for audit

6. **Payment processor fails during escrow:**
   - Solution: Retry logic with exponential backoff
   - Slot stays CLAIMED until payment succeeds
   - Manual admin intervention if repeated failures

---

## Success Metrics

**Engagement:**
- Claim rate: >80% (slots get claimed)
- Submission rate: >85% (claimed slots get submitted)
- Acceptance rate: >90% (submitted reviews get accepted)

**Quality:**
- Avg review length: >400 chars
- Avg helpful rating: >4.0/5.0
- Dispute rate: <5%

**Timeliness:**
- Avg time to claim: <6 hours
- Avg time to submit: <24 hours
- Avg time to review: <48 hours
- Auto-accept rate: <20% (requesters are engaged)

**Fairness:**
- Requester rejection rate: <15%
- Reviewer abandonment rate: <10%
- Admin dispute overturn rate: <30% (rejections are mostly valid)

---

## Open Questions (For Discussion)

1. **Should one reviewer be allowed to claim multiple slots on the same request?**
   - Pro: Efficiency, single comprehensive review
   - Con: Reduces diversity of perspectives
   - Recommendation: Allow but limit to 2 slots max per request

2. **Should reviewers be able to edit reviews after submission?**
   - Pro: Fix typos, add clarifications
   - Con: Requester might have already reviewed
   - Recommendation: Allow editing only before acceptance/rejection

3. **Partial acceptance with reduced payment?**
   - Example: Accept but only pay 50% for mediocre review
   - Pro: More nuanced feedback
   - Con: Complex logic, potential disputes
   - Recommendation: No, keep binary accept/reject for simplicity

4. **Platform fee structure:**
   - Current: 15% on expert reviews
   - Alternative: Tiered (10% for high-volume reviewers)
   - Alternative: Per-request fee instead of per-review
   - Recommendation: Start with flat 15%, optimize later

5. **Minimum withdrawal amount for reviewers?**
   - Current: Not specified
   - Options: $25, $50, or no minimum
   - Recommendation: $25 minimum to reduce transaction costs

---

## Conclusion

This design provides a complete, fair, and scalable review workflow that:

1. **Protects reviewers:** Auto-accept, dispute rights, clear payment timing
2. **Protects requesters:** Rejection rights, refunds, quality thresholds
3. **Prevents abuse:** Timeouts, rate limits, reputation tracking
4. **Scales efficiently:** Separate slots table, indexed queries
5. **Maintains quality:** Minimum lengths, rating requirements

The implementation balances complexity with functionality, providing essential features while keeping the system maintainable.

**Status:** Design complete, ready for implementation

**Next action:** Run migration and begin Phase 1 (CRUD operations)
