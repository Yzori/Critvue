/**
 * Review Suggestions - Tap-to-Suggest Smart Entry Aids
 *
 * Context-aware suggestion chips for reducing typing burden on mobile devices.
 * Suggestions are filtered based on:
 * - Content type (photography, design, writing, etc.)
 * - Focus areas selected in Phase 1
 * - Field type (strengths vs improvements)
 */

export interface Suggestion {
  id: string;
  text: string;
  category: "strength" | "improvement";
  focusAreas?: string[]; // Which focus areas this applies to (optional filter)
  contentTypes?: string[]; // Which content types this applies to (optional filter)
}

// ===== PHOTOGRAPHY REVIEW SUGGESTIONS =====

const PHOTOGRAPHY_STRENGTHS: Suggestion[] = [
  {
    id: "photo-s-1",
    text: "Excellent composition and framing",
    category: "strength",
    contentTypes: ["photography"],
    focusAreas: ["composition", "visual_design"],
  },
  {
    id: "photo-s-2",
    text: "Beautiful use of natural light",
    category: "strength",
    contentTypes: ["photography"],
    focusAreas: ["lighting", "technical"],
  },
  {
    id: "photo-s-3",
    text: "Strong subject focus and depth of field",
    category: "strength",
    contentTypes: ["photography"],
    focusAreas: ["technical", "composition"],
  },
  {
    id: "photo-s-4",
    text: "Effective color grading and tones",
    category: "strength",
    contentTypes: ["photography"],
    focusAreas: ["editing", "visual_design"],
  },
  {
    id: "photo-s-5",
    text: "Compelling storytelling through imagery",
    category: "strength",
    contentTypes: ["photography"],
    focusAreas: ["storytelling", "engagement"],
  },
  {
    id: "photo-s-6",
    text: "Sharp focus and clarity",
    category: "strength",
    contentTypes: ["photography"],
    focusAreas: ["technical", "quality"],
  },
  {
    id: "photo-s-7",
    text: "Creative perspective and angles",
    category: "strength",
    contentTypes: ["photography"],
    focusAreas: ["composition", "creativity"],
  },
];

const PHOTOGRAPHY_IMPROVEMENTS: Suggestion[] = [
  {
    id: "photo-i-1",
    text: "Consider rule of thirds for stronger composition",
    category: "improvement",
    contentTypes: ["photography"],
    focusAreas: ["composition", "visual_design"],
  },
  {
    id: "photo-i-2",
    text: "Adjust exposure for better highlight/shadow balance",
    category: "improvement",
    contentTypes: ["photography"],
    focusAreas: ["technical", "editing"],
  },
  {
    id: "photo-i-3",
    text: "Try different angles to add visual interest",
    category: "improvement",
    contentTypes: ["photography"],
    focusAreas: ["composition", "creativity"],
  },
  {
    id: "photo-i-4",
    text: "Reduce distracting background elements",
    category: "improvement",
    contentTypes: ["photography"],
    focusAreas: ["composition", "visual_design"],
  },
  {
    id: "photo-i-5",
    text: "Experiment with different lighting setups",
    category: "improvement",
    contentTypes: ["photography"],
    focusAreas: ["lighting", "technical"],
  },
  {
    id: "photo-i-6",
    text: "Fine-tune white balance for accurate colors",
    category: "improvement",
    contentTypes: ["photography"],
    focusAreas: ["editing", "technical"],
  },
  {
    id: "photo-i-7",
    text: "Consider cropping to strengthen the focal point",
    category: "improvement",
    contentTypes: ["photography"],
    focusAreas: ["composition", "editing"],
  },
];

// ===== DESIGN REVIEW SUGGESTIONS =====

const DESIGN_STRENGTHS: Suggestion[] = [
  {
    id: "design-s-1",
    text: "Strong visual hierarchy",
    category: "strength",
    contentTypes: ["design", "art"],
    focusAreas: ["visual_design", "usability"],
  },
  {
    id: "design-s-2",
    text: "Excellent color contrast",
    category: "strength",
    contentTypes: ["design", "art"],
    focusAreas: ["accessibility", "visual_design"],
  },
  {
    id: "design-s-3",
    text: "Consistent spacing throughout",
    category: "strength",
    contentTypes: ["design"],
    focusAreas: ["visual_design", "consistency"],
  },
  {
    id: "design-s-4",
    text: "Clear call-to-action buttons",
    category: "strength",
    contentTypes: ["design"],
    focusAreas: ["usability", "visual_design"],
  },
  {
    id: "design-s-5",
    text: "Effective use of whitespace",
    category: "strength",
    contentTypes: ["design", "art"],
    focusAreas: ["visual_design", "readability"],
  },
  {
    id: "design-s-6",
    text: "Mobile-responsive layout",
    category: "strength",
    contentTypes: ["design"],
    focusAreas: ["responsive_design", "usability"],
  },
  {
    id: "design-s-7",
    text: "Strong brand consistency",
    category: "strength",
    contentTypes: ["design"],
    focusAreas: ["branding", "consistency"],
  },
];

const DESIGN_IMPROVEMENTS: Suggestion[] = [
  {
    id: "design-i-1",
    text: "Increase touch target sizes to 44px minimum",
    category: "improvement",
    contentTypes: ["design"],
    focusAreas: ["accessibility", "mobile_ux"],
  },
  {
    id: "design-i-2",
    text: "Improve mobile responsiveness",
    category: "improvement",
    contentTypes: ["design"],
    focusAreas: ["responsive_design", "mobile_ux"],
  },
  {
    id: "design-i-3",
    text: "Add focus states for accessibility",
    category: "improvement",
    contentTypes: ["design"],
    focusAreas: ["accessibility", "usability"],
  },
  {
    id: "design-i-4",
    text: "Increase text contrast for readability",
    category: "improvement",
    contentTypes: ["design"],
    focusAreas: ["accessibility", "visual_design"],
  },
  {
    id: "design-i-5",
    text: "Align with brand guidelines",
    category: "improvement",
    contentTypes: ["design"],
    focusAreas: ["branding", "consistency"],
  },
  {
    id: "design-i-6",
    text: "Improve spacing consistency",
    category: "improvement",
    contentTypes: ["design"],
    focusAreas: ["visual_design", "consistency"],
  },
  {
    id: "design-i-7",
    text: "Simplify complex interactions",
    category: "improvement",
    contentTypes: ["design"],
    focusAreas: ["usability", "simplicity"],
  },
];

// ===== WRITING REVIEW SUGGESTIONS =====

const WRITING_STRENGTHS: Suggestion[] = [
  {
    id: "writing-s-1",
    text: "Clear and concise writing",
    category: "strength",
    contentTypes: ["writing"],
    focusAreas: ["clarity", "readability"],
  },
  {
    id: "writing-s-2",
    text: "Well-structured arguments",
    category: "strength",
    contentTypes: ["writing"],
    focusAreas: ["structure", "logic"],
  },
  {
    id: "writing-s-3",
    text: "Engaging introduction",
    category: "strength",
    contentTypes: ["writing"],
    focusAreas: ["engagement", "structure"],
  },
  {
    id: "writing-s-4",
    text: "Strong supporting evidence",
    category: "strength",
    contentTypes: ["writing"],
    focusAreas: ["evidence", "logic"],
  },
  {
    id: "writing-s-5",
    text: "Effective transitions between sections",
    category: "strength",
    contentTypes: ["writing"],
    focusAreas: ["flow", "structure"],
  },
  {
    id: "writing-s-6",
    text: "Consistent tone and voice",
    category: "strength",
    contentTypes: ["writing"],
    focusAreas: ["tone", "consistency"],
  },
  {
    id: "writing-s-7",
    text: "Strong vocabulary and word choice",
    category: "strength",
    contentTypes: ["writing"],
    focusAreas: ["language", "clarity"],
  },
];

const WRITING_IMPROVEMENTS: Suggestion[] = [
  {
    id: "writing-i-1",
    text: "Vary sentence structure for better flow",
    category: "improvement",
    contentTypes: ["writing"],
    focusAreas: ["flow", "readability"],
  },
  {
    id: "writing-i-2",
    text: "Clarify complex concepts with examples",
    category: "improvement",
    contentTypes: ["writing"],
    focusAreas: ["clarity", "examples"],
  },
  {
    id: "writing-i-3",
    text: "Add concrete examples to support points",
    category: "improvement",
    contentTypes: ["writing"],
    focusAreas: ["examples", "evidence"],
  },
  {
    id: "writing-i-4",
    text: "Improve paragraph flow and transitions",
    category: "improvement",
    contentTypes: ["writing"],
    focusAreas: ["flow", "structure"],
  },
  {
    id: "writing-i-5",
    text: "Strengthen conclusion with clear takeaways",
    category: "improvement",
    contentTypes: ["writing"],
    focusAreas: ["structure", "impact"],
  },
  {
    id: "writing-i-6",
    text: "Remove redundant phrases",
    category: "improvement",
    contentTypes: ["writing"],
    focusAreas: ["clarity", "conciseness"],
  },
  {
    id: "writing-i-7",
    text: "Maintain consistent tone throughout",
    category: "improvement",
    contentTypes: ["writing"],
    focusAreas: ["tone", "consistency"],
  },
];

// ===== VIDEO/AUDIO REVIEW SUGGESTIONS =====

const MEDIA_STRENGTHS: Suggestion[] = [
  {
    id: "media-s-1",
    text: "Clear audio quality",
    category: "strength",
    contentTypes: ["video", "audio"],
    focusAreas: ["audio_quality", "technical"],
  },
  {
    id: "media-s-2",
    text: "Good pacing and timing",
    category: "strength",
    contentTypes: ["video", "audio"],
    focusAreas: ["pacing", "engagement"],
  },
  {
    id: "media-s-3",
    text: "Engaging presentation style",
    category: "strength",
    contentTypes: ["video", "audio"],
    focusAreas: ["engagement", "delivery"],
  },
  {
    id: "media-s-4",
    text: "Professional editing",
    category: "strength",
    contentTypes: ["video", "audio"],
    focusAreas: ["editing", "production"],
  },
  {
    id: "media-s-5",
    text: "Clear visual elements",
    category: "strength",
    contentTypes: ["video"],
    focusAreas: ["visual_quality", "clarity"],
  },
];

const MEDIA_IMPROVEMENTS: Suggestion[] = [
  {
    id: "media-i-1",
    text: "Improve audio clarity and reduce background noise",
    category: "improvement",
    contentTypes: ["video", "audio"],
    focusAreas: ["audio_quality", "technical"],
  },
  {
    id: "media-i-2",
    text: "Add captions for accessibility",
    category: "improvement",
    contentTypes: ["video"],
    focusAreas: ["accessibility", "inclusivity"],
  },
  {
    id: "media-i-3",
    text: "Improve pacing in slower sections",
    category: "improvement",
    contentTypes: ["video", "audio"],
    focusAreas: ["pacing", "engagement"],
  },
  {
    id: "media-i-4",
    text: "Add visual aids to support key points",
    category: "improvement",
    contentTypes: ["video"],
    focusAreas: ["visual_quality", "clarity"],
  },
  {
    id: "media-i-5",
    text: "Smooth out transitions between sections",
    category: "improvement",
    contentTypes: ["video", "audio"],
    focusAreas: ["editing", "flow"],
  },
];

// ===== GENERIC SUGGESTIONS (fallback) =====

const GENERIC_STRENGTHS: Suggestion[] = [
  {
    id: "generic-s-1",
    text: "Strong attention to detail",
    category: "strength",
  },
  {
    id: "generic-s-2",
    text: "Clear communication of ideas",
    category: "strength",
  },
  {
    id: "generic-s-3",
    text: "Good overall quality",
    category: "strength",
  },
  {
    id: "generic-s-4",
    text: "Effective use of examples",
    category: "strength",
  },
];

const GENERIC_IMPROVEMENTS: Suggestion[] = [
  {
    id: "generic-i-1",
    text: "Add more specific details",
    category: "improvement",
  },
  {
    id: "generic-i-2",
    text: "Consider alternative approaches",
    category: "improvement",
  },
  {
    id: "generic-i-3",
    text: "Improve clarity and organization",
    category: "improvement",
  },
  {
    id: "generic-i-4",
    text: "Add supporting examples",
    category: "improvement",
  },
];

// ===== SUGGESTION FILTERING FUNCTIONS =====

/**
 * Get filtered suggestions based on content type, focus areas, and category
 */
export function getSuggestions(
  category: "strength" | "improvement",
  contentType?: string,
  selectedFocusAreas?: string[]
): Suggestion[] {
  let allSuggestions: Suggestion[] = [];

  // 1. Select suggestions based on content type
  if (contentType === "photography") {
    allSuggestions = category === "strength" ? PHOTOGRAPHY_STRENGTHS : PHOTOGRAPHY_IMPROVEMENTS;
  } else if (contentType === "design" || contentType === "art") {
    allSuggestions = category === "strength" ? DESIGN_STRENGTHS : DESIGN_IMPROVEMENTS;
  } else if (contentType === "writing") {
    allSuggestions = category === "strength" ? WRITING_STRENGTHS : WRITING_IMPROVEMENTS;
  } else if (contentType === "video" || contentType === "audio") {
    allSuggestions = category === "strength" ? MEDIA_STRENGTHS : MEDIA_IMPROVEMENTS;
  } else {
    // Fallback to generic suggestions
    allSuggestions = category === "strength" ? GENERIC_STRENGTHS : GENERIC_IMPROVEMENTS;
  }

  // 2. Filter by focus areas if provided
  if (selectedFocusAreas && selectedFocusAreas.length > 0) {
    const prioritized: Suggestion[] = [];
    const others: Suggestion[] = [];

    allSuggestions.forEach((suggestion) => {
      if (suggestion.focusAreas) {
        // Check if any of the suggestion's focus areas match selected ones
        const hasMatch = suggestion.focusAreas.some((area) =>
          selectedFocusAreas.includes(area)
        );
        if (hasMatch) {
          prioritized.push(suggestion);
        } else {
          others.push(suggestion);
        }
      } else {
        others.push(suggestion);
      }
    });

    // Return prioritized first, then others
    return [...prioritized, ...others];
  }

  return allSuggestions;
}

/**
 * Get top N suggestions for display
 */
export function getTopSuggestions(
  category: "strength" | "improvement",
  contentType?: string,
  selectedFocusAreas?: string[],
  limit: number = 5
): Suggestion[] {
  const suggestions = getSuggestions(category, contentType, selectedFocusAreas);
  return suggestions.slice(0, limit);
}
