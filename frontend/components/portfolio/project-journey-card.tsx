"use client";

/**
 * Project Journey Card - The Feedback Theater
 *
 * A scroll-driven case study component that reveals the transformation story
 * of a project. Features an interactive before/after slider and highlights
 * the key feedback that drove the improvements.
 */

import { useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Quote,
  TrendingUp,
  ArrowRight,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface ProjectMetrics {
  [key: string]: {
    before: number;
    after: number;
  } | undefined;
}

interface Project {
  id: number;
  title: string;
  description: string;
  contentType: "design" | "photography" | "video" | "stream" | "audio" | "writing" | "art";
  beforeImage: string;
  afterImage: string;
  improvementScore: number;
  keyFeedback: string;
  reviewerName: string;
  reviewerSpecialty: string;
  metrics: ProjectMetrics;
}

interface ProjectJourneyCardProps {
  project: Project;
  index: number;
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

export function ProjectJourneyCard({ project, index }: ProjectJourneyCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-20%" });
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);

  // Handle slider drag
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
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
      {/* Before/After Comparison */}
      <motion.div
        className={cn("order-1", !isEven && "lg:order-2")}
        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div
          className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-2xl cursor-ew-resize group"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
        >
          {/* After Image (Background) */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
            <img
              src={project.afterImage}
              alt={`${project.title} - After`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder
                e.currentTarget.src = `https://placehold.co/800x600/1f2937/4CC9F0?text=After`;
              }}
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
              src={project.beforeImage}
              alt={`${project.title} - Before`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/800x600/374151/F97316?text=Before`;
              }}
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

          {/* Fullscreen Button */}
          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <Maximize2 className="size-5" />
          </button>
        </div>

        {/* Improvement Score Badge */}
        <motion.div
          className="flex justify-center -mt-6 relative z-10"
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
        >
          <div className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-xl flex items-center gap-2">
            <TrendingUp className="size-5" />
            +{project.improvementScore}% Improvement
          </div>
        </motion.div>
      </motion.div>

      {/* Content & Feedback */}
      <motion.div
        className={cn("order-2 space-y-6", !isEven && "lg:order-1")}
        initial={{ opacity: 0, x: isEven ? 50 : -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Project Info */}
        <div>
          <Badge
            className={cn(
              "mb-3 text-white border-0 bg-gradient-to-r capitalize",
              contentTypeColors[project.contentType]
            )}
          >
            {project.contentType}
          </Badge>
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {project.title}
          </h3>
          <p className="text-lg text-muted-foreground">{project.description}</p>
        </div>

        {/* Key Feedback Quote */}
        <motion.div
          className="relative p-6 rounded-2xl bg-muted/50 border border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          <Quote className="absolute -top-3 -left-3 size-8 text-accent-blue/30" />
          <p className="text-lg italic text-foreground mb-4">
            "{project.keyFeedback}"
          </p>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {project.reviewerName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {project.reviewerName}
              </div>
              <div className="text-sm text-muted-foreground">
                {project.reviewerSpecialty}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Improvement Breakdown
          </h4>
          {Object.entries(project.metrics)
            .filter(([, value]) => value !== undefined)
            .map(([key, value], i) => (
              <MetricBar
                key={key}
                label={key}
                before={value!.before}
                after={value!.after}
                delay={0.6 + i * 0.1}
                isInView={isInView}
              />
            ))}
        </div>

        {/* View Project Button */}
        <Button variant="outline" className="gap-2 group">
          View Full Case Study
          <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
        </Button>
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

interface MetricBarProps {
  label: string;
  before: number;
  after: number;
  delay: number;
  isInView: boolean;
}

function MetricBar({ label, before, after, delay, isInView }: MetricBarProps) {
  const improvement = after - before;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">
          {before} <ArrowRight className="inline size-3" /> {after}
          <span className="ml-2 text-emerald-500 font-semibold">+{improvement}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        {/* Before bar */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-muted-foreground/30 rounded-full"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${before}%` } : {}}
          transition={{ duration: 0.6, delay }}
        />
        {/* After bar */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${after}%` } : {}}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
        />
      </div>
    </div>
  );
}

interface FullscreenComparisonProps {
  project: Project;
  onClose: () => void;
}

function FullscreenComparison({ project, onClose }: FullscreenComparisonProps) {
  const [activeView, setActiveView] = useState<"before" | "after" | "split">("split");
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <span className="sr-only">Close</span>
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* View Toggle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 p-1 rounded-full bg-white/10 backdrop-blur-md">
        {(["before", "split", "after"] as const).map((view) => (
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

      {/* Images */}
      <div className="relative w-full h-full">
        {activeView === "split" ? (
          <>
            <img
              src={project.afterImage}
              alt="After"
              className="absolute inset-0 w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/1920x1080/1f2937/4CC9F0?text=After`;
              }}
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={project.beforeImage}
                alt="Before"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://placehold.co/1920x1080/374151/F97316?text=Before`;
                }}
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
          <img
            src={activeView === "before" ? project.beforeImage : project.afterImage}
            alt={activeView}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/1920x1080/374151/4CC9F0?text=${activeView}`;
            }}
          />
        )}
      </div>

      {/* Project Info */}
      <div className="absolute bottom-8 left-8 text-white">
        <h2 className="text-2xl font-bold mb-1">{project.title}</h2>
        <p className="text-white/70">{project.description}</p>
      </div>
    </motion.div>
  );
}

export default ProjectJourneyCard;
