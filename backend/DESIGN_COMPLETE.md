# Review Workflow Design - COMPLETE

## Status: Design Phase Complete, Ready for Implementation

**Date Completed:** 2025-11-12
**Designer:** Backend Architect
**Reviewers:** Awaiting stakeholder approval

---

## Executive Summary

This design provides a comprehensive review acceptance/rejection workflow for Critvue that:

1. **Balances fairness** for both requesters (quality control) and reviewers (payment protection)
2. **Prevents abuse** through timeouts, rate limits, and dispute mechanisms
3. **Scales efficiently** with proper database design and state management
4. **Maintains quality** through minimum requirements and reputation tracking
5. **Supports both free and paid reviews** with appropriate limits and incentives

---

## Key Decisions Made

### 1. Free vs Paid Review Limits

| Type | Min | Max | Rationale |
|------|-----|-----|-----------|
| Free | 1 | 3 | Prevents abuse, enables multiple perspectives |
| Expert | 1 | 10 | Professional service, payment justifies higher volume |

**Implemented:** Schema validation in `ReviewRequestBase.validate_reviews_requested()`

---

### 2. Database Architecture

**Decision:** Separate `review_slots` table

**Benefits:**
- Clean state machine per slot
- Scalable (handles N slots independently)
- Proper payment tracking per review
- Atomic operations with row-level locking

**Trade-off:** Slightly more complex queries vs much better business logic

---

### 3. State Machine

**States:** AVAILABLE → CLAIMED → SUBMITTED → ACCEPTED (final)

**Auto-Transitions:**
- CLAIMED → ABANDONED: After 72 hours (timeout)
- SUBMITTED → ACCEPTED: After 7 days (auto-accept)

**Manual Transitions:**
- CLAIMED → AVAILABLE: Reviewer unclaims
- SUBMITTED → REJECTED: Requester rejects
- REJECTED → DISPUTED: Reviewer disputes
- DISPUTED → ACCEPTED/REJECTED: Admin resolves

---

### 4. Acceptance/Rejection Policy

**Rejection Allowed:** YES, with protections

**Protections:**
1. Valid reason required (enum + notes)
2. 50% lifetime rejection rate limit
3. 7-day window (after that, auto-accept)
4. Reviewer can dispute within 7 days
5. Admin final decision

**Reasons:** low_quality, off_topic, spam, abusive, other

---

### 5. Payment Timing (Expert Reviews)

**Flow:**
1. Request published → Funds AUTHORIZED
2. Reviewer claims → No charge
3. Review submitted → Funds ESCROWED (charged, held)
4. Review accepted → Funds RELEASED (85% to reviewer)
5. Review rejected → Funds REFUNDED (100% to requester)

**Platform Fee:** 15% (industry standard)

**Protection:** Auto-accept after 7 days ensures reviewers get paid

---

### 6. Timeouts

| Timeout | Duration | Action |
|---------|----------|--------|
| Claim deadline | 72 hours | Auto-ABANDONED, slot reopens |
| Auto-accept | 7 days | Auto-ACCEPTED, payment released |

**Notifications:**
- 48h before claim deadline
- 24h before auto-accept

---

## Design Documents Created

All documentation is in `/home/user/Critvue/backend/`:

1. **REVIEW_WORKFLOW_DESIGN.md** (13 sections, 500+ lines)
   - Complete specification
   - Database schema
   - Business rules
   - API endpoints
   - Edge cases
   - Metrics

2. **REVIEW_WORKFLOW_SUMMARY.md** (Executive summary)
   - Key decisions
   - Quick reference
   - Status tracking
   - Open questions

3. **FREE_VS_PAID_REVIEW_POLICY.md** (Policy document)
   - Detailed comparison
   - Use case guidance
   - Economics explanation
   - Anti-abuse mechanisms

4. **REVIEW_WORKFLOW_DIAGRAM.md** (Visual diagrams)
   - State machine flowcharts
   - Payment flow diagrams
   - Timeline views
   - Dashboard mockups

5. **IMPLEMENTATION_ROADMAP.md** (12-week plan)
   - Phase-by-phase breakdown
   - Time estimates
   - Priority levels
   - Success metrics
   - Risk mitigation

6. **DESIGN_COMPLETE.md** (This document)
   - Summary of all work
   - Files created
   - Next steps

---

## Code Files Created

### Models

1. **app/models/review_slot.py** (500+ lines)
   - ReviewSlot model with full state machine
   - Enums for all states and reasons
   - Properties for state checking
   - Methods for state transitions
   - Full validation logic

2. **app/models/review_request.py** (updated)
   - Added `reviews_completed` column
   - Added `slots` relationship
   - Maintains backward compatibility

### Schemas

1. **app/schemas/review_slot.py** (300+ lines)
   - ReviewSlotBase, Create, Response schemas
   - ReviewSubmit, Accept, Reject, Dispute schemas
   - Public and private response types
   - Reviewer dashboard schemas
   - Admin dispute schemas

2. **app/schemas/review.py** (updated)
   - Added validation for free vs paid limits
   - 1-3 for free, 1-10 for expert

### Migrations

1. **alembic/versions/788b36ab8d73_add_review_slots_table_and_workflow.py**
   - Creates `review_slots` table
   - All indexes for performance
   - All enums
   - Adds `reviews_completed` to review_requests
   - Full upgrade/downgrade logic

---

## Implementation Status

### Completed (Design Phase)

- [x] Requirements analysis
- [x] State machine design
- [x] Database schema design
- [x] API endpoint specification
- [x] Business rules definition
- [x] Payment flow design
- [x] Anti-abuse mechanisms
- [x] Dispute resolution process
- [x] Free vs paid policy
- [x] All documentation
- [x] Database models
- [x] Pydantic schemas
- [x] Migration file
- [x] Implementation roadmap

### Not Yet Implemented

- [ ] CRUD operations
- [ ] API endpoints
- [ ] Background jobs (timeout, auto-accept)
- [ ] Payment integration
- [ ] Notification system
- [ ] Admin dashboard
- [ ] Frontend UI
- [ ] Reputation system
- [ ] Testing
- [ ] Deployment

---

## Next Steps (Immediate)

### Step 1: Run Migration

```bash
cd /home/user/Critvue/backend
source venv/bin/activate
alembic upgrade head
```

**Verify:**
```sql
-- Check table exists
SELECT * FROM review_slots LIMIT 1;

-- Check column added
SELECT reviews_completed FROM review_requests LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'review_slots';
```

---

### Step 2: Stakeholder Approval

**Review these parameters:**
1. Free reviews: 1-3 max ✓
2. Expert reviews: 1-10 max ✓
3. Claim timeout: 72 hours ✓
4. Auto-accept: 7 days ✓
5. Platform fee: 15% ✓
6. Min review length: 50 free, 200 expert ✓
7. Rejection allowed: Yes ✓
8. Dispute window: 7 days ✓

**Action:** Get approval or adjust parameters

---

### Step 3: Start Implementation (Phase 1)

**Priority order:**
1. Create `crud/review_slot.py` (2-3 days)
2. Create `api/v1/review_slots.py` (2-3 days)
3. Update review publishing to create slots (1 day)
4. Write tests (2-3 days)

**Goal:** Working claim → submit → accept flow

---

## Questions for Stakeholders

### Business Questions

1. **Platform fee:** Is 15% acceptable? (Similar to Fiverr 20%, Upwork 20%)
2. **Free review limits:** Is 1-3 the right range? Too restrictive?
3. **Minimum withdrawal:** Should reviewers have minimum $25 withdrawal?
4. **Reviewer verification:** Should expert reviewers be verified/vetted?
5. **Pricing tiers:** Should we have junior/senior/expert reviewer tiers?

### Technical Questions

1. **Payment processor:** Confirmed Stripe Connect?
2. **Email service:** Which provider? SendGrid? Mailgun?
3. **Background jobs:** Celery or APScheduler?
4. **Monitoring:** Sentry + Datadog? Or alternatives?
5. **Hosting:** Current infrastructure can handle increased load?

### Policy Questions

1. **Rejection rate limit:** Is 50% the right threshold?
2. **Abandonment penalty:** Should we track reputation?
3. **Dispute SLA:** How fast should admins resolve disputes? 24h? 48h?
4. **Reviewer payout schedule:** Weekly? Bi-weekly? On-demand?
5. **Refund policy:** Any exceptions to full refund?

---

## Risk Assessment

### Low Risk (Well-Designed)

- Database schema (thoroughly planned, indexed)
- State machine (clear transitions, validated)
- Payment flow (industry standard escrow model)
- API design (RESTful, authenticated, validated)

### Medium Risk (Needs Monitoring)

- Race conditions (mitigated with SELECT FOR UPDATE)
- Payment processor reliability (retry logic needed)
- User abuse patterns (monitoring required)
- Background job failures (alerting needed)

### High Risk (Requires Testing)

- Concurrent slot claims (load testing required)
- Payment edge cases (test mode validation)
- Email deliverability (test with real providers)
- UI/UX confusion (user testing needed)

**Mitigation:** Comprehensive testing in Phase 6-7

---

## Success Criteria

### Technical Success

- [ ] All tests passing (>90% coverage)
- [ ] No race conditions in slot claiming
- [ ] Payment success rate >99%
- [ ] API response time <200ms
- [ ] Background jobs processing within 5 minutes
- [ ] Zero data loss or corruption

### Business Success

- [ ] Claim rate >80%
- [ ] Submission rate >85%
- [ ] Acceptance rate >90%
- [ ] Dispute rate <5%
- [ ] User satisfaction >4.0/5.0
- [ ] Revenue positive (platform fees > costs)

### User Success

- [ ] Requesters get quality reviews
- [ ] Reviewers get paid reliably
- [ ] Clear, easy-to-understand workflow
- [ ] Fast turnaround times
- [ ] Fair dispute resolution
- [ ] Transparent payment timing

---

## Long-Term Enhancements (Post-Launch)

### Phase 2 Features (3-6 months)

1. **Reputation System**
   - Reviewer badges (Top Reviewer, Expert, etc.)
   - Requester trust scores
   - Leaderboards

2. **Advanced Matching**
   - Auto-assign reviews based on expertise
   - Reviewer specializations (Design, Code, Video)
   - Smart recommendations

3. **Bulk Operations**
   - Request 10 reviews with one click
   - Batch accept/reject
   - Bulk payouts

4. **Analytics Dashboard**
   - Requester insights (best time to post, optimal price)
   - Reviewer earnings projections
   - Platform health metrics

### Phase 3 Features (6-12 months)

1. **Tiered Pricing**
   - Junior reviewers: $15-25
   - Senior reviewers: $50-75
   - Expert reviewers: $100-150

2. **Subscription Plans**
   - $50/month: 5 reviews
   - $100/month: 15 reviews
   - Enterprise: Custom

3. **Team Accounts**
   - Multiple users per account
   - Shared review requests
   - Team analytics

4. **API for Partners**
   - Integrate Critvue reviews into other platforms
   - Webhook notifications
   - OAuth authentication

---

## File Locations (Quick Reference)

### Documentation
```
/home/user/Critvue/backend/
├── REVIEW_WORKFLOW_DESIGN.md          (Complete spec)
├── REVIEW_WORKFLOW_SUMMARY.md         (Executive summary)
├── FREE_VS_PAID_REVIEW_POLICY.md      (Policy details)
├── REVIEW_WORKFLOW_DIAGRAM.md         (Visual diagrams)
├── IMPLEMENTATION_ROADMAP.md          (12-week plan)
└── DESIGN_COMPLETE.md                 (This file)
```

### Code
```
/home/user/Critvue/backend/app/
├── models/
│   ├── review_slot.py                 (NEW: ReviewSlot model)
│   └── review_request.py              (UPDATED: Added slots relationship)
├── schemas/
│   ├── review_slot.py                 (NEW: All slot schemas)
│   └── review.py                      (UPDATED: Free/paid validation)
└── alembic/versions/
    └── 788b36ab8d73_..._workflow.py   (NEW: Migration)
```

### To Be Created
```
/home/user/Critvue/backend/app/
├── crud/
│   └── review_slot.py                 (TODO: CRUD operations)
├── api/v1/
│   └── review_slots.py                (TODO: API endpoints)
├── services/
│   ├── payment.py                     (TODO: Payment integration)
│   └── notification.py                (TODO: Email notifications)
├── jobs/
│   ├── review_timeout.py              (TODO: Timeout job)
│   └── review_auto_accept.py          (TODO: Auto-accept job)
└── tests/
    ├── test_review_slot_crud.py       (TODO: CRUD tests)
    ├── test_review_slot_api.py        (TODO: API tests)
    └── test_review_workflow.py        (TODO: E2E tests)
```

---

## Approval Checklist

Before proceeding to implementation, confirm:

### Design Approval
- [ ] Stakeholders reviewed design documents
- [ ] Business parameters approved (limits, fees, timeouts)
- [ ] Database schema approved
- [ ] API design approved
- [ ] Payment flow approved
- [ ] Dispute resolution process approved

### Technical Readiness
- [ ] Development environment set up
- [ ] Database migration tested
- [ ] Payment processor account created (Stripe test mode)
- [ ] Email service configured
- [ ] Monitoring tools selected

### Resource Allocation
- [ ] Developer assigned (12 weeks)
- [ ] Budget approved (~$300-500/month infrastructure)
- [ ] Beta testers identified (20-50 users)
- [ ] Support team briefed

### Timeline Agreement
- [ ] 12-week timeline approved
- [ ] 6-week MVP milestone agreed
- [ ] Beta testing phase scheduled
- [ ] Launch date tentative

---

## Final Recommendation

**Status:** READY TO IMPLEMENT

**Recommendation:** Proceed with Phase 1 (Core Backend) immediately.

**Confidence Level:** HIGH

**Reasoning:**
1. Design is comprehensive and well-documented
2. Database schema is optimized and indexed
3. State machine is clear and validated
4. Payment flow follows industry standards
5. Anti-abuse mechanisms are robust
6. Implementation roadmap is detailed

**Risks:** LOW to MEDIUM (all identified and mitigated)

**Expected Outcome:** Successfully launched review workflow within 12 weeks

---

## Contact & Questions

**Designer:** Backend Architect
**Date:** 2025-11-12
**Review Status:** Awaiting Approval

For questions or clarifications, please review:
1. REVIEW_WORKFLOW_DESIGN.md (comprehensive spec)
2. IMPLEMENTATION_ROADMAP.md (detailed plan)
3. This document (summary)

**Next Action:** Get stakeholder approval, then run migration and begin Phase 1.

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-12 | Initial complete design |
| 1.1 | TBD | Post-approval updates |
| 2.0 | TBD | Post-implementation revisions |

---

**END OF DESIGN PHASE**

**NEXT: IMPLEMENTATION PHASE 1 - CORE BACKEND**
