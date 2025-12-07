"""Profile-related Pydantic schemas"""

import re
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# Reserved usernames that cannot be claimed by users
# These match API routes and special identifiers to prevent namespace collisions
RESERVED_USERNAMES = {
    # API routes
    "me", "api", "admin", "root", "system", "support",
    "check-username", "stats", "dna", "avatar", "badges",
    "onboarding", "reviewer-settings", "notifications", "settings",
    # Common reserved words
    "null", "undefined", "anonymous", "unknown", "deleted",
    "moderator", "mod", "staff", "help", "info", "about",
    "terms", "privacy", "contact", "feedback", "report",
    # Platform-specific
    "critvue", "official", "verified", "team", "bot",
}

# Prefixes that usernames cannot start with (prevents admin-test, mod-user, etc.)
RESERVED_USERNAME_PREFIXES = (
    "admin", "mod-", "moderator", "staff", "support",
    "system", "official", "critvue", "root", "bot-",
)


def is_username_reserved(username: str) -> bool:
    """Check if a username is reserved (exact match or prefix match)"""
    username = username.lower()
    if username in RESERVED_USERNAMES:
        return True
    if username.startswith(RESERVED_USERNAME_PREFIXES):
        return True
    return False


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

    full_name: Optional[str] = Field(None, max_length=255)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    title: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=2000)
    specialty_tags: Optional[List[str]] = Field(None, max_items=10)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        """Validate username format"""
        if v:
            v = v.strip().lower()
            # Only allow alphanumeric, underscores, and hyphens
            if not re.match(r'^[a-z0-9_-]+$', v):
                raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters")
            if len(v) > 50:
                raise ValueError("Username must be 50 characters or less")
            # Don't allow purely numeric usernames (to avoid confusion with IDs)
            if v.isdigit():
                raise ValueError("Username cannot be purely numeric")
            # Check against reserved usernames (exact match and prefix match)
            if is_username_reserved(v):
                raise ValueError("This username is reserved and cannot be used")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize full_name"""
        if v:
            v = v.strip()
            # Remove HTML-like tags
            v = re.sub(r"<[^>]+>", "", v)
            if len(v) > 255:
                raise ValueError("Name must be 255 characters or less")
            if len(v) < 1:
                raise ValueError("Name must be at least 1 character")
        return v

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
    username: Optional[str] = None  # SEO-friendly URL identifier
    full_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool  # Added for frontend User interface compatibility
    is_verified: bool
    specialty_tags: List[str] = []
    badges: List[str] = []

    # Stats
    total_reviews_given: int = 0
    total_reviews_received: int = 0
    avg_rating: Optional[Decimal] = None
    avg_response_time_hours: Optional[int] = None

    # Tier/Karma System
    user_tier: str  # Tier level (novice, contributor, skilled, etc.)
    karma_points: int = 0
    tier_achieved_at: Optional[datetime] = None

    # Onboarding
    onboarding_completed: bool = False
    primary_interest: Optional[str] = None

    # Reviewer Directory
    is_listed_as_reviewer: bool = False
    reviewer_availability: str = "available"
    reviewer_tagline: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AvatarUploadResponse(BaseModel):
    """Schema for avatar upload response"""

    avatar_url: str
    message: str = "Avatar uploaded successfully"
    variants: Optional[dict] = None  # URLs for different size variants
    metadata: Optional[dict] = None  # Image metadata (size, dimensions, format)


# ==================== Onboarding Schemas ====================

class OnboardingStatusResponse(BaseModel):
    """Schema for onboarding status check"""

    onboarding_completed: bool
    primary_interest: Optional[str] = None
    is_listed_as_reviewer: bool
    reviewer_availability: str
    reviewer_tagline: Optional[str] = None


class OnboardingCompleteRequest(BaseModel):
    """Schema for completing onboarding"""

    primary_interest: str = Field(..., pattern="^(creator|reviewer|both)$")
    list_as_reviewer: bool = False
    reviewer_tagline: Optional[str] = Field(None, max_length=200)

    @field_validator("reviewer_tagline")
    @classmethod
    def validate_tagline(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize reviewer tagline"""
        if v:
            v = v.strip()
            # Remove HTML-like tags
            v = re.sub(r"<[^>]+>", "", v)
            if len(v) > 200:
                raise ValueError("Tagline must be 200 characters or less")
        return v


class OnboardingCompleteResponse(BaseModel):
    """Schema for onboarding completion response"""

    success: bool
    message: str
    onboarding_completed: bool
    primary_interest: str
    is_listed_as_reviewer: bool


# ==================== Reviewer Settings Schemas ====================

class ReviewerSettingsUpdate(BaseModel):
    """Schema for updating reviewer directory settings"""

    is_listed_as_reviewer: Optional[bool] = None
    reviewer_availability: Optional[str] = Field(None, pattern="^(available|busy|unavailable)$")
    reviewer_tagline: Optional[str] = Field(None, max_length=200)

    @field_validator("reviewer_tagline")
    @classmethod
    def validate_tagline(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize reviewer tagline"""
        if v:
            v = v.strip()
            v = re.sub(r"<[^>]+>", "", v)
            if len(v) > 200:
                raise ValueError("Tagline must be 200 characters or less")
        return v


class ReviewerSettingsResponse(BaseModel):
    """Schema for reviewer settings response"""

    is_listed_as_reviewer: bool
    reviewer_availability: str
    reviewer_tagline: Optional[str] = None
