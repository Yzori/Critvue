"use client";

/**
 * Command Palette - Modern ⌘K Interface
 *
 * Features:
 * - Quick navigation across the app
 * - Keyboard shortcuts (⌘K or Ctrl+K)
 * - Fuzzy search
 * - Recently used items
 * - Grouped commands
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Home,
  FolderOpen,
  MessageSquare,
  Plus,
  Settings,
  Bell,
  Users,
  HelpCircle,
  LogOut,
  Search,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Toggle with ⌘K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? false : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-[var(--background-overlay)] backdrop-blur-sm z-50"
          />

          {/* Command Dialog */}
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 pt-[15vh]">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="w-full max-w-2xl"
            >
              <Command className="rounded-2xl border border-border bg-[var(--background-glass)] backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="flex items-center border-b border-border px-4">
                  <Search className="size-5 text-muted-foreground mr-3" />
                  <Command.Input
                    placeholder="Type a command or search..."
                    className="flex h-14 w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-0 rounded-lg"
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-muted text-xs font-mono text-muted-foreground">
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                  <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                    No results found.
                  </Command.Empty>

                  {/* Navigation */}
                  <Command.Group heading="Navigation" className="px-2 py-2">
                    <div className="mb-1 px-2 text-xs font-semibold text-muted-foreground">
                      Navigation
                    </div>
                    <CommandItem
                      onSelect={() => navigate("/dashboard")}
                      icon={<Home className="size-4" />}
                      label="Dashboard"
                      shortcut="H"
                    />
                    <CommandItem
                      onSelect={() => navigate("/dashboard/projects")}
                      icon={<FolderOpen className="size-4" />}
                      label="Projects"
                      shortcut="P"
                    />
                    <CommandItem
                      onSelect={() => navigate("/dashboard/feedback")}
                      icon={<MessageSquare className="size-4" />}
                      label="Feedback"
                      shortcut="F"
                    />
                    <CommandItem
                      onSelect={() => navigate("/dashboard/notifications")}
                      icon={<Bell className="size-4" />}
                      label="Notifications"
                      shortcut="N"
                    />
                  </Command.Group>

                  {/* Actions */}
                  <Command.Group heading="Actions" className="px-2 py-2">
                    <div className="mb-1 px-2 text-xs font-semibold text-muted-foreground">
                      Actions
                    </div>
                    <CommandItem
                      onSelect={() => navigate("/review/new")}
                      icon={<Plus className="size-4" />}
                      label="New Review Request"
                      shortcut="⌘N"
                    />
                    <CommandItem
                      onSelect={() => navigate("/projects/new")}
                      icon={<FileText className="size-4" />}
                      label="New Project"
                      shortcut="⌘P"
                    />
                    <CommandItem
                      onSelect={() => navigate("/team/invite")}
                      icon={<Users className="size-4" />}
                      label="Invite Team Member"
                    />
                  </Command.Group>

                  {/* Settings & Account */}
                  <Command.Group heading="Settings" className="px-2 py-2">
                    <div className="mb-1 px-2 text-xs font-semibold text-muted-foreground">
                      Settings
                    </div>
                    <CommandItem
                      onSelect={() => navigate("/settings")}
                      icon={<Settings className="size-4" />}
                      label="Settings"
                      shortcut="⌘,"
                    />
                    <CommandItem
                      onSelect={() => navigate("/help")}
                      icon={<HelpCircle className="size-4" />}
                      label="Help & Support"
                      shortcut="?"
                    />
                    <CommandItem
                      onSelect={handleLogout}
                      icon={<LogOut className="size-4" />}
                      label="Sign Out"
                      variant="destructive"
                    />
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Command Item Component
interface CommandItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  variant?: "default" | "destructive";
  onSelect: () => void;
}

function CommandItem({ icon, label, shortcut, variant = "default", onSelect }: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
        ${
          variant === "destructive"
            ? "hover:bg-destructive/10 hover:text-destructive aria-selected:bg-destructive/10 aria-selected:text-destructive"
            : "hover:bg-accent-blue/10 aria-selected:bg-accent-blue/10"
        }`}
    >
      <div
        className={`size-8 rounded-lg flex items-center justify-center
        ${variant === "destructive" ? "bg-destructive/10" : "bg-accent-blue/10"}`}
      >
        <div className={variant === "destructive" ? "text-destructive" : "text-accent-blue"}>
          {icon}
        </div>
      </div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {shortcut && (
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded bg-muted text-[10px] font-mono text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
