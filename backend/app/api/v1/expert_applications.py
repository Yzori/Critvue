"""
Expert Application API Endpoints

RESTful API for managing expert reviewer applications.
"""

from typing import List, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, validator

from app.core.database import get_db
from app.core.auth import get_current_user, get_current_admin
from app.models.user import User
from app.models.expert_application import ReviewerTier, ApplicationStatus
from app.services.expert_application_service import ApplicationService
from app.core.exceptions import ApplicationError, ValidationError


router = APIRouter(prefix="/api/v1/expert-applications", tags=["expert-applications"])


# =====================================================
# PYDANTIC SCHEMAS
# =====================================================

class ApplicationCreate(BaseModel):
    """Schema for creating a new application"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    professional_name: Optional[str] = Field(None, max_length=255)
    country: str
    timezone: str
    target_tier: ReviewerTier

    personal_info: Optional[dict] = None
    professional_background: Optional[dict] = None
    credentials: Optional[dict] = None
    portfolio: Optional[dict] = None
    references: Optional[dict] = None
    availability: Optional[dict] = None

    years_of_experience: Optional[int] = Field(None, ge=0)
    expertise_domain_ids: List[UUID] = Field(..., min_items=1)
    primary_specializations: List[str] = Field(..., min_items=1)


class ApplicationUpdate(BaseModel):
    """Schema for updating an existing application"""
    professional_name: Optional[str] = None
    personal_info: Optional[dict] = None
    professional_background: Optional[dict] = None
    credentials: Optional[dict] = None
    portfolio: Optional[dict] = None
    references: Optional[dict] = None
    sample_review_data: Optional[dict] = None
    availability: Optional[dict] = None
    motivation_statement: Optional[str] = None
    years_of_experience: Optional[int] = None
    primary_specializations: Optional[List[str]] = None


class ApplicationSubmit(BaseModel):
    """Schema for submitting an application (no payment required)"""
    accuracy_declaration: bool = Field(..., description="Certify information is accurate")
    background_check_consent: bool = Field(..., description="Consent to background checks")
    probation_understanding: bool = Field(..., description="Understand probation period")
    payout_expectations: bool = Field(..., description="Understand payout structure")
    code_of_conduct_agreement: bool = Field(..., description="Agree to code of conduct")

    @validator('accuracy_declaration', 'background_check_consent', 'probation_understanding',
               'payout_expectations', 'code_of_conduct_agreement')
    def must_be_true(cls, v, field):
        if not v:
            raise ValueError(f"{field.name} must be accepted")
        return v


class PortfolioReviewSubmission(BaseModel):
    """Schema for submitting a portfolio review evaluation"""
    # Technical/Professional Competence (40 points)
    depth_of_expertise_score: float = Field(..., ge=0, le=10)
    complexity_score: float = Field(..., ge=0, le=10)
    accuracy_score: float = Field(..., ge=0, le=10)
    innovation_score: float = Field(..., ge=0, le=10)

    # Work Quality (30 points)
    polish_score: float = Field(..., ge=0, le=10)
    attention_to_detail_score: float = Field(..., ge=0, le=10)
    completeness_score: float = Field(..., ge=0, le=10)

    # Relevance & Recency (20 points)
    relevance_score: float = Field(..., ge=0, le=10)
    recency_score: float = Field(..., ge=0, le=10)

    # Impact & Results (10 points)
    impact_score: float = Field(..., ge=0, le=5)
    recognition_score: float = Field(..., ge=0, le=5)

    # Qualitative Feedback
    strengths: str = Field(..., min_length=100, max_length=500)
    weaknesses: str = Field(..., min_length=50, max_length=300)
    concerns: Optional[str] = Field(None, max_length=300)
    overall_assessment: str = Field(..., min_length=100, max_length=300)

    # Recommendation
    recommended_tier: ReviewerTier
    confidence_level: int = Field(..., ge=1, le=5)
    time_spent_minutes: int = Field(..., ge=1)


class SampleReviewEvaluationSubmission(BaseModel):
    """Schema for submitting a sample review evaluation"""
    # Scoring
    thoroughness_coverage_score: float = Field(..., ge=0, le=10)
    thoroughness_detail_score: float = Field(..., ge=0, le=10)
    technical_accuracy_score: float = Field(..., ge=0, le=15)
    terminology_score: float = Field(..., ge=0, le=10)
    actionability_recommendations_score: float = Field(..., ge=0, le=10)
    actionability_prioritization_score: float = Field(..., ge=0, le=10)
    communication_clarity_score: float = Field(..., ge=0, le=8)
    communication_tone_score: float = Field(..., ge=0, le=7)
    insight_depth_score: float = Field(..., ge=0, le=10)
    expert_thinking_score: float = Field(..., ge=0, le=10)

    # Feedback
    strengths: str
    weaknesses: str
    missing_elements: Optional[str] = None
    overall_assessment: str

    # Recommendation
    passes_threshold: bool
    recommended_tier: ReviewerTier
    confidence_level: int = Field(..., ge=1, le=5)
    time_spent_minutes: int


class CommitteeDecisionCreate(BaseModel):
    """Schema for recording committee decision"""
    decision: str = Field(..., regex="^(approve|conditional_approve|reject|waitlist)$")
    approved_tier: Optional[ReviewerTier] = None
    decision_rationale: str = Field(..., min_length=100)
    committee_votes: List[dict]

    # For approvals
    probation_duration_days: Optional[int] = Field(None, ge=14, le=180)
    probation_review_count: Optional[int] = Field(None, ge=5, le=50)
    mentor_id: Optional[UUID] = None

    # For conditional approvals
    conditions: Optional[List[str]] = None


class ApplicationResponse(BaseModel):
    """Schema for application response"""
    id: UUID
    application_number: str
    email: str
    full_name: str
    target_tier: ReviewerTier
    status: ApplicationStatus
    created_at: datetime
    submitted_at: Optional[datetime]
    decision_made_at: Optional[datetime]
    approved_tier: Optional[ReviewerTier]
    email_verified: bool = False

    # Summary metrics
    credential_verification_score: Optional[int] = None
    portfolio_average_score: Optional[float] = None
    sample_review_average_score: Optional[float] = None
    has_red_flags: bool = False
    fraud_risk_score: int = 0

    class Config:
        orm_mode = True


# =====================================================
# APPLICANT ENDPOINTS
# =====================================================

@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ApplicationCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new expert application (draft state).

    Requires:
    - Basic personal/professional information
    - Target tier (Expert, Master, or Elite)
    - At least one expertise domain

    Returns:
    - Application ID and number for tracking
    - Application is completely free (no payment required)
    """
    try:
        service = ApplicationService(db)

        application = service.create_application(
            user_id=current_user.id if current_user else None,
            email=application_data.email,
            full_name=application_data.full_name,
            target_tier=application_data.target_tier,
            professional_name=application_data.professional_name,
            country=application_data.country,
            timezone=application_data.timezone,
            personal_info=application_data.personal_info,
            professional_background=application_data.professional_background,
            credentials=application_data.credentials,
            portfolio=application_data.portfolio,
            references=application_data.references,
            availability=application_data.availability,
            years_of_experience=application_data.years_of_experience,
            expertise_domain_ids=application_data.expertise_domain_ids,
            primary_specializations=application_data.primary_specializations
        )

        return application

    except (ApplicationError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create application"
        )


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get application details.

    Applicants can view their own applications.
    Admins can view any application.
    """
    from app.models.expert_application import ExpertApplication

    application = db.query(ExpertApplication).filter(
        ExpertApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # Authorization: own application or admin
    if application.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return application


@router.patch("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: UUID,
    update_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update application (only allowed in draft state).

    Allows applicants to update their application before submission.
    """
    from app.models.expert_application import ExpertApplication

    application = db.query(ExpertApplication).filter(
        ExpertApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # Authorization
    if application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Can only update draft applications
    if application.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update application in {application.status.value} state"
        )

    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    return application


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
async def submit_application(
    application_id: UUID,
    submission_data: ApplicationSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit application for review (no payment required).

    This moves the application from DRAFT to SUBMITTED status
    and initiates the review process.

    Requires:
    - Email verification
    - All acknowledgments/agreements
    - Complete application data
    """
    from app.models.expert_application import ExpertApplication

    application = db.query(ExpertApplication).filter(
        ExpertApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # Authorization
    if application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Update acknowledgments
    application.accuracy_declaration = submission_data.accuracy_declaration
    application.background_check_consent = submission_data.background_check_consent
    application.probation_understanding = submission_data.probation_understanding
    application.payout_expectations = submission_data.payout_expectations
    application.code_of_conduct_agreement = submission_data.code_of_conduct_agreement

    db.commit()

    try:
        service = ApplicationService(db)
        updated_application = service.submit_application(
            application_id=application_id
        )

        return updated_application

    except (ApplicationError, ValidationError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{application_id}/documents/upload")
async def upload_document(
    application_id: UUID,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a document to an application.

    Supported document types:
    - resume_cv
    - portfolio_sample
    - diploma_degree
    - certification
    - professional_license
    - sample_review
    - reference_letter
    - identity_document
    """
    from app.models.expert_application import ExpertApplication, ApplicationDocument
    from app.services.file_service import FileService

    application = db.query(ExpertApplication).filter(
        ExpertApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # Authorization
    if application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Upload file
    file_service = FileService()
    file_path, file_hash = await file_service.upload_application_document(
        file=file,
        application_id=application_id
    )

    # Create document record
    document = ApplicationDocument(
        application_id=application_id,
        document_type=document_type,
        file_name=file.filename,
        file_path=file_path,
        file_size=file.size,
        file_mime_type=file.content_type,
        file_hash=file_hash,
        title=title,
        description=description
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {"id": document.id, "file_path": file_path, "status": "uploaded"}


@router.delete("/{application_id}/withdraw")
async def withdraw_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Withdraw an application.

    Applicant can withdraw at any point before final decision.
    """
    from app.models.expert_application import ExpertApplication

    application = db.query(ExpertApplication).filter(
        ExpertApplication.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    # Authorization
    if application.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Cannot withdraw after decision
    if application.status in [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw application after decision has been made"
        )

    # Update status
    application.status = ApplicationStatus.WITHDRAWN

    db.commit()

    return {"status": "withdrawn"}


# =====================================================
# REVIEWER ENDPOINTS (Portfolio & Sample Review)
# =====================================================

@router.get("/reviewer/assignments")
async def get_reviewer_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current reviewer's application review assignments.

    Returns both portfolio reviews and sample review evaluations.
    """
    from app.models.expert_application import PortfolioReview, SampleReviewEvaluation

    # Portfolio reviews
    portfolio_reviews = db.query(PortfolioReview).filter(
        and_(
            PortfolioReview.reviewer_id == current_user.id,
            PortfolioReview.is_complete == False
        )
    ).all()

    # Sample evaluations
    sample_evaluations = db.query(SampleReviewEvaluation).filter(
        and_(
            SampleReviewEvaluation.evaluator_id == current_user.id,
            SampleReviewEvaluation.is_complete == False
        )
    ).all()

    return {
        "portfolio_reviews": portfolio_reviews,
        "sample_evaluations": sample_evaluations,
        "total_pending": len(portfolio_reviews) + len(sample_evaluations)
    }


@router.post("/portfolio-reviews/{portfolio_review_id}/submit")
async def submit_portfolio_review(
    portfolio_review_id: UUID,
    review_data: PortfolioReviewSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a portfolio review evaluation.

    Reviewers evaluate applicant portfolios based on standardized rubric.
    """
    from app.models.expert_application import PortfolioReview

    portfolio_review = db.query(PortfolioReview).filter(
        PortfolioReview.id == portfolio_review_id
    ).first()

    if not portfolio_review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio review not found")

    # Authorization
    if portfolio_review.reviewer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Already submitted
    if portfolio_review.is_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Portfolio review already submitted"
        )

    # Calculate total score
    total_score = (
        review_data.depth_of_expertise_score +
        review_data.complexity_score +
        review_data.accuracy_score +
        review_data.innovation_score +
        review_data.polish_score +
        review_data.attention_to_detail_score +
        review_data.completeness_score +
        review_data.relevance_score +
        review_data.recency_score +
        review_data.impact_score +
        review_data.recognition_score
    )

    # Update portfolio review
    portfolio_review.depth_of_expertise_score = review_data.depth_of_expertise_score
    portfolio_review.complexity_score = review_data.complexity_score
    portfolio_review.accuracy_score = review_data.accuracy_score
    portfolio_review.innovation_score = review_data.innovation_score
    portfolio_review.polish_score = review_data.polish_score
    portfolio_review.attention_to_detail_score = review_data.attention_to_detail_score
    portfolio_review.completeness_score = review_data.completeness_score
    portfolio_review.relevance_score = review_data.relevance_score
    portfolio_review.recency_score = review_data.recency_score
    portfolio_review.impact_score = review_data.impact_score
    portfolio_review.recognition_score = review_data.recognition_score
    portfolio_review.total_score = total_score
    portfolio_review.strengths = review_data.strengths
    portfolio_review.weaknesses = review_data.weaknesses
    portfolio_review.concerns = review_data.concerns
    portfolio_review.overall_assessment = review_data.overall_assessment
    portfolio_review.recommended_tier = review_data.recommended_tier
    portfolio_review.confidence_level = review_data.confidence_level
    portfolio_review.time_spent_minutes = review_data.time_spent_minutes
    portfolio_review.submitted_at = datetime.utcnow()
    portfolio_review.is_complete = True

    db.commit()

    return {"status": "submitted", "total_score": total_score}


@router.post("/sample-reviews/{sample_evaluation_id}/submit")
async def submit_sample_review_evaluation(
    sample_evaluation_id: UUID,
    evaluation_data: SampleReviewEvaluationSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a sample review evaluation.

    Evaluators assess the quality of applicant's submitted test review.
    """
    from app.models.expert_application import SampleReviewEvaluation

    sample_evaluation = db.query(SampleReviewEvaluation).filter(
        SampleReviewEvaluation.id == sample_evaluation_id
    ).first()

    if not sample_evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sample evaluation not found")

    # Authorization
    if sample_evaluation.evaluator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Already submitted
    if sample_evaluation.is_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sample evaluation already submitted"
        )

    # Calculate total score
    total_score = (
        evaluation_data.thoroughness_coverage_score +
        evaluation_data.thoroughness_detail_score +
        evaluation_data.technical_accuracy_score +
        evaluation_data.terminology_score +
        evaluation_data.actionability_recommendations_score +
        evaluation_data.actionability_prioritization_score +
        evaluation_data.communication_clarity_score +
        evaluation_data.communication_tone_score +
        evaluation_data.insight_depth_score +
        evaluation_data.expert_thinking_score
    )

    # Update sample evaluation
    sample_evaluation.thoroughness_coverage_score = evaluation_data.thoroughness_coverage_score
    sample_evaluation.thoroughness_detail_score = evaluation_data.thoroughness_detail_score
    sample_evaluation.technical_accuracy_score = evaluation_data.technical_accuracy_score
    sample_evaluation.terminology_score = evaluation_data.terminology_score
    sample_evaluation.actionability_recommendations_score = evaluation_data.actionability_recommendations_score
    sample_evaluation.actionability_prioritization_score = evaluation_data.actionability_prioritization_score
    sample_evaluation.communication_clarity_score = evaluation_data.communication_clarity_score
    sample_evaluation.communication_tone_score = evaluation_data.communication_tone_score
    sample_evaluation.insight_depth_score = evaluation_data.insight_depth_score
    sample_evaluation.expert_thinking_score = evaluation_data.expert_thinking_score
    sample_evaluation.total_score = total_score
    sample_evaluation.strengths = evaluation_data.strengths
    sample_evaluation.weaknesses = evaluation_data.weaknesses
    sample_evaluation.missing_elements = evaluation_data.missing_elements
    sample_evaluation.overall_assessment = evaluation_data.overall_assessment
    sample_evaluation.passes_threshold = evaluation_data.passes_threshold
    sample_evaluation.recommended_tier = evaluation_data.recommended_tier
    sample_evaluation.confidence_level = evaluation_data.confidence_level
    sample_evaluation.time_spent_minutes = evaluation_data.time_spent_minutes
    sample_evaluation.submitted_at = datetime.utcnow()
    sample_evaluation.is_complete = True

    db.commit()

    return {"status": "submitted", "total_score": total_score}


# =====================================================
# ADMIN ENDPOINTS
# =====================================================

@router.get("/admin/queue")
async def get_application_queue(
    status_filter: Optional[ApplicationStatus] = None,
    tier_filter: Optional[ReviewerTier] = None,
    priority_only: bool = False,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get application queue for admin review.

    Supports filtering by status, tier, and priority.
    """
    from app.models.expert_application import ExpertApplication

    query = db.query(ExpertApplication)

    if status_filter:
        query = query.filter(ExpertApplication.status == status_filter)

    if tier_filter:
        query = query.filter(ExpertApplication.target_tier == tier_filter)

    if priority_only:
        query = query.filter(ExpertApplication.is_priority == True)

    applications = query.order_by(ExpertApplication.submitted_at.desc()).all()

    return {"applications": applications, "count": len(applications)}


@router.post("/{application_id}/assign-reviewers")
async def assign_reviewers(
    application_id: UUID,
    num_reviewers: int = 2,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Assign portfolio reviewers to an application.

    Uses load-balancing to distribute work fairly.
    """
    try:
        service = ApplicationService(db)
        assignments = service.assign_portfolio_reviewers(
            application_id=application_id,
            num_reviewers=num_reviewers
        )

        return {
            "status": "assigned",
            "num_reviewers": len(assignments),
            "assignments": [{"reviewer_id": str(a.reviewer_id)} for a in assignments]
        }

    except ApplicationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{application_id}/committee-decision")
async def record_committee_decision(
    application_id: UUID,
    decision_data: CommitteeDecisionCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Record committee's final decision on an application.

    Handles approval, conditional approval, rejection, or waitlisting.
    """
    try:
        service = ApplicationService(db)
        committee_decision = service.record_committee_decision(
            application_id=application_id,
            decision=decision_data.decision,
            approved_tier=decision_data.approved_tier,
            decision_rationale=decision_data.decision_rationale,
            committee_votes=decision_data.committee_votes,
            probation_duration_days=decision_data.probation_duration_days,
            probation_review_count=decision_data.probation_review_count,
            mentor_id=decision_data.mentor_id,
            conditions=decision_data.conditions,
            decided_by=current_admin.id
        )

        return {"status": "decision_recorded", "decision": decision_data.decision}

    except ApplicationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{application_id}/qualification-analysis")
async def analyze_qualification(
    application_id: UUID,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Analyze which tier(s) an applicant qualifies for.

    Provides detailed breakdown of scores vs thresholds.
    """
    try:
        service = ApplicationService(db)
        qualified_tier, details = service.determine_qualified_tier(application_id)

        return {
            "qualified_tier": qualified_tier.value if qualified_tier else None,
            "scores": details.get('scores'),
            "thresholds": details.get('thresholds'),
            "gaps": details.get('gaps'),
            "qualification_status": details.get('qualification')
        }

    except ApplicationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
