/**
 * Card Helper Utilities
 *
 * Utility functions for card operations, ID generation,
 * and common card manipulations.
 */

import { arrayMove } from "@dnd-kit/sortable";
import type {
  IssueCard,
  StrengthCard,
  StudioAnnotation,
} from "@/lib/types/review-studio";

/**
 * Generate a unique ID for cards
 */
export function generateCardId(type: "issue" | "strength"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `${type}-${timestamp}-${random}`;
}

/**
 * Generate a unique ID for annotations
 */
export function generateAnnotationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `ann-${timestamp}-${random}`;
}

/**
 * Reorder cards array after drag
 */
export function reorderCards<T extends { order: number }>(
  cards: T[],
  oldIndex: number,
  newIndex: number
): T[] {
  const reordered = arrayMove(cards, oldIndex, newIndex);
  // Update order property to match new positions
  return reordered.map((card, index) => ({
    ...card,
    order: index,
  }));
}

/**
 * Insert a new card at a specific position
 */
export function insertCard<T extends { order: number }>(
  cards: T[],
  newCard: T,
  position: number = cards.length
): T[] {
  const before = cards.slice(0, position);
  const after = cards.slice(position);

  const result = [
    ...before,
    { ...newCard, order: position },
    ...after.map((card) => ({ ...card, order: card.order + 1 })),
  ];

  return result;
}

/**
 * Remove a card and reorder remaining
 */
export function removeCard<T extends { order: number; id: string }>(
  cards: T[],
  cardId: string
): T[] {
  return cards
    .filter((card) => card.id !== cardId)
    .map((card, index) => ({ ...card, order: index }));
}

/**
 * Get cards linked to a specific annotation
 */
export function getCardsForAnnotation(
  cards: IssueCard[],
  annotationId: string
): IssueCard[] {
  return cards.filter((card) => card.annotationIds?.includes(annotationId));
}

/**
 * Get annotations linked to a specific card
 */
export function getAnnotationsForCard(
  annotations: StudioAnnotation[],
  cardId: string
): StudioAnnotation[] {
  return annotations.filter((ann) => ann.linkedCardId === cardId);
}

/**
 * Calculate the next annotation number
 */
export function getNextAnnotationNumber(annotations: StudioAnnotation[]): number {
  if (annotations.length === 0) return 1;
  const maxNumber = Math.max(...annotations.map((a) => a.number || 0));
  return maxNumber + 1;
}

/**
 * Sort cards by priority (critical first, then important, then nice-to-have)
 */
export function sortCardsByPriority(cards: IssueCard[]): IssueCard[] {
  const priorityOrder = { critical: 0, important: 1, "nice-to-have": 2 };
  return [...cards].sort((a, b) => {
    const aPriority = priorityOrder[a.priority] ?? 3;
    const bPriority = priorityOrder[b.priority] ?? 3;
    return aPriority - bPriority;
  });
}

/**
 * Sort cards by severity
 */
export function sortCardsBySeverity(cards: IssueCard[]): IssueCard[] {
  const severityOrder = { critical: 0, major: 1, minor: 2, suggestion: 3 };
  return [...cards].sort((a, b) => {
    const aSeverity = severityOrder[a.severity] ?? 4;
    const bSeverity = severityOrder[b.severity] ?? 4;
    return aSeverity - bSeverity;
  });
}

/**
 * Filter quick wins (high priority + quick-fix effort)
 */
export function getQuickWins(cards: IssueCard[]): IssueCard[] {
  return cards.filter(
    (card) =>
      card.isQuickWin ||
      ((card.priority === "critical" || card.priority === "important") &&
        card.effort === "quick-fix")
  );
}

/**
 * Count cards by priority
 */
export function countByPriority(cards: IssueCard[]): Record<string, number> {
  return cards.reduce(
    (acc, card) => {
      acc[card.priority] = (acc[card.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Count cards by category
 */
export function countByCategory(cards: IssueCard[]): Record<string, number> {
  return cards.reduce(
    (acc, card) => {
      acc[card.category] = (acc[card.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Get placeholder text for issue fields based on category
 */
export function getIssuePlaceholder(category: string): string {
  const placeholders: Record<string, string> = {
    ux: "The navigation menu is hidden on mobile, making it hard to access key features...",
    design:
      "The color contrast between text and background doesn't meet WCAG AA standards...",
    performance:
      "The page takes 8+ seconds to load due to unoptimized images...",
    accessibility:
      "Form inputs are missing label elements, making them inaccessible to screen readers...",
    security: "User passwords are being logged in plain text to the console...",
    maintainability:
      "The component has 500+ lines with no separation of concerns...",
    content:
      "The error message doesn't explain how to fix the problem...",
    other: "Describe the specific issue you've identified...",
  };
  return placeholders[category] ?? placeholders.other ?? "";
}

/**
 * Get placeholder text for fix suggestions based on category
 */
export function getFixPlaceholder(category: string): string {
  const placeholders: Record<string, string> = {
    ux: "Add a persistent hamburger menu with clear iconography...",
    design: "Increase text contrast to at least 4.5:1 ratio...",
    performance: "Compress images and implement lazy loading...",
    accessibility: "Add aria-label or associated <label> to all form inputs...",
    security: "Remove console.log statements containing sensitive data...",
    maintainability: "Extract into smaller, focused components...",
    content: "Rewrite to include specific steps the user can take...",
    other: "Suggest a specific, actionable fix...",
  };
  return placeholders[category] ?? placeholders.other ?? "";
}

/**
 * Validate card completeness for submission
 */
export interface CardValidation {
  isValid: boolean;
  errors: string[];
}

export function validateIssueCard(card: IssueCard): CardValidation {
  const errors: string[] = [];

  if (!card.issue || card.issue.trim().length < 10) {
    errors.push("Issue description must be at least 10 characters");
  }

  if (!card.fix || card.fix.trim().length < 10) {
    errors.push("Fix suggestion must be at least 10 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateStrengthCard(card: StrengthCard): CardValidation {
  const errors: string[] = [];

  if (!card.what || card.what.trim().length < 10) {
    errors.push("Strength description must be at least 10 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
