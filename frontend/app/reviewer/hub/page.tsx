/**
 * Reviewer Hub - Multi-Review Workspace
 *
 * Adaptive workspace that shows when reviewers have 2+ active reviews:
 * - Left: Current review editor (70% width)
 * - Right: Active reviews sidebar (30% width)
 * - Quick switching between reviews
 * - Progress tracking and deadline monitoring
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
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { ActiveReviewsSidebar } from "@/components/reviewer/active-reviews-sidebar";
import { ReviewEditorPanel } from "@/components/reviewer/review-editor-panel";
import { MobileReviewDrawer } from "@/components/reviewer/mobile-review-drawer";
import {
  getMyReviews,
  type ReviewSlot,
} from "@/lib/api/reviewer";
import { cn } from "@/lib/utils";

export default function ReviewerHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSlotId = searchParams.get("slot");

  // State
  const [allSlots, setAllSlots] = React.useState<ReviewSlot[]>([]);
  const [currentSlot, setCurrentSlot] = React.useState<ReviewSlot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Fetch all active reviews
  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all claimed + submitted reviews in a single API call
        const combinedSlots = await getMyReviews("claimed,submitted");
        setAllSlots(combinedSlots);

        // Set current slot
        if (initialSlotId) {
          const slot = combinedSlots.find(s => s.id === Number(initialSlotId));
          setCurrentSlot(slot ?? combinedSlots[0] ?? null);
        } else {
          setCurrentSlot(combinedSlots[0] ?? null);
        }

        // If less than 2 reviews, redirect to single-review page
        if (combinedSlots.length < 2 && combinedSlots.length > 0 && combinedSlots[0]) {
          router.push(`/reviewer/review/${combinedSlots[0].id}`);
        } else if (combinedSlots.length === 0) {
          router.push("/dashboard?role=reviewer");
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [initialSlotId, router]);

  // Handle slot switching
  const handleSlotChange = React.useCallback((slotId: number) => {
    const slot = allSlots.find(s => s.id === slotId);
    if (slot) {
      setCurrentSlot(slot);
      // Update URL without reload
      window.history.pushState({}, "", `/reviewer/hub?slot=${slotId}`);
    }
  }, [allSlots]);

  // Handle review submission success
  const handleSubmitSuccess = React.useCallback(() => {
    // Refresh the list
    getMyReviews("claimed").then(claimed => {
      setAllSlots(claimed);
      if (claimed.length < 2 && claimed.length > 0 && claimed[0]) {
        router.push(`/reviewer/review/${claimed[0].id}`);
      } else if (claimed.length === 0) {
        router.push("/dashboard?role=reviewer");
      } else if (claimed[0]) {
        setCurrentSlot(claimed[0]);
      }
    });
  }, [router]);

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

  if (loading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-32" />
          <span className="sr-only">Loading your active reviews...</span>
        </div>
      </div>
    );
  }

  if (error || !currentSlot || allSlots.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">
            {error || "No active reviews found"}
          </p>
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

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard?role=reviewer")}
          className="flex-shrink-0 min-h-[48px] min-w-[48px]"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            Reviewer Workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            {allSlots.length} active review{allSlots.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Split Layout - Desktop */}
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

      {/* Mobile Bottom Drawer */}
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

      {/* Mobile Review Drawer */}
      <MobileReviewDrawer
        slots={allSlots}
        currentSlotId={currentSlot.id}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onSlotChange={handleSlotChange}
      />
    </div>
  );
}
