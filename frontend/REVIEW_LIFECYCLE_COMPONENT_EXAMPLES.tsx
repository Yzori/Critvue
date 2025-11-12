/**
 * Review Lifecycle - Component Code Examples
 *
 * This file contains implementation examples for the key UX components
 * described in REVIEW_LIFECYCLE_UX_DESIGN.md
 *
 * Brand Compliance: All components follow Critvue design system
 * - Shadows: tiered system (xs, md, lg, xl, 2xl)
 * - Colors: CSS variables (--accent-blue, --accent-peach, etc.)
 * - Spacing: 4pt/8pt scale
 * - Touch targets: 44px+ minimum
 * - Accessibility: WCAG 2.1 Level AA
 */

import { useState } from 'react';
import {
  Clock,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Users,
  Star,
  RefreshCw,
  Zap,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ============================================================================
// 1. NUMBER OF REVIEWS SELECTOR
// ============================================================================

interface NumberOfReviewsSelectorProps {
  reviewType: 'free' | 'expert';
  value: number;
  onChange: (value: number) => void;
  budgetPerReview?: number; // For expert reviews
}

export function NumberOfReviewsSelector({
  reviewType,
  value,
  onChange,
  budgetPerReview = 29,
}: NumberOfReviewsSelectorProps) {
  const maxReviews = reviewType === 'free' ? 3 : 10;
  const totalBudget = reviewType === 'expert' ? value * budgetPerReview : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold text-foreground">
          How many {reviewType === 'free' ? 'reviews' : 'expert reviews'} do you want?
        </Label>
        <p className="text-sm text-muted-foreground">
          {reviewType === 'free'
            ? 'Get up to 3 different perspectives (free)'
            : `Choose 1-10 expert reviewers • $${budgetPerReview} per review`}
        </p>
      </div>

      {/* Value Display */}
      <div className="flex items-baseline justify-center gap-3">
        <span className="text-6xl font-bold text-foreground">{value}</span>
        <span className="text-2xl text-muted-foreground">
          review{value !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Slider */}
      <div className="relative py-4">
        {/* Progress fill background */}
        <div className="absolute inset-x-0 top-8 h-2 rounded-full bg-accent-blue/20 pointer-events-none" />
        <div
          className="absolute left-0 top-8 h-2 rounded-full bg-gradient-to-r from-accent-blue/40 to-accent-blue pointer-events-none transition-all duration-200"
          style={{ width: `${((value - 1) / (maxReviews - 1)) * 100}%` }}
        />

        {/* Slider input - Enhanced for touch */}
        <input
          type="range"
          min="1"
          max={maxReviews}
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-12 rounded-full appearance-none cursor-pointer bg-transparent touch-manipulation
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:size-12
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-accent-blue
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-accent-blue/30
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:scale-95
            [&::-webkit-slider-thumb]:ring-4
            [&::-webkit-slider-thumb]:ring-white
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:size-12
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-accent-blue
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-lg
            [&::-moz-range-thumb]:shadow-accent-blue/30
            [&::-moz-range-thumb]:transition-transform
            [&::-moz-range-thumb]:hover:scale-110
            [&::-moz-range-thumb]:active:scale-95
            [&::-moz-range-thumb]:ring-4
            [&::-moz-range-thumb]:ring-white
            [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-thumb]:active:cursor-grabbing"
          aria-label={`Number of reviews: ${value}`}
        />

        {/* Range markers */}
        <div className="flex justify-between text-xs text-muted-foreground px-0.5 mt-2">
          <span>1</span>
          {reviewType === 'expert' && <span>5</span>}
          <span>{maxReviews}</span>
        </div>
      </div>

      {/* Quick select buttons */}
      <div className={cn(
        "grid gap-2",
        reviewType === 'free' ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-6"
      )}>
        {reviewType === 'free' ? (
          <>
            {[1, 2, 3].map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => onChange(num)}
                className={cn(
                  "min-h-[48px] transition-all",
                  value === num
                    ? "border-accent-blue bg-accent-blue/5 text-accent-blue"
                    : "hover:border-accent-blue/30"
                )}
              >
                {num}
              </Button>
            ))}
          </>
        ) : (
          <>
            {[1, 2, 3, 5, 7, 10].map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => onChange(num)}
                className={cn(
                  "min-h-[48px] transition-all",
                  value === num
                    ? "border-accent-peach bg-accent-peach/5 text-accent-peach"
                    : "hover:border-accent-peach/30"
                )}
              >
                {num}
              </Button>
            ))}
          </>
        )}
      </div>

      {/* Info card */}
      {reviewType === 'expert' ? (
        <div className="rounded-xl bg-accent-peach/5 border border-accent-peach/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Total Budget</span>
            <span className="text-2xl font-bold text-accent-peach">${totalBudget}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {value} expert review{value !== 1 ? 's' : ''} × ${budgetPerReview} each
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-accent-blue/5 border border-accent-blue/20 p-4">
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
              <Users className="size-4 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                💡 Pro Tip
              </p>
              <p className="text-xs text-muted-foreground">
                Request 2-3 reviews to get diverse feedback and identify common themes across reviewers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. PENDING REVIEW ALERT BANNER
// ============================================================================

interface PendingReviewAlertProps {
  pendingCount: number;
  daysRemaining: number;
  onReviewNow: () => void;
}

export function PendingReviewAlert({
  pendingCount,
  daysRemaining,
  onReviewNow,
}: PendingReviewAlertProps) {
  const isUrgent = daysRemaining <= 2;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        "flex items-center justify-between gap-4 flex-wrap",
        isUrgent
          ? "border-red-200 bg-red-50 animate-pulse-subtle"
          : "border-amber-200 bg-amber-50"
      )}
    >
      <div className="flex items-center gap-3">
        <Clock className={cn(
          "size-6",
          isUrgent ? "text-red-600" : "text-amber-600"
        )} />
        <div>
          <p className={cn(
            "font-semibold",
            isUrgent ? "text-red-900" : "text-amber-900"
          )}>
            {isUrgent ? '🚨 ' : '⏰ '}
            You have {pendingCount} review{pendingCount !== 1 ? 's' : ''} awaiting your feedback
          </p>
          <p className={cn(
            "text-sm",
            isUrgent ? "text-red-700 font-medium" : "text-amber-700"
          )}>
            Auto-accepting in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <Button
        className={cn(
          "text-white min-h-[44px] shadow-lg",
          isUrgent
            ? "bg-red-600 hover:bg-red-700"
            : "bg-amber-600 hover:bg-amber-700"
        )}
        onClick={onReviewNow}
      >
        {isUrgent ? 'Review Immediately' : 'Review Now'} →
      </Button>
    </div>
  );
}

// ============================================================================
// 3. AUTO-ACCEPT TIMER
// ============================================================================

interface AutoAcceptTimerProps {
  hoursRemaining: number;
  onReviewNow?: () => void;
}

export function AutoAcceptTimer({
  hoursRemaining,
  onReviewNow,
}: AutoAcceptTimerProps) {
  const daysRemaining = Math.floor(hoursRemaining / 24);
  const hoursOnly = hoursRemaining % 24;

  // Determine urgency state
  const urgency = hoursRemaining < 24 ? 'urgent' : hoursRemaining < 72 ? 'warning' : 'normal';

  const configs = {
    urgent: {
      icon: <AlertCircle className="size-5 text-red-600" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-900',
      accentColor: 'text-red-700',
      showButton: true,
    },
    warning: {
      icon: <AlertTriangle className="size-4 text-amber-600" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-400',
      textColor: 'text-amber-900',
      accentColor: 'text-amber-700',
      showButton: false,
    },
    normal: {
      icon: <Clock className="size-4 text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      accentColor: 'text-blue-700',
      showButton: false,
    },
  };

  const config = configs[urgency];

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-3 sm:p-4",
        config.bgColor,
        config.borderColor,
        urgency === 'urgent' && "shadow-lg animate-pulse"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {config.icon}
        <span className={cn(
          "font-bold",
          urgency === 'urgent' ? "text-base" : "text-sm",
          config.textColor
        )}>
          {urgency === 'urgent' ? 'AUTO-ACCEPTS IN ' : 'Auto-accepts in '}
          <span className={urgency === 'urgent' ? "text-lg" : ""}>
            {daysRemaining > 0
              ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} ${hoursOnly} hour${hoursOnly !== 1 ? 's' : ''}`
              : `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`
            }
          </span>
        </span>
      </div>

      <p className={cn(
        "text-xs mb-3",
        config.accentColor,
        urgency === 'urgent' && "font-medium"
      )}>
        {urgency === 'urgent'
          ? 'Act now to review before auto-accept'
          : urgency === 'warning'
          ? 'Review soon to maintain quality'
          : 'Please review and accept/reject'
        }
      </p>

      {config.showButton && onReviewNow && (
        <Button
          className="w-full bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
          onClick={onReviewNow}
        >
          Review Now
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// 4. MULTI-REVIEW STATUS CARD
// ============================================================================

interface ReviewSlot {
  id: string;
  status: 'accepted' | 'pending' | 'in_progress' | 'available';
  reviewer?: {
    username: string;
    rating?: number;
  };
  submittedAt?: Date;
  claimedAt?: Date;
  acceptedAt?: Date;
  dueAt?: Date;
  preview?: string;
  autoAcceptHours?: number;
}

interface MultiReviewStatusCardProps {
  title: string;
  reviewType: 'free' | 'expert';
  totalRequested: number;
  slots: ReviewSlot[];
  onReadReview: (reviewId: string) => void;
  onBoostVisibility?: () => void;
}

export function MultiReviewStatusCard({
  title,
  reviewType,
  totalRequested,
  slots,
  onReadReview,
  onBoostVisibility,
}: MultiReviewStatusCardProps) {
  const acceptedCount = slots.filter(s => s.status === 'accepted').length;
  const pendingCount = slots.filter(s => s.status === 'pending').length;
  const inProgressCount = slots.filter(s => s.status === 'in_progress').length;
  const availableCount = slots.filter(s => s.status === 'available').length;

  const completionPercentage = Math.round((acceptedCount / totalRequested) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6
                    shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
                    hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)]
                    transition-all duration-200">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg sm:text-xl font-bold text-foreground">{title}</h3>
          <button className="text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {reviewType === 'expert' ? 'Expert Review' : 'Quick Feedback'} • Requested 2 days ago
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Progress: {acceptedCount} of {totalRequested} reviews completed
          </span>
          <span className="text-muted-foreground">{completionPercentage}%</span>
        </div>

        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              completionPercentage === 100 ? "bg-green-500" :
              pendingCount > 0 ? "bg-amber-500" :
              "bg-accent-sage"
            )}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Status Pills */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{acceptedCount}</div>
          <div className="text-xs text-green-600">Accepted</div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
          <div className="text-xs text-amber-600">Review</div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
          <div className="text-xs text-blue-600">Progress</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
          <div className="text-2xl font-bold text-gray-700">{availableCount}</div>
          <div className="text-xs text-gray-600">Open</div>
        </div>
      </div>

      {/* Individual Review Slots */}
      <div className="space-y-3">
        {slots.map((slot) => (
          <ReviewSlotCard
            key={slot.id}
            slot={slot}
            onReadReview={() => onReadReview(slot.id)}
          />
        ))}

        {/* Available slot with boost option */}
        {availableCount > 0 && onBoostVisibility && (
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="size-5 text-gray-500" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  {availableCount} slot{availableCount !== 1 ? 's' : ''} available
                </h4>
                <p className="text-sm text-muted-foreground">
                  Waiting for reviewers to claim
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={onBoostVisibility}
            >
              <Zap className="size-4 mr-2" />
              Boost Visibility
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 5. REVIEW SLOT CARD (sub-component)
// ============================================================================

interface ReviewSlotCardProps {
  slot: ReviewSlot;
  onReadReview: () => void;
}

function ReviewSlotCard({ slot, onReadReview }: ReviewSlotCardProps) {
  if (slot.status === 'accepted') {
    return (
      <div
        className="rounded-xl border border-green-200 bg-green-50/50 p-4
                   hover:shadow-md transition-all cursor-pointer group"
        onClick={onReadReview}
      >
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-green-600 flex items-center justify-center">
            <Check className="size-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-foreground">
                Review by @{slot.reviewer?.username}
              </h4>
              <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {slot.reviewer?.rating && (
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-3",
                      i < slot.reviewer!.rating!
                        ? "text-amber-500 fill-amber-500"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            )}

            {slot.preview && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {slot.preview}
              </p>
            )}

            <p className="text-xs text-green-700 font-medium">
              Accepted {formatTimeAgo(slot.acceptedAt!)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (slot.status === 'pending') {
    return (
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="size-5 text-amber-700" />
          <Badge variant="warning" showDot pulse>
            ACTION NEEDED
          </Badge>
        </div>

        <div className="mb-3">
          <h4 className="font-semibold text-foreground mb-1">
            Review by @{slot.reviewer?.username}
          </h4>
          <p className="text-sm text-muted-foreground">
            Submitted {formatTimeAgo(slot.submittedAt!)}
          </p>
        </div>

        {slot.autoAcceptHours && (
          <div className="rounded-lg bg-white/80 border border-amber-200 p-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-amber-600" />
              <span className="font-medium text-amber-900">
                Auto-accepts in{' '}
                <span className="font-bold">
                  {Math.floor(slot.autoAcceptHours / 24)} days{' '}
                  {slot.autoAcceptHours % 24} hours
                </span>
              </span>
            </div>
          </div>
        )}

        <Button
          className="w-full bg-amber-600 hover:bg-amber-700 text-white
                     min-h-[48px] font-semibold shadow-lg"
          onClick={onReadReview}
        >
          Read & Review
        </Button>
      </div>
    );
  }

  if (slot.status === 'in_progress') {
    const hoursRemaining = slot.dueAt
      ? Math.max(0, (slot.dueAt.getTime() - Date.now()) / (1000 * 60 * 60))
      : 0;
    const progress = Math.max(0, Math.min(100, ((48 - hoursRemaining) / 48) * 100));

    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
            <RefreshCw className="size-5 text-blue-600 animate-spin-slow" />
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              Review in progress by @{slot.reviewer?.username}
            </h4>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>Claimed {formatTimeAgo(slot.claimedAt!)}</span>
              </div>

              <div className="rounded-lg bg-white border border-blue-200 p-2">
                <p className="text-xs text-blue-700 font-medium mb-2">
                  Due in {Math.floor(hoursRemaining)} hours
                </p>
                <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================================
// 6. REJECT REVIEW MODAL
// ============================================================================

interface RejectReviewModalProps {
  reviewerName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, explanation?: string) => void;
}

const rejectionReasons = [
  {
    id: 'low_quality',
    label: 'Low quality / Not helpful',
    description: 'Review lacks depth or actionable feedback',
  },
  {
    id: 'off_topic',
    label: "Off-topic / Didn't address my questions",
    description: "Reviewer didn't focus on requested feedback areas",
  },
  {
    id: 'spam',
    label: 'Spam or abusive content',
    description: 'Review contains inappropriate or harmful content',
  },
  {
    id: 'plagiarized',
    label: 'Plagiarized or AI-generated',
    description: 'Content appears copied or entirely automated',
  },
  {
    id: 'other',
    label: 'Other (please explain)',
    description: 'Specify your reason below',
  },
];

export function RejectReviewModal({
  reviewerName,
  isOpen,
  onClose,
  onConfirm,
}: RejectReviewModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [explanation, setExplanation] = useState('');

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(
        selectedReason,
        selectedReason === 'other' ? explanation : undefined
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Why are you rejecting this review?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Please help us understand why this review didn't meet your expectations.
            This helps us maintain quality standards.
          </p>

          {/* Reason Selection */}
          <div className="space-y-3 mb-6">
            {rejectionReasons.map((reason) => (
              <label
                key={reason.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all min-h-[64px]",
                  "hover:bg-accent/5",
                  selectedReason === reason.id
                    ? "border-accent-blue bg-accent-blue/5"
                    : "border-border"
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-1 size-4"
                />
                <div>
                  <p className="font-semibold text-foreground">{reason.label}</p>
                  <p className="text-sm text-muted-foreground">{reason.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Additional explanation (shown when "Other" is selected) */}
          {selectedReason === 'other' && (
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">
                Additional details (required for "Other")
              </Label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg border border-border
                           focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                placeholder="Please explain why you're rejecting this review..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {explanation.length} / 20 characters minimum
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="size-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">Important</p>
                <p className="text-sm text-amber-800">
                  Rejecting a review is permanent and will:
                </p>
                <ul className="text-sm text-amber-800 list-disc ml-4 mt-1 space-y-1">
                  <li>Return the review slot to available</li>
                  <li>Not refund the reviewer (they still get paid for effort)</li>
                  <li>Allow you to request a replacement review</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 min-h-[48px]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                !selectedReason ||
                (selectedReason === 'other' && explanation.length < 20)
              }
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300
                         text-white min-h-[48px] px-8"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Custom animation for subtle pulse
const customCSS = `
@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.9;
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
`;
