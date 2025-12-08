"""Slot Application Pydantic schemas for expert review slot applications"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

from app.models.slot_application import SlotApplicationStatus


# ===== Applicant Info Schema =====

class ApplicantInfo(BaseModel):
    """Minimal applicant information for display"""
    id: int
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    user_tier: Optional[str] = None
    sparks_points: Optional[int] = None
    total_reviews_given: int = 0
    avg_rating: Optional[float] = None
    acceptance_rate: Optional[float] = None

    class Config:
        from_attributes = True


# ===== Create/Apply Schemas =====

class SlotApplicationCreate(BaseModel):
    """Schema for applying to a review slot"""
    review_request_id: int = Field(..., gt=0, description="ID of the review request to apply for")
    pitch_message: str = Field(
        ...,
        min_length=20,
        max_length=1000,
        description="Short pitch explaining why you'd be a good fit (20-1000 chars)"
    )

    @field_validator('pitch_message')
    @classmethod
    def validate_pitch_message(cls, v: str) -> str:
        """Validate and sanitize pitch message"""
        v = v.strip()
        if len(v) < 20:
            raise ValueError('Pitch message must be at least 20 characters')
        return v


# ===== Decision Schemas =====

class SlotApplicationAccept(BaseModel):
    """Schema for accepting a slot application"""
    pass  # No additional data needed - slot is auto-assigned


class SlotApplicationReject(BaseModel):
    """Schema for rejecting a slot application"""
    rejection_reason: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional reason for rejection (max 500 chars)"
    )


class SlotApplicationWithdraw(BaseModel):
    """Schema for withdrawing a slot application"""
    pass  # No additional data needed


# ===== Response Schemas =====

class SlotApplicationResponse(BaseModel):
    """Full slot application response"""
    id: int
    review_request_id: int
    applicant_id: int
    assigned_slot_id: Optional[int] = None
    status: str  # Using str for JSON serialization compatibility
    pitch_message: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    decided_at: Optional[datetime] = None

    # Embedded applicant info
    applicant: Optional[ApplicantInfo] = None

    class Config:
        from_attributes = True


class SlotApplicationWithApplicant(SlotApplicationResponse):
    """Slot application with full applicant details for creator view"""
    applicant: ApplicantInfo


class SlotApplicationBrief(BaseModel):
    """Brief application info for list views"""
    id: int
    review_request_id: int
    status: str
    pitch_message: str
    created_at: datetime
    applicant: ApplicantInfo

    class Config:
        from_attributes = True


# ===== List Response Schemas =====

class SlotApplicationListResponse(BaseModel):
    """Paginated list of slot applications"""
    items: List[SlotApplicationResponse]
    total: int
    skip: int
    limit: int
    has_more: bool


class RequestApplicationsResponse(BaseModel):
    """Applications for a specific review request (creator view)"""
    review_request_id: int
    total_applications: int
    pending_count: int
    accepted_count: int
    rejected_count: int
    available_slots: int
    applications: List[SlotApplicationWithApplicant]


class MyApplicationsResponse(BaseModel):
    """User's own applications (applicant view)"""
    items: List[SlotApplicationResponse]
    total: int
    pending_count: int
    accepted_count: int
    rejected_count: int


# ===== Stats Schemas =====

class SlotApplicationStats(BaseModel):
    """Statistics for slot applications"""
    total: int = 0
    pending: int = 0
    accepted: int = 0
    rejected: int = 0
    withdrawn: int = 0
    expired: int = 0


# ===== Notification Helper Schema =====

class ApplicationNotificationData(BaseModel):
    """Data for application-related notifications"""
    application_id: int
    review_request_id: int
    review_request_title: str
    applicant_id: int
    applicant_name: str
    status: str
    decided_at: Optional[datetime] = None
