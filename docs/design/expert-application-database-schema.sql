-- =====================================================
-- EXPERT APPLICATION SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Comprehensive schema for managing expert reviewer applications,
-- verification, evaluation, and probation tracking.
-- =====================================================

-- =====================================================
-- CORE APPLICATION TABLE
-- =====================================================

CREATE TYPE application_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'credentials_verification',
    'portfolio_review',
    'sample_evaluation',
    'committee_review',
    'revision_requested',
    'resubmitted',
    'approved',
    'conditionally_approved',
    'rejected',
    'waitlisted',
    'withdrawn',
    'expired'
);

CREATE TYPE reviewer_tier AS ENUM (
    'beginner',
    'intermediate',
    'expert',
    'master',
    'elite'
);

CREATE TABLE expert_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Applicant Information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Null if not yet registered
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    professional_name VARCHAR(255),
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    country VARCHAR(100),
    timezone VARCHAR(100),

    -- Application Details
    application_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., "EXP-2025-00123"
    target_tier reviewer_tier NOT NULL,
    status application_status DEFAULT 'draft',

    -- Application Data (JSONB for flexibility)
    personal_info JSONB, -- linkedin_url, website, github, etc.
    professional_background JSONB, -- experience, employment history, summary
    credentials JSONB, -- education, certifications, licenses
    portfolio JSONB, -- work samples, publications, open source
    references JSONB, -- professional references, endorsements
    sample_review_data JSONB, -- test review submission
    availability JSONB, -- hours/week, preferences, start date

    -- Metadata
    motivation_statement TEXT, -- 1000-2000 words
    years_of_experience INTEGER,
    expertise_domain_ids UUID[], -- Array of domain IDs
    primary_specializations TEXT[],

    -- Email Verification (required for free application model)
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP,

    -- Acknowledgments
    accuracy_declaration BOOLEAN DEFAULT FALSE,
    background_check_consent BOOLEAN DEFAULT FALSE,
    probation_understanding BOOLEAN DEFAULT FALSE,
    payout_expectations BOOLEAN DEFAULT FALSE,
    code_of_conduct_agreement BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_started_at TIMESTAMP,
    decision_made_at TIMESTAMP,

    -- Review Assignment
    assigned_reviewer_id UUID REFERENCES users(id), -- Admin or coordinator
    review_deadline TIMESTAMP,

    -- Decision
    approved_tier reviewer_tier, -- Actual tier approved (may differ from target)
    decision_rationale TEXT,
    decision_made_by UUID REFERENCES users(id),

    -- Reapplication tracking
    previous_application_id UUID REFERENCES expert_applications(id),
    reapplication_count INTEGER DEFAULT 0,
    earliest_reapplication_date DATE,

    -- Flags
    is_priority BOOLEAN DEFAULT FALSE, -- VIP or expedited
    has_red_flags BOOLEAN DEFAULT FALSE,
    fraud_risk_score INTEGER DEFAULT 0, -- 0-100

    CONSTRAINT valid_experience CHECK (years_of_experience >= 0),
    CONSTRAINT valid_fraud_score CHECK (fraud_risk_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_applications_status ON expert_applications(status);
CREATE INDEX idx_applications_email ON expert_applications(email);
CREATE INDEX idx_applications_user_id ON expert_applications(user_id);
CREATE INDEX idx_applications_target_tier ON expert_applications(target_tier);
CREATE INDEX idx_applications_submitted_at ON expert_applications(submitted_at);
CREATE INDEX idx_applications_assigned_reviewer ON expert_applications(assigned_reviewer_id);

-- =====================================================
-- FILE UPLOADS
-- =====================================================

CREATE TYPE document_type AS ENUM (
    'resume_cv',
    'portfolio_sample',
    'diploma_degree',
    'certification',
    'professional_license',
    'published_work',
    'sample_review',
    'reference_letter',
    'identity_document',
    'other'
);

CREATE TYPE verification_status AS ENUM (
    'pending',
    'verified',
    'failed',
    'flagged',
    'expired'
);

CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Document Details
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT, -- bytes
    file_mime_type VARCHAR(100),
    file_hash VARCHAR(64), -- SHA-256 for duplicate detection

    -- Document Metadata
    title VARCHAR(255),
    description TEXT,
    document_date DATE, -- When document was issued/created
    issuing_organization VARCHAR(255),
    credential_id VARCHAR(255), -- For verification

    -- Verification
    verification_status verification_status DEFAULT 'pending',
    verification_notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    verification_url VARCHAR(500), -- External verification link

    -- Flags
    is_required BOOLEAN DEFAULT FALSE,
    is_plagiarism_checked BOOLEAN DEFAULT FALSE,
    plagiarism_score INTEGER, -- 0-100

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_file_size CHECK (file_size > 0)
);

CREATE INDEX idx_documents_application ON application_documents(application_id);
CREATE INDEX idx_documents_type ON application_documents(document_type);
CREATE INDEX idx_documents_verification ON application_documents(verification_status);
CREATE INDEX idx_documents_hash ON application_documents(file_hash); -- Detect duplicates

-- =====================================================
-- CREDENTIAL VERIFICATION
-- =====================================================

CREATE TYPE credential_type AS ENUM (
    'education',
    'certification',
    'professional_license',
    'employment',
    'publication',
    'open_source',
    'award',
    'other'
);

CREATE TYPE verification_method AS ENUM (
    'automated_api',
    'manual_verification',
    'reference_check',
    'document_review',
    'third_party_service',
    'self_reported',
    'unverifiable'
);

CREATE TABLE credential_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Credential Details
    credential_type credential_type NOT NULL,
    credential_name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),
    issue_date DATE,
    expiration_date DATE,
    credential_id VARCHAR(255),

    -- Claimed Information
    claimed_details JSONB, -- What applicant stated

    -- Verification
    verification_method verification_method,
    verification_status verification_status DEFAULT 'pending',
    verification_score INTEGER, -- 0=unverifiable, 1=self-reported, 2=partial, 3=full
    verification_details JSONB, -- API responses, notes, etc.
    verification_url VARCHAR(500),

    -- Verification Timestamps
    verification_started_at TIMESTAMP,
    verification_completed_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),

    -- Third-party service tracking
    external_service_name VARCHAR(100), -- e.g., "Credly", "NSC", "LinkedIn"
    external_verification_id VARCHAR(255),
    external_verification_response JSONB,

    -- Flags
    is_verified BOOLEAN DEFAULT FALSE,
    is_contradictory BOOLEAN DEFAULT FALSE, -- Evidence contradicts claim
    requires_manual_review BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_verification_score CHECK (verification_score BETWEEN 0 AND 3)
);

CREATE INDEX idx_credentials_application ON credential_verifications(application_id);
CREATE INDEX idx_credentials_status ON credential_verifications(verification_status);
CREATE INDEX idx_credentials_type ON credential_verifications(credential_type);

-- =====================================================
-- REFERENCES
-- =====================================================

CREATE TYPE reference_type AS ENUM (
    'professional_reference',
    'peer_endorsement',
    'client_testimonial',
    'academic_reference',
    'platform_reference'
);

CREATE TYPE reference_status AS ENUM (
    'pending_contact',
    'contacted',
    'responded',
    'verified',
    'no_response',
    'declined',
    'invalid'
);

CREATE TABLE application_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Reference Details
    reference_type reference_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(255), -- e.g., "Former Manager"
    company VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),

    -- Reference Content
    endorsement_text TEXT,
    can_verify TEXT[], -- e.g., ["employment", "skills", "work_quality"]

    -- Contact & Verification
    reference_status reference_status DEFAULT 'pending_contact',
    contact_attempted_at TIMESTAMP,
    contact_count INTEGER DEFAULT 0,
    responded_at TIMESTAMP,
    response_details JSONB,

    -- Verification
    verified_by UUID REFERENCES users(id),
    verification_notes TEXT,
    verification_score INTEGER, -- How strongly do they support applicant? 1-5

    -- Flags
    is_required BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    response_suspicious BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_verification_score CHECK (verification_score BETWEEN 1 AND 5)
);

CREATE INDEX idx_references_application ON application_references(application_id);
CREATE INDEX idx_references_status ON application_references(reference_status);
CREATE INDEX idx_references_type ON application_references(reference_type);

-- =====================================================
-- PORTFOLIO EVALUATION
-- =====================================================

CREATE TABLE portfolio_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Reviewer Assignment
    reviewer_id UUID NOT NULL REFERENCES users(id), -- Existing Master/Elite reviewer
    reviewer_tier reviewer_tier, -- Tier of the evaluator

    -- Evaluation Scores (0-10 scale)
    technical_competence_score DECIMAL(3, 1), -- 0-10
    depth_of_expertise_score DECIMAL(3, 1),
    complexity_score DECIMAL(3, 1),
    accuracy_score DECIMAL(3, 1),
    innovation_score DECIMAL(3, 1),

    work_quality_score DECIMAL(3, 1),
    polish_score DECIMAL(3, 1),
    attention_to_detail_score DECIMAL(3, 1),
    completeness_score DECIMAL(3, 1),

    relevance_score DECIMAL(3, 1),
    recency_score DECIMAL(3, 1),

    impact_score DECIMAL(3, 1),
    recognition_score DECIMAL(3, 1),

    -- Total Score (0-100)
    total_score DECIMAL(5, 2), -- Weighted sum

    -- Qualitative Feedback
    strengths TEXT,
    weaknesses TEXT,
    concerns TEXT,
    overall_assessment TEXT,

    -- Recommendation
    recommended_tier reviewer_tier,
    confidence_level INTEGER, -- 1-5, how confident in this assessment

    -- Meta
    time_spent_minutes INTEGER,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    is_complete BOOLEAN DEFAULT FALSE,

    -- Payment
    reviewer_payment_amount DECIMAL(10, 2) DEFAULT 50.00,
    reviewer_paid BOOLEAN DEFAULT FALSE,

    CONSTRAINT valid_scores CHECK (
        technical_competence_score BETWEEN 0 AND 10 AND
        depth_of_expertise_score BETWEEN 0 AND 10 AND
        complexity_score BETWEEN 0 AND 10 AND
        accuracy_score BETWEEN 0 AND 10 AND
        innovation_score BETWEEN 0 AND 10 AND
        work_quality_score BETWEEN 0 AND 10 AND
        polish_score BETWEEN 0 AND 10 AND
        attention_to_detail_score BETWEEN 0 AND 10 AND
        completeness_score BETWEEN 0 AND 10 AND
        relevance_score BETWEEN 0 AND 10 AND
        recency_score BETWEEN 0 AND 10 AND
        impact_score BETWEEN 0 AND 10 AND
        recognition_score BETWEEN 0 AND 10 AND
        total_score BETWEEN 0 AND 100
    ),
    CONSTRAINT valid_confidence CHECK (confidence_level BETWEEN 1 AND 5)
);

CREATE INDEX idx_portfolio_reviews_application ON portfolio_reviews(application_id);
CREATE INDEX idx_portfolio_reviews_reviewer ON portfolio_reviews(reviewer_id);
CREATE INDEX idx_portfolio_reviews_complete ON portfolio_reviews(is_complete);

-- =====================================================
-- SAMPLE REVIEW EVALUATION
-- =====================================================

CREATE TABLE sample_review_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Evaluator Assignment
    evaluator_id UUID NOT NULL REFERENCES users(id), -- Existing reviewer at target tier+
    evaluator_tier reviewer_tier,

    -- Evaluation Scores (0-10 or weighted scales)
    thoroughness_coverage_score DECIMAL(3, 1), -- 0-10
    thoroughness_detail_score DECIMAL(3, 1), -- 0-10

    technical_accuracy_score DECIMAL(3, 1), -- 0-15
    terminology_score DECIMAL(3, 1), -- 0-10

    actionability_recommendations_score DECIMAL(3, 1), -- 0-10
    actionability_prioritization_score DECIMAL(3, 1), -- 0-10

    communication_clarity_score DECIMAL(3, 1), -- 0-8
    communication_tone_score DECIMAL(3, 1), -- 0-7

    insight_depth_score DECIMAL(3, 1), -- 0-10
    expert_thinking_score DECIMAL(3, 1), -- 0-10

    -- Total Score (0-100)
    total_score DECIMAL(5, 2),

    -- Qualitative Feedback
    strengths TEXT,
    weaknesses TEXT,
    missing_elements TEXT,
    overall_assessment TEXT,

    -- Recommendation
    passes_threshold BOOLEAN,
    recommended_tier reviewer_tier,
    confidence_level INTEGER, -- 1-5

    -- Plagiarism Check
    plagiarism_checked BOOLEAN DEFAULT FALSE,
    plagiarism_score INTEGER, -- 0-100
    plagiarism_sources JSONB, -- URLs where similar content found

    -- Meta
    time_spent_minutes INTEGER,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    is_complete BOOLEAN DEFAULT FALSE,

    -- Payment
    evaluator_payment_amount DECIMAL(10, 2) DEFAULT 30.00,
    evaluator_paid BOOLEAN DEFAULT FALSE,

    CONSTRAINT valid_scores CHECK (
        thoroughness_coverage_score BETWEEN 0 AND 10 AND
        thoroughness_detail_score BETWEEN 0 AND 10 AND
        technical_accuracy_score BETWEEN 0 AND 15 AND
        terminology_score BETWEEN 0 AND 10 AND
        actionability_recommendations_score BETWEEN 0 AND 10 AND
        actionability_prioritization_score BETWEEN 0 AND 10 AND
        communication_clarity_score BETWEEN 0 AND 8 AND
        communication_tone_score BETWEEN 0 AND 7 AND
        insight_depth_score BETWEEN 0 AND 10 AND
        expert_thinking_score BETWEEN 0 AND 10 AND
        total_score BETWEEN 0 AND 100
    ),
    CONSTRAINT valid_confidence CHECK (confidence_level BETWEEN 1 AND 5),
    CONSTRAINT valid_plagiarism_score CHECK (plagiarism_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_sample_reviews_application ON sample_review_evaluations(application_id);
CREATE INDEX idx_sample_reviews_evaluator ON sample_review_evaluations(evaluator_id);
CREATE INDEX idx_sample_reviews_complete ON sample_review_evaluations(is_complete);

-- =====================================================
-- COMMITTEE REVIEW
-- =====================================================

CREATE TYPE committee_vote AS ENUM (
    'approve',
    'conditional_approve',
    'reject',
    'waitlist',
    'abstain'
);

CREATE TABLE committee_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_date TIMESTAMP NOT NULL,
    meeting_type VARCHAR(50) DEFAULT 'expert_application_review',

    -- Committee Composition
    chair_id UUID REFERENCES users(id),
    member_ids UUID[], -- Array of reviewer IDs

    -- Applications Reviewed
    application_ids UUID[], -- Array of application IDs discussed

    -- Meeting Notes
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE committee_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES committee_meetings(id),

    -- Committee Member Votes
    voter_id UUID NOT NULL REFERENCES users(id),
    voter_tier reviewer_tier,
    vote committee_vote NOT NULL,
    vote_rationale TEXT,

    -- Conditions (if conditional approval)
    conditions_required TEXT[],

    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE committee_final_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES expert_applications(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES committee_meetings(id),

    -- Final Decision
    decision committee_vote NOT NULL,
    approved_tier reviewer_tier, -- If approved/conditional

    -- Vote Tally
    approve_votes INTEGER DEFAULT 0,
    conditional_votes INTEGER DEFAULT 0,
    reject_votes INTEGER DEFAULT 0,
    waitlist_votes INTEGER DEFAULT 0,
    abstain_votes INTEGER DEFAULT 0,

    -- Decision Details
    decision_rationale TEXT NOT NULL,
    conditions TEXT[], -- If conditional approval
    improvement_suggestions TEXT, -- If rejected, what to improve

    -- Probation Details (if approved)
    probation_duration_days INTEGER, -- e.g., 30, 60, 90
    probation_review_count INTEGER, -- Minimum reviews during probation
    probation_mentor_assigned UUID REFERENCES users(id),

    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_by UUID REFERENCES users(id) -- Committee chair
);

CREATE INDEX idx_committee_decisions_application ON committee_decisions(application_id);
CREATE INDEX idx_committee_decisions_meeting ON committee_decisions(meeting_id);
CREATE INDEX idx_committee_final_application ON committee_final_decisions(application_id);

-- =====================================================
-- PROBATION TRACKING
-- =====================================================

CREATE TYPE probation_status AS ENUM (
    'active',
    'extended',
    'completed',
    'failed',
    'demoted'
);

CREATE TABLE reviewer_probation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),

    -- Probation Details
    assigned_tier reviewer_tier NOT NULL,
    probation_status probation_status DEFAULT 'active',

    -- Duration
    probation_start_date DATE NOT NULL,
    probation_end_date DATE NOT NULL,
    extended_end_date DATE, -- If probation extended
    actual_end_date DATE,

    -- Requirements
    minimum_reviews_required INTEGER NOT NULL,
    reviews_completed INTEGER DEFAULT 0,

    -- Performance Metrics
    average_quality_score DECIMAL(3, 2), -- Out of 5.0
    average_client_satisfaction DECIMAL(3, 2), -- Out of 5.0
    on_time_delivery_rate DECIMAL(5, 2), -- Percentage
    policy_violations_count INTEGER DEFAULT 0,
    disputes_count INTEGER DEFAULT 0,

    -- Mentor
    mentor_id UUID REFERENCES users(id),
    mentor_check_in_count INTEGER DEFAULT 0,
    last_mentor_check_in TIMESTAMP,

    -- Decision
    final_decision VARCHAR(50), -- 'promote', 'demote', 'extend'
    final_tier reviewer_tier, -- Tier after probation
    decision_rationale TEXT,
    decided_by UUID REFERENCES users(id),
    decided_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_reviews CHECK (reviews_completed >= 0 AND reviews_completed <= minimum_reviews_required + 100),
    CONSTRAINT valid_violations CHECK (policy_violations_count >= 0)
);

CREATE INDEX idx_probation_reviewer ON reviewer_probation(reviewer_id);
CREATE INDEX idx_probation_status ON reviewer_probation(probation_status);
CREATE INDEX idx_probation_mentor ON reviewer_probation(mentor_id);

-- =====================================================
-- APPEALS
-- =====================================================

CREATE TYPE appeal_status AS ENUM (
    'submitted',
    'under_review',
    'granted',
    'partially_granted',
    'denied'
);

CREATE TABLE application_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Appeal Details
    appeal_status appeal_status DEFAULT 'submitted',
    appeal_grounds TEXT NOT NULL, -- Why appealing
    new_evidence_description TEXT,

    -- New Evidence
    new_document_ids UUID[], -- References to application_documents
    new_credential_data JSONB,

    -- Review
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,

    -- Decision
    appeal_decision appeal_status,
    decision_rationale TEXT,
    decided_at TIMESTAMP,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appeals_application ON application_appeals(application_id);
CREATE INDEX idx_appeals_status ON application_appeals(appeal_status);

-- =====================================================
-- WAITLIST MANAGEMENT
-- =====================================================

CREATE TABLE application_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Waitlist Details
    tier_requested reviewer_tier NOT NULL,
    domain_ids UUID[], -- Domains applicant wants to review

    -- Scoring (for priority)
    portfolio_score DECIMAL(5, 2),
    sample_review_score DECIMAL(5, 2),
    overall_score DECIMAL(5, 2), -- Combined score

    -- Waitlist Management
    added_to_waitlist_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- 90 days from addition
    priority_score INTEGER, -- 0-100, higher = higher priority

    -- Notifications
    notified_of_opening BOOLEAN DEFAULT FALSE,
    notified_at TIMESTAMP,
    notification_response_deadline TIMESTAMP,

    -- Outcome
    activated BOOLEAN DEFAULT FALSE,
    activated_at TIMESTAMP,
    withdrawn BOOLEAN DEFAULT FALSE,
    withdrawn_at TIMESTAMP,
    expired BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_waitlist_tier ON application_waitlist(tier_requested);
CREATE INDEX idx_waitlist_expires ON application_waitlist(expires_at);
CREATE INDEX idx_waitlist_priority ON application_waitlist(priority_score DESC);

-- =====================================================
-- ACTIVITY LOG
-- =====================================================

CREATE TABLE application_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Activity Details
    activity_type VARCHAR(100) NOT NULL, -- e.g., "status_change", "document_upload", "verification_complete"
    actor_id UUID REFERENCES users(id), -- Who performed the action
    actor_type VARCHAR(50), -- 'applicant', 'admin', 'reviewer', 'system'

    -- Activity Data
    previous_state VARCHAR(100),
    new_state VARCHAR(100),
    details JSONB,
    notes TEXT,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_application ON application_activity_log(application_id);
CREATE INDEX idx_activity_log_created ON application_activity_log(created_at DESC);

-- =====================================================
-- FRAUD DETECTION
-- =====================================================

CREATE TABLE fraud_detection_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES expert_applications(id) ON DELETE CASCADE,

    -- Check Type
    check_type VARCHAR(100) NOT NULL, -- e.g., "duplicate_detection", "ip_analysis", "behavior_analysis"

    -- Results
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score INTEGER, -- 0-100
    risk_factors JSONB, -- What triggered suspicion

    -- Details
    check_details JSONB,
    automated BOOLEAN DEFAULT TRUE,

    -- Review
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    false_positive BOOLEAN, -- Flagged but actually legitimate

    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_risk_score CHECK (risk_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_fraud_checks_application ON fraud_detection_checks(application_id);
CREATE INDEX idx_fraud_checks_suspicious ON fraud_detection_checks(is_suspicious);

-- =====================================================
-- BLACKLIST
-- =====================================================

CREATE TABLE application_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity Markers
    email VARCHAR(255),
    phone VARCHAR(50),
    ip_address INET,
    device_fingerprint VARCHAR(255),

    -- Reason
    blacklist_reason TEXT NOT NULL,
    related_application_id UUID REFERENCES expert_applications(id),

    -- Meta
    blacklisted_by UUID REFERENCES users(id),
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- NULL for permanent ban
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_blacklist_email ON application_blacklist(email) WHERE is_active = TRUE;
CREATE INDEX idx_blacklist_phone ON application_blacklist(phone) WHERE is_active = TRUE;
CREATE INDEX idx_blacklist_ip ON application_blacklist(ip_address) WHERE is_active = TRUE;

-- =====================================================
-- RATE LIMITING (Spam Prevention for Free Applications)
-- =====================================================

CREATE TABLE application_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity Markers
    email VARCHAR(255),
    ip_address INET,
    user_id UUID REFERENCES users(id),

    -- Rate Limit Tracking
    application_count INTEGER DEFAULT 1,
    first_application_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_application_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Window (30 days for email, 30 days for IP)
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days',

    -- Violation Tracking
    is_violation BOOLEAN DEFAULT FALSE,
    violation_count INTEGER DEFAULT 0,
    last_violation_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rate_limits_email ON application_rate_limits(email);
CREATE INDEX idx_rate_limits_ip ON application_rate_limits(ip_address);
CREATE INDEX idx_rate_limits_window ON application_rate_limits(window_end);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_email VARCHAR(255),
    p_ip_address INET,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    email_limit_record RECORD;
    ip_limit_record RECORD;
    email_exceeded BOOLEAN := FALSE;
    ip_exceeded BOOLEAN := FALSE;
BEGIN
    -- Check email-based rate limit (max 1 per 30 days)
    SELECT * INTO email_limit_record
    FROM application_rate_limits
    WHERE email = p_email
      AND window_end > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1;

    IF email_limit_record.id IS NOT NULL THEN
        IF email_limit_record.application_count >= 1 THEN
            email_exceeded := TRUE;
        END IF;
    END IF;

    -- Check IP-based rate limit (max 3 per 30 days)
    IF p_ip_address IS NOT NULL THEN
        SELECT * INTO ip_limit_record
        FROM application_rate_limits
        WHERE ip_address = p_ip_address
          AND window_end > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
        LIMIT 1;

        IF ip_limit_record.id IS NOT NULL THEN
            IF ip_limit_record.application_count >= 3 THEN
                ip_exceeded := TRUE;
            END IF;
        END IF;
    END IF;

    -- Return TRUE if rate limit is exceeded
    RETURN email_exceeded OR ip_exceeded;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS & REPORTING
-- =====================================================

CREATE TABLE application_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Time Period
    metric_date DATE NOT NULL,

    -- Volume Metrics
    applications_submitted INTEGER DEFAULT 0,
    applications_approved INTEGER DEFAULT 0,
    applications_rejected INTEGER DEFAULT 0,
    applications_waitlisted INTEGER DEFAULT 0,

    -- By Tier
    expert_applications INTEGER DEFAULT 0,
    master_applications INTEGER DEFAULT 0,
    elite_applications INTEGER DEFAULT 0,

    expert_approvals INTEGER DEFAULT 0,
    master_approvals INTEGER DEFAULT 0,
    elite_approvals INTEGER DEFAULT 0,

    -- Efficiency Metrics
    avg_time_to_decision_days DECIMAL(5, 2),
    avg_credential_verification_days DECIMAL(5, 2),
    avg_portfolio_review_days DECIMAL(5, 2),

    -- Quality Metrics
    avg_portfolio_score DECIMAL(5, 2),
    avg_sample_review_score DECIMAL(5, 2),
    probation_success_rate DECIMAL(5, 2), -- Percentage

    -- Financial (program costs)
    total_verification_costs DECIMAL(10, 2),
    total_reviewer_payments DECIMAL(10, 2),

    -- Spam Prevention Metrics
    spam_applications_blocked INTEGER DEFAULT 0,
    rate_limit_violations INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_metric_date UNIQUE (metric_date)
);

CREATE INDEX idx_metrics_date ON application_metrics(metric_date DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate portfolio review average score
CREATE OR REPLACE FUNCTION calculate_portfolio_average(app_id UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
    avg_score DECIMAL(5, 2);
BEGIN
    SELECT AVG(total_score)
    INTO avg_score
    FROM portfolio_reviews
    WHERE application_id = app_id
      AND is_complete = TRUE;

    RETURN COALESCE(avg_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate sample review average score
CREATE OR REPLACE FUNCTION calculate_sample_review_average(app_id UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
    avg_score DECIMAL(5, 2);
BEGIN
    SELECT AVG(total_score)
    INTO avg_score
    FROM sample_review_evaluations
    WHERE application_id = app_id
      AND is_complete = TRUE;

    RETURN COALESCE(avg_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate credential verification score
CREATE OR REPLACE FUNCTION calculate_credential_verification_score(app_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
    earned_points INTEGER;
    verification_percentage INTEGER;
BEGIN
    -- Each credential can earn 0-3 points
    SELECT
        COUNT(*) * 3 AS total_points,
        SUM(verification_score) AS earned_points
    INTO total_points, earned_points
    FROM credential_verifications
    WHERE application_id = app_id;

    IF total_points = 0 THEN
        RETURN 0;
    END IF;

    verification_percentage := ROUND((earned_points::DECIMAL / total_points::DECIMAL) * 100);

    RETURN verification_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to update application status
CREATE OR REPLACE FUNCTION update_application_status(
    app_id UUID,
    new_status application_status,
    actor_id UUID DEFAULT NULL,
    notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    old_status application_status;
BEGIN
    -- Get current status
    SELECT status INTO old_status
    FROM expert_applications
    WHERE id = app_id;

    -- Update status
    UPDATE expert_applications
    SET status = new_status,
        last_updated_at = CURRENT_TIMESTAMP
    WHERE id = app_id;

    -- Log activity
    INSERT INTO application_activity_log (
        application_id,
        activity_type,
        actor_id,
        previous_state,
        new_state,
        notes
    ) VALUES (
        app_id,
        'status_change',
        actor_id,
        old_status::VARCHAR,
        new_status::VARCHAR,
        notes
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Application Dashboard Summary
CREATE VIEW application_dashboard AS
SELECT
    a.id,
    a.application_number,
    a.full_name,
    a.email,
    a.target_tier,
    a.status,
    a.submitted_at,
    a.review_deadline,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - a.submitted_at)) AS days_since_submission,

    -- Verification Progress
    calculate_credential_verification_score(a.id) AS credential_verification_score,

    -- Review Progress
    (SELECT COUNT(*) FROM portfolio_reviews WHERE application_id = a.id AND is_complete = TRUE) AS completed_portfolio_reviews,
    (SELECT COUNT(*) FROM sample_review_evaluations WHERE application_id = a.id AND is_complete = TRUE) AS completed_sample_evaluations,

    -- Scores
    calculate_portfolio_average(a.id) AS avg_portfolio_score,
    calculate_sample_review_average(a.id) AS avg_sample_review_score,

    -- Flags
    a.has_red_flags,
    a.fraud_risk_score,
    a.is_priority
FROM expert_applications a;

-- View: Reviewer Workload
CREATE VIEW reviewer_application_workload AS
SELECT
    r.id AS reviewer_id,
    u.full_name AS reviewer_name,
    r.reviewer_tier,

    -- Portfolio Reviews Assigned
    (SELECT COUNT(*) FROM portfolio_reviews pr
     WHERE pr.reviewer_id = r.id AND pr.is_complete = FALSE) AS pending_portfolio_reviews,

    -- Sample Reviews Assigned
    (SELECT COUNT(*) FROM sample_review_evaluations sre
     WHERE sre.evaluator_id = r.id AND sre.is_complete = FALSE) AS pending_sample_reviews,

    -- Total Workload
    (SELECT COUNT(*) FROM portfolio_reviews pr
     WHERE pr.reviewer_id = r.id AND pr.is_complete = FALSE) +
    (SELECT COUNT(*) FROM sample_review_evaluations sre
     WHERE sre.evaluator_id = r.id AND sre.is_complete = FALSE) AS total_pending_reviews
FROM reviewers r
JOIN users u ON r.user_id = u.id
WHERE r.can_review_applications = TRUE;

-- View: Probation Monitoring
CREATE VIEW probation_dashboard AS
SELECT
    p.id,
    p.reviewer_id,
    u.full_name AS reviewer_name,
    p.assigned_tier,
    p.probation_status,
    p.probation_start_date,
    p.probation_end_date,
    EXTRACT(DAY FROM (p.probation_end_date - CURRENT_DATE)) AS days_remaining,

    p.minimum_reviews_required,
    p.reviews_completed,
    (p.reviews_completed::DECIMAL / p.minimum_reviews_required::DECIMAL * 100) AS completion_percentage,

    p.average_quality_score,
    p.average_client_satisfaction,
    p.on_time_delivery_rate,
    p.policy_violations_count,

    p.mentor_id,
    m.full_name AS mentor_name,
    p.last_mentor_check_in,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.last_mentor_check_in)) AS days_since_mentor_check_in
FROM reviewer_probation p
JOIN users u ON p.reviewer_id = u.id
LEFT JOIN users m ON p.mentor_id = m.id
WHERE p.probation_status = 'active';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Auto-update last_updated_at on application changes
CREATE OR REPLACE FUNCTION update_application_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_application_timestamp
BEFORE UPDATE ON expert_applications
FOR EACH ROW
EXECUTE FUNCTION update_application_timestamp();

-- Trigger: Log all status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_activity_log (
            application_id,
            activity_type,
            previous_state,
            new_state,
            actor_type
        ) VALUES (
            NEW.id,
            'status_change',
            OLD.status::VARCHAR,
            NEW.status::VARCHAR,
            'system'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
AFTER UPDATE ON expert_applications
FOR EACH ROW
EXECUTE FUNCTION log_status_change();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Example: Create a test application
COMMENT ON TABLE expert_applications IS 'Core table for expert reviewer applications. Tracks the entire application lifecycle from submission to decision.';
COMMENT ON TABLE application_documents IS 'Stores uploaded documents (resumes, portfolios, credentials) associated with applications.';
COMMENT ON TABLE credential_verifications IS 'Tracks verification of claimed credentials (education, certifications, employment) through automated and manual methods.';
COMMENT ON TABLE portfolio_reviews IS 'Peer reviews of applicant portfolios by existing expert reviewers.';
COMMENT ON TABLE sample_review_evaluations IS 'Evaluations of applicant-submitted test reviews to assess review quality.';
COMMENT ON TABLE committee_final_decisions IS 'Final decisions made by review committee on applications.';
COMMENT ON TABLE reviewer_probation IS 'Tracks probationary period for newly approved expert reviewers.';
COMMENT ON TABLE application_appeals IS 'Handles appeals of rejected applications.';
