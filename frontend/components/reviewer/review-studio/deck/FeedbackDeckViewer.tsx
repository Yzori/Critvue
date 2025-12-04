/**
 * Feedback Deck Viewer Component (Read-Only)
 *
 * Container for displaying read-only feedback cards with tab navigation.
 * Used in creator mode for reviewing submitted feedback.
 * No drag-and-drop - purely display.
 */

"use client";

import * as React from "react";
import {
  AlertTriangle,
  ThumbsUp,
  Scale,
  Filter,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useReviewStudio } from "../context/ReviewStudioContext";
import { IssueCardViewer } from "../cards/IssueCardViewer";
import { StrengthCardViewer } from "../cards/StrengthCardViewer";
import { VerdictCardViewer } from "../cards/VerdictCardViewer";

// ===== Tab Type =====

type DeckTab = "issues" | "strengths" | "verdict";

// ===== Quick Filters =====

type IssueFilter = "all" | "quick-wins" | "critical" | "important";

// ===== Main Component =====

interface FeedbackDeckViewerProps {
  className?: string;
}

export function FeedbackDeckViewer({ className }: FeedbackDeckViewerProps) {
  const { state } = useReviewStudio();

  const [activeTab, setActiveTab] = React.useState<DeckTab>("issues");
  const [issueFilter, setIssueFilter] = React.useState<IssueFilter>("all");

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

  // Stats
  const quickWinCount = state.issueCards.filter(
    (c) => c.isQuickWin || (c.priority !== "nice-to-have" && c.effort === "quick-fix")
  ).length;

  const criticalCount = state.issueCards.filter((c) => c.priority === "critical").length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 border-b bg-background sticky top-0 z-10 overflow-x-auto">
        <Button
          variant={activeTab === "issues" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("issues")}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Issues
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              activeTab === "issues"
                ? "bg-background/20 text-white"
                : "bg-orange-100 text-orange-700"
            )}
          >
            {state.issueCards.length}
          </span>
        </Button>

        <Button
          variant={activeTab === "strengths" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("strengths")}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          Strengths
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              activeTab === "strengths"
                ? "bg-background/20 text-white"
                : "bg-green-100 text-green-700"
            )}
          >
            {state.strengthCards.length}
          </span>
        </Button>

        <Button
          variant={activeTab === "verdict" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("verdict")}
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
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  )}
                >
                  <Zap className="h-3 w-3" />
                  Quick Wins ({quickWinCount})
                </button>
              )}
              {criticalCount > 0 && (
                <button
                  onClick={() => setIssueFilter("critical")}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full transition-colors",
                    issueFilter === "critical"
                      ? "bg-red-600 text-white"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  )}
                >
                  Critical ({criticalCount})
                </button>
              )}
              <button
                onClick={() => setIssueFilter("important")}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full transition-colors",
                  issueFilter === "important"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
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
                <p>
                  {issueFilter === "all"
                    ? "No issues identified"
                    : `No ${issueFilter === "quick-wins" ? "quick wins" : issueFilter} issues`}
                </p>
                {issueFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setIssueFilter("all")} className="mt-2">
                    Show all issues
                  </Button>
                )}
              </div>
            ) : (
              filteredIssues.map((card, index) => (
                <IssueCardViewer key={card.id} card={card} index={index} />
              ))
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
                <p>No strengths highlighted</p>
              </div>
            ) : (
              sortedStrengths.map((card, index) => (
                <StrengthCardViewer key={card.id} card={card} index={index} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Verdict Tab Content */}
      {activeTab === "verdict" && (
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {state.verdictCard ? (
            <VerdictCardViewer verdict={state.verdictCard} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No verdict provided</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FeedbackDeckViewer;
