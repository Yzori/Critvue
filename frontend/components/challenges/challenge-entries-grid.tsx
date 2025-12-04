"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Star, Filter, Grid3X3, LayoutList } from "lucide-react";

export interface Entry {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  thumbnailUrl: string;
  tags: string[];
  votes: number;
  critvueRating?: number; // 0-100
  submittedAt: string;
  hasExpertReview?: boolean;
}

export interface ChallengeEntriesGridProps {
  entries: Entry[];
  disciplines: string[];
  onEntryClick: (entry: Entry) => void;
  onRequestReview?: (entry: Entry) => void;
}

type SortOption = "most-voted" | "newest" | "expert-picks";
type ViewMode = "grid" | "list";

export function ChallengeEntriesGrid({
  entries,
  disciplines,
  onEntryClick,
  onRequestReview,
}: ChallengeEntriesGridProps) {
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("most-voted");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filter and sort entries
  const filteredEntries = entries
    .filter((entry) => {
      if (selectedDiscipline === "all") return true;
      return entry.tags.some(
        (tag) => tag.toLowerCase() === selectedDiscipline.toLowerCase()
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "most-voted":
          return b.votes - a.votes;
        case "newest":
          return (
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
          );
        case "expert-picks":
          if (a.hasExpertReview && !b.hasExpertReview) return -1;
          if (!a.hasExpertReview && b.hasExpertReview) return 1;
          return (b.critvueRating || 0) - (a.critvueRating || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="w-full">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Discipline Filter */}
          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2 text-white/50" />
              <SelectValue placeholder="All disciplines" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="all" className="text-white hover:bg-white/10">
                All disciplines
              </SelectItem>
              {disciplines.map((discipline) => (
                <SelectItem
                  key={discipline}
                  value={discipline.toLowerCase()}
                  className="text-white hover:bg-white/10"
                >
                  {discipline}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-white/10">
              <SelectItem value="most-voted" className="text-white hover:bg-white/10">
                Most voted
              </SelectItem>
              <SelectItem value="newest" className="text-white hover:bg-white/10">
                Newest
              </SelectItem>
              <SelectItem value="expert-picks" className="text-white hover:bg-white/10">
                Expert picks
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/70"
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/70"
            )}
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-white/50 mb-4">
        {filteredEntries.length} entries
        {selectedDiscipline !== "all" && ` in ${selectedDiscipline}`}
      </p>

      {/* Grid View */}
      {viewMode === "grid" && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onClick={() => onEntryClick(entry)}
            />
          ))}
        </motion.div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <motion.div
          className="flex flex-col gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.03 },
            },
          }}
        >
          {filteredEntries.map((entry) => (
            <EntryListItem
              key={entry.id}
              entry={entry}
              onClick={() => onEntryClick(entry)}
            />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Grid3X3 className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No entries yet</h3>
          <p className="text-white/50 max-w-sm">
            Be the first to submit your work to this challenge!
          </p>
        </div>
      )}
    </div>
  );
}

// Entry Card Component (Grid View)
function EntryCard({
  entry,
  onClick,
}: {
  entry: Entry;
  onClick: () => void;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer",
        "bg-white/[0.02] border border-white/10",
        "hover:bg-white/[0.05] hover:border-white/15",
        "transition-all duration-200"
      )}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        <Image
          src={entry.thumbnailUrl}
          alt={entry.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Expert Badge Overlay */}
        {entry.hasExpertReview && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-accent-peach/90 text-white border-0">
              <Star className="w-3 h-3 mr-1" />
              Expert Pick
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Creator Row */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6 border border-white/10">
            <AvatarImage src={entry.creatorAvatarUrl} />
            <AvatarFallback className="bg-white/5 text-white text-xs">
              {entry.creatorName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-white/50">{entry.creatorName}</span>
        </div>

        {/* Title */}
        <h4 className="font-medium text-white mb-3 line-clamp-2 group-hover:text-accent-blue transition-colors">
          {entry.title}
        </h4>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {entry.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-white/5 text-white/60 border-white/10 text-xs"
            >
              {tag}
            </Badge>
          ))}
          {entry.tags.length > 3 && (
            <Badge
              variant="secondary"
              className="bg-white/5 text-white/40 border-white/10 text-xs"
            >
              +{entry.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Footer: Votes & Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/60">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{entry.votes}</span>
          </div>

          {entry.critvueRating !== undefined && (
            <div
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                entry.critvueRating >= 80
                  ? "bg-accent-sage/20 text-accent-sage"
                  : entry.critvueRating >= 60
                  ? "bg-accent-blue/20 text-accent-blue"
                  : "bg-white/10 text-white/60"
              )}
            >
              {entry.critvueRating}/100
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Entry List Item Component (List View)
function EntryListItem({
  entry,
  onClick,
}: {
  entry: Entry;
  onClick: () => void;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
      }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl cursor-pointer",
        "bg-white/[0.02] border border-white/10",
        "hover:bg-white/[0.05] hover:border-white/15",
        "transition-all duration-200"
      )}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Thumbnail */}
      <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
        <Image
          src={entry.thumbnailUrl}
          alt={entry.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="w-5 h-5 border border-white/10">
            <AvatarImage src={entry.creatorAvatarUrl} />
            <AvatarFallback className="bg-white/5 text-white text-[10px]">
              {entry.creatorName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-white/50">{entry.creatorName}</span>
          {entry.hasExpertReview && (
            <Badge className="bg-accent-peach/90 text-white border-0 text-[10px] px-1.5 py-0">
              <Star className="w-2.5 h-2.5 mr-0.5" />
              Expert
            </Badge>
          )}
        </div>

        <h4 className="font-medium text-white truncate hover:text-accent-blue transition-colors">
          {entry.title}
        </h4>

        <div className="flex items-center gap-2 mt-1">
          {entry.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-white/5 text-white/50 border-white/10 text-[10px]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-white/60">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-medium">{entry.votes}</span>
        </div>

        {entry.critvueRating !== undefined && (
          <div
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium",
              entry.critvueRating >= 80
                ? "bg-accent-sage/20 text-accent-sage"
                : entry.critvueRating >= 60
                ? "bg-accent-blue/20 text-accent-blue"
                : "bg-white/10 text-white/60"
            )}
          >
            {entry.critvueRating}
          </div>
        )}
      </div>
    </motion.div>
  );
}
