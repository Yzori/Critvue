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
import { ReviewEditor } from "@/components/reviewer/review-editor";
import {
  Clock,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Palette,
  Code,
  Video,
  Mic,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getReviewSlot,
  loadDraft,
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
  type ReviewDraft,
} from "@/lib/api/reviewer";

export default function ReviewWritingPage() {
  const router = useRouter();
  const params = useParams();
  const slotId = Number(params.slotId);

  // State
  const [slot, setSlot] = React.useState<ReviewSlot | null>(null);
  const [draft, setDraft] = React.useState<ReviewDraft | null>(null);
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

  // Update countdown every minute
  React.useEffect(() => {
    if (!slot?.claim_deadline) return;

    const interval = setInterval(() => {
      setHoursRemaining(calculateHoursRemaining(slot.claim_deadline!));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [slot]);

  const contentTypeConfig = {
    design: {
      icon: <Palette className="size-5" />,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      label: "Design",
    },
    code: {
      icon: <Code className="size-5" />,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      label: "Code",
    },
    video: {
      icon: <Video className="size-5" />,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      label: "Video",
    },
    audio: {
      icon: <Mic className="size-5" />,
      color: "text-pink-600",
      bg: "bg-pink-500/10",
      label: "Audio",
    },
    writing: {
      icon: <FileText className="size-5" />,
      color: "text-green-600",
      bg: "bg-green-500/10",
      label: "Writing",
    },
    art: {
      icon: <ImageIcon className="size-5" />,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      label: "Art",
    },
  };

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
  const config =
    contentTypeConfig[
      slot.review_request?.content_type as keyof typeof contentTypeConfig
    ] || contentTypeConfig.design;

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
          className="flex-shrink-0"
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
          </div>
        </div>
      </div>

      {/* Deadline Warning Banner */}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor - Takes 2 columns on desktop */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Write Your Review
            </h2>
            <p className="text-sm text-muted-foreground">
              Provide detailed, constructive feedback. Your draft is saved automatically.
            </p>
          </div>

          <ReviewEditor
            slotId={slotId}
            initialDraft={draft}
            onSubmitSuccess={() => {
              router.push("/dashboard?role=reviewer");
            }}
          />
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
                <div className={config.color}>{config.icon}</div>
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

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block text-sm font-medium", className)}>
      {children}
    </label>
  );
}
