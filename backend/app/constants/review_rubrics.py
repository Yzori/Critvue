"""
Content-Type Specific Review Rubrics

Defines structured rubrics for different content types (code, design, writing).
Each rubric includes:
- Focus areas (for Phase 1 quick assessment)
- Rating dimensions (for Phase 2 structured rubric)
- Section prompts (for Phase 3 detailed feedback)
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


# ===== CODE REVIEW RUBRIC =====

CODE_FOCUS_AREAS: List[FocusArea] = [
    {
        "id": "functionality",
        "label": "Functionality",
        "description": "Does the code work as intended?"
    },
    {
        "id": "code_quality",
        "label": "Code Quality",
        "description": "Is the code clean and maintainable?"
    },
    {
        "id": "security",
        "label": "Security",
        "description": "Are there security vulnerabilities?"
    },
    {
        "id": "performance",
        "label": "Performance",
        "description": "Is the code efficient?"
    },
    {
        "id": "testing",
        "label": "Testing",
        "description": "Is test coverage adequate?"
    },
    {
        "id": "documentation",
        "label": "Documentation",
        "description": "Is the code well-documented?"
    },
]

CODE_RATING_DIMENSIONS: List[RatingDimension] = [
    {
        "id": "functionality",
        "label": "Functionality",
        "description": "Does the code work correctly and meet requirements?",
        "criteria": [
            "All features implemented correctly",
            "Edge cases handled properly",
            "No obvious bugs or errors"
        ]
    },
    {
        "id": "code_quality",
        "label": "Code Quality",
        "description": "Is the code clean, readable, and maintainable?",
        "criteria": [
            "Clear naming conventions",
            "Proper separation of concerns",
            "DRY principle followed",
            "Consistent formatting and style"
        ]
    },
    {
        "id": "security",
        "label": "Security",
        "description": "Are there any security concerns or vulnerabilities?",
        "criteria": [
            "Input validation present",
            "No SQL injection risks",
            "No XSS vulnerabilities",
            "Secrets properly managed"
        ]
    },
    {
        "id": "test_coverage",
        "label": "Test Coverage",
        "description": "Are there adequate tests for the code?",
        "criteria": [
            "Unit tests for key functions",
            "Edge cases tested",
            "Integration tests where needed"
        ]
    },
]

CODE_SECTION_PROMPTS: Dict[str, SectionPrompt] = {
    "strengths": {
        "id": "strengths",
        "label": "✅ Strengths",
        "prompt": "What works well in this code?",
        "placeholder": "List specific strengths (e.g., 'Clear function names', 'Good error handling'...)",
        "required": True,
        "min_items": 2
    },
    "improvements": {
        "id": "improvements",
        "label": "🔧 Areas for Improvement",
        "prompt": "What could be improved?",
        "placeholder": "List specific improvements (e.g., 'Add input validation', 'Refactor for DRY'...)",
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

CODE_RUBRIC: ContentRubric = {
    "content_type": "code",
    "focus_areas": CODE_FOCUS_AREAS,
    "rating_dimensions": CODE_RATING_DIMENSIONS,
    "section_prompts": CODE_SECTION_PROMPTS
}


# ===== DESIGN REVIEW RUBRIC =====

DESIGN_FOCUS_AREAS: List[FocusArea] = [
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

DESIGN_RATING_DIMENSIONS: List[RatingDimension] = [
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
            "Touch targets are adequate (44×44px min)",
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

DESIGN_SECTION_PROMPTS: Dict[str, SectionPrompt] = {
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

DESIGN_RUBRIC: ContentRubric = {
    "content_type": "design",
    "focus_areas": DESIGN_FOCUS_AREAS,
    "rating_dimensions": DESIGN_RATING_DIMENSIONS,
    "section_prompts": DESIGN_SECTION_PROMPTS
}


# ===== WRITING REVIEW RUBRIC =====

WRITING_FOCUS_AREAS: List[FocusArea] = [
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

WRITING_RATING_DIMENSIONS: List[RatingDimension] = [
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

WRITING_SECTION_PROMPTS: Dict[str, SectionPrompt] = {
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

WRITING_RUBRIC: ContentRubric = {
    "content_type": "writing",
    "focus_areas": WRITING_FOCUS_AREAS,
    "rating_dimensions": WRITING_RATING_DIMENSIONS,
    "section_prompts": WRITING_SECTION_PROMPTS
}


# ===== RUBRIC REGISTRY =====

RUBRICS: Dict[str, ContentRubric] = {
    "code": CODE_RUBRIC,
    "design": DESIGN_RUBRIC,
    "writing": WRITING_RUBRIC,
}


def get_rubric(content_type: str) -> ContentRubric:
    """Get rubric for a content type, with fallback to code rubric"""
    return RUBRICS.get(content_type, CODE_RUBRIC)


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
