/**
 * Review Editor Panel
 *
 * Wraps the ReviewEditor for use in the hub workspace:
 * - Shows review request details
 * - Deadline countdown
 * - Embedded review editor
 * - Optimized for hub split-screen layout
 *
 * Brand Compliance:
 * - Clean, focused interface
 * - Critvue brand colors
 * - Proper spacing and hierarchy
 */

"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ReviewEditor } from "@/components/reviewer/review-editor";
import {
  AlertCircle,
} from "lucide-react";
import { getContentTypeConfig } from "@/lib/constants/content-types";
import { cn } from "@/lib/utils";
import {
  loadDraft,
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
  type ReviewDraft,
} from "@/lib/api/reviewer";

interface ReviewEditorPanelProps {
  slot: ReviewSlot;
  onSubmitSuccess?: () => void;
}

export function ReviewEditorPanel({
  slot,
  onSubmitSuccess,
}: ReviewEditorPanelProps) {
  const [draft, setDraft] = React.useState<ReviewDraft | null>(null);
  const [hoursRemaining, setHoursRemaining] = React.useState(0);

  // Load draft
  React.useEffect(() => {
    loadDraft(slot.id).then(setDraft);
  }, [slot.id]);

  // Calculate deadline
  React.useEffect(() => {
    if (slot.claim_deadline) {
      setHoursRemaining(calculateHoursRemaining(slot.claim_deadline));
    }
  }, [slot.claim_deadline]);

  // Update countdown every minute
  React.useEffect(() => {
    if (!slot.claim_deadline) return;

    const interval = setInterval(() => {
      setHoursRemaining(calculateHoursRemaining(slot.claim_deadline!));
    }, 60000);

    return () => clearInterval(interval);
  }, [slot]);

  const urgency = getDeadlineUrgency(hoursRemaining);

  // Use shared content type config
  const config = getContentTypeConfig(slot.review_request?.content_type);
  const Icon = config.icon;

  const urgencyConfig = {
    danger: {
      badge: "error" as const,
      border: "border-red-500/30",
      bg: "bg-red-50",
      text: "text-red-700",
    },
    warning: {
      badge: "warning" as const,
      border: "border-amber-500/30",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    safe: {
      badge: "success" as const,
      border: "border-green-500/30",
      bg: "bg-green-50",
      text: "text-green-700",
    },
  };

  const urgencyStyle = urgencyConfig[urgency];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight line-clamp-2">
          {slot.review_request?.title}
        </h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="primary" size="sm">
            {config.label}
          </Badge>
          <Badge variant="secondary" size="sm">
            {formatPayment(slot.payment_amount)}
          </Badge>
          {slot.status === "submitted" && (
            <Badge variant="success" size="sm">
              Submitted
            </Badge>
          )}
        </div>
      </div>

      {/* Deadline Warning Banner */}
      {slot.status !== "submitted" && slot.claim_deadline && (
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border",
            urgencyStyle.bg,
            urgencyStyle.border
          )}
        >
          <AlertCircle className={cn("size-5 flex-shrink-0", urgencyStyle.text)} />
          <div className="flex-1">
            <p className={cn("font-semibold text-sm", urgencyStyle.text)}>
              {hoursRemaining < 1
                ? "Deadline has passed!"
                : hoursRemaining < 6
                  ? "Urgent: Deadline approaching soon!"
                  : hoursRemaining < 24
                    ? "Deadline is today"
                    : "Time remaining"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hoursRemaining < 1
                ? "Please submit as soon as possible"
                : hoursRemaining < 24
                  ? `${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""} left to submit`
                  : `${Math.floor(hoursRemaining / 24)} day${Math.floor(hoursRemaining / 24) !== 1 ? "s" : ""} left to submit`}
            </p>
          </div>
          <Badge variant={urgencyStyle.badge} size="sm" showDot pulse>
            {hoursRemaining < 24 ? `${hoursRemaining}h` : `${Math.floor(hoursRemaining / 24)}d`}
          </Badge>
        </div>
      )}

      {/* Review Request Description */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Request Details
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {slot.review_request?.description || "No description provided"}
        </p>
      </div>

      {/* Review Editor */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            {slot.status === "submitted" ? "Your Review" : "Write Your Review"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {slot.status === "submitted"
              ? "This review has been submitted and is awaiting acceptance."
              : "Provide detailed, constructive feedback. Your draft is saved automatically."}
          </p>
        </div>

        <ReviewEditor
          slotId={slot.id}
          initialDraft={draft}
          onSubmitSuccess={onSubmitSuccess || (() => {})}
        />
      </div>
    </div>
  );
}
