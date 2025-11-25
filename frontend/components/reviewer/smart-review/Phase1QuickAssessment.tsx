/**
 * Phase 1: Focus Areas
 *
 * Streamlined first step - just select what areas to focus on
 * Rating and summary moved to final Phase 3 (Verdict)
 */

"use client";

import * as React from "react";
import { HelpCircle, Target, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Phase1QuickAssessment as Phase1Data,
  FocusArea,
} from "@/lib/types/smart-review";

interface Phase1QuickAssessmentProps {
  data: Phase1Data | null;
  focusAreas: FocusArea[];
  contentType?: string;
  onChange: (data: Phase1Data) => void;
}

export function Phase1QuickAssessment({
  data,
  focusAreas,
  contentType = "code",
  onChange,
}: Phase1QuickAssessmentProps) {
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>(
    data?.primary_focus_areas || []
  );

  // Update parent when focus areas change (simplified - no rating/summary required)
  React.useEffect(() => {
    if (selectedAreas.length > 0 && selectedAreas.length <= 6) {
      onChange({
        overall_rating: data?.overall_rating || 0, // Preserve if set in Phase 3
        primary_focus_areas: selectedAreas,
        quick_summary: data?.quick_summary || "", // Preserve if set in Phase 3
      });
    }
  }, [selectedAreas, data?.overall_rating, data?.quick_summary, onChange]);

  const toggleFocusArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="rounded-xl bg-gradient-to-r from-accent-blue/10 to-purple-500/10 border border-accent-blue/20 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-full bg-accent-blue/20 flex items-center justify-center shrink-0">
              <Target className="size-5 text-accent-blue" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Let's start your review</h4>
              <p className="text-sm text-muted-foreground">
                First, select which aspects you want to focus on. This helps structure your feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-lg font-semibold">What will you review?</Label>
              <p className="text-sm text-muted-foreground">
                Select 1-6 areas to focus on
              </p>
            </div>
            {selectedAreas.length > 0 && (
              <span className="text-sm font-medium text-accent-blue">
                {selectedAreas.length} selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area) => {
              const isSelected = selectedAreas.includes(area.id);
              return (
                <Tooltip key={area.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggleFocusArea(area.id)}
                      className={cn(
                        "px-4 py-3 rounded-lg border-2 transition-all",
                        "text-sm font-medium flex items-center gap-2",
                        "hover:scale-105 active:scale-95",
                        "touch-manipulation min-h-[48px]",
                        isSelected
                          ? "bg-accent-blue text-white border-accent-blue shadow-md"
                          : "bg-card text-foreground border-border hover:border-accent-blue/50 hover:bg-accent-blue/5"
                      )}
                      aria-pressed={isSelected}
                      aria-label={`${area.label}: ${area.description}`}
                    >
                      {isSelected && <CheckCircle2 className="size-4" />}
                      {area.label}
                      {!isSelected && <HelpCircle className="size-3 opacity-60" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{area.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {selectedAreas.length > 6 && (
            <p className="text-xs text-amber-600">
              Maximum 6 focus areas. Please deselect some.
            </p>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "size-6 rounded-full flex items-center justify-center text-xs font-bold",
                selectedAreas.length > 0 && selectedAreas.length <= 6
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {selectedAreas.length > 0 && selectedAreas.length <= 6 ? "✓" : "1"}
              </div>
              <span className={cn(
                "text-sm font-medium",
                selectedAreas.length > 0 && selectedAreas.length <= 6
                  ? "text-green-600"
                  : "text-muted-foreground"
              )}>
                {selectedAreas.length > 0 && selectedAreas.length <= 6
                  ? "Ready to continue!"
                  : "Select at least 1 focus area"}
              </span>
            </div>
            {selectedAreas.length > 0 && selectedAreas.length <= 6 && (
              <span className="text-xs text-muted-foreground">
                Next: Detailed Feedback
              </span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
