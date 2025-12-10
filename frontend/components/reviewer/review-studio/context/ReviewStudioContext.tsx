/**
 * Review Studio Context
 *
 * Central state management for the Review Studio using React Context + useReducer.
 * Handles card operations, annotations, and persistence.
 */

"use client";

import * as React from "react";
import { arrayMove } from "@dnd-kit/sortable";

import type {
  ReviewStudioState,
  ReviewStudioAction,
  ReviewStudioContextValue,
  IssueCard,
  StrengthCard,
  VerdictCard,
  StudioAnnotation,
} from "@/lib/types/review-studio";

import {
  createEmptyIssueCard,
  createEmptyStrengthCard,
  createEmptyVerdictCard,
  isIssueCardComplete,
  isStrengthCardComplete,
  isVerdictComplete,
} from "@/lib/types/review-studio";

import { createInitialState, draftToStudioState } from "../utils/data-converter";

import { generateAnnotationId, getNextAnnotationNumber } from "../utils/card-helpers";

import {
  saveStudioDraft,
  getStudioDraft,
  submitStudioReview,
} from "@/lib/api/smart-review";
import { ApiClientError } from "@/lib/api/client";

// ===== Context =====

const ReviewStudioContext = React.createContext<ReviewStudioContextValue | null>(null);

// ===== Reducer =====

function reducer(state: ReviewStudioState, action: ReviewStudioAction): ReviewStudioState {
  switch (action.type) {
    // ===== Card CRUD =====
    case "ADD_ISSUE_CARD": {
      const newCard = createEmptyIssueCard(state.issueCards.length);
      return {
        ...state,
        issueCards: [...state.issueCards, { ...newCard, ...action.payload }],
        activeCardId: newCard.id,
        editingCardId: newCard.id,
        activeDeckTab: "issues",
      };
    }

    case "ADD_STRENGTH_CARD": {
      const newCard = createEmptyStrengthCard(state.strengthCards.length);
      return {
        ...state,
        strengthCards: [...state.strengthCards, { ...newCard, ...action.payload }],
        activeCardId: newCard.id,
        editingCardId: newCard.id,
        activeDeckTab: "strengths",
      };
    }

    case "UPDATE_CARD": {
      const { id, updates } = action.payload;

      // Check if it's an issue card
      const issueIndex = state.issueCards.findIndex((c) => c.id === id);
      if (issueIndex !== -1) {
        const updatedCards = [...state.issueCards];
        updatedCards[issueIndex] = {
          ...updatedCards[issueIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        } as IssueCard;
        return { ...state, issueCards: updatedCards };
      }

      // Check if it's a strength card
      const strengthIndex = state.strengthCards.findIndex((c) => c.id === id);
      if (strengthIndex !== -1) {
        const updatedCards = [...state.strengthCards];
        updatedCards[strengthIndex] = {
          ...updatedCards[strengthIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        } as StrengthCard;
        return { ...state, strengthCards: updatedCards };
      }

      return state;
    }

    case "DELETE_CARD": {
      const { id, cardType } = action.payload;
      if (cardType === "issue") {
        const filtered = state.issueCards
          .filter((c) => c.id !== id)
          .map((c, i) => ({ ...c, order: i }));
        return {
          ...state,
          issueCards: filtered,
          activeCardId: state.activeCardId === id ? null : state.activeCardId,
          editingCardId: state.editingCardId === id ? null : state.editingCardId,
        };
      } else {
        const filtered = state.strengthCards
          .filter((c) => c.id !== id)
          .map((c, i) => ({ ...c, order: i }));
        return {
          ...state,
          strengthCards: filtered,
          activeCardId: state.activeCardId === id ? null : state.activeCardId,
          editingCardId: state.editingCardId === id ? null : state.editingCardId,
        };
      }
    }

    case "REORDER_CARDS": {
      const { cardType, oldIndex, newIndex } = action.payload;
      if (cardType === "issue") {
        const reordered = arrayMove(state.issueCards, oldIndex, newIndex).map(
          (c, i) => ({ ...c, order: i })
        );
        return { ...state, issueCards: reordered };
      } else {
        const reordered = arrayMove(state.strengthCards, oldIndex, newIndex).map(
          (c, i) => ({ ...c, order: i })
        );
        return { ...state, strengthCards: reordered };
      }
    }

    // ===== Card UI =====
    case "SET_ACTIVE_CARD":
      return { ...state, activeCardId: action.payload };

    case "SET_EDITING_CARD":
      return { ...state, editingCardId: action.payload };

    case "TOGGLE_CARD_EXPANDED": {
      const cardId = action.payload;

      // Check issue cards
      const issueIndex = state.issueCards.findIndex((c) => c.id === cardId);
      if (issueIndex !== -1) {
        const updatedCards = [...state.issueCards];
        const existingCard = updatedCards[issueIndex];
        if (existingCard) {
          updatedCards[issueIndex] = {
            ...existingCard,
            isExpanded: !existingCard.isExpanded,
          };
        }
        return { ...state, issueCards: updatedCards };
      }

      // Check strength cards
      const strengthIndex = state.strengthCards.findIndex((c) => c.id === cardId);
      if (strengthIndex !== -1) {
        const updatedCards = [...state.strengthCards];
        const existingCard = updatedCards[strengthIndex];
        if (existingCard) {
          updatedCards[strengthIndex] = {
            ...existingCard,
            isExpanded: !existingCard.isExpanded,
          };
        }
        return { ...state, strengthCards: updatedCards };
      }

      return state;
    }

    // ===== Annotations =====
    case "ADD_ANNOTATION": {
      const newAnnotation: StudioAnnotation = {
        ...action.payload,
        id: generateAnnotationId(),
        number: getNextAnnotationNumber(state.annotations),
      };
      return {
        ...state,
        annotations: [...state.annotations, newAnnotation],
      };
    }

    case "UPDATE_ANNOTATION": {
      const { id, updates } = action.payload;
      const updated = state.annotations.map((ann) =>
        ann.id === id ? { ...ann, ...updates } : ann
      );
      return { ...state, annotations: updated };
    }

    case "DELETE_ANNOTATION": {
      const filtered = state.annotations.filter((a) => a.id !== action.payload);
      // Renumber remaining annotations
      const renumbered = filtered.map((a, i) => ({ ...a, number: i + 1 }));
      return { ...state, annotations: renumbered };
    }

    case "LINK_ANNOTATION_TO_CARD": {
      const { annotationId, cardId } = action.payload;

      // Update annotation
      const updatedAnnotations = state.annotations.map((ann) =>
        ann.id === annotationId ? { ...ann, linkedCardId: cardId } : ann
      );

      // Update card's annotationIds
      const issueIndex = state.issueCards.findIndex((c) => c.id === cardId);
      if (issueIndex !== -1) {
        const updatedCards = [...state.issueCards];
        const existingCard = updatedCards[issueIndex];
        if (existingCard) {
          const existingIds = existingCard.annotationIds || [];
          if (!existingIds.includes(annotationId)) {
            updatedCards[issueIndex] = {
              ...existingCard,
              annotationIds: [...existingIds, annotationId],
            };
          }
        }
        return {
          ...state,
          annotations: updatedAnnotations,
          issueCards: updatedCards,
        };
      }

      return { ...state, annotations: updatedAnnotations };
    }

    case "UNLINK_ANNOTATION": {
      const annotationId = action.payload;
      const annotation = state.annotations.find((a) => a.id === annotationId);
      if (!annotation?.linkedCardId) return state;

      const cardId = annotation.linkedCardId;

      // Remove link from annotation
      const updatedAnnotations = state.annotations.map((ann) =>
        ann.id === annotationId ? { ...ann, linkedCardId: undefined } : ann
      );

      // Remove from card's annotationIds
      const issueIndex = state.issueCards.findIndex((c) => c.id === cardId);
      if (issueIndex !== -1) {
        const updatedCards = [...state.issueCards];
        const existingCard = updatedCards[issueIndex];
        if (existingCard) {
          updatedCards[issueIndex] = {
            ...existingCard,
            annotationIds: (existingCard.annotationIds || []).filter(
              (id) => id !== annotationId
            ),
          };
        }
        return {
          ...state,
          annotations: updatedAnnotations,
          issueCards: updatedCards,
        };
      }

      return { ...state, annotations: updatedAnnotations };
    }

    // ===== Selection Mode =====
    case "SET_SELECTION_MODE":
      return { ...state, selectionMode: action.payload };

    // ===== Verdict =====
    case "UPDATE_VERDICT": {
      const currentVerdict = state.verdictCard || createEmptyVerdictCard();
      return {
        ...state,
        verdictCard: {
          ...currentVerdict,
          ...action.payload,
          updatedAt: new Date().toISOString(),
        } as VerdictCard,
      };
    }

    // ===== Phase 1 & 2 Data =====
    case "SET_FOCUS_AREAS":
      return { ...state, focusAreas: action.payload };

    case "SET_RUBRIC_RATINGS":
      return { ...state, rubricRatings: action.payload };

    case "SET_RUBRIC_RATIONALES":
      return { ...state, rubricRationales: action.payload };

    // ===== UI State =====
    case "SET_ACTIVE_DECK_TAB":
      return { ...state, activeDeckTab: action.payload };

    // ===== Save Status =====
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };

    case "SET_LAST_SAVED":
      return { ...state, lastSavedAt: action.payload, saveError: null };

    case "SET_SAVE_ERROR":
      return { ...state, saveError: action.payload, isSaving: false };

    // ===== Bulk Load =====
    case "LOAD_STATE":
      return { ...state, ...action.payload };

    case "RESET_STATE":
      return createInitialState(state.slotId, state.contentType);

    default:
      return state;
  }
}

// ===== Provider Props =====

interface ReviewStudioProviderProps {
  slotId: number;
  contentType: string;
  mode?: "reviewer" | "creator";
  children: React.ReactNode;
}

// ===== Provider Component =====

export function ReviewStudioProvider({
  slotId,
  contentType,
  mode = "reviewer",
  children,
}: ReviewStudioProviderProps) {
  // In creator mode, we're read-only - no saving
  const isReadOnly = mode === "creator";
  const [state, dispatch] = React.useReducer(
    reducer,
    createInitialState(slotId, contentType)
  );

  // Auto-save timer ref
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = React.useRef<string>("");

  // ===== Convenience Actions =====

  const addIssueCard = React.useCallback((initial?: Partial<IssueCard>) => {
    dispatch({ type: "ADD_ISSUE_CARD", payload: initial });
  }, []);

  const addStrengthCard = React.useCallback((initial?: Partial<StrengthCard>) => {
    dispatch({ type: "ADD_STRENGTH_CARD", payload: initial });
  }, []);

  const updateCard = React.useCallback(
    (id: string, updates: Partial<IssueCard | StrengthCard>) => {
      dispatch({ type: "UPDATE_CARD", payload: { id, updates } });
    },
    []
  );

  const deleteCard = React.useCallback(
    (id: string, cardType: "issue" | "strength") => {
      dispatch({ type: "DELETE_CARD", payload: { id, cardType } });
    },
    []
  );

  const reorderCards = React.useCallback(
    (cardType: "issue" | "strength", oldIndex: number, newIndex: number) => {
      dispatch({ type: "REORDER_CARDS", payload: { cardType, oldIndex, newIndex } });
    },
    []
  );

  // ===== Annotation Helpers =====

  const addAnnotation = React.useCallback(
    (annotation: Omit<StudioAnnotation, "id" | "number">) => {
      dispatch({ type: "ADD_ANNOTATION", payload: annotation });
    },
    []
  );

  const linkAnnotationToCard = React.useCallback(
    (annotationId: string, cardId: string) => {
      dispatch({
        type: "LINK_ANNOTATION_TO_CARD",
        payload: { annotationId, cardId },
      });
    },
    []
  );

  const createCardFromAnnotation = React.useCallback(
    (type: "issue" | "strength", annotation: StudioAnnotation) => {
      // Create the card
      if (type === "issue") {
        const newCard = createEmptyIssueCard(state.issueCards.length);
        newCard.annotationIds = [annotation.id];
        dispatch({ type: "ADD_ISSUE_CARD", payload: newCard });

        // Link annotation to card
        dispatch({
          type: "LINK_ANNOTATION_TO_CARD",
          payload: { annotationId: annotation.id, cardId: newCard.id },
        });
      } else {
        const newCard = createEmptyStrengthCard(state.strengthCards.length);
        dispatch({ type: "ADD_STRENGTH_CARD", payload: newCard });
      }

      // Exit selection mode
      dispatch({ type: "SET_SELECTION_MODE", payload: "normal" });
    },
    [state.issueCards.length, state.strengthCards.length]
  );

  // ===== Verdict Helpers =====

  const updateVerdict = React.useCallback((updates: Partial<VerdictCard>) => {
    dispatch({ type: "UPDATE_VERDICT", payload: updates });
  }, []);

  // ===== Selection Mode =====

  const toggleSelectionMode = React.useCallback(() => {
    dispatch({
      type: "SET_SELECTION_MODE",
      payload: state.selectionMode === "normal" ? "annotate" : "normal",
    });
  }, [state.selectionMode]);

  // ===== Persistence =====

  const saveDraft = React.useCallback(async () => {
    dispatch({ type: "SET_SAVING", payload: true });

    try {
      // Prepare state for saving (exclude UI-only fields)
      const stateToSave = {
        slotId: state.slotId,
        contentType: state.contentType,
        issueCards: state.issueCards,
        strengthCards: state.strengthCards,
        verdictCard: state.verdictCard,
        annotations: state.annotations,
        focusAreas: state.focusAreas,
        rubricRatings: state.rubricRatings,
        rubricRationales: state.rubricRationales,
        timeSpentSeconds: state.timeSpentSeconds,
      };

      const stateJson = JSON.stringify(stateToSave);

      // Skip if nothing changed
      if (stateJson === lastSaveRef.current) {
        dispatch({ type: "SET_SAVING", payload: false });
        return;
      }

      // Save directly using new studio endpoint (no conversion needed)
      await saveStudioDraft(state.slotId, stateToSave);
      lastSaveRef.current = stateJson;
      dispatch({ type: "SET_LAST_SAVED", payload: new Date() });
    } catch (error) {
      let errorMessage = "Failed to save";

      if (error instanceof ApiClientError) {
        errorMessage = error.message;

        if (error.isNetworkError()) {
          errorMessage = "Network error - will retry automatically";
        } else if (error.status === 403) {
          errorMessage = "Access denied - you may not own this review slot";
        } else if (error.status === 400) {
          errorMessage = "Invalid data - some fields may be missing";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      dispatch({
        type: "SET_SAVE_ERROR",
        payload: errorMessage,
      });
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [state]);

  const loadDraft = React.useCallback(async () => {
    try {
      // Both reviewer and creator modes use the same studio endpoint
      // The backend handles authorization based on user role
      const loadedData = await getStudioDraft(slotId);

      if (loadedData && Object.keys(loadedData).length > 0) {
        // Check if this is studio format (has _format marker or issueCards/strengthCards)
        const isStudioFormat = loadedData._format === "studio" ||
          loadedData.issueCards !== undefined ||
          loadedData.strengthCards !== undefined;

        let stateToLoad: Partial<ReviewStudioState>;

        if (isStudioFormat) {
          // New format - load directly
          stateToLoad = loadedData;
        } else {
          // Legacy SmartReviewDraft format - convert it
          // This handles old reviews that were saved before the studio format
          stateToLoad = draftToStudioState(loadedData as any, slotId, contentType);
        }

        // Load the state
        dispatch({ type: "LOAD_STATE", payload: stateToLoad });

        if (!isReadOnly) {
          // Only track for change detection in reviewer mode
          const stateToTrack = {
            slotId: stateToLoad.slotId,
            contentType: stateToLoad.contentType,
            issueCards: stateToLoad.issueCards,
            strengthCards: stateToLoad.strengthCards,
            verdictCard: stateToLoad.verdictCard,
            annotations: stateToLoad.annotations,
            focusAreas: stateToLoad.focusAreas,
            rubricRatings: stateToLoad.rubricRatings,
            rubricRationales: stateToLoad.rubricRationales,
            timeSpentSeconds: stateToLoad.timeSpentSeconds,
          };
          lastSaveRef.current = JSON.stringify(stateToTrack);
        }
      }
    } catch {
      // No existing draft found, starting fresh
    }
  }, [slotId, contentType, isReadOnly]);

  const submitReview = React.useCallback(async () => {
    dispatch({ type: "SET_SAVING", payload: true });

    try {
      // Prepare state for submission (exclude UI-only fields)
      const stateToSubmit = {
        slotId: state.slotId,
        contentType: state.contentType,
        issueCards: state.issueCards,
        strengthCards: state.strengthCards,
        verdictCard: state.verdictCard,
        annotations: state.annotations,
        focusAreas: state.focusAreas,
        rubricRatings: state.rubricRatings,
        rubricRationales: state.rubricRationales,
        timeSpentSeconds: state.timeSpentSeconds,
      };

      // Submit directly using new studio endpoint (no conversion needed)
      await submitStudioReview(state.slotId, stateToSubmit);
    } catch (error) {
      dispatch({
        type: "SET_SAVE_ERROR",
        payload: error instanceof Error ? error.message : "Failed to submit",
      });
      throw error;
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [state]);

  // ===== Validation =====

  const isReadyToSubmit = React.useCallback(() => {
    // Must have at least 1 complete issue OR 1 complete strength
    const hasCompleteIssue = state.issueCards.some(isIssueCardComplete);
    const hasCompleteStrength = state.strengthCards.some(isStrengthCardComplete);

    if (!hasCompleteIssue && !hasCompleteStrength) return false;

    // Verdict must be complete
    if (!isVerdictComplete(state.verdictCard)) return false;

    return true;
  }, [state.issueCards, state.strengthCards, state.verdictCard]);

  const getValidationErrors = React.useCallback(() => {
    const errors: string[] = [];

    const completeIssues = state.issueCards.filter(isIssueCardComplete);
    const completeStrengths = state.strengthCards.filter(isStrengthCardComplete);

    if (completeIssues.length === 0 && completeStrengths.length === 0) {
      errors.push("Add at least one complete issue or strength card");
    }

    if (!state.verdictCard || state.verdictCard.rating === 0) {
      errors.push("Set an overall rating (1-5 stars)");
    }

    if (!state.verdictCard || state.verdictCard.summary.length < 50) {
      errors.push("Write a summary (at least 50 characters)");
    }

    if (
      !state.verdictCard ||
      !state.verdictCard.topTakeaways.every(
        (t) => t.issue.length >= 5 && t.fix.length >= 5
      )
    ) {
      errors.push("Complete all 3 top takeaways");
    }

    return errors;
  }, [state.issueCards, state.strengthCards, state.verdictCard]);

  // ===== Auto-save Effect =====

  React.useEffect(() => {
    // Skip auto-save in creator (read-only) mode
    if (isReadOnly) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save (3 seconds after last change)
    autoSaveTimerRef.current = setTimeout(() => {
      // Only auto-save if not already saving (prevent race conditions)
      if (!state.isSaving) {
        saveDraft();
      }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    state.issueCards,
    state.strengthCards,
    state.verdictCard,
    state.annotations,
    state.focusAreas,
    state.rubricRatings,
    state.isSaving,
    saveDraft,
    isReadOnly,
  ]);

  // ===== Load Draft on Mount =====

  React.useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // ===== Context Value =====

  const value: ReviewStudioContextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      addIssueCard,
      addStrengthCard,
      updateCard,
      deleteCard,
      reorderCards,
      addAnnotation,
      linkAnnotationToCard,
      createCardFromAnnotation,
      updateVerdict,
      toggleSelectionMode,
      saveDraft,
      loadDraft,
      submitReview,
      isReadyToSubmit,
      getValidationErrors,
    }),
    [
      state,
      addIssueCard,
      addStrengthCard,
      updateCard,
      deleteCard,
      reorderCards,
      addAnnotation,
      linkAnnotationToCard,
      createCardFromAnnotation,
      updateVerdict,
      toggleSelectionMode,
      saveDraft,
      loadDraft,
      submitReview,
      isReadyToSubmit,
      getValidationErrors,
    ]
  );

  return (
    <ReviewStudioContext.Provider value={value}>
      {children}
    </ReviewStudioContext.Provider>
  );
}

// ===== Hook =====

export function useReviewStudio(): ReviewStudioContextValue {
  const context = React.useContext(ReviewStudioContext);
  if (!context) {
    throw new Error("useReviewStudio must be used within a ReviewStudioProvider");
  }
  return context;
}
