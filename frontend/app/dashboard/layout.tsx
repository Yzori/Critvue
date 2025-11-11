"use client";

/**
 * Dashboard Layout
 * Protected layout for all dashboard pages
 * Features:
 * - Top navigation bar with Critvue branding
 * - User menu dropdown with email and logout
 * - Mobile-responsive design
 * - Brand-consistent styling using design tokens
 */

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, ChevronDown, Settings, HelpCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background border-b border-border-light backdrop-blur-sm bg-background/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center shadow-sm">
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

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* User Info (hidden on mobile) */}
              <div className="hidden md:flex items-center gap-2 text-sm text-foreground-muted">
                <div className="size-8 rounded-full bg-accent-blue/10 flex items-center justify-center">
                  <User className="size-4 text-accent-blue" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-foreground font-medium">
                    {user?.full_name || "User"}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {user?.email}
                  </span>
                </div>
              </div>

              {/* Dropdown Menu */}
              <div className="relative" ref={menuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="gap-2 min-h-[44px] md:min-h-[36px]"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="size-6 rounded-full bg-accent-blue/10 flex items-center justify-center md:hidden">
                    <User className="size-3.5 text-accent-blue" />
                  </div>
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown
                    className={`size-4 transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-background rounded-2xl shadow-lg border border-border overflow-hidden">
                    {/* User Info in Dropdown (mobile) */}
                    <div className="md:hidden p-4 border-b border-border-light bg-background-subtle">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
                          <User className="size-5 text-accent-blue" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">
                            {user?.full_name || "User"}
                          </span>
                          <span className="text-xs text-foreground-muted truncate">
                            {user?.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Navigate to settings when implemented
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-accent-blue/5 flex items-center gap-3 transition-colors min-h-[44px]"
                      >
                        <Settings className="size-4 text-foreground-muted" />
                        <span className="text-foreground">Account Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Navigate to help when implemented
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-accent-blue/5 flex items-center gap-3 transition-colors min-h-[44px]"
                      >
                        <HelpCircle className="size-4 text-foreground-muted" />
                        <span className="text-foreground">Help & Support</span>
                      </button>

                      <div className="border-t border-border-light my-2" />

                      <button
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await logout();
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-destructive/5 flex items-center gap-3 transition-colors text-destructive min-h-[44px]"
                      >
                        <LogOut className="size-4" />
                        <span>Sign Out</span>
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

      {/* Footer (optional) */}
      <footer className="border-t border-border-light bg-background mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-muted">
            <div className="flex items-center gap-2">
              <span>© 2024 Critvue</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">AI & Human Feedback Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/privacy"
                className="hover:text-accent-blue transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="hover:text-accent-blue transition-colors"
              >
                Terms
              </a>
              <a
                href="/help"
                className="hover:text-accent-blue transition-colors"
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
