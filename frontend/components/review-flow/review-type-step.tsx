/**
 * Review Type Selection Step - New Tier System
 * Choose between free (AI + Community) or paid (Expert) review
 * For expert reviews, select tier (Quick/Standard/Deep) and provide additional details
 * Enhanced with conversion-optimized UX features
 */

import { ReviewType, ReviewTier, FeedbackPriority } from "@/lib/api/reviews";
import { Sparkles, Award, Check, Clock, Star, Plus, X, Zap, Target, Compass, Shield, Lock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface FreeQuotaInfo {
  used: number;
  limit: number;
  resetAt?: string;
}

interface ReviewTypeStepProps {
  selectedType: ReviewType | null;
  budget: number;
  tier: ReviewTier | null;
  feedbackPriority: FeedbackPriority | null;
  specificQuestions: string[];
  context: string;
  requiresNda?: boolean;
  freeQuotaExceeded?: boolean;
  freeQuotaInfo?: FreeQuotaInfo;
  onSelect: (type: ReviewType) => void;
  onBudgetChange: (budget: number) => void;
  onTierChange: (tier: ReviewTier) => void;
  onFeedbackPriorityChange: (priority: FeedbackPriority) => void;
  onSpecificQuestionsChange: (questions: string[]) => void;
  onContextChange: (context: string) => void;
  onRequiresNdaChange?: (requiresNda: boolean) => void;
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
    price: "Starting at $5",
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

// Tier configuration
interface TierConfig {
  tier: ReviewTier;
  name: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  estimatedTime: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  features: string[];
}

const tierConfigs: TierConfig[] = [
  {
    tier: "quick",
    name: "Quick Feedback",
    priceRange: "$5-15",
    minPrice: 5,
    maxPrice: 15,
    estimatedTime: "24-48 hours",
    description: "Surface-level insights and quick wins",
    icon: <Zap className="size-5 text-white" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    features: ["Quick validation", "200-500 words", "Best for early drafts"],
  },
  {
    tier: "standard",
    name: "Standard Review",
    priceRange: "$25-75",
    minPrice: 25,
    maxPrice: 75,
    estimatedTime: "3-5 days",
    description: "Thorough analysis with actionable insights",
    icon: <Target className="size-5 text-white" />,
    color: "text-accent-peach",
    bgColor: "bg-accent-peach/5",
    features: ["Detailed feedback", "500-1000 words", "Best for production-ready work"],
  },
  {
    tier: "deep",
    name: "Deep Dive Analysis",
    priceRange: "$100-200+",
    minPrice: 100,
    maxPrice: 1000,
    estimatedTime: "5-7 days",
    description: "Comprehensive critique with strategic guidance",
    icon: <Compass className="size-5 text-white" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    features: ["Strategic direction", "1000+ words", "Best for critical projects"],
  },
];

export function ReviewTypeStep({
  selectedType,
  budget,
  tier,
  feedbackPriority,
  specificQuestions,
  context,
  requiresNda = false,
  freeQuotaExceeded = false,
  freeQuotaInfo,
  onSelect,
  onBudgetChange,
  onTierChange,
  onFeedbackPriorityChange,
  onSpecificQuestionsChange,
  onContextChange,
  onRequiresNdaChange,
}: ReviewTypeStepProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [showTierSelection, setShowTierSelection] = useState(false);

  // Handle expert selection - show tier selection view
  const handleExpertSelect = () => {
    onSelect("expert");
    setShowTierSelection(true);
  };

  // Handle back to type selection
  const handleBackToTypeSelection = () => {
    setShowTierSelection(false);
  };

  // Handle tier selection and auto-update budget
  const handleTierSelect = (selectedTier: ReviewTier) => {
    onTierChange(selectedTier);
    const tierConfig = tierConfigs.find((t) => t.tier === selectedTier);
    if (tierConfig) {
      // Set budget to minimum of tier range
      onBudgetChange(tierConfig.minPrice);
    }
  };

  // Handle adding a specific question
  const handleAddQuestion = () => {
    if (newQuestion.trim() && specificQuestions.length < 10) {
      if (newQuestion.trim().length > 500) {
        alert("Each question must be 500 characters or less");
        return;
      }
      onSpecificQuestionsChange([...specificQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  // Handle removing a specific question
  const handleRemoveQuestion = (index: number) => {
    onSpecificQuestionsChange(specificQuestions.filter((_, i) => i !== index));
  };

  // Show tier selection view when expert is selected
  if (selectedType === "expert" && showTierSelection) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Header with back button */}
        <div className="text-center space-y-2">
          <button
            onClick={handleBackToTypeSelection}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to review type
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Choose your expert review tier
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Select the depth of feedback that fits your needs
          </p>
        </div>

        {/* Social Proof */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-peach/5 border border-accent-peach/20">
            <Star className="size-4 text-accent-peach fill-accent-peach" />
            <span className="text-sm font-semibold text-foreground">
              4.9/5 from 2,000+ expert reviews
            </span>
          </div>
        </div>

        {/* Tier Cards - Large and prominent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {tierConfigs.map((tierConfig) => (
            <button
              key={tierConfig.tier}
              onClick={() => handleTierSelect(tierConfig.tier)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-200
                text-left hover:shadow-lg active:scale-[0.98] flex flex-col
                ${
                  tier === tierConfig.tier
                    ? "border-accent-blue bg-accent-blue/5 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                    : "border-border hover:border-accent-blue/30"
                }
              `}
            >
              {/* Icon */}
              <div
                className={`
                  size-12 rounded-xl bg-gradient-to-br mb-4
                  flex items-center justify-center
                  ${
                    tierConfig.tier === "quick"
                      ? "from-blue-500 to-blue-600"
                      : tierConfig.tier === "standard"
                      ? "from-accent-peach to-orange-600"
                      : "from-purple-500 to-purple-600"
                  }
                  ${tier === tierConfig.tier ? "scale-110" : ""}
                  transition-transform duration-200
                `}
              >
                {tierConfig.icon}
              </div>

              {/* Name */}
              <h3 className="font-bold text-xl text-foreground mb-2">
                {tierConfig.name}
              </h3>

              {/* Price Range */}
              <p className="text-2xl font-bold text-accent-blue mb-2">
                {tierConfig.priceRange}
              </p>

              {/* Estimated Time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock className="size-4" />
                <span>{tierConfig.estimatedTime}</span>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                {tierConfig.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {tierConfig.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="size-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Selected indicator */}
              {tier === tierConfig.tier && (
                <div className="absolute top-4 right-4 size-7 rounded-full bg-accent-blue flex items-center justify-center">
                  <Check className="size-4 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Selection text */}
              <div className="pt-3 border-t border-border mt-auto">
                <span
                  className={`text-sm font-medium ${
                    tier === tierConfig.tier
                      ? "text-accent-blue"
                      : "text-muted-foreground"
                  }`}
                >
                  {tier === tierConfig.tier ? "Selected" : "Select this tier"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Rest of expert configuration appears AFTER tier selection */}
        {tier && (
          <>
            {/* Budget Adjustment */}
            <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-foreground">
                    Adjust Budget (Optional)
                  </Label>
                  <span className="text-2xl font-bold text-accent-peach">
                    ${budget}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fine-tune your budget within the {tierConfigs.find((t) => t.tier === tier)?.name} tier range
                </p>

                {/* Budget Slider */}
                <div className="relative pt-2">
                  <input
                    type="range"
                    min={tierConfigs.find((t) => t.tier === tier)?.minPrice}
                    max={tierConfigs.find((t) => t.tier === tier)?.maxPrice}
                    step={tier === "quick" ? 1 : tier === "standard" ? 5 : 10}
                    value={budget}
                    onChange={(e) => onBudgetChange(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-accent-peach/20
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:size-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-accent-peach
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:size-5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-accent-peach
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:cursor-pointer"
                    aria-label="Budget slider"
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${tierConfigs.find((t) => t.tier === tier)?.minPrice}</span>
                  <span>${tierConfigs.find((t) => t.tier === tier)?.maxPrice}{tier === "deep" ? "+" : ""}</span>
                </div>
              </div>
            </div>

            {/* Specific Questions */}
            <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-foreground">
                    Specific Questions (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ask up to 10 specific questions for the reviewer to address
                  </p>
                </div>

                {/* Question List */}
                {specificQuestions.length > 0 && (
                  <div className="space-y-2">
                    {specificQuestions.map((question, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-accent-blue/5 border border-accent-blue/20"
                      >
                        <span className="text-sm font-semibold text-accent-blue flex-shrink-0 mt-0.5">
                          {index + 1}.
                        </span>
                        <p className="text-sm text-foreground flex-1">
                          {question}
                        </p>
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="flex-shrink-0 size-6 rounded-full hover:bg-red-100 flex items-center justify-center text-muted-foreground hover:text-red-600 transition-colors"
                          aria-label="Remove question"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Question Input */}
                {specificQuestions.length < 10 && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="What specific question would you like answered?"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddQuestion();
                          }
                        }}
                        maxLength={500}
                        className="flex-1"
                      />
                      <button
                        onClick={handleAddQuestion}
                        disabled={!newQuestion.trim()}
                        className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-h-[44px]"
                        aria-label="Add question"
                      >
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {specificQuestions.length}/10 questions • {newQuestion.length}/500 characters
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Context */}
            <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-foreground">
                    Project Context (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share any additional context about your project, goals, or constraints
                  </p>
                </div>

                <Textarea
                  placeholder="Example: This is a redesign of our company's homepage. Our goal is to improve conversion rates while maintaining brand consistency. We're particularly concerned about mobile experience..."
                  value={context}
                  onChange={(e) => onContextChange(e.target.value)}
                  maxLength={5000}
                  rows={6}
                  className="resize-none"
                />

                <p className="text-xs text-muted-foreground text-right">
                  {context.length}/5000 characters
                </p>
              </div>
            </div>

            {/* NDA Protection Toggle */}
            {onRequiresNdaChange && (
              <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Shield className="size-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold text-foreground">
                            Require NDA (Confidential Work)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Reviewers must sign a Non-Disclosure Agreement before viewing your work
                          </p>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={requiresNda}
                          onClick={() => onRequiresNdaChange(!requiresNda)}
                          className={`
                            relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full
                            border-2 border-transparent transition-colors duration-200 ease-in-out
                            focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2
                            ${requiresNda ? 'bg-purple-600' : 'bg-muted'}
                          `}
                        >
                          <span
                            className={`
                              pointer-events-none inline-block h-6 w-6 transform rounded-full
                              bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                              ${requiresNda ? 'translate-x-5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* NDA Info when enabled */}
                  {requiresNda && (
                    <div className="mt-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-start gap-3">
                        <Lock className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm">
                          <p className="font-medium text-purple-900 dark:text-purple-100">
                            NDA Protection Enabled
                          </p>
                          <ul className="space-y-1 text-purple-700 dark:text-purple-300">
                            <li className="flex items-start gap-2">
                              <Check className="size-4 flex-shrink-0 mt-0.5" />
                              <span>Reviewers must sign before viewing your request</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="size-4 flex-shrink-0 mt-0.5" />
                              <span>Your work details stay hidden until NDA is signed</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="size-4 flex-shrink-0 mt-0.5" />
                              <span>Full audit trail of all signatures</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Default view: Show Free vs Expert selection
  return (
    <div className="space-y-6">
      {/* Quota Exceeded Banner */}
      {freeQuotaExceeded && freeQuotaInfo && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="size-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Free reviews limit reached
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You've used {freeQuotaInfo.used} of {freeQuotaInfo.limit} free community reviews this month.
                {freeQuotaInfo.resetAt && (
                  <> Resets on {new Date(freeQuotaInfo.resetAt).toLocaleDateString()}.</>
                )}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-medium">
                You can still create expert reviews below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Choose your reviewers
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          What level of depth do you need?
        </p>
      </div>

      {/* Review Type Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {reviewTypes.map((option) => {
          const isFreeDisabled = option.type === "free" && freeQuotaExceeded;

          return (
          <button
            key={option.type}
            onClick={() => {
              if (isFreeDisabled) return;
              option.type === "expert" ? handleExpertSelect() : onSelect(option.type);
            }}
            disabled={isFreeDisabled}
            className={`
              group relative overflow-hidden rounded-2xl bg-card
              border-2 transition-all duration-200
              p-6 sm:p-8 flex flex-col text-left
              ${isFreeDisabled
                ? "opacity-60 cursor-not-allowed border-border"
                : "hover:shadow-lg active:scale-[0.98]"
              }
              ${
                selectedType === option.type
                  ? "border-accent-blue shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                  : isFreeDisabled
                    ? "border-border"
                    : "border-border hover:border-accent-blue/30"
              }
            `}
          >
            {/* Recommended Badge */}
            {option.recommended && !isFreeDisabled && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-peach/10 text-accent-peach text-xs font-semibold">
                  <Sparkles className="size-3" />
                  Recommended
                </span>
              </div>
            )}

            {/* Unavailable Badge for free when quota exceeded */}
            {isFreeDisabled && (
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-semibold">
                  Limit Reached
                </span>
              </div>
            )}

            {/* Icon */}
            <div
              className={`
                size-14 rounded-xl bg-gradient-to-br ${option.gradientClass}
                flex items-center justify-center mb-4
                transition-transform duration-200
                ${isFreeDisabled ? "grayscale opacity-50" : "group-hover:scale-110"}
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
                    : isFreeDisabled
                      ? "text-gray-400"
                      : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                {isFreeDisabled ? "Unavailable" : selectedType === option.type ? "Selected" : "Select this option"}
              </span>
            </div>
          </button>
          );
        })}
      </div>

    </div>
  );
}
