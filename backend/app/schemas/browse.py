"""Browse-related Pydantic schemas for public marketplace"""

import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.review_request import (
    ContentType,
    ReviewType,
    ReviewStatus,
    ReviewTier,
    FeedbackPriority
)


class SortOption(str, enum.Enum):
    """Sort options for browse endpoint"""
    RECENT = "recent"  # created_at DESC
    PRICE_HIGH = "price_high"  # budget DESC
    PRICE_LOW = "price_low"  # budget ASC
    DEADLINE = "deadline"  # deadline ASC (closest deadline first)


class DeadlineFilter(str, enum.Enum):
    """Deadline urgency filters"""
    URGENT = "urgent"  # Less than 24 hours
    THIS_WEEK = "this_week"  # Less than 7 days
    THIS_MONTH = "this_month"  # Less than 30 days
    FLEXIBLE = "flexible"  # More than 30 days or no deadline


class UrgencyLevel(str, enum.Enum):
    """Urgency level calculated from deadline"""
    URGENT = "urgent"  # <24h
    THIS_WEEK = "this_week"  # <7d
    THIS_MONTH = "this_month"  # <30d
    FLEXIBLE = "flexible"  # >30d or None


# ===== Creator Info Schema =====

class CreatorInfo(BaseModel):
    """
    Public creator information (no sensitive data).

    Only includes information safe to display publicly:
    - User ID (for linking to public profile)
    - Full name (for display)
    - Avatar URL (for visual identification)

    NEVER includes: email, phone, payment info, private data
    """
    id: int = Field(..., description="User ID")
    full_name: Optional[str] = Field(None, description="Creator's display name")
    avatar_url: Optional[str] = Field(None, description="Creator's avatar image URL")

    class Config:
        from_attributes = True


# ===== Browse Review Schema =====

class BrowseReviewItem(BaseModel):
    """
    Public review request data for marketplace browsing.

    Contains all information needed to display a review in the marketplace:
    - Basic review details (title, description, type)
    - Pricing information for expert reviews
    - Deadline and urgency
    - Creator information (public only)
    - Preview image/thumbnail
    - Skills needed
    - Multi-review claim status
    - Expert review tier information
    """
    id: int = Field(..., description="Review request ID")
    title: str = Field(..., description="Review title")
    description: str = Field(..., description="Review description")
    content_type: ContentType = Field(..., description="Type of content to review")
    review_type: ReviewType = Field(..., description="Review service type (free/expert)")
    price: Optional[Decimal] = Field(
        None,
        description="Price in USD for expert reviews (null for free reviews)",
        decimal_places=2
    )
    deadline: Optional[datetime] = Field(None, description="Review deadline (ISO 8601)")
    status: ReviewStatus = Field(..., description="Current review status")
    created_at: datetime = Field(..., description="When review was created (ISO 8601)")
    creator: CreatorInfo = Field(..., description="Public creator information")
    preview_image: Optional[str] = Field(
        None,
        description="Preview image/thumbnail URL (first file if available)"
    )
    skills_needed: List[str] = Field(
        default_factory=list,
        description="Skills or areas needed for review (parsed from feedback_areas)"
    )
    urgency: UrgencyLevel = Field(..., description="Deadline urgency level")

    # Multi-review support
    reviews_requested: int = Field(..., ge=1, le=10, description="Total number of reviews requested")
    reviews_claimed: int = Field(..., ge=0, description="Number of review slots claimed")
    available_slots: int = Field(..., ge=0, description="Number of available review slots")

    # Skill match score (when user skills provided)
    match_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Skill match percentage (0-100) based on user's skills vs review's skills_needed. Null if no user skills provided."
    )

    # Expert review tier fields (null for free reviews)
    tier: Optional[ReviewTier] = Field(
        None,
        description="Expert review tier: quick (5-10min), standard (15-20min), deep (30+ min). Null for free reviews."
    )
    feedback_priority: Optional[FeedbackPriority] = Field(
        None,
        description="Primary focus area for the review"
    )
    specific_questions: Optional[List[str]] = Field(
        None,
        description="Specific questions the requester wants answered"
    )
    context: Optional[str] = Field(
        None,
        description="Additional context about the project"
    )
    estimated_duration: Optional[int] = Field(
        None,
        description="Estimated review duration in minutes"
    )

    class Config:
        from_attributes = True


# ===== Claim Review Schema =====

class ClaimReviewSlotRequest(BaseModel):
    """Request schema for claiming a review slot"""
    review_request_id: int = Field(..., gt=0, description="ID of the review request to claim")


class ClaimReviewSlotResponse(BaseModel):
    """Response schema after claiming a review slot"""
    success: bool = Field(..., description="Whether the claim was successful")
    message: str = Field(..., description="Status message")
    review_request_id: int = Field(..., description="ID of the claimed review request")
    slot_id: int = Field(..., description="ID of the claimed review slot")
    reviews_claimed: int = Field(..., ge=0, description="Total slots now claimed")
    available_slots: int = Field(..., ge=0, description="Remaining available slots")
    is_fully_claimed: bool = Field(..., description="Whether all slots are now claimed")


# ===== Browse Response Schema =====

class BrowseReviewsResponse(BaseModel):
    """
    Response schema for browse endpoint with pagination.

    Provides:
    - List of reviews matching filters
    - Total count for pagination
    - Current limit and offset
    """
    reviews: List[BrowseReviewItem] = Field(
        default_factory=list,
        description="List of review requests"
    )
    total: int = Field(..., description="Total number of matching reviews", ge=0)
    limit: int = Field(..., description="Number of results per page", ge=1, le=100)
    offset: int = Field(..., description="Current pagination offset", ge=0)

    @property
    def has_more(self) -> bool:
        """Check if there are more results available"""
        return (self.offset + len(self.reviews)) < self.total

    @property
    def next_offset(self) -> Optional[int]:
        """Get the offset for the next page, or None if no more results"""
        if self.has_more:
            return self.offset + self.limit
        return None

    @property
    def previous_offset(self) -> Optional[int]:
        """Get the offset for the previous page, or None if on first page"""
        if self.offset > 0:
            return max(0, self.offset - self.limit)
        return None

    class Config:
        from_attributes = True
