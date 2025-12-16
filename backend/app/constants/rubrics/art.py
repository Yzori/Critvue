"""Art Review Rubric"""

from typing import Dict, List
from .types import FocusArea, RatingDimension, SectionPrompt, ContentRubric


FOCUS_AREAS: List[FocusArea] = [
    {
        "id": "composition",
        "label": "Composition",
        "description": "Is the composition balanced and visually appealing?"
    },
    {
        "id": "technique",
        "label": "Technique",
        "description": "Is the technical execution skillful?"
    },
    {
        "id": "color_use",
        "label": "Color & Lighting",
        "description": "Are colors and lighting effective?"
    },
    {
        "id": "originality",
        "label": "Originality",
        "description": "Is the concept creative and unique?"
    },
    {
        "id": "detail",
        "label": "Detail & Finish",
        "description": "Is the level of detail appropriate?"
    },
    {
        "id": "emotional_impact",
        "label": "Emotional Impact",
        "description": "Does it evoke the intended emotion?"
    },
]

RATING_DIMENSIONS: List[RatingDimension] = [
    {
        "id": "composition",
        "label": "Composition",
        "description": "Is the composition balanced and guides the viewer's eye effectively?",
        "criteria": [
            "Rule of thirds applied",
            "Visual balance achieved",
            "Focal point is clear"
        ]
    },
    {
        "id": "technique",
        "label": "Technique",
        "description": "Is the technical execution skillful and appropriate?",
        "criteria": [
            "Brushwork/linework is controlled",
            "Values and contrast work well",
            "Anatomy/perspective is accurate"
        ]
    },
    {
        "id": "color_lighting",
        "label": "Color & Lighting",
        "description": "Are color choices and lighting effective?",
        "criteria": [
            "Color harmony present",
            "Lighting is believable",
            "Mood is conveyed through color"
        ]
    },
    {
        "id": "originality",
        "label": "Originality",
        "description": "Is the concept creative and shows unique perspective?",
        "criteria": [
            "Fresh take on subject matter",
            "Personal style evident",
            "Avoids cliches"
        ]
    },
]

SECTION_PROMPTS: Dict[str, SectionPrompt] = {
    "strengths": {
        "id": "strengths",
        "label": "✅ Strengths",
        "prompt": "What works well in this artwork?",
        "placeholder": "List specific strengths (e.g., 'Strong composition', 'Excellent use of color'...)",
        "required": True,
        "min_items": 2
    },
    "improvements": {
        "id": "improvements",
        "label": "🔧 Artistic Suggestions",
        "prompt": "What artistic improvements would you suggest?",
        "placeholder": "List specific suggestions (e.g., 'Refine hand anatomy', 'Add more contrast'...)",
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
    "content_type": "art",
    "focus_areas": FOCUS_AREAS,
    "rating_dimensions": RATING_DIMENSIONS,
    "section_prompts": SECTION_PROMPTS
}
