/**
 * Data Converter Utilities
 *
 * Converts between legacy SmartReviewDraft format and ReviewStudioState.
 * Ensures backward compatibility with existing saved drafts.
 */

import {
  SmartReviewDraft,
} from "@/lib/types/smart-review";

import {
  ReviewStudioState,
  IssueCard,
  StrengthCard,
  VerdictCard,
  StudioAnnotation,
  createEmptyVerdictCard,
} from "@/lib/types/review-studio";

/**
 * Convert SmartReviewDraft to ReviewStudioState
 * Used when loading an existing draft
 */
export function draftToStudioState(
  draft: SmartReviewDraft,
  slotId: number,
  contentType: string
): Partial<ReviewStudioState> {
  const phase1 = draft.phase1_quick_assessment;
  const phase2 = draft.phase2_rubric;
  const phase3 = draft.phase3_detailed_feedback;
  const metadata = draft.metadata;

  // Convert structured improvements to issue cards
  const issueCards: IssueCard[] = (phase3?.structured_improvements || []).map(
    (imp, index) => ({
      id: imp.id || `issue-${Date.now()}-${index}`,
      type: "issue" as const,
      order: index,
      createdAt: metadata?.created_at || new Date().toISOString(),
      updatedAt: metadata?.last_updated_at,
      category: imp.category || "other",
      issue: imp.issue || "",
      whyItMatters: imp.impact,
      fix: imp.suggestion || "",
      location: imp.location,
      priority: imp.priority || "important",
      severity: "major", // Default - severity is new field
      confidence: imp.confidence || "likely",
      effort: imp.effort,
      isQuickWin: imp.isQuickWin,
      principle: imp.principle,
      principleCategory: imp.principleCategory,
      impactType: imp.impactType,
      afterState: imp.afterState,
      resources: imp.resources,
      isExpanded: false,
      isEditing: false,
    })
  );

  // If no structured improvements, try to convert legacy improvements array
  if (issueCards.length === 0 && phase3?.improvements) {
    phase3.improvements.forEach((text, index) => {
      if (text.trim()) {
        issueCards.push({
          id: `issue-legacy-${Date.now()}-${index}`,
          type: "issue",
          order: index,
          createdAt: metadata?.created_at || new Date().toISOString(),
          category: "other",
          issue: text,
          fix: "",
          priority: "important",
          severity: "major",
          confidence: "likely",
          isExpanded: false,
          isEditing: false,
        });
      }
    });
  }

  // Convert structured strengths to strength cards
  const strengthCards: StrengthCard[] = (phase3?.structured_strengths || []).map(
    (str, index) => ({
      id: str.id || `strength-${Date.now()}-${index}`,
      type: "strength" as const,
      order: index,
      createdAt: metadata?.created_at || new Date().toISOString(),
      what: str.what || "",
      why: str.why,
      impact: str.impact,
      isExpanded: false,
      isEditing: false,
    })
  );

  // If no structured strengths, try to convert legacy strengths array
  if (strengthCards.length === 0 && phase3?.strengths) {
    phase3.strengths.forEach((text, index) => {
      if (text.trim()) {
        strengthCards.push({
          id: `strength-legacy-${Date.now()}-${index}`,
          type: "strength",
          order: index,
          createdAt: metadata?.created_at || new Date().toISOString(),
          what: text,
          isExpanded: false,
          isEditing: false,
        });
      }
    });
  }

  // Convert visual annotations
  const annotations: StudioAnnotation[] = (phase3?.visual_annotations || []).map(
    (ann, index) => ({
      id: ann.id || `ann-${Date.now()}-${index}`,
      type: "pin" as const,
      x: ann.x,
      y: ann.y,
      comment: ann.comment,
      number: index + 1,
    })
  );

  // Build verdict card from phase1 + phase3 data (always create one)
  const verdictCard: VerdictCard = {
    id: "verdict",
    type: "verdict",
    order: 0,
    createdAt: metadata?.created_at || new Date().toISOString(),
    rating: phase1?.overall_rating || 0,
    summary: phase1?.quick_summary || "",
    topTakeaways: phase3?.top_takeaways || [
      { issue: "", fix: "" },
      { issue: "", fix: "" },
      { issue: "", fix: "" },
    ],
    executiveSummary: phase3?.executive_summary,
    followUpOffer: phase3?.follow_up_offer,
  };

  return {
    slotId,
    contentType,
    issueCards,
    strengthCards,
    verdictCard,
    annotations,
    focusAreas: phase1?.primary_focus_areas || [],
    rubricRatings: phase2?.ratings || {},
    rubricRationales: phase2?.rationales,
    timeSpentSeconds: metadata?.time_spent_seconds || 0,
    selectionMode: "normal",
    activeCardId: null,
    editingCardId: null,
    activeDeckTab: "issues",
    isSaving: false,
    lastSavedAt: metadata?.last_updated_at ? new Date(metadata.last_updated_at) : null,
    saveError: null,
  };
}

/**
 * Check if draft is in legacy format (pre-Review Studio)
 */
export function isLegacyDraft(draft: SmartReviewDraft): boolean {
  // If metadata version is 2.0+, it's Review Studio format
  if (draft.metadata?.version?.startsWith("2")) {
    return false;
  }

  // If it has structured improvements/strengths, it's newer format
  const phase3 = draft.phase3_detailed_feedback;
  if (
    (phase3?.structured_improvements?.length ?? 0) > 0 ||
    (phase3?.structured_strengths?.length ?? 0) > 0
  ) {
    return false;
  }

  return true;
}

/**
 * Create initial state for a new review
 */
export function createInitialState(
  slotId: number,
  contentType: string
): ReviewStudioState {
  return {
    slotId,
    contentType,
    selectionMode: "normal",
    activeCardId: null,
    editingCardId: null,
    issueCards: [],
    strengthCards: [],
    verdictCard: createEmptyVerdictCard(),
    annotations: [],
    focusAreas: [],
    rubricRatings: {},
    rubricRationales: undefined,
    activeDeckTab: "issues",
    isSaving: false,
    lastSavedAt: null,
    saveError: null,
    timeSpentSeconds: 0,
  };
}
