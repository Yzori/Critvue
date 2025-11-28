/**
 * About Your Work Step (Combined)
 * Merges Feedback Goals + Basic Info into a single cohesive step
 * This reduces the 7-step flow to 5 steps
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FeedbackGoal = "validation" | "fixes" | "direction" | "comprehensive";

interface AboutYourWorkStepProps {
  // Feedback goals
  selectedGoals: FeedbackGoal[];
  onGoalsChange: (goals: FeedbackGoal[]) => void;
  // Basic info
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  errors?: {
    title?: string;
    description?: string;
  };
}

interface FeedbackGoalOption {
  id: FeedbackGoal;
  emoji: string;
  label: string;
  shortDesc: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const feedbackGoalOptions: FeedbackGoalOption[] = [
  {
    id: "validation",
    emoji: "✅",
    label: "Validation",
    shortDesc: "Am I on the right track?",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  {
    id: "fixes",
    emoji: "🛠",
    label: "Fixes",
    shortDesc: "What needs fixing?",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "direction",
    emoji: "📈",
    label: "Direction",
    shortDesc: "Where should I go next?",
    color: "text-accent-blue",
    bgColor: "bg-accent-blue/10",
    borderColor: "border-accent-blue/30",
  },
  {
    id: "comprehensive",
    emoji: "📋",
    label: "Everything",
    shortDesc: "Full review please",
    color: "text-accent-peach",
    bgColor: "bg-accent-peach/10",
    borderColor: "border-accent-peach/30",
  },
];

export function AboutYourWorkStep({
  selectedGoals,
  onGoalsChange,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  errors,
}: AboutYourWorkStepProps) {
  const toggleGoal = (goalId: FeedbackGoal) => {
    // If "comprehensive" is selected, clear all others
    if (goalId === "comprehensive") {
      onGoalsChange(
        selectedGoals.includes("comprehensive") ? [] : ["comprehensive"]
      );
      return;
    }

    // If user selects another goal while "comprehensive" is selected, replace it
    if (selectedGoals.includes("comprehensive")) {
      onGoalsChange([goalId]);
      return;
    }

    // Toggle the goal
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter((g) => g !== goalId));
    } else {
      onGoalsChange([...selectedGoals, goalId]);
    }
  };

  const isSelected = (goalId: FeedbackGoal) => selectedGoals.includes(goalId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Tell us about your work
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          Help reviewers understand what you need and provide targeted feedback
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-accent-blue/10 flex items-center justify-center text-sm font-semibold text-accent-blue">
              1
            </div>
            <h3 className="font-semibold text-foreground">
              Name your project
            </h3>
          </div>

          <div className="space-y-4 pl-8">
            {/* Title Input */}
            <div className="space-y-2">
              <Input
                id="title"
                type="text"
                placeholder="E.g., E-commerce Dashboard Redesign"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                aria-invalid={!!errors?.title}
                autoComplete="off"
                className="text-base"
              />
              {errors?.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-muted-foreground text-sm">
                Add context for reviewers
              </Label>
              <Textarea
                id="description"
                placeholder="What should reviewers know? Share your goals, concerns, or specific areas you'd like feedback on..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                aria-invalid={!!errors?.description}
                autoComplete="off"
                rows={4}
                className="text-base resize-none"
              />
              {errors?.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Feedback Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-accent-blue/10 flex items-center justify-center text-sm font-semibold text-accent-blue">
              2
            </div>
            <h3 className="font-semibold text-foreground">
              What feedback do you need?
            </h3>
          </div>

          {/* Compact Goal Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-8">
            {feedbackGoalOptions.map((option) => {
              const selected = isSelected(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleGoal(option.id)}
                  className={cn(
                    "relative rounded-xl p-3 text-left transition-all duration-200",
                    "border-2 hover:shadow-md active:scale-[0.98] touch-manipulation",
                    "flex flex-col items-center text-center gap-1.5",
                    selected
                      ? `${option.borderColor} ${option.bgColor}`
                      : "border-border hover:border-accent-blue/30 bg-card"
                  )}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {option.emoji}
                  </span>
                  <span className={cn(
                    "text-sm font-semibold",
                    selected ? option.color : "text-foreground"
                  )}>
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {option.shortDesc}
                  </span>

                  {/* Selection checkmark */}
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 size-4 rounded-full bg-accent-blue flex items-center justify-center">
                      <svg
                        className="size-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={4}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground pl-8">
            {selectedGoals.length === 0 ? (
              "Select at least one feedback type"
            ) : selectedGoals.includes("comprehensive") ? (
              <span className="text-accent-peach font-medium">
                Reviewers will provide comprehensive feedback on all aspects
              </span>
            ) : (
              <span className="text-accent-blue font-medium">
                {selectedGoals.length} selected — you can choose multiple
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
