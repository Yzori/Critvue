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
import { Button } from "@/components/ui/button";
import { SmartReviewEditor } from "@/components/reviewer/smart-review";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getContentTypeConfig } from "@/lib/constants/content-types";
import { cn } from "@/lib/utils";
import {
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
} from "@/lib/api/reviewer";
import { getReviewFiles, type FileResponse } from "@/lib/api/files";

interface ReviewEditorPanelProps {
  slot: ReviewSlot;
  onSubmitSuccess?: () => void;
}

export function ReviewEditorPanel({
  slot,
  onSubmitSuccess,
}: ReviewEditorPanelProps) {
  const [hoursRemaining, setHoursRemaining] = React.useState(0);
  const [files, setFiles] = React.useState<FileResponse[]>([]);
  const [isBriefCollapsed, setIsBriefCollapsed] = React.useState(false);

  // Fetch files for the review request
  React.useEffect(() => {
    const fetchFiles = async () => {
      if (slot.review_request_id) {
        try {
          const filesData = await getReviewFiles(slot.review_request_id);
          setFiles(filesData);
        } catch (error) {
          console.error("Error fetching files:", error);
          setFiles([]);
        }
      }
    };
    fetchFiles();
  }, [slot.review_request_id]);

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

  // Calculate imageUrl for design/art reviews
  const imageUrl = React.useMemo(() => {
    const isDesignOrArt = slot.review_request?.content_type === "design" ||
                         slot.review_request?.content_type === "art";

    if (isDesignOrArt) {
      const imageFile = files.find((f) => f.file_type.startsWith("image/"));
      return imageFile?.file_url || undefined;
    }

    return undefined;
  }, [slot.review_request?.content_type, files]);

  return (
    <div className="p-4 sm:p-5 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Prominent Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-peach/10 border-2 border-accent-blue/20 p-4 sm:p-5 md:p-6">
        <div className="flex items-start gap-4 mb-3">
          <div className={cn("size-14 rounded-xl flex items-center justify-center flex-shrink-0", config.bg)}>
            <Icon className={cn("size-8", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight mb-2">
              {slot.review_request?.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary" size="lg">
                {config.label}
              </Badge>
              <Badge variant="secondary" size="lg">
                {formatPayment(slot.payment_amount)}
              </Badge>
              {slot.status === "submitted" && (
                <Badge variant="success" size="lg">
                  ✓ Submitted
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Request Context */}
        <div className="mt-3">
          <button
            onClick={() => setIsBriefCollapsed(!isBriefCollapsed)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-white/50 border border-border/50 hover:bg-white/70 transition-colors"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                💬 Creator's Brief
                {isBriefCollapsed && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (Click to view)
                  </span>
                )}
              </p>
              {/* Deadline badge when collapsed */}
              {isBriefCollapsed && slot.status !== "submitted" && slot.claim_deadline && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                  urgency === "danger" ? "bg-red-100 text-red-700" :
                  urgency === "warning" ? "bg-amber-100 text-amber-700" :
                  "bg-green-100 text-green-700"
                )}>
                  ⏱ {hoursRemaining < 24 ? `${hoursRemaining}h` : `${Math.floor(hoursRemaining / 24)}d`} left
                </span>
              )}
            </div>
            {isBriefCollapsed ? (
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronUp className="size-4 text-muted-foreground shrink-0" />
            )}
          </button>
          {!isBriefCollapsed && (
            <div className="mt-2 p-4 rounded-lg bg-white/50 border border-border/50 relative">
              {/* Deadline badge when expanded - top right corner */}
              {slot.status !== "submitted" && slot.claim_deadline && (
                <div className={cn(
                  "absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5",
                  urgency === "danger" ? "bg-red-100 text-red-700 ring-1 ring-red-300" :
                  urgency === "warning" ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" :
                  "bg-green-100 text-green-700 ring-1 ring-green-300"
                )}>
                  <span className={cn(
                    "size-1.5 rounded-full",
                    urgency === "danger" ? "bg-red-600 animate-pulse" :
                    urgency === "warning" ? "bg-amber-600 animate-pulse" :
                    "bg-green-600"
                  )} />
                  {hoursRemaining < 24 ? `${hoursRemaining}h` : `${Math.floor(hoursRemaining / 24)}d`} left
                </div>
              )}
              <p className="text-sm text-foreground leading-relaxed pr-20">
                {slot.review_request?.description || "No specific guidance provided"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Conditional rendering based on status */}
      {slot.status === "submitted" ? (
        /* Submitted Confirmation View */
        <div className="rounded-xl border-2 border-green-500/30 bg-green-50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-900">Review Submitted Successfully!</h3>
              <p className="text-sm text-green-700">
                Waiting for requester acceptance
              </p>
            </div>
          </div>

          {slot.auto_accept_at && (
            <div className="p-4 bg-white/50 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-1">
                ⏰ Auto-accept Countdown
              </p>
              <p className="text-xs text-green-700">
                If the requester doesn't respond, your review will be automatically accepted on{" "}
                <strong>{new Date(slot.auto_accept_at).toLocaleDateString()}</strong>
              </p>
            </div>
          )}

          <div className="p-4 bg-white/50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">
              💰 Payment Status
            </p>
            <p className="text-xs text-green-700">
              Your payment of <strong>{formatPayment(slot.payment_amount)}</strong> will be released once the requester accepts your review or after auto-accept.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/dashboard?role=reviewer"}
              className="flex-1"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        /* Smart Review Editor for claimed reviews */
        <SmartReviewEditor
          slotId={slot.id}
          contentType={slot.review_request?.content_type || "code"}
          imageUrl={imageUrl}
          onSubmitSuccess={onSubmitSuccess}
        />
      )}
    </div>
  );
}
