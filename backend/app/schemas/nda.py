"""NDA-related Pydantic schemas"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.models.nda_signature import NDARole


class NDASignRequest(BaseModel):
    """Schema for signing an NDA"""
    full_legal_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Full legal name as signature"
    )

    @field_validator('full_legal_name')
    @classmethod
    def validate_full_legal_name(cls, v: str) -> str:
        """Validate and clean the legal name"""
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Full legal name must be at least 2 characters')
        # Basic validation - name should contain at least one space (first + last name)
        # Relaxed to allow single names for cultural inclusivity
        if not any(c.isalpha() for c in v):
            raise ValueError('Full legal name must contain letters')
        return v


class NDASignResponse(BaseModel):
    """Response after signing an NDA"""
    success: bool
    message: str
    signature_id: int
    signed_at: datetime
    nda_version: str
    review_request_id: int


class NDASignatureResponse(BaseModel):
    """Schema for NDA signature details"""
    id: int
    review_request_id: int
    user_id: int
    role: str
    full_legal_name: str
    nda_version: str
    signed_at: datetime

    # User info (populated from relationship)
    user_username: Optional[str] = None
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class NDAStatusResponse(BaseModel):
    """Schema for checking NDA status on a review request"""
    review_request_id: int
    requires_nda: bool
    nda_version: Optional[str] = None
    creator_signed: bool = False
    creator_signed_at: Optional[datetime] = None
    current_user_signed: bool = False
    current_user_signed_at: Optional[datetime] = None
    can_view_content: bool = Field(
        ...,
        description="Whether the current user can view the full request content"
    )


class NDAContentResponse(BaseModel):
    """Schema for returning NDA document content"""
    version: str
    title: str = "Non-Disclosure Agreement (NDA)"
    subtitle: str = "Between Creator and Reviewer on Critvue"
    content: str = Field(..., description="Full NDA text content")
    effective_date: Optional[str] = None
