"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star, ChevronLeft, ChevronRight, Code, Palette, Video } from "lucide-react";

interface ReviewerCard {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  avatar: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ReviewerCardStackProps {
  className?: string;
  perspective?: "creator" | "reviewer";
}

const mockReviewers: ReviewerCard[] = [
  {
    id: 1,
    name: "Sarah Chen",
    specialty: "Frontend Expert",
    rating: 4.9,
    reviews: 127,
    avatar: "SC",
    icon: Code,
  },
  {
    id: 2,
    name: "Marcus Johnson",
    specialty: "UI/UX Designer",
    rating: 5.0,
    reviews: 89,
    avatar: "MJ",
    icon: Palette,
  },
  {
    id: 3,
    name: "Alex Rivera",
    specialty: "Video Production",
    rating: 4.8,
    reviews: 156,
    avatar: "AR",
    icon: Video,
  },
];

const mockProjects = [
  {
    id: 1,
    name: "E-commerce App",
    specialty: "React / Next.js",
    rating: 50,
    reviews: 2,
    avatar: "EA",
    icon: Code,
  },
  {
    id: 2,
    name: "Brand Redesign",
    specialty: "Figma / Design System",
    rating: 75,
    reviews: 1,
    avatar: "BR",
    icon: Palette,
  },
  {
    id: 3,
    name: "Product Demo",
    specialty: "Video Editing",
    rating: 100,
    reviews: 3,
    avatar: "PD",
    icon: Video,
  },
];

/**
 * Swipeable card stack showing reviewers or projects
 * Features drag gestures on mobile, click navigation on desktop
 */
export function ReviewerCardStack({
  className,
  perspective = "creator",
}: ReviewerCardStackProps) {
  const prefersReducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const isCreator = perspective === "creator";
  const cards = isCreator ? mockReviewers : mockProjects;

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      goToPrev();
    } else if (info.offset.x < -threshold) {
      goToNext();
    }
  };

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: "easeOut",
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? -15 : 15,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
      },
    }),
  };

  const currentCard = cards[currentIndex];
  const Icon = currentCard.icon;

  return (
    <div className={cn("relative w-full max-w-md mx-auto", className)}>
      {/* Card container with perspective */}
      <div
        className="relative h-[320px] sm:h-[360px]"
        style={{ perspective: "1000px" }}
      >
        {/* Background cards for depth */}
        {cards.map((_, index) => {
          const offset = (index - currentIndex + cards.length) % cards.length;
          if (offset === 0 || offset > 2) return null;

          return (
            <div
              key={index}
              className={cn(
                "absolute inset-4 rounded-3xl border-2 transition-all duration-300",
                isCreator
                  ? "bg-blue-50/50 border-accent-blue/10"
                  : "bg-orange-50/50 border-accent-peach/10"
              )}
              style={{
                transform: `translateY(${offset * 8}px) scale(${1 - offset * 0.05})`,
                zIndex: 10 - offset,
                opacity: 1 - offset * 0.3,
              }}
            />
          );
        })}

        {/* Active card */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentCard.id}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              "absolute inset-0 p-6 sm:p-8 rounded-3xl border-2 shadow-xl cursor-grab active:cursor-grabbing",
              "bg-white/90 backdrop-blur-sm",
              isCreator
                ? "border-accent-blue/20"
                : "border-accent-peach/20"
            )}
            style={{ zIndex: 20 }}
          >
            {/* Card content */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                {/* Avatar */}
                <div
                  className={cn(
                    "size-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white",
                    isCreator
                      ? "bg-gradient-to-br from-accent-blue to-blue-600"
                      : "bg-gradient-to-br from-accent-peach to-orange-500"
                  )}
                >
                  {currentCard.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {currentCard.name}
                  </h3>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Icon className="size-4" />
                    {currentCard.specialty}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-6">
                <div>
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-gray-900">
                      {isCreator
                        ? currentCard.rating.toFixed(1)
                        : `$${currentCard.rating}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isCreator ? "Rating" : "Budget"}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-gray-900">
                    {currentCard.reviews}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isCreator ? "Reviews" : "Slots"}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-auto">
                <button
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold text-white transition-all duration-300",
                    isCreator
                      ? "bg-accent-blue hover:bg-accent-blue/90"
                      : "bg-accent-peach hover:bg-accent-peach/90"
                  )}
                >
                  {isCreator ? "View Profile" : "Claim Project"}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={goToPrev}
          className={cn(
            "size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isCreator
              ? "border-accent-blue/20 text-accent-blue hover:bg-accent-blue/10"
              : "border-accent-peach/20 text-accent-peach hover:bg-accent-peach/10"
          )}
          aria-label="Previous card"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={cn(
                "size-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? isCreator
                    ? "bg-accent-blue w-6"
                    : "bg-accent-peach w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          className={cn(
            "size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isCreator
              ? "border-accent-blue/20 text-accent-blue hover:bg-accent-blue/10"
              : "border-accent-peach/20 text-accent-peach hover:bg-accent-peach/10"
          )}
          aria-label="Next card"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Swipe hint on mobile */}
      <p className="text-center text-xs text-gray-400 mt-4 sm:hidden">
        Swipe to browse
      </p>
    </div>
  );
}
