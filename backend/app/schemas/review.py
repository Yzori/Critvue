"""Review-related Pydantic schemas"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

from app.models.review_request import ContentType, ReviewType, ReviewStatus


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
    """Schema for review request response"""
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
