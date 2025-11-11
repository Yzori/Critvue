/**
 * Review Type Selection Step
 * Choose between free (AI + Community) or paid (Expert) review
 * Includes dynamic budget input for expert reviews
 */

import { ReviewType } from "@/lib/api/reviews";
import { Sparkles, Award, Check, Clock, Users } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ReviewTypeStepProps {
  selectedType: ReviewType | null;
  budget: number;
  onSelect: (type: ReviewType) => void;
  onBudgetChange: (budget: number) => void;
}

interface ReviewTypeOption {
  type: ReviewType;
  icon: React.ReactNode;
  title: string;
  price: string;
  description: string;
  features: string[];
  color: string;
  bgColor: string;
  gradientClass: string;
  recommended?: boolean;
}

const reviewTypes: ReviewTypeOption[] = [
  {
    type: "free",
    icon: <Sparkles className="size-6 text-white" />,
    title: "Quick Feedback",
    price: "Free",
    description: "AI-powered analysis plus community feedback",
    features: [
      "Instant AI analysis",
      "Community feedback",
      "Basic insights",
      "Public reviews visible to all",
    ],
    color: "text-accent-blue",
    bgColor: "bg-accent-blue/10",
    gradientClass: "from-accent-blue to-blue-600",
    recommended: false,
  },
  {
    type: "expert",
    icon: <Award className="size-6 text-white" />,
    title: "Expert Review",
    price: "Starting at $29",
    description: "In-depth review from industry professionals",
    features: [
      "Professional reviewer match",
      "Detailed written feedback",
      "Video walkthrough included",
      "1-on-1 follow-up session",
    ],
    color: "text-accent-peach",
    bgColor: "bg-accent-peach/10",
    gradientClass: "from-accent-peach to-orange-600",
    recommended: true,
  },
];

// Budget tier configuration
interface BudgetTier {
  min: number;
  max: number;
  level: string;
  estimatedTime: string;
  description: string;
}

const budgetTiers: BudgetTier[] = [
  {
    min: 29,
    max: 49,
    level: "Junior Expert",
    estimatedTime: "4-6 hours",
    description: "Emerging professionals with solid fundamentals",
  },
  {
    min: 50,
    max: 99,
    level: "Mid-Level Expert",
    estimatedTime: "2-4 hours",
    description: "Experienced reviewers with specialized skills",
  },
  {
    min: 100,
    max: 199,
    level: "Senior Expert",
    estimatedTime: "1-2 hours",
    description: "Industry leaders with deep expertise",
  },
];

function getBudgetTier(budget: number): BudgetTier {
  const found = budgetTiers.find(tier => budget >= tier.min && budget <= tier.max);
  if (found) return found;
  return budgetTiers[0]!; // Non-null assertion - array is always populated
}

export function ReviewTypeStep({ selectedType, budget, onSelect, onBudgetChange }: ReviewTypeStepProps) {
  const currentTier = getBudgetTier(budget);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Choose your review type
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Select the level of feedback that works for you
        </p>
      </div>

      {/* Review Type Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {reviewTypes.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelect(option.type)}
            className={`
              group relative overflow-hidden rounded-2xl bg-card
              border-2 transition-all duration-200
              p-6 sm:p-8 flex flex-col text-left
              hover:shadow-lg active:scale-[0.98]
              ${
                selectedType === option.type
                  ? "border-accent-blue shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                  : "border-border hover:border-accent-blue/30"
              }
            `}
          >
            {/* Recommended Badge */}
            {option.recommended && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-peach/10 text-accent-peach text-xs font-semibold">
                  <Sparkles className="size-3" />
                  Recommended
                </span>
              </div>
            )}

            {/* Icon */}
            <div
              className={`
                size-14 rounded-xl bg-gradient-to-br ${option.gradientClass}
                flex items-center justify-center mb-4
                group-hover:scale-110 transition-transform duration-200
                ${selectedType === option.type ? "scale-110" : ""}
              `}
            >
              {option.icon}
            </div>

            {/* Title & Price */}
            <div className="mb-2">
              <h3 className="font-bold text-xl text-foreground mb-1">
                {option.title}
              </h3>
              <p className="text-2xl font-bold text-accent-blue">
                {option.price}
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4">
              {option.description}
            </p>

            {/* Response Time Badge */}
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {option.type === "free" ? "24-48 hour response" : "2-6 hour response"}
              </span>
            </div>

            {/* Features List */}
            <ul className="space-y-2 mb-6 flex-1">
              {option.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <Check className="size-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Selected indicator */}
            {selectedType === option.type && (
              <div className="absolute bottom-4 right-4 size-6 rounded-full bg-accent-blue flex items-center justify-center">
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

            {/* Selection button text */}
            <div className="pt-4 border-t border-border">
              <span
                className={`text-sm font-medium ${
                  selectedType === option.type
                    ? "text-accent-blue"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                {selectedType === option.type ? "Selected" : "Select this option"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Dynamic Budget Input for Expert Review */}
      {selectedType === "expert" && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="space-y-6">
              {/* Budget Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-foreground">
                    Set Your Budget
                  </Label>
                  <span className="text-2xl font-bold text-accent-peach">
                    ${budget}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Adjust your budget to match with the right expert level
                </p>
              </div>

              {/* Budget Slider */}
              <div className="space-y-4">
                <input
                  type="range"
                  min="29"
                  max="199"
                  step="10"
                  value={budget}
                  onChange={(e) => onBudgetChange(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer
                    bg-gradient-to-r from-accent-peach/20 to-accent-peach/40
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:size-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-accent-peach
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-webkit-slider-thumb]:active:scale-95
                    [&::-moz-range-thumb]:size-5
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-accent-peach
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:shadow-lg
                    [&::-moz-range-thumb]:transition-transform
                    [&::-moz-range-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:active:scale-95"
                />

                {/* Budget markers */}
                <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                  <span>$29</span>
                  <span>$99</span>
                  <span>$199</span>
                </div>
              </div>

              {/* Tier Information Card */}
              <div className="rounded-xl bg-accent-peach/5 border border-accent-peach/20 p-4 space-y-3">
                {/* Tier Level */}
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-accent-peach to-orange-600 flex items-center justify-center">
                    <Award className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{currentTier.level}</p>
                    <p className="text-xs text-muted-foreground">{currentTier.description}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-accent-peach/10" />

                {/* Estimated Time */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-accent-peach" />
                    <span className="text-foreground font-medium">Estimated Response</span>
                  </div>
                  <span className="text-accent-peach font-semibold">{currentTier.estimatedTime}</span>
                </div>

                {/* Reviewer Match */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-accent-peach" />
                    <span className="text-foreground font-medium">Reviewer Pool</span>
                  </div>
                  <span className="text-accent-peach font-semibold">
                    {budget < 50 ? "15+ experts" : budget < 100 ? "8+ experts" : "3+ experts"}
                  </span>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {budgetTiers.map((tier) => (
                  <button
                    key={tier.min}
                    onClick={() => onBudgetChange(tier.min)}
                    className={`
                      px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium
                      ${
                        budget >= tier.min && budget <= tier.max
                          ? "border-accent-peach bg-accent-peach/5 text-accent-peach"
                          : "border-border text-muted-foreground hover:border-accent-peach/30 hover:text-foreground"
                      }
                    `}
                  >
                    ${tier.min}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="rounded-xl bg-accent-blue/5 border border-accent-blue/20 p-4">
            <div className="flex items-start gap-3">
              <div className="size-5 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="size-3 text-accent-blue" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground italic">
                  "The expert review completely transformed my project. The detailed feedback was worth every penny!"
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Sarah K., UX Designer
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
