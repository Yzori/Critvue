"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Crown, Flame, Sparkles } from "lucide-react";

interface Participant {
  id: number;
  name: string;
  avatar?: string;
  tier?: string;
  votes: number;
}

interface VSArenaProps {
  participant1: Participant;
  participant2: Participant;
  totalVotes: number;
  title: string;
  contentType: string;
  timeRemaining?: string;
  isVoting?: boolean;
  winnerId?: number;
  onClick?: () => void;
  className?: string;
}

// Animated power bar with Critvue colors
function PowerBar({
  percentage,
  side,
  isWinner,
}: {
  percentage: number;
  side: "left" | "right";
  isWinner: boolean;
}) {
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    const controls = animate(0, percentage, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (value) => setDisplayPercentage(Math.round(value)),
    });
    return controls.stop;
  }, [percentage]);

  // Critvue brand colors for sides
  const gradients = {
    left: "from-accent-blue via-cyan-400 to-accent-blue",
    right: "from-accent-peach via-orange-400 to-accent-peach",
  };

  const glowColors = {
    left: "shadow-[0_0_15px_rgba(76,201,240,0.3)]",
    right: "shadow-[0_0_15px_rgba(249,115,22,0.3)]",
  };

  return (
    <div className="relative h-10 w-full overflow-hidden rounded-full bg-gray-100 border border-border">
      {/* Main bar */}
      <motion.div
        className={cn(
          "absolute top-0 h-full rounded-full bg-gradient-to-r",
          gradients[side],
          isWinner && glowColors[side],
          side === "left" ? "left-0" : "right-0"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {/* Animated shine */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Percentage text */}
      <div
        className={cn(
          "absolute inset-0 flex items-center px-4",
          side === "left" ? "justify-start" : "justify-end"
        )}
      >
        <motion.span
          className={cn(
            "text-sm font-bold",
            percentage > 20 ? "text-white" : "text-foreground"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {displayPercentage}%
        </motion.span>
      </div>
    </div>
  );
}

// Participant card
function ParticipantCard({
  participant,
  side,
  isWinner,
  isLeading,
}: {
  participant: Participant;
  side: "left" | "right";
  isWinner: boolean;
  isLeading: boolean;
}) {
  const borderColors = {
    left: "ring-accent-blue",
    right: "ring-accent-peach",
  };

  const bgColors = {
    left: "bg-accent-blue/10",
    right: "bg-accent-peach/10",
  };

  return (
    <motion.div
      className={cn(
        "relative flex flex-col items-center gap-2 p-3",
        side === "right" && "md:items-end"
      )}
      initial={{ opacity: 0, x: side === "left" ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Winner crown */}
      <AnimatePresence>
        {isWinner && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-1 left-1/2 -translate-x-1/2"
          >
            <Crown className="w-6 h-6 text-yellow-500 drop-shadow-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar with ring */}
      <motion.div
        className={cn(
          "relative rounded-full p-0.5",
          `bg-gradient-to-br ${side === "left" ? "from-accent-blue to-cyan-400" : "from-accent-peach to-orange-400"}`
        )}
        animate={isLeading ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Avatar className={cn("w-14 h-14 md:w-16 md:h-16 ring-2 ring-white")}>
          <AvatarImage src={participant.avatar} />
          <AvatarFallback
            className={cn(
              "text-lg font-bold bg-white",
              side === "left" ? "text-accent-blue" : "text-accent-peach"
            )}
          >
            {participant.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        {/* Leading indicator */}
        {isLeading && !isWinner && (
          <motion.div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 p-1 rounded-full",
              side === "left" ? "bg-accent-blue" : "bg-accent-peach"
            )}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Flame className="w-2.5 h-2.5 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Name */}
      <motion.div
        className={cn("text-center", side === "right" && "md:text-right")}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-semibold text-foreground text-sm truncate max-w-[90px] md:max-w-[110px]">
          {participant.name}
        </h3>
        <p className="text-xs text-muted-foreground">{participant.votes} votes</p>
      </motion.div>
    </motion.div>
  );
}

export function VSArena({
  participant1,
  participant2,
  totalVotes,
  title,
  timeRemaining,
  isVoting = true,
  winnerId,
  onClick,
  className,
}: VSArenaProps) {
  const p1Percentage = totalVotes > 0 ? Math.round((participant1.votes / totalVotes) * 100) : 50;
  const p2Percentage = totalVotes > 0 ? 100 - p1Percentage : 50;

  const isP1Winner = winnerId === participant1.id;
  const isP2Winner = winnerId === participant2.id;
  const isP1Leading = !winnerId && participant1.votes > participant2.votes;
  const isP2Leading = !winnerId && participant2.votes > participant1.votes;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl cursor-pointer group",
        "bg-white border border-border",
        "shadow-sm hover:shadow-xl transition-all duration-300",
        className
      )}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/3 via-transparent to-accent-peach/3" />

      <div className="relative p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-accent-blue/10 to-accent-peach/10 text-foreground border-0"
          >
            <Zap className="w-3 h-3 mr-1 text-accent-blue" />
            1v1 Battle
          </Badge>

          {timeRemaining && isVoting && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>
          )}

          {winnerId && (
            <Badge className="bg-accent-sage/10 text-accent-sage border-0">
              <Crown className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground text-center mb-5 line-clamp-1 group-hover:text-accent-blue transition-colors">
          {title}
        </h3>

        {/* VS Layout */}
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 md:gap-3 mb-5">
          <ParticipantCard
            participant={participant1}
            side="left"
            isWinner={isP1Winner}
            isLeading={isP1Leading}
          />

          {/* VS Badge */}
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-accent-blue via-purple-500 to-accent-peach flex items-center justify-center shadow-lg">
              <span className="text-sm md:text-base font-black text-white">VS</span>
            </div>
          </motion.div>

          <ParticipantCard
            participant={participant2}
            side="right"
            isWinner={isP2Winner}
            isLeading={isP2Leading}
          />
        </div>

        {/* Power Bars */}
        <div className="space-y-2">
          <PowerBar percentage={p1Percentage} side="left" isWinner={isP1Winner} />
          <PowerBar percentage={p2Percentage} side="right" isWinner={isP2Winner} />
        </div>

        {/* Total votes */}
        <motion.div
          className="text-center mt-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="font-semibold text-foreground">{totalVotes}</span> total votes
        </motion.div>
      </div>
    </motion.div>
  );
}

// Compact VS card for grid display
export function VSArenaCompact({
  participant1,
  participant2,
  totalVotes,
  title,
  onClick,
}: {
  participant1: Participant;
  participant2: Participant;
  totalVotes: number;
  title: string;
  onClick?: () => void;
}) {
  const p1Percentage = totalVotes > 0 ? Math.round((participant1.votes / totalVotes) * 100) : 50;
  const isP1Leading = participant1.votes > participant2.votes;

  return (
    <motion.div
      className="relative p-4 rounded-xl bg-white border border-border cursor-pointer group hover:shadow-md transition-shadow"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatars */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <Avatar className="w-9 h-9 ring-2 ring-accent-blue/30">
          <AvatarImage src={participant1.avatar} />
          <AvatarFallback className="bg-accent-blue/10 text-accent-blue text-sm">
            {participant1.name?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center">
          <span className="text-[9px] font-black text-white">VS</span>
        </div>

        <Avatar className="w-9 h-9 ring-2 ring-accent-peach/30">
          <AvatarImage src={participant2.avatar} />
          <AvatarFallback className="bg-accent-peach/10 text-accent-peach text-sm">
            {participant2.name?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground text-center truncate mb-2 group-hover:text-accent-blue transition-colors">
        {title}
      </h4>

      {/* Simple bar */}
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isP1Leading
              ? "bg-gradient-to-r from-accent-blue to-cyan-400"
              : "bg-gradient-to-r from-accent-peach to-orange-400"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${isP1Leading ? p1Percentage : 100 - p1Percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">{totalVotes} votes</p>
    </motion.div>
  );
}
