"""
Content-Type Specific Review Rubrics

Defines structured rubrics for different content types (photography, design, writing, etc.).
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


# ===== PHOTOGRAPHY REVIEW RUBRIC =====

PHOTOGRAPHY_FOCUS_AREAS: List[FocusArea] = [
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

PHOTOGRAPHY_RATING_DIMENSIONS: List[RatingDimension] = [
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

PHOTOGRAPHY_SECTION_PROMPTS: Dict[str, SectionPrompt] = {
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

PHOTOGRAPHY_RUBRIC: ContentRubric = {
    "content_type": "photography",
    "focus_areas": PHOTOGRAPHY_FOCUS_AREAS,
    "rating_dimensions": PHOTOGRAPHY_RATING_DIMENSIONS,
    "section_prompts": PHOTOGRAPHY_SECTION_PROMPTS
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


# ===== ART REVIEW RUBRIC =====

ART_FOCUS_AREAS: List[FocusArea] = [
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

ART_RATING_DIMENSIONS: List[RatingDimension] = [
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
            "Avoids clichés"
        ]
    },
]

ART_SECTION_PROMPTS: Dict[str, SectionPrompt] = {
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

ART_RUBRIC: ContentRubric = {
    "content_type": "art",
    "focus_areas": ART_FOCUS_AREAS,
    "rating_dimensions": ART_RATING_DIMENSIONS,
    "section_prompts": ART_SECTION_PROMPTS
}


# ===== AUDIO REVIEW RUBRIC =====

AUDIO_FOCUS_AREAS: List[FocusArea] = [
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

AUDIO_RATING_DIMENSIONS: List[RatingDimension] = [
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

AUDIO_SECTION_PROMPTS: Dict[str, SectionPrompt] = {
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

AUDIO_RUBRIC: ContentRubric = {
    "content_type": "audio",
    "focus_areas": AUDIO_FOCUS_AREAS,
    "rating_dimensions": AUDIO_RATING_DIMENSIONS,
    "section_prompts": AUDIO_SECTION_PROMPTS
}


# ===== VIDEO REVIEW RUBRIC =====

VIDEO_FOCUS_AREAS: List[FocusArea] = [
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

VIDEO_RATING_DIMENSIONS: List[RatingDimension] = [
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

VIDEO_SECTION_PROMPTS: Dict[str, SectionPrompt] = {
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

VIDEO_RUBRIC: ContentRubric = {
    "content_type": "video",
    "focus_areas": VIDEO_FOCUS_AREAS,
    "rating_dimensions": VIDEO_RATING_DIMENSIONS,
    "section_prompts": VIDEO_SECTION_PROMPTS
}


# ===== STREAM REVIEW RUBRIC =====

STREAM_FOCUS_AREAS: List[FocusArea] = [
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

STREAM_RATING_DIMENSIONS: List[RatingDimension] = [
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

STREAM_SECTION_PROMPTS: Dict[str, SectionPrompt] = {
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

STREAM_RUBRIC: ContentRubric = {
    "content_type": "stream",
    "focus_areas": STREAM_FOCUS_AREAS,
    "rating_dimensions": STREAM_RATING_DIMENSIONS,
    "section_prompts": STREAM_SECTION_PROMPTS
}


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


# ===== SUBCATEGORY-SPECIFIC RUBRIC OVERRIDES =====

# Subcategory rating dimensions that add to or override base rubric dimensions
# Format: {content_type: {subcategory_id: [additional_rating_dimensions]}}

SUBCATEGORY_RATING_OVERRIDES: Dict[str, Dict[str, List[RatingDimension]]] = {
    "photography": {
        "portrait": [
            {
                "id": "subject_connection",
                "label": "Subject Connection",
                "description": "Does the portrait capture personality and emotion?",
                "criteria": [
                    "Eye contact or intentional gaze",
                    "Natural or appropriate expression",
                    "Personality comes through"
                ]
            },
            {
                "id": "posing",
                "label": "Posing & Direction",
                "description": "Is the subject posed effectively?",
                "criteria": [
                    "Flattering angles used",
                    "Body language is natural",
                    "Hands positioned well"
                ]
            },
        ],
        "landscape": [
            {
                "id": "timing",
                "label": "Timing & Light",
                "description": "Was the photo taken at an optimal time?",
                "criteria": [
                    "Golden/blue hour utilized",
                    "Weather adds to mood",
                    "Dynamic sky if relevant"
                ]
            },
            {
                "id": "depth",
                "label": "Depth & Layers",
                "description": "Does the image have visual depth?",
                "criteria": [
                    "Foreground interest",
                    "Middle ground elements",
                    "Background context"
                ]
            },
        ],
        "street": [
            {
                "id": "moment",
                "label": "Decisive Moment",
                "description": "Was a compelling moment captured?",
                "criteria": [
                    "Peak action or expression",
                    "Story is evident",
                    "Timing is precise"
                ]
            },
            {
                "id": "context",
                "label": "Environmental Context",
                "description": "Does the environment add to the story?",
                "criteria": [
                    "Location is recognizable or evocative",
                    "Background complements subject",
                    "Urban/street elements integrated"
                ]
            },
        ],
        "product": [
            {
                "id": "presentation",
                "label": "Product Presentation",
                "description": "Is the product shown attractively?",
                "criteria": [
                    "Product is hero of image",
                    "Details are visible",
                    "Styling enhances appeal"
                ]
            },
            {
                "id": "commercial_quality",
                "label": "Commercial Quality",
                "description": "Is the image suitable for commercial use?",
                "criteria": [
                    "Clean, distraction-free",
                    "Consistent lighting",
                    "Color accuracy maintained"
                ]
            },
        ],
        "event": [
            {
                "id": "storytelling",
                "label": "Event Storytelling",
                "description": "Does the image tell the story of the event?",
                "criteria": [
                    "Key moments captured",
                    "Emotion is evident",
                    "Context is clear"
                ]
            },
            {
                "id": "candid_vs_posed",
                "label": "Candid vs Posed Balance",
                "description": "Is there a good mix of candid and posed shots?",
                "criteria": [
                    "Natural interactions captured",
                    "Posed shots are flattering",
                    "Mix tells complete story"
                ]
            },
        ],
        "editing": [
            {
                "id": "color_grading",
                "label": "Color Grading",
                "description": "Is the color grading effective and consistent?",
                "criteria": [
                    "Color palette is cohesive",
                    "Skin tones are natural",
                    "Style matches intent"
                ]
            },
            {
                "id": "retouching",
                "label": "Retouching Quality",
                "description": "Is retouching skillfully done?",
                "criteria": [
                    "Edits are invisible",
                    "Not over-processed",
                    "Details preserved"
                ]
            },
        ],
    },
    "design": {
        "ui_ux": [
            {
                "id": "user_flow",
                "label": "User Flow",
                "description": "Is the user journey intuitive?",
                "criteria": [
                    "Clear navigation paths",
                    "Logical task flows",
                    "Minimal friction points"
                ]
            },
            {
                "id": "interaction_design",
                "label": "Interaction Design",
                "description": "Are interactions clear and delightful?",
                "criteria": [
                    "Micro-interactions enhance UX",
                    "Feedback on user actions",
                    "Loading states handled"
                ]
            },
        ],
        "branding": [
            {
                "id": "brand_consistency",
                "label": "Brand Consistency",
                "description": "Is branding consistent across touchpoints?",
                "criteria": [
                    "Logo variations appropriate",
                    "Color palette cohesive",
                    "Typography system defined"
                ]
            },
            {
                "id": "brand_personality",
                "label": "Brand Personality",
                "description": "Does it convey the intended brand personality?",
                "criteria": [
                    "Visual style matches brand voice",
                    "Emotional tone appropriate",
                    "Target audience considered"
                ]
            },
        ],
        "marketing": [
            {
                "id": "visual_impact",
                "label": "Visual Impact",
                "description": "Does it grab attention effectively?",
                "criteria": [
                    "Strong focal point",
                    "Eye-catching design",
                    "Message is clear at a glance"
                ]
            },
            {
                "id": "call_to_action",
                "label": "Call to Action",
                "description": "Is the CTA clear and compelling?",
                "criteria": [
                    "CTA stands out",
                    "Action is obvious",
                    "Urgency/value communicated"
                ]
            },
        ],
        "web_design": [
            {
                "id": "responsive_layout",
                "label": "Responsive Layout",
                "description": "Does it work across all device sizes?",
                "criteria": [
                    "Mobile-first approach",
                    "Breakpoints well-chosen",
                    "Content reflows naturally"
                ]
            },
            {
                "id": "page_performance",
                "label": "Page Performance",
                "description": "Are design choices performance-friendly?",
                "criteria": [
                    "Images optimized",
                    "Minimal layout shifts",
                    "Fast loading considered"
                ]
            },
        ],
        "mobile_design": [
            {
                "id": "thumb_zone",
                "label": "Thumb Zone",
                "description": "Are key actions within easy thumb reach?",
                "criteria": [
                    "Primary actions in thumb zone",
                    "44×44px minimum touch targets",
                    "Bottom navigation considered"
                ]
            },
            {
                "id": "platform_patterns",
                "label": "Platform Patterns",
                "description": "Does it follow iOS/Android design patterns?",
                "criteria": [
                    "Native components used",
                    "Platform conventions followed",
                    "Gesture patterns appropriate"
                ]
            },
        ],
        "print": [
            {
                "id": "print_production",
                "label": "Print Production",
                "description": "Is it ready for professional printing?",
                "criteria": [
                    "CMYK color mode",
                    "Bleed and crop marks present",
                    "Resolution sufficient (300dpi+)"
                ]
            },
            {
                "id": "readability",
                "label": "Readability",
                "description": "Is text easily readable when printed?",
                "criteria": [
                    "Font sizes appropriate",
                    "Line spacing comfortable",
                    "Contrast sufficient for print"
                ]
            },
        ],
    },
    "art": {
        "illustration": [
            {
                "id": "style_consistency",
                "label": "Style Consistency",
                "description": "Is the illustration style consistent?",
                "criteria": [
                    "Line weight consistent",
                    "Rendering style unified",
                    "Color palette cohesive"
                ]
            },
            {
                "id": "concept_clarity",
                "label": "Concept Clarity",
                "description": "Is the concept clearly communicated?",
                "criteria": [
                    "Message is clear",
                    "Symbolism works",
                    "Narrative is readable"
                ]
            },
        ],
        "traditional": [
            {
                "id": "medium_mastery",
                "label": "Medium Mastery",
                "description": "Is the traditional medium well-executed?",
                "criteria": [
                    "Medium properties understood",
                    "Technique appropriate for medium",
                    "Material handling skillful"
                ]
            },
            {
                "id": "value_structure",
                "label": "Value Structure",
                "description": "Are light and shadow values strong?",
                "criteria": [
                    "Value range used fully",
                    "Form defined by values",
                    "Lighting is believable"
                ]
            },
        ],
        "3d_modeling": [
            {
                "id": "topology",
                "label": "Topology",
                "description": "Is the 3D mesh topology clean and efficient?",
                "criteria": [
                    "Edge flow follows form",
                    "No unnecessary polygons",
                    "Deformation-ready topology"
                ]
            },
            {
                "id": "texturing",
                "label": "Texturing & Materials",
                "description": "Are textures and materials realistic?",
                "criteria": [
                    "UV mapping clean",
                    "Texture resolution appropriate",
                    "Materials physically plausible"
                ]
            },
        ],
        "concept_art": [
            {
                "id": "design_variation",
                "label": "Design Variation",
                "description": "Are multiple design iterations shown?",
                "criteria": [
                    "Exploration is evident",
                    "Variations are distinct",
                    "Best option is clear"
                ]
            },
            {
                "id": "functional_design",
                "label": "Functional Design",
                "description": "Does the design work functionally?",
                "criteria": [
                    "Proportions make sense",
                    "Mechanical parts plausible",
                    "Design serves purpose"
                ]
            },
        ],
        "character_design": [
            {
                "id": "silhouette",
                "label": "Silhouette",
                "description": "Is the character silhouette strong and recognizable?",
                "criteria": [
                    "Readable from silhouette alone",
                    "Distinctive shape language",
                    "Personality evident in silhouette"
                ]
            },
            {
                "id": "expression",
                "label": "Expression & Personality",
                "description": "Does the design convey personality?",
                "criteria": [
                    "Facial expression clear",
                    "Body language communicative",
                    "Character traits visible"
                ]
            },
        ],
        "digital_painting": [
            {
                "id": "rendering_quality",
                "label": "Rendering Quality",
                "description": "Is the painting skillfully rendered?",
                "criteria": [
                    "Forms are well-defined",
                    "Edges are intentional",
                    "Detail level appropriate"
                ]
            },
            {
                "id": "atmospheric_perspective",
                "label": "Atmospheric Perspective",
                "description": "Is depth conveyed through atmosphere?",
                "criteria": [
                    "Distance affects value/color",
                    "Depth cues present",
                    "Atmospheric effects believable"
                ]
            },
        ],
    },
    "audio": {
        "voiceover": [
            {
                "id": "vocal_clarity",
                "label": "Vocal Clarity",
                "description": "Is the voice clear and easy to understand?",
                "criteria": [
                    "Articulation is crisp",
                    "Pacing is appropriate",
                    "Energy level matches content"
                ]
            },
            {
                "id": "emotional_delivery",
                "label": "Emotional Delivery",
                "description": "Does the performance convey the right emotion?",
                "criteria": [
                    "Tone matches message",
                    "Inflection is natural",
                    "Emotion feels authentic"
                ]
            },
        ],
        "podcast": [
            {
                "id": "content_flow",
                "label": "Content Flow",
                "description": "Does the podcast flow naturally?",
                "criteria": [
                    "Smooth transitions between topics",
                    "Pacing keeps interest",
                    "Natural conversation rhythm"
                ]
            },
            {
                "id": "audio_consistency",
                "label": "Audio Consistency",
                "description": "Is audio quality consistent throughout?",
                "criteria": [
                    "Volume levels consistent",
                    "Background noise minimal",
                    "All speakers clear"
                ]
            },
        ],
        "music": [
            {
                "id": "composition",
                "label": "Composition",
                "description": "Is the musical composition strong?",
                "criteria": [
                    "Melody is memorable",
                    "Harmonic progression works",
                    "Song structure is effective"
                ]
            },
            {
                "id": "arrangement",
                "label": "Arrangement",
                "description": "Is the instrumentation well-arranged?",
                "criteria": [
                    "Instruments complement each other",
                    "Frequency spectrum balanced",
                    "Dynamic range used effectively"
                ]
            },
        ],
        "sound_design": [
            {
                "id": "sonic_creativity",
                "label": "Sonic Creativity",
                "description": "Are sound design choices creative and fitting?",
                "criteria": [
                    "Sounds match visuals/action",
                    "Creative sound selection",
                    "Layering adds depth"
                ]
            },
            {
                "id": "spatial_audio",
                "label": "Spatial Audio",
                "description": "Is the stereo/spatial field used effectively?",
                "criteria": [
                    "Panning creates space",
                    "Depth through reverb/delay",
                    "Immersive soundscape"
                ]
            },
        ],
        "mixing": [
            {
                "id": "frequency_balance",
                "label": "Frequency Balance",
                "description": "Are frequencies well-balanced across the spectrum?",
                "criteria": [
                    "No frequency masking",
                    "EQ enhances clarity",
                    "Full spectrum utilized"
                ]
            },
            {
                "id": "dynamics_processing",
                "label": "Dynamics Processing",
                "description": "Is compression and limiting appropriate?",
                "criteria": [
                    "Dynamics controlled but natural",
                    "No over-compression artifacts",
                    "Punch and energy maintained"
                ]
            },
        ],
    },
    "video": {
        "filmed": [
            {
                "id": "cinematography",
                "label": "Cinematography",
                "description": "Is the camerawork and framing professional?",
                "criteria": [
                    "Shot composition strong",
                    "Camera movements intentional",
                    "Lighting enhances mood"
                ]
            },
            {
                "id": "color_grading",
                "label": "Color Grading",
                "description": "Is the color grade consistent and enhances the story?",
                "criteria": [
                    "Color tone matches mood",
                    "Grading is consistent",
                    "Skin tones natural"
                ]
            },
        ],
        "edited_clip": [
            {
                "id": "cut_timing",
                "label": "Cut Timing",
                "description": "Are edits well-timed and rhythmic?",
                "criteria": [
                    "Cuts on action",
                    "Beat and rhythm present",
                    "Montage pacing effective"
                ]
            },
            {
                "id": "transition_style",
                "label": "Transition Style",
                "description": "Are transitions appropriate and seamless?",
                "criteria": [
                    "Transitions enhance story",
                    "Not overused or distracting",
                    "Style is consistent"
                ]
            },
        ],
        "animation": [
            {
                "id": "motion_quality",
                "label": "Motion Quality",
                "description": "Is the animation smooth and well-timed?",
                "criteria": [
                    "Easing curves natural",
                    "Timing feels right",
                    "Motion has weight/physics"
                ]
            },
            {
                "id": "design_cohesion",
                "label": "Design Cohesion",
                "description": "Do all visual elements work together?",
                "criteria": [
                    "Style is unified",
                    "Color palette cohesive",
                    "Visual hierarchy clear"
                ]
            },
        ],
        "game_capture": [
            {
                "id": "capture_quality",
                "label": "Capture Quality",
                "description": "Is the game footage captured at high quality?",
                "criteria": [
                    "High resolution/framerate",
                    "No lag or stuttering",
                    "Game audio balanced with commentary"
                ]
            },
            {
                "id": "commentary",
                "label": "Commentary",
                "description": "Is commentary engaging and adds value?",
                "criteria": [
                    "Commentary is entertaining",
                    "Provides useful information",
                    "Energy level appropriate"
                ]
            },
        ],
        "tutorial": [
            {
                "id": "instructional_clarity",
                "label": "Instructional Clarity",
                "description": "Are instructions clear and easy to follow?",
                "criteria": [
                    "Steps are well-explained",
                    "Visual aids support learning",
                    "Pacing allows for comprehension"
                ]
            },
            {
                "id": "production_value",
                "label": "Production Value",
                "description": "Does the tutorial look professional?",
                "criteria": [
                    "Screen recordings crisp",
                    "Graphics enhance understanding",
                    "Audio is clear"
                ]
            },
        ],
        "short_form": [
            {
                "id": "hook",
                "label": "Hook",
                "description": "Does it grab attention in the first 3 seconds?",
                "criteria": [
                    "Strong opening hook",
                    "Immediately engaging",
                    "Curiosity created"
                ]
            },
            {
                "id": "retention",
                "label": "Retention",
                "description": "Does it maintain interest until the end?",
                "criteria": [
                    "Fast pacing throughout",
                    "Visual variety keeps interest",
                    "Satisfying payoff"
                ]
            },
        ],
    },
    "writing": {
        "blog_article": [
            {
                "id": "seo_optimization",
                "label": "SEO Optimization",
                "description": "Is the article optimized for search engines?",
                "criteria": [
                    "Keywords naturally integrated",
                    "Meta description compelling",
                    "Headings structured hierarchically"
                ]
            },
            {
                "id": "reader_engagement",
                "label": "Reader Engagement",
                "description": "Does it keep readers engaged?",
                "criteria": [
                    "Scannable with subheadings",
                    "Short paragraphs",
                    "Examples and stories"
                ]
            },
        ],
        "technical": [
            {
                "id": "technical_accuracy",
                "label": "Technical Accuracy",
                "description": "Is technical information correct and precise?",
                "criteria": [
                    "Facts are accurate",
                    "Code examples work",
                    "Technical terms used correctly"
                ]
            },
            {
                "id": "documentation_completeness",
                "label": "Documentation Completeness",
                "description": "Is all necessary information included?",
                "criteria": [
                    "All parameters documented",
                    "Examples provided",
                    "Edge cases addressed"
                ]
            },
        ],
        "creative": [
            {
                "id": "character_development",
                "label": "Character Development",
                "description": "Are characters well-developed and believable?",
                "criteria": [
                    "Characters feel real",
                    "Motivations are clear",
                    "Character arcs present"
                ]
            },
            {
                "id": "narrative_voice",
                "label": "Narrative Voice",
                "description": "Is the narrative voice strong and consistent?",
                "criteria": [
                    "Voice is distinctive",
                    "POV is consistent",
                    "Style enhances story"
                ]
            },
        ],
        "marketing_copy": [
            {
                "id": "persuasiveness",
                "label": "Persuasiveness",
                "description": "Does the copy persuade and motivate action?",
                "criteria": [
                    "Benefits clearly stated",
                    "Objections addressed",
                    "Urgency created"
                ]
            },
            {
                "id": "brand_voice",
                "label": "Brand Voice",
                "description": "Does it match the brand's voice and tone?",
                "criteria": [
                    "Tone appropriate for brand",
                    "Messaging on-brand",
                    "Target audience considered"
                ]
            },
        ],
        "script": [
            {
                "id": "dialogue_quality",
                "label": "Dialogue Quality",
                "description": "Is the dialogue natural and character-driven?",
                "criteria": [
                    "Sounds like real speech",
                    "Each character distinct",
                    "Subtext present"
                ]
            },
            {
                "id": "scene_structure",
                "label": "Scene Structure",
                "description": "Are scenes well-structured with clear beats?",
                "criteria": [
                    "Each scene has purpose",
                    "Conflict and tension present",
                    "Scene transitions smooth"
                ]
            },
        ],
        "academic": [
            {
                "id": "research_depth",
                "label": "Research Depth",
                "description": "Is the research thorough and well-sourced?",
                "criteria": [
                    "Sources are credible",
                    "Research is comprehensive",
                    "Citations are proper"
                ]
            },
            {
                "id": "argument_strength",
                "label": "Argument Strength",
                "description": "Is the argument logical and well-supported?",
                "criteria": [
                    "Thesis is clear",
                    "Evidence supports claims",
                    "Counter-arguments addressed"
                ]
            },
        ],
    },
}


def get_rubric(content_type: str, subcategory: str = None) -> ContentRubric:
    """
    Get rubric for a content type and optional subcategory.

    If subcategory is provided, returns a merged rubric that combines:
    - Base rubric for the content type
    - Subcategory-specific rating dimensions

    Falls back to code rubric if content type not found.
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
