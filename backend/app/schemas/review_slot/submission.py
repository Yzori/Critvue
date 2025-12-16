"""Review Submission schemas"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class FeedbackSection(BaseModel):
    """Individual feedback section in structured review"""
    section_id: str = Field(..., description="Section identifier (e.g., 'issues', 'strengths')")
    section_label: str = Field(..., description="Display label for section")
    content: str = Field(..., min_length=1, description="Feedback content for this section")
    word_count: Optional[int] = Field(None, description="Word count (auto-calculated)")
    required: bool = Field(default=True, description="Whether this section was required")

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate and sanitize content"""
        v = v.strip()
        if not v:
            raise ValueError('Section content cannot be empty')
        return v


class Annotation(BaseModel):
    """Context-specific annotation (pin, timestamp, highlight, line comment)"""
    annotation_id: str = Field(..., description="Unique annotation identifier")
    annotation_type: str = Field(
        ...,
        description="Type: 'pin', 'timestamp', 'highlight', 'line_comment'"
    )

    # For pins (design/art)
    x: Optional[float] = Field(None, ge=0.0, le=1.0, description="Normalized X coordinate (0-1)")
    y: Optional[float] = Field(None, ge=0.0, le=1.0, description="Normalized Y coordinate (0-1)")
    file_id: Optional[int] = Field(None, description="Associated file ID")

    # For timestamps (video/audio)
    timestamp: Optional[float] = Field(None, ge=0.0, description="Timestamp in seconds")

    # For highlights (writing)
    start_offset: Optional[int] = Field(None, ge=0, description="Start character offset")
    end_offset: Optional[int] = Field(None, ge=0, description="End character offset")
    highlighted_text: Optional[str] = Field(None, max_length=500, description="Highlighted text snippet")

    # For line comments (code)
    filename: Optional[str] = Field(None, max_length=255, description="File name for code comment")
    line_number: Optional[int] = Field(None, ge=1, description="Line number in file")

    # Common fields
    feedback_type: str = Field(
        ...,
        description="Feedback type: 'issue', 'suggestion', 'praise', 'question'"
    )
    comment: str = Field(..., min_length=1, max_length=2000, description="Annotation comment")
    severity: Optional[str] = Field(
        None,
        description="Severity for issues: 'low', 'medium', 'high'"
    )


class DraftSave(BaseModel):
    """Schema for saving review draft"""
    sections: List[FeedbackSection] = Field(
        default=[],
        description="Draft sections with feedback content"
    )
    rating: Optional[int] = Field(None, ge=1, le=5, description="Draft rating")

    class Config:
        json_schema_extra = {
            "example": {
                "sections": [
                    {
                        "section_id": "overview",
                        "section_label": "Overview",
                        "content": "This design shows strong use of color...",
                        "word_count": 45,
                        "required": True
                    }
                ],
                "rating": 4
            }
        }


class DraftResponse(BaseModel):
    """Response when loading draft"""
    sections: List[FeedbackSection] = Field(default=[])
    rating: Optional[int] = None
    last_saved_at: Optional[datetime] = None


class DraftSaveSuccess(BaseModel):
    """Response after successfully saving draft"""
    success: bool = True
    last_saved_at: datetime


class ReviewSubmit(BaseModel):
    """Schema for submitting a review (supports both structured and legacy formats)"""
    # Legacy format (backward compatible)
    review_text: Optional[str] = Field(None, min_length=50, max_length=10000)

    # New structured format
    feedback_sections: Optional[List[FeedbackSection]] = Field(
        None,
        description="Structured feedback sections (replaces review_text)"
    )
    annotations: Optional[List[Annotation]] = Field(
        None,
        description="Context-specific annotations (pins, timestamps, etc.)"
    )

    # Common fields
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    attachments: Optional[List[dict]] = Field(
        default=None,
        description="Optional list of attachment metadata"
    )

    @field_validator('review_text')
    @classmethod
    def validate_review_text(cls, v: Optional[str]) -> Optional[str]:
        """Validate and sanitize review text"""
        if v:
            v = v.strip()
            if len(v) < 50:
                raise ValueError('Review text must be at least 50 characters')
        return v

    @field_validator('feedback_sections')
    @classmethod
    def validate_sections(cls, v: Optional[List[FeedbackSection]], info) -> Optional[List[FeedbackSection]]:
        """Validate that either review_text or feedback_sections is provided"""
        data = info.data
        review_text = data.get('review_text')

        # Must have either review_text or feedback_sections
        if not review_text and not v:
            raise ValueError('Must provide either review_text or feedback_sections')

        # If using sections, validate minimum content
        if v:
            total_words = 0
            for section in v:
                words = len(section.content.split())
                total_words += words

            if total_words < 50:
                raise ValueError('Total feedback across all sections must be at least 50 words')

        return v
