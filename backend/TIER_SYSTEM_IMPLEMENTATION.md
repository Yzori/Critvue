# Tier/Reputation System Implementation

## Overview

This document describes the comprehensive tier/reputation system implemented for Critvue. The system provides a 6-tier progression model where users earn "karma" through quality reviews and unlock paid review privileges.

## System Architecture

### Tier Structure

The system has 6 tiers with increasing requirements and privileges:

1. **NOVICE** (0-99 karma)
   - Starting tier, no requirements
   - Cannot accept paid reviews

2. **CONTRIBUTOR** (100-499 karma)
   - Requires: 100 karma + 5 accepted reviews

3. **SKILLED** (500-1,499 karma)
   - Requires: 500 karma + 25 accepted reviews + 75%+ acceptance rate

4. **TRUSTED_ADVISOR** (1,500-4,999 karma) - FIRST EARNING TIER
   - Requires: 1,500 karma + 75 accepted reviews + 80%+ acceptance rate + 4.0+ avg helpful rating
   - Unlocks: Can accept LOW-TIER paid reviews ($5-$25)
   - Weekly limit: 3 paid reviews/week

5. **EXPERT** (5,000-14,999 karma)
   - Requires: 5,000 karma + 200 accepted reviews + 85%+ acceptance rate + 4.3+ avg helpful rating
   - Unlocks: Can accept MID-TIER paid reviews ($25-$100)
   - Weekly limit: 10 paid reviews/week

6. **MASTER** (15,000+ karma) - TOP TIER
   - Two paths to achieve:
     - **Path A**: Expert application approval (fast-track)
     - **Path B**: 15,000+ karma + 500 accepted reviews + 90%+ acceptance rate + 4.5+ avg helpful rating
   - Unlocks: All paid reviews ($5-$200+), unlimited claims, can review expert applications

## Database Schema

### New Tables

#### 1. karma_transactions
Tracks all karma point changes for audit trail and analytics.

```sql
CREATE TABLE karma_transactions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    related_review_slot_id INTEGER REFERENCES review_slots(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,  -- Enum: KarmaAction
    points INTEGER NOT NULL,       -- Can be negative
    balance_after INTEGER NOT NULL,
    reason TEXT,                   -- Human-readable description
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX(user_id),
    INDEX(action),
    INDEX(created_at)
);
```

#### 2. tier_milestones
Records tier promotions for historical tracking.

```sql
CREATE TABLE tier_milestones (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_tier VARCHAR(20),         -- NULL for initial assignment
    to_tier VARCHAR(20) NOT NULL,  -- Enum: UserTier
    reason TEXT,
    karma_at_promotion INTEGER NOT NULL,
    achieved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    INDEX(user_id),
    INDEX(achieved_at)
);
```

### Modified Tables

#### users table - New Fields

```sql
ALTER TABLE users ADD COLUMN user_tier VARCHAR(20) NOT NULL DEFAULT 'novice';
ALTER TABLE users ADD COLUMN karma_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN tier_achieved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN expert_application_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN acceptance_rate NUMERIC(5,2);
ALTER TABLE users ADD COLUMN accepted_reviews_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_review_date TIMESTAMP;

CREATE INDEX idx_users_user_tier ON users(user_tier);
CREATE INDEX idx_users_karma_points ON users(karma_points);
```

## Karma Earning Rules

### Point Values

| Action | Points | Notes |
|--------|--------|-------|
| Submit review | +5 | Awarded on submission |
| Review accepted (3-star) | +20 | Based on helpful rating |
| Review accepted (4-star) | +30 | Based on helpful rating |
| Review accepted (5-star) | +40 | Based on helpful rating |
| Review auto-accepted | +15 | After 7 days |
| Review rejected | -10 | Standard rejection |
| Dispute won | +50 | Admin sides with reviewer |
| Dispute lost | -30 | Admin sides with requester |
| Claim abandoned | -20 | Timeout or manual abandon |
| First review of day | +5 | Daily bonus |
| 5-review streak | +25 | Consecutive days |
| 10-review streak | +75 | Consecutive days |
| 25-review streak | +200 | Consecutive days |
| Profile 100% complete | +50 | One-time bonus |
| Spam/abusive content | -100 | Severe penalty |

### Acceptance Rate Calculation

```
acceptance_rate = (accepted_reviews) / (accepted + rejected reviews) * 100
```

This is cached in the `users.acceptance_rate` field and updated whenever a review is accepted or rejected.

### Streak Tracking

- **Current Streak**: Number of consecutive days with at least one review submitted
- **Longest Streak**: Best streak ever achieved
- Streaks are broken if a day is missed
- Streak bonuses are awarded at milestones (5, 10, 25 days)

## Implementation Details

### Core Services

#### 1. KarmaService (`app/services/karma_service.py`)

Main methods:
- `award_karma()`: Award or deduct karma points
- `update_streak()`: Update review streak and award bonuses
- `calculate_acceptance_rate()`: Calculate and cache acceptance rate
- `get_karma_history()`: Get paginated transaction history
- `get_karma_summary()`: Get statistics summary
- `award_daily_bonus()`: Check and award first-of-day bonus
- `check_tier_promotion()`: Check if user qualifies for promotion

#### 2. TierService (`app/services/tier_service.py`)

Main methods:
- `get_tier_requirements()`: Get requirements for a tier
- `check_tier_requirements()`: Check if user meets tier requirements
- `promote_to_tier()`: Promote user to new tier
- `check_and_promote_user()`: Auto-check and promote if eligible
- `can_claim_paid_review()`: Check tier permissions for paid reviews
- `get_tier_progress()`: Get user's progress towards next tier
- `fast_track_to_master()`: Expert application fast-track path

#### 3. ReviewKarmaHooks (`app/services/review_karma_hooks.py`)

Event hooks for review lifecycle:
- `on_review_submitted()`: Award karma for submission
- `on_review_accepted()`: Award karma for acceptance
- `on_review_rejected()`: Deduct karma for rejection
- `on_claim_abandoned()`: Deduct karma for abandonment
- `on_dispute_resolved()`: Award/deduct based on resolution

### API Endpoints

All endpoints are under `/api/v1/tier-system`:

#### GET /me/tier
Get current user's tier information and progress.

**Response:**
```json
{
  "current_tier": "contributor",
  "tier_achieved_at": "2025-01-15T10:30:00Z",
  "karma_points": 350,
  "can_accept_paid": false,
  "weekly_paid_limit": null,
  "next_tier": "skilled",
  "meets_requirements": false,
  "at_max_tier": false,
  "progress": {
    "karma": {
      "required": 500,
      "current": 350,
      "met": false
    },
    "accepted_reviews": {
      "required": 25,
      "current": 15,
      "met": false
    },
    "acceptance_rate": {
      "required": 75.0,
      "current": 88.5,
      "met": true
    }
  }
}
```

#### GET /me/karma/history
Get karma transaction history (paginated).

**Query Parameters:**
- `limit`: Number of transactions (1-100, default 50)
- `offset`: Skip N transactions (default 0)

**Response:**
```json
{
  "transactions": [
    {
      "id": 123,
      "action": "review_accepted",
      "points": 30,
      "balance_after": 350,
      "reason": "Review accepted with 4-star rating",
      "related_review_slot_id": 456,
      "created_at": "2025-01-20T14:30:00Z"
    }
  ],
  "total_karma": 350,
  "acceptance_rate": 88.5,
  "accepted_reviews_count": 15,
  "current_streak": 3,
  "longest_streak": 7
}
```

#### GET /me/karma/summary
Get karma statistics summary.

#### GET /me/milestones
Get tier progression history.

#### GET /tiers
Get all tier information (public endpoint).

#### GET /tiers/{tier_name}
Get requirements for specific tier.

#### POST /me/check-promotion
Manually trigger tier promotion check.

### Integration Points

#### 1. Review Slot State Transitions

Karma hooks should be called from the review slot API endpoints:

**On review submission:**
```python
from app.services.review_karma_hooks import award_karma_for_submission

await award_karma_for_submission(db, review_slot)
```

**On review acceptance:**
```python
from app.services.review_karma_hooks import award_karma_for_acceptance

await award_karma_for_acceptance(
    db,
    review_slot,
    is_auto=False,
    helpful_rating=5
)
```

**On review rejection:**
```python
from app.services.review_karma_hooks import deduct_karma_for_rejection

await deduct_karma_for_rejection(db, review_slot)
```

**On dispute resolution:**
```python
from app.services.review_karma_hooks import award_karma_for_dispute_resolution

await award_karma_for_dispute_resolution(db, review_slot, resolution)
```

#### 2. Claim Validation

The ClaimService now automatically checks tier permissions:

```python
from app.services.claim_service import ClaimService, TierPermissionError

try:
    slot = await ClaimService.claim_review_by_request_id(
        db=db,
        review_id=review_id,
        reviewer_id=user.id
    )
except TierPermissionError as e:
    # User's tier doesn't allow this paid review
    raise HTTPException(status_code=403, detail=str(e))
```

#### 3. Expert Application Approval

When an expert application is approved, the user is automatically fast-tracked to MASTER tier:

```python
# This is handled automatically in expert_application_service.py
# When _handle_approval() is called, it:
# 1. Sets expert_application_approved = True
# 2. Awards 15,000 karma (minimum for MASTER)
# 3. Promotes to MASTER tier
# 4. Creates milestone record
```

## Migration

Run the migration to create new tables and add fields:

```bash
alembic upgrade head
```

The migration file is located at:
`/home/user/Critvue/backend/alembic/versions/add_tier_reputation_system.py`

## Testing

### Test Scenarios

1. **Karma Earning**
   - Submit review → Check +5 karma
   - Accept with 5-star → Check +40 karma
   - Reject review → Check -10 karma
   - Daily bonus → Submit first review of day → Check +5 bonus
   - Streak bonus → Submit reviews 5 days in a row → Check +25 bonus

2. **Tier Progression**
   - Start as NOVICE
   - Earn 100 karma + 5 accepted reviews → Auto-promote to CONTRIBUTOR
   - Continue progression through tiers

3. **Paid Review Permissions**
   - As NOVICE/CONTRIBUTOR/SKILLED: Try to claim $10 paid review → Should fail
   - As TRUSTED_ADVISOR: Claim $10 review → Success
   - As TRUSTED_ADVISOR: Try to claim $50 review → Should fail (above tier max)
   - As EXPERT: Claim $50 review → Success

4. **Weekly Limits**
   - As TRUSTED_ADVISOR: Claim 3 paid reviews in a week → Success
   - Try to claim 4th → Should fail (weekly limit)
   - Wait until Monday → Can claim again

5. **Expert Application Fast-Track**
   - Submit expert application
   - Admin approves
   - User immediately promoted to MASTER with 15,000 karma

## Frontend Integration

### Display Tier Badge

Show user's current tier on their profile with progress bar:

```jsx
<TierBadge tier={user.user_tier} />
<ProgressBar
  current={user.karma_points}
  required={nextTierRequirement}
/>
```

### Karma History

Display transaction log with icons and colors:

```jsx
<KarmaTransaction
  action={transaction.action}
  points={transaction.points}
  reason={transaction.reason}
  timestamp={transaction.created_at}
/>
```

### Tier Requirements Page

Show all tiers with requirements and benefits:

```jsx
<TierCard
  tier={tier}
  requirements={requirements}
  benefits={benefits}
  locked={!userMeetsRequirements}
/>
```

### Review Claim Validation

Before allowing claim, check tier permissions:

```jsx
if (review.payment_amount > 0 && !canUserClaimPaidReview(user.tier, review.payment_amount)) {
  showError("Your tier doesn't allow claiming this paid review. Earn more karma to unlock!");
}
```

## Performance Considerations

1. **Acceptance Rate Caching**: Calculated and cached in users table to avoid complex queries
2. **Weekly Claim Count**: Counted on-demand but could be cached if performance is an issue
3. **Karma Transactions**: Indexed by user_id and created_at for fast history queries
4. **Tier Promotion Checks**: Only triggered after karma changes, not on every request

## Security Considerations

1. **Karma Manipulation**: All karma transactions are logged with review_slot_id for audit trail
2. **Tier Permissions**: Checked server-side in ClaimService, cannot be bypassed
3. **Expert Application Fast-Track**: Requires admin approval, sets special flag
4. **Weekly Limits**: Enforced server-side based on claimed_at timestamps

## Future Enhancements

1. **Leaderboard**: Show top karma earners
2. **Achievements**: Special badges for milestones
3. **Karma Decay**: Consider time-based karma decay for inactive users
4. **Tier Demotion**: Auto-demote if acceptance rate drops below threshold
5. **Referral Bonuses**: Award karma for referring new users
6. **Special Events**: 2x karma weekends, etc.

## Files Modified/Created

### Models
- `/home/user/Critvue/backend/app/models/user.py` (modified)
- `/home/user/Critvue/backend/app/models/karma_transaction.py` (new)
- `/home/user/Critvue/backend/app/models/tier_milestone.py` (new)
- `/home/user/Critvue/backend/app/models/__init__.py` (modified)

### Services
- `/home/user/Critvue/backend/app/services/karma_service.py` (new)
- `/home/user/Critvue/backend/app/services/tier_service.py` (new)
- `/home/user/Critvue/backend/app/services/review_karma_hooks.py` (new)
- `/home/user/Critvue/backend/app/services/claim_service.py` (modified)
- `/home/user/Critvue/backend/app/services/expert_application_service.py` (modified)

### API
- `/home/user/Critvue/backend/app/api/v1/tier_system.py` (new)

### Migrations
- `/home/user/Critvue/backend/alembic/versions/add_tier_reputation_system.py` (new)

## Support

For questions or issues with the tier system, contact the development team or refer to this documentation.
