"""
Review Section Templates

This module provides context-aware section templates for the Smart Adaptive Review Editor.
Sections are determined by:
1. Content Type (design, code, writing, video, audio, art)
2. Feedback Priority (validation, specific_fixes, strategic_direction, comprehensive)
3. Review Tier (quick, standard, deep)

Each template defines:
- Section ID: Unique identifier
- Label: Human-readable section name
- Prompt: Question/guidance for the reviewer
- Placeholder: Example text for the textarea
- Required: Whether this section must be filled
- Min Words: Minimum word count for this section
- Order: Display order
"""

from typing import List, Dict, Tuple, Optional
from app.models.review_request import ContentType, FeedbackPriority, ReviewTier


class SectionTemplate:
    """Individual section template"""

    def __init__(
        self,
        id: str,
        label: str,
        prompt: str,
        placeholder: str,
        required: bool,
        min_words: int,
        order: int
    ):
        self.id = id
        self.label = label
        self.prompt = prompt
        self.placeholder = placeholder
        self.required = required
        self.min_words = min_words
        self.order = order

    def to_dict(self) -> Dict:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "label": self.label,
            "prompt": self.prompt,
            "placeholder": self.placeholder,
            "required": self.required,
            "min_words": self.min_words,
            "order": self.order
        }


# ===== DESIGN REVIEW TEMPLATES =====

DESIGN_VALIDATION_QUICK = [
    SectionTemplate(
        id="first_impression",
        label="First Impression",
        prompt="What's your immediate reaction to this design?",
        placeholder="Describe your first thoughts when viewing this design...",
        required=True,
        min_words=75,
        order=1
    ),
    SectionTemplate(
        id="quick_feedback",
        label="Quick Validation",
        prompt="Does this design achieve its goals? What would you change?",
        placeholder="Provide quick validation feedback...",
        required=True,
        min_words=100,
        order=2
    )
]

DESIGN_SPECIFIC_FIXES_STANDARD = [
    SectionTemplate(
        id="issues",
        label="Issues Identified",
        prompt="What specific problems or mistakes did you identify?",
        placeholder="List specific issues with layout, spacing, alignment, color contrast, typography...",
        required=True,
        min_words=150,
        order=1
    ),
    SectionTemplate(
        id="suggestions",
        label="Suggestions & Fixes",
        prompt="How would you fix each issue?",
        placeholder="Provide actionable recommendations with specific examples...",
        required=True,
        min_words=150,
        order=2
    ),
    SectionTemplate(
        id="positive_aspects",
        label="What Works Well",
        prompt="What elements of the design are effective?",
        placeholder="Highlight positive aspects...",
        required=False,
        min_words=50,
        order=3
    )
]

DESIGN_COMPREHENSIVE_DEEP = [
    SectionTemplate(
        id="overall_assessment",
        label="Overall Design Assessment",
        prompt="Provide a comprehensive evaluation of this design",
        placeholder="Analyze the design's effectiveness, visual hierarchy, and overall impact...",
        required=True,
        min_words=200,
        order=1
    ),
    SectionTemplate(
        id="visual_design",
        label="Visual Design & Aesthetics",
        prompt="Evaluate color, typography, spacing, and visual balance",
        placeholder="Assess the visual design elements...",
        required=True,
        min_words=150,
        order=2
    ),
    SectionTemplate(
        id="usability",
        label="Usability & UX",
        prompt="How intuitive and user-friendly is this design?",
        placeholder="Evaluate navigation, clarity, and user experience...",
        required=True,
        min_words=150,
        order=3
    ),
    SectionTemplate(
        id="accessibility",
        label="Accessibility Considerations",
        prompt="Assess color contrast, readability, and inclusive design",
        placeholder="Review accessibility compliance and improvements...",
        required=True,
        min_words=100,
        order=4
    ),
    SectionTemplate(
        id="improvements",
        label="Strategic Improvements",
        prompt="What long-term improvements would elevate this design?",
        placeholder="Suggest strategic enhancements...",
        required=True,
        min_words=150,
        order=5
    ),
    SectionTemplate(
        id="next_steps",
        label="Recommended Next Steps",
        prompt="What should the designer prioritize?",
        placeholder="Provide actionable next steps...",
        required=True,
        min_words=100,
        order=6
    )
]

# ===== CODE REVIEW TEMPLATES =====

CODE_VALIDATION_QUICK = [
    SectionTemplate(
        id="quick_assessment",
        label="Quick Code Assessment",
        prompt="Does this code accomplish its intended purpose?",
        placeholder="Provide a quick validation of the code's functionality...",
        required=True,
        min_words=100,
        order=1
    ),
    SectionTemplate(
        id="immediate_concerns",
        label="Immediate Concerns",
        prompt="Are there any critical issues or bugs?",
        placeholder="Flag any bugs, security issues, or major problems...",
        required=True,
        min_words=75,
        order=2
    )
]

CODE_SPECIFIC_FIXES_STANDARD = [
    SectionTemplate(
        id="code_quality",
        label="Code Quality",
        prompt="Assess readability, maintainability, and adherence to best practices",
        placeholder="Evaluate code structure, naming, comments, and style...",
        required=True,
        min_words=150,
        order=1
    ),
    SectionTemplate(
        id="bugs_and_issues",
        label="Bugs & Potential Issues",
        prompt="Identify bugs, edge cases, and security concerns",
        placeholder="List specific bugs, vulnerabilities, or edge cases...",
        required=True,
        min_words=150,
        order=2
    ),
    SectionTemplate(
        id="improvement_suggestions",
        label="Improvement Suggestions",
        prompt="How can this code be improved?",
        placeholder="Suggest refactoring, optimizations, or alternative approaches...",
        required=True,
        min_words=100,
        order=3
    )
]

CODE_COMPREHENSIVE_DEEP = [
    SectionTemplate(
        id="architecture",
        label="Architecture & Structure",
        prompt="Evaluate the overall code organization and design patterns",
        placeholder="Analyze architecture, modularity, and design decisions...",
        required=True,
        min_words=200,
        order=1
    ),
    SectionTemplate(
        id="code_quality_deep",
        label="Code Quality Analysis",
        prompt="Deep dive into code quality, readability, and maintainability",
        placeholder="Assess naming conventions, complexity, documentation...",
        required=True,
        min_words=200,
        order=2
    ),
    SectionTemplate(
        id="security_performance",
        label="Security & Performance",
        prompt="Identify security vulnerabilities and performance bottlenecks",
        placeholder="Review security practices, performance issues, and optimizations...",
        required=True,
        min_words=150,
        order=3
    ),
    SectionTemplate(
        id="testing",
        label="Testing & Error Handling",
        prompt="Evaluate test coverage and error handling strategies",
        placeholder="Assess testing approach, edge cases, and error management...",
        required=True,
        min_words=150,
        order=4
    ),
    SectionTemplate(
        id="best_practices",
        label="Best Practices & Patterns",
        prompt="How well does the code follow language/framework best practices?",
        placeholder="Evaluate adherence to best practices and design patterns...",
        required=True,
        min_words=150,
        order=5
    ),
    SectionTemplate(
        id="strategic_recommendations",
        label="Strategic Recommendations",
        prompt="What long-term improvements would make this codebase more robust?",
        placeholder="Suggest architectural improvements and refactoring priorities...",
        required=True,
        min_words=150,
        order=6
    )
]

# ===== WRITING REVIEW TEMPLATES =====

WRITING_VALIDATION_QUICK = [
    SectionTemplate(
        id="clarity_quick",
        label="Clarity & Readability",
        prompt="Is the writing clear and easy to understand?",
        placeholder="Assess clarity, flow, and readability...",
        required=True,
        min_words=100,
        order=1
    ),
    SectionTemplate(
        id="quick_suggestions",
        label="Quick Improvements",
        prompt="What are the top 2-3 things to improve?",
        placeholder="List priority improvements...",
        required=True,
        min_words=75,
        order=2
    )
]

WRITING_SPECIFIC_FIXES_STANDARD = [
    SectionTemplate(
        id="content_structure",
        label="Content & Structure",
        prompt="Evaluate the logical flow and organization",
        placeholder="Assess how ideas are organized and connected...",
        required=True,
        min_words=150,
        order=1
    ),
    SectionTemplate(
        id="language_style",
        label="Language & Style",
        prompt="Assess grammar, word choice, and writing style",
        placeholder="Review language quality, tone, and consistency...",
        required=True,
        min_words=150,
        order=2
    ),
    SectionTemplate(
        id="specific_edits",
        label="Specific Edits Needed",
        prompt="What specific changes should be made?",
        placeholder="Provide detailed edit suggestions...",
        required=True,
        min_words=100,
        order=3
    )
]

WRITING_COMPREHENSIVE_DEEP = [
    SectionTemplate(
        id="overall_assessment_writing",
        label="Overall Writing Assessment",
        prompt="Provide a comprehensive evaluation of this piece",
        placeholder="Analyze effectiveness, impact, and quality...",
        required=True,
        min_words=200,
        order=1
    ),
    SectionTemplate(
        id="structure_flow",
        label="Structure & Flow",
        prompt="How well does the content flow from idea to idea?",
        placeholder="Evaluate organization, transitions, and logical progression...",
        required=True,
        min_words=150,
        order=2
    ),
    SectionTemplate(
        id="clarity_engagement",
        label="Clarity & Engagement",
        prompt="Is the writing clear, engaging, and appropriate for the audience?",
        placeholder="Assess readability, engagement, and audience fit...",
        required=True,
        min_words=150,
        order=3
    ),
    SectionTemplate(
        id="language_mechanics",
        label="Language & Mechanics",
        prompt="Evaluate grammar, punctuation, word choice, and style",
        placeholder="Review technical writing quality...",
        required=True,
        min_words=150,
        order=4
    ),
    SectionTemplate(
        id="strengths_weaknesses",
        label="Strengths & Weaknesses",
        prompt="What works well and what needs improvement?",
        placeholder="Highlight both strong points and areas for development...",
        required=True,
        min_words=150,
        order=5
    ),
    SectionTemplate(
        id="revision_priorities",
        label="Revision Priorities",
        prompt="What should the writer focus on in their next draft?",
        placeholder="Prioritize revision recommendations...",
        required=True,
        min_words=100,
        order=6
    )
]

# ===== VIDEO/AUDIO REVIEW TEMPLATES =====

VIDEO_VALIDATION_QUICK = [
    SectionTemplate(
        id="initial_reaction",
        label="Initial Reaction",
        prompt="What's your first impression of this video?",
        placeholder="Share your immediate thoughts...",
        required=True,
        min_words=75,
        order=1
    ),
    SectionTemplate(
        id="quick_notes",
        label="Key Observations",
        prompt="What are the main strengths and weaknesses?",
        placeholder="Provide quick observations about quality and effectiveness...",
        required=True,
        min_words=100,
        order=2
    )
]

VIDEO_SPECIFIC_FIXES_STANDARD = [
    SectionTemplate(
        id="editing_pacing",
        label="Editing & Pacing",
        prompt="Evaluate cuts, transitions, and overall flow",
        placeholder="Assess editing quality, pacing, and rhythm...",
        required=True,
        min_words=150,
        order=1
    ),
    SectionTemplate(
        id="visual_quality",
        label="Visual Quality",
        prompt="Assess composition, lighting, and color",
        placeholder="Review visual elements and production quality...",
        required=True,
        min_words=100,
        order=2
    ),
    SectionTemplate(
        id="audio_quality",
        label="Audio Quality",
        prompt="Evaluate sound, music, and audio mixing",
        placeholder="Assess audio clarity, balance, and quality...",
        required=True,
        min_words=100,
        order=3
    ),
    SectionTemplate(
        id="content_message",
        label="Content & Message",
        prompt="Does the video effectively communicate its message?",
        placeholder="Evaluate storytelling, clarity, and impact...",
        required=True,
        min_words=100,
        order=4
    )
]

# ===== ART REVIEW TEMPLATES (Similar to Design) =====

ART_VALIDATION_QUICK = DESIGN_VALIDATION_QUICK  # Reuse design templates
ART_SPECIFIC_FIXES_STANDARD = DESIGN_SPECIFIC_FIXES_STANDARD
ART_COMPREHENSIVE_DEEP = DESIGN_COMPREHENSIVE_DEEP

# ===== STREAM REVIEW TEMPLATES =====

STREAM_VALIDATION_QUICK = [
    SectionTemplate(
        id="first_impression",
        label="First Impression",
        prompt="What's your immediate reaction to this content?",
        placeholder="Share your first thoughts - does it grab you?",
        required=True,
        min_words=75,
        order=1
    ),
    SectionTemplate(
        id="quick_feedback",
        label="Quick Feedback",
        prompt="What works and what needs improvement?",
        placeholder="Note key strengths and areas to improve...",
        required=True,
        min_words=100,
        order=2
    )
]

STREAM_SPECIFIC_FIXES_STANDARD = [
    SectionTemplate(
        id="hook_engagement",
        label="Hook & Engagement",
        prompt="How effective is the opening and viewer retention?",
        placeholder="Evaluate the hook, pacing, and ability to keep viewers watching...",
        required=True,
        min_words=150,
        order=1
    ),
    SectionTemplate(
        id="personality_presence",
        label="Personality & Presence",
        prompt="How does the creator come across on screen?",
        placeholder="Assess energy, authenticity, and connection with audience...",
        required=True,
        min_words=100,
        order=2
    ),
    SectionTemplate(
        id="technical_production",
        label="Technical & Production",
        prompt="Evaluate audio, video quality, and any overlays/graphics",
        placeholder="Assess technical aspects - audio clarity, lighting, graphics...",
        required=True,
        min_words=100,
        order=3
    ),
    SectionTemplate(
        id="platform_optimization",
        label="Platform Optimization",
        prompt="Is this content optimized for its target platform?",
        placeholder="Consider format, length, trends, and platform-specific best practices...",
        required=True,
        min_words=100,
        order=4
    )
]

# ===== SECTION TEMPLATE REGISTRY =====

SECTION_TEMPLATES: Dict[Tuple[str, str, str], List[SectionTemplate]] = {
    # DESIGN reviews
    (ContentType.DESIGN.value, FeedbackPriority.VALIDATION.value, ReviewTier.QUICK.value): DESIGN_VALIDATION_QUICK,
    (ContentType.DESIGN.value, FeedbackPriority.SPECIFIC_FIXES.value, ReviewTier.STANDARD.value): DESIGN_SPECIFIC_FIXES_STANDARD,
    (ContentType.DESIGN.value, FeedbackPriority.COMPREHENSIVE.value, ReviewTier.DEEP.value): DESIGN_COMPREHENSIVE_DEEP,

    # CODE reviews
    (ContentType.CODE.value, FeedbackPriority.VALIDATION.value, ReviewTier.QUICK.value): CODE_VALIDATION_QUICK,
    (ContentType.CODE.value, FeedbackPriority.SPECIFIC_FIXES.value, ReviewTier.STANDARD.value): CODE_SPECIFIC_FIXES_STANDARD,
    (ContentType.CODE.value, FeedbackPriority.COMPREHENSIVE.value, ReviewTier.DEEP.value): CODE_COMPREHENSIVE_DEEP,

    # WRITING reviews
    (ContentType.WRITING.value, FeedbackPriority.VALIDATION.value, ReviewTier.QUICK.value): WRITING_VALIDATION_QUICK,
    (ContentType.WRITING.value, FeedbackPriority.SPECIFIC_FIXES.value, ReviewTier.STANDARD.value): WRITING_SPECIFIC_FIXES_STANDARD,
    (ContentType.WRITING.value, FeedbackPriority.COMPREHENSIVE.value, ReviewTier.DEEP.value): WRITING_COMPREHENSIVE_DEEP,

    # VIDEO reviews
    (ContentType.VIDEO.value, FeedbackPriority.VALIDATION.value, ReviewTier.QUICK.value): VIDEO_VALIDATION_QUICK,
    (ContentType.VIDEO.value, FeedbackPriority.SPECIFIC_FIXES.value, ReviewTier.STANDARD.value): VIDEO_SPECIFIC_FIXES_STANDARD,

    # ART reviews (reuse design templates)
    (ContentType.ART.value, FeedbackPriority.VALIDATION.value, ReviewTier.QUICK.value): ART_VALIDATION_QUICK,
    (ContentType.ART.value, FeedbackPriority.SPECIFIC_FIXES.value, ReviewTier.STANDARD.value): ART_SPECIFIC_FIXES_STANDARD,
    (ContentType.ART.value, FeedbackPriority.COMPREHENSIVE.value, ReviewTier.DEEP.value): ART_COMPREHENSIVE_DEEP,

    # STREAM reviews
    (ContentType.STREAM.value, FeedbackPriority.VALIDATION.value, ReviewTier.QUICK.value): STREAM_VALIDATION_QUICK,
    (ContentType.STREAM.value, FeedbackPriority.SPECIFIC_FIXES.value, ReviewTier.STANDARD.value): STREAM_SPECIFIC_FIXES_STANDARD,
}


def get_sections(
    content_type: str,
    feedback_priority: str,
    review_tier: str
) -> List[Dict]:
    """
    Get appropriate section templates based on context.
    Falls back to sensible defaults if exact match not found.

    Args:
        content_type: Type of content (design, code, writing, etc.)
        feedback_priority: Feedback focus (validation, specific_fixes, etc.)
        review_tier: Review depth (quick, standard, deep)

    Returns:
        List of section template dictionaries
    """
    # Try exact match
    key = (content_type, feedback_priority, review_tier)
    if key in SECTION_TEMPLATES:
        return [section.to_dict() for section in SECTION_TEMPLATES[key]]

    # Try without feedback priority (use default)
    key_no_priority = (content_type, FeedbackPriority.SPECIFIC_FIXES.value, review_tier)
    if key_no_priority in SECTION_TEMPLATES:
        return [section.to_dict() for section in SECTION_TEMPLATES[key_no_priority]]

    # Try without tier (default to standard)
    key_no_tier = (content_type, feedback_priority, ReviewTier.STANDARD.value)
    if key_no_tier in SECTION_TEMPLATES:
        sections = SECTION_TEMPLATES[key_no_tier]
        # Adjust min_words based on tier
        return [adjust_section_for_tier(section, review_tier) for section in sections]

    # Fallback to generic sections
    return get_generic_sections(review_tier)


def adjust_section_for_tier(section: SectionTemplate, review_tier: str) -> Dict:
    """
    Adjust word count requirements based on review tier
    """
    section_dict = section.to_dict()

    if review_tier == ReviewTier.QUICK.value:
        # Reduce word count by 40%
        section_dict["min_words"] = int(section.min_words * 0.6)
    elif review_tier == ReviewTier.DEEP.value:
        # Increase word count by 50%
        section_dict["min_words"] = int(section.min_words * 1.5)

    return section_dict


def get_generic_sections(review_tier: str) -> List[Dict]:
    """
    Fallback generic sections for any content type
    """
    if review_tier == ReviewTier.QUICK.value:
        min_words = 75
    elif review_tier == ReviewTier.DEEP.value:
        min_words = 200
    else:
        min_words = 150

    return [
        {
            "id": "overall_feedback",
            "label": "Overall Feedback",
            "prompt": "Provide your comprehensive feedback",
            "placeholder": "Share your thoughts, observations, and recommendations...",
            "required": True,
            "min_words": min_words,
            "order": 1
        },
        {
            "id": "suggestions",
            "label": "Suggestions for Improvement",
            "prompt": "What specific improvements would you recommend?",
            "placeholder": "List actionable suggestions...",
            "required": True,
            "min_words": int(min_words * 0.75),
            "order": 2
        }
    ]


def calculate_min_total_words(sections: List[Dict]) -> int:
    """
    Calculate minimum total word count across all required sections
    """
    return sum(
        section["min_words"]
        for section in sections
        if section["required"]
    )
