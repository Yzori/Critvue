"""Committee System Pydantic schemas"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.committee_member import CommitteeRole
from app.models.application_review import ReviewStatus, Vote


# ============ Committee Member Schemas ============

class CommitteeMemberBase(BaseModel):
    """Base schema for committee member"""
    role: CommitteeRole = CommitteeRole.SENIOR_REVIEWER
    max_concurrent_reviews: int = Field(default=5, ge=1, le=20)


class CommitteeMemberCreate(CommitteeMemberBase):
    """Schema for creating a committee member"""
    user_id: int


class CommitteeMemberUpdate(BaseModel):
    """Schema for updating a committee member"""
    role: Optional[CommitteeRole] = None
    is_active: Optional[bool] = None
    max_concurrent_reviews: Optional[int] = Field(None, ge=1, le=20)


class CommitteeMemberResponse(CommitteeMemberBase):
    """Schema for committee member response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    deactivated_at: Optional[datetime] = None

    # Joined user info
    user_email: Optional[str] = None
    user_name: Optional[str] = None


# ============ Rejection Reason Schemas ============

class RejectionReasonBase(BaseModel):
    """Base schema for rejection reason"""
    code: str = Field(..., min_length=1, max_length=50)
    label: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    applicant_message: Optional[str] = None
    display_order: int = 0


class RejectionReasonCreate(RejectionReasonBase):
    """Schema for creating a rejection reason"""
    pass


class RejectionReasonUpdate(BaseModel):
    """Schema for updating a rejection reason"""
    label: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    applicant_message: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class RejectionReasonResponse(RejectionReasonBase):
    """Schema for rejection reason response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


# ============ Application Review Schemas ============

class ApplicationReviewBase(BaseModel):
    """Base schema for application review"""
    pass


class ClaimApplicationRequest(BaseModel):
    """Schema for claiming an application for review"""
    pass  # No additional data needed


class VoteRequest(BaseModel):
    """Schema for submitting a vote on an application"""
    vote: Vote
    rejection_reason_id: Optional[int] = Field(
        None,
        description="Required if vote is REJECT"
    )
    additional_feedback: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional additional feedback for the applicant"
    )
    internal_notes: Optional[str] = Field(
        None,
        max_length=2000,
        description="Internal notes (not shown to applicant)"
    )


class ReleaseApplicationRequest(BaseModel):
    """Schema for releasing an application back to the queue"""
    reason: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional reason for releasing"
    )


class ApplicationReviewResponse(BaseModel):
    """Schema for application review response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    reviewer_id: int
    status: ReviewStatus
    vote: Optional[Vote] = None
    rejection_reason_id: Optional[int] = None
    additional_feedback: Optional[str] = None
    internal_notes: Optional[str] = None
    claimed_at: datetime
    voted_at: Optional[datetime] = None
    released_at: Optional[datetime] = None

    # Joined rejection reason info
    rejection_reason_label: Optional[str] = None


# ============ Admin Queue Schemas ============

class ApplicationQueueItem(BaseModel):
    """Schema for an application in the review queue"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_number: str
    email: str
    full_name: str
    status: str
    submitted_at: datetime
    created_at: datetime

    # Queue metadata
    days_in_queue: int
    is_escalated: bool = False
    claim_count: int = 0  # How many times it's been claimed/released


class ApplicationQueueResponse(BaseModel):
    """Schema for paginated queue response"""
    applications: list[ApplicationQueueItem]
    total: int
    page: int
    page_size: int


class ApplicationDetailForReview(BaseModel):
    """Schema for full application details when reviewing"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_number: str
    email: str
    full_name: str
    status: str
    application_data: dict
    submitted_at: datetime
    created_at: datetime
    updated_at: datetime

    # Applicant info
    user_id: int
    user_joined_at: Optional[datetime] = None

    # Previous applications
    rejection_count: int = 0
    last_rejection_at: Optional[datetime] = None

    # Current reviews on this application
    reviews: list[ApplicationReviewResponse] = []


class MyReviewsResponse(BaseModel):
    """Schema for committee member's claimed/voted applications"""
    claimed: list[ApplicationDetailForReview]
    voted: list[ApplicationReviewResponse]
    total_voted: int


# ============ Decision/Voting Result Schemas ============

class VotingStatus(BaseModel):
    """Schema for current voting status on an application"""
    application_id: int
    total_votes: int
    approve_votes: int
    reject_votes: int
    request_changes_votes: int
    required_for_decision: int
    decision_reached: bool
    final_decision: Optional[str] = None  # "approved", "rejected", or None


class DecisionResult(BaseModel):
    """Schema for the result of a vote that triggers a decision"""
    decision: str  # "approved" or "rejected"
    application_id: int
    application_number: str
    assigned_tier: Optional[str] = None  # For approvals
    rejection_summary: Optional[str] = None  # For rejections


# ============ Stats Schemas ============

class CommitteeStats(BaseModel):
    """Schema for committee dashboard stats"""
    pending_applications: int
    under_review: int
    approved_this_month: int
    rejected_this_month: int
    avg_review_time_days: float
    my_claimed_count: int
    my_votes_this_month: int
