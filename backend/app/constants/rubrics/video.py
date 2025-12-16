"""Video Review Rubric"""

from typing import Dict, List
from .types import FocusArea, RatingDimension, SectionPrompt, ContentRubric


FOCUS_AREAS: List[FocusArea] = [
    {
        "id": "visual_quality",
        "label": "Visual Quality",
        "description": "Is the video crisp and well-lit?"
    },
    {
        "id": "editing",
        "label": "Editing & Pacing",
        "description": "Are cuts smooth and pacing good?"
    },
    {
        "id": "storytelling",
        "label": "Storytelling",
        "description": "Does it tell a compelling story?"
    },
    {
        "id": "audio_quality",
        "label": "Audio Quality",
        "description": "Is the audio clear and balanced?"
    },
    {
        "id": "creativity",
        "label": "Creativity",
        "description": "Are creative choices effective?"
    },
    {
        "id": "engagement",
        "label": "Viewer Engagement",
        "description": "Does it hold attention throughout?"
    },
]

RATING_DIMENSIONS: List[RatingDimension] = [
    {
        "id": "visual_quality",
        "label": "Visual Quality",
        "description": "Is the video well-shot with good lighting and composition?",
        "criteria": [
            "Proper exposure and color",
            "Stable footage (or intentional camera movement)",
            "Good composition in each shot"
        ]
    },
    {
        "id": "editing_pacing",
        "label": "Editing & Pacing",
        "description": "Are edits smooth and does pacing work well?",
        "criteria": [
            "Smooth transitions",
            "Cuts on action where appropriate",
            "Maintains good rhythm"
        ]
    },
    {
        "id": "storytelling",
        "label": "Storytelling",
        "description": "Does it effectively communicate the intended message/story?",
        "criteria": [
            "Clear narrative structure",
            "Engaging opening",
            "Satisfying conclusion"
        ]
    },
    {
        "id": "audio_quality",
        "label": "Audio Quality",
        "description": "Is the audio clear and properly mixed?",
        "criteria": [
            "Clear dialogue/narration",
            "Music enhances without overpowering",
            "Sound effects appropriate"
        ]
    },
]

SECTION_PROMPTS: Dict[str, SectionPrompt] = {
    "strengths": {
        "id": "strengths",
        "label": "✅ Strengths",
        "prompt": "What works well in this video?",
        "placeholder": "List specific strengths (e.g., 'Great pacing', 'Excellent b-roll'...)",
        "required": True,
        "min_items": 2
    },
    "improvements": {
        "id": "improvements",
        "label": "🔧 Video Suggestions",
        "prompt": "What video improvements would you suggest?",
        "placeholder": "List specific suggestions (e.g., 'Tighten intro', 'Improve audio levels'...)",
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
    "content_type": "video",
    "focus_areas": FOCUS_AREAS,
    "rating_dimensions": RATING_DIMENSIONS,
    "section_prompts": SECTION_PROMPTS
}
