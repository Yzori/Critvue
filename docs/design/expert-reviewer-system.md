# Expert Reviewer System Design - Critvue

## Table of Contents
1. [System Overview](#system-overview)
2. [Qualification Criteria & Progression](#qualification-criteria--progression)
3. [Database Schema](#database-schema)
4. [Matching Algorithm](#matching-algorithm)
5. [Payout System](#payout-system)
6. [Quality Assurance](#quality-assurance)
7. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

### Philosophy
The Critvue Expert Reviewer System is designed to:
- **Progressively build trust** through measurable performance metrics
- **Reward quality over quantity** while encouraging consistent engagement
- **Create sustainable earning opportunities** for skilled reviewers
- **Protect creators** with quality guarantees and fair dispute resolution
- **Scale gracefully** from 10 to 10,000 reviewers

### Core Principles
1. **Fairness First**: Transparent criteria, explainable decisions
2. **Data-Driven**: Performance metrics drive advancement
3. **Merit-Based**: Skills and quality matter more than tenure
4. **Gamified Engagement**: Progress feels rewarding without compromising quality
5. **Economic Balance**: Reviewers earn well, creators get value, platform sustains

---

## Qualification Criteria & Progression

### 1. Tier System

We propose a **5-tier progression system** that balances accessibility with expertise:

```
BEGINNER → INTERMEDIATE → EXPERT → MASTER → ELITE
```

#### Tier Definitions

| Tier | Badge | Description | Access Level |
|------|-------|-------------|--------------|
| **Beginner** | 🌱 | New reviewers, free reviews only | Free reviews only |
| **Intermediate** | ⭐ | Proven quality, entry to paid market | Low-tier expert reviews ($5-15) |
| **Expert** | 💎 | Established expertise, specialized skills | Mid-tier expert reviews ($15-50) |
| **Master** | 👑 | Top performers, domain authority | High-tier expert reviews ($50-200) |
| **Elite** | 🏆 | Platform ambassadors, proven excellence | Premium reviews ($200+), custom rates |

### 2. Advancement Criteria

#### Beginner → Intermediate
**Objective**: Prove basic competence and reliability

**Required Metrics**:
- Minimum 10 free reviews completed
- Acceptance rate ≥ 85%
- Average helpful rating ≥ 4.0/5.0
- Zero spam/abuse reports
- Account age ≥ 14 days

**Skill Requirements**:
- At least 3 specialty tags selected
- Profile completion ≥ 80% (bio, title, avatar, portfolio links)

**Verification**:
- Automatic qualification when criteria met
- Optional: Admin review of sample reviews for quality spot-check

---

#### Intermediate → Expert
**Objective**: Demonstrate consistent quality and specialization

**Required Metrics**:
- Minimum 30 total reviews completed (free + paid)
- At least 15 accepted paid reviews
- Acceptance rate ≥ 90%
- Average helpful rating ≥ 4.3/5.0
- Average response time ≤ 48 hours
- Zero successful disputes against them
- Active reviewer (at least 1 review per 30 days)

**Skill Requirements**:
- Verified expertise in at least 2 specialty domains
- Portfolio with 3+ examples of quality work
- Bio demonstrates domain knowledge (min 200 characters)

**Verification**:
- Automatic eligibility when metrics met
- Manual application with portfolio review
- Admin approves based on:
  - Review quality (sample 5 reviews for depth, clarity, actionability)
  - Specialty knowledge validation (portfolio/credentials)
  - Communication professionalism

**Probation Period**: 30 days - If acceptance rate drops below 85% or avg rating below 4.0, demotion to Intermediate

---

#### Expert → Master
**Objective**: Establish domain authority and exceptional quality

**Required Metrics**:
- Minimum 100 total reviews completed
- At least 50 accepted expert-tier reviews
- Acceptance rate ≥ 93%
- Average helpful rating ≥ 4.5/5.0
- Average response time ≤ 36 hours
- Zero successful disputes in last 90 days
- Active reviewer (at least 2 reviews per 30 days)
- At least 25% of reviews receive 5-star helpful ratings

**Skill Requirements**:
- Verified expertise in at least 3 specialty domains
- Published portfolio demonstrating mastery (min 5 examples)
- Received "Exceptional Review" badges at least 10 times
- Testimonials from at least 5 satisfied creators

**Verification**:
- Nomination-based (self-nomination or creator nomination)
- Admin panel review:
  - Deep dive into 10 recent reviews for quality, depth, insight
  - Portfolio validation (work samples, credentials, LinkedIn)
  - Reputation check (creator feedback, community standing)
- Interview optional for borderline cases

**Probation Period**: 60 days - If metrics drop below Expert thresholds, demotion with 30-day improvement plan

---

#### Master → Elite
**Objective**: Platform ambassadors, thought leaders, premium tier

**Required Metrics**:
- Minimum 250 total reviews completed
- At least 100 accepted master-tier reviews
- Acceptance rate ≥ 95%
- Average helpful rating ≥ 4.7/5.0
- Average response time ≤ 24 hours
- Zero successful disputes in last 180 days
- Consistent activity (at least 5 reviews per 30 days)
- At least 40% of reviews receive 5-star helpful ratings
- Top 5% of reviewers in their specialty

**Skill Requirements**:
- Recognized expert in at least 5 specialty domains
- Published work, speaking engagements, or industry recognition
- Mentored at least 3 lower-tier reviewers
- Contributed to platform improvement (feature suggestions, content)

**Verification**:
- Invitation-only (admin identifies candidates quarterly)
- Rigorous review process:
  - Portfolio showcasing elite-level work
  - Reference checks with past creators
  - Review of community contributions
  - Optional video interview to assess expertise
- Board approval (requires 2/3 admin consensus)

**Tenure**: Permanent status unless gross violations (abuse, fraud). Quarterly performance reviews ensure standards maintained.

---

### 3. Demotion & Re-qualification

#### Performance Decline Triggers
- **Acceptance rate drops**:
  - Below tier minimum for 30 consecutive days
  - Automatic probation warning
  - Below tier minimum for 60 days → demotion

- **Quality decline**:
  - Average rating drops below tier minimum
  - Pattern of rushed/low-effort reviews
  - Multiple disputes in short timeframe

- **Inactivity**:
  - Beginner/Intermediate: 90 days → account flagged as inactive
  - Expert: 60 days → warning, 90 days → demotion
  - Master/Elite: 45 days → warning, 90 days → review status

#### Re-qualification Process
- Reviewers can climb back up tiers
- Must re-meet all criteria for advancement
- Previous tier history visible (e.g., "Former Master" badge)
- Faster track if previously held higher tier (50% reduced review requirements)

---

### 4. Specialty Verification System

#### Domain Categories
```
DESIGN:
- UI/UX Design
- Visual Design
- Product Design
- Design Systems
- Mobile Design
- Accessibility Design

CODE:
- Frontend (React, Vue, Angular)
- Backend (Node.js, Python, Java, Go)
- Full Stack
- Mobile (iOS, Android, React Native)
- DevOps/Cloud
- Database Design
- Security
- Performance Optimization

VIDEO/AUDIO:
- Video Editing
- Motion Graphics
- Audio Production
- Sound Design
- Color Grading

WRITING:
- Content Writing
- Copywriting
- Technical Writing
- UX Writing
- Documentation

ART:
- Digital Art
- 3D Modeling
- Animation
- Illustration
- Game Art

CONTENT STRATEGY:
- Marketing
- SEO
- Social Media
- Branding
```

#### Verification Methods

**Level 1: Self-Declaration** (Beginner)
- Reviewer selects up to 5 tags
- No verification required
- Shown as "Self-identified"

**Level 2: Portfolio Verification** (Intermediate)
- Reviewer uploads work samples
- Admin reviews for relevance and quality
- Badge: "Portfolio Verified"

**Level 3: Credential Verification** (Expert+)
- Professional credentials (LinkedIn, certificates, degrees)
- Published work (GitHub, Dribbble, Behance, Medium)
- Employment verification
- Badge: "Credential Verified"

**Level 4: Peer Endorsement** (Master+)
- Other verified experts endorse skills
- Requires 3+ endorsements from Expert+ reviewers
- Badge: "Peer Endorsed"

**Level 5: Platform Recognition** (Elite)
- Admin grants "Platform Expert" status
- Based on exceptional review quality in domain
- Badge: "Platform Expert"

---

## Database Schema

### New Tables

#### 1. `reviewer_profiles` table
```sql
CREATE TABLE reviewer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Tier & Status
    tier VARCHAR(20) NOT NULL DEFAULT 'beginner',
        -- Values: 'beginner', 'intermediate', 'expert', 'master', 'elite'
    tier_since TIMESTAMP NOT NULL DEFAULT NOW(),
    previous_tier VARCHAR(20),
    tier_downgraded_at TIMESTAMP,

    -- Qualification Status
    is_active_reviewer BOOLEAN DEFAULT TRUE,
    is_accepting_reviews BOOLEAN DEFAULT TRUE,
    last_review_at TIMESTAMP,

    -- Performance Metrics (cached for quick access)
    total_reviews_completed INTEGER DEFAULT 0,
    total_paid_reviews INTEGER DEFAULT 0,
    acceptance_rate NUMERIC(5,4), -- 0.0000 to 1.0000
    average_helpful_rating NUMERIC(3,2), -- 1.00 to 5.00
    avg_response_time_hours INTEGER,

    -- Quality Indicators
    exceptional_review_count INTEGER DEFAULT 0, -- 5-star ratings
    total_earnings NUMERIC(12,2) DEFAULT 0.00,
    dispute_count INTEGER DEFAULT 0,
    successful_dispute_count INTEGER DEFAULT 0, -- Disputes won by creator

    -- Probation/Warning System
    on_probation BOOLEAN DEFAULT FALSE,
    probation_started_at TIMESTAMP,
    probation_reason TEXT,
    warning_count INTEGER DEFAULT 0,
    last_warning_at TIMESTAMP,

    -- Activity Tracking
    reviews_this_month INTEGER DEFAULT 0,
    reviews_last_30_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,

    -- Profile Completeness
    profile_completeness_pct INTEGER DEFAULT 0,
    has_portfolio BOOLEAN DEFAULT FALSE,
    portfolio_reviewed BOOLEAN DEFAULT FALSE,

    -- Rate Settings (for Expert+ tiers)
    hourly_rate NUMERIC(10,2), -- Optional custom rate
    minimum_rate NUMERIC(10,2), -- Minimum acceptable rate
    preferred_budget_range JSONB, -- e.g., {"min": 50, "max": 200}

    -- Preferences
    preferred_content_types JSONB, -- Array of content types
    preferred_review_complexity JSONB, -- ["simple", "moderate", "complex"]
    auto_accept_reviews BOOLEAN DEFAULT FALSE, -- Auto-claim matching reviews

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE INDEX idx_reviewer_tier ON reviewer_profiles(tier);
CREATE INDEX idx_reviewer_active ON reviewer_profiles(is_active_reviewer, is_accepting_reviews);
CREATE INDEX idx_reviewer_performance ON reviewer_profiles(tier, acceptance_rate, average_helpful_rating);
```

#### 2. `reviewer_specialties` table
```sql
CREATE TABLE reviewer_specialties (
    id SERIAL PRIMARY KEY,
    reviewer_profile_id INTEGER NOT NULL REFERENCES reviewer_profiles(id) ON DELETE CASCADE,

    -- Specialty Details
    specialty_name VARCHAR(100) NOT NULL,
    specialty_category VARCHAR(50) NOT NULL, -- 'design', 'code', 'video', etc.

    -- Verification Level
    verification_level VARCHAR(20) DEFAULT 'self_declared',
        -- Values: 'self_declared', 'portfolio_verified', 'credential_verified',
        --         'peer_endorsed', 'platform_expert'
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id), -- Admin who verified

    -- Supporting Evidence
    portfolio_urls JSONB, -- Array of URLs
    credentials JSONB, -- Certificates, degrees, etc.
    endorsement_count INTEGER DEFAULT 0,

    -- Performance in Specialty
    reviews_in_specialty INTEGER DEFAULT 0,
    avg_rating_in_specialty NUMERIC(3,2),

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(reviewer_profile_id, specialty_name)
);

CREATE INDEX idx_specialty_category ON reviewer_specialties(specialty_category);
CREATE INDEX idx_specialty_verified ON reviewer_specialties(verification_level);
```

#### 3. `reviewer_badges` table
```sql
CREATE TABLE reviewer_badges (
    id SERIAL PRIMARY KEY,
    reviewer_profile_id INTEGER NOT NULL REFERENCES reviewer_profiles(id) ON DELETE CASCADE,

    -- Badge Details
    badge_type VARCHAR(50) NOT NULL,
        -- Values: 'exceptional_reviewer', 'fast_responder', 'specialist',
        --         'mentor', 'rising_star', 'trusted_expert', 'top_earner'
    badge_name VARCHAR(100) NOT NULL,
    badge_description TEXT,
    badge_icon VARCHAR(50), -- Emoji or icon identifier

    -- Qualification
    earned_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- Some badges expire (e.g., monthly top performer)
    is_active BOOLEAN DEFAULT TRUE,

    -- Criteria Met
    criteria_snapshot JSONB, -- What criteria were met when earned

    -- Display
    display_order INTEGER DEFAULT 0, -- For profile display
    is_featured BOOLEAN DEFAULT FALSE, -- Show prominently

    UNIQUE(reviewer_profile_id, badge_type, earned_at)
);

CREATE INDEX idx_badge_active ON reviewer_badges(reviewer_profile_id, is_active);
```

#### 4. `reviewer_tier_history` table
```sql
CREATE TABLE reviewer_tier_history (
    id SERIAL PRIMARY KEY,
    reviewer_profile_id INTEGER NOT NULL REFERENCES reviewer_profiles(id) ON DELETE CASCADE,

    -- Change Details
    from_tier VARCHAR(20),
    to_tier VARCHAR(20) NOT NULL,
    change_type VARCHAR(20) NOT NULL, -- 'promotion', 'demotion', 'reinstatement'

    -- Reason & Context
    reason TEXT,
    triggered_by VARCHAR(20), -- 'automatic', 'admin_review', 'performance', 'inactivity'
    admin_notes TEXT,
    changed_by INTEGER REFERENCES users(id), -- Admin who made change

    -- Metrics at Time of Change
    metrics_snapshot JSONB, -- Performance metrics when change occurred

    -- Timestamp
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tier_history_profile ON reviewer_tier_history(reviewer_profile_id, changed_at);
```

#### 5. `reviewer_endorsements` table
```sql
CREATE TABLE reviewer_endorsements (
    id SERIAL PRIMARY KEY,
    reviewer_profile_id INTEGER NOT NULL REFERENCES reviewer_profiles(id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES reviewer_specialties(id) ON DELETE CASCADE,

    -- Endorser
    endorsed_by INTEGER NOT NULL REFERENCES users(id),
    endorser_tier VARCHAR(20), -- Tier of endorser at time of endorsement

    -- Endorsement Details
    endorsement_text TEXT,
    strength VARCHAR(20) DEFAULT 'standard', -- 'standard', 'strong', 'exceptional'

    -- Validation
    is_verified BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(reviewer_profile_id, specialty_id, endorsed_by)
);

CREATE INDEX idx_endorsement_specialty ON reviewer_endorsements(specialty_id);
```

#### 6. `review_assignment_preferences` table
```sql
CREATE TABLE review_assignment_preferences (
    id SERIAL PRIMARY KEY,
    reviewer_profile_id INTEGER NOT NULL REFERENCES reviewer_profiles(id) ON DELETE CASCADE,

    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    availability_hours_per_week INTEGER,
    max_concurrent_reviews INTEGER DEFAULT 3,

    -- Timezone & Schedule
    timezone VARCHAR(50),
    preferred_hours JSONB, -- e.g., {"mon": ["9-17"], "tue": ["9-17"]}

    -- Content Preferences
    preferred_content_types JSONB, -- ['design', 'code', 'video']
    excluded_content_types JSONB,
    min_budget NUMERIC(10,2),
    max_budget NUMERIC(10,2),

    -- Complexity Preferences
    preferred_complexity JSONB, -- ['simple', 'moderate', 'complex']

    -- Auto-Assignment Settings
    enable_auto_assignment BOOLEAN DEFAULT FALSE,
    auto_assignment_limit INTEGER DEFAULT 1, -- Max auto-assignments per day

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(reviewer_profile_id)
);
```

#### 7. `review_quality_feedback` table
```sql
-- Extends review_slots with detailed quality feedback
CREATE TABLE review_quality_feedback (
    id SERIAL PRIMARY KEY,
    review_slot_id INTEGER NOT NULL REFERENCES review_slots(id) ON DELETE CASCADE,

    -- Multi-dimensional Quality Ratings (1-5 scale)
    thoroughness_rating INTEGER, -- How complete/comprehensive
    accuracy_rating INTEGER, -- Technical correctness
    clarity_rating INTEGER, -- How clear/understandable
    actionability_rating INTEGER, -- How actionable/useful
    professionalism_rating INTEGER, -- Tone and delivery

    -- Overall Impact
    would_recommend_reviewer BOOLEAN,
    exceptional_review BOOLEAN DEFAULT FALSE, -- Flag for outstanding reviews

    -- Qualitative Feedback
    feedback_text TEXT,
    private_notes TEXT, -- Creator's private notes (not shown to reviewer)

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(review_slot_id)
);

CREATE INDEX idx_quality_exceptional ON review_quality_feedback(exceptional_review);
```

### Modified Tables

#### Updates to `review_slots`
```sql
-- Add columns to existing review_slots table
ALTER TABLE review_slots
    ADD COLUMN reviewer_tier VARCHAR(20), -- Tier at time of claim
    ADD COLUMN complexity_level VARCHAR(20), -- 'simple', 'moderate', 'complex'
    ADD COLUMN estimated_hours NUMERIC(4,2), -- Estimated review time
    ADD COLUMN actual_hours NUMERIC(4,2), -- Actual time spent
    ADD COLUMN quality_score NUMERIC(4,2); -- Computed quality score (0-100)

CREATE INDEX idx_slot_reviewer_tier ON review_slots(reviewer_tier);
```

#### Updates to `review_requests`
```sql
-- Add columns to existing review_requests table
ALTER TABLE review_requests
    ADD COLUMN preferred_reviewer_tier VARCHAR(20), -- Min tier requested
    ADD COLUMN required_specialties JSONB, -- Array of required specialty tags
    ADD COLUMN complexity_level VARCHAR(20), -- 'simple', 'moderate', 'complex'
    ADD COLUMN estimated_review_hours NUMERIC(4,2); -- Creator's estimate

CREATE INDEX idx_request_tier_specialty ON review_requests(preferred_reviewer_tier, content_type);
```

---

## Matching Algorithm

### Overview
The matching algorithm balances three competing priorities:
1. **Quality optimization** - Match the best reviewer for each request
2. **Fair distribution** - Ensure all qualified reviewers get opportunities
3. **Efficiency** - Minimize time to assignment, maximize throughput

### Matching Strategies

We propose a **hybrid approach** with three modes:

#### Mode 1: Manual Browse (Current)
- Reviewers browse marketplace and self-select
- Algorithm provides smart filtering and recommendations
- Best for: Lower volume, reviewer autonomy preference

#### Mode 2: Smart Recommendations
- System suggests optimal matches to reviewers
- Reviewers can accept/decline
- Best for: Medium volume, balance autonomy and efficiency

#### Mode 3: Auto-Assignment (High Tier Only)
- System automatically assigns to opted-in reviewers
- Reviewers can configure preferences and auto-accept rules
- Best for: High volume, trusted Expert+ reviewers

### Matching Score Calculation

For each (ReviewRequest, Reviewer) pair, compute a match score (0-100):

```python
def calculate_match_score(request, reviewer):
    score = 0
    weights = {
        'specialty_match': 25,
        'tier_qualification': 20,
        'performance_quality': 20,
        'availability': 15,
        'budget_fit': 10,
        'workload_balance': 10
    }

    # 1. Specialty Match (0-25 points)
    specialty_score = 0
    if request.required_specialties:
        matched_specialties = set(request.required_specialties) & set(reviewer.verified_specialties)
        specialty_score = (len(matched_specialties) / len(request.required_specialties)) * 25
    else:
        # Content type match
        if request.content_type in reviewer.preferred_content_types:
            specialty_score = 20
        elif request.content_type not in reviewer.excluded_content_types:
            specialty_score = 10

    # 2. Tier Qualification (0-20 points)
    tier_scores = {'beginner': 0, 'intermediate': 5, 'expert': 12, 'master': 18, 'elite': 20}
    min_tier_required = request.preferred_reviewer_tier or 'intermediate'

    if meets_tier_requirement(reviewer.tier, min_tier_required):
        tier_score = tier_scores[reviewer.tier]
    else:
        return 0  # Disqualified

    # 3. Performance Quality (0-20 points)
    # Normalize acceptance rate and rating to 0-20 scale
    acceptance_score = reviewer.acceptance_rate * 10  # Max 10 points
    rating_score = ((reviewer.average_helpful_rating - 1) / 4) * 10  # Max 10 points
    performance_score = acceptance_score + rating_score

    # 4. Availability (0-15 points)
    availability_score = 0
    if reviewer.is_accepting_reviews:
        current_load = reviewer.current_claimed_slots
        max_load = reviewer.max_concurrent_reviews
        capacity = 1 - (current_load / max_load)

        # Favor reviewers with more capacity
        availability_score = capacity * 15

        # Bonus for fast responders
        if reviewer.avg_response_time_hours <= 24:
            availability_score = min(15, availability_score + 3)

    # 5. Budget Fit (0-10 points)
    budget_score = 0
    if request.budget:
        if reviewer.minimum_rate and request.budget >= reviewer.minimum_rate:
            # Perfect fit if budget in preferred range
            if (reviewer.preferred_budget_range and
                reviewer.preferred_budget_range['min'] <= request.budget <= reviewer.preferred_budget_range['max']):
                budget_score = 10
            else:
                budget_score = 7
        else:
            budget_score = 0  # Budget below minimum

    # 6. Workload Balance (0-10 points)
    # Favor reviewers with fewer recent reviews (fairness mechanism)
    reviews_last_7_days = reviewer.reviews_completed_last_7_days
    avg_reviews_platform = get_platform_avg_reviews_last_7_days()

    if reviews_last_7_days < avg_reviews_platform:
        balance_score = 10  # Give priority to less active reviewers
    elif reviews_last_7_days < avg_reviews_platform * 1.5:
        balance_score = 6
    else:
        balance_score = 3  # De-prioritize very active reviewers

    # Calculate weighted total
    total_score = (
        specialty_score * (weights['specialty_match'] / 25) +
        tier_score * (weights['tier_qualification'] / 20) +
        performance_score * (weights['performance_quality'] / 20) +
        availability_score * (weights['availability'] / 15) +
        budget_score * (weights['budget_fit'] / 10) +
        balance_score * (weights['workload_balance'] / 10)
    )

    return round(total_score, 2)
```

### Assignment Workflow

#### Phase 1: Filtering
```sql
SELECT reviewer_profiles.*
FROM reviewer_profiles
JOIN review_assignment_preferences ON reviewer_profiles.id = preferences.reviewer_profile_id
WHERE
    -- Active and accepting reviews
    is_active_reviewer = TRUE
    AND is_accepting_reviews = TRUE
    AND NOT on_probation

    -- Tier qualification
    AND tier >= request.preferred_reviewer_tier

    -- Capacity check
    AND current_claimed_slots < preferences.max_concurrent_reviews

    -- Content type match
    AND (
        preferences.preferred_content_types IS NULL
        OR request.content_type = ANY(preferences.preferred_content_types)
    )
    AND (
        preferences.excluded_content_types IS NULL
        OR request.content_type != ALL(preferences.excluded_content_types)
    )

    -- Budget fit
    AND (
        preferences.min_budget IS NULL
        OR request.budget >= preferences.min_budget
    )
```

#### Phase 2: Scoring & Ranking
- Calculate match score for each qualified reviewer
- Rank by score descending
- Apply diversity filters (avoid same reviewer getting all similar requests)

#### Phase 3: Assignment
```
Top-N Recommendation Strategy:
- Show top 10 matches to reviewer (if recommendations enabled)
- Show top 20 in marketplace browse (sorted by match score)
- Auto-assign to #1 match if auto-assignment enabled AND score > 80
```

### Fairness Mechanisms

#### 1. Round-Robin Rotation
- Track "last_assigned_at" for each reviewer
- Within same score band (e.g., 85-90), rotate assignments
- Prevents same top reviewers monopolizing all work

#### 2. New Reviewer Boost
- Reviewers with <10 reviews get +5 point bonus
- Helps new reviewers build portfolio

#### 3. Streak Protection
- Reviewers on long streaks get slight priority to maintain streaks
- Prevents accidental streak breaks due to low match scores

#### 4. Specialty Diversification
- If reviewer has completed 5+ consecutive reviews in same specialty, de-prioritize for that specialty (encourage diversification)

---

## Payout System

### Commission Structure

#### Base Commission Split
```
Standard Model:
- Reviewer: 75%
- Platform: 25%

Premium Model (Expert+ with custom rates):
- Reviewer: 80%
- Platform: 20%
```

#### Dynamic Commission Tiers
Allow commission to vary by tier for incentive structure:

| Tier | Reviewer Share | Platform Fee |
|------|----------------|--------------|
| Beginner | N/A (free only) | N/A |
| Intermediate | 70% | 30% |
| Expert | 75% | 25% |
| Master | 78% | 22% |
| Elite | 80% | 20% |

**Rationale**:
- Lower tiers have higher platform overhead (more QA, disputes)
- Higher tiers incentivized with better splits
- Elite reviewers can negotiate custom rates

### Payment Calculation

#### For Fixed-Budget Reviews
```python
def calculate_payout(review_request, reviewer):
    """
    Calculate reviewer payout for fixed-budget expert review
    """
    budget = review_request.budget  # Total creator paid
    reviewer_tier = reviewer.tier

    # Get commission rate based on tier
    commission_rates = {
        'intermediate': 0.70,
        'expert': 0.75,
        'master': 0.78,
        'elite': 0.80
    }

    reviewer_rate = commission_rates.get(reviewer_tier, 0.75)

    # Calculate base payout
    base_payout = budget * reviewer_rate

    # Apply bonuses
    bonus = 0

    # Fast completion bonus (5% if completed 24h early)
    if is_completed_early(review_request, hours=24):
        bonus += base_payout * 0.05

    # Exceptional review bonus (10% if rated 5/5 on all dimensions)
    if is_exceptional_review(review_request):
        bonus += base_payout * 0.10

    # First-time creator bonus (encourage good first impressions)
    if review_request.user.total_reviews_received == 1:
        bonus += base_payout * 0.05

    total_payout = base_payout + bonus
    platform_fee = budget - total_payout

    return {
        'budget': float(budget),
        'base_payout': float(base_payout),
        'bonuses': float(bonus),
        'total_payout': float(total_payout),
        'platform_fee': float(platform_fee),
        'reviewer_percentage': reviewer_rate,
        'breakdown': {
            'base_rate': f"{reviewer_rate * 100}% (tier: {reviewer_tier})",
            'bonuses_applied': get_bonus_details()
        }
    }
```

#### For Hourly-Rate Reviews (Elite tier)
```python
def calculate_hourly_payout(reviewer, hours_worked, hourly_rate):
    """
    For elite reviewers who can set hourly rates
    """
    # Elite reviewers get 80% of their stated rate
    reviewer_share = 0.80

    gross_payment = hours_worked * hourly_rate
    reviewer_payout = gross_payment * reviewer_share
    platform_fee = gross_payment * 0.20

    # Cap hours at estimated hours + 50% buffer to prevent abuse
    max_billable_hours = review_request.estimated_review_hours * 1.5
    if hours_worked > max_billable_hours:
        # Flag for admin review
        flag_for_admin_review()
        hours_worked = max_billable_hours

    return {
        'hours_worked': hours_worked,
        'hourly_rate': float(hourly_rate),
        'reviewer_payout': float(reviewer_payout),
        'platform_fee': float(platform_fee)
    }
```

### Payment Timing

#### Escrow Timeline
```
1. Creator pays → Funds immediately escrowed
2. Reviewer claims → Funds remain in escrow
3. Reviewer submits → Funds remain in escrow
4. Creator accepts → Funds released to reviewer within 24 hours
5. Auto-accept (7 days) → Funds released automatically
```

#### Payout Methods
- **Minimum payout threshold**: $10 (prevents excessive transaction fees)
- **Payment frequency**:
  - Weekly auto-payout if balance ≥ $50
  - On-demand payout if balance ≥ $10 (max 1 per week)
  - Monthly auto-payout for any balance
- **Methods**: Stripe Connect, PayPal, Bank Transfer (for Elite)

### Dispute Impact on Payouts

#### Creator Rejects Review
```
Scenario: Creator rejects review, funds refunded to creator
Payment Status: REFUNDED
Reviewer Impact: No payment, counts against acceptance rate
```

#### Reviewer Disputes Rejection
```
Scenario: Reviewer disputes rejection, admin reviews
Payment Status: ESCROWED (funds held)

Admin Decision: Accept Review
- Funds released to reviewer
- Creator charged (no refund)
- Reviewer acceptance rate unaffected

Admin Decision: Uphold Rejection
- Funds refunded to creator
- Reviewer gets $0
- Reviewer acceptance rate impacted
```

#### Partial Payment (Future Feature)
```
For disputes where review has some value but not full quality:
Admin can award partial payment (e.g., 50% to reviewer, 50% refund to creator)
```

### Transparent Payout Breakdown

Example payout display for reviewer:

```
Review: "Mobile App UX Feedback"
Budget: $50.00

Your Earnings Breakdown:
✓ Base payout (75% - Expert tier)      $37.50
✓ Fast completion bonus (+5%)          + $1.88
✓ Exceptional review bonus (+10%)      + $3.75
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Earnings                       $43.13

  Platform fee (25%)                   $6.87

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Creator Paid                         $50.00

Status: Escrowed (releases when creator accepts or after 7 days)
Estimated Release: Dec 22, 2025
```

---

## Quality Assurance

### 1. Multi-Dimensional Quality Ratings

Instead of a single "helpful rating", collect granular feedback:

```
Review Quality Scorecard (Creator rates 1-5 each):

📋 Thoroughness
   How comprehensive was the review?
   1 = Missed major issues | 5 = Covered everything

🎯 Accuracy
   How technically correct was the feedback?
   1 = Major errors | 5 = Perfect accuracy

💡 Clarity
   How clear and understandable was the review?
   1 = Confusing | 5 = Crystal clear

✅ Actionability
   How actionable were the suggestions?
   1 = Vague | 5 = Step-by-step guidance

🤝 Professionalism
   How professional was the tone and delivery?
   1 = Unprofessional | 5 = Exemplary

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: Would you recommend this reviewer?
[ ] Yes, definitely  [ ] Maybe  [ ] No

Did this review exceed expectations?
[ ] Yes, this was exceptional  [ ] No, it met expectations
```

#### Quality Score Calculation
```python
def calculate_quality_score(feedback):
    """
    Compute composite quality score (0-100)
    """
    weights = {
        'thoroughness': 0.25,
        'accuracy': 0.25,
        'clarity': 0.20,
        'actionability': 0.20,
        'professionalism': 0.10
    }

    # Normalize each 1-5 rating to 0-100 scale
    scores = {
        'thoroughness': (feedback.thoroughness_rating - 1) / 4 * 100,
        'accuracy': (feedback.accuracy_rating - 1) / 4 * 100,
        'clarity': (feedback.clarity_rating - 1) / 4 * 100,
        'actionability': (feedback.actionability_rating - 1) / 4 * 100,
        'professionalism': (feedback.professionalism_rating - 1) / 4 * 100
    }

    # Weighted average
    quality_score = sum(scores[k] * weights[k] for k in scores)

    # Bonus for exceptional reviews
    if feedback.exceptional_review:
        quality_score = min(100, quality_score + 5)

    return round(quality_score, 2)
```

### 2. Quality Thresholds & Alerts

#### Real-Time Quality Monitoring
```python
# Check quality after each review acceptance
def monitor_reviewer_quality(reviewer):
    recent_reviews = get_last_n_reviews(reviewer, n=10)

    # Red flags
    if len(recent_reviews) >= 5:
        avg_quality = sum(r.quality_score for r in recent_reviews) / len(recent_reviews)

        # Quality dropping
        if avg_quality < 70:
            trigger_quality_warning(reviewer, 'low_quality_score')

        # Acceptance rate declining
        recent_acceptance = calculate_acceptance_rate(recent_reviews)
        if recent_acceptance < reviewer.tier_minimum_acceptance_rate():
            trigger_quality_warning(reviewer, 'low_acceptance_rate')

        # Response time increasing
        avg_response_time = calculate_avg_response_time(recent_reviews)
        if avg_response_time > reviewer.tier_maximum_response_time():
            trigger_quality_warning(reviewer, 'slow_response')
```

#### Warning System
```
Warning Level 1: Informational
- Email notification with tips for improvement
- No tier impact
- Triggered: Single metric slightly below threshold

Warning Level 2: Probation
- Reviewer placed on probation (visible on profile)
- 30-day improvement period
- Triggered: Multiple metrics below threshold OR sustained decline

Warning Level 3: Demotion
- Automatic tier demotion
- Must re-qualify for higher tier
- Triggered: Probation period ends without improvement
```

### 3. Automated Quality Checks

#### Pre-Submit Quality Gates
```python
def validate_review_quality(review_text, review_rating):
    """
    Check basic quality before allowing submission
    """
    errors = []

    # Minimum length check
    if len(review_text) < 200:
        errors.append("Review must be at least 200 characters (currently {len(review_text)})")

    # Check for generic/template content
    generic_phrases = ["good job", "looks fine", "no issues", "great work"]
    if any(phrase in review_text.lower() for phrase in generic_phrases) and len(review_text) < 500:
        errors.append("Review appears generic. Please provide specific, actionable feedback.")

    # Check for structure (paragraphs, bullet points)
    if '\n' not in review_text:
        errors.append("Please structure your review with paragraphs or bullet points for clarity.")

    # Sentiment analysis (optional)
    if review_rating <= 2 and not contains_constructive_feedback(review_text):
        errors.append("Low ratings should include constructive feedback explaining issues.")

    return errors
```

#### Post-Submit Quality Analysis
```python
# Background job to analyze review quality
def analyze_review_quality(review_slot):
    """
    Use NLP to assess review quality (sentiment, helpfulness, specificity)
    """
    review_text = review_slot.review_text

    analysis = {
        'word_count': count_words(review_text),
        'sentence_count': count_sentences(review_text),
        'avg_sentence_length': calculate_avg_sentence_length(review_text),
        'readability_score': calculate_readability_score(review_text),
        'sentiment': analyze_sentiment(review_text),
        'has_examples': detect_examples(review_text),
        'has_action_items': detect_action_items(review_text),
        'specificity_score': calculate_specificity(review_text)
    }

    # Flag low-quality reviews for admin spot-check
    if analysis['word_count'] < 150 or analysis['specificity_score'] < 0.4:
        flag_for_quality_review(review_slot, analysis)

    return analysis
```

### 4. Peer Review System (Master+ Tiers)

For controversial cases or quality disputes:

```
Peer Review Process:
1. Admin flags review for peer evaluation
2. System selects 3 Master/Elite reviewers in same specialty
3. Peers rate review quality (blind review - no reviewer name shown)
4. Consensus determines outcome
5. If peers agree review is low quality → Rejection upheld
6. If peers agree review is high quality → Admin overturns rejection
```

### 5. Quality Improvement Program

#### For Reviewers on Probation
```
30-Day Quality Improvement Plan:

Week 1: Diagnosis
- Review analysis of past 10 reviews
- Identify specific weaknesses (clarity, depth, etc.)
- Optional 1:1 consultation with Elite reviewer mentor

Week 2-3: Guided Practice
- Complete 5 reviews with extra scrutiny
- Receive detailed feedback from mentors
- Access quality improvement resources

Week 4: Re-Evaluation
- Admin reviews recent performance
- If improved → Probation lifted
- If not improved → Demotion or suspension
```

#### Quality Resources
- Video tutorials on writing exceptional reviews
- Templates and checklists
- Examples of 5-star reviews in each specialty
- Community forum for reviewer best practices

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Core tier system and basic quality tracking

**Database**:
- Create `reviewer_profiles` table
- Create `reviewer_tier_history` table
- Create `review_quality_feedback` table
- Add tier columns to `review_slots`

**Backend**:
- Implement tier qualification checking logic
- Build tier advancement/demotion algorithms
- Create reviewer profile CRUD endpoints
- Add quality feedback collection on review acceptance

**Frontend**:
- Reviewer profile page showing tier and progress
- Tier badge display in UI
- Quality feedback form for creators
- Reviewer dashboard with tier progress bars

**Deliverables**:
- ✅ Reviewers can see their tier status
- ✅ System auto-promotes Beginner → Intermediate when criteria met
- ✅ Creators can provide detailed quality ratings
- ✅ Basic quality score calculation

**Success Metrics**:
- All active reviewers migrated to tier system
- 80% of creators provide quality ratings
- Tier promotion logic tested and validated

---

### Phase 2: Specialties & Verification (Weeks 4-6)
**Goal**: Specialty tagging and verification system

**Database**:
- Create `reviewer_specialties` table
- Create `reviewer_endorsements` table

**Backend**:
- Specialty CRUD endpoints
- Portfolio upload and admin review workflow
- Peer endorsement system
- Specialty-based filtering in matching

**Frontend**:
- Specialty selection and management UI
- Portfolio upload interface
- Verification status display (badges/icons)
- Admin panel for specialty verification

**Deliverables**:
- ✅ Reviewers can add up to 10 specialties
- ✅ Admin can verify portfolios and grant badges
- ✅ Peer endorsement workflow functional
- ✅ Marketplace filters by verified specialties

**Success Metrics**:
- 70% of Intermediate+ reviewers have verified specialties
- Average 3 specialties per reviewer
- 50+ peer endorsements given

---

### Phase 3: Matching Algorithm (Weeks 7-9)
**Goal**: Intelligent review assignment recommendations

**Database**:
- Create `review_assignment_preferences` table
- Add matching metadata to `review_requests`

**Backend**:
- Implement match score calculation algorithm
- Build recommendation engine
- Create reviewer preference management
- Smart filtering and ranking logic

**Frontend**:
- "Recommended for You" section in reviewer dashboard
- Match score display (e.g., "95% match")
- Preference settings page
- Enhanced marketplace browse with sorting by match

**Deliverables**:
- ✅ Match score algorithm live and tested
- ✅ Top 10 recommendations shown to reviewers
- ✅ Marketplace sorted by relevance
- ✅ Reviewers can set preferences (content types, budget, etc.)

**Success Metrics**:
- 60% of reviews claimed from recommendations
- Average match score of claimed reviews: >75
- 25% reduction in time-to-claim

---

### Phase 4: Payout Optimization (Weeks 10-11)
**Goal**: Tiered commission structure and bonuses

**Database**:
- Add commission rate tracking to `review_slots`
- Create payout history/audit table

**Backend**:
- Implement dynamic commission calculation by tier
- Build bonus logic (fast completion, exceptional reviews)
- Transparent payout breakdown API
- Tax reporting infrastructure

**Frontend**:
- Earnings page with detailed breakdowns
- Bonus notifications
- Commission rate display per tier
- Payout history and tax documents

**Deliverables**:
- ✅ Tiered commission rates live (70-80% by tier)
- ✅ Bonus calculations working
- ✅ Payout transparency dashboard
- ✅ Weekly auto-payout for balances ≥$50

**Success Metrics**:
- Average reviewer payout increases by 10%
- 90% of reviewers understand payout breakdown
- Zero payout calculation disputes

---

### Phase 5: Quality Assurance System (Weeks 12-14)
**Goal**: Advanced quality monitoring and improvement tools

**Backend**:
- Quality monitoring background jobs
- Warning/probation automation
- Quality score trending analytics
- Peer review system

**Frontend**:
- Quality dashboard for reviewers
- Performance trends and insights
- Improvement plan interface
- Mentor matching for struggling reviewers

**Deliverables**:
- ✅ Real-time quality monitoring
- ✅ Automated warnings for declining performance
- ✅ Probation and improvement plan workflows
- ✅ Peer review system for disputes

**Success Metrics**:
- Average review quality score: 85+
- 80% of probation reviewers improve within 30 days
- 95% acceptance rate for Expert+ tiers

---

### Phase 6: Advanced Features & Gamification (Weeks 15-16)
**Goal**: Badges, leaderboards, and engagement features

**Database**:
- Create `reviewer_badges` table

**Backend**:
- Badge earning logic and automation
- Leaderboard calculations
- Streak tracking
- Achievement notifications

**Frontend**:
- Badge showcase on profiles
- Leaderboards (daily, weekly, monthly)
- Achievement popups and notifications
- Progress towards next badge

**Deliverables**:
- ✅ 10+ badge types implemented
- ✅ Leaderboards by tier and specialty
- ✅ Streak tracking and rewards
- ✅ Gamified reviewer experience

**Success Metrics**:
- 70% of reviewers earn at least 1 badge
- Daily active reviewers increases by 25%
- Average session time increases by 30%

---

### Phase 7: Auto-Assignment & Premium Features (Weeks 17-18)
**Goal**: Auto-assignment for Elite reviewers, custom rates

**Backend**:
- Auto-assignment algorithm
- Hourly rate calculations
- Custom rate negotiation
- Elite reviewer perks

**Frontend**:
- Auto-assignment settings
- Hourly rate configuration
- Custom rate requests
- Elite dashboard features

**Deliverables**:
- ✅ Auto-assignment for opted-in Expert+ reviewers
- ✅ Elite reviewers can set custom hourly rates
- ✅ Premium features (priority support, custom profiles)
- ✅ Concierge matching for high-value requests

**Success Metrics**:
- 30% of Expert+ reviewers enable auto-assignment
- 10 Elite reviewers with custom rates
- 95% satisfaction from high-value creators

---

## MVP Recommendation

For **fastest time-to-value**, implement in this order:

### MVP 1: Core Tier System (4 weeks)
- Phase 1: Foundation
- Phase 2: Specialties & Verification (basic)

**Value**: Reviewers can see progression, creators get better matches

### MVP 2: Matching & Payouts (3 weeks)
- Phase 3: Matching Algorithm (simplified)
- Phase 4: Payout Optimization

**Value**: Better review quality, higher reviewer earnings, reduced time-to-claim

### MVP 3: Quality & Engagement (3 weeks)
- Phase 5: Quality Assurance
- Phase 6: Gamification (basic badges)

**Value**: Maintain quality standards, increase reviewer retention

### Future Iterations:
- Phase 7: Auto-assignment and premium features
- Additional specialties and sub-specialties
- Advanced analytics and reporting
- Mobile app for reviewers

---

## Key Success Metrics

### Platform Health
- **Reviewer Tier Distribution**: Target 40% Intermediate, 30% Expert, 20% Master, 10% Elite
- **Average Review Quality**: Target 85+ quality score
- **Time to Claim**: Target <4 hours for 80% of requests
- **Reviewer Retention**: Target 70% month-over-month retention

### Economic Balance
- **Average Reviewer Earnings**: Target $50-100/review for Expert tier
- **Creator Satisfaction**: Target 4.5+ rating of review quality
- **Platform Revenue**: Sustainable 20-30% commission
- **Dispute Rate**: Target <5% of reviews disputed

### Quality Indicators
- **Acceptance Rate**: Target 90%+ for Expert+ tiers
- **Exceptional Review Rate**: Target 20% of reviews rated exceptional
- **Response Time**: Target <36 hours for Expert tier
- **Reviewer Growth**: Target 20% quarter-over-quarter growth in Expert+ reviewers

---

## Risk Mitigation

### Risk 1: Quality Decline at Scale
**Mitigation**:
- Strict tier advancement criteria
- Continuous quality monitoring
- Probation system catches decline early
- Peer review for high-stakes cases

### Risk 2: Reviewer Monopolization
**Mitigation**:
- Fairness mechanisms in matching (round-robin, workload balance)
- Max concurrent reviews limits
- Auto-assignment distributes opportunities
- Diversity bonuses for spreading work

### Risk 3: Gaming the System
**Mitigation**:
- Multi-dimensional quality metrics (harder to game)
- Admin spot-checks of suspicious patterns
- Peer endorsements require reputation
- Dispute system protects against fraud

### Risk 4: Tier Inflation
**Mitigation**:
- Fixed percentage targets per tier (not everyone can be Elite)
- Relative performance metrics (top 5% in specialty)
- Regular re-qualification for higher tiers
- Demotion if standards not maintained

### Risk 5: Creator Abuse (Unfair Rejections)
**Mitigation**:
- Dispute system protects reviewers
- Creator reputation tracking (excessive rejections flagged)
- Admin review of patterns
- Multi-dimensional feedback makes unfair rejection harder

---

## Conclusion

This expert reviewer system creates a **sustainable marketplace ecosystem** where:

1. **Reviewers** have clear progression paths, fair compensation, and recognition for quality work
2. **Creators** get matched with qualified experts who provide valuable, actionable feedback
3. **Platform** maintains quality standards while scaling efficiently

The tiered approach balances **accessibility** (anyone can start as Beginner) with **exclusivity** (Elite status is earned through exceptional performance), creating aspirational goals that drive quality and engagement.

By implementing in phases, we can validate assumptions, gather feedback, and iterate quickly while delivering value at each milestone.

---

**Next Steps**:
1. Review and approve this design
2. Create detailed technical specifications for Phase 1
3. Set up database migrations
4. Begin implementation with Phase 1: Foundation
