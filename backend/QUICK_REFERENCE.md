# Review Workflow - Quick Reference Card

## Free vs Paid Reviews

| Feature | Free | Expert |
|---------|------|--------|
| Max Reviews | 1-3 | 1-10 |
| Cost | $0 | $25-100/review |
| Min Length | 50 chars | 200 chars |
| Rating | Optional | Required |
| Payment | None | Escrow → Release |

## Timeouts

- **Claim deadline:** 72 hours
- **Auto-accept:** 7 days
- **Dispute window:** 7 days

## State Machine

```
AVAILABLE → CLAIMED → SUBMITTED → ACCEPTED
              ↓           ↓
          ABANDONED   REJECTED → DISPUTED
```

## Payment Flow (Expert)

1. Published → Funds AUTHORIZED
2. Submitted → Funds ESCROWED
3. Accepted → Funds RELEASED (85% to reviewer)
4. Rejected → Funds REFUNDED (100% to requester)

## Rejection Reasons

- low_quality
- off_topic
- spam
- abusive
- other (requires notes)

## Database Tables

- `review_requests` - Main request (existing)
- `review_slots` - Individual slots (NEW)

## Key Files

### Documentation
- `REVIEW_WORKFLOW_DESIGN.md` - Complete spec
- `IMPLEMENTATION_ROADMAP.md` - 12-week plan
- `FREE_VS_PAID_REVIEW_POLICY.md` - Policy details

### Code
- `app/models/review_slot.py` - Model
- `app/schemas/review_slot.py` - Schemas
- `alembic/versions/788b36ab8d73_*.py` - Migration

## API Endpoints (Planned)

```
POST   /review-requests/{id}/slots/claim
POST   /review-slots/{id}/unclaim
POST   /review-slots/{id}/submit
POST   /review-slots/{id}/accept
POST   /review-slots/{id}/reject
POST   /review-slots/{id}/dispute
GET    /review-requests/{id}/slots
GET    /reviewers/me/slots
```

## Next Steps

1. Run migration: `alembic upgrade head`
2. Create CRUD operations
3. Create API endpoints
4. Write tests
5. Implement background jobs
6. Integrate payment (Stripe)
7. Build frontend UI

## Success Metrics

- Claim rate: >80%
- Submission rate: >85%
- Acceptance rate: >90%
- Dispute rate: <5%

## Contact

See `DESIGN_COMPLETE.md` for full details.
