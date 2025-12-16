"""
Content-Type Specific Review Rubrics

Defines structured rubrics for different content types (photography, design, writing, etc.).
Each rubric includes:
- Focus areas (for Phase 1 quick assessment)
- Rating dimensions (for Phase 2 structured rubric)
- Section prompts (for Phase 3 detailed feedback)
"""

from typing import Dict, List

# Type definitions
from .types import (
    FocusArea,
    RatingDimension,
    SectionPrompt,
    ContentRubric,
)

# Individual rubrics
from .photography import RUBRIC as PHOTOGRAPHY_RUBRIC
from .design import RUBRIC as DESIGN_RUBRIC
from .writing import RUBRIC as WRITING_RUBRIC
from .art import RUBRIC as ART_RUBRIC
from .audio import RUBRIC as AUDIO_RUBRIC
from .video import RUBRIC as VIDEO_RUBRIC
from .stream import RUBRIC as STREAM_RUBRIC

# Subcategory overrides
from .subcategory_overrides import SUBCATEGORY_RATING_OVERRIDES


# ===== RUBRIC REGISTRY =====

RUBRICS: Dict[str, ContentRubric] = {
    "photography": PHOTOGRAPHY_RUBRIC,
    "design": DESIGN_RUBRIC,
    "writing": WRITING_RUBRIC,
    "art": ART_RUBRIC,
    "audio": AUDIO_RUBRIC,
    "video": VIDEO_RUBRIC,
    "stream": STREAM_RUBRIC,
}


# ===== HELPER FUNCTIONS =====

def get_rubric(content_type: str, subcategory: str = None) -> ContentRubric:
    """
    Get rubric for a content type and optional subcategory.

    If subcategory is provided, returns a merged rubric that combines:
    - Base rubric for the content type
    - Subcategory-specific rating dimensions

    Falls back to design rubric if content type not found.
    """
    # Get base rubric for content type
    base_rubric = RUBRICS.get(content_type, DESIGN_RUBRIC).copy()

    # If no subcategory, return base rubric
    if not subcategory:
        return base_rubric

    # Check if subcategory has specific overrides
    if content_type in SUBCATEGORY_RATING_OVERRIDES:
        subcategory_overrides = SUBCATEGORY_RATING_OVERRIDES[content_type].get(subcategory, [])

        if subcategory_overrides:
            # Create merged rubric with subcategory dimensions added
            merged_rubric = base_rubric.copy()
            # Combine base rating dimensions with subcategory-specific ones
            merged_rubric["rating_dimensions"] = base_rubric["rating_dimensions"] + subcategory_overrides
            return merged_rubric

    # No subcategory overrides found, return base rubric
    return base_rubric


def get_focus_areas(content_type: str) -> List[FocusArea]:
    """Get focus areas for a content type"""
    rubric = get_rubric(content_type)
    return rubric["focus_areas"]


def get_rating_dimensions(content_type: str) -> List[RatingDimension]:
    """Get rating dimensions for a content type"""
    rubric = get_rubric(content_type)
    return rubric["rating_dimensions"]


def get_section_prompts(content_type: str) -> Dict[str, SectionPrompt]:
    """Get section prompts for a content type"""
    rubric = get_rubric(content_type)
    return rubric["section_prompts"]


# Re-export everything for backward compatibility
__all__ = [
    # Types
    "FocusArea",
    "RatingDimension",
    "SectionPrompt",
    "ContentRubric",
    # Registry
    "RUBRICS",
    "SUBCATEGORY_RATING_OVERRIDES",
    # Individual rubrics
    "PHOTOGRAPHY_RUBRIC",
    "DESIGN_RUBRIC",
    "WRITING_RUBRIC",
    "ART_RUBRIC",
    "AUDIO_RUBRIC",
    "VIDEO_RUBRIC",
    "STREAM_RUBRIC",
    # Helper functions
    "get_rubric",
    "get_focus_areas",
    "get_rating_dimensions",
    "get_section_prompts",
]
