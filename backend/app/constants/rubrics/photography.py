"""Photography Review Rubric"""

from typing import Dict, List
from .types import FocusArea, RatingDimension, SectionPrompt, ContentRubric


FOCUS_AREAS: List[FocusArea] = [
    {
        "id": "composition",
        "label": "Composition",
        "description": "Is the framing and arrangement effective?"
    },
    {
        "id": "lighting",
        "label": "Lighting",
        "description": "Is the lighting well-executed?"
    },
    {
        "id": "exposure",
        "label": "Exposure",
        "description": "Is the exposure technically correct?"
    },
    {
        "id": "color",
        "label": "Color & Tone",
        "description": "Are colors and tones appealing?"
    },
    {
        "id": "focus",
        "label": "Focus & Sharpness",
        "description": "Is the subject in focus?"
    },
    {
        "id": "storytelling",
        "label": "Storytelling",
        "description": "Does the image convey emotion or narrative?"
    },
]

RATING_DIMENSIONS: List[RatingDimension] = [
    {
        "id": "composition",
        "label": "Composition",
        "description": "Is the image well-composed with effective framing?",
        "criteria": [
            "Rule of thirds or intentional framing",
            "Leading lines or visual flow",
            "Balanced elements and negative space",
            "Subject placement is effective"
        ]
    },
    {
        "id": "lighting",
        "label": "Lighting",
        "description": "Is the lighting appropriate and well-executed?",
        "criteria": [
            "Light quality suits the subject",
            "Shadows add depth, not distraction",
            "Highlights aren't blown out",
            "Mood created by lighting"
        ]
    },
    {
        "id": "technical_quality",
        "label": "Technical Quality",
        "description": "Is the image technically sound?",
        "criteria": [
            "Proper exposure (not over/underexposed)",
            "Sharp where intended",
            "Appropriate depth of field",
            "No unwanted noise or artifacts"
        ]
    },
    {
        "id": "color_editing",
        "label": "Color & Editing",
        "description": "Are colors and post-processing effective?",
        "criteria": [
            "Color grading suits the mood",
            "White balance is appropriate",
            "Editing enhances, doesn't distract",
            "Consistent style if part of a series"
        ]
    },
]

SECTION_PROMPTS: Dict[str, SectionPrompt] = {
    "strengths": {
        "id": "strengths",
        "label": "✅ Strengths",
        "prompt": "What works well in this photo?",
        "placeholder": "List specific strengths (e.g., 'Beautiful golden hour lighting', 'Strong leading lines'...)",
        "required": True,
        "min_items": 2
    },
    "improvements": {
        "id": "improvements",
        "label": "🔧 Areas for Improvement",
        "prompt": "What could be improved?",
        "placeholder": "List specific improvements (e.g., 'Crop tighter on subject', 'Reduce highlights in sky'...)",
        "required": True,
        "min_items": 2
    },
    "additional_notes": {
        "id": "additional_notes",
        "label": "📝 Additional Notes",
        "prompt": "Any other feedback or context?",
        "placeholder": "Add any additional context, explanations, or suggestions...",
        "required": False,
        "min_items": 0
    }
}

RUBRIC: ContentRubric = {
    "content_type": "photography",
    "focus_areas": FOCUS_AREAS,
    "rating_dimensions": RATING_DIMENSIONS,
    "section_prompts": SECTION_PROMPTS
}
