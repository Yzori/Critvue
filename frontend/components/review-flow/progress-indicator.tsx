/**
 * Progress Indicator
 * Visual progress bar showing all steps in the review flow
 * Responsive: full on desktop, dots on mobile
 */

import { Check, FileText, Upload, MessageSquare, Award, CheckCircle } from "lucide-react";
import { ContentType } from "@/lib/api/reviews";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  contentType?: ContentType | null; // Reserved for future content-specific icons
}

interface StepInfo {
  number: number;
  label: string;
  icon: React.ReactNode;
  shortLabel: string;
}

// Step configuration
const stepConfig: StepInfo[] = [
  {
    number: 1,
    label: "Content Type",
    shortLabel: "Type",
    icon: <FileText className="size-4" />,
  },
  {
    number: 2,
    label: "Basic Info",
    shortLabel: "Info",
    icon: <FileText className="size-4" />,
  },
  {
    number: 3,
    label: "File Upload",
    shortLabel: "Files",
    icon: <Upload className="size-4" />,
  },
  {
    number: 4,
    label: "Feedback Areas",
    shortLabel: "Areas",
    icon: <MessageSquare className="size-4" />,
  },
  {
    number: 5,
    label: "Review Type",
    shortLabel: "Type",
    icon: <Award className="size-4" />,
  },
  {
    number: 6,
    label: "Review & Submit",
    shortLabel: "Submit",
    icon: <CheckCircle className="size-4" />,
  },
];

export function ProgressIndicator({
  currentStep,
  totalSteps,
  onStepClick,
}: ProgressIndicatorProps) {
  const handleStepClick = (step: number) => {
    // Only allow clicking on completed or current steps
    if (step <= currentStep && onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Progress Bar */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {stepConfig.slice(0, totalSteps).map((step, index) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isClickable = step.number <= currentStep && onStepClick;

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isClickable}
                  className={`
                    group relative flex flex-col items-center
                    ${isClickable ? "cursor-pointer" : "cursor-default"}
                  `}
                >
                  {/* Circle */}
                  <div
                    className={`
                      size-10 rounded-full flex items-center justify-center
                      border-2 transition-all duration-300
                      ${
                        isCompleted
                          ? "bg-accent-blue border-accent-blue"
                          : isCurrent
                            ? "bg-accent-blue border-accent-blue shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                            : "bg-background border-border-medium"
                      }
                      ${isClickable && !isCurrent ? "hover:border-accent-blue/60 hover:scale-105" : ""}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="size-5 text-white" />
                    ) : (
                      <span
                        className={`
                          text-sm font-semibold
                          ${isCurrent ? "text-white" : "text-muted-foreground"}
                        `}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      mt-2 text-xs font-medium whitespace-nowrap
                      ${isCurrent ? "text-accent-blue" : isCompleted ? "text-foreground" : "text-muted-foreground"}
                    `}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector Line */}
                {index < totalSteps - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-2 transition-all duration-300
                      ${isCompleted ? "bg-accent-blue" : "bg-border-medium"}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Progress Dots */}
      <div className="lg:hidden">
        <div className="space-y-4">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2">
            {stepConfig.slice(0, totalSteps).map((step) => {
              const isCompleted = step.number < currentStep;
              const isCurrent = step.number === currentStep;
              const isClickable = step.number <= currentStep && onStepClick;

              return (
                <button
                  key={step.number}
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isClickable}
                  className={`
                    transition-all duration-300
                    ${
                      isCurrent
                        ? "w-8 h-2 rounded-full bg-accent-blue"
                        : isCompleted
                          ? "size-2 rounded-full bg-accent-blue"
                          : "size-2 rounded-full bg-border-medium"
                    }
                    ${isClickable ? "cursor-pointer hover:scale-125" : "cursor-default"}
                  `}
                  aria-label={step.label}
                />
              );
            })}
          </div>

          {/* Current step label */}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {stepConfig[currentStep - 1]?.label}
            </p>
            <p className="text-xs text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>
      </div>

      {/* Progress percentage bar */}
      <div className="mt-6 max-w-5xl mx-auto">
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-blue to-accent-blue/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
