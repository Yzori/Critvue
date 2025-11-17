"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Home,
  Search,
  BookOpen,
  LayoutDashboard,
  User,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { User as UserType } from "@/lib/types/auth";

/**
 * MobileDrawer Component - Slide-in Navigation Drawer
 *
 * Brand-Consistent Features:
 * - Slides in from right side on mobile/tablet
 * - Glassmorphism drawer background
 * - Critvue brand colors for active states
 * - Backdrop overlay with blur
 * - Accessible keyboard navigation (Escape to close)
 * - Smooth animations with proper z-index
 * - 48px minimum touch targets
 */

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserType | null;
}

interface DrawerNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}

export function MobileDrawer({ isOpen, onClose, user }: MobileDrawerProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  // Primary navigation items
  const primaryNavItems: DrawerNavItem[] = [
    { label: "Home", href: "/", icon: Home, primary: true },
    { label: "Browse", href: "/browse", icon: Search, primary: true },
    { label: "Reviews", href: "/dashboard", icon: LayoutDashboard, primary: true },
    { label: "How It Works", href: "/how-it-works", icon: BookOpen, primary: true },
  ];

  // Secondary navigation items (authenticated users only)
  const secondaryNavItems: DrawerNavItem[] = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help & Support", href: "/help", icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[100]",
          "bg-black/50 backdrop-blur-sm",
          "animate-in fade-in duration-200"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[100]",
          "w-[280px] max-w-[85vw]",
          "bg-background shadow-2xl",
          "animate-in slide-in-from-right duration-300",
          "overflow-y-auto"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-bold bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent">
            Critvue
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* User Profile Section (if authenticated) */}
        {user && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              {/* Avatar with gradient border */}
              <div
                className={cn(
                  "relative size-12 rounded-full",
                  "bg-gradient-to-r from-accent-blue to-accent-peach",
                  "p-[2px]"
                )}
              >
                <div
                  className={cn(
                    "size-full rounded-full",
                    "bg-accent-blue/10",
                    "flex items-center justify-center",
                    "text-accent-blue font-semibold text-sm"
                  )}
                >
                  {getInitials(user.full_name || user.email)}
                </div>
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.full_name || "User"}
                </p>
                <p className="text-xs text-foreground-muted truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Primary Navigation */}
        <div className="p-4">
          <nav className="space-y-1" role="navigation" aria-label="Primary navigation">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 min-h-[48px]",
                    "rounded-xl font-medium text-sm",
                    "transition-all duration-200",
                    active
                      ? "text-accent-blue bg-accent-blue/10"
                      : "text-foreground hover:text-accent-blue hover:bg-accent-blue/5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation (authenticated users only) */}
        {user && (
          <>
            <div className="px-4 py-2">
              <div className="h-px bg-border" />
            </div>

            <div className="p-4">
              <nav
                className="space-y-1"
                role="navigation"
                aria-label="Secondary navigation"
              >
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 min-h-[48px]",
                        "rounded-xl font-medium text-sm",
                        "transition-all duration-200",
                        active
                          ? "text-accent-blue bg-accent-blue/10"
                          : "text-foreground hover:text-accent-blue hover:bg-accent-blue/5",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}

        {/* Sign Out Button (authenticated users only) */}
        {user && (
          <div className="p-4 mt-auto border-t border-border">
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 min-h-[48px]",
                "rounded-xl font-medium text-sm",
                "text-destructive hover:bg-destructive/10",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
              )}
            >
              <LogOut className="size-5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* CTA for non-authenticated users */}
        {!user && (
          <div className="p-4 space-y-2 border-t border-border">
            <Link href="/register" onClick={onClose}>
              <Button
                className={cn(
                  "w-full bg-gradient-to-r from-accent-blue to-accent-peach",
                  "text-white font-semibold",
                  "hover:opacity-90 hover:shadow-lg",
                  "transition-all duration-200"
                )}
              >
                Get Started
              </Button>
            </Link>
            <Link href="/login" onClick={onClose}>
              <Button variant="outline" className="w-full">
                Log In
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
