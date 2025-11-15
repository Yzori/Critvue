# Expert Application & Verification System

## Overview

A comprehensive system allowing experienced professionals to apply for elevated reviewer tiers (Expert, Master, Elite) through credential verification, portfolio assessment, and sample work evaluation.

---

## 1. Application Workflow

### 1.1 State Machine

```
DRAFT → SUBMITTED → UNDER_REVIEW →
  ├─→ CREDENTIALS_VERIFICATION →
  ├─→ PORTFOLIO_REVIEW →
  ├─→ SAMPLE_EVALUATION →
  ├─→ COMMITTEE_REVIEW →
  └─→ FINAL_DECISION →
      ├─→ APPROVED → PROBATION → ACTIVE
      ├─→ CONDITIONAL_APPROVAL → REVISION_REQUESTED → RESUBMITTED
      ├─→ REJECTED
      └─→ WAITLISTED
```

### 1.2 Application States

| State | Description | Duration | Next Actions |
|-------|-------------|----------|--------------|
| `DRAFT` | Application started but not submitted | Indefinite | Submit or abandon |
| `SUBMITTED` | Application received, awaiting initial review | 1-2 days | Auto-assign to reviewer |
| `UNDER_REVIEW` | Active review in progress | 5-7 days | Move to sub-stages |
| `CREDENTIALS_VERIFICATION` | Verifying education, certifications, employment | 3-5 days | Automated + manual checks |
| `PORTFOLIO_REVIEW` | Evaluating work samples and portfolio | 3-4 days | Peer review by experts |
| `SAMPLE_EVALUATION` | Assessing submitted test review | 2-3 days | Multiple evaluators |
| `COMMITTEE_REVIEW` | Final decision by review committee | 2-3 days | Vote on approval |
| `REVISION_REQUESTED` | Need more info or improved samples | 7 days to respond | Resubmit |
| `RESUBMITTED` | Revised application received | 3-5 days | Expedited review |
| `APPROVED` | Application accepted, tier assigned | Immediate | Enter probation |
| `PROBATION` | Monitored trial period | 30-90 days | Full activation |
| `ACTIVE` | Full expert status granted | Ongoing | Regular quality monitoring |
| `REJECTED` | Application denied | Final | Reapply in 6 months |
| `WAITLISTED` | Strong but capacity limited | 90 days | Auto-notify when slots open |
| `WITHDRAWN` | Applicant canceled | Final | Can reapply anytime |

### 1.3 Timeline Summary

- **Fast Track (Strong Application)**: 10-14 days total
- **Standard Review**: 14-21 days total
- **Revision Required**: +7-14 days additional
- **Total with Probation**: 40-110 days to full expert status

---

## 2. Application Requirements

### 2.1 Required Information

#### Personal & Professional Identity
```json
{
  "applicant_info": {
    "full_name": "string (must match ID)",
    "professional_name": "string (if different, e.g., published name)",
    "email": "string (verified)",
    "phone": "string (verified via SMS)",
    "country": "string",
    "timezone": "string",
    "linkedin_url": "string (optional but recommended)",
    "professional_website": "string (optional)",
    "github_profile": "string (for technical fields)",
    "portfolio_url": "string (optional if portfolio uploaded)"
  }
}
```

#### Professional Background
```json
{
  "professional_background": {
    "target_tier": "expert | master | elite",
    "expertise_domains": ["array of domain IDs"],
    "primary_specializations": ["array of specific skills"],
    "years_of_experience": "number (minimum 3 for Expert, 7 for Master, 12 for Elite)",
    "current_role": "string",
    "current_employer": "string (or 'Self-Employed')",
    "employment_history": [
      {
        "company": "string",
        "role": "string",
        "start_date": "date",
        "end_date": "date | null",
        "description": "string (max 500 chars)",
        "notable_achievements": "string (max 300 chars)"
      }
    ],
    "professional_summary": "string (500-1500 words, why you're qualified)"
  }
}
```

#### Education & Certifications
```json
{
  "credentials": {
    "education": [
      {
        "institution": "string",
        "degree": "string (e.g., 'Bachelor of Science in Computer Science')",
        "field_of_study": "string",
        "graduation_year": "number",
        "verification_method": "uploaded_diploma | institution_verification | clearinghouse",
        "document_upload": "file_id (if applicable)"
      }
    ],
    "certifications": [
      {
        "certification_name": "string",
        "issuing_organization": "string",
        "issue_date": "date",
        "expiration_date": "date | null",
        "credential_id": "string (for verification)",
        "verification_url": "string (e.g., Credly badge)",
        "document_upload": "file_id"
      }
    ],
    "professional_licenses": [
      {
        "license_type": "string",
        "license_number": "string",
        "issuing_authority": "string",
        "state_region": "string",
        "status": "active | inactive",
        "verification_url": "string"
      }
    ]
  }
}
```

#### Portfolio & Work Samples
```json
{
  "portfolio": {
    "work_samples": [
      {
        "title": "string",
        "description": "string (what was the project/work)",
        "role": "string (your specific contribution)",
        "date_completed": "date",
        "project_type": "string (e.g., 'Product Design', 'Code Review', 'Architecture')",
        "relevance_to_expertise": "string (how this demonstrates qualification)",
        "files": ["array of file_ids"],
        "external_links": ["array of URLs"],
        "is_public": "boolean (can we verify publicly?)",
        "client_permission": "boolean (confirmed permission to share)",
        "confidentiality_level": "public | redacted | nda_protected"
      }
    ],
    "published_works": [
      {
        "title": "string",
        "publication_venue": "string (journal, conference, blog, etc.)",
        "publication_date": "date",
        "url": "string (verifiable link)",
        "citation_count": "number (if applicable)",
        "description": "string"
      }
    ],
    "open_source_contributions": [
      {
        "project_name": "string",
        "repository_url": "string",
        "contribution_type": "string (maintainer, core contributor, etc.)",
        "contributions_summary": "string",
        "verification_method": "github_stats | commit_history"
      }
    ]
  }
}
```

#### References & Endorsements
```json
{
  "references": {
    "professional_references": [
      {
        "name": "string",
        "relationship": "string (e.g., 'Former Manager', 'Client')",
        "company": "string",
        "role": "string",
        "email": "string (we will contact)",
        "phone": "string (optional)",
        "can_verify": ["employment", "skills", "work_quality"],
        "linkedin_url": "string (optional)"
      }
    ],
    "peer_endorsements": [
      {
        "endorser_name": "string",
        "endorser_role": "string",
        "endorser_company": "string",
        "endorsement_text": "string (max 500 chars)",
        "relationship": "string",
        "date_provided": "date",
        "verification_status": "pending | verified | unverified"
      }
    ],
    "platform_references": {
      "upwork_profile": "string (URL with verified rating)",
      "toptal_profile": "string",
      "linkedin_recommendations_count": "number",
      "other_platforms": ["array of platform references"]
    }
  }
}
```

#### Sample Review Submission (Test Work)
```json
{
  "sample_review": {
    "assignment_type": "reviewer_choice | platform_assigned",
    "chosen_domain": "string (domain ID)",
    "review_subject": {
      "type": "code | design | writing | product | other",
      "description": "string (what are you reviewing)",
      "source": "own_work | public_sample | platform_provided",
      "url_or_upload": "string | file_id"
    },
    "submitted_review": {
      "review_text": "string (the actual review)",
      "word_count": "number",
      "time_spent": "number (minutes)",
      "methodology_explanation": "string (explain your review approach)",
      "evaluation_criteria_used": ["array of criteria"],
      "submitted_at": "timestamp"
    },
    "evaluation_criteria": {
      "thoroughness": "0-10 score",
      "technical_accuracy": "0-10 score",
      "actionability": "0-10 score",
      "professionalism": "0-10 score",
      "insight_depth": "0-10 score"
    }
  }
}
```

#### Application Meta
```json
{
  "application_meta": {
    "motivation_statement": "string (1000-2000 words: Why expert tier? What value do you bring?)",
    "availability": {
      "hours_per_week": "number",
      "preferred_review_types": ["array of review type IDs"],
      "timezone_preferences": ["array of acceptable timezones"],
      "start_date": "date (when can you begin)"
    },
    "acknowledgments": {
      "accuracy_declaration": "boolean (I certify all information is accurate)",
      "background_check_consent": "boolean",
      "probation_understanding": "boolean (I understand probation period)",
      "payout_expectations": "boolean (I understand tier-based payouts)",
      "code_of_conduct_agreement": "boolean"
    },
    "application_fee": {
      "amount": "decimal (suggested: $50 for Expert, $100 for Master, $150 for Elite)",
      "payment_id": "string",
      "payment_status": "paid | refunded_on_approval | non_refundable",
      "payment_date": "timestamp"
    }
  }
}
```

### 2.2 File Upload Requirements

| Document Type | Required | Format | Max Size | Notes |
|---------------|----------|--------|----------|-------|
| Resume/CV | Yes | PDF | 5MB | Must include verifiable employment |
| Portfolio Samples | 3-5 required | PDF, PNG, ZIP | 25MB each | Must show quality of work |
| Diploma/Degree | If claiming | PDF, JPG | 5MB | High-res scan required |
| Certifications | If claiming | PDF, JPG | 5MB each | Must include credential ID |
| Professional License | If applicable | PDF, JPG | 5MB | Must be current/active |
| Published Work | Optional | PDF, Links | 10MB | Demonstrates thought leadership |
| Sample Review | Yes | Text/PDF | 2MB | Test of review capability |
| Reference Letters | Optional | PDF | 5MB each | Pre-written endorsements |
| Identity Document | Yes | JPG, PDF | 5MB | Government-issued ID (redact sensitive info) |

### 2.3 Application Fee Structure

**Philosophy**: Fee filters out spam/casual applicants while being accessible to serious professionals.

| Target Tier | Application Fee | Refund Policy |
|-------------|----------------|---------------|
| Expert | $50 USD | 100% refund if approved, 50% if waitlisted, non-refundable if rejected |
| Master | $100 USD | Same as above |
| Elite | $150 USD | Same as above |

**Alternative**: Waive fee if applicant provides 2 verified references from existing Elite reviewers (invitation model).

---

## 3. Verification & Vetting Process

### 3.1 Multi-Stage Verification Pipeline

#### Stage 1: Automated Pre-Screening (1-2 days)
**Automated Checks:**
- Email verification (send verification link)
- Phone verification (SMS code)
- Duplicate detection (prevent multiple applications from same person)
- Basic completeness check (all required fields filled)
- File integrity check (uploads are not corrupted)
- Resume parsing for minimum experience requirements
- Blacklist check (banned users, known bad actors)

**Auto-Rejection Criteria:**
- Incomplete application (missing required fields)
- Duplicate active application
- Years of experience below minimum threshold
- Previously rejected within 6-month cooling period
- Failed identity verification
- Suspicious activity patterns

**Output**: Pass/Fail → Move to human review or auto-reject

#### Stage 2: Credential Verification (3-5 days)
**Automated Verification:**
- Email domain validation (does @company.com exist and match claimed employer?)
- LinkedIn profile cross-reference (match job history, connections, endorsements)
- Certification credential ID lookup (query Credly, Microsoft, AWS, etc.)
- Educational institution verification via National Student Clearinghouse (US) or equivalent
- Professional license verification via state/national registries
- GitHub contribution verification (if claimed)
- Publication DOI/URL verification (confirm authorship)

**Manual Verification:**
- Contact references via email/phone
- Employer verification calls (for recent positions)
- Portfolio authenticity check (reverse image search for design work, code plagiarism check)
- Cross-reference work samples with claimed projects
- Social media presence validation (does professional profile match claims?)

**Verification Scoring:**
```
Each credential gets a verification score:
- Fully Verified (3 points): Direct confirmation from issuing authority
- Partially Verified (2 points): Verifiable but indirect evidence
- Self-Reported (1 point): No independent verification possible
- Unverifiable (0 points): Cannot confirm
- Contradictory (-5 points): Evidence contradicts claim

Minimum threshold: 70% of claimed credentials must be Fully or Partially Verified
```

**Red Flags:**
- Multiple unverifiable claims
- Employment dates that don't align with education dates
- References that don't respond or can't confirm claims
- Portfolio work found elsewhere online (plagiarism)
- Inconsistencies between application and LinkedIn/public profile
- Generic or template-looking recommendation letters
- Certifications from unrecognized or diploma mill institutions

**Output**: Verification report with scores + flag any concerns

#### Stage 3: Portfolio Quality Review (3-4 days)
**Peer Review Process:**
- Assign 2-3 existing Master/Elite reviewers in the same domain
- Each reviewer independently evaluates portfolio
- Blind review (reviewers don't see each other's scores initially)

**Portfolio Evaluation Rubric:**
```
1. TECHNICAL/PROFESSIONAL COMPETENCE (40 points)
   - Depth of expertise demonstrated (0-10)
   - Complexity of projects handled (0-10)
   - Technical accuracy and precision (0-10)
   - Innovation or creative problem-solving (0-10)

2. WORK QUALITY (30 points)
   - Polish and professionalism (0-10)
   - Attention to detail (0-10)
   - Completeness and thoroughness (0-10)

3. RELEVANCE & RECENCY (20 points)
   - Direct relevance to claimed expertise (0-10)
   - Currency of work (recent vs outdated) (0-10)

4. IMPACT & RESULTS (10 points)
   - Demonstrated business/user impact (0-5)
   - Recognition or validation (awards, citations, adoption) (0-5)

Total: 100 points possible
Scoring Thresholds:
- Expert: 70-79 points
- Master: 80-89 points
- Elite: 90-100 points
```

**Calibration**: Portfolio reviewers undergo calibration training to ensure consistent scoring.

**Output**: Average portfolio score + written feedback from each reviewer

#### Stage 4: Sample Review Evaluation (2-3 days)
**Test Review Assessment:**

Applicant submits a detailed review of a work sample (provided by platform or self-selected).

**Evaluation Criteria:**
```
1. THOROUGHNESS (20 points)
   - Coverage of all important aspects (0-10)
   - Appropriate level of detail (0-10)

2. TECHNICAL ACCURACY (25 points)
   - Correctness of technical assessments (0-15)
   - Proper use of domain terminology (0-10)

3. ACTIONABILITY (20 points)
   - Clear, specific recommendations (0-10)
   - Prioritization of feedback (0-10)

4. COMMUNICATION (15 points)
   - Clarity and structure (0-8)
   - Professional tone (0-7)

5. INSIGHT DEPTH (20 points)
   - Goes beyond surface-level observations (0-10)
   - Demonstrates expert-level thinking (0-10)

Total: 100 points possible
Minimum passing: 75 for Expert, 82 for Master, 90 for Elite
```

**Multiple Evaluators:**
- Assign 3 independent evaluators (existing reviewers at target tier or above)
- Calculate average score
- Require <10 point spread between evaluators (if spread >10, add 4th evaluator)

**Plagiarism Check:**
- Run sample review through plagiarism detection
- Check against existing Critvue reviews and public sources

**Output**: Average sample review score + consensus on quality

#### Stage 5: Committee Final Review (2-3 days)
**Review Committee Composition:**
- 1 Platform Admin (voting member)
- 2 Elite Reviewers from relevant domain (voting members)
- 1 Master Reviewer from adjacent domain (non-voting, advisory)
- 1 Community Manager (non-voting, provides context)

**Committee Meeting:**
- Review comprehensive application package
- Review all verification reports
- Review portfolio scores and feedback
- Review sample review scores
- Discuss any red flags or concerns
- Vote on: Approve, Conditional Approve, Reject, Waitlist

**Decision Matrix:**
| Criteria | Expert Minimum | Master Minimum | Elite Minimum |
|----------|----------------|----------------|---------------|
| Years Experience | 3+ | 7+ | 12+ |
| Credential Verification Score | 70% | 80% | 90% |
| Portfolio Score | 70 | 80 | 90 |
| Sample Review Score | 75 | 82 | 90 |
| Reference Confirmations | 2/3 | 2/3 | 3/3 |
| Red Flags | 0 major | 0 major | 0 any |

**Vote Requirements:**
- Approve: Unanimous or 2/3 majority
- Conditional Approve: Majority vote with specific conditions
- Waitlist: Split vote or strong candidate but capacity constraints
- Reject: Majority vote against or any major red flags

**Output**: Final decision with detailed justification

### 3.2 Verification Service Integrations

**Recommended Third-Party Services:**

1. **Identity Verification**: Stripe Identity, Onfido, Jumio
   - Government ID verification
   - Liveness detection (selfie match)
   - Address verification

2. **Employment Verification**: Truework, The Work Number
   - Verify employment dates and titles
   - Salary verification (optional, for tier placement)

3. **Education Verification**: National Student Clearinghouse, Parchment
   - Degree verification
   - Graduation date confirmation

4. **Professional Licenses**: State licensing boards, National Registry APIs
   - Real-time license status checks
   - Disciplinary action history

5. **Certification Verification**: Credly, Accredible, direct issuer APIs
   - Credential authenticity
   - Expiration status

6. **Background Checks**: Checkr, Sterling (optional, for high-tier reviewers)
   - Criminal background
   - Employment history
   - Professional sanctions

7. **Portfolio Plagiarism Detection**:
   - TinEye (reverse image search for designs)
   - Copyleaks, Turnitin (written work)
   - Code plagiarism tools (MOSS, JPlag for code samples)

### 3.3 Who Reviews Applications?

**Tiered Review Model:**

| Application Tier | Automated Screening | Credential Verification | Portfolio Review | Sample Review | Final Decision |
|------------------|---------------------|------------------------|------------------|---------------|----------------|
| Expert | Bot | Admin + Bot | 2 Master reviewers | 2 Master reviewers | 1 Admin + 2 Elite |
| Master | Bot | Admin + Bot | 2 Elite reviewers | 2 Elite reviewers | 1 Admin + 2 Elite |
| Elite | Bot | Admin + Bot | 2 Elite + 1 external expert | 3 Elite reviewers | 1 Admin + 3 Elite + 1 external |

**Reviewer Compensation:**
- Application reviewers are paid for their evaluation time
- Portfolio review: $50 per application
- Sample review: $30 per application
- Committee participation: $100 per meeting (typically 3-5 applications reviewed)

**Quality Control for Reviewers:**
- Track inter-rater reliability
- Calibration sessions monthly
- Reviewers who consistently score outside the norm are recalibrated or removed from pool

---

## 4. Tier Placement Logic

### 4.1 Tier Qualification Matrix

```python
def determine_qualified_tier(application):
    """
    Determine the highest tier an applicant qualifies for.
    They may apply for higher but be placed lower based on evaluation.
    """

    scores = {
        'years_experience': application.years_of_experience,
        'credential_verification': application.credential_verification_score,
        'portfolio_score': application.portfolio_average_score,
        'sample_review_score': application.sample_review_average_score,
        'reference_confirmations': application.confirmed_references_count,
        'total_references': application.total_references_submitted
    }

    # Tier thresholds
    tiers = {
        'elite': {
            'years_experience': 12,
            'credential_verification': 90,
            'portfolio_score': 90,
            'sample_review_score': 90,
            'reference_confirmations': 3,
            'additional_requirements': [
                'has_published_work',
                'has_major_impact_project',
                'recognized_expert_in_field'
            ]
        },
        'master': {
            'years_experience': 7,
            'credential_verification': 80,
            'portfolio_score': 80,
            'sample_review_score': 82,
            'reference_confirmations': 2
        },
        'expert': {
            'years_experience': 3,
            'credential_verification': 70,
            'portfolio_score': 70,
            'sample_review_score': 75,
            'reference_confirmations': 2
        }
    }

    # Check Elite
    if all(scores[k] >= v for k, v in tiers['elite'].items() if k != 'additional_requirements'):
        if check_additional_requirements(application, tiers['elite']['additional_requirements']):
            return 'elite'

    # Check Master
    if all(scores[k] >= v for k, v in tiers['master'].items()):
        return 'master'

    # Check Expert
    if all(scores[k] >= v for k, v in tiers['expert'].items()):
        return 'expert'

    # Does not qualify for any expert tier
    return 'intermediate'  # Offer intermediate placement instead
```

### 4.2 Placement Scenarios

**Scenario 1: Applied for Elite, Qualify for Master**
- Offer Master tier placement
- Provide feedback on what's needed for Elite
- Option to decline and reapply later
- Option to accept Master and fast-track to Elite after probation

**Scenario 2: Applied for Expert, Don't Qualify for Any**
- Offer Intermediate tier placement (skip Beginner)
- Reduce/waive application fee
- Provide detailed improvement roadmap
- Option to withdraw and reapply with stronger portfolio

**Scenario 3: Strong Candidate, Applied for Expert, Qualify for Master**
- Offer Master tier placement (tier upgrade)
- No additional fee
- This is a positive surprise

**Scenario 4: Borderline Case**
- Offer Conditional Approval
- Require additional sample reviews or shorter probation period
- Committee can set specific milestones

### 4.3 Probation Period

**Purpose**: Even verified experts need to demonstrate they understand Critvue's platform, standards, and review format.

**Probation Structure:**
```
Standard Probation Periods:
- Expert: 30 days OR 10 completed reviews (whichever comes first)
- Master: 60 days OR 15 completed reviews
- Elite: 90 days OR 20 completed reviews

Reduced Probation (for exceptional candidates):
- Expert: 15 days OR 5 reviews
- Master: 30 days OR 8 reviews
- Elite: 45 days OR 10 reviews
```

**Probation Restrictions:**
- Reviews are monitored and audited (random quality checks)
- Payouts are at probation rate (10% lower than full tier rate)
- Cannot take highest-value or most urgent review assignments
- Required to complete onboarding training modules
- Monthly check-ins with assigned mentor (existing Elite reviewer)

**Probation Success Criteria:**
```python
def evaluate_probation_success(reviewer):
    """
    Determine if probationary reviewer should be promoted to full status.
    """

    metrics = {
        'average_review_quality': reviewer.avg_quality_score_during_probation,
        'reviews_completed': reviewer.probation_reviews_completed,
        'client_satisfaction': reviewer.avg_client_rating_during_probation,
        'timeliness': reviewer.on_time_delivery_rate,
        'policy_violations': reviewer.policy_violation_count,
        'days_in_probation': (datetime.now() - reviewer.probation_start_date).days
    }

    # Automatic promotion criteria
    if (
        metrics['average_review_quality'] >= 4.5 and
        metrics['reviews_completed'] >= reviewer.tier.min_probation_reviews and
        metrics['client_satisfaction'] >= 4.5 and
        metrics['timeliness'] >= 90 and
        metrics['policy_violations'] == 0 and
        metrics['days_in_probation'] >= reviewer.tier.min_probation_days
    ):
        return 'PROMOTE_TO_FULL_STATUS'

    # Extension criteria (needs more time)
    elif (
        metrics['average_review_quality'] >= 4.0 and
        metrics['policy_violations'] <= 1 and
        metrics['days_in_probation'] < reviewer.tier.max_probation_days
    ):
        return 'EXTEND_PROBATION'

    # Demotion criteria (not meeting standards)
    elif (
        metrics['average_review_quality'] < 3.5 or
        metrics['policy_violations'] >= 3 or
        metrics['timeliness'] < 70
    ):
        return 'DEMOTE_ONE_TIER'  # Expert → Intermediate, Master → Expert, etc.

    # Default: continue probation
    return 'CONTINUE_PROBATION'
```

**Early Graduation:**
- Exceptional performance (5.0 avg quality, 100% on-time, glowing client feedback)
- Can graduate early after minimum reviews completed
- Requires committee approval

**Probation Failure:**
- Demoted one tier (Master → Expert, Expert → Intermediate)
- Can attempt to work back up through organic tier progression
- Application fee is not refunded

---

## 5. Fast-Track vs Organic Reviewers

### 5.1 Initial Differences

| Aspect | Fast-Track Expert | Organic Expert |
|--------|-------------------|----------------|
| **Path** | Application + verification | Reputation building from Beginner |
| **Entry Barrier** | High (rigorous screening) | Low (anyone can start) |
| **Time to Expert** | 2-4 months (app + probation) | 6-12 months (typical progression) |
| **Initial Trust** | Medium (needs probation) | High (proven track record on platform) |
| **Probation** | Yes, 30-90 days | No (already demonstrated capability) |
| **Payout During Probation** | 10% lower | N/A (full rate immediately) |
| **Review Cap** | Limited assignments during probation | No cap |
| **Mentor Requirement** | Yes (assigned Elite mentor) | Optional |
| **Platform Knowledge** | Low (new to Critvue) | High (understands norms) |

### 5.2 Parity Timeline

**Goal**: Fast-track reviewers achieve full parity with organic reviewers after successful probation.

```
Day 0: Approval
  - Fast-track starts probation
  - Assigned mentor
  - Limited assignment pool
  - 90% of tier payout rate

Day 30-90: Probation Period
  - Quality monitoring
  - Gradual increase in assignment priority
  - Regular feedback sessions

Day 31-91: Probation Completion
  - Review probation performance
  - If successful:
    * 100% tier payout rate
    * Full assignment pool access
    * All tier benefits unlocked
    * No distinction from organic reviewers in system

Day 180: Full Integration
  - Mentor relationship ends (optional to continue)
  - Eligible for mentor role themselves
  - Eligible for application reviewer role
```

### 5.3 Preventing Gaming

**Challenge**: Preventing unqualified people from fabricating credentials or portfolios.

**Anti-Gaming Measures:**

1. **Multi-Source Verification**
   - Never rely on single source of truth
   - Cross-reference claims across multiple platforms
   - Contact employers and references directly

2. **Portfolio Plagiarism Detection**
   - Reverse image search all design work
   - Code plagiarism detection for technical samples
   - Check if "their" work appears elsewhere online

3. **Behavioral Analysis**
   - Track time-to-complete during sample review (too fast = suspicious)
   - Analyze writing style consistency across application documents
   - Flag applications with multiple suspicious patterns

4. **Non-Refundable Fee Component**
   - Make it costly to attempt fraud
   - Even if rejected, lose at least 50% of fee

5. **Reference Verification Randomization**
   - Don't tell applicants which references will be contacted
   - Contact all references, not just listed ones
   - Ask references different questions to detect scripted answers

6. **Sample Review Anti-Cheating**
   - Provide review subject on-the-spot (can't prepare in advance)
   - Time-boxed completion (4 hours max)
   - Proctored via webcam (optional, for highest tiers)

7. **Background Check for Elite Tier**
   - Professional background verification service
   - LinkedIn deep dive (connections, endorsements, activity history)
   - Social media presence validation

8. **Probation as Final Filter**
   - Even if someone fakes their way through application, probation will reveal inadequacy
   - Quality metrics will surface incompetence
   - Demotion or removal occurs before significant damage

9. **Blacklist & Ban Evasion Prevention**
   - Track application fingerprints (device, IP, payment method)
   - Flag multiple applications from similar profiles
   - Permanent ban for fraudulent applications

10. **Whistleblower Program**
    - Reward existing reviewers who identify fake credentials
    - Anonymous reporting system for suspicious applications
    - Community vigilance

### 5.4 Quality Parity Monitoring

**Post-Probation Tracking:**

Even after fast-track reviewers graduate, monitor for quality divergence:

```sql
-- Quality comparison query
SELECT
  r.reviewer_tier,
  r.onboarding_path, -- 'fast_track' vs 'organic'
  AVG(rev.quality_score) as avg_quality,
  AVG(rev.client_satisfaction) as avg_satisfaction,
  AVG(rev.dispute_rate) as dispute_rate,
  COUNT(rev.id) as review_count
FROM reviewers r
JOIN reviews rev ON r.id = rev.reviewer_id
WHERE r.status = 'active'
  AND rev.completed_at >= NOW() - INTERVAL '90 days'
GROUP BY r.reviewer_tier, r.onboarding_path
ORDER BY r.reviewer_tier, r.onboarding_path;
```

**Action Plan if Quality Divergence Detected:**
- If fast-track reviewers consistently underperform organic reviewers:
  - Increase probation duration
  - Add additional verification steps
  - Require mentorship to continue longer
  - Adjust acceptance criteria to be more stringent

---

## 6. Application Lifecycle Management

### 6.1 Reapplication Rules

| Rejection Reason | Cooling Period | Can Reapply? | Notes |
|------------------|----------------|--------------|-------|
| Incomplete application | Immediate | Yes | Fix and resubmit |
| Failed credential verification | 6 months | Yes | Must provide better evidence |
| Low portfolio/sample scores | 6 months | Yes | Improve portfolio, try again |
| Fraudulent information | Permanent | No | Blacklisted |
| Failed probation (quality) | 12 months | Yes | Demonstrate improvement elsewhere |
| Failed probation (policy violations) | 12-24 months | Maybe | Depends on severity |
| Withdrawn by applicant | Immediate | Yes | No penalty |

### 6.2 Revision Request Process

**Conditional Approval Scenarios:**
- "Portfolio is strong, but we need one more recent work sample in Domain X"
- "Sample review was good but too brief - please provide a more comprehensive review"
- "Reference #2 didn't respond - please provide alternate reference"
- "We can't verify your degree - please provide official transcript"

**Process:**
1. Application moved to `REVISION_REQUESTED` state
2. Email sent with specific items needed
3. Applicant has 7 days to provide additional materials
4. If provided, expedited review (3-5 days instead of 14-21)
5. If not provided within 7 days, application auto-rejected (with 50% fee refund)

### 6.3 Appeal Process

**Grounds for Appeal:**
- Believe credentials were incorrectly verified
- Believe portfolio/sample review was unfairly scored
- New information available that wasn't in original application
- Procedural error in review process

**Appeal Process:**
1. Submit appeal within 14 days of rejection
2. Provide specific reasons and new evidence
3. Different review committee evaluates appeal
4. Appeal decision is final (no second appeal)
5. Appeal review fee: $25 (refunded if appeal succeeds)

**Appeal Outcomes:**
- **Appeal Granted**: Application reopens for full review with new committee
- **Appeal Partially Granted**: Specific element re-reviewed (e.g., just sample review)
- **Appeal Denied**: Original decision stands, enter cooling period

---

## 7. Edge Cases & Special Scenarios

### 7.1 Industry Transitions

**Scenario**: Expert-level professional transitioning from adjacent field.

Example: Senior software engineer (10 years) wants to review UX/UI design.

**Approach**:
- Acknowledge experience but evaluate against target domain
- May qualify for Expert in engineering, but only Intermediate in design
- Offer "dual-track" profile: Expert (engineering) + Intermediate (design)
- Can build design tier organically while maintaining expert engineering status

### 7.2 International Applicants

**Challenges**:
- Credential verification harder across countries
- Education systems differ globally
- Professional licenses may not exist in some countries

**Solutions**:
- Partner with international verification services (e.g., World Education Services)
- Heavier weight on portfolio and sample review if credentials unverifiable
- Accept international equivalents (e.g., European master's = US master's)
- Language proficiency requirement (English fluency for English reviews)

### 7.3 Famous/Recognized Experts

**Scenario**: Well-known industry figure applies (e.g., author of popular textbook, conference speaker).

**Approach**:
- Still require full application (no automatic approval)
- Public recognition counts heavily in portfolio evaluation
- May fast-track verification if credentials are publicly documented
- Possible reduced/waived application fee for high-profile applicants
- Shorter probation (15 days instead of 30) with white-glove onboarding

**Risk**: Don't give preferential treatment that compromises quality. Even famous experts must prove they can write good reviews.

### 7.4 Former Employees/Platform Insiders

**Scenario**: Former Critvue employee applies to become reviewer.

**Approach**:
- Potential conflict of interest if recent departure
- 6-month cooling period after employment ends
- Cannot review in areas where they had insider knowledge
- Disclose former employment status publicly on profile (transparency)
- Subject to same verification standards (no shortcuts)

### 7.5 Failed Organic Progression Attempting Fast-Track

**Scenario**: Beginner reviewer stuck at Intermediate tier, decides to apply via expert application.

**Approach**:
- Flag that they're an existing user
- Review why they couldn't progress organically (quality issues? low volume?)
- If rejected organically due to quality, likely reject fast-track too
- If stuck due to volume (not enough reviews available), portfolio may help
- Committee has full visibility into their Critvue history

**Rule**: Cannot use fast-track as a shortcut around quality issues.

### 7.6 Batch/Corporate Applications

**Scenario**: Company wants to onboard 10 of their senior consultants as Expert reviewers.

**Approach**:
- Each application evaluated individually (no bulk approval)
- Possible volume discount on application fees (e.g., 10% off for 5+ applications)
- Stagger probation periods to avoid overwhelming mentor capacity
- Assign same mentor to team (efficiency)
- Corporate partnership program possible (separate discussion)

### 7.7 Waitlist Management

**Scenario**: Strong applicant, but platform has capacity constraints (too many experts in that domain).

**Approach**:
- Place on waitlist (valid for 90 days)
- Auto-notify when capacity opens
- Guaranteed review within 30 days of notification
- Maintain verification scores (don't need to re-verify)
- Can withdraw from waitlist anytime

**Priority on Waitlist**:
1. Highest portfolio/sample scores
2. Longest time on waitlist
3. Domains with least coverage

---

## 8. Success Metrics

### 8.1 Application System Health Metrics

**Volume Metrics**:
- Applications submitted per month
- Approval rate (by tier)
- Rejection rate (by reason)
- Revision request rate
- Appeal rate

**Quality Metrics**:
- Credential verification accuracy (false positive/negative rate)
- Portfolio review inter-rater reliability (evaluator agreement)
- Sample review inter-rater reliability
- Probation success rate
- Post-probation quality scores (fast-track vs organic comparison)

**Efficiency Metrics**:
- Time to decision (by tier)
- Verification bottlenecks
- Reviewer availability for application reviews
- Cost per application processed

**Business Metrics**:
- Application fee revenue
- Cost of verification services
- ROI of application program (value created by approved experts vs cost to process)

### 8.2 Success Criteria for Fast-Track Program

**Program Goals**:
1. Attract 50+ expert-level professionals in first 6 months
2. Maintain >80% probation success rate (approved experts become successful full reviewers)
3. Achieve quality parity between fast-track and organic reviewers within 90 days
4. Keep fraud rate <2% (fraudulent applications caught and rejected)
5. Maintain <14 day average time to decision

**Warning Signs** (program needs adjustment):
- Approval rate <20% (too stringent, wasting applicants' time)
- Approval rate >60% (too lenient, quality concerns)
- Probation failure rate >30% (verification not working, bad applicants getting through)
- Fast-track reviewers consistently underperform organic reviewers
- High appeal rate (subjective evaluation criteria need calibration)

---

## Summary

This expert application system balances **accessibility** (make it worthwhile for real experts to apply) with **quality control** (prevent gaming and ensure only qualified professionals get elevated status).

**Key Design Principles**:
1. **Multi-layered verification**: Automated + human, credentials + portfolio + sample work
2. **Probation as final filter**: Even if credentials are real, must demonstrate platform fit
3. **Transparent criteria**: Applicants know exactly what's required for each tier
4. **Fair evaluation**: Multiple reviewers, calibrated scoring, appeal process
5. **Continuous monitoring**: Track fast-track vs organic quality, adjust criteria as needed
6. **Fraud prevention**: High cost to attempt fraud, low probability of success
7. **Respect for applicants**: Reasonable timelines, clear communication, fair refund policy

**Next Steps**: Database schema, API specifications, UI/UX flows, and code implementation.
