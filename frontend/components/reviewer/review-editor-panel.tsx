/**
 * Review Editor Panel
 *
 * Wrapper for the Review Studio in the hub workspace:
 * - Shows review request header with status
 * - Deadline countdown
 * - Full Review Studio experience
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
import { ReviewStudio } from "@/components/reviewer/review-studio";
import { getContentTypeConfig } from "@/lib/constants/content-types";
import { cn } from "@/lib/utils";
import {
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
} from "@/lib/api/reviewer";
import { getReviewFiles, type FileResponse } from "@/lib/api/files";
import { getFileUrl } from "@/lib/api/client";

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

  // Calculate imageUrl for design/art reviews
  const imageUrl = React.useMemo(() => {
    const isDesignOrArt = slot.review_request?.content_type === "design" ||
                         slot.review_request?.content_type === "art";

    if (isDesignOrArt) {
      const imageFile = files.find((f) => f.file_type.startsWith("image/"));
      // Use getFileUrl to convert relative paths to absolute URLs
      return imageFile?.file_url ? getFileUrl(imageFile.file_url) : undefined;
    }

    return undefined;
  }, [slot.review_request?.content_type, files]);

  // Get first external link for video/streaming content
  const externalUrl = slot.review_request?.external_links?.[0] || null;

  return (
    <div className="min-h-full">
      {/* Compact Header Bar - Full Width */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-accent-blue/5 via-white to-accent-peach/5 dark:from-accent-blue/10 dark:via-[var(--dark-tier-2)] dark:to-accent-peach/10 border-b border-border/50 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={cn("size-10 rounded-xl flex items-center justify-center flex-shrink-0", config.bg)}>
              <Icon className={cn("size-5", config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">
                {slot.review_request?.title}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {config.label}
                </Badge>
                <Badge variant="secondary" size="sm">
                  {formatPayment(slot.payment_amount)}
                </Badge>
                {slot.status === "submitted" && (
                  <Badge variant="warning" size="sm">
                    Awaiting Response
                  </Badge>
                )}
                {slot.status === "accepted" && (
                  <Badge variant="success" size="sm">
                    Accepted
                  </Badge>
                )}
                {slot.status === "rejected" && (
                  <Badge variant="error" size="sm">
                    Rejected
                  </Badge>
                )}
                {slot.status === "elaboration_requested" && (
                  <Badge variant="warning" size="sm">
                    Needs Elaboration
                  </Badge>
                )}
                {slot.status === "claimed" && slot.claim_deadline && (
                  <Badge
                    variant={urgency === "danger" ? "error" : urgency === "warning" ? "warning" : "success"}
                    size="sm"
                  >
                    {hoursRemaining < 24 ? `${hoursRemaining}h` : `${Math.floor(hoursRemaining / 24)}d`} left
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional rendering based on status */}
      {slot.status === "submitted" ? (
        /* Submitted Confirmation View */
        <div className="p-4 sm:p-6">
          <div className="max-w-2xl mx-auto rounded-xl border-2 border-green-500/30 bg-green-50 dark:bg-[var(--dark-tier-3)] dark:border-green-500/40 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-400">Review Submitted Successfully!</h3>
                <p className="text-sm text-green-700 dark:text-green-300/80">
                  Waiting for requester acceptance
                </p>
              </div>
            </div>

            {slot.auto_accept_at && (
              <div className="p-4 bg-white/50 dark:bg-[var(--dark-tier-2)] rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-400 mb-1">
                  Auto-accept Countdown
                </p>
                <p className="text-xs text-green-700 dark:text-green-300/70">
                  If the requester doesn't respond, your review will be automatically accepted on{" "}
                  <strong className="dark:text-green-300">{new Date(slot.auto_accept_at).toLocaleDateString()}</strong>
                </p>
              </div>
            )}

            <div className="p-4 bg-white/50 dark:bg-[var(--dark-tier-2)] rounded-lg">
              <p className="text-sm font-medium text-green-900 dark:text-green-400 mb-2">
                Payment Status
              </p>
              <p className="text-xs text-green-700 dark:text-green-300/70">
                Your payment of <strong className="dark:text-green-300">{formatPayment(slot.payment_amount)}</strong> will be released once the requester accepts your review or after auto-accept.
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
        </div>
      ) : slot.status === "accepted" ? (
        /* Accepted Confirmation View */
        <div className="p-4 sm:p-6">
          <div className="max-w-2xl mx-auto rounded-xl border-2 border-emerald-500/30 bg-emerald-50 dark:bg-[var(--dark-tier-3)] dark:border-emerald-500/40 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-400">Review Accepted!</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300/80">
                  The requester has approved your review
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/50 dark:bg-[var(--dark-tier-2)] rounded-lg">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-400 mb-2">
                Payment Complete
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300/70">
                Your payment of <strong className="dark:text-emerald-300">{formatPayment(slot.payment_amount)}</strong> has been processed and added to your account.
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
        </div>
      ) : slot.status === "rejected" ? (
        /* Rejected View */
        <div className="p-4 sm:p-6">
          <div className="max-w-2xl mx-auto rounded-xl border-2 border-red-500/30 bg-red-50 dark:bg-[var(--dark-tier-3)] dark:border-red-500/40 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-400">Review Rejected</h3>
                <p className="text-sm text-red-700 dark:text-red-300/80">
                  The requester has declined your review
                </p>
              </div>
            </div>

            {(slot as { rejection_reason?: string }).rejection_reason && (
              <div className="p-4 bg-white/50 dark:bg-[var(--dark-tier-2)] rounded-lg">
                <p className="text-sm font-medium text-red-900 dark:text-red-400 mb-2">
                  Rejection Reason
                </p>
                <p className="text-xs text-red-700 dark:text-red-300/70">
                  {(slot as { rejection_reason?: string }).rejection_reason}
                </p>
              </div>
            )}

            <div className="p-4 bg-white/50 dark:bg-[var(--dark-tier-2)] rounded-lg">
              <p className="text-sm font-medium text-red-900 dark:text-red-400 mb-2">
                What Happens Next
              </p>
              <p className="text-xs text-red-700 dark:text-red-300/70">
                This review will not count towards your completion stats. You can find new review opportunities in the dashboard.
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
        </div>
      ) : (
        /* Review Studio - Full-screen split layout (for claimed and elaboration_requested) */
        <div className="h-[calc(100vh-120px)]">
          <ReviewStudio
            slotId={slot.id}
            contentType={slot.review_request?.content_type || "code"}
            contentSubcategory={(slot.review_request as { content_subcategory?: string })?.content_subcategory}
            imageUrl={imageUrl}
            externalUrl={externalUrl}
            onSubmitSuccess={onSubmitSuccess}
          />
        </div>
      )}
    </div>
  );
}
