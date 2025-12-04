"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Swords, Grid3X3, BookOpen, Trophy } from "lucide-react";

export type ChallengeTab = "battles" | "entries" | "rules" | "leaderboard";

interface ChallengeTabsProps {
  activeTab: ChallengeTab;
  onTabChange: (tab: ChallengeTab) => void;
  battlesCount?: number;
  entriesCount?: number;
}

const tabs: { id: ChallengeTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "battles", label: "Live Battles", icon: Swords },
  { id: "entries", label: "Entries", icon: Grid3X3 },
  { id: "rules", label: "Rules & Rewards", icon: BookOpen },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
];

export function ChallengeTabs({
  activeTab,
  onTabChange,
  battlesCount,
  entriesCount,
}: ChallengeTabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Map<ChallengeTab, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Update indicator position
  useEffect(() => {
    const activeTabEl = tabRefs.current.get(activeTab);
    if (activeTabEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTabEl.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  const getCount = (tabId: ChallengeTab) => {
    if (tabId === "battles" && battlesCount !== undefined) return battlesCount;
    if (tabId === "entries" && entriesCount !== undefined) return entriesCount;
    return undefined;
  };

  return (
    <div className="w-full border-b border-white/10">
      <div className="container mx-auto px-4 max-w-[1200px]">
        {/* Desktop Tabs */}
        <div
          ref={containerRef}
          className="hidden md:flex items-center gap-1 relative"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = getCount(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                }}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors",
                  isActive ? "text-white" : "text-white/50 hover:text-white/70"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {count !== undefined && (
                  <span
                    className={cn(
                      "ml-1 px-1.5 py-0.5 text-xs rounded-full",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white/10 text-white/50"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Animated Underline Indicator */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-accent-blue to-purple-500 rounded-full"
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>

        {/* Mobile Scrollable Pills */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex items-center gap-2 py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const count = getCount(tab.id);
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-gradient-to-r from-accent-blue to-purple-500 text-white shadow-lg shadow-accent-blue/20"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {count !== undefined && (
                    <span
                      className={cn(
                        "ml-1 px-1.5 py-0.5 text-xs rounded-full",
                        isActive ? "bg-white/20" : "bg-white/10"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
