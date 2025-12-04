"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, ArrowRight } from "lucide-react";

interface ComparisonFeature {
  label: string;
  community: string;
  expert: string;
}

interface ComparisonFlipCardProps {
  className?: string;
  onCommunityClick?: () => void;
  onExpertClick?: () => void;
}

const features: ComparisonFeature[] = [
  { label: "Cost", community: "Free (3/month) or Pro $9/mo", expert: "$50-150 per review" },
  { label: "Turnaround", community: "24-48 hours", expert: "24 hours guaranteed" },
  { label: "Best For", community: "Peer perspective", expert: "Professional validation" },
  { label: "Depth", community: "Thoughtful critique", expert: "Industry expertise" },
  { label: "Reviewers", community: "Verified creators", expert: "Vetted professionals" },
];

/**
 * Comparison cards with 3D flip animation
 * Shows Community vs Expert review options
 */
export function ComparisonFlipCard({
  className,
  onCommunityClick,
  onExpertClick,
}: ComparisonFlipCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleFlip = (index: number) => {
    if (prefersReducedMotion) return;
    setFlippedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Side by side cards */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8">
        {/* Community Card */}
        <motion.div
          className="relative p-8 rounded-3xl border-2 border-green-200 dark:border-green-500/30 bg-gradient-to-br from-white to-green-50/30 dark:from-[var(--dark-tier-2)] dark:to-green-500/5 shadow-xl overflow-hidden group"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -4 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-50" />

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
              Community
            </span>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">
              Peer Feedback
            </h3>
            <p className="text-gray-600 dark:text-muted-foreground mb-6">
              Get thoughtful critique from fellow creators
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="size-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-foreground">{feature.label}</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">{feature.community}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onCommunityClick}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              Get Community Feedback
              <ArrowRight className="size-4" />
            </button>
          </div>
        </motion.div>

        {/* Expert Card */}
        <motion.div
          className="relative p-8 rounded-3xl border-2 border-accent-peach/20 dark:border-accent-peach/30 bg-gradient-to-br from-white to-orange-50/30 dark:from-[var(--dark-tier-2)] dark:to-accent-peach/5 shadow-xl overflow-hidden group"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -4 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-peach/10 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-50" />

          {/* Popular badge */}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-accent-peach text-white text-xs font-bold">
              POPULAR
            </span>
          </div>

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-accent-peach/10 text-accent-peach text-sm font-medium mb-4">
              Expert
            </span>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">
              Professional Critique
            </h3>
            <p className="text-gray-600 dark:text-muted-foreground mb-6">
              Industry veterans with 5+ years experience
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="size-5 text-accent-peach mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-foreground">{feature.label}</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">{feature.expert}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onExpertClick}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-peach to-orange-500 hover:from-accent-peach/90 hover:to-orange-500/90 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              Browse Expert Reviewers
              <ArrowRight className="size-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile: Flippable cards */}
      <div className="md:hidden space-y-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="relative h-[120px]"
            style={{ perspective: "1000px" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className="absolute inset-0 cursor-pointer"
              animate={{ rotateY: flippedCards[index] ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
              onClick={() => toggleFlip(index)}
            >
              {/* Front - Community */}
              <div
                className={cn(
                  "absolute inset-0 p-4 rounded-2xl border-2 border-green-200 dark:border-green-500/30 bg-gradient-to-br from-white to-green-50/50 dark:from-[var(--dark-tier-2)] dark:to-green-500/5 shadow-md",
                  "[backface-visibility:hidden]"
                )}
              >
                <div className="flex items-center justify-between h-full">
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                      Community
                    </p>
                    <p className="font-bold text-gray-900 dark:text-foreground">{feature.label}</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                      {feature.community}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Tap to flip</div>
                </div>
              </div>

              {/* Back - Expert */}
              <div
                className={cn(
                  "absolute inset-0 p-4 rounded-2xl border-2 border-accent-peach/20 dark:border-accent-peach/30 bg-gradient-to-br from-white to-orange-50/50 dark:from-[var(--dark-tier-2)] dark:to-accent-peach/5 shadow-md",
                  "[backface-visibility:hidden]"
                )}
                style={{ transform: "rotateY(180deg)" }}
              >
                <div className="flex items-center justify-between h-full">
                  <div>
                    <p className="text-xs text-accent-peach font-medium mb-1">
                      Expert
                    </p>
                    <p className="font-bold text-gray-900 dark:text-foreground">{feature.label}</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                      {feature.expert}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Tap to flip</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}

        {/* Mobile CTAs */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <button
            onClick={onCommunityClick}
            className="py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all"
          >
            Community
          </button>
          <button
            onClick={onExpertClick}
            className="py-4 rounded-2xl bg-accent-peach hover:bg-accent-peach/90 text-white font-semibold text-sm transition-all"
          >
            Expert
          </button>
        </div>
      </div>
    </div>
  );
}
