"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Users,
  Trophy,
  Palette,
  Code,
  Video,
  Headphones,
  FileText,
  Brush,
  Radio,
  ArrowRight,
  Star,
} from "lucide-react";

export interface OpenChallengeCardProps {
  id: number;
  title: string;
  description?: string;
  contentType: string;
  status: "open" | "active" | "voting" | "completed";
  totalEntries: number;
  maxWinners: number;
  timeLeft?: string;
  timeProgress?: number; // 0-100
  prizeDescription?: string;
  winnerKarmaReward?: number;
  isFeatured?: boolean;
  userHasJoined?: boolean;
  userHasSubmitted?: boolean;
  onClick?: () => void;
}

const contentTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  design: { icon: Palette, color: "text-accent-blue", bg: "bg-accent-blue/10" },
  code: { icon: Code, color: "text-accent-sage", bg: "bg-accent-sage/10" },
  video: { icon: Video, color: "text-red-500", bg: "bg-red-50" },
  audio: { icon: Headphones, color: "text-accent-peach", bg: "bg-accent-peach/10" },
  writing: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  art: { icon: Brush, color: "text-purple-500", bg: "bg-purple-50" },
  stream: { icon: Radio, color: "text-pink-500", bg: "bg-pink-50" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Open for Entries", color: "text-accent-sage", bg: "bg-accent-sage/10" },
  active: { label: "Submissions Open", color: "text-accent-blue", bg: "bg-accent-blue/10" },
  voting: { label: "Voting", color: "text-accent-peach", bg: "bg-accent-peach/10" },
  completed: { label: "Completed", color: "text-gray-500", bg: "bg-gray-100" },
};

export function OpenChallengeCard({
  id,
  title,
  description,
  contentType,
  status,
  totalEntries,
  maxWinners,
  timeLeft,
  timeProgress = 0,
  prizeDescription,
  winnerKarmaReward,
  isFeatured,
  userHasJoined,
  userHasSubmitted,
  onClick,
}: OpenChallengeCardProps) {
  const typeConfig = contentTypeConfig[contentType] || contentTypeConfig.design;
  const statusStyle = statusConfig[status] || statusConfig.open;
  const Icon = typeConfig.icon;

  const canJoin = status === "open" || status === "active";

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer",
        "bg-white border border-gray-100",
        "shadow-sm hover:shadow-lg transition-all duration-300",
        isFeatured && "ring-2 ring-accent-peach/30"
      )}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Featured Banner */}
      {isFeatured && (
        <div className="bg-gradient-to-r from-accent-peach to-orange-500 px-4 py-2 flex items-center justify-center gap-2">
          <Star className="w-4 h-4 text-white fill-white" />
          <span className="text-sm font-semibold text-white">Featured Challenge</span>
        </div>
      )}

      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          {/* Content Type Icon */}
          <div className={cn("p-2.5 rounded-xl", typeConfig.bg)}>
            <Icon className={cn("w-5 h-5", typeConfig.color)} />
          </div>

          {/* Status Badge */}
          <Badge
            variant="outline"
            className={cn("font-medium border-0", statusStyle.bg, statusStyle.color)}
          >
            {status === "open" && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-sage animate-pulse mr-1.5" />
            )}
            {statusStyle.label}
          </Badge>
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{description}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {totalEntries} entries
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            Top {maxWinners} win
          </span>
          {winnerKarmaReward && (
            <span className="flex items-center gap-1.5 text-accent-peach font-medium">
              +{winnerKarmaReward} karma
            </span>
          )}
        </div>

        {/* Time Progress */}
        {timeLeft && canJoin && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Time remaining</span>
              <span className="font-medium text-gray-700">{timeLeft}</span>
            </div>
            <Progress value={timeProgress} className="h-1.5" />
          </div>
        )}

        {/* Prize Description */}
        {prizeDescription && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-sm text-gray-600">{prizeDescription}</p>
          </div>
        )}

        {/* Action Button */}
        {canJoin && !userHasJoined && (
          <Button
            className="w-full bg-gradient-to-r from-accent-blue to-cyan-500 hover:opacity-90 text-white"
          >
            Join Challenge
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {canJoin && userHasJoined && !userHasSubmitted && (
          <Button
            variant="outline"
            className="w-full border-accent-blue text-accent-blue hover:bg-accent-blue/5"
          >
            Submit Entry
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {userHasSubmitted && (
          <div className="text-center py-2 text-sm text-accent-sage font-medium">
            Entry submitted
          </div>
        )}

        {status === "voting" && (
          <Button
            className="w-full bg-accent-peach hover:bg-accent-peach/90 text-white"
          >
            View & Vote
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {status === "completed" && (
          <Button
            variant="outline"
            className="w-full"
          >
            View Results
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Compact version for lists
export function OpenChallengeCardCompact({
  title,
  contentType,
  status,
  totalEntries,
  timeLeft,
  onClick,
}: Pick<OpenChallengeCardProps, "title" | "contentType" | "status" | "totalEntries" | "timeLeft" | "onClick">) {
  const typeConfig = contentTypeConfig[contentType] || contentTypeConfig.design;
  const Icon = typeConfig.icon;

  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
      whileHover={{ x: 2 }}
    >
      {/* Icon */}
      <div className={cn("p-2 rounded-lg", typeConfig.bg)}>
        <Icon className={cn("w-4 h-4", typeConfig.color)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{title}</p>
        <p className="text-xs text-gray-500">{totalEntries} entries</p>
      </div>

      {/* Time/Status */}
      {status === "open" && timeLeft && (
        <Badge variant="outline" className="text-xs border-accent-sage/30 text-accent-sage">
          {timeLeft}
        </Badge>
      )}
      {status === "voting" && (
        <Badge variant="outline" className="text-xs border-accent-peach/30 text-accent-peach">
          Voting
        </Badge>
      )}
    </motion.div>
  );
}
