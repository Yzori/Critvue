# Review Workflow Implementation Roadmap

## Overview

This document provides a step-by-step implementation plan for the review acceptance/rejection workflow.

**Current Status:** Design Complete, Database Schema Ready
**Next Phase:** Backend Implementation

---

## Phase 1: Core Backend (Week 1-2)

### 1.1 Database Migration

**Priority: P0 (Required)**

```bash
# Run the migration
cd /home/user/Critvue/backend
source venv/bin/activate
alembic upgrade head
```

**Verify:**
- `review_slots` table created
- All enums created (reviewslotstatus, acceptancetype, etc.)
- Indexes created
- `review_requests.reviews_completed` column added

**Files:**
- `/home/user/Critvue/backend/alembic/versions/788b36ab8d73_add_review_slots_table_and_workflow.py`

---

### 1.2 CRUD Operations

**Priority: P0 (Required)**

Create `/home/user/Critvue/backend/app/crud/review_slot.py`:

```python
"""
CRUD operations for review slots

Required functions:
- create_slots_for_request(db, review_request_id, count, payment_amount=None)
- get_slot(db, slot_id)
- get_slots_for_request(db, review_request_id)
- get_slots_for_reviewer(db, reviewer_id, status=None)
- claim_slot(db, slot_id, reviewer_id)
- unclaim_slot(db, slot_id, reviewer_id)
- submit_review(db, slot_id, reviewer_id, review_data)
- accept_review(db, slot_id, requester_id, helpful_rating=None)
- reject_review(db, slot_id, requester_id, reason, notes=None)
- dispute_review(db, slot_id, reviewer_id, reason)
- resolve_dispute(db, slot_id, admin_id, resolution, notes=None)
- get_abandoned_slots(db) # For timeout job
- get_auto_accept_slots(db) # For auto-accept job
"""
```

**Key Considerations:**
- Use `SELECT FOR UPDATE` for claim operations (prevent race conditions)
- Validate state transitions (use model methods)
- Update `review_requests.reviews_claimed` and `reviews_completed` counters
- Atomic transactions for all operations
- Proper error handling and logging

**Estimated Time:** 3-4 days

---

### 1.3 API Endpoints

**Priority: P0 (Required)**

Create `/home/user/Critvue/backend/app/api/v1/review_slots.py`:

```python
"""
Review slot API endpoints

Endpoints:
POST   /review-requests/{request_id}/slots/claim
POST   /review-slots/{slot_id}/unclaim
POST   /review-slots/{slot_id}/submit
POST   /review-slots/{slot_id}/accept
POST   /review-slots/{slot_id}/reject
POST   /review-slots/{slot_id}/dispute
GET    /review-requests/{request_id}/slots
GET    /reviewers/me/slots
GET    /reviewers/me/earnings
GET    /admin/disputes
POST   /admin/disputes/{slot_id}/resolve
"""
```

**Authentication Requirements:**
- Claim: Authenticated user, not own request
- Unclaim: Reviewer only
- Submit: Reviewer only, must own claim
- Accept/Reject: Requester only
- Dispute: Reviewer only
- Admin endpoints: Admin role only

**Validation:**
- Verify ownership before operations
- Check state validity (use model.is_claimable, etc.)
- Validate review content (min length, rating)
- Check deadlines (claim_deadline, auto_accept_at)

**Estimated Time:** 3-4 days

---

### 1.4 Update Review Request Publishing

**Priority: P0 (Required)**

Modify `/home/user/Critvue/backend/app/crud/review.py`:

When review request status changes to PENDING (published):
1. Create N review slots (N = reviews_requested)
2. Set payment_amount for expert reviews
3. All slots start as AVAILABLE

```python
async def publish_review_request(db, review_id, user_id):
    """
    Publish a review request and create slots

    Steps:
    1. Update status: DRAFT → PENDING
    2. Create review_slots (reviews_requested count)
    3. For expert reviews, calculate payment_amount per slot
    """
    review = await get_review_request(db, review_id, user_id)

    if review.status != ReviewStatus.DRAFT:
        raise ValueError("Only draft reviews can be published")

    # Update status
    review.status = ReviewStatus.PENDING

    # Create slots
    payment_per_slot = None
    if review.review_type == ReviewType.EXPERT and review.budget:
        payment_per_slot = review.budget / review.reviews_requested

    for _ in range(review.reviews_requested):
        slot = ReviewSlot(
            review_request_id=review.id,
            payment_amount=payment_per_slot
        )
        db.add(slot)

    await db.commit()
    return review
```

**Estimated Time:** 1 day

---

### 1.5 Testing

**Priority: P0 (Required)**

Create tests:
- `tests/test_review_slot_crud.py`
- `tests/test_review_slot_api.py`
- `tests/test_review_workflow.py`

**Test Cases:**
1. **Happy path:** Claim → Submit → Accept
2. **Rejection path:** Claim → Submit → Reject → Dispute → Admin resolve
3. **Timeout scenarios:**
   - Claim timeout (72h)
   - Auto-accept (7 days)
4. **Race conditions:** Multiple users claim same slot
5. **Validation errors:** Invalid state transitions
6. **Edge cases:**
   - Submit at deadline boundary
   - Reject after auto-accept window
   - Dispute expired rejection

**Estimated Time:** 2-3 days

---

## Phase 2: Background Jobs (Week 3)

### 2.1 Timeout Job

**Priority: P1 (High)**

Create `/home/user/Critvue/backend/app/jobs/review_timeout.py`:

```python
"""
Background job to handle review slot timeouts

Runs every 5 minutes

Tasks:
1. Find CLAIMED slots past claim_deadline → ABANDONED
2. Update review_requests.reviews_claimed counter
3. Send notification to reviewer
"""

async def process_abandoned_slots():
    slots = await get_abandoned_slots(db)

    for slot in slots:
        slot.abandon()
        # Decrement reviews_claimed
        # Send email notification

    await db.commit()
```

**Scheduler:** Use APScheduler or Celery

**Estimated Time:** 1-2 days

---

### 2.2 Auto-Accept Job

**Priority: P1 (High)**

Create `/home/user/Critvue/backend/app/jobs/review_auto_accept.py`:

```python
"""
Background job to auto-accept reviews after 7 days

Runs every 5 minutes

Tasks:
1. Find SUBMITTED slots past auto_accept_at → ACCEPTED
2. Release payment for expert reviews
3. Update review_requests.reviews_completed counter
4. Send notifications to both parties
"""

async def process_auto_accepts():
    slots = await get_auto_accept_slots(db)

    for slot in slots:
        slot.accept(is_auto=True)
        # Release payment
        # Update counters
        # Send notifications

    await db.commit()
```

**Estimated Time:** 1-2 days

---

### 2.3 Notification Service

**Priority: P1 (High)**

Create `/home/user/Critvue/backend/app/services/notification.py`:

```python
"""
Email notification service for review lifecycle events

Events:
- slot_claimed
- review_submitted
- review_accepted
- review_rejected
- review_disputed
- dispute_resolved
- claim_deadline_approaching (48h warning)
- auto_accept_approaching (24h warning)
- slot_abandoned
- auto_accepted
"""
```

**Email Templates:**
Create templates in `/home/user/Critvue/backend/app/templates/emails/`:
- `slot_claimed.html`
- `review_submitted.html`
- `review_accepted.html`
- `review_rejected.html`
- `claim_deadline_warning.html`
- `auto_accept_warning.html`
- etc.

**Estimated Time:** 2-3 days

---

## Phase 3: Payment Integration (Week 4-5)

### 3.1 Stripe Connect Setup

**Priority: P1 (High)**

**Steps:**
1. Create Stripe Connect accounts for reviewers
2. Implement OAuth flow for account linking
3. Store Stripe account IDs in user table

**Add to User model:**
```python
class User(Base):
    # ... existing fields
    stripe_account_id = Column(String(100), nullable=True)
    stripe_account_status = Column(String(20), nullable=True)  # pending, active, disabled
```

**Estimated Time:** 2-3 days

---

### 3.2 Payment Escrow Logic

**Priority: P1 (High)**

Create `/home/user/Critvue/backend/app/services/payment.py`:

```python
"""
Payment service for review slots

Functions:
- escrow_payment(slot_id) # Called on review submit
- release_payment(slot_id) # Called on review accept
- refund_payment(slot_id)  # Called on review reject
"""

async def escrow_payment(slot: ReviewSlot):
    """
    Charge requester and hold funds in escrow

    Uses Stripe Payment Intents:
    1. Create PaymentIntent with amount
    2. Capture payment
    3. Hold funds (don't transfer yet)
    4. Update slot.payment_status = ESCROWED
    5. Store transaction_id
    """
    pass

async def release_payment(slot: ReviewSlot):
    """
    Release funds to reviewer

    Uses Stripe Transfers:
    1. Calculate platform fee (15%)
    2. Transfer 85% to reviewer's connected account
    3. Update slot.payment_status = RELEASED
    4. Set payment_released_at timestamp
    """
    pass

async def refund_payment(slot: ReviewSlot):
    """
    Refund payment to requester

    Uses Stripe Refunds:
    1. Refund original PaymentIntent
    2. Update slot.payment_status = REFUNDED
    """
    pass
```

**Estimated Time:** 3-4 days

---

### 3.3 Webhook Handlers

**Priority: P1 (High)**

Create `/home/user/Critvue/backend/app/api/v1/webhooks.py`:

Handle Stripe events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.failed`
- `refund.created`

**Estimated Time:** 2 days

---

### 3.4 Payout Dashboard

**Priority: P2 (Medium)**

Create endpoints for reviewer earnings:
- GET `/reviewers/me/earnings` (already planned)
- GET `/reviewers/me/payouts`
- POST `/reviewers/me/payouts/request` (withdrawal request)

**Estimated Time:** 2 days

---

## Phase 4: Admin Tools (Week 6)

### 4.1 Dispute Dashboard

**Priority: P2 (Medium)**

Create admin UI for dispute resolution:
- View list of disputed reviews
- See both review content and rejection reason
- View user histories (requester rejection rate, reviewer acceptance rate)
- One-click accept/reject with notes

**Backend endpoints already designed:**
- GET `/admin/disputes`
- POST `/admin/disputes/{slot_id}/resolve`

**Estimated Time:** 3 days

---

### 4.2 User Reputation Dashboard

**Priority: P2 (Medium)**

Track and display:
- Requester metrics:
  - Total reviews requested
  - Acceptance rate
  - Rejection rate
  - Dispute loss rate
- Reviewer metrics:
  - Total reviews submitted
  - Acceptance rate
  - Average helpful rating
  - Abandonment rate

**Estimated Time:** 2-3 days

---

### 4.3 Manual Intervention Tools

**Priority: P2 (Medium)**

Admin endpoints for edge cases:
- POST `/admin/slots/{slot_id}/force-accept`
- POST `/admin/slots/{slot_id}/force-reject`
- POST `/admin/slots/{slot_id}/force-abandon`
- POST `/admin/users/{user_id}/flag`
- POST `/admin/users/{user_id}/suspend`

**Estimated Time:** 2 days

---

## Phase 5: Frontend Integration (Week 7-8)

### 5.1 Reviewer Features

**Priority: P1 (High)**

**Browse Page Enhancements:**
- Show available slots count
- "Claim Review" button
- Claim deadline display

**Reviewer Dashboard:**
- Active claims with countdown timers
- Submitted reviews awaiting acceptance
- Completed reviews with earnings
- Earnings summary widget

**Review Submission Form:**
- Rich text editor
- Rating selector (1-5 stars)
- File upload for attachments
- Character count (min 50/200)

**Estimated Time:** 4-5 days

---

### 5.2 Requester Features

**Priority: P1 (High)**

**Review Request Detail:**
- Slot progress bar (3/5 completed)
- List of all slots with statuses
- Accept/Reject buttons for submitted reviews
- Countdown to auto-accept

**Accept/Reject Modal:**
- Helpful rating selector (1-5)
- Rejection reason dropdown
- Notes textarea (required for "other")
- Confirmation warnings

**Estimated Time:** 4-5 days

---

### 5.3 Notifications

**Priority: P1 (High)**

**In-App Notifications:**
- Bell icon with badge count
- Notification dropdown
- Mark as read functionality

**Email Notifications:**
- Already designed in Phase 2
- Implement triggers in UI

**Push Notifications (Optional):**
- For mobile apps
- Critical events only

**Estimated Time:** 3-4 days

---

## Phase 6: Optimization & Launch (Week 9-10)

### 6.1 Performance Optimization

**Priority: P2 (Medium)**

- Database query optimization
- Add caching for frequently accessed data
- Optimize N+1 queries
- Database connection pooling
- CDN for static assets

**Estimated Time:** 2-3 days

---

### 6.2 Monitoring & Logging

**Priority: P1 (High)**

**Metrics to Track:**
- Claim rate (% of slots claimed)
- Submission rate (% of claimed slots submitted)
- Acceptance rate (% of submitted reviews accepted)
- Abandonment rate
- Dispute rate
- Average time to claim/submit/review
- Payment success/failure rates

**Tools:**
- Sentry for error tracking
- Datadog/New Relic for APM
- Custom dashboard for business metrics

**Estimated Time:** 2-3 days

---

### 6.3 Load Testing

**Priority: P1 (High)**

**Scenarios to Test:**
1. 100 concurrent users claiming same slot
2. 1000 review submissions in 1 hour
3. 500 payment operations in parallel
4. Timeout job processing 10,000 slots
5. Auto-accept job processing 5,000 slots

**Tools:** Locust, JMeter, or k6

**Estimated Time:** 2-3 days

---

### 6.4 Security Audit

**Priority: P1 (High)**

**Checklist:**
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Rate limiting on API endpoints
- [ ] Authentication/authorization on all endpoints
- [ ] Sensitive data encryption
- [ ] Payment security (PCI compliance)
- [ ] Audit logging for admin actions

**Estimated Time:** 2-3 days

---

### 6.5 Documentation

**Priority: P2 (Medium)**

**User Documentation:**
- How to claim a review
- How to submit a review
- How to accept/reject reviews
- How to dispute a rejection
- Payment FAQs

**Developer Documentation:**
- API reference (OpenAPI/Swagger)
- Database schema diagrams
- State machine documentation
- Payment integration guide
- Webhook handling guide

**Estimated Time:** 2-3 days

---

## Phase 7: Beta Testing (Week 11)

### 7.1 Internal Testing

**Priority: P0 (Required)**

Test with team:
- Create 10-20 test review requests
- Have team members claim and submit reviews
- Test all edge cases
- Verify payment flow (test mode)
- Test dispute resolution

**Estimated Time:** 3-5 days

---

### 7.2 Beta User Testing

**Priority: P0 (Required)**

Invite 20-50 beta users:
- Mix of requesters and reviewers
- Track all metrics
- Collect feedback
- Fix critical bugs

**Estimated Time:** 5-7 days

---

### 7.3 Bug Fixes & Iterations

**Priority: P0 (Required)**

Based on beta feedback:
- Fix critical bugs
- Adjust timeouts if needed
- Refine UI/UX
- Optimize performance

**Estimated Time:** 3-5 days

---

## Phase 8: Production Launch (Week 12)

### 8.1 Pre-Launch Checklist

- [ ] All tests passing
- [ ] Security audit complete
- [ ] Load testing complete
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Rollback plan ready
- [ ] Documentation complete
- [ ] Support team trained

---

### 8.2 Launch Strategy

**Soft Launch:**
1. Enable for 10% of users
2. Monitor metrics closely
3. Gradually increase to 25%, 50%, 100%

**Communication:**
- Announcement email to all users
- Blog post explaining new features
- Tutorial videos
- FAQ updates

---

### 8.3 Post-Launch Monitoring

**First 24 hours:**
- Monitor error rates
- Track key metrics (claim rate, acceptance rate)
- Quick bug fixes if needed
- User support

**First week:**
- Daily metric reviews
- User feedback collection
- Performance tuning
- Bug fixes

**First month:**
- Weekly metric reviews
- Feature iteration based on feedback
- Scale infrastructure if needed

---

## Success Metrics (Track Weekly)

### Engagement Metrics
- [ ] Claim rate: >80%
- [ ] Submission rate: >85%
- [ ] Acceptance rate: >90%

### Quality Metrics
- [ ] Average review length: >400 chars
- [ ] Average helpful rating: >4.0/5.0
- [ ] Dispute rate: <5%

### Timeliness Metrics
- [ ] Average time to claim: <6 hours
- [ ] Average time to submit: <24 hours
- [ ] Average time to review: <48 hours
- [ ] Auto-accept rate: <20%

### Fairness Metrics
- [ ] Requester rejection rate: <15%
- [ ] Reviewer abandonment rate: <10%
- [ ] Admin dispute overturn rate: <30%

---

## Risk Mitigation

### Technical Risks

**Risk: Race condition in slot claiming**
- Mitigation: SELECT FOR UPDATE in database
- Fallback: Optimistic locking with version column

**Risk: Payment processor outage**
- Mitigation: Retry logic with exponential backoff
- Fallback: Manual admin processing

**Risk: Database performance issues**
- Mitigation: Proper indexing, query optimization
- Fallback: Read replicas, caching

### Business Risks

**Risk: Low reviewer participation**
- Mitigation: Reviewer incentives, gamification
- Fallback: Adjust free review limits

**Risk: High abuse rate**
- Mitigation: Rate limits, reputation system
- Fallback: Manual review for flagged users

**Risk: Payment disputes**
- Mitigation: Clear policies, dispute process
- Fallback: Admin intervention, partial refunds

---

## Budget Estimate

### Development Time

- Phase 1 (Backend): 2 weeks × 1 developer = 80 hours
- Phase 2 (Jobs): 1 week × 1 developer = 40 hours
- Phase 3 (Payment): 2 weeks × 1 developer = 80 hours
- Phase 4 (Admin): 1 week × 1 developer = 40 hours
- Phase 5 (Frontend): 2 weeks × 1 developer = 80 hours
- Phase 6 (Launch): 2 weeks × 1 developer = 80 hours
- Phase 7 (Beta): 2 weeks × team = 80 hours

**Total: ~480 developer hours (12 weeks)**

### Infrastructure Costs (Monthly)

- Database: $50-100
- Server: $100-200
- Stripe fees: 2.9% + $0.30 per transaction
- Email service: $20-50
- Monitoring: $50-100

**Total: ~$300-500/month**

---

## Next Immediate Steps

1. **Run migration:** `alembic upgrade head`
2. **Create CRUD file:** Start with `crud/review_slot.py`
3. **Implement claim_slot:** Most critical operation
4. **Write tests:** Ensure claim operation works correctly
5. **Create API endpoint:** POST `/review-requests/{id}/slots/claim`
6. **Test end-to-end:** Frontend → API → Database

**Start Date:** Today
**Target Completion:** 12 weeks from start
**MVP Completion:** 6 weeks (Phases 1-3)

---

## Questions to Resolve Before Implementation

1. **Payment processor:** Stripe confirmed?
2. **Platform fee:** 15% confirmed?
3. **Free review limits:** 1-3 confirmed?
4. **Expert review limits:** 1-10 confirmed?
5. **Timeouts:** 72h claim, 7d auto-accept confirmed?
6. **Minimum review lengths:** 50 free, 200 expert confirmed?
7. **Dispute window:** 7 days confirmed?

**Action:** Get stakeholder approval on all parameters before starting Phase 1.
