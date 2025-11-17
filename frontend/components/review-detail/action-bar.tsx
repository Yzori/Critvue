"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ReviewRequestDetail } from "@/lib/api/reviews";
import { Button } from "@/components/ui/button";
import {
  Download,
  Edit,
  Share2,
  Flag,
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { claimReviewSlot } from "@/lib/api/browse";

/**
 * ActionBar Component
 *
 * Features:
 * - Context-aware actions based on user role and request status
 * - Claim slot button for reviewers
 * - Edit button for request owners
 * - Download all files button
 * - Share button
 * - Back navigation
 * - Mobile-responsive with priority actions
 * - Glassmorphism design
 * - WCAG 2.1 Level AA compliant
 * - 44px minimum touch targets
 */

interface ActionBarProps {
  review: ReviewRequestDetail;
  isOwner?: boolean;
  currentUserId?: number;
  className?: string;
}

export function ActionBar({
  review,
  isOwner = false,
  currentUserId,
  className,
}: ActionBarProps) {
  const router = useRouter();
  const [isClaiming, setIsClaiming] = React.useState(false);

  // Check if user can claim a slot
  const canClaimSlot = React.useMemo(() => {
    if (!currentUserId || isOwner) return false;
    if (review.status !== "pending") return false;

    // Check if there are available slots
    const availableSlots = review.slots?.filter((s) => s.status === "available").length || 0;
    if (availableSlots === 0) return false;

    // Check if user already has a claimed slot
    const userSlots = review.slots?.filter((s) => s.reviewer_id === currentUserId) || [];
    return userSlots.length === 0;
  }, [currentUserId, isOwner, review]);

  // Handle claim slot
  const handleClaimSlot = async () => {
    try {
      setIsClaiming(true);
      const result = await claimReviewSlot(review.id);

      toast.success("Slot claimed successfully!", {
        description: "Redirecting to review writing page...",
      });

      // Redirect to the claimed slot's review page using the returned slot_id
      setTimeout(() => {
        router.push(`/reviewer/review/${result.slot_id}`);
      }, 500);
    } catch (error) {
      console.error("Error claiming slot:", error);
      toast.error("Failed to claim slot", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
      setIsClaiming(false);
    }
  };

  // Handle download all files
  const handleDownloadAll = () => {
    if (review.files.length === 0) {
      toast.info("No files to download");
      return;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    review.files.forEach((file) => {
      const url = file.file_url || `${API_BASE_URL}/files/${file.filename}`;
      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    toast.success("Downloading files...", {
      description: `${review.files.length} file(s) queued for download.`,
    });
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: review.title,
          text: review.description,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link");
      }
    }
  };

  // Handle report
  const handleReport = () => {
    toast.info("Report feature coming soon", {
      description: "This will allow you to flag inappropriate content.",
    });
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-20",
        "bg-white/80 backdrop-blur-xl border-b border-gray-200/50",
        "shadow-sm",
        className
      )}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="min-h-[44px]"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Claim Slot Button (Primary CTA for reviewers) */}
            {canClaimSlot && (
              <Button
                variant="default"
                size="default"
                onClick={handleClaimSlot}
                disabled={isClaiming}
                className={cn(
                  "min-h-[44px] bg-accent-blue hover:bg-accent-blue/90",
                  "shadow-lg shadow-accent-blue/20"
                )}
              >
                {isClaiming ? (
                  <>
                    <Clock className="size-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-4" />
                    Claim Slot
                  </>
                )}
              </Button>
            )}

            {/* Edit Button (for owners) */}
            {isOwner && review.status === "draft" && (
              <Button
                variant="outline"
                size="default"
                onClick={() => router.push(`/review/${review.id}/edit`)}
                className="min-h-[44px]"
              >
                <Edit className="size-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}

            {/* Download All Files */}
            {review.files.length > 0 && (
              <Button
                variant="outline"
                size="default"
                onClick={handleDownloadAll}
                className="min-h-[44px]"
                aria-label="Download all files"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Download All</span>
              </Button>
            )}

            {/* Share Button */}
            <Button
              variant="outline"
              size="default"
              onClick={handleShare}
              className="min-h-[44px]"
              aria-label="Share review request"
            >
              <Share2 className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            {/* Report Button (if not owner) */}
            {!isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReport}
                className="min-h-[44px] min-w-[44px] text-gray-500 hover:text-red-600"
                aria-label="Report review request"
              >
                <Flag className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
