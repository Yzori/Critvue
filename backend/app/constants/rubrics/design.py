"""Design Review Rubric"""

from typing import Dict, List
from .types import FocusArea, RatingDimension, SectionPrompt, ContentRubric


FOCUS_AREAS: List[FocusArea] = [
    {
        "id": "visual_hierarchy",
        "label": "Visual Hierarchy",
        "description": "Is the visual hierarchy clear and effective?"
    },
    {
        "id": "accessibility",
        "label": "Accessibility",
        "description": "Is the design accessible to all users?"
    },
    {
        "id": "brand_alignment",
        "label": "Brand Alignment",
        "description": "Does it match the brand guidelines?"
    },
    {
        "id": "usability",
        "label": "Usability",
        "description": "Is it intuitive and user-friendly?"
    },
    {
        "id": "responsiveness",
        "label": "Responsiveness",
        "description": "Does it work across all screen sizes?"
    },
    {
        "id": "consistency",
        "label": "Consistency",
        "description": "Is the design consistent throughout?"
    },
]

RATING_DIMENSIONS: List[RatingDimension] = [
    {
        "id": "visual_hierarchy",
        "label": "Visual Hierarchy",
        "description": "Is the visual hierarchy clear and guides the user's eye effectively?",
        "criteria": [
            "Clear information architecture",
            "Important elements stand out",
            "Logical flow from top to bottom"
        ]
    },
    {
        "id": "accessibility",
        "label": "Accessibility",
        "description": "Is the design accessible to users with disabilities?",
        "criteria": [
            "Sufficient color contrast (WCAG AA)",
            "Text is readable",
            "Touch targets are adequate (44x44px min)",
            "Keyboard navigation considered"
        ]
    },
    {
        "id": "brand_alignment",
        "label": "Brand Alignment",
        "description": "Does the design align with brand guidelines?",
        "criteria": [
            "Brand colors used correctly",
            "Typography matches brand",
            "Design style fits brand personality"
        ]
    },
    {
        "id": "usability",
        "label": "Usability",
        "description": "Is the design intuitive and easy to use?",
        "criteria": [
            "Interactions are obvious",
            "Navigation is clear",
            "Error states handled well"
        ]
    },
]

SECTION_PROMPTS: Dict[str, SectionPrompt] = {
    "strengths": {
        "id": "strengths",
        "label": "✅ Strengths",
        "prompt": "What works well in this design?",
        "placeholder": "List specific strengths (e.g., 'Clear visual hierarchy', 'Great use of white space'...)",
        "required": True,
        "min_items": 2
    },
    "improvements": {
        "id": "improvements",
        "label": "🔧 Design Suggestions",
        "prompt": "What design improvements would you suggest?",
        "placeholder": "List specific suggestions (e.g., 'Increase button contrast', 'Simplify navigation'...)",
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
    "content_type": "design",
    "focus_areas": FOCUS_AREAS,
    "rating_dimensions": RATING_DIMENSIONS,
    "section_prompts": SECTION_PROMPTS
}
