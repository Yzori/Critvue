/**
 * Review Writing Page
 *
 * Full interface for writing a review with:
 * - Review request details sidebar
 * - Rich text editor with auto-save
 * - Rating system
 * - File upload
 * - Quality checklist
 * - Deadline countdown
 *
 * Brand Compliance:
 * - Clean, focused writing interface
 * - Critvue brand colors
 * - Minimal distractions
 * - Clear save/submit states
 * - Mobile-friendly responsive design
 */

"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SmartReviewEditor } from "@/components/reviewer/smart-review";
import {
  Clock,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getReviewSlot,
  getMyReviews,
  loadDraft,
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
  type ReviewDraft,
} from "@/lib/api/reviewer";
import { getReviewFiles, type FileResponse } from "@/lib/api/files";
import { getContentTypeConfig } from "@/lib/constants/content-types";

export default function ReviewWritingPage() {
  const router = useRouter();
  const params = useParams();
  const slotId = Number(params.slotId);

  // State
  const [slot, setSlot] = React.useState<ReviewSlot | null>(null);
  const [draft, setDraft] = React.useState<ReviewDraft | null>(null);
  const [files, setFiles] = React.useState<FileResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Deadline countdown
  const [hoursRemaining, setHoursRemaining] = React.useState(0);

  // Fetch slot and draft
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [slotData, draftData] = await Promise.all([
          getReviewSlot(slotId),
          loadDraft(slotId),
        ]);

        setSlot(slotData);
        setDraft(draftData);

        // Fetch uploaded files for the review request
        if (slotData.review_request_id) {
          try {
            const filesData = await getReviewFiles(slotData.review_request_id);
            setFiles(filesData);
          } catch (filesError) {
            console.log("No files found for this review");
            setFiles([]);
          }
        }

        // Calculate initial deadline
        if (slotData.claim_deadline) {
          setHoursRemaining(calculateHoursRemaining(slotData.claim_deadline));
        }
      } catch (err) {
        console.error("Error fetching slot:", err);
        setError("Failed to load review. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slotId]);

  // Auto-redirect to hub mode if reviewer has 2+ active reviews
  React.useEffect(() => {
    const checkForHubMode = async () => {
      try {
        // Use multi-status query (single API call)
        const allActive = await getMyReviews("claimed,submitted");

        // If 2+ reviews, redirect to hub mode
        if (allActive.length >= 2) {
          router.push(`/reviewer/hub?slot=${slotId}`);
        }
      } catch (err) {
        // Silently fail - stay on single review page
        console.error("Error checking for hub mode:", err);
      }
    };

    checkForHubMode();
  }, [slotId, router]);

  // Update countdown every minute
  React.useEffect(() => {
    if (!slot?.claim_deadline) return;

    const interval = setInterval(() => {
      setHoursRemaining(calculateHoursRemaining(slot.claim_deadline!));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [slot]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded-xl w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-muted rounded-2xl" />
            <div className="h-96 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !slot) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error || "Review slot not found"}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard?role=reviewer")}
            className="mt-3"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const urgency = getDeadlineUrgency(hoursRemaining);
  const config = getContentTypeConfig(slot.review_request?.content_type);
  const Icon = config.icon;

  const urgencyConfig = {
    danger: {
      badge: "error" as const,
      border: "border-red-500/30",
      bg: "bg-red-50",
      text: "text-red-600",
    },
    warning: {
      badge: "warning" as const,
      border: "border-amber-500/30",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    safe: {
      badge: "success" as const,
      border: "border-green-500/30",
      bg: "bg-green-50",
      text: "text-green-600",
    },
  };

  const urgencyStyle = urgencyConfig[urgency];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard?role=reviewer")}
          className="flex-shrink-0 min-h-[48px] min-w-[48px]"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight line-clamp-2">
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
                ✓ Submitted
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Deadline Warning Banner - Only show for claimed reviews */}
      {slot.status === "claimed" && (
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor - Takes 2 columns on desktop */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
          {slot.status === "submitted" ? (
            /* Submitted - Waiting for Acceptance View */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-900">Review Submitted Successfully!</h2>
                  <p className="text-sm text-green-700">
                    Waiting for requester acceptance
                  </p>
                </div>
              </div>

              <div className="p-5 bg-green-50 rounded-xl border-2 border-green-500/30">
                <p className="text-sm font-medium text-green-900 mb-2">
                  ⏰ Auto-accept Countdown
                </p>
                <p className="text-sm text-green-700">
                  If the requester doesn't respond, your review will be automatically accepted on{" "}
                  <strong>{slot.auto_accept_at ? new Date(slot.auto_accept_at).toLocaleDateString() : "7 days from submission"}</strong>
                </p>
              </div>

              <div className="p-5 bg-green-50 rounded-xl border-2 border-green-500/30">
                <p className="text-sm font-medium text-green-900 mb-2">
                  💰 Payment Status
                </p>
                <p className="text-sm text-green-700">
                  Your payment of <strong>{formatPayment(slot.payment_amount)}</strong> will be released once the requester accepts your review or after auto-accept.
                </p>
              </div>

              <Button
                onClick={() => router.push("/dashboard?role=reviewer")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          ) : slot.status === "accepted" ? (
            /* Accepted - Completed Review View */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-green-600 flex items-center justify-center">
                  <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-900">Review Accepted!</h2>
                  <p className="text-sm text-green-700">
                    Your review has been accepted by the requester
                  </p>
                </div>
              </div>

              <div className="p-5 bg-green-50 rounded-xl border-2 border-green-500/30">
                <p className="text-sm font-medium text-green-900 mb-2">
                  ✅ Review Complete
                </p>
                <p className="text-sm text-green-700">
                  This review is now complete and locked. Thank you for your contribution!
                </p>
              </div>

              <div className="p-5 bg-green-50 rounded-xl border-2 border-green-500/30">
                <p className="text-sm font-medium text-green-900 mb-2">
                  💰 Payment Status
                </p>
                <p className="text-sm text-green-700">
                  Your payment of <strong>{formatPayment(slot.payment_amount)}</strong> has been released.
                </p>
              </div>

              <Button
                onClick={() => router.push("/dashboard?role=reviewer")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          ) : slot.status === "rejected" ? (
            /* Rejected Review View */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-900">Review Rejected</h2>
                  <p className="text-sm text-red-700">
                    The requester has rejected this review
                  </p>
                </div>
              </div>

              <div className="p-5 bg-red-50 rounded-xl border-2 border-red-500/30">
                <p className="text-sm font-medium text-red-900 mb-2">
                  ❌ Rejection Notice
                </p>
                <p className="text-sm text-red-700">
                  You may dispute this decision if you believe it was unfair.
                </p>
              </div>

              <Button
                onClick={() => router.push("/dashboard?role=reviewer")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          ) : slot.status !== "claimed" ? (
            /* Other non-editable states (abandoned, disputed, available) */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-gray-400 flex items-center justify-center">
                  <AlertCircle className="size-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Review Not Editable</h2>
                  <p className="text-sm text-gray-700">
                    This review slot is in &quot;{slot.status}&quot; status and cannot be edited
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.push("/dashboard?role=reviewer")}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          ) : (
            /* Review Editor for claimed reviews */
            <>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                  Write Your Review
                </h2>
                <p className="text-sm text-muted-foreground">
                  Provide detailed, constructive feedback. Your draft is saved automatically.
                </p>
              </div>

              <SmartReviewEditor
                slotId={slotId}
                contentType={slot?.review_request?.content_type || "design"}
                contentSubcategory={slot?.review_request?.content_subcategory}
                imageUrl={
                  // For design/art reviews, pass the first image file URL
                  (slot?.review_request?.content_type === "design" ||
                   slot?.review_request?.content_type === "art")
                    ? files.find((f) => f.file_type.startsWith("image/"))?.file_url || undefined
                    : undefined
                }
                onSubmitSuccess={() => {
                  router.push("/dashboard?role=reviewer");
                }}
              />
            </>
          )}
        </div>

        {/* Review Request Details - Sidebar */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Review Details
          </h2>

          {/* Content Type */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-muted-foreground">
              Content Type
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <div className={cn("size-8 rounded-lg flex items-center justify-center", config.bg)}>
                <Icon className={cn("size-5", config.color)} />
              </div>
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-muted-foreground">
              Description
            </Label>
            <p className="mt-2 text-sm text-foreground leading-relaxed">
              {slot.review_request?.description || "No description provided"}
            </p>
          </div>

          {/* Review Type */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-muted-foreground">
              Review Type
            </Label>
            <div className="mt-2">
              <Badge variant="secondary" size="sm">
                {slot.review_request?.review_type === "free"
                  ? "Quick Feedback"
                  : "Expert Review"}
              </Badge>
            </div>
          </div>

          {/* Deadline */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-muted-foreground">
              Submission Deadline
            </Label>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-sm">
                {slot.claim_deadline
                  ? new Date(slot.claim_deadline).toLocaleString()
                  : "No deadline"}
              </span>
            </div>
          </div>

          {/* View Original Request */}
          {slot.review_request_id && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() =>
                router.push(`/review/${slot.review_request_id}`)
              }
            >
              View Full Request
              <ExternalLink className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
