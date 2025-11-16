"""Expert Application Pydantic schemas"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.expert_application import ApplicationStatus


class ExpertApplicationBase(BaseModel):
    """Base schema for expert application"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)


class ExpertApplicationCreate(ExpertApplicationBase):
    """Schema for creating a new expert application (draft)"""
    application_data: Optional[Dict[str, Any]] = None


class ExpertApplicationSubmit(BaseModel):
    """Schema for submitting an application"""
    application_data: Dict[str, Any] = Field(..., description="Complete application form data")


class ExpertApplicationUpdate(BaseModel):
    """Schema for updating an application"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    application_data: Optional[Dict[str, Any]] = None


class ExpertApplicationResponse(ExpertApplicationBase):
    """Schema for expert application response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: ApplicationStatus
    application_data: Optional[Dict[str, Any]] = None
    application_number: Optional[str] = None
    created_at: datetime
    submitted_at: Optional[datetime] = None
    updated_at: datetime


class ExpertApplicationStatusResponse(BaseModel):
    """Schema for application status check"""
    has_application: bool
    application: Optional[ExpertApplicationResponse] = None


class ExpertApplicationListResponse(BaseModel):
    """Schema for paginated application list"""
    applications: list[ExpertApplicationResponse]
    total: int
    page: int
    page_size: int
