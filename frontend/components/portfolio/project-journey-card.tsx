"use client";

/**
 * Project Journey Card - The Feedback Theater
 *
 * A scroll-driven case study component that reveals the transformation story
 * of a project. Features an interactive before/after slider and highlights
 * the key feedback that drove the improvements.
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  User,
  X,
  Star,
} from "lucide-react";

interface Project {
  id: number;
  title: string;
  description: string;
  contentType: "design" | "photography" | "video" | "stream" | "audio" | "writing" | "art";
  beforeImage: string | null;
  afterImage: string | null;
  isSelfDocumented: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  reviewsReceived: number;
  projectUrl: string | null;
}

interface ProjectJourneyCardProps {
  project: Project;
  index: number;
  onToggleFeatured?: (projectId: number, featured: boolean) => Promise<void>;
  featuredSlotsRemaining?: number;
}

const contentTypeColors = {
  design: "from-blue-500 to-cyan-500",
  photography: "from-emerald-500 to-teal-500",
  video: "from-red-500 to-orange-500",
  stream: "from-purple-500 to-pink-500",
  audio: "from-yellow-500 to-amber-500",
  writing: "from-indigo-500 to-blue-500",
  art: "from-pink-500 to-rose-500",
};

export function ProjectJourneyCard({ project, index, onToggleFeatured, featuredSlotsRemaining = 0 }: ProjectJourneyCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-20%" });
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);

  const handleToggleFeatured = async () => {
    if (!onToggleFeatured || isTogglingFeatured) return;

    // Check if can feature (has remaining slots or is currently featured)
    if (!project.isFeatured && featuredSlotsRemaining <= 0) {
      return;
    }

    setIsTogglingFeatured(true);
    try {
      await onToggleFeatured(project.id, !project.isFeatured);
    } finally {
      setIsTogglingFeatured(false);
    }
  };
  const [showFullscreen, setShowFullscreen] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);

  // Check if we have before/after images for comparison
  const hasBeforeAfter = project.beforeImage && project.afterImage;

  // Handle slider drag
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !hasBeforeAfter) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !hasBeforeAfter) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity, y }}
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center",
        !isEven && "lg:flex-row-reverse"
      )}
    >
      {/* Image Section */}
      <motion.div
        className={cn("order-1", !isEven && "lg:order-2")}
        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div
          className={cn(
            "relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-2xl group",
            hasBeforeAfter && "cursor-ew-resize"
          )}
          onMouseDown={() => hasBeforeAfter && setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => hasBeforeAfter && setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
        >
          {hasBeforeAfter ? (
            <>
              {/* After Image (Background) */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
                <img
                  src={project.afterImage!}
                  alt={`${project.title} - After`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg">
                    <Sparkles className="size-3 mr-1" />
                    After
                  </Badge>
                </div>
              </div>

              {/* Before Image (Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-orange-500/10" />
                <img
                  src={project.beforeImage!}
                  alt={`${project.title} - Before`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-rose-500/90 text-white border-0 shadow-lg">
                    Before
                  </Badge>
                </div>
              </div>

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10 transition-opacity"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-10 rounded-full bg-white shadow-xl flex items-center justify-center">
                  <ChevronLeft className="size-4 text-gray-400" />
                  <ChevronRight className="size-4 text-gray-400" />
                </div>
              </div>

              {/* Drag Hint */}
              <motion.div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
                initial={{ opacity: 1 }}
                animate={{ opacity: isDragging ? 0 : 1 }}
              >
                <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-sm">
                  Drag to compare
                </Badge>
              </motion.div>
            </>
          ) : (
            /* Single Image (no before/after) */
            <div className="absolute inset-0">
              {project.afterImage ? (
                <img
                  src={project.afterImage}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="size-12 mx-auto mb-2 opacity-50" />
                    <p>No image uploaded</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fullscreen Button */}
          {(project.afterImage || project.beforeImage) && (
            <button
              onClick={() => setShowFullscreen(true)}
              className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <Maximize2 className="size-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className={cn("order-2 space-y-6", !isEven && "lg:order-1")}
        initial={{ opacity: 0, x: isEven ? 50 : -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Project Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge
              className={cn(
                "text-white border-0 bg-gradient-to-r capitalize",
                contentTypeColors[project.contentType]
              )}
            >
              {project.contentType}
            </Badge>
            {/* Verification Badge */}
            {project.isVerified ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3" />
                Verified
              </Badge>
            ) : project.isSelfDocumented ? (
              <Badge variant="secondary" className="gap-1">
                <User className="size-3" />
                Self-Documented
              </Badge>
            ) : null}
            {project.reviewsReceived > 0 && (
              <Badge variant="info" className="gap-1">
                {project.reviewsReceived} review{project.reviewsReceived !== 1 ? 's' : ''}
              </Badge>
            )}
            {/* Featured Badge/Toggle */}
            {onToggleFeatured && (
              <button
                onClick={handleToggleFeatured}
                disabled={isTogglingFeatured || (!project.isFeatured && featuredSlotsRemaining <= 0)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all",
                  project.isFeatured
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                    : featuredSlotsRemaining > 0
                      ? "bg-muted text-muted-foreground border border-border hover:bg-muted/80 hover:border-amber-500/50"
                      : "bg-muted/50 text-muted-foreground/50 border border-border/50 cursor-not-allowed",
                  isTogglingFeatured && "opacity-50"
                )}
                title={
                  project.isFeatured
                    ? "Click to unfeature"
                    : featuredSlotsRemaining > 0
                      ? "Click to feature on your profile"
                      : "Maximum featured items reached"
                }
              >
                <Star className={cn("size-3", project.isFeatured && "fill-amber-500")} />
                {project.isFeatured ? "Featured" : "Feature"}
              </button>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-lg text-muted-foreground">{project.description}</p>
          )}
        </div>

        {/* View Project Button */}
        {project.projectUrl && (
          <Button
            variant="outline"
            className="gap-2 group"
            onClick={() => window.open(project.projectUrl!, '_blank')}
          >
            View Project
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && (
          <FullscreenComparison
            project={project}
            onClose={() => setShowFullscreen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface FullscreenComparisonProps {
  project: Project;
  onClose: () => void;
}

function FullscreenComparison({ project, onClose }: FullscreenComparisonProps) {
  const hasBeforeAfter = project.beforeImage && project.afterImage;
  const [activeView, setActiveView] = useState<"before" | "after" | "split">(hasBeforeAfter ? "split" : "after");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get available views based on what images exist
  const availableViews = hasBeforeAfter
    ? (["before", "split", "after"] as const)
    : project.afterImage
      ? (["after"] as const)
      : (["before"] as const);

  const modalContent = (
    <motion.div
      className="fixed inset-0 z-[200] bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors border border-white/20 shadow-lg"
      >
        <span className="sr-only">Close</span>
        <X className="size-6" />
      </button>

      {/* View Toggle - only show if multiple views available */}
      {availableViews.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-1 rounded-full bg-white/10 backdrop-blur-md">
          {availableViews.map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize",
                activeView === view
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white"
              )}
            >
              {view}
            </button>
          ))}
        </div>
      )}

      {/* Images */}
      <div className="relative w-full h-full">
        {activeView === "split" && hasBeforeAfter ? (
          <>
            <img
              src={project.afterImage!}
              alt="After"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={project.beforeImage!}
                alt="Before"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 accent-white"
            />
          </>
        ) : (
          (activeView === "before" ? project.beforeImage : project.afterImage) && (
            <img
              src={(activeView === "before" ? project.beforeImage : project.afterImage)!}
              alt={activeView}
              className="w-full h-full object-contain"
            />
          )
        )}
      </div>

      {/* Project Info */}
      <div className="absolute bottom-8 left-8 text-white">
        <h2 className="text-2xl font-bold mb-1">{project.title}</h2>
        <p className="text-white/70">{project.description}</p>
      </div>
    </motion.div>
  );

  // Use portal to render modal at document body level to escape stacking context
  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

export default ProjectJourneyCard;
