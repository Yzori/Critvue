/**
 * Review Type Selection Step
 * Choose between free (AI + Community) or paid (Expert) review
 * Includes dynamic budget input for expert reviews
 * Enhanced with conversion-optimized UX features
 */

import { ReviewType } from "@/lib/api/reviews";
import { Sparkles, Award, Check, Clock, Users, Star, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useState } from "react";

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
  expertCount: string;
  detailsOnHover: {
    features: string[];
    avgDeliveryTime: string;
  };
}

const budgetTiers: BudgetTier[] = [
  {
    min: 29,
    max: 49,
    level: "Junior Expert",
    estimatedTime: "4-6 hours",
    description: "Emerging professionals with solid fundamentals",
    expertCount: "15+ experts",
    detailsOnHover: {
      features: ["Written review", "Basic video feedback", "Email follow-up"],
      avgDeliveryTime: "Same day",
    },
  },
  {
    min: 50,
    max: 99,
    level: "Mid-Level Expert",
    estimatedTime: "2-4 hours",
    description: "Experienced reviewers with specialized skills",
    expertCount: "8+ experts",
    detailsOnHover: {
      features: ["Detailed written review", "Full video walkthrough", "30min live Q&A"],
      avgDeliveryTime: "Within 3 hours",
    },
  },
  {
    min: 100,
    max: 199,
    level: "Senior Expert",
    estimatedTime: "1-2 hours",
    description: "Industry leaders with deep expertise",
    expertCount: "3+ experts",
    detailsOnHover: {
      features: ["Comprehensive analysis", "Extended video", "60min consultation", "Follow-up session"],
      avgDeliveryTime: "Within 2 hours",
    },
  },
];

// Mock reviewer avatars data
const getReviewersForTier = (budget: number) => {
  if (budget < 50) {
    return {
      visible: 4,
      total: 15,
      colors: ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-yellow-500"],
    };
  } else if (budget < 100) {
    return {
      visible: 3,
      total: 8,
      colors: ["bg-indigo-500", "bg-pink-500", "bg-teal-500"],
    };
  } else {
    return {
      visible: 2,
      total: 3,
      colors: ["bg-violet-500", "bg-rose-500"],
    };
  }
};

function getBudgetTier(budget: number): BudgetTier {
  const found = budgetTiers.find(tier => budget >= tier.min && budget <= tier.max);
  if (found) return found;
  return budgetTiers[0]!; // Non-null assertion - array is always populated
}

// Calculate progress percentage for slider fill
function getBudgetProgress(budget: number): number {
  const min = 29;
  const max = 199;
  return ((budget - min) / (max - min)) * 100;
}

export function ReviewTypeStep({ selectedType, budget, onSelect, onBudgetChange }: ReviewTypeStepProps) {
  const currentTier = getBudgetTier(budget);
  const reviewers = getReviewersForTier(budget);
  const budgetProgress = getBudgetProgress(budget);
  const [showWhyExpert, setShowWhyExpert] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

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

            {/* Selected indicator - Enhanced visibility */}
            {selectedType === option.type && (
              <div className="absolute bottom-4 right-4 size-7 rounded-full bg-accent-blue flex items-center justify-center">
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
          {/* Single Social Proof Stat - Minimal */}
          <div className="text-center animate-in fade-in delay-100">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-peach/5 border border-accent-peach/20">
              <Star className="size-4 text-accent-peach fill-accent-peach" />
              <span className="text-sm font-semibold text-foreground">
                4.9/5 from 2,000+ expert reviews
              </span>
            </div>
          </div>

          {/* Value Proposition - Single Sentence */}
          <div className="text-center animate-in fade-in delay-150">
            <p className="text-base text-muted-foreground">
              Get detailed feedback from professional reviewers in as fast as 2 hours
            </p>
          </div>

          {/* Main Budget Section */}
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

              {/* Enhanced Budget Slider with Progress Fill */}
              <div className="space-y-4">
                <div className="relative">
                  {/* Progress fill background */}
                  <div className="absolute inset-0 h-2 rounded-full bg-accent-peach/20 pointer-events-none" />
                  <div
                    className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-accent-peach/40 to-accent-peach pointer-events-none transition-all duration-200"
                    style={{ width: `${budgetProgress}%` }}
                  />

                  {/* Slider input - Enhanced for touch with 48px thumb */}
                  <input
                    type="range"
                    min="29"
                    max="199"
                    step="10"
                    value={budget}
                    onChange={(e) => onBudgetChange(Number(e.target.value))}
                    className="relative w-full h-12 rounded-full appearance-none cursor-pointer bg-transparent touch-manipulation
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:size-12
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-accent-peach
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:shadow-accent-peach/30
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-webkit-slider-thumb]:active:scale-95
                      [&::-webkit-slider-thumb]:ring-4
                      [&::-webkit-slider-thumb]:ring-white
                      [&::-webkit-slider-thumb]:cursor-grab
                      [&::-webkit-slider-thumb]:active:cursor-grabbing
                      [&::-moz-range-thumb]:size-12
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-accent-peach
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:shadow-lg
                      [&::-moz-range-thumb]:shadow-accent-peach/30
                      [&::-moz-range-thumb]:transition-transform
                      [&::-moz-range-thumb]:hover:scale-110
                      [&::-moz-range-thumb]:active:scale-95
                      [&::-moz-range-thumb]:ring-4
                      [&::-moz-range-thumb]:ring-white
                      [&::-moz-range-thumb]:cursor-grab
                      [&::-moz-range-thumb]:active:cursor-grabbing"
                    aria-label="Budget slider"
                  />
                </div>

                {/* Budget markers */}
                <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                  <span>$29</span>
                  <span>$99</span>
                  <span>$199</span>
                </div>
              </div>

              {/* Simplified Quick Select Buttons - Enhanced touch targets */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {budgetTiers.map((tier) => (
                  <button
                    key={tier.min}
                    onClick={() => onBudgetChange(tier.min)}
                    className={`
                      w-full px-3 py-3 sm:py-2 min-h-[48px] rounded-lg border-2 transition-all text-sm font-medium touch-manipulation active:scale-95
                      ${
                        budget >= tier.min && budget <= tier.max
                          ? "border-accent-peach bg-accent-peach/5 text-accent-peach"
                          : "border-border text-muted-foreground hover:border-accent-peach/30 hover:text-foreground"
                      }
                    `}
                    aria-label={`Set budget to ${tier.min} dollars`}
                  >
                    ${tier.min}
                  </button>
                ))}
              </div>

              {/* Simple Budget Context */}
              <div className="text-center text-xs text-muted-foreground">
                <p>
                  ${budgetTiers[0]!.min}-{budgetTiers[0]!.max}: {budgetTiers[0]!.level} •
                  ${budgetTiers[1]!.min}-{budgetTiers[1]!.max}: {budgetTiers[1]!.level} •
                  ${budgetTiers[2]!.min}+: {budgetTiers[2]!.level}
                </p>
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
                    {currentTier.expertCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-3">
            {/* Compare Plans Expandable - Enhanced touch target */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="w-full flex items-center justify-between p-4 min-h-[56px] hover:bg-accent/5 transition-colors touch-manipulation active:scale-[0.99]"
                aria-expanded={showComparison}
                aria-label="Compare free and expert review plans"
              >
                <div className="flex items-center gap-2">
                  <Award className="size-5 text-accent-peach" />
                  <span className="text-sm font-semibold text-foreground">Compare Free vs Expert</span>
                </div>
                {showComparison ? (
                  <ChevronUp className="size-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-5 text-muted-foreground" />
                )}
              </button>

              {showComparison && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="border-t border-border pt-3 mb-3" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {/* Header */}
                    <div className="font-medium text-muted-foreground text-xs">Free Review</div>
                    <div className="font-medium text-accent-peach text-xs">Expert Review</div>

                    {/* Comparison rows */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Check className="size-3 text-muted-foreground" />
                      <span className="text-xs">AI Analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="size-3 text-green-600" />
                      <span className="text-xs font-medium">AI + Human Expert</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Check className="size-3 text-muted-foreground" />
                      <span className="text-xs">Basic Feedback</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="size-3 text-green-600" />
                      <span className="text-xs font-medium">In-depth Analysis</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-3 flex-shrink-0"></span>
                      <span className="text-xs">No video review</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="size-3 text-green-600" />
                      <span className="text-xs font-medium">Video Walkthrough</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-3 flex-shrink-0"></span>
                      <span className="text-xs">No follow-up</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="size-3 text-green-600" />
                      <span className="text-xs font-medium">1-on-1 Session</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="size-3 text-muted-foreground" />
                      <span className="text-xs">24-48 hours</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock className="size-3 text-green-600" />
                      <span className="text-xs font-medium">2-6 hours</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Why Expert? Expandable Section - Enhanced touch target */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <button
                onClick={() => setShowWhyExpert(!showWhyExpert)}
                className="w-full flex items-center justify-between p-4 min-h-[56px] hover:bg-accent/5 transition-colors touch-manipulation active:scale-[0.99]"
                aria-expanded={showWhyExpert}
                aria-label="Learn why to choose expert review"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-accent-peach" />
                  <span className="text-sm font-semibold text-foreground">Why choose Expert Review?</span>
                </div>
                {showWhyExpert ? (
                  <ChevronUp className="size-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-5 text-muted-foreground" />
                )}
              </button>

              {showWhyExpert && (
                <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="border-t border-border pt-3" />

                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                        <Users className="size-4 text-accent-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Personalized Human Touch</p>
                        <p className="text-xs text-muted-foreground">
                          Get feedback from real professionals who understand your industry and context, not just algorithms.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-accent-peach/10 flex items-center justify-center flex-shrink-0">
                        <Award className="size-4 text-accent-peach" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Actionable Insights</p>
                        <p className="text-xs text-muted-foreground">
                          Receive detailed, implementable recommendations based on real-world experience and best practices.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="size-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">Faster Results</p>
                        <p className="text-xs text-muted-foreground">
                          Expert reviews are prioritized with response times as fast as 1-2 hours, so you can iterate quickly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
