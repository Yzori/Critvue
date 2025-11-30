/**
 * Review Editor Panel
 *
 * Wraps the ReviewEditor for use in the hub workspace:
 * - Shows review request details
 * - Deadline countdown
 * - Embedded review editor
 * - Work Preview Panel for reference while reviewing
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
import { WorkPreviewPanel, type WorkFile } from "@/components/reviewer/smart-review/WorkPreviewPanel";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Play,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
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
  const [isBriefCollapsed, setIsBriefCollapsed] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(true);
  const [previewCollapsed, setPreviewCollapsed] = React.useState(false);

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

  // Convert FileResponse[] to WorkFile[] for WorkPreviewPanel
  const workFiles: WorkFile[] = React.useMemo(() => {
    return files
      .filter((f) => f.file_url) // Only include files with URLs
      .map((f) => ({
        id: f.id,
        file_url: f.file_url!,
        file_type: f.file_type,
        file_name: f.original_filename,
      }));
  }, [files]);

  // Determine if we should show the preview panel (files OR external URL)
  // Get first external link for video/streaming content
  const externalUrl = slot.review_request?.external_links?.[0] || null;
  const hasContentToPreview = workFiles.length > 0 || !!externalUrl;

  // Mobile preview sheet state
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);

  // Check if external URL is a video
  const isVideoContent = React.useMemo(() => {
    if (!externalUrl) return false;
    const videoPatterns = [
      /youtube\.com/i,
      /youtu\.be/i,
      /vimeo\.com/i,
      /twitch\.tv/i,
      /kick\.com/i,
      /loom\.com/i,
      /\.(mp4|webm|mov|avi)$/i,
    ];
    return videoPatterns.some(pattern => pattern.test(externalUrl));
  }, [externalUrl]);

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
            {/* Desktop Preview Toggle */}
            {hasContentToPreview && slot.status !== "submitted" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="hidden lg:flex gap-1.5 text-xs"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="size-3.5" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5" />
                    Show Preview
                  </>
                )}
              </Button>
            )}
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
        /* True Side-by-Side Split Layout */
        <div className="flex">
          {/* LEFT: Sticky Preview Panel - Desktop Only */}
          {showPreview && hasContentToPreview && (
            <div className={cn(
              "hidden lg:block border-r border-border/50 bg-muted/30 transition-all duration-300",
              previewCollapsed ? "w-14" : "w-[420px] min-w-[380px]"
            )}>
              <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-hidden">
                {previewCollapsed ? (
                  /* Collapsed state - thin bar with expand button */
                  <div className="h-full flex flex-col items-center pt-4">
                    <button
                      onClick={() => setPreviewCollapsed(false)}
                      className="p-2 rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 transition-colors"
                      aria-label="Expand preview panel"
                    >
                      <PanelLeft className="size-5 text-accent-blue" />
                    </button>
                    <div className="mt-4 -rotate-90 whitespace-nowrap text-xs font-medium text-muted-foreground">
                      Work Preview
                    </div>
                  </div>
                ) : (
                  /* Expanded preview */
                  <div className="h-full flex flex-col">
                    {/* Preview Header */}
                    <div className="flex items-center justify-between p-3 border-b border-border/50 bg-white/50">
                      <span className="text-sm font-semibold text-foreground">Work Preview</span>
                      <button
                        onClick={() => setPreviewCollapsed(true)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        aria-label="Collapse preview panel"
                      >
                        <PanelLeftClose className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                    {/* Preview Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <WorkPreviewPanel
                        files={workFiles}
                        title={slot.review_request?.title || "Work Preview"}
                        description={slot.review_request?.description}
                        contentType={slot.review_request?.content_type || "code"}
                        externalUrl={externalUrl || undefined}
                      />

                      {/* Creator's Brief in Preview Panel */}
                      <div className="mt-4 p-4 rounded-xl bg-white border border-border/50">
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          💬 Creator's Brief
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {slot.review_request?.description || "No specific guidance provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIGHT: Review Form - Scrollable */}
          <div className="flex-1 min-w-0">
            {/* Brief Card - Only shown on mobile or when preview is hidden */}
            {(!showPreview || !hasContentToPreview) && (
              <div className="p-4 border-b border-border/50 bg-muted/20 lg:hidden">
                <button
                  onClick={() => setIsBriefCollapsed(!isBriefCollapsed)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-white border border-border/50"
                >
                  <span className="text-sm font-semibold text-foreground">💬 Creator's Brief</span>
                  {isBriefCollapsed ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  )}
                </button>
                {!isBriefCollapsed && (
                  <p className="mt-2 p-3 text-sm text-muted-foreground bg-white rounded-lg border border-border/50">
                    {slot.review_request?.description || "No specific guidance provided"}
                  </p>
                )}
              </div>
            )}

            {/* Smart Review Editor */}
            <div className="p-4 sm:p-6">
              <div className="max-w-3xl mx-auto">
                <SmartReviewEditor
                  slotId={slot.id}
                  contentType={slot.review_request?.content_type || "code"}
                  imageUrl={imageUrl}
                  onSubmitSuccess={onSubmitSuccess}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Preview FAB - Bottom Right Corner */}
      {hasContentToPreview && slot.status !== "submitted" && (
        <button
          onClick={() => setIsMobileSheetOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 group"
          aria-label="View work preview"
        >
          {/* Thumbnail preview button */}
          <div className="relative size-16 rounded-2xl shadow-lg border-2 border-accent-blue/30 bg-white overflow-hidden hover:scale-105 active:scale-95 transition-transform">
            {workFiles[0]?.file_type.startsWith("image/") ? (
              <img
                src={getFileUrl(workFiles[0].file_url)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : isVideoContent ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/30">
                <Play className="size-6 text-red-600" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent-blue/10">
                <Eye className="size-6 text-accent-blue" />
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Maximize2 className="size-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
            {/* File count badge */}
            {workFiles.length > 1 && (
              <div className="absolute -top-1 -right-1 size-5 rounded-full bg-accent-blue text-white text-xs font-bold flex items-center justify-center shadow">
                {workFiles.length}
              </div>
            )}
            {/* Video indicator */}
            {isVideoContent && workFiles.length === 0 && (
              <div className="absolute -top-1 -left-1 size-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                <Play className="size-2.5" />
              </div>
            )}
          </div>
          {/* Label below */}
          <span className="block text-[10px] font-medium text-center text-muted-foreground mt-1">
            Preview
          </span>
        </button>
      )}

      {/* Mobile Preview Bottom Sheet */}
      <BottomSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        title="Work Preview"
        description={slot.review_request?.title}
        snapPoints={[85]}
        className="lg:hidden"
      >
        <div className="space-y-4">
          {/* Work Preview Panel */}
          <WorkPreviewPanel
            files={workFiles}
            title={slot.review_request?.title || "Work Preview"}
            description={slot.review_request?.description}
            contentType={slot.review_request?.content_type || "code"}
            externalUrl={externalUrl || undefined}
            className="border-2 border-accent-blue/20"
          />

          {/* Creator's Brief */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              💬 Creator's Brief
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {slot.review_request?.description || "No specific guidance provided"}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent-blue/5 border border-accent-blue/20">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatPayment(slot.payment_amount)}</p>
              <p className="text-xs text-muted-foreground">Payment</p>
            </div>
            <div className="h-8 w-px bg-accent-blue/20" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                {workFiles.length + (externalUrl ? 1 : 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {workFiles.length === 1 && !externalUrl ? "File" : "Items"}
              </p>
            </div>
            <div className="h-8 w-px bg-accent-blue/20" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{config.label}</p>
              <p className="text-xs text-muted-foreground">Type</p>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
