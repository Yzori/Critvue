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
      <div className="sticky top-0 z-20 bg-gradient-to-r from-accent-blue/5 via-white to-accent-peach/5 border-b border-border/50 backdrop-blur-sm">
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
                  <Badge variant="success" size="sm">
                    ✓ Submitted
                  </Badge>
                )}
                {slot.status !== "submitted" && slot.claim_deadline && (
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
          <div className="max-w-2xl mx-auto rounded-xl border-2 border-green-500/30 bg-green-50 p-6 space-y-4">
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
        </div>
      ) : (
        /* Review Studio - Full-screen split layout */
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
