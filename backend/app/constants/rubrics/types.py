"""
Review Rubric Type Definitions

TypedDicts for structured review rubrics across all content types.
"""

from typing import Dict, List, TypedDict


class FocusArea(TypedDict):
    """A selectable focus area for quick assessment"""
    id: str
    label: str
    description: str


class RatingDimension(TypedDict):
    """A dimension to rate on a 1-5 scale"""
    id: str
    label: str
    description: str
    criteria: List[str]


class SectionPrompt(TypedDict):
    """A prompt for detailed feedback section"""
    id: str
    label: str
    prompt: str
    placeholder: str
    required: bool
    min_items: int  # For bullet list sections


class ContentRubric(TypedDict):
    """Complete rubric for a content type"""
    content_type: str
    focus_areas: List[FocusArea]
    rating_dimensions: List[RatingDimension]
    section_prompts: Dict[str, SectionPrompt]
