"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trophy, Flame, Users, ChevronRight, Crown } from "lucide-react";
import { ShaderBackground, GradientFallback } from "./shader-background";
import { KineticVS, WinnerFlash } from "./kinetic-vs";
import { ParticleBattle, EnergyBurst } from "./particle-battle";
import { CursorZone } from "./custom-cursor";

interface Participant {
  id: number;
  name: string;
  avatar?: string;
  votes: number;
  tagline?: string;
}

interface KineticArenaProps {
  participant1: Participant;
  participant2: Participant;
  totalVotes: number;
  title: string;
  description?: string;
  contentType: string;
  timeRemaining?: string;
  isActive?: boolean;
  winnerId?: number;
  onVote?: (participantId: number) => void;
  onClick?: () => void;
  className?: string;
}

export function KineticArena({
  participant1,
  participant2,
  totalVotes,
  title,
  description,
  contentType,
  timeRemaining,
  isActive = true,
  winnerId,
  onVote,
  onClick,
  className,
}: KineticArenaProps) {
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);
  const [showWinnerFlash, setShowWinnerFlash] = useState(false);
  const [showEnergyBurst, setShowEnergyBurst] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const p1Percentage = totalVotes > 0 ? participant1.votes / totalVotes : 0.5;
  const voteRatio = 1 - p1Percentage; // 0 = p1 winning, 1 = p2 winning

  const isP1Winner = winnerId === participant1.id;
  const isP2Winner = winnerId === participant2.id;
  const isP1Leading = !winnerId && participant1.votes > participant2.votes;
  const isP2Leading = !winnerId && participant2.votes > participant1.votes;

  const handleVote = (side: "left" | "right") => {
    const participantId = side === "left" ? participant1.id : participant2.id;
    onVote?.(participantId);
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl",
        "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
        "border border-white/10",
        "shadow-2xl",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onClick={onClick}
    >
      {/* WebGL Shader Background */}
      <ShaderBackground
        voteRatio={voteRatio}
        intensity={0.15}
        className="opacity-60"
      />

      {/* Particle Battle Effect */}
      <ParticleBattle
        voteRatio={voteRatio}
        intensity={isActive ? 1 : 0.3}
        isActive={isActive}
      />

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-white/10 text-white border-0 backdrop-blur-sm">
              <Flame className="w-3 h-3 mr-1.5 text-accent-peach" />
              1v1 Battle
            </Badge>

            {timeRemaining && isActive && (
              <Badge variant="secondary" className="border-white/20 text-white/80">
                <Clock className="w-3 h-3 mr-1.5" />
                {timeRemaining}
              </Badge>
            )}

            {winnerId && (
              <Badge className="bg-accent-sage/20 text-accent-sage border-0">
                <Crown className="w-3 h-3 mr-1.5" />
                Complete
              </Badge>
            )}
          </div>

          <motion.h2
            className="text-xl md:text-2xl font-bold text-white text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {title}
          </motion.h2>

          {description && (
            <motion.p
              className="text-white/60 text-sm text-center mt-2 line-clamp-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {description}
            </motion.p>
          )}
        </div>

        {/* Split Screen Battle Zone */}
        <div className="relative h-[300px] md:h-[350px]">
          {/* Left Competitor */}
          <CursorZone type="left" text="Vote for challenger">
            <motion.div
              className={cn(
                "absolute inset-y-0 left-0 w-1/2 flex flex-col items-center justify-center",
                "transition-all duration-300",
                hoveredSide === "left" && "bg-accent-blue/5"
              )}
              onMouseEnter={() => setHoveredSide("left")}
              onMouseLeave={() => setHoveredSide(null)}
              animate={{
                scale: hoveredSide === "left" ? 1.02 : 1,
              }}
            >
              <CompetitorCard
                participant={participant1}
                side="left"
                isWinner={isP1Winner}
                isLeading={isP1Leading}
                isHovered={hoveredSide === "left"}
                percentage={Math.round(p1Percentage * 100)}
                onVote={() => handleVote("left")}
                canVote={isActive && !winnerId}
              />
            </motion.div>
          </CursorZone>

          {/* Kinetic VS Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <KineticVS
              isActive={isActive && !winnerId}
              winnerId={winnerId ? (isP1Winner ? "left" : "right") : null}
              size="xl"
            />
          </div>

          {/* Right Competitor */}
          <CursorZone type="right" text="Vote for challenger">
            <motion.div
              className={cn(
                "absolute inset-y-0 right-0 w-1/2 flex flex-col items-center justify-center",
                "transition-all duration-300",
                hoveredSide === "right" && "bg-accent-peach/5"
              )}
              onMouseEnter={() => setHoveredSide("right")}
              onMouseLeave={() => setHoveredSide(null)}
              animate={{
                scale: hoveredSide === "right" ? 1.02 : 1,
              }}
            >
              <CompetitorCard
                participant={participant2}
                side="right"
                isWinner={isP2Winner}
                isLeading={isP2Leading}
                isHovered={hoveredSide === "right"}
                percentage={Math.round((1 - p1Percentage) * 100)}
                onVote={() => handleVote("right")}
                canVote={isActive && !winnerId}
              />
            </motion.div>
          </CursorZone>
        </div>

        {/* Power Bar */}
        <div className="px-6 py-4">
          <div className="relative h-3 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
            {/* Left side bar */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-blue to-cyan-400"
              initial={{ width: "50%" }}
              animate={{ width: `${p1Percentage * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            {/* Right side bar */}
            <motion.div
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-accent-peach to-orange-400"
              initial={{ width: "50%" }}
              animate={{ width: `${(1 - p1Percentage) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
              />
            </motion.div>

            {/* Battle line indicator */}
            <motion.div
              className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              initial={{ left: "50%" }}
              animate={{ left: `${p1Percentage * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Vote counts */}
          <div className="flex justify-between mt-3 text-sm">
            <motion.span
              className="text-accent-blue font-semibold"
              animate={{ scale: isP1Leading ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              {participant1.votes} votes ({Math.round(p1Percentage * 100)}%)
            </motion.span>
            <span className="text-white/50">{totalVotes} total</span>
            <motion.span
              className="text-accent-peach font-semibold"
              animate={{ scale: isP2Leading ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              {participant2.votes} votes ({Math.round((1 - p1Percentage) * 100)}%)
            </motion.span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6">
          <Button
            className="w-full bg-gradient-to-r from-accent-blue via-purple-500 to-accent-peach hover:opacity-90 text-white font-semibold h-12 rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            {winnerId ? "View Results" : "Enter Arena"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Winner Effects */}
      <AnimatePresence>
        {showWinnerFlash && winnerId && (
          <WinnerFlash
            side={isP1Winner ? "left" : "right"}
            onComplete={() => setShowWinnerFlash(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEnergyBurst && winnerId && (
          <EnergyBurst
            side={isP1Winner ? "left" : "right"}
            onComplete={() => setShowEnergyBurst(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Competitor Card Component
function CompetitorCard({
  participant,
  side,
  isWinner,
  isLeading,
  isHovered,
  percentage,
  onVote,
  canVote,
}: {
  participant: Participant;
  side: "left" | "right";
  isWinner: boolean;
  isLeading: boolean;
  isHovered: boolean;
  percentage: number;
  onVote: () => void;
  canVote: boolean;
}) {
  const accentColor = side === "left" ? "accent-blue" : "accent-peach";

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, x: side === "left" ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Winner Crown */}
      <AnimatePresence>
        {isWinner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2"
          >
            <Crown className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar with glow ring */}
      <motion.div
        className="relative"
        animate={{
          scale: isHovered ? 1.1 : isLeading ? [1, 1.03, 1] : 1,
        }}
        transition={{ duration: isLeading ? 2 : 0.2, repeat: isLeading ? Infinity : 0 }}
      >
        {/* Glow ring */}
        <motion.div
          className={cn(
            "absolute -inset-2 rounded-full",
            side === "left"
              ? "bg-gradient-to-br from-accent-blue to-cyan-400"
              : "bg-gradient-to-br from-accent-peach to-orange-400"
          )}
          animate={{
            opacity: isHovered || isLeading ? [0.5, 0.8, 0.5] : 0.3,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ filter: "blur(8px)" }}
        />

        {/* Avatar */}
        <Avatar
          className={cn(
            "w-20 h-20 md:w-24 md:h-24 border-4 relative",
            side === "left" ? "border-accent-blue/50" : "border-accent-peach/50"
          )}
        >
          <AvatarImage src={participant.avatar} />
          <AvatarFallback
            className={cn(
              "text-2xl font-bold",
              side === "left"
                ? "bg-accent-blue/20 text-accent-blue"
                : "bg-accent-peach/20 text-accent-peach"
            )}
          >
            {participant.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        {/* Leading indicator */}
        {isLeading && !isWinner && (
          <motion.div
            className={cn(
              "absolute -bottom-1 -right-1 p-1.5 rounded-full",
              side === "left" ? "bg-accent-blue" : "bg-accent-peach"
            )}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <Flame className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Name and stats */}
      <div className="text-center">
        <motion.h3
          className="text-white font-bold text-lg"
          animate={{ scale: isWinner ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          {participant.name}
        </motion.h3>
        {participant.tagline && (
          <p className="text-white/50 text-sm">{participant.tagline}</p>
        )}
      </div>

      {/* Vote button */}
      {canVote && (
        <motion.button
          className={cn(
            "px-6 py-2 rounded-full font-semibold text-sm transition-all",
            "bg-white/10 text-white border border-white/20",
            "hover:bg-white/20 hover:border-white/40",
            isHovered && side === "left" && "bg-accent-blue/20 border-accent-blue/40",
            isHovered && side === "right" && "bg-accent-peach/20 border-accent-peach/40"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onVote();
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Vote
        </motion.button>
      )}

      {/* Percentage display */}
      <motion.div
        className={cn(
          "text-3xl font-black",
          side === "left" ? "text-accent-blue" : "text-accent-peach"
        )}
        animate={{
          scale: isLeading ? [1, 1.05, 1] : 1,
          textShadow: isLeading
            ? [
                `0 0 20px ${side === "left" ? "rgba(76, 201, 240, 0.5)" : "rgba(249, 115, 22, 0.5)"}`,
                `0 0 40px ${side === "left" ? "rgba(76, 201, 240, 0.8)" : "rgba(249, 115, 22, 0.8)"}`,
                `0 0 20px ${side === "left" ? "rgba(76, 201, 240, 0.5)" : "rgba(249, 115, 22, 0.5)"}`,
              ]
            : "none",
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {percentage}%
      </motion.div>
    </motion.div>
  );
}

// Compact version for grid displays
export function KineticArenaCompact({
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
  const p1Percentage = totalVotes > 0 ? participant1.votes / totalVotes : 0.5;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl cursor-pointer",
        "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
        "border border-white/10 p-4",
        "hover:border-white/20 transition-colors"
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Mini gradient background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(90deg, rgba(76, 201, 240, 0.2) 0%, transparent ${p1Percentage * 100}%, rgba(249, 115, 22, 0.2) 100%)`,
        }}
      />

      <div className="relative z-10">
        {/* Avatars row */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <Avatar className="w-10 h-10 border-2 border-accent-blue/50">
            <AvatarImage src={participant1.avatar} />
            <AvatarFallback className="bg-accent-blue/20 text-accent-blue text-sm">
              {participant1.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <motion.div
            className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-blue via-purple-500 to-accent-peach flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[9px] font-black text-white">VS</span>
          </motion.div>

          <Avatar className="w-10 h-10 border-2 border-accent-peach/50">
            <AvatarImage src={participant2.avatar} />
            <AvatarFallback className="bg-accent-peach/20 text-accent-peach text-sm">
              {participant2.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Title */}
        <h4 className="text-white font-medium text-sm text-center mb-3 line-clamp-1">
          {title}
        </h4>

        {/* Mini power bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-blue to-cyan-400"
            initial={{ width: "50%" }}
            animate={{ width: `${p1Percentage * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs">
          <span className="text-accent-blue">{participant1.votes}</span>
          <span className="text-white/50">{totalVotes} votes</span>
          <span className="text-accent-peach">{participant2.votes}</span>
        </div>
      </div>
    </motion.div>
  );
}
