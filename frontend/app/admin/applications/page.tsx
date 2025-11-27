"use client";

/**
 * Admin Applications Page
 *
 * The main dashboard for expert application review committee.
 * Features:
 * - Committee statistics dashboard
 * - Application queue with claim/review functionality
 * - Full application review modal
 * - Admin-only access protection
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CommitteeStatsDashboard,
  ApplicationQueue,
  ApplicationReviewModal,
} from "@/components/admin";
import { adminApi } from "@/lib/api/admin";
import type {
  CommitteeStats,
  ApplicationQueueItem,
  ApplicationDetail,
  RejectionReason,
  VoteRequest,
} from "@/lib/api/admin";
import { toast } from "sonner";

type TabType = "queue" | "my-reviews";

export default function AdminApplicationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<TabType>("queue");
  const [stats, setStats] = useState<CommitteeStats | null>(null);
  const [queue, setQueue] = useState<ApplicationQueueItem[]>([]);
  const [claimedApplications, setClaimedApplications] = useState<ApplicationDetail[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>(
    []
  );
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, queueData, reasonsData, myReviewsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getQueue(),
        adminApi.getRejectionReasons(),
        adminApi.getMyReviews(),
      ]);

      setStats(statsData);
      setQueue(queueData.applications);
      setRejectionReasons(reasonsData);
      setClaimedApplications(myReviewsData.claimed || []);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user, fetchData]);

  // Handle claim
  const handleClaim = async (applicationId: number) => {
    try {
      setClaimingId(applicationId);
      await adminApi.claimApplication(applicationId);

      // Fetch application details
      const details = await adminApi.getApplication(applicationId);
      setSelectedApplication(details);
      setIsClaimed(true);
      setIsModalOpen(true);

      // Refresh queue
      const queueData = await adminApi.getQueue();
      setQueue(queueData.applications);

      toast.success("Application claimed successfully");
    } catch (err) {
      console.error("Error claiming application:", err);
      toast.error("Failed to claim application");
    } finally {
      setClaimingId(null);
    }
  };

  // Handle view details
  const handleViewDetails = async (applicationId: number) => {
    try {
      const details = await adminApi.getApplication(applicationId);
      setSelectedApplication(details);
      // Check if we have a claimed review for this application
      const hasClaimedReview = details.reviews?.some(
        (r) => r.status === "claimed"
      );
      setIsClaimed(hasClaimedReview);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Error fetching application details:", err);
      toast.error("Failed to load application details");
    }
  };

  // Handle vote submission
  const handleVote = async (vote: VoteRequest) => {
    if (!selectedApplication) return;

    try {
      setIsSubmitting(true);
      const result = await adminApi.submitVote(selectedApplication.id, vote);

      if (result.decision) {
        toast.success(
          `Application ${result.decision.decision.toLowerCase()}!`
        );
      } else {
        toast.success("Vote submitted successfully");
      }

      setIsModalOpen(false);
      setSelectedApplication(null);

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error("Error submitting vote:", err);
      toast.error("Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle release
  const handleRelease = async () => {
    if (!selectedApplication) return;

    try {
      setIsSubmitting(true);
      await adminApi.releaseApplication(selectedApplication.id);

      toast.success("Application released back to queue");
      setIsModalOpen(false);
      setSelectedApplication(null);

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error("Error releasing application:", err);
      toast.error("Failed to release application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || (user?.role === "admin" && isLoading && !stats)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  // Not authorized
  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-white/80 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-peach shadow-lg">
                <ClipboardCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Expert Application Review
                </h1>
                <p className="text-sm text-muted-foreground">
                  Committee Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="primary" showDot pulse>
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
          >
            <AlertTriangle className="h-5 w-5" />
            {error}
          </motion.div>
        )}

        {/* Stats Dashboard */}
        <section className="mb-8">
          <CommitteeStatsDashboard stats={stats} isLoading={isLoading} />
        </section>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === "queue" ? "default" : "outline"}
            onClick={() => setActiveTab("queue")}
          >
            <Users className="mr-2 h-4 w-4" />
            Queue
            {queue.length > 0 && (
              <Badge variant="neutral" size="sm" className="ml-2">
                {queue.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === "my-reviews" ? "default" : "outline"}
            onClick={() => setActiveTab("my-reviews")}
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            My Reviews
            {stats?.my_claimed_count ? (
              <Badge variant="primary" size="sm" className="ml-2">
                {stats.my_claimed_count}
              </Badge>
            ) : null}
          </Button>
        </div>

        {/* Tab content */}
        {activeTab === "queue" && (
          <ApplicationQueue
            applications={queue}
            isLoading={isLoading}
            onClaim={handleClaim}
            onViewDetails={handleViewDetails}
            claimingId={claimingId}
          />
        )}

        {activeTab === "my-reviews" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                My Claimed Applications
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({claimedApplications.length} claimed)
                </span>
              </h2>
            </div>

            {claimedApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16">
                <div className="rounded-full bg-white p-4 shadow-sm">
                  <ClipboardCheck className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No claimed applications
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Claim an application from the queue to start reviewing.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {claimedApplications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group relative overflow-hidden rounded-xl border border-accent-blue/20 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-peach/20">
                            <Users className="h-5 w-5 text-accent-blue" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {app.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {app.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="primary" size="sm">
                            Claimed
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">
                            {app.application_number}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleViewDetails(app.id)}
                          className="group/btn"
                        >
                          Continue Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await adminApi.releaseApplication(app.id);
                              toast.success("Application released");
                              fetchData();
                            } catch {
                              toast.error("Failed to release application");
                            }
                          }}
                        >
                          Release
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Review Modal */}
      <ApplicationReviewModal
        application={selectedApplication}
        rejectionReasons={rejectionReasons}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedApplication(null);
        }}
        onVote={handleVote}
        onRelease={handleRelease}
        isSubmitting={isSubmitting}
        isClaimed={isClaimed}
      />
    </div>
  );
}
