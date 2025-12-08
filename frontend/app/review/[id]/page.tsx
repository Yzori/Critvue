"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getReviewDetail, ReviewRequestDetail, ContentType } from "@/lib/api/reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClaimButton } from "@/components/reviewer/claim-button";
import { TierLockedButton } from "@/components/tier/tier-locked-review";
import { ApplicationsPanel } from "@/components/reviewer/applications-panel";
import { UserTier } from "@/lib/types/tier";
import { WatermarkOverlay, LightboxWatermark } from "@/components/ui/watermark-overlay";
import {
  DollarSign,
  FileText,
  Target,
  Clock,
  AlertCircle,
  Loader2,
  Shield,
  ArrowLeft,
  Share2,
  Flag,
  Download,
  Edit,
  Users,
  Video,
  Image,
  Music,
  Camera,
  Palette,
  PenTool,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Eye,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Maximize2,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Review Request Detail Page - Premium Redesign
 *
 * Features:
 * - Hero section with file preview background
 * - Glassmorphism sidebar with premium feel
 * - Compact slot indicators (visual progress)
 * - Enhanced file gallery with lightbox
 * - Material Design elevation & 8pt grid
 * - Micro-animations and hover states
 */

// Content type icons
const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  video: <Video className="size-5" />,
  image: <Image className="size-5" />,
  audio: <Music className="size-5" />,
  document: <FileText className="size-5" />,
  photography: <Camera className="size-5" />,
  design: <Palette className="size-5" />,
  writing: <PenTool className="size-5" />,
  other: <Sparkles className="size-5" />,
};

// Tier limits for paid reviews
// NEWCOMER, SUPPORTER, GUIDE can't accept paid reviews
// MENTOR can accept up to $25, CURATOR up to $100, VISIONARY unlimited
const TIER_PAID_LIMITS: Record<UserTier, { canAcceptPaid: boolean; maxPrice: number | null }> = {
  [UserTier.NEWCOMER]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.SUPPORTER]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.GUIDE]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.MENTOR]: { canAcceptPaid: true, maxPrice: 25 },
  [UserTier.CURATOR]: { canAcceptPaid: true, maxPrice: 100 },
  [UserTier.VISIONARY]: { canAcceptPaid: true, maxPrice: null },
};

function getRequiredTierForPrice(price: number): UserTier {
  if (price <= 25) return UserTier.MENTOR;
  if (price <= 100) return UserTier.CURATOR;
  return UserTier.VISIONARY;
}

function canTierClaimPrice(tier: UserTier, price: number): boolean {
  const limits = TIER_PAID_LIMITS[tier];
  if (!limits || !limits.canAcceptPaid) return false;
  if (limits.maxPrice === null) return true;
  return price <= limits.maxPrice;
}

// Get file URL helper
function getFileUrl(file: { file_url?: string | null; filename: string }) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  if (file.file_url?.startsWith("http")) return file.file_url;
  return `${BACKEND_URL}${file.file_url || `/files/${file.filename}`}`;
}

// Check if file is an image
function isImageFile(file: { file_type: string }) {
  return file.file_type.startsWith("image/");
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reviewId = parseInt(params.id as string, 10);

  const [review, setReview] = React.useState<ReviewRequestDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAllSlots, setShowAllSlots] = React.useState(false);

  // Enhanced lightbox state
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = React.useState(1);
  const [lightboxRotation, setLightboxRotation] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  // Portal mount state (for SSR compatibility)
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentUserId = user?.id;
  const isOwner = review?.user_id === currentUserId;
  const userTier = (user?.user_tier as UserTier) || UserTier.NEWCOMER;

  // Fetch review details
  const fetchReview = React.useCallback(async (showLoading = true) => {
    if (!reviewId || isNaN(reviewId)) {
      setError("Invalid review ID");
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await getReviewDetail(reviewId);
      setReview(data);
    } catch (err) {
      console.error("Error fetching review:", err);
      setError(err instanceof Error ? err.message : "Failed to load review request");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [reviewId]);

  React.useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  // Get image files for lightbox navigation - MUST be before early returns
  const imageFiles = React.useMemo(() => {
    return review?.files?.filter(isImageFile) || [];
  }, [review?.files]);

  const currentLightboxFile = lightboxIndex !== null ? imageFiles[lightboxIndex] : null;

  // Lightbox navigation functions
  const openLightbox = React.useCallback((imageIndex: number) => {
    setLightboxIndex(imageIndex);
    setLightboxZoom(1);
    setLightboxRotation(0);
    setDragPosition({ x: 0, y: 0 });
  }, []);

  const closeLightbox = React.useCallback(() => {
    setLightboxIndex(null);
    setLightboxZoom(1);
    setLightboxRotation(0);
    setDragPosition({ x: 0, y: 0 });
  }, []);

  const goToPrevImage = React.useCallback(() => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
      setLightboxZoom(1);
      setLightboxRotation(0);
      setDragPosition({ x: 0, y: 0 });
    }
  }, [lightboxIndex]);

  const goToNextImage = React.useCallback(() => {
    if (lightboxIndex !== null && lightboxIndex < imageFiles.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
      setLightboxZoom(1);
      setLightboxRotation(0);
      setDragPosition({ x: 0, y: 0 });
    }
  }, [lightboxIndex, imageFiles.length]);

  const handleZoomIn = React.useCallback(() => setLightboxZoom((z) => Math.min(z + 0.5, 4)), []);
  const handleZoomOut = React.useCallback(() => {
    setLightboxZoom((z) => Math.max(z - 0.5, 0.5));
    if (lightboxZoom <= 1) setDragPosition({ x: 0, y: 0 });
  }, [lightboxZoom]);
  const handleRotate = React.useCallback(() => setLightboxRotation((r) => (r + 90) % 360), []);
  const resetView = React.useCallback(() => {
    setLightboxZoom(1);
    setLightboxRotation(0);
    setDragPosition({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation for lightbox
  React.useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          goToPrevImage();
          break;
        case "ArrowRight":
          goToNextImage();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "r":
        case "R":
          handleRotate();
          break;
        case "0":
          resetView();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, closeLightbox, goToPrevImage, goToNextImage, handleZoomIn, handleZoomOut, handleRotate, resetView]);

  // Mouse drag for panning when zoomed
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (lightboxZoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - dragPosition.x, y: e.clientY - dragPosition.y });
    }
  }, [lightboxZoom, dragPosition]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (isDragging && lightboxZoom > 1) {
      setDragPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, lightboxZoom, dragStart]);

  const handleMouseUp = React.useCallback(() => setIsDragging(false), []);

  // Wheel zoom
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [handleZoomIn, handleZoomOut]);

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent-blue/5 dark:from-[var(--dark-tier-1)] dark:via-[var(--dark-tier-1)] dark:to-[var(--dark-tier-1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {/* Hero skeleton */}
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-3xl" />
            <div className="flex gap-8">
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              </div>
              <div className="w-[380px] h-96 bg-gray-200 dark:bg-gray-700 rounded-3xl hidden lg:block" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 dark:from-[var(--dark-tier-1)] dark:via-[var(--dark-tier-1)] dark:to-[var(--dark-tier-1)] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="size-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-500/20 dark:to-red-500/10 flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-red-900/20">
            <AlertCircle className="size-12 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Review Not Found</h1>
          <p className="text-foreground-muted mb-8">{error || "This review request does not exist or has been removed."}</p>
          <Button
            onClick={() => router.push("/browse")}
            className="bg-accent-blue hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25 px-8"
            size="lg"
          >
            Browse Reviews
          </Button>
        </div>
      </div>
    );
  }

  // Computed values
  const availableSlots = review.slots?.filter((s) => s.status === "available").length || 0;
  const claimedSlots = review.slots?.filter((s) => s.status !== "available").length || 0;
  const totalSlots = review.reviews_requested || 1;
  const isPaidReview = review.review_type === "expert" && review.budget && review.budget > 0;
  const reviewPrice = review.budget || 0;
  const heroImage = review.files?.find(isImageFile);
  const completionPercent = Math.round((claimedSlots / totalSlots) * 100);

  // Tier restriction check
  const tierRestriction = (() => {
    if (!isPaidReview) return { isLocked: false, requiredTier: null };
    const canClaim = canTierClaimPrice(userTier, reviewPrice);
    if (canClaim) return { isLocked: false, requiredTier: null };
    return { isLocked: true, requiredTier: getRequiredTierForPrice(reviewPrice) };
  })();

  // Can claim slot check
  const canClaimSlot = (() => {
    if (!currentUserId || isOwner) return false;
    if (review.status !== "pending" && review.status !== "in_review") return false;
    if (availableSlots === 0) return false;
    const userSlots = review.slots?.filter((s) => s.reviewer_id === currentUserId) || [];
    return userSlots.length === 0;
  })();

  // Format deadline
  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    try {
      const date = new Date(deadline);
      const now = new Date();
      const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) return { text: "Expired", variant: "error" as const, urgent: true };
      if (daysUntil === 0) return { text: "Due Today", variant: "error" as const, urgent: true };
      if (daysUntil === 1) return { text: "Due Tomorrow", variant: "warning" as const, urgent: true };
      if (daysUntil <= 3) return { text: `${daysUntil} days left`, variant: "warning" as const, urgent: true };
      if (daysUntil <= 7) return { text: `${daysUntil} days left`, variant: "warning" as const, urgent: false };
      return { text: date.toLocaleDateString(), variant: "info" as const, urgent: false };
    } catch {
      return null;
    }
  };

  const deadlineInfo = formatDeadline(review.deadline);

  // Status badge variant
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft": return { variant: "neutral" as const, label: "Draft", color: "gray" };
      case "pending": return { variant: "info" as const, label: "Open", color: "blue" };
      case "in_review": return { variant: "warning" as const, label: "In Progress", color: "amber" };
      case "completed": return { variant: "success" as const, label: "Completed", color: "green" };
      case "cancelled": return { variant: "error" as const, label: "Cancelled", color: "red" };
      default: return { variant: "neutral" as const, label: status, color: "gray" };
    }
  };

  const statusConfig = getStatusConfig(review.status);

  // Parse feedback areas into tags
  const feedbackTags = review.feedback_areas
    ? review.feedback_areas.split(",").map(tag => tag.trim()).filter(Boolean)
    : [];

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: review.title, text: review.description, url });
      } catch (e) {
        console.log("Share cancelled:", e);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  // Handle download all
  const handleDownloadAll = () => {
    if (review.files.length === 0) {
      toast.info("No files to download");
      return;
    }
    review.files.forEach((file) => {
      const url = getFileUrl(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    toast.success(`Downloading ${review.files.length} file(s)...`);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent-blue/5 dark:from-[var(--dark-tier-1)] dark:via-[var(--dark-tier-1)] dark:to-[var(--dark-tier-1)]">
      {/* Enhanced Lightbox Modal - Rendered via Portal */}
      {isMounted && lightboxIndex !== null && currentLightboxFile && createPortal(
        <div
          className="fixed inset-0 bg-black flex flex-col"
          style={{ zIndex: 99999 }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-black border-b border-white/10">
            {/* File Info */}
            <div className="flex-1 min-w-0 pr-4">
              <p className="font-medium text-white truncate text-sm sm:text-base">
                {currentLightboxFile.original_filename}
              </p>
              <p className="text-xs sm:text-sm text-white/60">
                {formatFileSize(currentLightboxFile.file_size)} • {lightboxIndex + 1} of {imageFiles.length}
              </p>
            </div>

            {/* Top Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Share button */}
              <button
                onClick={handleShare}
                className="p-2 sm:p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Share"
              >
                <Share2 className="size-5" />
              </button>
              {/* Download only for owner */}
              {isOwner && (
                <a
                  href={getFileUrl(currentLightboxFile)}
                  download={currentLightboxFile.original_filename}
                  className="p-2 sm:p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="Download"
                >
                  <Download className="size-5" />
                </a>
              )}
              <button
                onClick={closeLightbox}
                className="p-2 sm:p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="Close (Esc)"
              >
                <X className="size-5 sm:size-6" />
              </button>
            </div>
          </div>

          {/* Main Image Area */}
          <div
            className="flex-1 relative overflow-hidden flex items-center justify-center bg-black"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            style={{ cursor: lightboxZoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          >
            {/* Navigation Arrows */}
            {imageFiles.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
                  disabled={lightboxIndex === 0}
                  className={cn(
                    "absolute left-4 z-10 p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 transition-all",
                    lightboxIndex === 0
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-black/70 hover:scale-110 text-white/80 hover:text-white"
                  )}
                  title="Previous (←)"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                  disabled={lightboxIndex === imageFiles.length - 1}
                  className={cn(
                    "absolute right-4 z-10 p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 transition-all",
                    lightboxIndex === imageFiles.length - 1
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-black/70 hover:scale-110 text-white/80 hover:text-white"
                  )}
                  title="Next (→)"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}

            {/* Image Container with Watermark */}
            <div className="relative max-w-full max-h-full">
              <img
                src={getFileUrl(currentLightboxFile)}
                alt={currentLightboxFile.original_filename}
                className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                style={{
                  transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                }}
                draggable={false}
                onContextMenu={(e) => !isOwner && e.preventDefault()}
              />
              {/* Watermark for non-owners */}
              {!isOwner && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    transform: `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                  }}
                >
                  <LightboxWatermark opacity={12} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="p-4 bg-black border-t border-white/10">
            <div className="flex items-center justify-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
                <button
                  onClick={handleZoomOut}
                  disabled={lightboxZoom <= 0.5}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    lightboxZoom <= 0.5
                      ? "text-white/30 cursor-not-allowed"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="size-5" />
                </button>
                <span className="px-3 text-sm font-medium text-white/80 min-w-[60px] text-center">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={lightboxZoom >= 4}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    lightboxZoom >= 4
                      ? "text-white/30 cursor-not-allowed"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                  title="Zoom In (+)"
                >
                  <ZoomIn className="size-5" />
                </button>
              </div>

              {/* Rotate */}
              <button
                onClick={handleRotate}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                title="Rotate (R)"
              >
                <RotateCw className="size-5" />
              </button>

              {/* Reset */}
              <button
                onClick={resetView}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                title="Reset View (0)"
              >
                <Maximize2 className="size-5" />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {imageFiles.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 overflow-x-auto pb-2">
                {imageFiles.map((file, idx) => (
                  <button
                    key={file.id}
                    onClick={() => openLightbox(idx)}
                    className={cn(
                      "shrink-0 size-14 rounded-lg overflow-hidden border-2 transition-all",
                      idx === lightboxIndex
                        ? "border-white ring-2 ring-white/30 scale-110"
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-white/50"
                    )}
                  >
                    <img
                      src={getFileUrl(file)}
                      alt={file.original_filename}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Keyboard Hints */}
            <p className="text-center text-xs text-white/40 mt-3 hidden sm:block">
              ← → Navigate • + - Zoom • R Rotate • 0 Reset • Esc Close
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Hero Section with File Preview Background */}
      <div className="relative overflow-hidden">
        {/* Background Image (blurred) */}
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={getFileUrl(heroImage)}
              alt=""
              className="w-full h-full object-cover scale-110 blur-2xl opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white dark:from-[var(--dark-tier-1)]/80 dark:via-[var(--dark-tier-1)]/60 dark:to-[var(--dark-tier-1)]" />
          </div>
        )}

        {/* Top Navigation */}
        <nav className="relative z-10 sticky top-0 bg-white/70 dark:bg-[var(--dark-tier-2)]/70 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 hover:bg-white/50 dark:hover:bg-white/10"
              >
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              <div className="flex items-center gap-2">
                {isOwner && review.status === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/review/${review.id}/edit`)}
                    className="gap-2 bg-white/50 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20"
                  >
                    <Edit className="size-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleShare} className="hover:bg-white/50 dark:hover:bg-white/10">
                  <Share2 className="size-4" />
                </Button>
                {!isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toast.info("Report feature coming soon")}
                    className="text-foreground-muted hover:text-destructive hover:bg-white/50 dark:hover:bg-white/10"
                  >
                    <Flag className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Status & Type Row */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Badge
              variant={statusConfig.variant}
              size="lg"
              showDot
              pulse={review.status === "in_review"}
              className="shadow-sm"
            >
              {statusConfig.label}
            </Badge>

            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm",
              isPaidReview
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                : "bg-white dark:bg-[var(--dark-tier-2)] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
            )}>
              {isPaidReview ? <DollarSign className="size-4" /> : <MessageSquare className="size-4" />}
              {isPaidReview ? "Expert Review" : "Free Review"}
            </div>

            {review.requires_nda && (
              <Badge
                variant="info"
                size="md"
                icon={<Shield className="size-3.5" />}
                className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 shadow-sm"
              >
                NDA Required
              </Badge>
            )}

            {deadlineInfo && (
              <Badge
                variant={deadlineInfo.variant}
                size="md"
                icon={<Clock className="size-3.5" />}
                pulse={deadlineInfo.urgent}
                className="shadow-sm"
              >
                {deadlineInfo.text}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight">
            {review.title}
          </h1>

          {/* Content Type & Meta */}
          <div className="flex items-center gap-4 text-foreground-muted">
            <div className="flex items-center gap-2">
              {contentTypeIcons[review.content_type] || <FileText className="size-5" />}
              <span className="capitalize font-medium">{review.content_type}</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left Column - Main Content */}
          <div className="flex-1 min-w-0 space-y-6 order-2 lg:order-1">

            {/* Description Card */}
            <section className="rounded-3xl bg-white dark:bg-[var(--dark-tier-2)] border border-gray-100 dark:border-gray-800 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                  <FileText className="size-4 text-accent-blue" />
                </div>
                About This Project
              </h2>
              <p className="text-foreground-muted leading-relaxed whitespace-pre-wrap text-base">
                {review.description}
              </p>

              {/* Feedback Areas as Tags */}
              {feedbackTags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="size-4 text-accent-blue" />
                    Looking for feedback on
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {feedbackTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-accent-blue/10 to-accent-blue/5 text-accent-blue border border-accent-blue/20 hover:border-accent-blue/40 transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Files Gallery Section */}
            {review.files && review.files.length > 0 && (
              <section className="rounded-3xl bg-white dark:bg-[var(--dark-tier-2)] border border-gray-100 dark:border-gray-800 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                      <Image className="size-4 text-accent-blue" />
                    </div>
                    Files ({review.files.length})
                  </h2>
                  {/* Download All only for owner */}
                  {isOwner ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadAll}
                      className="gap-2 hover:bg-accent-blue/5 hover:border-accent-blue/30 hover:text-accent-blue"
                    >
                      <Download className="size-4" />
                      Download All
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Shield className="size-4" />
                      <span>Protected</span>
                    </div>
                  )}
                </div>

                {/* Enhanced Gallery Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {review.files.map((file, index) => {
                    const isImage = isImageFile(file);
                    const fileUrl = getFileUrl(file);
                    // Find the index in imageFiles for lightbox navigation
                    const imageIndex = isImage ? imageFiles.findIndex(f => f.id === file.id) : -1;

                    return (
                      <div
                        key={file.id}
                        className={cn(
                          "group relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[var(--dark-tier-3)]",
                          "hover:border-accent-blue/30 hover:shadow-lg transition-all duration-300",
                          index === 0 && review.files.length > 1 && "sm:col-span-2"
                        )}
                      >
                        {isImage ? (
                          <>
                            <div
                              className={cn(
                                "relative cursor-zoom-in",
                                index === 0 && review.files.length > 1 ? "aspect-video" : "aspect-[4/3]"
                              )}
                              onClick={() => openLightbox(imageIndex)}
                              onContextMenu={(e) => !isOwner && e.preventDefault()}
                            >
                              <img
                                src={fileUrl}
                                alt={file.original_filename}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                draggable={isOwner}
                              />
                              {/* Watermark for non-owners */}
                              {!isOwner && <WatermarkOverlay opacity={15} fontSize="sm" />}
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 z-20">
                                <div className="text-white">
                                  <p className="font-medium truncate max-w-[200px]">{file.original_filename}</p>
                                  <p className="text-sm text-white/70">{formatFileSize(file.file_size)}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openLightbox(imageIndex);
                                    }}
                                  >
                                    <Eye className="size-4" />
                                  </button>
                                  {/* Download only for owner */}
                                  {isOwner && (
                                    <a
                                      href={fileUrl}
                                      download={file.original_filename}
                                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="size-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-6 flex items-center gap-4">
                            <div className="size-14 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                              <FileText className="size-6 text-accent-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{file.original_filename}</p>
                              <p className="text-sm text-foreground-muted">{formatFileSize(file.file_size)}</p>
                            </div>
                            {/* Download only for owner */}
                            {isOwner ? (
                              <a
                                href={fileUrl}
                                download={file.original_filename}
                                className="p-2 rounded-lg hover:bg-accent-blue/10 text-foreground-muted hover:text-accent-blue transition-colors"
                              >
                                <Download className="size-5" />
                              </a>
                            ) : (
                              <div className="p-2 text-foreground-muted/50" title="Downloads disabled for reviewers">
                                <Shield className="size-5" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Applications Panel - Only for owners of paid reviews */}
            {isOwner && isPaidReview && (
              <div id="applications">
                <ApplicationsPanel
                  reviewRequestId={review.id}
                  availableSlots={availableSlots}
                  onApplicationAccepted={() => fetchReview(false)}
                />
              </div>
            )}

            {/* Review Slots Section - Compact Design */}
            <section className="rounded-3xl bg-white dark:bg-[var(--dark-tier-2)] border border-gray-100 dark:border-gray-800 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                    <Users className="size-4 text-accent-blue" />
                  </div>
                  Review Slots
                </h2>
                <span className="text-sm text-foreground-muted">
                  {claimedSlots} of {totalSlots} filled
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-blue to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground-muted w-12 text-right">
                    {completionPercent}%
                  </span>
                </div>

                {/* Slot Dots */}
                <div className="flex items-center gap-2 flex-wrap">
                  {review.slots?.map((slot, index) => {
                    const isAvailable = slot.status === "available";
                    const isClaimed = slot.status === "claimed";
                    const isSubmitted = slot.status === "submitted";
                    const isCompleted = slot.status === "accepted";

                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          "size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                          isAvailable && "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600",
                          isClaimed && "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-500/40",
                          isSubmitted && "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-500/40",
                          isCompleted && "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-500/40"
                        )}
                        title={`Slot ${index + 1}: ${slot.status}${slot.reviewer_username ? ` - ${slot.reviewer_username}` : ""}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-4" />
                        ) : isSubmitted ? (
                          <Clock className="size-4" />
                        ) : isClaimed ? (
                          <Zap className="size-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expandable Slot Details */}
              {review.slots && review.slots.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowAllSlots(!showAllSlots)}
                    className="flex items-center gap-2 text-sm text-accent-blue hover:text-accent-blue/80 font-medium transition-colors"
                  >
                    {showAllSlots ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    {showAllSlots ? "Hide details" : "Show slot details"}
                  </button>

                  {showAllSlots && (
                    <div className="mt-4 space-y-3">
                      {review.slots.map((slot, index) => (
                        <div
                          key={slot.id}
                          className={cn(
                            "p-4 rounded-xl border transition-colors",
                            slot.status === "available"
                              ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                              : "bg-white dark:bg-[var(--dark-tier-3)] border-gray-100 dark:border-gray-700"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-foreground-muted">
                                #{index + 1}
                              </span>
                              <Badge
                                variant={
                                  slot.status === "available" ? "neutral" :
                                  slot.status === "claimed" ? "warning" :
                                  slot.status === "submitted" ? "info" :
                                  slot.status === "accepted" ? "success" : "neutral"
                                }
                                size="sm"
                              >
                                {slot.status === "available" ? "Open" :
                                 slot.status === "claimed" ? "In Progress" :
                                 slot.status === "submitted" ? "Submitted" :
                                 slot.status === "accepted" ? "Completed" : slot.status}
                              </Badge>
                              {slot.reviewer_username && (
                                <span className="text-sm text-foreground">
                                  {slot.reviewer_username}
                                </span>
                              )}
                            </div>
                            {isPaidReview && slot.payment_amount && (
                              <span className="text-sm font-semibold text-green-600">
                                ${Number(slot.payment_amount).toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Review content preview */}
                          {slot.review_text && (
                            <p className="mt-2 text-sm text-foreground-muted line-clamp-2">
                              {slot.review_text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {(!review.slots || review.slots.length === 0) && (
                <div className="text-center py-8">
                  <div className="size-16 mx-auto mb-4 rounded-full bg-accent-blue/10 flex items-center justify-center">
                    <Users className="size-8 text-accent-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Reviewers Yet</h3>
                  <p className="text-foreground-muted mb-4">Be the first to claim a review slot!</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Glassmorphism Sidebar */}
          <aside className="w-full lg:w-[380px] shrink-0 order-1 lg:order-2">
            <div className="lg:sticky lg:top-20 space-y-4">

              {/* Premium Glassmorphism Card */}
              <div className="rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/30">
                {/* Gradient Header */}
                <div className={cn(
                  "p-6 text-white",
                  isPaidReview
                    ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500"
                    : "bg-gradient-to-br from-accent-blue via-cyan-500 to-blue-500"
                )}>
                  {isPaidReview ? (
                    <>
                      <p className="text-sm text-white/80 mb-1">Budget</p>
                      <p className="text-4xl font-bold">${review.budget}</p>
                      <p className="text-sm text-white/70 mt-1">per review</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-white/80 mb-1">Review Type</p>
                      <p className="text-2xl font-bold">Free Review</p>
                      <p className="text-sm text-white/70 mt-1">Community feedback</p>
                    </>
                  )}
                </div>

                {/* Card Body */}
                <div className="bg-white dark:bg-[var(--dark-tier-2)] p-6 space-y-5">
                  {/* Requester Row */}
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-full bg-gradient-to-br from-accent-blue to-cyan-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-accent-blue/25">
                      {review.requester_avatar ? (
                        <img
                          src={review.requester_avatar}
                          alt={review.requester_username || "Requester"}
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        (review.requester_username?.[0] || "?").toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate text-lg">
                        {review.requester_username || "Anonymous"}
                      </p>
                      <p className="text-sm text-foreground-muted">
                        Requester
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-2xl font-bold text-accent-blue">{availableSlots}</p>
                      <p className="text-xs text-foreground-muted font-medium">Slots Open</p>
                    </div>
                    <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-2xl font-bold text-foreground">{totalSlots}</p>
                      <p className="text-xs text-foreground-muted font-medium">Total Slots</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="hidden lg:block">
                    {canClaimSlot ? (
                      tierRestriction.isLocked && tierRestriction.requiredTier ? (
                        <TierLockedButton
                          requiredTier={tierRestriction.requiredTier}
                          currentTier={userTier}
                          size="lg"
                          className="w-full"
                        />
                      ) : (
                        <ClaimButton
                          reviewRequestId={review.id}
                          paymentAmount={review.budget || null}
                          reviewType={review.review_type}
                          title={review.title}
                          requiresNda={review.requires_nda}
                          className="w-full shadow-lg shadow-accent-blue/25 hover:shadow-xl hover:shadow-accent-blue/30 transition-shadow"
                        />
                      )
                    ) : isOwner ? (
                      <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-accent-blue/5 to-accent-blue/10 border border-accent-blue/20">
                        <CheckCircle2 className="size-6 mx-auto mb-2 text-accent-blue" />
                        <p className="text-sm font-semibold text-foreground">Your Review Request</p>
                      </div>
                    ) : availableSlots === 0 ? (
                      <div className="text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <Users className="size-6 mx-auto mb-2 text-foreground-muted" />
                        <p className="text-sm font-semibold text-foreground-muted">All Slots Filled</p>
                      </div>
                    ) : (
                      <Button
                        className="w-full bg-accent-blue hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25"
                        size="lg"
                        onClick={() => router.push("/login")}
                      >
                        Sign in to Claim
                      </Button>
                    )}
                  </div>

                  {/* Deadline Warning */}
                  {deadlineInfo && deadlineInfo.urgent && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/30">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                          <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{deadlineInfo.text}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">Deadline approaching</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NDA Badge */}
                  {review.requires_nda && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-500/20 dark:to-violet-500/10 border border-purple-200 dark:border-purple-500/30">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                          <Shield className="size-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">NDA Required</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">Sign before viewing files</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[var(--dark-tier-2)]/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-4 pb-safe">
          <div className="flex items-center gap-4">
            {/* Price */}
            {isPaidReview && (
              <div className="shrink-0">
                <p className="text-xs text-foreground-muted">Budget</p>
                <p className="text-2xl font-bold text-foreground">${review.budget}</p>
              </div>
            )}

            {/* CTA Button */}
            <div className="flex-1">
              {canClaimSlot ? (
                tierRestriction.isLocked && tierRestriction.requiredTier ? (
                  <TierLockedButton
                    requiredTier={tierRestriction.requiredTier}
                    currentTier={userTier}
                    size="lg"
                    className="w-full"
                  />
                ) : (
                  <ClaimButton
                    reviewRequestId={review.id}
                    paymentAmount={review.budget || null}
                    reviewType={review.review_type}
                    title={review.title}
                    requiresNda={review.requires_nda}
                    className="w-full"
                  />
                )
              ) : isOwner ? (
                <Button variant="outline" className="w-full" size="lg" disabled>
                  Your Review Request
                </Button>
              ) : availableSlots === 0 ? (
                <Button variant="outline" className="w-full" size="lg" disabled>
                  All Slots Filled
                </Button>
              ) : (
                <Button className="w-full bg-accent-blue hover:bg-accent-blue/90" size="lg" onClick={() => router.push("/login")}>
                  Sign in to Claim
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding for mobile action bar */}
      <div className="lg:hidden h-28" />
    </div>
  );
}
