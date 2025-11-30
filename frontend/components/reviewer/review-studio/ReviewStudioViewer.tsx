/**
 * Review Studio Viewer (Read-Only)
 *
 * Displays a submitted review in the same split-screen layout as ReviewStudio,
 * but in read-only mode for creators to review before accepting/rejecting.
 *
 * LEFT: Content Viewer with annotations
 * RIGHT: Read-only feedback cards organized by tabs
 */

"use client";

import * as React from "react";
import {
  AlertTriangle,
  ThumbsUp,
  Scale,
  Image,
  MessageSquare,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  IssueCard,
  StrengthCard,
  VerdictCard,
  StudioAnnotation,
} from "@/lib/types/review-studio";

import { IssueCardViewer } from "./cards/IssueCardViewer";
import { StrengthCardViewer } from "./cards/StrengthCardViewer";
import { VerdictCardViewer } from "./cards/VerdictCardViewer";
import { ContentViewerReadOnly } from "./viewer/ContentViewerReadOnly";

// ===== Types =====

type ViewerTab = "issues" | "strengths" | "verdict";

interface ReviewStudioViewerProps {
  issueCards: IssueCard[];
  strengthCards: StrengthCard[];
  verdictCard: VerdictCard | null;
  annotations?: StudioAnnotation[];
  imageUrl?: string;
  externalUrl?: string | null;
  className?: string;
}

// ===== Component =====

export function ReviewStudioViewer({
  issueCards,
  strengthCards,
  verdictCard,
  annotations = [],
  imageUrl,
  externalUrl,
  className,
}: ReviewStudioViewerProps) {
  const [activeTab, setActiveTab] = React.useState<ViewerTab>("issues");
  const [mobilePanel, setMobilePanel] = React.useState<"content" | "feedback">("feedback");

  // Sort cards by order
  const sortedIssues = React.useMemo(
    () => [...issueCards].sort((a, b) => a.order - b.order),
    [issueCards]
  );

  const sortedStrengths = React.useMemo(
    () => [...strengthCards].sort((a, b) => a.order - b.order),
    [strengthCards]
  );

  // Stats
  const quickWinCount = issueCards.filter(
    (c) => c.isQuickWin || (c.priority !== "nice-to-have" && c.effort === "quick-fix")
  ).length;

  const criticalCount = issueCards.filter((c) => c.priority === "critical").length;

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header Stats Bar */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 sm:gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-orange-500" />
            <span className="font-medium">{issueCards.length}</span>
            <span className="text-muted-foreground hidden sm:inline">Issues</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="size-4 text-green-500" />
            <span className="font-medium">{strengthCards.length}</span>
            <span className="text-muted-foreground hidden sm:inline">Strengths</span>
          </div>
          {annotations.length > 0 && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 text-blue-500" />
              <span className="font-medium">{annotations.length}</span>
              <span className="text-muted-foreground hidden sm:inline">Annotations</span>
            </div>
          )}
        </div>

        {/* Quick stats badges */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
              {criticalCount} Critical
            </span>
          )}
          {quickWinCount > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              {quickWinCount} Quick Wins
            </span>
          )}
        </div>
      </header>

      {/* Mobile Panel Switcher */}
      <div className="md:hidden flex items-center border-b bg-muted/50">
        <button
          onClick={() => setMobilePanel("content")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            mobilePanel === "content"
              ? "bg-background text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Image className="size-4" />
          View Content
        </button>
        <button
          onClick={() => setMobilePanel("feedback")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            mobilePanel === "feedback"
              ? "bg-background text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="size-4" />
          Feedback
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
            {issueCards.length + strengthCards.length}
          </span>
        </button>
      </div>

      {/* Main Split Layout - Desktop */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* LEFT: Content Viewer */}
        <div className="w-1/2 border-r overflow-hidden bg-muted/30">
          <ContentViewerReadOnly
            imageUrl={imageUrl}
            externalUrl={externalUrl}
            annotations={annotations}
            className="h-full"
          />
        </div>

        {/* RIGHT: Feedback Cards */}
        <div className="w-1/2 overflow-hidden bg-[#fafafa] border-l border-border/50 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-2 border-b bg-background sticky top-0 z-10">
            <Button
              variant={activeTab === "issues" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("issues")}
              className="gap-2"
            >
              <AlertTriangle className="size-4" />
              Issues
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === "issues"
                    ? "bg-white/20 text-white"
                    : "bg-orange-100 text-orange-700"
                )}
              >
                {issueCards.length}
              </span>
            </Button>

            <Button
              variant={activeTab === "strengths" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("strengths")}
              className="gap-2"
            >
              <ThumbsUp className="size-4" />
              Strengths
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === "strengths"
                    ? "bg-white/20 text-white"
                    : "bg-green-100 text-green-700"
                )}
              >
                {strengthCards.length}
              </span>
            </Button>

            <Button
              variant={activeTab === "verdict" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("verdict")}
              className="gap-2"
            >
              <Scale className="size-4" />
              Verdict
            </Button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {activeTab === "issues" && (
              <div className="space-y-3">
                {sortedIssues.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="size-12 mx-auto mb-4 opacity-20" />
                    <p>No issues identified</p>
                  </div>
                ) : (
                  sortedIssues.map((card, index) => (
                    <IssueCardViewer
                      key={card.id}
                      card={card}
                      index={index}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "strengths" && (
              <div className="space-y-3">
                {sortedStrengths.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ThumbsUp className="size-12 mx-auto mb-4 opacity-20" />
                    <p>No strengths highlighted</p>
                  </div>
                ) : (
                  sortedStrengths.map((card, index) => (
                    <StrengthCardViewer
                      key={card.id}
                      card={card}
                      index={index}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "verdict" && (
              <>
                {verdictCard ? (
                  <VerdictCardViewer verdict={verdictCard} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Scale className="size-12 mx-auto mb-4 opacity-20" />
                    <p>No verdict provided</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex-1 md:hidden overflow-hidden flex flex-col">
        {mobilePanel === "content" ? (
          <ContentViewerReadOnly
            imageUrl={imageUrl}
            externalUrl={externalUrl}
            annotations={annotations}
            className="h-full"
          />
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-2 border-b bg-background">
              <Button
                variant={activeTab === "issues" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("issues")}
                className="gap-1 flex-1"
              >
                <AlertTriangle className="size-4" />
                <span className="text-xs">{issueCards.length}</span>
              </Button>

              <Button
                variant={activeTab === "strengths" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("strengths")}
                className="gap-1 flex-1"
              >
                <ThumbsUp className="size-4" />
                <span className="text-xs">{strengthCards.length}</span>
              </Button>

              <Button
                variant={activeTab === "verdict" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("verdict")}
                className="gap-1 flex-1"
              >
                <Scale className="size-4" />
              </Button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === "issues" && (
                <div className="space-y-3">
                  {sortedIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No issues identified</p>
                    </div>
                  ) : (
                    sortedIssues.map((card, index) => (
                      <IssueCardViewer
                        key={card.id}
                        card={card}
                        index={index}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "strengths" && (
                <div className="space-y-3">
                  {sortedStrengths.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No strengths highlighted</p>
                    </div>
                  ) : (
                    sortedStrengths.map((card, index) => (
                      <StrengthCardViewer
                        key={card.id}
                        card={card}
                        index={index}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "verdict" && (
                <>
                  {verdictCard ? (
                    <VerdictCardViewer verdict={verdictCard} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No verdict provided</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReviewStudioViewer;
