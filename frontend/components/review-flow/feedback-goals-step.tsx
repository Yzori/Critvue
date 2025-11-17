/**
 * Feedback Goals Selection Step
 * Helps users define what kind of feedback they want upfront
 * This selection pre-fills which prompts are emphasized to reviewers
 */

import { CheckCircle2, Wrench, TrendingUp, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedbackGoal = "validation" | "fixes" | "direction" | "comprehensive";

interface FeedbackGoalsStepProps {
  selectedGoals: FeedbackGoal[];
  onGoalsChange: (goals: FeedbackGoal[]) => void;
}

interface FeedbackGoalOption {
  id: FeedbackGoal;
  icon: React.ElementType;
  emoji: string;
  label: string;
  description: string;
  examples: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}

const feedbackGoalOptions: FeedbackGoalOption[] = [
  {
    id: "validation",
    icon: CheckCircle2,
    emoji: "✅",
    label: "Validation",
    description: "Quick validation of approach or direction",
    examples: [
      "Is this design headed in the right direction?",
      "Does the code structure make sense?",
      "Is my messaging clear and compelling?",
    ],
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  {
    id: "fixes",
    icon: Wrench,
    emoji: "🛠",
    label: "Fixes",
    description: "Specific issues to address",
    examples: [
      "What bugs or issues do you see?",
      "Where can I improve clarity?",
      "What technical problems need fixing?",
    ],
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "direction",
    icon: TrendingUp,
    emoji: "📈",
    label: "Direction",
    description: "High-level strategic guidance",
    examples: [
      "What's the best path forward?",
      "How can this be more impactful?",
      "What would you do differently?",
    ],
    color: "text-accent-blue",
    bgColor: "bg-accent-blue/10",
    borderColor: "border-accent-blue/30",
  },
  {
    id: "comprehensive",
    icon: List,
    emoji: "📋",
    label: "All of the Above",
    description: "Comprehensive feedback covering all areas",
    examples: [
      "I want feedback on everything",
      "Full critique from validation to direction",
      "Help me make this the best it can be",
    ],
    color: "text-accent-peach",
    bgColor: "bg-accent-peach/10",
    borderColor: "border-accent-peach/30",
  },
];

export function FeedbackGoalsStep({
  selectedGoals,
  onGoalsChange,
}: FeedbackGoalsStepProps) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          What kind of feedback do you want?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          Choose your focus areas. This helps reviewers understand what matters most to you.
        </p>
      </div>

      {/* Feedback Goal Cards - Large, prominent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto">
        {feedbackGoalOptions.map((option) => {
          const Icon = option.icon;
          const selected = isSelected(option.id);

          return (
            <button
              key={option.id}
              onClick={() => toggleGoal(option.id)}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-card",
                "border-2 transition-all duration-200",
                "p-6 text-left min-h-[200px] flex flex-col",
                "hover:shadow-lg active:scale-[0.98] touch-manipulation",
                selected
                  ? `${option.borderColor} shadow-[0_0_0_3px_rgba(59,130,246,0.1)]`
                  : "border-border hover:border-accent-blue/30"
              )}
            >
              {/* Icon and Label */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={cn(
                    "size-12 rounded-xl flex items-center justify-center transition-transform duration-200",
                    option.bgColor,
                    "group-hover:scale-110",
                    selected && "scale-110"
                  )}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {option.emoji}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-1">
                    {option.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                {/* Selection Indicator */}
                {selected && (
                  <div className="size-6 rounded-full bg-accent-blue flex items-center justify-center flex-shrink-0">
                    <svg
                      className="size-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Examples */}
              <div className="mt-auto space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Example questions:
                </p>
                <ul className="space-y-1.5">
                  {option.examples.slice(0, 2).map((example, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <div
                        className={cn(
                          "size-1.5 rounded-full mt-1.5 flex-shrink-0",
                          selected ? option.color.replace("text-", "bg-") : "bg-muted-foreground/40"
                        )}
                      />
                      <span className={cn(selected && "text-foreground")}>
                        {example}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hover effect gradient */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                  option.bgColor
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs text-muted-foreground">
          {selectedGoals.length === 0 ? (
            "Select at least one feedback goal to continue"
          ) : selectedGoals.includes("comprehensive") ? (
            <span className="text-accent-peach font-medium">
              You've selected comprehensive feedback covering all areas
            </span>
          ) : (
            <span className="text-accent-blue font-medium">
              {selectedGoals.length} {selectedGoals.length === 1 ? "goal" : "goals"} selected
              — you can choose multiple
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
