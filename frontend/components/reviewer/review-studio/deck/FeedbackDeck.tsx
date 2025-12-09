/**
 * Feedback Deck Component
 *
 * Container for draggable cards with tab navigation.
 * Uses dnd-kit for drag-and-drop reordering.
 */

"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  ThumbsUp,
  Scale,
  Plus,
  Filter,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { IssueCard, StrengthCard } from "@/lib/types/review-studio";
import { useReviewStudio } from "../context/ReviewStudioContext";
import { useCardSensors } from "../utils/dnd-sensors";
import { IssueCardEditor } from "../cards/IssueCardEditor";
import { StrengthCardEditor } from "../cards/StrengthCardEditor";
import { VerdictCardEditor } from "../verdict/VerdictCard";

// ===== Tab Type =====

type DeckTab = "issues" | "strengths" | "verdict";

// ===== Sortable Card Wrapper =====

interface SortableIssueCardProps {
  card: IssueCard;
  index: number;
}

function SortableIssueCard({ card, index }: SortableIssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <IssueCardEditor
        card={card}
        index={index}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}

interface SortableStrengthCardProps {
  card: StrengthCard;
  index: number;
}

function SortableStrengthCard({ card, index }: SortableStrengthCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <StrengthCardEditor
        card={card}
        index={index}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}

// ===== Quick Filters =====

type IssueFilter = "all" | "quick-wins" | "critical" | "important";

// ===== Main Component =====

interface FeedbackDeckProps {
  className?: string;
}

export function FeedbackDeck({ className }: FeedbackDeckProps) {
  const {
    state,
    addIssueCard,
    addStrengthCard,
    reorderCards,
    dispatch,
  } = useReviewStudio();

  const sensors = useCardSensors();
  const [activeTab, setActiveTab] = React.useState<DeckTab>("issues");
  const [issueFilter, setIssueFilter] = React.useState<IssueFilter>("all");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Filtered and sorted cards
  const filteredIssues = React.useMemo(() => {
    let cards = [...state.issueCards];

    // Apply filter
    switch (issueFilter) {
      case "quick-wins":
        cards = cards.filter((c) => c.isQuickWin || (c.priority !== "nice-to-have" && c.effort === "quick-fix"));
        break;
      case "critical":
        cards = cards.filter((c) => c.priority === "critical");
        break;
      case "important":
        cards = cards.filter((c) => c.priority === "important");
        break;
    }

    // Sort by order
    return cards.sort((a, b) => a.order - b.order);
  }, [state.issueCards, issueFilter]);

  const sortedStrengths = React.useMemo(() => {
    return [...state.strengthCards].sort((a, b) => a.order - b.order);
  }, [state.strengthCards]);

  // Tab change handler
  const handleTabChange = (tab: DeckTab) => {
    setActiveTab(tab);
    dispatch({ type: "SET_ACTIVE_DECK_TAB", payload: tab === "verdict" ? "issues" : tab });
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const isIssue = state.issueCards.some((c) => c.id === active.id);
    const cardType = isIssue ? "issue" : "strength";
    const cards = isIssue ? state.issueCards : state.strengthCards;

    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderCards(cardType, oldIndex, newIndex);
    }
  };

  // Get active card for drag overlay
  const activeIssueCard = state.issueCards.find((c) => c.id === activeId);
  const activeStrengthCard = state.strengthCards.find((c) => c.id === activeId);

  // Stats
  const completeIssues = state.issueCards.filter(
    (c) => c.issue.trim().length >= 10 && c.fix.trim().length >= 10
  ).length;
  const completeStrengths = state.strengthCards.filter(
    (c) => c.what.trim().length >= 10
  ).length;
  const quickWinCount = state.issueCards.filter(
    (c) => c.isQuickWin || (c.priority !== "nice-to-have" && c.effort === "quick-fix")
  ).length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 border-b bg-background sticky top-0 z-10 overflow-x-auto">
        <Button
          variant={activeTab === "issues" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleTabChange("issues")}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Issues
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              activeTab === "issues"
                ? "bg-white/20 text-white"
                : "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300"
            )}
          >
            {completeIssues}/{state.issueCards.length}
          </span>
        </Button>

        <Button
          variant={activeTab === "strengths" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleTabChange("strengths")}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          Strengths
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              activeTab === "strengths"
                ? "bg-white/20 text-white"
                : "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
            )}
          >
            {completeStrengths}/{state.strengthCards.length}
          </span>
        </Button>

        <Button
          variant={activeTab === "verdict" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleTabChange("verdict")}
          className="gap-2"
        >
          <Scale className="h-4 w-4" />
          Verdict
        </Button>
      </div>

      {/* Issues Tab Content */}
      {activeTab === "issues" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Filters */}
          <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setIssueFilter("all")}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full transition-colors",
                  issueFilter === "all"
                    ? "bg-foreground text-background"
                    : "bg-background hover:bg-muted"
                )}
              >
                All ({state.issueCards.length})
              </button>
              {quickWinCount > 0 && (
                <button
                  onClick={() => setIssueFilter("quick-wins")}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1",
                    issueFilter === "quick-wins"
                      ? "bg-green-600 text-white"
                      : "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-500/30"
                  )}
                >
                  <Zap className="h-3 w-3" />
                  Quick Wins ({quickWinCount})
                </button>
              )}
              <button
                onClick={() => setIssueFilter("critical")}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full transition-colors",
                  issueFilter === "critical"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30"
                )}
              >
                Critical
              </button>
              <button
                onClick={() => setIssueFilter("important")}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full transition-colors",
                  issueFilter === "important"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30"
                )}
              >
                Important
              </button>
            </div>
          </div>

          {/* Card List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="mb-4">
                  {issueFilter === "all"
                    ? "No issue cards yet"
                    : `No ${issueFilter === "quick-wins" ? "quick wins" : issueFilter} issues`}
                </p>
                {issueFilter === "all" && (
                  <Button
                    onClick={() => addIssueCard()}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Issue
                  </Button>
                )}
                {issueFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setIssueFilter("all")}>
                    Show all issues
                  </Button>
                )}
              </div>
            ) : (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                >
                  <SortableContext
                    items={filteredIssues.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredIssues.map((card, index) => (
                      <SortableIssueCard key={card.id} card={card} index={index} />
                    ))}
                  </SortableContext>

                  {/* Drag Overlay */}
                  <DragOverlay>
                    {activeIssueCard && (
                      <div className="opacity-80">
                        <IssueCardEditor
                          card={activeIssueCard}
                          index={filteredIssues.findIndex((c) => c.id === activeIssueCard.id)}
                          isDragging
                        />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>

                {/* Add Issue Button - below cards */}
                {issueFilter === "all" && (
                  <button
                    onClick={() => addIssueCard()}
                    className={cn(
                      "w-full mt-3 py-4 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-500/40",
                      "flex items-center justify-center gap-2",
                      "text-orange-500 dark:text-orange-400 font-medium",
                      "hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:border-orange-400 dark:hover:border-orange-500/60",
                      "transition-all duration-200"
                    )}
                  >
                    <Plus className="size-5" />
                    Add Issue
                  </button>
                )}
              </>
            )}

          </div>

        </div>
      )}

      {/* Strengths Tab Content */}
      {activeTab === "strengths" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Card List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
            {sortedStrengths.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ThumbsUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="mb-4">No strength cards yet</p>
                <Button
                  onClick={() => addStrengthCard()}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Strength
                </Button>
              </div>
            ) : (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                >
                  <SortableContext
                    items={sortedStrengths.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedStrengths.map((card, index) => (
                      <SortableStrengthCard key={card.id} card={card} index={index} />
                    ))}
                  </SortableContext>

                  {/* Drag Overlay */}
                  <DragOverlay>
                    {activeStrengthCard && (
                      <div className="opacity-80">
                        <StrengthCardEditor
                          card={activeStrengthCard}
                          index={sortedStrengths.findIndex((c) => c.id === activeStrengthCard.id)}
                          isDragging
                        />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>

                {/* Add Strength Button - below cards */}
                <button
                  onClick={() => addStrengthCard()}
                  className={cn(
                    "w-full mt-3 py-4 rounded-2xl border-2 border-dashed border-green-300 dark:border-green-500/40",
                    "flex items-center justify-center gap-2",
                    "text-green-500 dark:text-green-400 font-medium",
                    "hover:bg-green-50 dark:hover:bg-green-500/10 hover:border-green-400 dark:hover:border-green-500/60",
                    "transition-all duration-200"
                  )}
                >
                  <Plus className="size-5" />
                  Add Strength
                </button>
              </>
            )}
          </div>

        </div>
      )}

      {/* Verdict Tab Content */}
      {activeTab === "verdict" && (
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <VerdictCardEditor />
        </div>
      )}

    </div>
  );
}

export default FeedbackDeck;
