"""Structured Feedback schemas for Review Slots"""

from typing import Optional, List, Any, Literal
from pydantic import BaseModel, Field

from .enums import (
    PrincipleCategory,
    ImpactType,
    EffortEstimate,
    ConfidenceLevel,
    ImprovementCategory,
)


# ===== Rating Justification Schemas =====

class RatingRationale(BaseModel):
    """Justification for a rating - explains WHY a rating was given"""
    strengths: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="What earned this score"
    )
    gaps: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="What's holding it back (why not 5?)"
    )


class RatingRationaleDraft(BaseModel):
    """Draft version with relaxed validation"""
    strengths: Optional[str] = Field(
        default="",
        max_length=500,
        description="What earned this score"
    )
    gaps: Optional[str] = Field(
        default="",
        max_length=500,
        description="What's holding it back"
    )


# ===== Structured Feedback Schemas =====

class ResourceLink(BaseModel):
    """Supporting link/reference for an improvement"""
    url: str = Field(..., description="URL to resource")
    title: Optional[str] = Field(None, max_length=200, description="Display title")


class StructuredImprovement(BaseModel):
    """Structured improvement item with expert insight fields"""
    id: str = Field(..., description="Unique ID (client-generated UUID)")
    issue: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="What's the problem"
    )
    location: Optional[str] = Field(
        None,
        max_length=200,
        description="Where in the work"
    )
    suggestion: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Concrete fix"
    )
    priority: Literal["critical", "important", "nice-to-have"] = Field(
        ...,
        description="How urgent"
    )
    # Premium fields for expert reviews
    effort: Optional[EffortEstimate] = Field(None, description="How much work to implement")
    confidence: Optional[ConfidenceLevel] = Field(None, description="How confident in this suggestion")
    category: Optional[ImprovementCategory] = Field(None, description="Categorize the improvement")
    is_quick_win: Optional[bool] = Field(None, description="Flag for quick wins (high impact, low effort)")
    resources: Optional[List[ResourceLink]] = Field(None, description="Supporting links/references")
    # Expert insight fields
    principle: Optional[str] = Field(
        None,
        max_length=200,
        description="What rule/heuristic is being violated"
    )
    principle_category: Optional[PrincipleCategory] = Field(
        None,
        description="Category of the principle"
    )
    impact: Optional[str] = Field(
        None,
        max_length=500,
        description="What happens if not fixed"
    )
    impact_type: Optional[ImpactType] = Field(
        None,
        description="Type of impact"
    )
    after_state: Optional[str] = Field(
        None,
        max_length=500,
        description="What it would look like if fixed"
    )


class StructuredImprovementDraft(BaseModel):
    """Draft version with relaxed validation"""
    id: str = Field(..., description="Unique ID")
    issue: Optional[str] = Field(default="", max_length=500)
    location: Optional[str] = Field(None, max_length=200)
    suggestion: Optional[str] = Field(default="", max_length=1000)
    priority: Optional[Literal["critical", "important", "nice-to-have"]] = None
    effort: Optional[str] = None
    confidence: Optional[str] = None
    category: Optional[str] = None
    is_quick_win: Optional[bool] = None
    resources: Optional[List[Any]] = None
    principle: Optional[str] = Field(None, max_length=200)
    principle_category: Optional[str] = None
    impact: Optional[str] = Field(None, max_length=500)
    impact_type: Optional[str] = None
    after_state: Optional[str] = Field(None, max_length=500)


class StructuredStrength(BaseModel):
    """Structured strength item"""
    id: str = Field(..., description="Unique ID (client-generated UUID)")
    what: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="What's good"
    )
    why: Optional[str] = Field(
        None,
        max_length=500,
        description="Why it works well"
    )
    impact: Optional[str] = Field(
        None,
        max_length=500,
        description="Business/UX impact of this strength"
    )


class StructuredStrengthDraft(BaseModel):
    """Draft version with relaxed validation"""
    id: str = Field(..., description="Unique ID")
    what: Optional[str] = Field(default="", max_length=500)
    why: Optional[str] = Field(None, max_length=500)
    impact: Optional[str] = Field(None, max_length=500)


# ===== Top Takeaways Schema =====

class TopTakeaway(BaseModel):
    """Top 3 Takeaways - the most critical actionable items"""
    issue: str = Field(
        ...,
        min_length=5,
        max_length=200,
        description="Brief description of the issue"
    )
    fix: str = Field(
        ...,
        min_length=5,
        max_length=300,
        description="Concrete action to take"
    )


class TopTakeawayDraft(BaseModel):
    """Draft version with relaxed validation"""
    issue: Optional[str] = Field(default="", max_length=200)
    fix: Optional[str] = Field(default="", max_length=300)


# ===== Executive Summary Schemas =====

class ExecutiveSummary(BaseModel):
    """TL;DR for busy creators - premium expert review section"""
    one_liner: Optional[str] = Field(
        None,
        max_length=200,
        description="A single sentence that captures the essence"
    )
    biggest_win: Optional[str] = Field(
        None,
        max_length=200,
        description="The strongest aspect of this work"
    )
    critical_fix: Optional[str] = Field(
        None,
        max_length=200,
        description="The single most important thing to address"
    )
    quick_win: Optional[str] = Field(
        None,
        max_length=200,
        description="An easy improvement with high impact"
    )

    class Config:
        # Allow camelCase from frontend
        populate_by_name = True


class ExecutiveSummaryDraft(BaseModel):
    """Draft version with relaxed validation"""
    one_liner: Optional[str] = Field(default=None, max_length=200, alias="oneLiner")
    biggest_win: Optional[str] = Field(default=None, max_length=200, alias="biggestWin")
    critical_fix: Optional[str] = Field(default=None, max_length=200, alias="criticalFix")
    quick_win: Optional[str] = Field(default=None, max_length=200, alias="quickWin")

    class Config:
        populate_by_name = True


class FollowUpOffer(BaseModel):
    """Continued support offer - premium expert review section"""
    available: bool = Field(..., description="Is reviewer offering follow-up?")
    type: Optional[Literal["code-review", "design-feedback", "consultation", "pair-session", "other"]] = None
    description: Optional[str] = Field(None, max_length=500, description="What they're offering")
    response_time: Optional[str] = Field(None, max_length=100, description="Expected response time")


class FollowUpOfferDraft(BaseModel):
    """Draft version with relaxed validation"""
    available: Optional[bool] = False
    type: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)
    response_time: Optional[str] = Field(None, max_length=100)
