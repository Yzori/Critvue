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

export interface Phase2RubricRatings {
  content_type: string; // 'code' | 'design' | 'writing'
  ratings: Record<string, number>; // e.g., { functionality: 5, code_quality: 4 }
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

export interface StructuredImprovement {
  id: string;
  issue: string; // What's the problem (required, min 10 chars)
  location?: string; // Where in the work (optional but encouraged)
  suggestion: string; // Concrete fix (required, min 10 chars)
  priority: FeedbackPriority; // How urgent
}

export interface StructuredStrength {
  id: string;
  what: string; // What's good (required, min 10 chars)
  why?: string; // Why it works well (optional but encouraged)
}

export interface Phase3DetailedFeedback {
  strengths: string[]; // Legacy: simple strings (1-10 items)
  improvements: string[]; // Legacy: simple strings (1-10 items)
  structured_strengths?: StructuredStrength[]; // New: structured format
  structured_improvements?: StructuredImprovement[]; // New: structured format
  additional_notes?: string; // Optional, up to 5000 chars
  visual_annotations?: VisualAnnotation[]; // Optional visual annotations for design/art (max 20)
  voice_memo?: VoiceMemo; // Optional voice memo
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
