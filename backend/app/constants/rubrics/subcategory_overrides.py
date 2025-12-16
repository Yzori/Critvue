"""
Subcategory-Specific Rubric Overrides

Subcategory rating dimensions that add to or override base rubric dimensions.
Format: {content_type: {subcategory_id: [additional_rating_dimensions]}}
"""

from typing import Dict, List
from .types import RatingDimension


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
                    "44x44px minimum touch targets",
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
