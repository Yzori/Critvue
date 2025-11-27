"use client";

/**
 * Mobile-First Creator Dashboard Component
 *
 * Optimized for mobile devices with:
 * - Swipeable review cards with quick actions
 * - Pull-to-refresh functionality
 * - Urgency-based sorting
 * - Progressive disclosure
 * - Touch-optimized interactions
 * - Bottom tab navigation integration
 *
 * Features:
 * - Actions Needed Tab: Urgent reviews requiring accept/reject
 * - My Requests Tab: Overview of all review requests with progress
 * - Activity Tab: Recent activity and notifications
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SwipeableReviewCard,
} from "./swipeable-review-card";
import { PullToRefresh } from "./pull-to-refresh";
import {
  getActionsNeeded,
  getMyRequests,
  type PendingReviewItem,
  type MyRequestItem,
} from "@/lib/api/dashboard";
import {
  acceptReview,
  rejectReview,
} from "@/lib/api/review-slots";
import {
  CheckCircle2,
  Clock,
  Inbox,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
  Zap,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  BatchAcceptButton,
  SelectionModeToggle,
} from "./batch-accept-button";

type DashboardTab = "actions" | "requests" | "activity";

interface MobileCreatorDashboardProps {
  className?: string;
}

export default function MobileCreatorDashboard({ className }: MobileCreatorDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("actions");
  const [pendingReviews, setPendingReviews] = React.useState<PendingReviewItem[]>([]);
  const [myRequests, setMyRequests] = React.useState<MyRequestItem[]>([]);
  const [isLoadingActions, setIsLoadingActions] = React.useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [urgentCount, setUrgentCount] = React.useState(0);

  // Batch selection state
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  // Auto-refresh interval (30 seconds)
  const autoRefreshInterval = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch pending reviews (actions needed)
  const fetchPendingReviews = React.useCallback(async () => {
    try {
      const response = await getActionsNeeded(1, 20);
      setPendingReviews(response.items);
      setUrgentCount(response.summary.critical_count);
    } catch (error) {
      console.error("Failed to fetch pending reviews:", error);
      toast.error("Failed to load pending reviews");
    } finally {
      setIsLoadingActions(false);
    }
  }, []);

  // Fetch my requests
  const fetchMyRequests = React.useCallback(async () => {
    try {
      const response = await getMyRequests(undefined, 1, 20);
      setMyRequests(response.items);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      toast.error("Failed to load review requests");
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchPendingReviews();
    fetchMyRequests();
  }, [fetchPendingReviews, fetchMyRequests]);

  // Auto-refresh setup
  React.useEffect(() => {
    // Set up auto-refresh every 30 seconds
    autoRefreshInterval.current = setInterval(() => {
      fetchPendingReviews();
      fetchMyRequests();
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [fetchPendingReviews, fetchMyRequests]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchPendingReviews(), fetchMyRequests()]);
    setIsRefreshing(false);
    toast.success("Dashboard updated");
  };

  // Handle accept review with optimistic update
  const handleAcceptReview = async (slotId: number) => {
    // Optimistic update - remove from list immediately
    setPendingReviews(prev => prev.filter(r => r.slot_id !== slotId));
    setUrgentCount(prev => Math.max(0, prev - 1));

    try {
      await acceptReview(slotId, {
        helpful_rating: 5,
      });

      toast.success("Review accepted!");

      // Refresh data in background
      fetchPendingReviews();
      fetchMyRequests();
    } catch (error) {
      console.error("Failed to accept review:", error);
      toast.error(`Failed to accept: ${getErrorMessage(error)}`);

      // Revert optimistic update on error
      fetchPendingReviews();
    }
  };

  // Handle reject review with optimistic update
  const handleRejectReview = async (slotId: number) => {
    // Optimistic update - remove from list immediately
    setPendingReviews(prev => prev.filter(r => r.slot_id !== slotId));
    setUrgentCount(prev => Math.max(0, prev - 1));

    try {
      await rejectReview(slotId, {
        rejection_reason: "low_quality",
        rejection_notes: "Review did not meet expectations",
      });

      toast.success("Review rejected");

      // Refresh data in background
      fetchPendingReviews();
      fetchMyRequests();
    } catch (error) {
      console.error("Failed to reject review:", error);
      toast.error(`Failed to reject: ${getErrorMessage(error)}`);

      // Revert optimistic update on error
      fetchPendingReviews();
    }
  };

  // Calculate stats for My Requests tab
  const totalRequests = myRequests.length;
  const completedRequests = myRequests.filter(r => r.status === "completed").length;
  const activeRequests = myRequests.filter(r => r.status === "in_review" || r.status === "pending").length;

  // Handle batch selection toggle
  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds([]);
  };

  // Handle card selection
  const handleCardSelect = (slotId: number) => {
    setSelectedIds(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Handle batch accept success
  const handleBatchAcceptSuccess = () => {
    setSelectionMode(false);
    setSelectedIds([]);
    fetchPendingReviews();
    fetchMyRequests();
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedIds([]);
    setSelectionMode(false);
  };

  return (
    <div className={cn("space-y-4 pb-20", className)}>
      {/* Mobile Tab Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-2">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveTab("actions")}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[48px]",
              "flex items-center justify-center gap-2",
              activeTab === "actions"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="size-4" />
            <span>Actions</span>
            {urgentCount > 0 && (
              <Badge variant="error" size="sm" className="ml-1">
                {urgentCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[48px]",
              "flex items-center justify-center gap-2",
              activeTab === "requests"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="size-4" />
            <span>Requests</span>
            <Badge variant="secondary" size="sm" className="ml-1">
              {myRequests.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[48px]",
              "flex items-center justify-center gap-2",
              activeTab === "activity"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="size-4" />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* Content with Pull-to-Refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <AnimatePresence mode="wait">
          {/* Actions Needed Tab */}
          {activeTab === "actions" && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Stats Summary & Selection Toggle */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="size-5 text-red-500" />
                      <span className="text-xs font-medium text-muted-foreground">Urgent</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{urgentCount}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="size-5 text-amber-500" />
                      <span className="text-xs font-medium text-muted-foreground">Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{pendingReviews.length}</div>
                  </div>
                </div>
              </div>

              {/* Selection Mode Toggle - Only show if there are pending reviews */}
              {pendingReviews.length > 1 && (
                <div className="flex justify-end">
                  <SelectionModeToggle
                    isActive={selectionMode}
                    count={selectedIds.length}
                    onToggle={handleToggleSelectionMode}
                  />
                </div>
              )}

              {/* Pending Reviews List */}
              <div className="space-y-3">
                {isLoadingActions ? (
                  // Loading skeleton
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : pendingReviews.length === 0 ? (
                  // Empty state
                  <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="size-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      All Caught Up!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      No reviews waiting for your action right now.
                    </p>
                    <Button
                      onClick={() => router.push("/review/new")}
                      className="bg-accent-blue hover:bg-accent-blue/90 min-h-[48px]"
                    >
                      <Plus className="size-4 mr-2" />
                      Request New Review
                    </Button>
                  </div>
                ) : (
                  // Pending reviews
                  pendingReviews.map((review) => {
                    const isSelected = selectedIds.includes(review.slot_id);

                    return (
                      <div
                        key={review.slot_id}
                        className={cn(
                          "relative rounded-2xl transition-all",
                          selectionMode && "cursor-pointer",
                          isSelected && "ring-2 ring-accent-blue ring-offset-2"
                        )}
                        onClick={() => {
                          if (selectionMode) {
                            handleCardSelect(review.slot_id);
                          }
                        }}
                      >
                        {/* Selection indicator */}
                        {selectionMode && (
                          <div className="absolute top-3 right-3 z-10">
                            <div
                              className={cn(
                                "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                                isSelected
                                  ? "bg-accent-blue border-accent-blue"
                                  : "bg-white border-gray-300"
                              )}
                            >
                              {isSelected && <CheckCircle2 className="size-4 text-white" />}
                            </div>
                          </div>
                        )}

                        <SwipeableReviewCard
                          mode="creator"
                          id={review.slot_id}
                          title={review.review_request_title}
                          contentType={review.review_request_title}
                          autoAcceptDeadline={review.auto_accept_at || undefined}
                          reviewerName={review.reviewer?.name}
                          reviewPreview={review.review_preview}
                          onAccept={
                            selectionMode ? undefined : () => handleAcceptReview(review.slot_id)
                          }
                          onReject={
                            selectionMode ? undefined : () => handleRejectReview(review.slot_id)
                          }
                          onClick={
                            selectionMode
                              ? undefined
                              : () => router.push(`/review/${review.review_request_id}`)
                          }
                          urgencyLevel={review.urgency_level}
                          disabled={selectionMode}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* Batch Accept Button - Fixed at bottom */}
          {activeTab === "actions" && selectionMode && (
            <BatchAcceptButton
              selectedIds={selectedIds}
              onSuccess={handleBatchAcceptSuccess}
              onClear={handleClearSelection}
            />
          )}

          {/* My Requests Tab */}
          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">{totalRequests}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{completedRequests}</div>
                  <div className="text-xs text-muted-foreground">Done</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600 mb-1">{activeRequests}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {isLoadingRequests ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <div className="size-16 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="size-8 text-accent-blue" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Reviews Yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Create your first review request to get started.
                    </p>
                    <Button
                      onClick={() => router.push("/review/new")}
                      className="bg-accent-blue hover:bg-accent-blue/90 min-h-[48px]"
                    >
                      <Plus className="size-4 mr-2" />
                      Request Feedback
                    </Button>
                  </div>
                ) : (
                  myRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => router.push(`/review/${request.id}`)}
                      className="rounded-xl border border-border bg-card p-4 hover:bg-accent-blue/5 transition-colors active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
                          {request.title}
                        </h3>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant={
                              request.status === "completed" ? "success" :
                              request.status === "in_review" ? "info" :
                              request.status === "pending" ? "warning" : "secondary"
                            }
                            size="sm"
                          >
                            {request.status}
                          </Badge>
                          {request.urgent_actions > 0 && (
                            <Badge variant="error" size="sm" showDot pulse>
                              {request.urgent_actions} urgent
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {request.progress.requested > 1 && (
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium flex items-center gap-1">
                              <Users className="size-3" />
                              Review Progress
                            </span>
                            <span className="text-foreground font-semibold">
                              {request.progress.submitted + request.progress.accepted} / {request.progress.requested}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-blue rounded-full transition-all duration-500"
                              style={{
                                width: `${request.progress.percentage}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        <span className="capitalize">{request.content_type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Inbox className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Activity Feed Coming Soon
                </h3>
                <p className="text-sm text-muted-foreground">
                  Track all your review activity and updates here.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PullToRefresh>
    </div>
  );
}
