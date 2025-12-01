/**
 * Reviews Hub - Unified Review Workspace
 *
 * Combined workspace for both reviewers and creators:
 * - Toggle between "Reviews I Gave" and "Reviews I Received"
 * - Reviewer mode: Edit and submit reviews
 * - Creator mode: View and accept/reject received reviews
 *
 * Brand Compliance:
 * - Split-screen layout for desktop
 * - Bottom drawer for mobile
 * - Critvue brand colors and spacing
 * - Clean, focused interface
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Inbox,
  Clock,
  User,
  Star,
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActiveReviewsSidebar } from "@/components/reviewer/active-reviews-sidebar";
import { ReviewEditorPanel } from "@/components/reviewer/review-editor-panel";
import { MobileReviewDrawer } from "@/components/reviewer/mobile-review-drawer";
import {
  getMyReviews,
  type ReviewSlot,
} from "@/lib/api/reviewer";
import {
  ReviewSlotWithRequest,
  getPendingReviewsForRequester,
  acceptReviewSlot,
  rejectReviewSlot,
} from "@/lib/api/review-slots";
import { getErrorMessage, getFileUrl } from "@/lib/api/client";
import { AcceptReviewModal, type AcceptReviewData } from "@/components/dashboard/accept-review-modal";
import { RejectReviewModal, type RejectReviewData } from "@/components/dashboard/reject-review-modal";
import { ReviewStudio } from "@/components/reviewer/review-studio/ReviewStudio";
import { getReviewDetail, type ReviewRequestDetail } from "@/lib/api/reviews";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type HubMode = "reviewer" | "creator";

export default function ReviewerHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSlotId = searchParams.get("slot");
  const initialMode = searchParams.get("mode") as HubMode | null;

  // Mode state
  const [mode, setMode] = React.useState<HubMode>(initialMode || "reviewer");

  // Reviewer mode state
  const [allSlots, setAllSlots] = React.useState<ReviewSlot[]>([]);
  const [currentSlot, setCurrentSlot] = React.useState<ReviewSlot | null>(null);
  const [reviewerLoading, setReviewerLoading] = React.useState(true);

  // Creator mode state
  const [pendingReviews, setPendingReviews] = React.useState<ReviewSlotWithRequest[]>([]);
  const [currentPendingSlot, setCurrentPendingSlot] = React.useState<ReviewSlotWithRequest | null>(null);
  const [currentReviewRequest, setCurrentReviewRequest] = React.useState<ReviewRequestDetail | null>(null);
  const [creatorLoading, setCreatorLoading] = React.useState(true);

  // Shared state
  const [error, setError] = React.useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Creator mode: Modal state
  const [isAcceptModalOpen, setIsAcceptModalOpen] = React.useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Update URL when mode changes
  const handleModeChange = React.useCallback((newMode: HubMode) => {
    setMode(newMode);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", newMode);
    window.history.pushState({}, "", url.toString());
  }, []);

  // Clear error when mode changes
  React.useEffect(() => {
    setError(null);
  }, [mode]);

  // Fetch reviewer data (reviews I gave)
  React.useEffect(() => {
    const fetchReviewerData = async () => {
      try {
        setReviewerLoading(true);
        const combinedSlots = await getMyReviews("claimed,submitted");
        setAllSlots(combinedSlots);

        if (initialSlotId) {
          const slot = combinedSlots.find(s => s.id === Number(initialSlotId));
          setCurrentSlot(slot ?? combinedSlots[0] ?? null);
        } else {
          setCurrentSlot(combinedSlots[0] ?? null);
        }
      } catch (err) {
        console.error("Error fetching reviewer data:", err);
        if (mode === "reviewer") {
          setError("Failed to load reviews. Please try again.");
        }
      } finally {
        setReviewerLoading(false);
      }
    };

    fetchReviewerData();
  }, [initialSlotId, mode]);

  // Fetch creator data (reviews I received)
  React.useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setCreatorLoading(true);
        const data = await getPendingReviewsForRequester();
        setPendingReviews(data);

        // Set first pending review as current
        if (data.length > 0) {
          setCurrentPendingSlot(data[0]);
        }
      } catch (err) {
        console.error("Error fetching creator data:", err);
        if (mode === "creator") {
          setError("Failed to load pending reviews. Please try again.");
        }
      } finally {
        setCreatorLoading(false);
      }
    };

    fetchCreatorData();
  }, [mode]);

  // Fetch review request details when current pending slot changes
  React.useEffect(() => {
    const fetchReviewRequest = async () => {
      if (!currentPendingSlot) {
        setCurrentReviewRequest(null);
        return;
      }

      try {
        const requestData = await getReviewDetail(currentPendingSlot.review_request_id);
        setCurrentReviewRequest(requestData);
      } catch (err) {
        console.warn("Failed to fetch review request details:", err);
        setCurrentReviewRequest(null);
      }
    };

    fetchReviewRequest();
  }, [currentPendingSlot]);

  // Handle pending slot switching (creator mode)
  const handlePendingSlotChange = React.useCallback((slotId: number) => {
    const slot = pendingReviews.find(s => s.id === slotId);
    if (slot) {
      setCurrentPendingSlot(slot);
    }
  }, [pendingReviews]);

  // Handle slot switching
  const handleSlotChange = React.useCallback((slotId: number) => {
    const slot = allSlots.find(s => s.id === slotId);
    if (slot) {
      setCurrentSlot(slot);
      // Update URL without reload
      window.history.pushState({}, "", `/reviewer/hub?slot=${slotId}`);
    }
  }, [allSlots]);

  // Handle review submission success (reviewer mode)
  const handleSubmitSuccess = React.useCallback(() => {
    // Refresh the list and stay in hub
    getMyReviews("claimed,submitted").then(slots => {
      setAllSlots(slots);
      if (slots.length === 0) {
        // No reviews left, go to dashboard
        router.push("/dashboard?role=reviewer");
      } else if (slots[0]) {
        // Stay in hub, switch to first available review
        setCurrentSlot(slots[0]);
      }
    });
  }, [router]);

  // Handle accept review (creator mode)
  const handleAccept = async (data: AcceptReviewData) => {
    if (!currentPendingSlot) return;

    try {
      setIsSubmitting(true);
      await acceptReviewSlot(currentPendingSlot.id, data);

      // Remove from list and switch to next
      const remaining = pendingReviews.filter(f => f.id !== currentPendingSlot.id);
      setPendingReviews(remaining);
      setCurrentPendingSlot(remaining[0] ?? null);
      setIsAcceptModalOpen(false);
      toast.success("Review accepted successfully!");
    } catch (err) {
      console.error("Error accepting review:", err);
      toast.error(`Failed to accept review: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject review (creator mode)
  const handleReject = async (data: RejectReviewData) => {
    if (!currentPendingSlot) return;

    try {
      setIsSubmitting(true);
      await rejectReviewSlot(currentPendingSlot.id, data);

      // Remove from list and switch to next
      const remaining = pendingReviews.filter(f => f.id !== currentPendingSlot.id);
      setPendingReviews(remaining);
      setCurrentPendingSlot(remaining[0] ?? null);
      setIsRejectModalOpen(false);
      toast.success("Review rejected successfully");
    } catch (err) {
      console.error("Error rejecting review:", err);
      toast.error(`Failed to reject review: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Creator mode helper functions
  const getUrgency = (autoAcceptAt?: string): { hours: number; isUrgent: boolean } => {
    if (!autoAcceptAt) return { hours: 0, isUrgent: false };
    const now = new Date();
    const deadline = new Date(autoAcceptAt);
    const hoursRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
    return { hours: hoursRemaining, isUrgent: hoursRemaining < 24 };
  };

  const formatTimeRemaining = (hours: number): string => {
    if (hours < 1) return "Less than 1 hour";
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  // Keyboard shortcuts for review switching
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + 1-9: Switch to review by index
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (allSlots[index]) {
          handleSlotChange(allSlots[index].id);
        }
      }

      // Cmd/Ctrl + ArrowUp/ArrowDown: Previous/Next review
      if ((e.metaKey || e.ctrlKey) && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const currentIndex = allSlots.findIndex(s => s.id === currentSlot?.id);
        if (currentIndex === -1) return;

        let nextIndex: number;
        if (e.key === "ArrowUp") {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : allSlots.length - 1;
        } else {
          nextIndex = currentIndex < allSlots.length - 1 ? currentIndex + 1 : 0;
        }

        const nextSlot = allSlots[nextIndex];
        if (nextSlot) {
          handleSlotChange(nextSlot.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allSlots, currentSlot, handleSlotChange]);

  // Determine loading state based on current mode
  const isLoading = mode === "reviewer" ? reviewerLoading : creatorLoading;

  // Count urgent reviews for creator mode
  const urgentCount = pendingReviews.filter(f => getUrgency(f.auto_accept_at).isUrgent).length;

  if (isLoading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-32" />
          <span className="sr-only">Loading your reviews...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="mt-3"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="flex-shrink-0 min-h-[48px] min-w-[48px]"
        >
          <ArrowLeft className="size-5" />
        </Button>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => handleModeChange("reviewer")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === "reviewer"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PenLine className="size-4" />
            <span className="hidden sm:inline">I Gave</span>
            {allSlots.length > 0 && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                mode === "reviewer" ? "bg-accent-blue/10 text-accent-blue" : "bg-muted-foreground/20"
              )}>
                {allSlots.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleModeChange("creator")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === "creator"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Inbox className="size-4" />
            <span className="hidden sm:inline">I Received</span>
            {pendingReviews.length > 0 && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                mode === "creator"
                  ? urgentCount > 0 ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"
                  : "bg-muted-foreground/20"
              )}>
                {pendingReviews.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {mode === "reviewer" ? "Reviews I Gave" : "Reviews I Received"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mode === "reviewer"
              ? `${allSlots.length} active review${allSlots.length !== 1 ? "s" : ""}`
              : `${pendingReviews.length} pending${urgentCount > 0 ? ` (${urgentCount} urgent)` : ""}`}
          </p>
        </div>
      </div>

      {/* Main Content - Conditional based on mode */}
      {mode === "reviewer" ? (
        <>
          {/* Reviewer Mode: Split Layout */}
          {allSlots.length === 0 || !currentSlot ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-md">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <PenLine className="size-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">No Active Reviews</h2>
                <p className="text-muted-foreground">
                  You don't have any reviews in progress. Browse available review requests to get started.
                </p>
                <Button
                  onClick={() => router.push("/dashboard?role=reviewer")}
                  className="bg-accent-blue hover:bg-accent-blue/90 text-white"
                >
                  Find Reviews
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Main Editor Panel - 70% */}
              <div className="flex-1 overflow-y-auto">
                <ReviewEditorPanel
                  slot={currentSlot}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              </div>

              {/* Sidebar - 30% - Desktop only */}
              <div
                className={cn(
                  "hidden lg:flex flex-col border-l border-border bg-card transition-all duration-300",
                  isSidebarCollapsed ? "w-[60px]" : "w-[400px]"
                )}
              >
                {/* Collapse/Expand Button */}
                <div className="flex items-center justify-between p-3 border-b border-border">
                  {!isSidebarCollapsed && (
                    <span className="text-sm font-semibold text-foreground">Active Reviews</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className={cn(
                      "flex-shrink-0",
                      isSidebarCollapsed && "mx-auto"
                    )}
                    title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {isSidebarCollapsed ? (
                      <ChevronLeft className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </Button>
                </div>

                {/* Sidebar Content */}
                {!isSidebarCollapsed && (
                  <div className="flex-1 overflow-y-auto">
                    <ActiveReviewsSidebar
                      slots={allSlots}
                      currentSlotId={currentSlot.id}
                      onSlotChange={handleSlotChange}
                    />
                  </div>
                )}

                {/* Collapsed State - Show minimal info */}
                {isSidebarCollapsed && (
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {allSlots.map((slot, index) => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotChange(slot.id)}
                        className={cn(
                          "w-full size-10 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                          slot.id === currentSlot.id
                            ? "bg-accent-blue text-white"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                        title={slot.review_request?.title || `Review ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Bottom Drawer - Reviewer Mode */}
          {allSlots.length > 0 && currentSlot && (
            <>
              <div
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                }}
              >
                <Button
                  variant="outline"
                  className="w-full min-h-[48px]"
                  onClick={() => setIsMobileDrawerOpen(true)}
                >
                  Switch Review ({allSlots.length} active)
                </Button>
              </div>

              <MobileReviewDrawer
                slots={allSlots}
                currentSlotId={currentSlot.id}
                isOpen={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
                onSlotChange={handleSlotChange}
              />
            </>
          )}
        </>
      ) : (
        <>
          {/* Creator Mode: ReviewStudio Split Layout */}
          {pendingReviews.length === 0 || !currentPendingSlot ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-md">
                <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">All Caught Up!</h2>
                <p className="text-muted-foreground">
                  No pending reviews to accept or reject at this time.
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Main ReviewStudio Panel */}
              <div className="flex-1 overflow-hidden">
                <ReviewStudio
                  slotId={currentPendingSlot.id}
                  contentType={currentReviewRequest?.content_type || currentPendingSlot.review_request.content_type || "design"}
                  contentSubcategory={currentReviewRequest?.content_subcategory}
                  imageUrl={getFileUrl(currentReviewRequest?.files?.[0]?.file_url) || undefined}
                  externalUrl={currentReviewRequest?.external_links?.[0] || null}
                  mode="creator"
                  reviewerName={currentPendingSlot.reviewer?.full_name}
                  onAccept={() => setIsAcceptModalOpen(true)}
                  onReject={() => setIsRejectModalOpen(true)}
                  onRequestRevision={() => setIsRejectModalOpen(true)}
                  className="h-full"
                />
              </div>

              {/* Sidebar - Pending Reviews List - Desktop only */}
              {pendingReviews.length > 1 && (
                <div
                  className={cn(
                    "hidden lg:flex flex-col border-l border-border bg-card transition-all duration-300",
                    isSidebarCollapsed ? "w-[60px]" : "w-[320px]"
                  )}
                >
                  {/* Collapse/Expand Button */}
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    {!isSidebarCollapsed && (
                      <span className="text-sm font-semibold text-foreground">Pending Reviews</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      className={cn(
                        "flex-shrink-0",
                        isSidebarCollapsed && "mx-auto"
                      )}
                      title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                      {isSidebarCollapsed ? (
                        <ChevronLeft className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </Button>
                  </div>

                  {/* Sidebar Content - Full */}
                  {!isSidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {pendingReviews.map((slot) => {
                        const urgency = getUrgency(slot.auto_accept_at);
                        const isActive = slot.id === currentPendingSlot.id;

                        return (
                          <button
                            key={slot.id}
                            onClick={() => handlePendingSlotChange(slot.id)}
                            className={cn(
                              "w-full p-3 rounded-lg text-left transition-all",
                              isActive
                                ? "bg-accent-blue/10 border-2 border-accent-blue"
                                : "bg-background border border-border hover:border-accent-blue/50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground line-clamp-1">
                                {slot.review_request.title}
                              </span>
                              {urgency.isUrgent && (
                                <Zap className="size-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="size-3" />
                              <span className="truncate">{slot.reviewer?.full_name || "Anonymous"}</span>
                            </div>
                            {slot.auto_accept_at && (
                              <div className={cn(
                                "text-xs mt-1",
                                urgency.isUrgent ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {formatTimeRemaining(urgency.hours)}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Collapsed State - Show minimal info */}
                  {isSidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {pendingReviews.map((slot, index) => {
                        const urgency = getUrgency(slot.auto_accept_at);

                        return (
                          <button
                            key={slot.id}
                            onClick={() => handlePendingSlotChange(slot.id)}
                            className={cn(
                              "w-full size-10 rounded-lg flex items-center justify-center text-xs font-bold transition-colors relative",
                              slot.id === currentPendingSlot.id
                                ? "bg-accent-blue text-white"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            )}
                            title={slot.review_request.title}
                          >
                            {index + 1}
                            {urgency.isUrgent && (
                              <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile Bottom Drawer - Creator Mode */}
          {pendingReviews.length > 1 && currentPendingSlot && (
            <div
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <Button
                variant="outline"
                className="w-full min-h-[48px]"
                onClick={() => setIsMobileDrawerOpen(true)}
              >
                Switch Review ({pendingReviews.length} pending)
              </Button>
            </div>
          )}

          {/* Creator Mode: Modals */}
          {currentPendingSlot && (
            <>
              <AcceptReviewModal
                isOpen={isAcceptModalOpen}
                onClose={() => setIsAcceptModalOpen(false)}
                onAccept={handleAccept}
                reviewerName={currentPendingSlot.reviewer?.full_name}
                isSubmitting={isSubmitting}
              />
              <RejectReviewModal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onReject={handleReject}
                reviewerName={currentPendingSlot.reviewer?.full_name}
                isSubmitting={isSubmitting}
                isPaidReview={currentPendingSlot.payment_amount !== undefined && currentPendingSlot.payment_amount > 0}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
