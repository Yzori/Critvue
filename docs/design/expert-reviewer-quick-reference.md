# Expert Reviewer System - Quick Reference

## Tier Progression at a Glance

```
🌱 BEGINNER
   ↓ (10 reviews, 85% acceptance, 4.0 rating)
⭐ INTERMEDIATE
   ↓ (30 reviews, 15 paid, 90% acceptance, 4.3 rating)
💎 EXPERT
   ↓ (100 reviews, 50 paid, 93% acceptance, 4.5 rating)
👑 MASTER
   ↓ (250 reviews, 100 paid, 95% acceptance, 4.7 rating)
🏆 ELITE
```

## Tier Benefits

| Tier | Can Do | Pay Split | Access |
|------|--------|-----------|--------|
| 🌱 Beginner | Free reviews only | N/A | Public marketplace |
| ⭐ Intermediate | Entry paid reviews | 70% | $5-15 reviews |
| 💎 Expert | Mid-tier reviews | 75% | $15-50 reviews + priority |
| 👑 Master | High-value reviews | 78% | $50-200 reviews + custom |
| 🏆 Elite | Premium + custom rates | 80% | $200+ + concierge matching |

## Quality Score Dimensions

Reviews are rated on 5 dimensions (1-5 scale each):

1. **📋 Thoroughness** - How comprehensive
2. **🎯 Accuracy** - Technical correctness
3. **💡 Clarity** - How understandable
4. **✅ Actionability** - How useful/specific
5. **🤝 Professionalism** - Tone and delivery

**Composite Quality Score** = Weighted average (0-100)
- Weights: Thoroughness 25%, Accuracy 25%, Clarity 20%, Actionability 20%, Professionalism 10%

## Payout Calculation

```python
Base Payout = Budget × Tier Commission Rate

Bonuses:
+ 5%  if completed 24h early
+ 10% if rated exceptional (all 5s)
+ 5%  if creator's first review

Total = Base + Bonuses
```

**Example** (Expert tier, $50 budget):
```
Base:    $50 × 75% = $37.50
Fast:    +5%        = +$1.88
Rating:  +10%       = +$3.75
────────────────────────────
Total:              $43.13
Platform fee:       $6.87
```

## Matching Score Components

**Total: 100 points**

- **Specialty Match** (25 pts): Required skills + content type alignment
- **Tier Qualification** (20 pts): Meets minimum tier, bonus for higher tiers
- **Performance Quality** (20 pts): Acceptance rate + average rating
- **Availability** (15 pts): Current capacity + response time
- **Budget Fit** (10 pts): Matches reviewer rate preferences
- **Workload Balance** (10 pts): Fairness mechanism, favor less active

**Match Score ≥ 80** → Auto-assign eligible

## Key Performance Metrics

### For Reviewers
- **Acceptance Rate**: % of submitted reviews accepted (target: 90%+)
- **Average Rating**: Mean helpful rating from creators (target: 4.3+)
- **Response Time**: Hours from claim to submit (target: <48h)
- **Exceptional Rate**: % of 5-star reviews (target: 25%+)

### For Platform
- **Time to Claim**: Hours until review claimed (target: <4h)
- **Reviewer Distribution**: 40% Int, 30% Exp, 20% Mas, 10% Eli
- **Quality Score**: Platform average (target: 85+)
- **Dispute Rate**: % of reviews disputed (target: <5%)

## Advancement Checklist

### Beginner → Intermediate
- [ ] Complete 10 free reviews
- [ ] Acceptance rate ≥ 85%
- [ ] Average rating ≥ 4.0
- [ ] Profile 80% complete
- [ ] Account age ≥ 14 days
- [ ] Zero spam/abuse reports

### Intermediate → Expert
- [ ] Complete 30 total reviews
- [ ] Complete 15 paid reviews
- [ ] Acceptance rate ≥ 90%
- [ ] Average rating ≥ 4.3
- [ ] Response time ≤ 48 hours
- [ ] Profile 90% complete
- [ ] 2+ verified specialties
- [ ] Portfolio with 3+ examples
- **Manual**: Admin approval required

### Expert → Master
- [ ] Complete 100 total reviews
- [ ] Complete 50 expert reviews
- [ ] Acceptance rate ≥ 93%
- [ ] Average rating ≥ 4.5
- [ ] Response time ≤ 36 hours
- [ ] 25%+ reviews are 5-star
- [ ] 3+ verified specialties
- [ ] 10+ exceptional review badges
- [ ] 5+ creator testimonials
- **Manual**: Nomination + admin review

### Master → Elite
- [ ] Complete 250 total reviews
- [ ] Complete 100 master reviews
- [ ] Acceptance rate ≥ 95%
- [ ] Average rating ≥ 4.7
- [ ] Response time ≤ 24 hours
- [ ] 40%+ reviews are 5-star
- [ ] 5+ verified specialties
- [ ] Top 5% in specialty
- [ ] Industry recognition
- [ ] Mentored 3+ reviewers
- **Manual**: Invitation only + board approval

## Warning System

### Level 1: Informational
- Email notification with improvement tips
- No tier impact
- **Trigger**: Single metric slightly below threshold

### Level 2: Probation
- 30-day improvement period
- Visible on profile
- Cannot advance tiers
- **Trigger**: Multiple metrics below threshold OR sustained decline

### Level 3: Demotion
- Automatic tier demotion
- Must re-qualify
- **Trigger**: Probation period ends without improvement

## Demotion Triggers

**Performance Decline**:
- Acceptance rate below tier minimum for 60 days
- Quality score drops below threshold
- Multiple disputes in short timeframe

**Inactivity**:
- Beginner/Intermediate: 90 days → inactive
- Expert: 90 days → demotion
- Master/Elite: 90 days → status review

## Specialty Verification Levels

1. **Self-Declared** (Beginner) - Select up to 5 tags, no verification
2. **Portfolio Verified** (Intermediate) - Admin reviews work samples
3. **Credential Verified** (Expert+) - LinkedIn, certs, published work
4. **Peer Endorsed** (Master+) - 3+ endorsements from Expert+ peers
5. **Platform Expert** (Elite) - Admin grants based on exceptional quality

## Database Tables Summary

### Core Tables
- **reviewer_profiles** - Tier, metrics, status
- **reviewer_tier_history** - Audit trail of tier changes
- **review_quality_feedback** - Multi-dimensional ratings
- **reviewer_specialties** - Skills and verification (Phase 2)
- **reviewer_badges** - Achievements and recognition (Phase 6)

### Key Indexes
- `idx_reviewer_tier` - Fast tier filtering
- `idx_reviewer_active` - Active reviewer queries
- `idx_reviewer_performance` - Matching algorithm
- `idx_tier_history_profile` - History lookups

## API Endpoints (Phase 1)

### Reviewer Profile
```
GET    /api/v1/reviewer/profile          - Get own profile
PUT    /api/v1/reviewer/profile          - Update preferences
GET    /api/v1/reviewer/tier-progress    - Check advancement progress
GET    /api/v1/reviewer/tier-history     - View tier change history
```

### Quality Feedback
```
POST   /api/v1/reviews/{slot_id}/quality-feedback  - Submit quality rating
GET    /api/v1/reviews/{slot_id}/quality-feedback  - View quality feedback
```

### Admin
```
POST   /api/v1/admin/reviewers/{id}/promote       - Manual tier promotion
POST   /api/v1/admin/reviewers/{id}/demote        - Manual tier demotion
POST   /api/v1/admin/reviewers/{id}/probation     - Place on probation
GET    /api/v1/admin/reviewers/pending-promotion  - Review promotion applications
```

## Background Jobs

### Daily Jobs
- **Process Expired Claims** - Mark abandoned slots
- **Process Auto-Accepts** - Release payments after 7 days
- **Calculate Reviewer Metrics** - Update cached performance stats

### Weekly Jobs
- **Check Tier Eligibility** - Auto-promote qualified reviewers
- **Quality Monitoring** - Flag declining performance
- **Payout Processing** - Weekly payouts for balances ≥$50

### Monthly Jobs
- **Inactivity Check** - Flag/demote inactive reviewers
- **Tier Distribution Analysis** - Ensure healthy distribution
- **Elite Reviewer Nominations** - Identify candidates

## Implementation Timeline

### Phase 1: Foundation (3 weeks)
Database schema, tier system, quality tracking

### Phase 2: Specialties (3 weeks)
Specialty verification, portfolio uploads

### Phase 3: Matching (3 weeks)
Recommendation engine, smart filtering

### Phase 4: Payouts (2 weeks)
Tiered commissions, bonuses

### Phase 5: Quality Assurance (3 weeks)
Monitoring, warnings, improvement plans

### Phase 6: Gamification (2 weeks)
Badges, leaderboards, achievements

### Phase 7: Premium Features (2 weeks)
Auto-assignment, custom rates

**Total: 18 weeks (4.5 months) for full system**

**MVP: 6 weeks** (Phases 1-2)

## Success Metrics Dashboard

Track these KPIs weekly:

```
Reviewer Health:
├─ Active Reviewers: [target: growing]
├─ Tier Distribution: [40/30/20/10]
├─ Avg Quality Score: [target: 85+]
└─ Retention Rate: [target: 70%]

Economic Health:
├─ Avg Reviewer Earnings: [target: $50-100/review]
├─ Platform Revenue: [sustainable 20-30%]
├─ Creator Satisfaction: [target: 4.5+]
└─ Dispute Rate: [target: <5%]

Matching Efficiency:
├─ Time to Claim: [target: <4h]
├─ Match Score Avg: [target: 75+]
├─ Recommendation CTR: [target: 60%+]
└─ Auto-Assign Success: [target: 90%+]
```

## Risk Mitigation Checklist

- [ ] Quality monitoring prevents decline at scale
- [ ] Fairness mechanisms prevent monopolization
- [ ] Multi-dimensional metrics resist gaming
- [ ] Dispute system protects both parties
- [ ] Tier criteria prevent inflation
- [ ] Probation catches issues early
- [ ] Admin oversight for edge cases
- [ ] Creator reputation tracking (future)

## Quick Decision Matrix

### When to Auto-Promote?
✅ Metrics clearly exceed thresholds
✅ Beginner → Intermediate
❌ Intermediate → Expert (manual review)
❌ Expert → Master (nomination)
❌ Master → Elite (invitation)

### When to Warn Reviewer?
✅ Single metric slightly below threshold
✅ First-time decline
❌ Probation period active
❌ Recent warning (<30 days)

### When to Place on Probation?
✅ Multiple metrics below threshold
✅ Sustained decline (2+ weeks)
✅ Pattern of low-quality reviews
❌ Single bad review
❌ External factors (illness, emergency)

### When to Demote?
✅ Probation period ends without improvement
✅ Severe quality violations
✅ Fraud/abuse
❌ During probation improvement period
❌ Without warning (except abuse)

## Common Questions

**Q: Can reviewers skip tiers?**
A: No. Must progress sequentially: Beginner → Intermediate → Expert → Master → Elite

**Q: What happens to earnings if demoted?**
A: Keep all past earnings. Future reviews at new tier commission rate.

**Q: Can demoted reviewers regain previous tier?**
A: Yes, but must re-meet all criteria. 50% reduced requirements if previously held tier.

**Q: How long does manual review take?**
A: Target 5 business days for promotion applications, 2 business days for disputes.

**Q: Can reviewers be both creator and reviewer?**
A: Yes! Accounts can have both roles. Separate profiles and permissions.

**Q: What prevents fake 5-star ratings?**
A: Multi-dimensional ratings harder to game, admin spot-checks, pattern detection, peer review for disputes.

---

**Full Documentation**: See `/docs/design/expert-reviewer-system.md`
**Implementation Guide**: See `/docs/implementation/expert-reviewer-phase1-guide.md`
