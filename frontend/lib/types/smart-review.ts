/**
 * TypeScript types for Smart Adaptive Review Editor
 *
 * Matches backend Pydantic schemas in app/schemas/review_slot.py
 */

// ===== Phase 1: Quick Assessment =====

export interface Phase1QuickAssessment {
  overall_rating: number; // 1-5
  primary_focus_areas: string[]; // e.g., ['functionality', 'security']
  quick_summary: string; // 50-300 chars
}

// ===== Phase 2: Rubric Ratings =====

// Rating justification - explains WHY a rating was given
export interface RatingRationale {
  strengths: string; // What earned this score
  gaps: string; // What's holding it back (why not 5?)
}

export interface Phase2RubricRatings {
  content_type: string; // 'code' | 'design' | 'writing'
  ratings: Record<string, number>; // e.g., { functionality: 5, code_quality: 4 }
  rationales?: Record<string, RatingRationale>; // Justification for each rating
}

// ===== Phase 3: Detailed Feedback =====

export interface VisualAnnotation {
  id: string; // UUID generated on client
  x: number; // X coordinate as percentage (0-100)
  y: number; // Y coordinate as percentage (0-100)
  comment: string; // Annotation comment (1-500 chars)
}

export interface VoiceMemo {
  id: string; // UUID generated on client
  duration: number; // Duration in seconds
  url?: string; // Blob URL for playback (client-side only)
  file_url?: string; // Uploaded file URL (for persistence)
}

// Structured feedback for actionable improvements
export type FeedbackPriority = 'critical' | 'important' | 'nice-to-have';

// Premium fields for expert reviews
export type EffortEstimate = 'quick-fix' | 'moderate' | 'major-refactor';
export type ConfidenceLevel = 'certain' | 'likely' | 'suggestion';
export type ImprovementCategory = 'performance' | 'ux' | 'security' | 'accessibility' | 'maintainability' | 'design' | 'content' | 'other';

export interface ResourceLink {
  url: string;
  title?: string;
}

// Common design/development principles that can be referenced
export type PrincipleCategory =
  | 'ux-heuristic' // Nielsen's heuristics, etc.
  | 'design-principle' // Gestalt, color theory, typography
  | 'coding-standard' // SOLID, DRY, clean code
  | 'accessibility' // WCAG, a11y guidelines
  | 'performance' // Core Web Vitals, optimization
  | 'security' // OWASP, security best practices
  | 'seo' // Search engine guidelines
  | 'content' // Writing frameworks, clarity
  | 'other';

// Impact types for explaining consequences
export type ImpactType =
  | 'conversion' // Affects sales/signups
  | 'usability' // Makes harder to use
  | 'trust' // Reduces credibility
  | 'performance' // Slows down experience
  | 'maintainability' // Creates tech debt
  | 'accessibility' // Excludes users
  | 'seo' // Hurts discoverability
  | 'brand' // Damages perception
  | 'other';

export interface StructuredImprovement {
  id: string;
  issue: string; // What's the problem (required, min 10 chars)
  location?: string; // Where in the work (optional but encouraged)
  suggestion: string; // Concrete fix (required, min 10 chars)
  priority: FeedbackPriority; // How urgent
  // Premium fields for expert reviews
  effort?: EffortEstimate; // How much work to implement
  confidence?: ConfidenceLevel; // How confident in this suggestion
  category?: ImprovementCategory; // Categorize the improvement
  isQuickWin?: boolean; // Flag for quick wins (high impact, low effort)
  resources?: ResourceLink[]; // Supporting links/references
  // NEW: Insight fields that transform opinions into expert guidance
  principle?: string; // What rule/heuristic is being violated (e.g., "Nielsen's visibility of system status")
  principleCategory?: PrincipleCategory; // Category of the principle
  impact?: string; // What happens if not fixed (e.g., "Users abandon at checkout due to confusion")
  impactType?: ImpactType; // Type of impact
  afterState?: string; // What it would look like if fixed (visualization)
}

export interface StructuredStrength {
  id: string;
  what: string; // What's good (required, min 10 chars)
  why?: string; // Why it works well (optional but encouraged)
  // Premium field
  impact?: string; // Business/UX impact of this strength
}

// Expert review premium sections
export interface ExecutiveSummary {
  tldr: string; // 1-3 sentence takeaway (50-200 chars)
  keyStrengths: string[]; // Top 3 bullet points
  keyActions: string[]; // Top 3 priority actions
  overallReadiness?: 'ready' | 'almost-ready' | 'needs-work' | 'major-revision'; // Overall assessment
}

export interface FollowUpOffer {
  available: boolean; // Is reviewer offering follow-up?
  type?: 'code-review' | 'design-feedback' | 'consultation' | 'pair-session' | 'other';
  description?: string; // What they're offering
  responseTime?: string; // Expected response time
}

// Top 3 Takeaways - the most critical actionable items
export interface TopTakeaway {
  issue: string; // Brief description of the issue
  fix: string; // Concrete action to take
}

export interface Phase3DetailedFeedback {
  strengths: string[]; // Legacy: simple strings (1-10 items)
  improvements: string[]; // Legacy: simple strings (1-10 items)
  structured_strengths?: StructuredStrength[]; // New: structured format
  structured_improvements?: StructuredImprovement[]; // New: structured format
  additional_notes?: string; // Optional, up to 5000 chars
  visual_annotations?: VisualAnnotation[]; // Optional visual annotations for design/art (max 20)
  voice_memo?: VoiceMemo; // Optional voice memo
  // Required: Top 3 Takeaways (the TL;DR checklist)
  top_takeaways?: TopTakeaway[]; // 3 most important action items
  // Premium expert review sections
  executive_summary?: ExecutiveSummary; // TL;DR for busy creators
  follow_up_offer?: FollowUpOffer; // Continued support offer
}

// ===== Quality Metrics =====

export interface QualityMetrics {
  completeness_score: number; // 0-100
  estimated_tone: 'professional' | 'casual' | 'critical' | 'encouraging';
  clarity_score: number; // 0-100
  actionability_score: number; // 0-100
}

// ===== Metadata =====

export interface SmartReviewMetadata {
  version: string; // "1.0"
  created_at: string; // ISO date string
  last_updated_at: string; // ISO date string
  time_spent_seconds: number;
  phases_completed: string[]; // ['phase1', 'phase2', 'phase3']
}

// ===== Complete Smart Review Draft =====

export interface SmartReviewDraft {
  phase1_quick_assessment?: Phase1QuickAssessment;
  phase2_rubric?: Phase2RubricRatings;
  phase3_detailed_feedback?: Phase3DetailedFeedback;
  quality_metrics?: QualityMetrics;
  metadata?: SmartReviewMetadata;
}

// ===== Submit Payload =====

export interface SmartReviewSubmit {
  smart_review: SmartReviewDraft;
  attachments?: Array<{
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

// ===== Rubric Configuration (from backend) =====

export interface FocusArea {
  id: string;
  label: string;
  description: string;
}

export interface RatingDimension {
  id: string;
  label: string;
  description: string;
  criteria: string[];
}

export interface SectionPrompt {
  id: string;
  label: string;
  prompt: string;
  placeholder: string;
  required: boolean;
  min_items: number;
}

export interface ContentRubric {
  content_type: string;
  focus_areas: FocusArea[];
  rating_dimensions: RatingDimension[];
  section_prompts: Record<string, SectionPrompt>;
}

// ===== UI State Types =====

export type PhaseNumber = 1 | 2 | 3;

export interface PhaseValidation {
  isValid: boolean;
  errors: string[];
}

export interface ReviewEditorState {
  currentPhase: PhaseNumber;
  draft: SmartReviewDraft;
  rubric: ContentRubric | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  qualityMetrics: QualityMetrics | null;
}

// ===== Helper Types =====

export interface PhaseConfig {
  number: PhaseNumber;
  title: string;
  description: string;
  required: boolean;
}

export const PHASE_CONFIGS: Record<PhaseNumber, PhaseConfig> = {
  1: {
    number: 1,
    title: 'Quick Assessment',
    description: 'Overall rating and focus areas',
    required: true,
  },
  2: {
    number: 2,
    title: 'Detailed Ratings',
    description: 'Rate specific dimensions',
    required: true,
  },
  3: {
    number: 3,
    title: 'Detailed Feedback',
    description: 'Strengths and improvements',
    required: false,
  },
};
