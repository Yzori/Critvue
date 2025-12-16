"""Writing Review Rubric"""

from typing import Dict, List
from .types import FocusArea, RatingDimension, SectionPrompt, ContentRubric


FOCUS_AREAS: List[FocusArea] = [
    {
        "id": "clarity",
        "label": "Clarity",
        "description": "Is the writing clear and easy to understand?"
    },
    {
        "id": "structure",
        "label": "Structure",
        "description": "Is the content well-organized?"
    },
    {
        "id": "grammar",
        "label": "Grammar & Style",
        "description": "Is the grammar and style correct?"
    },
    {
        "id": "engagement",
        "label": "Engagement",
        "description": "Is the content engaging and compelling?"
    },
    {
        "id": "tone",
        "label": "Tone",
        "description": "Is the tone appropriate for the audience?"
    },
    {
        "id": "research",
        "label": "Research & Citations",
        "description": "Is the content well-researched?"
    },
]

RATING_DIMENSIONS: List[RatingDimension] = [
    {
        "id": "clarity",
        "label": "Clarity",
        "description": "Is the writing clear, concise, and easy to understand?",
        "criteria": [
            "Main ideas are clear",
            "Sentences are well-structured",
            "Jargon is explained or avoided"
        ]
    },
    {
        "id": "structure",
        "label": "Structure",
        "description": "Is the content logically organized?",
        "criteria": [
            "Clear introduction and conclusion",
            "Logical flow between sections",
            "Paragraphs have clear topics"
        ]
    },
    {
        "id": "grammar",
        "label": "Grammar & Style",
        "description": "Is the grammar, spelling, and punctuation correct?",
        "criteria": [
            "No grammar errors",
            "Consistent tense and voice",
            "Proper punctuation"
        ]
    },
    {
        "id": "engagement",
        "label": "Engagement",
        "description": "Is the content engaging and holds the reader's attention?",
        "criteria": [
            "Opening hooks the reader",
            "Content maintains interest",
            "Examples and stories enhance points"
        ]
    },
]

SECTION_PROMPTS: Dict[str, SectionPrompt] = {
    "strengths": {
        "id": "strengths",
        "label": "✅ Strengths",
        "prompt": "What works well in this writing?",
        "placeholder": "List specific strengths (e.g., 'Clear thesis statement', 'Engaging opening'...)",
        "required": True,
        "min_items": 2
    },
    "improvements": {
        "id": "improvements",
        "label": "🔧 Writing Suggestions",
        "prompt": "What writing improvements would you suggest?",
        "placeholder": "List specific suggestions (e.g., 'Tighten introduction', 'Add transitions'...)",
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
    "content_type": "writing",
    "focus_areas": FOCUS_AREAS,
    "rating_dimensions": RATING_DIMENSIONS,
    "section_prompts": SECTION_PROMPTS
}
