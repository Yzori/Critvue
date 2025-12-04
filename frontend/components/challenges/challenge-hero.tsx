"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Users, FileText, Clock } from "lucide-react";

type ChallengeStatus = "live" | "upcoming" | "completed";

interface ChallengeHeroProps {
  title: string;
  description: string;
  category: string;
  status: ChallengeStatus;
  categoryTags: string[];
  participantsCount: number;
  submissionsCount: number;
  timeLeft?: string;
  timeProgress?: number; // 0-100
  hasSubmitted?: boolean;
  onJoinAsCreator?: () => void;
  onJoinAsReviewer?: () => void;
  onViewEntry?: () => void;
}

const statusConfig: Record<ChallengeStatus, { label: string; className: string }> = {
  live: {
    label: "Live",
    className: "bg-accent-sage/20 text-accent-sage border-accent-sage/30",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-accent-blue/20 text-accent-blue border-accent-blue/30",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function ChallengeHero({
  title,
  description,
  category,
  status,
  categoryTags,
  participantsCount,
  submissionsCount,
  timeLeft,
  timeProgress = 0,
  hasSubmitted,
  onJoinAsCreator,
  onJoinAsReviewer,
  onViewEntry,
}: ChallengeHeroProps) {
  const statusStyle = statusConfig[status];

  // Split title to highlight last word with gradient
  const titleWords = title.split(" ");
  const lastWord = titleWords.pop();
  const titleStart = titleWords.join(" ");

  return (
    <section className="w-full py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          {/* Left Content */}
          <div className="flex-1 max-w-2xl">
            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <Badge
                variant="secondary"
                className="bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
              >
                Challenges
                <ChevronRight className="w-3 h-3 mx-1 text-white/40" />
                {category}
              </Badge>
            </motion.div>

            {/* Status Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mb-4"
            >
              <Badge
                variant="outline"
                className={cn("font-medium", statusStyle.className)}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mr-2",
                    status === "live" && "bg-accent-sage animate-pulse",
                    status === "upcoming" && "bg-accent-blue",
                    status === "completed" && "bg-muted-foreground"
                  )}
                />
                {statusStyle.label}
              </Badge>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4"
            >
              {titleStart}{" "}
              <span className="bg-gradient-to-r from-accent-blue via-purple-400 to-accent-peach bg-clip-text text-transparent">
                {lastWord}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-white/60 text-lg leading-relaxed mb-6 line-clamp-2"
            >
              {description}
            </motion.p>

            {/* Meta Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-wrap items-center gap-3 mb-6"
            >
              {/* Category Tags */}
              {categoryTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-white/5 text-white/70 border-white/10"
                >
                  {tag}
                </Badge>
              ))}

              <div className="w-px h-4 bg-white/20 mx-1" />

              {/* Stats */}
              <div className="flex items-center gap-1.5 text-white/50 text-sm">
                <Users className="w-4 h-4" />
                <span>{participantsCount} participants</span>
              </div>

              <div className="flex items-center gap-1.5 text-white/50 text-sm">
                <FileText className="w-4 h-4" />
                <span>{submissionsCount} submissions</span>
              </div>

              {/* Time Left with Progress Bar */}
              {timeLeft && status === "live" && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/50" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-white/70">{timeLeft} left</span>
                    <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-peach"
                        initial={{ width: 0 }}
                        animate={{ width: `${timeProgress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right - CTA Block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex flex-col gap-3 lg:min-w-[240px]"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-accent-blue to-purple-500 hover:opacity-90 text-white font-semibold h-12 rounded-xl shadow-lg shadow-accent-blue/20"
              onClick={onJoinAsCreator}
            >
              Join as Creator
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 hover:border-white/30 h-12 rounded-xl"
              onClick={onJoinAsReviewer}
            >
              Join as Reviewer
            </Button>

            {hasSubmitted && (
              <button
                onClick={onViewEntry}
                className="text-sm text-white/50 hover:text-white/70 transition-colors mt-1"
              >
                Already submitted? View your entry →
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
