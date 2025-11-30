/**
 * Review Studio Types
 *
 * Types for the modular card-based review workspace.
 * These extend the existing smart-review types for backward compatibility.
 */

import {
  FeedbackPriority,
  EffortEstimate,
  ConfidenceLevel,
  ImprovementCategory,
  PrincipleCategory,
  ImpactType,
  ResourceLink,
  TopTakeaway,
  ExecutiveSummary,
  FollowUpOffer,
} from "./smart-review";

// ===== Card Severity (new field) =====

export type CardSeverity = "critical" | "major" | "minor" | "suggestion";

// ===== Base Card Type =====

export interface BaseCard {
  id: string;
  type: "issue" | "strength" | "verdict";
  order: number;
  createdAt: string;
  updatedAt?: string;
}

// ===== Issue Card =====

export interface IssueCard extends BaseCard {
  type: "issue";
  // Core fields
  category: ImprovementCategory;
  issue: string; // What's wrong
  whyItMatters?: string; // Impact explanation (renamed from 'impact' for clarity)
  fix: string; // Concrete suggestion
  location?: string; // Where in the work

  // Classification
  priority: FeedbackPriority;
  severity: CardSeverity;
  confidence: ConfidenceLevel;
  effort?: EffortEstimate;
  isQuickWin?: boolean;

  // Expert insight
  principle?: string; // Design principle violated
  principleCategory?: PrincipleCategory;
  impactType?: ImpactType;
  afterState?: string; // What it would look like if fixed

  // Resources
  resources?: ResourceLink[];

  // Linking
  annotationIds?: string[]; // Links to annotations on content

  // UI state
  isExpanded?: boolean;
  isEditing?: boolean;
}

// ===== Strength Card =====

export interface StrengthCard extends BaseCard {
  type: "strength";
  what: string; // What's working well
  why?: string; // Why it works
  impact?: string; // Business/UX impact

  // UI state
  isExpanded?: boolean;
  isEditing?: boolean;
}

// ===== Verdict Card =====

export interface VerdictCard extends BaseCard {
  type: "verdict";
  id: "verdict";
  rating: number; // 1-5 stars
  summary: string; // 50-300 chars
  topTakeaways: TopTakeaway[]; // 3 action items
  executiveSummary?: ExecutiveSummary;
  followUpOffer?: FollowUpOffer;
}

// ===== Annotations =====

export type AnnotationType = "pin" | "highlight" | "region" | "timestamp";

export interface StudioAnnotation {
  id: string;
  type: AnnotationType;

  // For pins (point on image)
  x?: number; // 0-100 percentage
  y?: number; // 0-100 percentage

  // For highlights (text selection)
  startOffset?: number;
  endOffset?: number;
  selectedText?: string;

  // For regions (bounding box)
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // For timestamps (video annotations)
  timestamp?: number; // Seconds into the video
  timestampEnd?: number; // Optional end time for ranges

  // Linking to cards
  linkedCardId?: string;

  // Comment (legacy support)
  comment?: string;

  // Visual styling
  color?: string;
  number?: number; // Display number (1, 2, 3...)
}

// ===== Review Studio State =====

export interface ReviewStudioState {
  // Mode
  selectionMode: "normal" | "annotate";
  activeCardId: string | null;
  editingCardId: string | null;

  // Card decks
  issueCards: IssueCard[];
  strengthCards: StrengthCard[];
  verdictCard: VerdictCard | null;

  // Annotations
  annotations: StudioAnnotation[];

  // From Phase 1 & 2 (preserved for compatibility)
  focusAreas: string[];
  rubricRatings: Record<string, number>;
  rubricRationales?: Record<string, { strengths: string; gaps: string }>;
  contentType: string;

  // UI State
  activeDeckTab: "issues" | "strengths";
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;

  // Metadata
  slotId: number;
  timeSpentSeconds: number;

  // Format markers (added by backend)
  _format?: "studio";
  _version?: string;
  _submitted_at?: string;
}

// ===== Actions =====

export type ReviewStudioAction =
  // Card CRUD
  | { type: "ADD_ISSUE_CARD"; payload?: Partial<IssueCard> }
  | { type: "ADD_STRENGTH_CARD"; payload?: Partial<StrengthCard> }
  | {
      type: "UPDATE_CARD";
      payload: { id: string; updates: Partial<IssueCard | StrengthCard> };
    }
  | { type: "DELETE_CARD"; payload: { id: string; cardType: "issue" | "strength" } }
  | {
      type: "REORDER_CARDS";
      payload: { cardType: "issue" | "strength"; oldIndex: number; newIndex: number };
    }

  // Card UI
  | { type: "SET_ACTIVE_CARD"; payload: string | null }
  | { type: "SET_EDITING_CARD"; payload: string | null }
  | { type: "TOGGLE_CARD_EXPANDED"; payload: string }

  // Annotations
  | { type: "ADD_ANNOTATION"; payload: Omit<StudioAnnotation, "id" | "number"> }
  | { type: "UPDATE_ANNOTATION"; payload: { id: string; updates: Partial<StudioAnnotation> } }
  | { type: "DELETE_ANNOTATION"; payload: string }
  | { type: "LINK_ANNOTATION_TO_CARD"; payload: { annotationId: string; cardId: string } }
  | { type: "UNLINK_ANNOTATION"; payload: string }

  // Selection mode
  | { type: "SET_SELECTION_MODE"; payload: "normal" | "annotate" }

  // Verdict
  | { type: "UPDATE_VERDICT"; payload: Partial<VerdictCard> }

  // Phase 1 & 2 data
  | { type: "SET_FOCUS_AREAS"; payload: string[] }
  | { type: "SET_RUBRIC_RATINGS"; payload: Record<string, number> }
  | {
      type: "SET_RUBRIC_RATIONALES";
      payload: Record<string, { strengths: string; gaps: string }>;
    }

  // UI State
  | { type: "SET_ACTIVE_DECK_TAB"; payload: "issues" | "strengths" }

  // Save status
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_LAST_SAVED"; payload: Date }
  | { type: "SET_SAVE_ERROR"; payload: string | null }

  // Bulk load
  | { type: "LOAD_STATE"; payload: Partial<ReviewStudioState> }
  | { type: "RESET_STATE" };

// ===== Context Value =====

export interface ReviewStudioContextValue {
  state: ReviewStudioState;
  dispatch: React.Dispatch<ReviewStudioAction>;

  // Convenience actions
  addIssueCard: (initial?: Partial<IssueCard>) => void;
  addStrengthCard: (initial?: Partial<StrengthCard>) => void;
  updateCard: (id: string, updates: Partial<IssueCard | StrengthCard>) => void;
  deleteCard: (id: string, cardType: "issue" | "strength") => void;
  reorderCards: (
    cardType: "issue" | "strength",
    oldIndex: number,
    newIndex: number
  ) => void;

  // Annotation helpers
  addAnnotation: (annotation: Omit<StudioAnnotation, "id" | "number">) => void;
  linkAnnotationToCard: (annotationId: string, cardId: string) => void;
  createCardFromAnnotation: (
    type: "issue" | "strength",
    annotation: StudioAnnotation
  ) => void;

  // Verdict helpers
  updateVerdict: (updates: Partial<VerdictCard>) => void;

  // Selection mode
  toggleSelectionMode: () => void;

  // Persistence
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  submitReview: () => Promise<void>;

  // Validation
  isReadyToSubmit: () => boolean;
  getValidationErrors: () => string[];
}

// ===== Props for ReviewStudio =====

export interface ReviewStudioProps {
  slotId: number;
  contentType: string;
  contentSubcategory?: string | null;
  imageUrl?: string;
  onSubmitSuccess?: () => void;
  className?: string;
}

// ===== Card Templates =====

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  category: ImprovementCategory;
  priority: FeedbackPriority;
  issueTemplate: string;
  fixTemplate: string;
  principleTemplate?: string;
  principleCategory?: PrincipleCategory;
}

// ===== Quick Win Detection =====

export function isQuickWin(card: IssueCard): boolean {
  // High priority + low effort = quick win
  return (
    (card.priority === "critical" || card.priority === "important") &&
    card.effort === "quick-fix"
  );
}

// ===== Card Helpers =====

export function createEmptyIssueCard(order: number): IssueCard {
  return {
    id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: "issue",
    order,
    createdAt: new Date().toISOString(),
    category: "other",
    issue: "",
    fix: "",
    priority: "important",
    severity: "major",
    confidence: "likely",
    isExpanded: true,
    isEditing: true,
  };
}

export function createEmptyStrengthCard(order: number): StrengthCard {
  return {
    id: `strength-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: "strength",
    order,
    createdAt: new Date().toISOString(),
    what: "",
    isExpanded: true,
    isEditing: true,
  };
}

export function createEmptyVerdictCard(): VerdictCard {
  return {
    id: "verdict",
    type: "verdict",
    order: 0,
    createdAt: new Date().toISOString(),
    rating: 0,
    summary: "",
    topTakeaways: [
      { issue: "", fix: "" },
      { issue: "", fix: "" },
      { issue: "", fix: "" },
    ],
  };
}

// ===== Validation Helpers =====

export function isIssueCardComplete(card: IssueCard): boolean {
  return card.issue.trim().length >= 10 && card.fix.trim().length >= 10;
}

export function isStrengthCardComplete(card: StrengthCard): boolean {
  return card.what.trim().length >= 10;
}

export function isVerdictComplete(verdict: VerdictCard | null): boolean {
  if (!verdict) return false;
  const hasRating = verdict.rating >= 1 && verdict.rating <= 5;
  const hasSummary =
    verdict.summary.trim().length >= 50 && verdict.summary.trim().length <= 300;
  const hasTakeaways = verdict.topTakeaways.every(
    (t) => t.issue.trim().length >= 5 && t.fix.trim().length >= 5
  );
  return hasRating && hasSummary && hasTakeaways;
}
