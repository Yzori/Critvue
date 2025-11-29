"use client";

/**
 * Command Palette Component
 *
 * Universal search and action interface powered by Cmd+K.
 * Inspired by Linear, Superhuman, and Arc Browser.
 *
 * Features:
 * - Fuzzy search across reviews
 * - Quick actions (Accept, Decline, Request, Claim)
 * - Keyboard navigation (↑↓ arrows, Enter)
 * - Recent items
 * - Categorized results
 *
 * Brand Compliance:
 * - Critvue accent colors (#4CC9F0, #F97316)
 * - Glassmorphic background
 * - Smooth spring animations
 * - WCAG AA keyboard accessibility
 *
 * @module CommandPalette
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Plus,
  Briefcase,
  Clock,
  TrendingUp,
  Command,
  ArrowRight,
  FileText,
  Code,
  Video,
  Mic,
  Image as ImageIcon,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface CommandPaletteProps {
  /**
   * Whether the palette is open
   */
  isOpen: boolean;

  /**
   * Callback when palette should close
   */
  onClose: () => void;

  /**
   * Current role (creator or reviewer)
   */
  role: "creator" | "reviewer";

  /**
   * Optional className
   */
  className?: string;
}

interface CommandItem {
  id: string;
  type: "action" | "review" | "navigation";
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: string;
  action: () => void;
  keywords: string[];
}

// Content type icons
const contentTypeIcons = {
  design: <Palette className="size-4" />,
  code: <Code className="size-4" />,
  video: <Video className="size-4" />,
  audio: <Mic className="size-4" />,
  writing: <FileText className="size-4" />,
  art: <ImageIcon className="size-4" />,
};

/**
 * Command Palette Component
 *
 * Accessible via Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 * Provides quick access to all dashboard actions and navigation.
 */
export function CommandPalette({
  isOpen,
  onClose,
  role,
  className,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Mock command items (will be replaced with real data)
  const mockCommands: CommandItem[] = React.useMemo(() => {
    const baseCommands: CommandItem[] = [
      {
        id: "new-review",
        type: "action",
        icon: <Plus className="size-4" />,
        title: "New Review Request",
        description: "Create a new review request",
        action: () => {
          console.log("Navigate to new review");
          onClose();
        },
        keywords: ["new", "create", "request", "review"],
      },
      {
        id: "search-all",
        type: "navigation",
        icon: <Search className="size-4" />,
        title: "Search All Reviews",
        description: "Browse all your reviews",
        action: () => {
          console.log("Navigate to all reviews");
          onClose();
        },
        keywords: ["search", "browse", "all", "reviews"],
      },
    ];

    if (role === "creator") {
      baseCommands.push(
        {
          id: "accept-all",
          type: "action",
          icon: <CheckCircle2 className="size-4" />,
          title: "Accept All Eligible",
          description: "Batch accept all pending reviews",
          badge: "3 eligible",
          action: () => {
            console.log("Batch accept reviews");
            onClose();
          },
          keywords: ["accept", "approve", "batch", "all"],
        },
        {
          id: "view-pending",
          type: "navigation",
          icon: <Clock className="size-4" />,
          title: "View Pending Actions",
          description: "Reviews awaiting your approval",
          badge: "5 pending",
          action: () => {
            console.log("Navigate to pending");
            onClose();
          },
          keywords: ["pending", "waiting", "actions", "urgent"],
        }
      );
    }

    if (role === "reviewer") {
      baseCommands.push(
        {
          id: "browse-reviews",
          type: "navigation",
          icon: <Briefcase className="size-4" />,
          title: "Browse Available Reviews",
          description: "Find reviews to claim",
          badge: "12 available",
          action: () => {
            console.log("Navigate to marketplace");
            onClose();
          },
          keywords: ["browse", "available", "marketplace", "claim"],
        },
        {
          id: "continue-draft",
          type: "action",
          icon: <FileText className="size-4" />,
          title: "Continue Draft",
          description: "Resume your in-progress review",
          action: () => {
            console.log("Continue draft");
            onClose();
          },
          keywords: ["draft", "continue", "resume", "progress"],
        },
        {
          id: "view-earnings",
          type: "navigation",
          icon: <TrendingUp className="size-4" />,
          title: "View Earnings",
          description: "Track your reviewer income",
          action: () => {
            console.log("Navigate to earnings");
            onClose();
          },
          keywords: ["earnings", "income", "money", "stats"],
        }
      );
    }

    return baseCommands;
  }, [role, onClose]);

  // Filter commands based on search query
  const filteredCommands = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return mockCommands;
    }

    const query = searchQuery.toLowerCase();
    return mockCommands.filter((cmd) =>
      cmd.keywords.some((keyword) => keyword.includes(query)) ||
      cmd.title.toLowerCase().includes(query) ||
      cmd.description?.toLowerCase().includes(query)
    );
  }, [mockCommands, searchQuery]);

  // Group commands by type
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      action: [],
      review: [],
      navigation: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.type].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Focus search input when opened
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Command Palette Modal */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 400,
              }}
              className={cn(
                "w-full max-w-2xl",
                "bg-background",
                "rounded-2xl",
                "border border-border",
                "shadow-2xl",
                "overflow-hidden",
                className
              )}
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <Search className="size-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className={cn(
                    "flex-1",
                    "bg-transparent",
                    "text-base",
                    "text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none"
                  )}
                  aria-label="Search commands"
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">
                    ESC
                  </kbd>
                  <span>to close</span>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="size-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedCommands).map(([type, items]) => {
                      if (items.length === 0) return null;

                      const typeLabels = {
                        action: "Actions",
                        review: "Reviews",
                        navigation: "Navigation",
                      };

                      return (
                        <div key={type}>
                          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {typeLabels[type as keyof typeof typeLabels]}
                          </div>
                          <div className="space-y-1">
                            {items.map((cmd, index) => {
                              const globalIndex = filteredCommands.indexOf(cmd);
                              const isSelected = globalIndex === selectedIndex;

                              return (
                                <motion.button
                                  key={cmd.id}
                                  onClick={() => cmd.action()}
                                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                                  className={cn(
                                    "w-full",
                                    "flex items-center gap-3",
                                    "px-3 py-2.5",
                                    "rounded-lg",
                                    "text-left",
                                    "transition-colors",
                                    isSelected
                                      ? "bg-accent-blue/10 text-accent-blue"
                                      : "hover:bg-muted text-foreground"
                                  )}
                                  whileHover={{ x: 2 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <div
                                    className={cn(
                                      "size-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                      isSelected
                                        ? "bg-accent-blue/20 text-accent-blue"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {cmd.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {cmd.title}
                                      </span>
                                      {cmd.badge && (
                                        <Badge
                                          variant="secondary"
                                          size="sm"
                                          className="text-xs"
                                        >
                                          {cmd.badge}
                                        </Badge>
                                      )}
                                    </div>
                                    {cmd.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {cmd.description}
                                      </p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <ArrowRight className="size-4 text-accent-blue flex-shrink-0" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Hints */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono">
                      ↑↓
                    </kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono">
                      ↵
                    </kbd>
                    <span>Select</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Command className="size-3" />
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono">
                    K
                  </kbd>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
