"""Profile-related Pydantic schemas"""

import re
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# Valid specialty tags (can be expanded later)
VALID_SPECIALTY_TAGS = [
    "UI/UX",
    "React",
    "Vue",
    "Angular",
    "TypeScript",
    "JavaScript",
    "Python",
    "Java",
    "Go",
    "Rust",
    "Mobile",
    "iOS",
    "Android",
    "Backend",
    "Frontend",
    "Full Stack",
    "DevOps",
    "Cloud",
    "AWS",
    "Azure",
    "GCP",
    "Database",
    "Security",
    "Accessibility",
    "Performance",
    "Testing",
    "Design System",
    "Figma",
    "Sketch",
    "Adobe XD",
    "Photoshop",
    "Illustrator",
    "Video Editing",
    "Audio Production",
    "3D Modeling",
    "Animation",
    "Game Development",
    "Machine Learning",
    "AI",
    "Data Science",
    "Content Writing",
    "Copywriting",
    "Technical Writing",
    "Marketing",
    "SEO",
]


class ProfileUpdate(BaseModel):
    """Schema for updating user profile"""

    title: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=2000)
    specialty_tags: Optional[List[str]] = Field(None, max_items=10)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize title"""
        if v:
            v = v.strip()
            # Remove HTML-like tags
            v = re.sub(r"<[^>]+>", "", v)
            if len(v) > 255:
                raise ValueError("Title must be 255 characters or less")
            if len(v) < 3:
                raise ValueError("Title must be at least 3 characters")
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize bio"""
        if v:
            v = v.strip()
            # Remove HTML-like tags
            v = re.sub(r"<[^>]+>", "", v)
            if len(v) > 2000:
                raise ValueError("Bio must be 2000 characters or less")
        return v

    @field_validator("specialty_tags")
    @classmethod
    def validate_specialty_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate specialty tags"""
        if v:
            if len(v) > 10:
                raise ValueError("Maximum 10 specialty tags allowed")

            # Validate each tag
            for tag in v:
                if not tag or not tag.strip():
                    raise ValueError("Tags cannot be empty")
                if len(tag) > 50:
                    raise ValueError("Each tag must be 50 characters or less")
                # Optional: Validate against allowed list
                # if tag not in VALID_SPECIALTY_TAGS:
                #     raise ValueError(f"Invalid specialty tag: {tag}")

            # Remove duplicates while preserving order
            seen = set()
            v = [tag for tag in v if not (tag in seen or seen.add(tag))]

        return v


class ProfileStatsResponse(BaseModel):
    """Schema for profile statistics"""

    total_reviews_given: int = 0
    total_reviews_received: int = 0
    avg_rating: Optional[Decimal] = None
    avg_response_time_hours: Optional[int] = None
    member_since: datetime

    class Config:
        from_attributes = True


class BadgeResponse(BaseModel):
    """Schema for user badges"""

    name: str
    description: str
    icon: str
    earned_at: Optional[datetime] = None


class ProfileResponse(BaseModel):
    """Schema for complete profile response"""

    id: int
    email: str
    full_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_verified: bool
    specialty_tags: List[str] = []
    badges: List[str] = []

    # Stats
    total_reviews_given: int = 0
    total_reviews_received: int = 0
    avg_rating: Optional[Decimal] = None
    avg_response_time_hours: Optional[int] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AvatarUploadResponse(BaseModel):
    """Schema for avatar upload response"""

    avatar_url: str
    message: str = "Avatar uploaded successfully"
