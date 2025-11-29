"""Review-related Pydantic schemas"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.review_request import (
    ContentType,
    ReviewType,
    ReviewStatus,
    ReviewTier,
    FeedbackPriority
)
from app.schemas.review_slot import ReviewSlotResponse


# ===== ReviewFile Schemas =====

class ReviewFileBase(BaseModel):
    """Base schema for review files"""
    filename: str = Field(..., max_length=255)
    original_filename: str = Field(..., max_length=255)
    file_size: int = Field(..., gt=0, description="File size in bytes")
    file_type: str = Field(..., max_length=100, description="MIME type")


class ReviewFileCreate(ReviewFileBase):
    """Schema for creating a review file"""
    file_url: Optional[str] = Field(None, max_length=1000)
    file_path: Optional[str] = Field(None, max_length=500)
    content_hash: Optional[str] = Field(None, max_length=64)


class ReviewFileResponse(ReviewFileBase):
    """Schema for review file response"""
    id: int
    review_request_id: int
    file_url: Optional[str] = None
    file_path: Optional[str] = None
    content_hash: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ===== ReviewRequest Schemas =====

class ReviewRequestBase(BaseModel):
    """Base schema for review requests"""
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=5000)
    content_type: ContentType
    content_subcategory: Optional[str] = Field(
        None,
        max_length=50,
        description="Optional subcategory for more specific content type (e.g., 'frontend', 'ui_ux', 'illustration')"
    )
    review_type: ReviewType = ReviewType.FREE
    feedback_areas: Optional[str] = Field(None, max_length=1000)
    budget: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    deadline: Optional[datetime] = Field(None, description="Review deadline (UTC)")
    reviews_requested: int = Field(
        default=1,
        ge=1,
        le=10,
        description="Number of reviews requested (1-10)"
    )

    # Expert review tier fields (optional - only for expert reviews)
    tier: Optional[ReviewTier] = Field(
        None,
        description="Expert review tier: quick ($5-15, 5-10min), standard ($25-75, 15-20min), deep ($100-200+, 30+ min)"
    )
    feedback_priority: Optional[FeedbackPriority] = Field(
        None,
        description="Primary focus area for the review"
    )
    specific_questions: Optional[List[str]] = Field(
        None,
        max_length=10,
        description="List of specific questions (max 10)"
    )
    context: Optional[str] = Field(
        None,
        max_length=5000,
        description="Additional context about the project"
    )
    estimated_duration: Optional[int] = Field(
        None,
        ge=1,
        le=180,
        description="Estimated review duration in minutes"
    )

    # NDA/Confidentiality (expert reviews only)
    requires_nda: bool = Field(
        default=False,
        description="Whether reviewers must sign an NDA before viewing this request (expert reviews only)"
    )

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate and sanitize title"""
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Title must be at least 3 characters long')
        return v

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: str) -> str:
        """Validate and sanitize description"""
        v = v.strip()
        if len(v) < 10:
            raise ValueError('Description must be at least 10 characters long')
        return v

    @field_validator('reviews_requested')
    @classmethod
    def validate_reviews_requested(cls, v: int, info) -> int:
        """Validate reviews_requested based on review type"""
        data = info.data
        review_type = data.get('review_type')

        # Free reviews: 1-3 max (prevents abuse)
        if review_type == ReviewType.FREE and v > 3:
            raise ValueError('Free reviews are limited to 3 maximum. Upgrade to expert reviews for more.')

        # Expert reviews: 1-10 max
        if review_type == ReviewType.EXPERT and v > 10:
            raise ValueError('Expert reviews are limited to 10 maximum.')

        return v

    @field_validator('budget')
    @classmethod
    def validate_budget(cls, v: Optional[Decimal], info) -> Optional[Decimal]:
        """Validate budget based on review type"""
        # Access review_type from the data being validated
        data = info.data
        review_type = data.get('review_type')

        if review_type == ReviewType.EXPERT and v is None:
            raise ValueError('Budget is required for expert reviews')
        if review_type == ReviewType.FREE and v is not None:
            raise ValueError('Budget should not be set for free reviews')
        return v

    @field_validator('specific_questions')
    @classmethod
    def validate_specific_questions(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate specific questions list"""
        if v is not None:
            # Remove empty strings and limit to 10 questions
            v = [q.strip() for q in v if q and q.strip()]
            if len(v) > 10:
                raise ValueError('Maximum 10 specific questions allowed')
            # Validate question length
            for question in v:
                if len(question) > 500:
                    raise ValueError('Each question must be 500 characters or less')
        return v if v else None

    @model_validator(mode='after')
    def validate_expert_review_tier(self):
        """Validate tier requirements for expert reviews"""
        if self.review_type == ReviewType.EXPERT:
            # Tier is required for expert reviews
            if self.tier is None:
                raise ValueError('Tier is required for expert reviews (quick, standard, or deep)')

            # Validate budget matches tier range
            if self.budget is not None:
                tier_ranges = {
                    ReviewTier.QUICK: (Decimal('5.00'), Decimal('15.00')),
                    ReviewTier.STANDARD: (Decimal('25.00'), Decimal('75.00')),
                    ReviewTier.DEEP: (Decimal('100.00'), Decimal('1000.00'))  # $200+ with reasonable upper limit
                }
                min_budget, max_budget = tier_ranges[self.tier]
                if not (min_budget <= self.budget <= max_budget):
                    raise ValueError(
                        f'{self.tier.value} tier budget must be between ${min_budget} and ${max_budget}. '
                        f'Provided: ${self.budget}'
                    )

            # Set default estimated_duration if not provided
            if self.estimated_duration is None:
                duration_defaults = {
                    ReviewTier.QUICK: 10,
                    ReviewTier.STANDARD: 20,
                    ReviewTier.DEEP: 45
                }
                self.estimated_duration = duration_defaults[self.tier]

        else:  # FREE review
            # Tier should be null for free reviews
            if self.tier is not None:
                raise ValueError('Tier should not be set for free reviews')
            # Expert-specific fields should be null for free reviews
            if self.feedback_priority is not None:
                raise ValueError('feedback_priority is only for expert reviews')
            if self.specific_questions is not None:
                raise ValueError('specific_questions is only for expert reviews')
            if self.context is not None:
                raise ValueError('context is only for expert reviews')
            if self.estimated_duration is not None:
                raise ValueError('estimated_duration is only for expert reviews')
            # NDA is only for expert reviews
            if self.requires_nda:
                raise ValueError('NDA requirement is only available for expert (paid) reviews')

        return self


class ReviewRequestCreate(ReviewRequestBase):
    """Schema for creating a review request"""
    status: ReviewStatus = ReviewStatus.DRAFT


class ReviewRequestUpdate(BaseModel):
    """Schema for updating a review request"""
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    content_type: Optional[ContentType] = None
    review_type: Optional[ReviewType] = None
    status: Optional[ReviewStatus] = None
    feedback_areas: Optional[str] = Field(None, max_length=1000)
    budget: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    deadline: Optional[datetime] = Field(None, description="Review deadline (UTC)")
    reviews_requested: Optional[int] = Field(
        None,
        ge=1,
        le=10,
        description="Number of reviews requested (1-10)"
    )

    # Expert review tier fields
    tier: Optional[ReviewTier] = None
    feedback_priority: Optional[FeedbackPriority] = None
    specific_questions: Optional[List[str]] = Field(None, max_length=10)
    context: Optional[str] = Field(None, max_length=5000)
    estimated_duration: Optional[int] = Field(None, ge=1, le=180)

    # NDA field
    requires_nda: Optional[bool] = None

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize title"""
        if v is not None:
            v = v.strip()
            if len(v) < 3:
                raise ValueError('Title must be at least 3 characters long')
        return v

    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize description"""
        if v is not None:
            v = v.strip()
            if len(v) < 10:
                raise ValueError('Description must be at least 10 characters long')
        return v


class ReviewRequestResponse(ReviewRequestBase):
    """Schema for review request response - skips strict validation for existing data"""
    id: int
    user_id: int
    status: ReviewStatus
    reviews_claimed: int = Field(..., description="Number of review slots claimed")
    reviews_completed: int = Field(default=0, description="Number of reviews accepted")
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    files: List[ReviewFileResponse] = []
    slots: List[ReviewSlotResponse] = []

    # NDA fields
    nda_version: Optional[str] = None
    nda_signed_by_current_user: bool = Field(
        default=False,
        description="Whether the current user has signed the NDA for this request"
    )

    @model_validator(mode='after')
    def validate_expert_review_tier(self):
        """Skip validation for response - existing data may not meet strict rules"""
        # Override parent validator to skip validation when reading existing data
        return self

    # Requester information (loaded from user relationship)
    requester_username: Optional[str] = None
    requester_avatar: Optional[str] = None

    # Computed fields for convenience
    @property
    def available_slots(self) -> int:
        """Get number of available review slots"""
        return max(0, self.reviews_requested - self.reviews_claimed)

    @property
    def is_fully_claimed(self) -> bool:
        """Check if all review slots are claimed"""
        return self.reviews_claimed >= self.reviews_requested

    @property
    def is_partially_claimed(self) -> bool:
        """Check if some but not all review slots are claimed"""
        return 0 < self.reviews_claimed < self.reviews_requested

    @property
    def completion_progress(self) -> float:
        """Get completion progress as percentage (0-100)"""
        if self.reviews_requested == 0:
            return 0.0
        return (self.reviews_completed / self.reviews_requested) * 100

    class Config:
        from_attributes = True


class ReviewRequestListResponse(BaseModel):
    """Schema for paginated list of review requests"""
    items: List[ReviewRequestResponse]
    total: int
    skip: int
    limit: int
    has_more: bool


class ReviewRequestStats(BaseModel):
    """Schema for review request statistics"""
    total_requests: int
    draft_count: int
    pending_count: int
    in_review_count: int
    completed_count: int
    cancelled_count: int
