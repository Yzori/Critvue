"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Eye, Swords } from "lucide-react";

export interface Battle1v1CardProps {
  id: number;
  title: string;
  description?: string;
  contentType: string;
  status: "voting" | "completed" | "draw";
  participant1: {
    id: number;
    name: string;
    avatar?: string;
    votes: number;
  };
  participant2: {
    id: number;
    name: string;
    avatar?: string;
    votes: number;
  };
  totalVotes: number;
  timeLeft?: string;
  winnerId?: number;
  isFeatured?: boolean;
  userHasVoted?: boolean;
  onClick?: () => void;
}

const contentTypeLabels: Record<string, string> = {
  design: "Design",
  code: "Code",
  video: "Video",
  audio: "Audio",
  writing: "Writing",
  art: "Art",
  stream: "Stream",
};

export function Battle1v1Card({
  id,
  title,
  description,
  contentType,
  status,
  participant1,
  participant2,
  totalVotes,
  timeLeft,
  winnerId,
  isFeatured,
  userHasVoted,
  onClick,
}: Battle1v1CardProps) {
  const showVotes = status === "completed" || status === "draw";
  const p1Percentage = showVotes && totalVotes > 0
    ? Math.round((participant1.votes / totalVotes) * 100)
    : 50;
  const p2Percentage = 100 - p1Percentage;

  const isP1Winner = winnerId === participant1.id;
  const isP2Winner = winnerId === participant2.id;
  const isDraw = status === "draw";

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer",
        "bg-white border border-gray-100",
        "shadow-sm hover:shadow-lg transition-all duration-300",
        isFeatured && "ring-2 ring-accent-blue/30"
      )}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-to-r from-accent-blue to-cyan-500 text-white border-0 shadow-sm">
            Featured
          </Badge>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge
          variant="outline"
          className={cn(
            "font-medium",
            status === "voting" && "bg-accent-sage/10 text-accent-sage border-accent-sage/30",
            status === "completed" && "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
            status === "draw" && "bg-gray-100 text-gray-600 border-gray-200"
          )}
        >
          {status === "voting" && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-sage animate-pulse mr-1.5" />
              Voting
            </>
          )}
          {status === "completed" && "Completed"}
          {status === "draw" && "Draw"}
        </Badge>
      </div>

      <div className="p-5">
        {/* VS Header */}
        <div className="flex items-center justify-between mb-4">
          {/* Participant 1 */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative",
              isP1Winner && "ring-2 ring-accent-sage ring-offset-2 rounded-full"
            )}>
              <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                <AvatarImage src={participant1.avatar} />
                <AvatarFallback className="bg-accent-blue/10 text-accent-blue font-semibold">
                  {participant1.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{participant1.name}</p>
              {showVotes && (
                <p className="text-xs text-gray-500">{participant1.votes} votes</p>
              )}
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue via-purple-500 to-accent-peach flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">VS</span>
            </div>
          </div>

          {/* Participant 2 */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold text-gray-900 text-sm">{participant2.name}</p>
              {showVotes && (
                <p className="text-xs text-gray-500">{participant2.votes} votes</p>
              )}
            </div>
            <div className={cn(
              "relative",
              isP2Winner && "ring-2 ring-accent-sage ring-offset-2 rounded-full"
            )}>
              <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                <AvatarImage src={participant2.avatar} />
                <AvatarFallback className="bg-purple-500/10 text-purple-600 font-semibold">
                  {participant2.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Vote Progress Bar (only show during voting or after) */}
        {status === "voting" && (
          <div className="h-2 rounded-full overflow-hidden bg-gray-100 mb-4">
            <div className="h-full flex">
              <motion.div
                className="bg-gradient-to-r from-accent-blue to-cyan-400"
                initial={{ width: "50%" }}
                animate={{ width: `${p1Percentage}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div
                className="bg-gradient-to-l from-purple-500 to-violet-400"
                initial={{ width: "50%" }}
                animate={{ width: `${p2Percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {showVotes && (
          <div className="mb-4">
            <div className="flex justify-between text-sm font-medium mb-1">
              <span className={cn(
                isP1Winner ? "text-accent-sage" : "text-gray-600"
              )}>
                {p1Percentage}%
              </span>
              <span className={cn(
                isP2Winner ? "text-accent-sage" : "text-gray-600"
              )}>
                {p2Percentage}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-gray-100">
              <div className="h-full flex">
                <div
                  className={cn(
                    "transition-all",
                    isP1Winner ? "bg-accent-sage" : "bg-accent-blue"
                  )}
                  style={{ width: `${p1Percentage}%` }}
                />
                <div
                  className={cn(
                    "transition-all",
                    isP2Winner ? "bg-accent-sage" : "bg-purple-500"
                  )}
                  style={{ width: `${p2Percentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{title}</h3>

        {/* Meta Row */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-0 text-xs">
              {contentTypeLabels[contentType] || contentType}
            </Badge>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {totalVotes}
            </span>
          </div>

          {status === "voting" && timeLeft && (
            <span className="flex items-center gap-1 text-accent-peach font-medium">
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}
            </span>
          )}
        </div>

        {/* Action */}
        {status === "voting" && !userHasVoted && (
          <Button
            size="sm"
            className="w-full mt-4 bg-gradient-to-r from-accent-blue to-cyan-500 hover:opacity-90 text-white"
          >
            <Eye className="w-4 h-4 mr-2" />
            Vote Now
          </Button>
        )}

        {status === "voting" && userHasVoted && (
          <div className="mt-4 text-center text-sm text-gray-500">
            You've voted in this battle
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Compact version for sidebar/list
export function Battle1v1CardCompact({
  participant1,
  participant2,
  title,
  status,
  timeLeft,
  onClick,
}: Pick<Battle1v1CardProps, "participant1" | "participant2" | "title" | "status" | "timeLeft" | "onClick">) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
      whileHover={{ x: 2 }}
    >
      {/* Avatars */}
      <div className="flex items-center -space-x-2">
        <Avatar className="w-8 h-8 border-2 border-white">
          <AvatarImage src={participant1.avatar} />
          <AvatarFallback className="bg-accent-blue/10 text-accent-blue text-xs">
            {participant1.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-blue to-purple-500 flex items-center justify-center z-10 border border-white">
          <Swords className="w-2.5 h-2.5 text-white" />
        </div>
        <Avatar className="w-8 h-8 border-2 border-white">
          <AvatarImage src={participant2.avatar} />
          <AvatarFallback className="bg-purple-500/10 text-purple-600 text-xs">
            {participant2.name[0]}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{title}</p>
        <p className="text-xs text-gray-500">
          {participant1.name} vs {participant2.name}
        </p>
      </div>

      {/* Time/Status */}
      {status === "voting" && timeLeft && (
        <Badge variant="outline" className="text-xs border-accent-peach/30 text-accent-peach">
          {timeLeft}
        </Badge>
      )}
    </motion.div>
  );
}
