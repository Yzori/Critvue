"use client";

/**
 * Featured Works Carousel
 *
 * A stunning sliding carousel that transitions between featured portfolio items
 * with smooth horizontal slide animations and an interactive slider control.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Play,
  Pause,
} from "lucide-react";
import { PortfolioItem } from "@/lib/api/profile/portfolio";
import { getFileUrl } from "@/lib/api/client";

interface FeaturedWorksCarouselProps {
  items: PortfolioItem[];
  autoPlayInterval?: number;
}

export function FeaturedWorksCarousel({
  items,
  autoPlayInterval = 8000,
}: FeaturedWorksCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setProgress(0);
  }, [items.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setProgress(0);
  }, [items.length]);

  const goToIndex = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setProgress(0);
  }, [currentIndex]);

  // Auto-play functionality with progress tracking
  useEffect(() => {
    if (!isPlaying || items.length <= 1) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (autoPlayInterval / 50));
        return newProgress;
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [isPlaying, items.length, autoPlayInterval]);

  // Trigger slide when progress completes
  useEffect(() => {
    if (progress >= 100) {
      goToNext();
    }
  }, [progress, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  // Slide animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 1,
    }),
  };

  return (
    <div className="relative group">
      {/* Main carousel container */}
      <div
        className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        {/* Sliding image stack */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentItem.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", ease: "easeInOut", duration: 1.5 },
              opacity: { duration: 0.8 },
            }}
            className="absolute inset-0"
          >
            {currentItem.image_url ? (
              <img
                src={getFileUrl(currentItem.image_url)}
                alt={currentItem.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="size-20 text-amber-500/50" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />

        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all hover:scale-110 z-10"
              aria-label="Previous"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all hover:scale-110 z-10"
              aria-label="Next"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentItem.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-amber-500/90 text-white border-0 shadow-lg gap-1">
                      <Star className="size-3 fill-white" />
                      Featured
                    </Badge>
                    <Badge variant="secondary" className="bg-white/10 text-white border-0 backdrop-blur-sm capitalize">
                      {currentItem.content_type}
                    </Badge>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 truncate">
                    {currentItem.title}
                  </h3>
                  {currentItem.description && (
                    <p className="text-white/80 text-sm sm:text-base line-clamp-2 max-w-2xl">
                      {currentItem.description}
                    </p>
                  )}
                </div>

                {currentItem.project_url && (
                  <Button
                    size="sm"
                    className="shrink-0 gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
                    onClick={() => window.open(currentItem.project_url!, "_blank")}
                  >
                    View Project
                    <ExternalLink className="size-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Play/Pause indicator */}
        {items.length > 1 && (
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className="absolute top-4 right-4 size-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4 ml-0.5" />
            )}
          </button>
        )}

        {/* Progress bar at bottom */}
        {items.length > 1 && isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-20">
            <motion.div
              className="h-full bg-amber-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Thumbnail navigation */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => goToIndex(index)}
              className={cn(
                "relative rounded-lg overflow-hidden transition-all",
                index === currentIndex
                  ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-background scale-110"
                  : "opacity-60 hover:opacity-100 hover:scale-105"
              )}
            >
              <div className="relative w-16 h-12 sm:w-20 sm:h-14">
                {item.image_url ? (
                  <img
                    src={getFileUrl(item.image_url)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 flex items-center justify-center">
                    <Sparkles className="size-4 text-amber-500" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {items.map((item, index) => (
            <button
              key={`dot-${item.id}`}
              onClick={() => goToIndex(index)}
              className={cn(
                "transition-all",
                index === currentIndex
                  ? "w-8 h-2 rounded-full bg-amber-500"
                  : "w-2 h-2 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FeaturedWorksCarousel;
