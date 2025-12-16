"""Review Action schemas (accept, reject, elaborate, dispute)"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.models.review_slot import RejectionReason, DisputeResolution


class ReviewAccept(BaseModel):
    """Schema for accepting a review"""
    helpful_rating: Optional[int] = Field(
        None,
        ge=1,
        le=5,
        description="Optional rating of how helpful the review was"
    )


class ReviewReject(BaseModel):
    """Schema for rejecting a review"""
    rejection_reason: RejectionReason = Field(..., description="Reason for rejection")
    rejection_notes: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional detailed explanation"
    )

    @field_validator('rejection_notes')
    @classmethod
    def validate_rejection_notes(cls, v: Optional[str], info) -> Optional[str]:
        """Require notes when reason is 'other'"""
        data = info.data
        reason = data.get('rejection_reason')

        if reason == RejectionReason.OTHER and not v:
            raise ValueError('Rejection notes are required when reason is "other"')

        if v:
            v = v.strip()
            if len(v) < 10:
                raise ValueError('Rejection notes must be at least 10 characters')

        return v


class RequestElaboration(BaseModel):
    """Schema for requesting elaboration on a review"""
    elaboration_request: str = Field(
        ...,
        min_length=20,
        max_length=2000,
        description="What specific areas the creator wants more detail on"
    )

    @field_validator('elaboration_request')
    @classmethod
    def validate_elaboration_request(cls, v: str) -> str:
        """Validate elaboration request"""
        v = v.strip()
        if len(v) < 20:
            raise ValueError('Elaboration request must be at least 20 characters')
        return v


class ReviewDispute(BaseModel):
    """Schema for disputing a rejection"""
    dispute_reason: str = Field(
        ...,
        min_length=20,
        max_length=2000,
        description="Explanation for why rejection is unfair"
    )

    @field_validator('dispute_reason')
    @classmethod
    def validate_dispute_reason(cls, v: str) -> str:
        """Validate dispute reason"""
        v = v.strip()
        if len(v) < 20:
            raise ValueError('Dispute reason must be at least 20 characters')
        return v


class DisputeResolve(BaseModel):
    """Schema for admin resolving a dispute"""
    resolution: DisputeResolution = Field(..., description="Admin decision")
    admin_notes: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional admin explanation"
    )
