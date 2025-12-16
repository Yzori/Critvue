"""Stream Review Rubric"""

from typing import Dict, List
from .types import FocusArea, RatingDimension, SectionPrompt, ContentRubric


FOCUS_AREAS: List[FocusArea] = [
    {
        "id": "engagement",
        "label": "Viewer Engagement",
        "description": "Does the content hook and retain viewers?"
    },
    {
        "id": "personality",
        "label": "Personality & Presence",
        "description": "Is the creator's personality compelling?"
    },
    {
        "id": "pacing",
        "label": "Pacing & Energy",
        "description": "Is the energy level and pacing right?"
    },
    {
        "id": "technical",
        "label": "Technical Quality",
        "description": "Are audio, video, and overlays polished?"
    },
    {
        "id": "format",
        "label": "Format & Structure",
        "description": "Does the content format work well?"
    },
    {
        "id": "platform",
        "label": "Platform Optimization",
        "description": "Is it optimized for the target platform?"
    },
]

RATING_DIMENSIONS: List[RatingDimension] = [
    {
        "id": "hook_retention",
        "label": "Hook & Retention",
        "description": "Does the content grab attention and keep viewers watching?",
        "criteria": [
            "Strong opening hook (first 3 seconds)",
            "Maintains viewer interest throughout",
            "Effective use of pattern interrupts"
        ]
    },
    {
        "id": "personality_presence",
        "label": "Personality & Presence",
        "description": "Is the creator engaging and authentic?",
        "criteria": [
            "Authentic personality comes through",
            "Good camera presence/energy",
            "Connects with audience effectively"
        ]
    },
    {
        "id": "technical_quality",
        "label": "Technical Quality",
        "description": "Is the production quality appropriate for the platform?",
        "criteria": [
            "Clear audio quality",
            "Good lighting and framing",
            "Smooth overlays/graphics if used"
        ]
    },
    {
        "id": "platform_optimization",
        "label": "Platform Optimization",
        "description": "Is the content optimized for its target platform?",
        "criteria": [
            "Right format (vertical/horizontal)",
            "Appropriate length for platform",
            "Uses platform-specific features effectively"
        ]
    },
]

SECTION_PROMPTS: Dict[str, SectionPrompt] = {
    "strengths": {
        "id": "strengths",
        "label": "✅ What Works",
        "prompt": "What's working well in this content?",
        "placeholder": "List specific strengths (e.g., 'Great hook', 'Authentic energy', 'Good pacing'...)",
        "required": True,
        "min_items": 2
    },
    "improvements": {
        "id": "improvements",
        "label": "🔧 Growth Areas",
        "prompt": "What would make this content perform better?",
        "placeholder": "List specific suggestions (e.g., 'Tighten the intro', 'Add captions', 'More energy'...)",
        "required": True,
        "min_items": 2
    },
    "additional_notes": {
        "id": "additional_notes",
        "label": "📝 Additional Notes",
        "prompt": "Any other feedback or platform-specific tips?",
        "placeholder": "Add any additional context, trend suggestions, or platform tips...",
        "required": False,
        "min_items": 0
    }
}

RUBRIC: ContentRubric = {
    "content_type": "stream",
    "focus_areas": FOCUS_AREAS,
    "rating_dimensions": RATING_DIMENSIONS,
    "section_prompts": SECTION_PROMPTS
}
