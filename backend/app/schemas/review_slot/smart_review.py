"""Smart Adaptive Review Editor schemas"""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator

from .feedback import (
    RatingRationale,
    RatingRationaleDraft,
    StructuredStrengthDraft,
    StructuredImprovementDraft,
    TopTakeawayDraft,
    ExecutiveSummaryDraft,
    FollowUpOfferDraft,
)


class Phase1QuickAssessment(BaseModel):
    """Phase 1: Quick assessment with overall rating and focus areas"""
    overall_rating: int = Field(..., ge=1, le=5, description="Overall rating (1-5 stars)")
    primary_focus_areas: List[str] = Field(
        ...,
        min_length=1,
        max_length=6,
        description="Selected focus areas (e.g., ['functionality', 'security'])"
    )
    quick_summary: str = Field(
        ...,
        min_length=50,
        max_length=300,
        description="Brief summary (50-300 chars)"
    )

    @field_validator('quick_summary')
    @classmethod
    def validate_summary(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Summary cannot be empty')
        return v


class Phase1QuickAssessmentDraft(BaseModel):
    """Phase 1 Draft: Relaxed validation for saving incomplete drafts"""
    overall_rating: Optional[int] = Field(None, ge=0, le=5, description="Overall rating (0-5, 0 = not set)")
    primary_focus_areas: Optional[List[str]] = Field(
        default=[],
        max_length=6,
        description="Selected focus areas"
    )
    quick_summary: Optional[str] = Field(
        default="",
        max_length=300,
        description="Brief summary (can be incomplete in draft)"
    )


class Phase2RubricRatings(BaseModel):
    """Phase 2: Content-specific rubric ratings"""
    content_type: str = Field(..., description="Content type: code, design, writing")
    ratings: dict[str, int] = Field(
        ...,
        description="Dimension ratings (e.g., {'functionality': 5, 'code_quality': 4})"
    )
    rationales: Optional[dict[str, RatingRationale]] = Field(
        None,
        description="Justification for each rating"
    )

    @field_validator('ratings')
    @classmethod
    def validate_ratings(cls, v: dict[str, int]) -> dict[str, int]:
        """Validate all ratings are 1-5"""
        for dimension, rating in v.items():
            if not (1 <= rating <= 5):
                raise ValueError(f'Rating for {dimension} must be between 1 and 5')
        return v


class Phase2RubricRatingsDraft(BaseModel):
    """Phase 2 Draft: Relaxed validation for saving incomplete drafts"""
    content_type: Optional[str] = Field(None, description="Content type: code, design, writing")
    ratings: Optional[dict[str, int]] = Field(
        default={},
        description="Dimension ratings (can be partial in draft)"
    )
    rationales: Optional[dict[str, RatingRationaleDraft]] = Field(
        default={},
        description="Justification for each rating (can be partial in draft)"
    )


class VisualAnnotation(BaseModel):
    """Visual annotation pin-point on an image"""
    id: str = Field(..., description="Unique annotation ID (client-generated UUID)")
    x: float = Field(..., ge=0, le=100, description="X coordinate as percentage (0-100)")
    y: float = Field(..., ge=0, le=100, description="Y coordinate as percentage (0-100)")
    comment: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Comment for this annotation point"
    )


class Phase3DetailedFeedback(BaseModel):
    """Phase 3: Detailed feedback with strengths and improvements"""
    strengths: List[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="List of strengths (2-10 items recommended)"
    )
    improvements: List[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="List of improvements (2-10 items recommended)"
    )
    additional_notes: Optional[str] = Field(
        None,
        max_length=5000,
        description="Additional notes or context (optional)"
    )
    visual_annotations: Optional[List[VisualAnnotation]] = Field(
        None,
        max_length=20,
        description="Visual annotations for design/art reviews (optional, max 20)"
    )

    @field_validator('strengths', 'improvements')
    @classmethod
    def validate_items(cls, v: List[str]) -> List[str]:
        """Validate list items are not empty"""
        validated = []
        for item in v:
            stripped = item.strip()
            if stripped:
                validated.append(stripped)
        if not validated:
            raise ValueError('List cannot be empty')
        return validated


class Phase3DetailedFeedbackDraft(BaseModel):
    """Phase 3 Draft: Relaxed validation for saving incomplete drafts"""
    strengths: Optional[List[str]] = Field(
        default=[],
        max_length=10,
        description="List of strengths (can be empty in draft)"
    )
    improvements: Optional[List[str]] = Field(
        default=[],
        max_length=10,
        description="List of improvements (can be empty in draft)"
    )
    structured_strengths: Optional[List[StructuredStrengthDraft]] = Field(
        default=None,
        description="Structured strength items with detailed fields"
    )
    structured_improvements: Optional[List[StructuredImprovementDraft]] = Field(
        default=None,
        description="Structured improvement items with detailed fields"
    )
    additional_notes: Optional[str] = Field(
        None,
        max_length=5000,
        description="Additional notes or context (optional)"
    )
    visual_annotations: Optional[List[Any]] = Field(
        None,
        max_length=20,
        description="Visual annotations for design/art reviews"
    )
    voice_memo: Optional[Any] = Field(
        None,
        description="Voice memo data"
    )
    # Required: Top 3 Takeaways (the TL;DR checklist)
    top_takeaways: Optional[List[TopTakeawayDraft]] = Field(
        default=None,
        max_length=3,
        description="Top 3 most important action items"
    )
    # Premium expert review sections
    executive_summary: Optional[ExecutiveSummaryDraft] = Field(
        None,
        description="Executive summary for premium reviews"
    )
    follow_up_offer: Optional[FollowUpOfferDraft] = Field(
        None,
        description="Follow-up offer for premium reviews"
    )


class QualityMetrics(BaseModel):
    """Auto-calculated quality metrics"""
    completeness_score: int = Field(..., ge=0, le=100, description="Completeness (0-100%)")
    estimated_tone: str = Field(..., description="Tone: professional, casual, critical, encouraging")
    clarity_score: int = Field(..., ge=0, le=100, description="Clarity (0-100%)")
    actionability_score: int = Field(..., ge=0, le=100, description="Actionability (0-100%)")


class SmartReviewMetadata(BaseModel):
    """Metadata about the review process"""
    version: str = Field(default="1.0", description="Schema version")
    created_at: datetime
    last_updated_at: datetime
    time_spent_seconds: int = Field(..., ge=0, description="Time spent on review")
    phases_completed: List[str] = Field(
        ...,
        description="Completed phases: ['phase1', 'phase2', 'phase3']"
    )


class SmartReviewDraft(BaseModel):
    """Draft for Smart Adaptive Review Editor - uses relaxed validation for saving incomplete drafts"""
    phase1_quick_assessment: Optional[Phase1QuickAssessmentDraft] = None
    phase2_rubric: Optional[Phase2RubricRatingsDraft] = None
    phase3_detailed_feedback: Optional[Phase3DetailedFeedbackDraft] = None
    quality_metrics: Optional[QualityMetrics] = None
    metadata: Optional[SmartReviewMetadata] = None

    class Config:
        json_schema_extra = {
            "example": {
                "phase1_quick_assessment": {
                    "overall_rating": 4,
                    "primary_focus_areas": ["functionality", "code_quality"],
                    "quick_summary": "Well-structured code with good separation of concerns. Some performance optimizations needed."
                },
                "phase2_rubric": {
                    "content_type": "code",
                    "ratings": {
                        "functionality": 5,
                        "code_quality": 4,
                        "security": 4,
                        "test_coverage": 3
                    }
                },
                "phase3_detailed_feedback": {
                    "strengths": [
                        "Clear function names and good documentation",
                        "Proper error handling throughout"
                    ],
                    "improvements": [
                        "Add unit tests for edge cases",
                        "Consider memoization for expensive calculations"
                    ],
                    "additional_notes": "Overall excellent work. Focus on test coverage for production readiness."
                }
            }
        }


class SmartReviewSubmit(BaseModel):
    """Submit review with Smart Adaptive Review Editor structure"""
    smart_review: SmartReviewDraft
    attachments: Optional[List[dict]] = Field(default=None)

    class Config:
        json_schema_extra = {
            "example": {
                "smart_review": {
                    "phase1_quick_assessment": {
                        "overall_rating": 4,
                        "primary_focus_areas": ["functionality", "code_quality"],
                        "quick_summary": "Well-structured code with some improvements needed."
                    },
                    "phase2_rubric": {
                        "content_type": "code",
                        "ratings": {"functionality": 5, "code_quality": 4}
                    },
                    "phase3_detailed_feedback": {
                        "strengths": ["Clear naming", "Good error handling"],
                        "improvements": ["Add tests", "Optimize performance"]
                    }
                },
                "attachments": []
            }
        }
