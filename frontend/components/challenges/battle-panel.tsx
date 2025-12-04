"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, ExternalLink, HelpCircle, Users, Award } from "lucide-react";

// Types as specified
export interface Competitor {
  id: string;
  name: string;
  avatarUrl?: string;
  roleLabel: string;
  levelLabel: string;
  category: string;
  submissionThumbUrl?: string;
  submissionUrl: string;
  communityVotes: number;
  expertScore?: number;
}

export interface BattlePanelProps {
  battleId: string;
  title: string;
  battleType?: "1v1 Battle" | "Group Showdown";
  timeLeft: string;
  totalVotes: number;
  creatorVotes?: number;
  reviewerVotes?: number;
  left: Competitor;
  right: Competitor;
  userVote?: "left" | "right" | null;
  onVote: (side: "left" | "right") => void;
}

type VoteMode = "community" | "expert";

export function BattlePanel({
  battleId,
  title,
  battleType = "1v1 Battle",
  timeLeft,
  totalVotes,
  creatorVotes = 0,
  reviewerVotes = 0,
  left,
  right,
  userVote,
  onVote,
}: BattlePanelProps) {
  const [voteMode, setVoteMode] = useState<VoteMode>("community");
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);

  const totalCommunityVotes = left.communityVotes + right.communityVotes;
  const leftPercentage = totalCommunityVotes > 0
    ? Math.round((left.communityVotes / totalCommunityVotes) * 100)
    : 50;
  const rightPercentage = 100 - leftPercentage;

  const handleVote = (side: "left" | "right") => {
    onVote(side);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "w-full max-w-[1100px] mx-auto",
        "bg-gray-900/80 backdrop-blur-xl",
        "border border-white/10 rounded-3xl",
        "shadow-2xl shadow-black/20",
        "overflow-hidden"
      )}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Badge
          variant="outline"
          className="bg-accent-blue/10 text-accent-blue border-accent-blue/20"
        >
          {battleType}
        </Badge>

        <span className="text-sm font-medium text-white/80">{title}</span>

        <div className="flex items-center gap-1.5 text-white/60 text-sm">
          <Clock className="w-4 h-4" />
          <span>{timeLeft} left to vote</span>
        </div>
      </div>

      {/* Main VS Section */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 md:gap-8 items-center">
          {/* Left Competitor */}
          <CompetitorCard
            competitor={left}
            side="left"
            isHovered={hoveredSide === "left"}
            isVoted={userVote === "left"}
            voteMode={voteMode}
            onHover={() => setHoveredSide("left")}
            onLeave={() => setHoveredSide(null)}
          />

          {/* Center VS */}
          <div className="flex flex-col items-center gap-4">
            {/* VS Disk */}
            <motion.div
              className="relative w-16 h-16 md:w-20 md:h-20"
              animate={{
                scale: hoveredSide ? 1.05 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Gradient Ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-blue via-purple-500 to-accent-peach p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-xl md:text-2xl font-black text-white">
                    VS
                  </span>
                </div>
              </div>

              {/* Subtle glow */}
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{
                  background: "linear-gradient(135deg, #4CC9F0 0%, #8B5CF6 50%, #F97316 100%)",
                }}
              />
            </motion.div>

            {/* Vote Mode Toggle */}
            <div className="flex items-center bg-white/5 rounded-full p-1">
              <button
                onClick={() => setVoteMode("community")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                  voteMode === "community"
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/70"
                )}
              >
                Community Vote
              </button>
              <button
                onClick={() => setVoteMode("expert")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                  voteMode === "expert"
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/70"
                )}
              >
                Expert Verdict
              </button>
            </div>
          </div>

          {/* Right Competitor */}
          <CompetitorCard
            competitor={right}
            side="right"
            isHovered={hoveredSide === "right"}
            isVoted={userVote === "right"}
            voteMode={voteMode}
            onHover={() => setHoveredSide("right")}
            onLeave={() => setHoveredSide(null)}
          />
        </div>

        {/* Voting Bar */}
        <div className="mt-8">
          <div className="relative h-3 rounded-full overflow-hidden bg-white/5">
            {/* Left Side */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-blue to-cyan-400"
              initial={{ width: "50%" }}
              animate={{ width: `${leftPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {/* Right Side */}
            <motion.div
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-purple-500 to-violet-400"
              initial={{ width: "50%" }}
              animate={{ width: `${rightPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Percentage Labels */}
          <div className="flex justify-between mt-2">
            <span className="text-lg font-bold text-accent-blue">{leftPercentage}%</span>
            <span className="text-lg font-bold text-purple-400">{rightPercentage}%</span>
          </div>
        </div>

        {/* Vote Buttons */}
        <AnimatePresence mode="wait">
          {!userVote ? (
            <motion.div
              key="vote-buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-4 mt-6"
            >
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleVote("left")}
                  className="bg-gradient-to-r from-accent-blue to-cyan-500 hover:opacity-90 text-white font-medium h-11"
                >
                  Vote for {left.name}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white/70"
                  asChild
                >
                  <a href={left.submissionUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View full submission
                  </a>
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleVote("right")}
                  className="bg-gradient-to-r from-purple-500 to-violet-500 hover:opacity-90 text-white font-medium h-11"
                >
                  Vote for {right.name}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white/70"
                  asChild
                >
                  <a href={right.submissionUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View full submission
                  </a>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="voted-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 mt-6 py-4 bg-white/5 rounded-xl"
            >
              <Check className="w-5 h-5 text-accent-sage" />
              <span className="text-white/80">
                You voted for{" "}
                <span className="font-semibold text-white">
                  {userVote === "left" ? left.name : right.name}
                </span>
              </span>
              <span className="text-white/40 mx-2">—</span>
              <button
                onClick={() => onVote(userVote === "left" ? "right" : "left")}
                className="text-sm text-white/50 hover:text-white/70 underline underline-offset-2"
              >
                change vote until timer ends
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Strip */}
      <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-white/50">
          <span>{totalVotes} total votes</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>{creatorVotes} creators</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>{reviewerVotes} reviewers</span>
        </div>
        <button className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/70 transition-colors">
          <HelpCircle className="w-4 h-4" />
          How voting works
        </button>
      </div>
    </motion.div>
  );
}

// Competitor Card Sub-component - Horizontal layout on desktop
function CompetitorCard({
  competitor,
  side,
  isHovered,
  isVoted,
  voteMode,
  onHover,
  onLeave,
}: {
  competitor: Competitor;
  side: "left" | "right";
  isHovered: boolean;
  isVoted: boolean;
  voteMode: VoteMode;
  onHover: () => void;
  onLeave: () => void;
}) {
  const isLeft = side === "left";

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-white/[0.02] border border-white/5",
        "transition-all duration-200",
        isHovered && "bg-white/[0.04] border-white/10 shadow-lg",
        isVoted && "ring-2 ring-accent-sage/50"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      animate={{
        y: isHovered ? -4 : 0,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Voted Check */}
      {isVoted && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-6 h-6 rounded-full bg-accent-sage/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-accent-sage" />
          </div>
        </div>
      )}

      {/* Horizontal Layout: Thumbnail + Info */}
      <div className={cn(
        "flex flex-col md:flex-row",
        !isLeft && "md:flex-row-reverse" // Right side: info on left, thumbnail on right
      )}>
        {/* Submission Thumbnail - Large on desktop */}
        {competitor.submissionThumbUrl && (
          <div className="relative md:w-1/2 aspect-video md:aspect-[4/3] overflow-hidden bg-white/5">
            <Image
              src={competitor.submissionThumbUrl}
              alt={`${competitor.name}'s submission`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Gradient overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-gray-900/50",
              !isLeft && "md:bg-gradient-to-l"
            )} />
          </div>
        )}

        {/* User Info */}
        <div className={cn(
          "flex-1 p-4 md:p-5 flex flex-col",
          isLeft ? "md:items-start md:text-left" : "md:items-end md:text-right",
          "items-center text-center"
        )}>
          {/* Avatar with Glow Ring on Hover */}
          <div className="relative mb-3">
            <motion.div
              className={cn(
                "absolute -inset-1 rounded-full opacity-0",
                isLeft
                  ? "bg-gradient-to-br from-accent-blue to-cyan-400"
                  : "bg-gradient-to-br from-purple-500 to-violet-400"
              )}
              animate={{ opacity: isHovered ? 0.5 : 0 }}
              style={{ filter: "blur(8px)" }}
            />
            <Avatar className="w-14 h-14 md:w-16 md:h-16 border-2 border-white/10 relative">
              <AvatarImage src={competitor.avatarUrl} />
              <AvatarFallback className="bg-white/5 text-white text-lg">
                {competitor.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name & Role */}
          <h3 className="font-semibold text-white mb-0.5">
            {competitor.name}
          </h3>
          <p className="text-sm text-white/50 mb-3">
            {competitor.roleLabel}
          </p>

          {/* Tags */}
          <div className={cn(
            "flex flex-wrap gap-1.5 mb-3",
            isLeft ? "md:justify-start" : "md:justify-end",
            "justify-center"
          )}>
            <Badge
              variant="secondary"
              className="bg-white/5 text-white/60 border-white/10 text-xs"
            >
              {competitor.levelLabel}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-white/5 text-white/60 border-white/10 text-xs"
            >
              {competitor.category}
            </Badge>
          </div>

          {/* Score Display */}
          <AnimatePresence mode="wait">
            {voteMode === "expert" && competitor.expertScore !== undefined && (
              <motion.div
                key="expert-score"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "flex items-center gap-2 mt-auto pt-2",
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                <Award className={cn(
                  "w-4 h-4",
                  isLeft ? "text-accent-blue" : "text-purple-400"
                )} />
                <span className="text-lg font-bold text-white">
                  {competitor.expertScore}
                </span>
                <span className="text-sm text-white/50">/100</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Compact Battle Card for lists
export function BattleCardCompact({
  left,
  right,
  title,
  timeLeft,
  onClick,
}: {
  left: { name: string; avatarUrl?: string; votes: number };
  right: { name: string; avatarUrl?: string; votes: number };
  title: string;
  timeLeft?: string;
  onClick?: () => void;
}) {
  const totalVotes = left.votes + right.votes;
  const leftPercentage = totalVotes > 0 ? Math.round((left.votes / totalVotes) * 100) : 50;

  return (
    <motion.div
      className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.07] hover:border-white/15 transition-all"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatars */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <Avatar className="w-10 h-10 border border-white/10">
          <AvatarImage src={left.avatarUrl} />
          <AvatarFallback className="bg-white/5 text-white text-sm">
            {left.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue via-purple-500 to-accent-peach p-[1.5px]">
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">VS</span>
          </div>
        </div>

        <Avatar className="w-10 h-10 border border-white/10">
          <AvatarImage src={right.avatarUrl} />
          <AvatarFallback className="bg-white/5 text-white text-sm">
            {right.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-white text-center mb-2 line-clamp-1">
        {title}
      </h4>

      {/* Mini Bar */}
      <div className="h-1.5 rounded-full overflow-hidden bg-white/10 mb-2">
        <div
          className="h-full bg-gradient-to-r from-accent-blue to-cyan-400"
          style={{ width: `${leftPercentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs text-white/50">
        <span>{left.votes} votes</span>
        {timeLeft && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeLeft}
          </span>
        )}
        <span>{right.votes} votes</span>
      </div>
    </motion.div>
  );
}
