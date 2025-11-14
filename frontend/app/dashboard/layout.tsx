"use client";

/**
 * Dashboard Layout - Modern 2025 Redesign
 *
 * Enhanced Features:
 * - Glassmorphic navigation with backdrop blur
 * - Mobile bottom navigation (hidden on desktop)
 * - FAB for primary actions
 * - Enhanced dropdown menus with better spacing
 * - Improved mobile user menu
 * - Sticky header with smooth transitions
 * - Command palette trigger (visual only, Cmd+K)
 * - Status indicators and badges
 */

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BottomNav, type BottomNavItem } from "@/components/ui/bottom-nav";
import { FAB, type FABAction } from "@/components/ui/fab";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/command-palette";
import {
  LogOut,
  User,
  ChevronDown,
  Settings,
  HelpCircle,
  Home,
  FolderOpen,
  MessageSquare,
  Bell,
  Plus,
  Users,
  Search,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("home");
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isUserMenuOpen]);

  // Update active nav item based on pathname
  useEffect(() => {
    if (pathname === "/dashboard") {
      setActiveNavItem("home");
    } else if (pathname.startsWith("/dashboard/projects")) {
      setActiveNavItem("projects");
    } else if (pathname.startsWith("/dashboard/feedback")) {
      setActiveNavItem("feedback");
    } else if (pathname.startsWith("/dashboard/notifications")) {
      setActiveNavItem("notifications");
    }
  }, [pathname]);

  // Bottom navigation items (mobile only)
  const bottomNavItems: BottomNavItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="size-5" />,
      activeIcon: <Home className="size-5" fill="currentColor" />,
      onClick: () => {
        setActiveNavItem("home");
        // Navigate to home
      },
    },
    {
      id: "projects",
      label: "Projects",
      icon: <FolderOpen className="size-5" />,
      activeIcon: <FolderOpen className="size-5" fill="currentColor" />,
      onClick: () => {
        setActiveNavItem("projects");
        // Navigate to projects
      },
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: <MessageSquare className="size-5" />,
      activeIcon: <MessageSquare className="size-5" fill="currentColor" />,
      onClick: () => {
        setActiveNavItem("feedback");
        // Navigate to feedback
      },
      badge: 3,
    },
    {
      id: "notifications",
      label: "Activity",
      icon: <Bell className="size-5" />,
      activeIcon: <Bell className="size-5" fill="currentColor" />,
      onClick: () => {
        setActiveNavItem("notifications");
        // Navigate to notifications
      },
      badge: 5,
    },
  ];

  // FAB actions (expandable menu)
  const fabActions: FABAction[] = [
    {
      id: "new-project",
      label: "New Project",
      icon: <FolderOpen className="size-5" />,
      onClick: () => {
        // Handle new project
      },
      variant: "primary",
    },
    {
      id: "request-feedback",
      label: "Request Feedback",
      icon: <MessageSquare className="size-5" />,
      onClick: () => {
        // Handle request feedback
      },
      variant: "secondary",
    },
    {
      id: "invite-team",
      label: "Invite Team",
      icon: <Users className="size-5" />,
      onClick: () => {
        // Handle invite team
      },
      variant: "primary",
    },
  ];

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent-blue animate-[shimmer_1.5s_ease-in-out_infinite] w-1/3" />
            </div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Top Navigation Bar - Enhanced Glassmorphism */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border-light shadow-[0_1px_3px_rgba(0,0,0,0.05)] pt-safe">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center shadow-sm ring-2 ring-accent-blue/20">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-foreground leading-tight">
                    Critvue
                  </span>
                  <span className="text-xs text-foreground-muted hidden sm:block">
                    Dashboard
                  </span>
                </div>
              </div>

              {/* Command Palette Trigger (Desktop) */}
              <button
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background/50 hover:bg-background transition-all text-sm text-foreground-muted hover:text-foreground min-h-[44px]"
                onClick={() => {
                  // Open command palette
                }}
              >
                <Search className="size-4" />
                <span>Quick search...</span>
                <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications (Desktop) */}
              <button
                className="hidden md:flex relative size-9 rounded-lg hover:bg-accent-blue/10 transition-all items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="size-5 text-foreground-muted" />
                <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500 ring-2 ring-background" />
              </button>

              {/* User Info (Desktop) */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-subtle">
                <div className="size-7 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-xs">
                    {user?.full_name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="hidden lg:flex flex-col min-w-0">
                  <span className="text-xs text-foreground font-medium truncate max-w-[120px]">
                    {user?.full_name || "User"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="success" showDot size="sm" className="px-0 py-0 bg-transparent border-0 shadow-none">
                      <span className="text-[10px]">Active</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Dropdown Menu */}
              <div className="relative" ref={menuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="gap-2 min-h-[44px] hover:bg-accent-blue/5 hover:border-accent-blue/30 transition-all"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="size-6 rounded-full bg-accent-blue/10 flex items-center justify-center md:hidden">
                    <User className="size-3.5 text-accent-blue" />
                  </div>
                  <span className="hidden sm:inline text-sm">Menu</span>
                  <ChevronDown
                    className={`size-4 transition-transform duration-200 ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {/* Dropdown Menu - Enhanced Glassmorphism */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-background/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-border overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    {/* User Info in Dropdown (Mobile) */}
                    <div className="md:hidden p-4 border-b border-border-light bg-gradient-to-br from-accent-blue/5 to-accent-peach/5">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-lg">
                            {user?.full_name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {user?.full_name || "User"}
                          </span>
                          <span className="text-xs text-foreground-muted truncate">
                            {user?.email}
                          </span>
                          <div className="mt-1">
                            <Badge variant="success" showDot pulse size="sm">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Navigate to settings
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-accent-blue/5 flex items-center gap-3 transition-all min-h-[48px] group"
                      >
                        <div className="size-9 rounded-lg bg-accent-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Settings className="size-4 text-accent-blue" />
                        </div>
                        <div className="flex-1">
                          <span className="text-foreground font-medium">Account Settings</span>
                          <p className="text-xs text-foreground-muted">Manage your profile</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Navigate to help
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-accent-blue/5 flex items-center gap-3 transition-all min-h-[48px] group"
                      >
                        <div className="size-9 rounded-lg bg-accent-peach/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <HelpCircle className="size-4 text-accent-peach" />
                        </div>
                        <div className="flex-1">
                          <span className="text-foreground font-medium">Help & Support</span>
                          <p className="text-xs text-foreground-muted">Get assistance</p>
                        </div>
                      </button>

                      <div className="border-t border-border-light my-2 mx-2" />

                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-destructive/5 flex items-center gap-3 transition-all text-destructive min-h-[48px] group"
                      >
                        <div className="size-9 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <LogOut className="size-4" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">Sign Out</span>
                          <p className="text-xs opacity-70">End your session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav items={bottomNavItems} activeId={activeNavItem} />

      {/* Floating Action Button */}
      <FAB
        label="New action"
        actions={fabActions}
        icon={<Plus className="size-6" />}
        hideOnScroll
      />

      {/* Command Palette - ⌘K */}
      <CommandPalette />

      {/* Footer (Desktop Only) */}
      <footer className="hidden lg:block border-t border-border-light bg-background mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-muted">
            <div className="flex items-center gap-2">
              <span className="font-medium">© 2025 Critvue</span>
              <span>•</span>
              <span>AI & Human Feedback Platform</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="/privacy"
                className="hover:text-accent-blue transition-colors hover:underline"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="hover:text-accent-blue transition-colors hover:underline"
              >
                Terms
              </a>
              <a
                href="/help"
                className="hover:text-accent-blue transition-colors hover:underline"
              >
                Help
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
