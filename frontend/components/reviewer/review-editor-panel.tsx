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
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              💬 Creator's Brief
              {isBriefCollapsed && (
                <span className="text-xs font-normal text-muted-foreground">
                  (Click to view)
                </span>
              )}
            </p>
            {isBriefCollapsed ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="size-4 text-muted-foreground" />
            )}
          </button>
          {!isBriefCollapsed && (
            <div className="mt-2 p-4 rounded-lg bg-white/50 border border-border/50">
              <p className="text-sm text-foreground leading-relaxed">
                {slot.review_request?.description || "No specific guidance provided"}
              </p>
            </div>
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

      {/* Smart Review Editor */}
      <SmartReviewEditor
        slotId={slot.id}
        contentType={slot.review_request?.content_type || "code"}
        imageUrl={imageUrl}
        onSubmitSuccess={onSubmitSuccess}
      />
    </div>
  );
}
