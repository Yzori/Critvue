"use client";

/**
 * Admin Applications Page
 *
 * Expert application review for committee members.
 * Now integrated with the centralized admin dashboard layout.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabType>("queue");
  const [stats, setStats] = useState<CommitteeStats | null>(null);
  const [queue, setQueue] = useState<ApplicationQueueItem[]>([]);
  const [claimedApplications, setClaimedApplications] = useState<ApplicationDetail[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReason[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);

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

      const details = await adminApi.getApplication(applicationId);
      setSelectedApplication(details);
      setIsClaimed(true);
      setIsModalOpen(true);

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
      const hasClaimedReview = details.reviews?.some((r) => r.status === "claimed");
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
        toast.success(`Application ${result.decision.decision.toLowerCase()}!`);
      } else {
        toast.success("Vote submitted successfully");
      }

      setIsModalOpen(false);
      setSelectedApplication(null);
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
      await fetchData();
    } catch (err) {
      console.error("Error releasing application:", err);
      toast.error("Failed to release application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial loading
  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#4CC9F0]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expert Applications</h1>
          <p className="text-muted-foreground mt-1">Review and approve expert reviewer applications</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <AlertTriangle className="h-5 w-5" />
          {error}
        </motion.div>
      )}

      {/* Stats Dashboard */}
      <CommitteeStatsDashboard stats={stats} isLoading={isLoading} />

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "queue" ? "default" : "outline"}
          onClick={() => setActiveTab("queue")}
        >
          <Users className="mr-2 h-4 w-4" />
          Queue
          {queue.length > 0 && (
            <Badge variant="secondary" className="ml-2 bg-background/20">
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
            <Badge variant="secondary" className="ml-2 bg-background/20">
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
            <h2 className="text-lg font-semibold text-foreground">
              My Claimed Applications
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({claimedApplications.length} claimed)
              </span>
            </h2>
          </div>

          {claimedApplications.length === 0 ? (
            <Card className="bg-background border-border">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted p-4">
                  <ClipboardCheck className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  No claimed applications
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Claim an application from the queue to start reviewing.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {claimedApplications.map((app) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group relative overflow-hidden rounded-xl border border-[#4CC9F0]/20 bg-background p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4CC9F0]/20 to-[#F72585]/20">
                          <Users className="h-5 w-5 text-[#4CC9F0]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {app.full_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{app.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Badge className="bg-[#4CC9F0]/10 text-[#4CC9F0]">
                          Claimed
                        </Badge>
                        <span className="font-mono text-xs text-gray-400">
                          {app.application_number}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleViewDetails(app.id)}
                        className="bg-[#4CC9F0] hover:bg-[#3DB8DF]"
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
