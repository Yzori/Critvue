/**
 * Phase Navigation
 *
 * Progressive disclosure navigation:
 * - Shows current phase and progress
 * - Allows switching between phases
 * - Visual indicators for completion
 */

"use client";

import * as React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhaseNumber, PHASE_CONFIGS } from "@/lib/types/smart-review";

interface PhaseNavigationProps {
  currentPhase: PhaseNumber;
  onPhaseChange: (phase: PhaseNumber) => void;
  phaseCompletion: Record<PhaseNumber, boolean>;
  className?: string;
}

export function PhaseNavigation({
  currentPhase,
  onPhaseChange,
  phaseCompletion,
  className,
}: PhaseNavigationProps) {
  const phases: PhaseNumber[] = [1, 2, 3];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop: Vertical tabs */}
      <nav className="hidden lg:flex flex-col gap-2" aria-label="Review phases">
        {phases.map((phaseNum) => {
          const config = PHASE_CONFIGS[phaseNum];
          const isComplete = phaseCompletion[phaseNum];
          const isCurrent = currentPhase === phaseNum;

          return (
            <button
              key={phaseNum}
              type="button"
              onClick={() => onPhaseChange(phaseNum)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl transition-all text-left",
                "border-2",
                isCurrent
                  ? "border-accent-blue bg-accent-blue/5"
                  : "border-border bg-card hover:border-accent-blue/50 hover:bg-muted/50"
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isComplete ? (
                  <CheckCircle2 className="size-5 text-green-600" />
                ) : (
                  <Circle
                    className={cn(
                      "size-5",
                      isCurrent ? "text-accent-blue" : "text-muted-foreground"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-md",
                      isCurrent
                        ? "bg-accent-blue text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    Phase {phaseNum}
                  </span>
                  {config.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                <h3
                  className={cn(
                    "text-sm font-semibold mt-1",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {config.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mobile: Horizontal tabs */}
      <nav
        className="lg:hidden flex items-center justify-between border-b border-border"
        aria-label="Review phases"
      >
        {phases.map((phaseNum) => {
          const config = PHASE_CONFIGS[phaseNum];
          const isComplete = phaseCompletion[phaseNum];
          const isCurrent = currentPhase === phaseNum;

          return (
            <button
              key={phaseNum}
              type="button"
              onClick={() => onPhaseChange(phaseNum)}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 py-3 px-2",
                "border-b-2 transition-all touch-manipulation",
                isCurrent
                  ? "border-accent-blue text-accent-blue"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Icon */}
              {isComplete ? (
                <CheckCircle2 className="size-5 text-green-600" />
              ) : (
                <Circle className="size-5" />
              )}

              {/* Text */}
              <div className="text-center">
                <p className="text-xs font-medium">Phase {phaseNum}</p>
                <p className="text-[10px] text-muted-foreground">
                  {config.title}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium">
            {Object.values(phaseCompletion).filter(Boolean).length} / {phases.length} complete
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-blue transition-all duration-300"
            style={{
              width: `${(Object.values(phaseCompletion).filter(Boolean).length / phases.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Phase info */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold mb-1">
          {PHASE_CONFIGS[currentPhase].title}
        </h4>
        <p className="text-xs text-muted-foreground">
          {PHASE_CONFIGS[currentPhase].description}
        </p>
        {PHASE_CONFIGS[currentPhase].required && (
          <p className="text-xs text-red-600 mt-2">* Required for submission</p>
        )}
      </div>
    </div>
  );
}
