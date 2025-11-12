# Free vs Paid Review Policy

## Quick Comparison

| Feature | Free Reviews | Expert Reviews |
|---------|-------------|----------------|
| **Max Reviews** | 1-3 | 1-10 |
| **Cost** | $0 | $25-100 per review (configurable) |
| **Quality Requirement** | 50+ characters | 200+ characters |
| **Rating Required** | No (optional) | Yes (1-5 stars) |
| **Reviewer Incentive** | Reputation points | Money + reputation |
| **Rejection Impact** | No refund needed | Full refund to requester |
| **Payment Timing** | N/A | Escrow → Release on accept |
| **Auto-Accept** | 7 days | 7 days |
| **Claim Timeout** | 72 hours | 72 hours |
| **Platform Fee** | None | 15% (from reviewer payout) |
| **Dispute Process** | Same | Same |

---

## Free Reviews (Community Reviews)

### Purpose
- Get quick feedback from community
- Multiple perspectives on your work
- No financial barrier to entry
- Build reviewer reputation

### Request Limits
- **Minimum:** 1 review
- **Maximum:** 3 reviews
- **Rationale:** Prevents abuse while allowing diverse feedback

### Quality Standards
- **Minimum length:** 50 characters
- **Rating:** Optional (but encouraged)
- **Attachments:** Optional

### Reviewer Benefits
- Reputation points (to be implemented)
- Portfolio building
- Community engagement
- Access to expert reviewer status (based on reputation)

### Example Use Cases
- Student design projects
- Personal portfolio reviews
- Quick feedback on prototypes
- Learning and skill development

---

## Expert Reviews (Paid Professional Reviews)

### Purpose
- Professional-quality feedback
- Detailed, actionable insights
- Faster turnaround (payment incentive)
- Higher accountability

### Request Limits
- **Minimum:** 1 review
- **Maximum:** 10 reviews
- **Rationale:** Professional service scales to business needs

### Quality Standards
- **Minimum length:** 200 characters (enforced)
- **Rating:** Required (1-5 stars)
- **Attachments:** Recommended (annotated screenshots, etc.)

### Payment Model
```
Requester pays: $25-100 per review (configurable)
Platform fee: 15%
Reviewer receives: 85% of payment

Example:
  Requester pays: $50
  Platform keeps: $7.50 (15%)
  Reviewer gets: $42.50 (85%)
```

### Payment Timing
1. **Request published:** Funds authorized (not charged)
2. **Reviewer claims:** No charge yet
3. **Review submitted:** Funds escrowed (charged, held)
4. **Review accepted:** Funds released to reviewer
5. **Review rejected:** Full refund to requester

### Auto-Accept Protection
- After 7 days, submitted reviews auto-accept
- Payment automatically released to reviewer
- Protects reviewers from indefinite payment limbo

### Example Use Cases
- Startup product validation
- Pre-launch design reviews
- Professional portfolio audits
- Business-critical feedback

---

## Why Different Limits?

### Free: 1-3 Reviews Max

**Prevents Abuse:**
- Stops users from requesting 10+ free reviews on every project
- Reduces spam and low-quality requests
- Protects reviewer time and community goodwill

**Enables Multiple Perspectives:**
- 1 review: Single opinion
- 2-3 reviews: Consensus or diverse viewpoints
- Sweet spot for community feedback

**Platform Health:**
- Keeps free review supply/demand balanced
- Encourages quality over quantity
- Maintains reviewer motivation

### Expert: 1-10 Reviews Max

**Scales to Business Needs:**
- Startups might want 5-10 expert opinions
- Payment justifies higher volume
- Professional use cases need flexibility

**Economic Model:**
- Payment ensures reviewer commitment
- Requesters only pay for accepted reviews
- Platform revenue scales with review count

**Quality Through Incentives:**
- Money motivates thorough reviews
- Rejection risk keeps quality high
- Reputation + payment = best reviewers

---

## Transition Between Free and Expert

### When to Use Free Reviews?

Use free reviews if:
- You're a student or hobbyist
- Budget is $0
- You want quick, casual feedback
- You're testing an early prototype
- You're okay with variable quality

### When to Upgrade to Expert Reviews?

Use expert reviews if:
- You need professional insights
- You're launching a product/business
- You need detailed, actionable feedback
- Time is critical (payment speeds up response)
- You want accountability (rejection/dispute process)

### Mixed Strategy

**You can use both!**
```
Example workflow:
1. Request 2-3 free reviews on initial design
2. Iterate based on free feedback
3. Request 2-5 expert reviews on refined version
4. Launch with confidence
```

---

## Rejection Policy Differences

### Free Review Rejection
- **Allowed:** Yes
- **Refund:** Not applicable (free)
- **Impact:**
  - Reviewer reputation penalty
  - No financial loss to reviewer
- **When to reject:**
  - Spam or copy-paste
  - Completely off-topic
  - Abusive content

### Expert Review Rejection
- **Allowed:** Yes
- **Refund:** Full refund to requester
- **Impact:**
  - Reviewer loses payment
  - Reviewer reputation penalty
  - Can dispute rejection
- **When to reject:**
  - Low quality (< 200 chars, generic feedback)
  - Doesn't address feedback areas
  - Spam or abusive content

**Important:** Both types have 50% lifetime rejection rate limit to prevent abuse.

---

## Quality Enforcement

### Automatic Validation

**Free reviews must have:**
- Minimum 50 characters
- No maximum (but reasonable: 10,000 chars)

**Expert reviews must have:**
- Minimum 200 characters
- Rating: 1-5 stars (required)
- No maximum (encourage detail)

### Soft Quality Indicators

**Reputation bonuses for:**
- Length > 500 characters
- Helpful rating from requester (4-5 stars)
- Attachments (screenshots, annotations)
- Quick turnaround (< 24h)

**Reputation penalties for:**
- Abandoned claims (timeout)
- Rejected reviews
- Disputed reviews (if reviewer loses)

---

## Platform Economics

### Free Reviews
- **Platform cost:** Server, storage, bandwidth
- **Revenue:** $0 direct, but:
  - Builds user base
  - Trains future expert reviewers
  - Creates network effects

### Expert Reviews
- **Platform cost:** Same + payment processing fees
- **Revenue:** 15% of review payments
- **Example:**
  ```
  100 expert reviews/month at $50 avg
  = $5,000 total payments
  = $750 platform revenue (15%)
  = $4,250 to reviewers (85%)
  ```

### Why 15%?
- **Payment processing:** ~3% (Stripe)
- **Platform operation:** ~7% (servers, support)
- **Profit margin:** ~5%
- **Competitive:** Similar to Fiverr (20%), Upwork (20%)

---

## Anti-Abuse Mechanisms

### Requester Abuse Prevention

**Problem:** Requester requests 10 expert reviews, rejects all after reading
**Solutions:**
1. Rejection reason required (enum + notes)
2. 50% lifetime rejection rate limit
3. Account flagged for review if rate > 50%
4. Dispute process (reviewer can challenge)
5. Admin can suspend abusive requesters

**Problem:** Requester requests 10 free reviews on every project
**Solution:**
- Hard limit of 3 max free reviews per request
- No workaround (enforced at schema level)

### Reviewer Abuse Prevention

**Problem:** Reviewer claims 20 slots, submits spam
**Solutions:**
1. Minimum character requirements (50/200)
2. Rejection allowed with valid reasons
3. Claim timeout (72h) prevents squatting
4. Reputation system (to be implemented)
5. Low-reputation reviewers deprioritized

**Problem:** Reviewer disputes all rejections
**Solutions:**
1. Dispute requires 20+ character explanation
2. Admin reviews both sides
3. Frivolous disputes hurt reputation
4. Repeated losing disputes → account flagged

---

## Future Enhancements

### Potential Changes
1. **Tiered expert pricing:**
   - Junior reviewers: $15-25
   - Senior reviewers: $50-75
   - Expert reviewers: $100-150

2. **Free review earn-to-upgrade:**
   - Complete 20 quality free reviews
   - Unlock expert reviewer status
   - Incentivizes community participation

3. **Bulk discounts:**
   - 5+ reviews: 10% discount
   - 10+ reviews: 20% discount

4. **Subscription model:**
   - $50/month: 5 expert reviews included
   - $100/month: 15 expert reviews included

5. **Reviewer specializations:**
   - Design expert: Higher rate
   - Code expert: Higher rate
   - Generalist: Standard rate

---

## Summary: When to Use Each

### Use FREE Reviews When:
- Budget is $0
- You want quick community feedback
- You're learning or experimenting
- You need 1-3 casual opinions
- Quality variance is acceptable

### Use EXPERT Reviews When:
- You have budget ($25-100/review)
- You need professional insights
- You're launching a product
- You want accountability and quality
- You need detailed, actionable feedback
- Time is critical (payment speeds response)

### Best Practice:
Start with free reviews for early feedback, then upgrade to expert reviews for final validation before launch.

---

## Implementation Checklist

- [x] Schema validation (1-3 free, 1-10 expert)
- [x] Payment fields in ReviewSlot model
- [x] Quality thresholds (50 vs 200 chars)
- [ ] Payment integration (Stripe)
- [ ] Rejection rate tracking
- [ ] Reputation system
- [ ] Admin dashboard for flagged users
- [ ] UI differentiation (free vs expert badges)
