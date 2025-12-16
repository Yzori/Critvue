/**
 * Applications Panel Component
 *
 * Panel for creators to view and manage applications for their paid review requests.
 * Shows applicant profiles, pitches, and accept/reject actions.
 *
 * Features:
 * - List of pending applications with applicant details
 * - Accept/reject functionality
 * - Loading states
 * - Empty states
 * - Real-time updates after actions
 */

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";
import {
  getRequestApplications,
  acceptApplication,
  rejectApplication,
  RequestApplicationsResponse,
  SlotApplicationWithApplicant,
} from "@/lib/api/reviews/applications";
import { TieredAvatar } from "@/components/tier/tiered-avatar";
import { UserTier } from "@/lib/types/tier";

// Helper to convert string tier to UserTier enum
function stringToUserTier(tier: string | null | undefined): UserTier {
  if (!tier) return UserTier.NEWCOMER;
  const upperTier = tier.toUpperCase();
  if (upperTier in UserTier) {
    return UserTier[upperTier as keyof typeof UserTier];
  }
  // Map lowercase/snake_case values
  const tierMap: Record<string, UserTier> = {
    newcomer: UserTier.NEWCOMER,
    supporter: UserTier.SUPPORTER,
    guide: UserTier.GUIDE,
    mentor: UserTier.MENTOR,
    curator: UserTier.CURATOR,
    visionary: UserTier.VISIONARY,
    novice: UserTier.NEWCOMER, // Backward compatibility
  };
  return tierMap[tier.toLowerCase()] || UserTier.NEWCOMER;
}

export interface ApplicationsPanelProps {
  reviewRequestId: number;
  availableSlots: number;
  onApplicationAccepted?: () => void;
  className?: string;
}

export function ApplicationsPanel({
  reviewRequestId,
  availableSlots,
  onApplicationAccepted,
  className,
}: ApplicationsPanelProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<RequestApplicationsResponse | null>(null);
  const [expandedPitch, setExpandedPitch] = React.useState<number | null>(null);
  const [processingId, setProcessingId] = React.useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = React.useState<number | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch applications
  const fetchApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRequestApplications(reviewRequestId);
      setData(response);
    } catch {
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [reviewRequestId]);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle accept
  const handleAccept = async (applicationId: number) => {
    try {
      setProcessingId(applicationId);
      await acceptApplication(applicationId);
      await fetchApplications();
      onApplicationAccepted?.();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const handleReject = async (applicationId: number) => {
    try {
      setProcessingId(applicationId);
      await rejectApplication(applicationId, rejectReason || undefined);
      setShowRejectModal(null);
      setRejectReason("");
      await fetchApplications();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  // Pending applications (main focus)
  const pendingApplications = data?.applications.filter(a => a.status === "pending") || [];
  const acceptedApplications = data?.applications.filter(a => a.status === "accepted") || [];
  const rejectedApplications = data?.applications.filter(a => a.status === "rejected") || [];

  // No applications to manage
  if (!loading && data && data.total_applications === 0) {
    return null;
  }

  return (
    <>
      <section className={cn(
        "rounded-3xl bg-white dark:bg-[var(--dark-tier-2)] border border-gray-100 dark:border-gray-800 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <Users className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
            Expert Applications
          </h2>
          {data && (
            <div className="flex items-center gap-2">
              {data.pending_count > 0 && (
                <Badge variant="warning" size="sm">
                  {data.pending_count} pending
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {availableSlots} slot{availableSlots !== 1 ? "s" : ""} available
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 text-red-700 dark:text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Applications List */}
        {!loading && data && (
          <div className="space-y-6">
            {/* Pending Applications */}
            {pendingApplications.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="size-4" />
                  Pending Review ({pendingApplications.length})
                </h3>
                <div className="space-y-3">
                  {pendingApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      isExpanded={expandedPitch === application.id}
                      onToggleExpand={() => setExpandedPitch(
                        expandedPitch === application.id ? null : application.id
                      )}
                      onAccept={() => handleAccept(application.id)}
                      onReject={() => setShowRejectModal(application.id)}
                      isProcessing={processingId === application.id}
                      canAccept={availableSlots > 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Accepted Applications */}
            {acceptedApplications.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  Accepted ({acceptedApplications.length})
                </h3>
                <div className="space-y-2">
                  {acceptedApplications.map((application) => (
                    <ApplicationCardCompact
                      key={application.id}
                      application={application}
                      status="accepted"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Applications */}
            {rejectedApplications.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                  <XCircle className="size-4" />
                  Rejected ({rejectedApplications.length})
                </h3>
                <div className="space-y-2">
                  {rejectedApplications.map((application) => (
                    <ApplicationCardCompact
                      key={application.id}
                      application={application}
                      status="rejected"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Pending Info */}
            {pendingApplications.length === 0 && data.total_applications > 0 && (
              <div className="text-center py-8">
                <div className="size-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  All applications have been reviewed
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Reject Modal */}
      {mounted && showRejectModal !== null && createPortal(
        <div className="fixed inset-0 z-[9999]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowRejectModal(null);
              setRejectReason("");
            }}
          />
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div
                className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-popover p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason("");
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>

                <div className="mb-6">
                  <div className="size-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <XCircle className="size-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground text-center mb-2">
                    Reject Application
                  </h2>
                  <p className="text-sm text-muted-foreground text-center">
                    The applicant will be notified of your decision.
                  </p>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="reject-reason"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Reason (optional)
                  </label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide feedback to help the applicant improve..."
                    className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-gray-200 dark:border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {rejectReason.length}/500
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectReason("");
                    }}
                    className="flex-1 min-h-[44px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleReject(showRejectModal)}
                    disabled={processingId === showRejectModal}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
                  >
                    {processingId === showRejectModal ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="size-4" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Full application card with pitch and actions
interface ApplicationCardProps {
  application: SlotApplicationWithApplicant;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAccept: () => void;
  onReject: () => void;
  isProcessing: boolean;
  canAccept: boolean;
}

function ApplicationCard({
  application,
  isExpanded,
  onToggleExpand,
  onAccept,
  onReject,
  isProcessing,
  canAccept,
}: ApplicationCardProps) {
  const { applicant } = application;
  const appliedAt = new Date(application.created_at);
  const timeAgo = getTimeAgo(appliedAt);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 transition-all hover:border-purple-300 dark:hover:border-purple-700">
      {/* Header Row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <TieredAvatar
          avatarUrl={applicant.avatar_url}
          fullName={applicant.full_name || applicant.username}
          tier={stringToUserTier(applicant.user_tier)}
          size="md"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/profile/${applicant.username}`}
              className="font-semibold text-foreground hover:text-accent-blue transition-colors"
            >
              {applicant.full_name || applicant.username}
            </a>
            {applicant.user_tier && applicant.user_tier !== "novice" && (
              <Badge variant="info" size="sm" className="capitalize">
                {applicant.user_tier.replace("_", " ")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{applicant.username}</p>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3" />
              {applicant.total_reviews_given} reviews
            </span>
            {applicant.avg_rating && (
              <span className="flex items-center gap-1">
                <Star className="size-3 text-yellow-500" />
                {applicant.avg_rating.toFixed(1)}
              </span>
            )}
            {applicant.sparks_points > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="size-3 text-purple-500" />
                {applicant.sparks_points}
              </span>
            )}
          </div>
        </div>

        {/* Time */}
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {timeAgo}
        </span>
      </div>

      {/* Pitch Preview / Full */}
      <div className="mt-3">
        <button
          onClick={onToggleExpand}
          className="w-full text-left"
        >
          <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
            <p className={cn(
              "text-sm text-foreground",
              !isExpanded && "line-clamp-2"
            )}>
              {application.pitch_message}
            </p>
            {application.pitch_message.length > 150 && (
              <button
                className="text-xs text-accent-blue hover:underline mt-1 flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3" />
                    Read more
                  </>
                )}
              </button>
            )}
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <Button
          onClick={onAccept}
          disabled={isProcessing || !canAccept}
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white min-h-[40px]"
        >
          {isProcessing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <ThumbsUp className="size-4" />
              Accept
            </>
          )}
        </Button>
        <Button
          onClick={onReject}
          disabled={isProcessing}
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-500/10 min-h-[40px]"
        >
          <ThumbsDown className="size-4" />
          Reject
        </Button>
        <a
          href={`/profile/${applicant.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[40px] flex items-center"
        >
          <User className="size-4" />
        </a>
      </div>

      {/* No slots warning */}
      {!canAccept && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <AlertCircle className="size-3" />
          No available slots. Reject some applications or add more slots.
        </p>
      )}
    </div>
  );
}

// Compact card for accepted/rejected applications
interface ApplicationCardCompactProps {
  application: SlotApplicationWithApplicant;
  status: "accepted" | "rejected";
}

function ApplicationCardCompact({ application, status }: ApplicationCardCompactProps) {
  const { applicant } = application;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      status === "accepted"
        ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
        : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
    )}>
      <TieredAvatar
        avatarUrl={applicant.avatar_url}
        fullName={applicant.full_name || applicant.username}
        tier={stringToUserTier(applicant.user_tier)}
        size="sm"
        showTierEffects={false}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {applicant.full_name || applicant.username}
        </p>
        <p className="text-xs text-muted-foreground">
          @{applicant.username}
        </p>
      </div>
      <Badge
        variant={status === "accepted" ? "success" : "error"}
        size="sm"
      >
        {status === "accepted" ? "Accepted" : "Rejected"}
      </Badge>
    </div>
  );
}

// Helper to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
