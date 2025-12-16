"""Audio Review Rubric"""

from typing import Dict, List
from .types import FocusArea, RatingDimension, SectionPrompt, ContentRubric


FOCUS_AREAS: List[FocusArea] = [
    {
        "id": "sound_quality",
        "label": "Sound Quality",
        "description": "Is the audio clear and professional?"
    },
    {
        "id": "mixing",
        "label": "Mixing & Balance",
        "description": "Are all elements balanced well?"
    },
    {
        "id": "pacing",
        "label": "Pacing & Flow",
        "description": "Does the audio flow naturally?"
    },
    {
        "id": "vocal_performance",
        "label": "Performance",
        "description": "Is the vocal/musical performance strong?"
    },
    {
        "id": "production",
        "label": "Production Value",
        "description": "Does it sound polished and professional?"
    },
    {
        "id": "engagement",
        "label": "Engagement",
        "description": "Does it hold the listener's attention?"
    },
]

RATING_DIMENSIONS: List[RatingDimension] = [
    {
        "id": "sound_quality",
        "label": "Sound Quality",
        "description": "Is the audio clear, crisp, and free of technical issues?",
        "criteria": [
            "No background noise or hiss",
            "Clear dialogue/vocals",
            "No clipping or distortion"
        ]
    },
    {
        "id": "mixing_balance",
        "label": "Mixing & Balance",
        "description": "Are all audio elements balanced properly?",
        "criteria": [
            "Vocals sit well in the mix",
            "Music doesn't overpower dialogue",
            "Panning creates good stereo image"
        ]
    },
    {
        "id": "pacing_flow",
        "label": "Pacing & Flow",
        "description": "Does the audio have good rhythm and pacing?",
        "criteria": [
            "Natural transitions",
            "Good use of pauses/silence",
            "Maintains energy throughout"
        ]
    },
    {
        "id": "production_value",
        "label": "Production Value",
        "description": "Does it sound polished and professional?",
        "criteria": [
            "Appropriate EQ and compression",
            "Professional sound design",
            "Mastering levels appropriate"
        ]
    },
]

SECTION_PROMPTS: Dict[str, SectionPrompt] = {
    "strengths": {
        "id": "strengths",
        "label": "✅ Strengths",
        "prompt": "What works well in this audio?",
        "placeholder": "List specific strengths (e.g., 'Clear vocal delivery', 'Great mix balance'...)",
        "required": True,
        "min_items": 2
    },
    "improvements": {
        "id": "improvements",
        "label": "🔧 Audio Suggestions",
        "prompt": "What audio improvements would you suggest?",
        "placeholder": "List specific suggestions (e.g., 'Reduce sibilance', 'Add more bass'...)",
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
    "content_type": "audio",
    "focus_areas": FOCUS_AREAS,
    "rating_dimensions": RATING_DIMENSIONS,
    "section_prompts": SECTION_PROMPTS
}
