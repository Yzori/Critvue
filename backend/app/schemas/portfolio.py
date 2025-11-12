"""Portfolio-related Pydantic schemas"""

import re
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator, HttpUrl


class PortfolioCreate(BaseModel):
    """Schema for creating a portfolio item"""

    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    content_type: str = Field(
        ...,
        description="Type of content: design, code, video, audio, writing, art",
    )
    image_url: Optional[str] = Field(None, max_length=500)
    project_url: Optional[str] = Field(None, max_length=500)
    is_featured: bool = False

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate and sanitize title"""
        v = v.strip()
        # Remove HTML-like tags
        v = re.sub(r"<[^>]+>", "", v)
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        if len(v) > 255:
            raise ValueError("Title must be 255 characters or less")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize description"""
        if v:
            v = v.strip()
            # Remove HTML-like tags
            v = re.sub(r"<[^>]+>", "", v)
            if len(v) > 2000:
                raise ValueError("Description must be 2000 characters or less")
        return v

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        """Validate content type"""
        valid_types = ["design", "code", "video", "audio", "writing", "art"]
        v = v.lower().strip()
        if v not in valid_types:
            raise ValueError(
                f"Content type must be one of: {', '.join(valid_types)}"
            )
        return v

    @field_validator("image_url", "project_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate URL format"""
        if v:
            v = v.strip()
            # Basic URL validation
            if not v.startswith(("http://", "https://", "/")):
                raise ValueError("URL must start with http://, https://, or /")
            if len(v) > 500:
                raise ValueError("URL must be 500 characters or less")
        return v


class PortfolioUpdate(BaseModel):
    """Schema for updating a portfolio item"""

    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    content_type: Optional[str] = None
    image_url: Optional[str] = Field(None, max_length=500)
    project_url: Optional[str] = Field(None, max_length=500)
    is_featured: Optional[bool] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize title"""
        if v:
            v = v.strip()
            # Remove HTML-like tags
            v = re.sub(r"<[^>]+>", "", v)
            if len(v) < 3:
                raise ValueError("Title must be at least 3 characters")
            if len(v) > 255:
                raise ValueError("Title must be 255 characters or less")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize description"""
        if v:
            v = v.strip()
            # Remove HTML-like tags
            v = re.sub(r"<[^>]+>", "", v)
            if len(v) > 2000:
                raise ValueError("Description must be 2000 characters or less")
        return v

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: Optional[str]) -> Optional[str]:
        """Validate content type"""
        if v:
            valid_types = ["design", "code", "video", "audio", "writing", "art"]
            v = v.lower().strip()
            if v not in valid_types:
                raise ValueError(
                    f"Content type must be one of: {', '.join(valid_types)}"
                )
        return v

    @field_validator("image_url", "project_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate URL format"""
        if v:
            v = v.strip()
            # Basic URL validation
            if not v.startswith(("http://", "https://", "/")):
                raise ValueError("URL must start with http://, https://, or /")
            if len(v) > 500:
                raise ValueError("URL must be 500 characters or less")
        return v


class PortfolioResponse(BaseModel):
    """Schema for portfolio item response"""

    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    content_type: str
    image_url: Optional[str] = None
    project_url: Optional[str] = None
    rating: Optional[Decimal] = None
    views_count: int = 0
    is_featured: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PortfolioListResponse(BaseModel):
    """Schema for paginated portfolio list"""

    items: list[PortfolioResponse]
    total: int
    page: int
    page_size: int
    has_more: bool
