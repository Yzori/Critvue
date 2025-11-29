"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types/auth";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "@/components/notifications/NotificationBell";

/**
 * TopNav Component - Main Navigation Header
 *
 * Brand-Consistent Features:
 * - Glassmorphism: bg-background/80 backdrop-blur-lg
 * - Critvue brand colors (accent-blue, accent-peach)
 * - Responsive variants: minimal (mobile), expanded (tablet), full (desktop)
 * - Fixed position with smooth scroll shadow
 * - Active state indicators with accent-blue
 * - WCAG AA compliant touch targets (48px minimum)
 */

export interface NavItem {
  label: string;
  href: string;
  showOn?: "tablet" | "desktop"; // When to show this item
}

export interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  user?: User | null;
  variant?: "minimal" | "expanded" | "full" | "responsive";
  transparent?: boolean; // For hero sections
  onMenuClick?: () => void; // Opens mobile drawer
}

interface NavItemWithIcon extends NavItem {
  icon?: React.ComponentType<{ className?: string }>;
}

const getNavItems = (isAuthenticated: boolean): NavItemWithIcon[] => [
  { label: "Browse", href: "/browse", showOn: "tablet", icon: Search },
  { label: "Dashboard", href: "/dashboard", showOn: "tablet" },
  { label: "Leaderboard", href: "/leaderboard", showOn: "desktop", icon: Trophy },
  // Show "My Reviews" for all authenticated users - everyone can give reviews
  ...(isAuthenticated ? [{ label: "My Reviews", href: "/reviewer/hub", showOn: "desktop" as const }] : []),
  { label: "How It Works", href: "/how-it-works", showOn: "desktop" },
];

const TopNav = React.forwardRef<HTMLElement, TopNavProps>(
  (
    {
      user,
      variant = "responsive",
      transparent = false,
      onMenuClick,
      className,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname();
    const [hasScrolled, setHasScrolled] = React.useState(false);

    // Get navigation items - show reviewer links for all authenticated users
    const navItems = getNavItems(!!user);

    // Detect scroll for shadow effect
    React.useEffect(() => {
      const handleScroll = () => {
        setHasScrolled(window.scrollY > 10);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isActive = (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    };

    return (
      <nav
        ref={ref}
        className={cn(
          // Layout
          "fixed top-0 left-0 right-0 z-[100]",
          "h-16 md:h-20",
          // Safe area insets for notched devices
          "pt-safe",
          // Glassmorphism
          transparent && !hasScrolled
            ? "bg-transparent"
            : "bg-background/80 backdrop-blur-lg border-b border-border",
          // Shadow on scroll
          hasScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
          // Transitions
          "transition-all duration-300",
          className
        )}
        role="navigation"
        aria-label="Primary navigation"
        {...props}
      >
        <div className="h-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2",
                "text-xl md:text-2xl font-bold",
                "bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent",
                "transition-opacity hover:opacity-80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 rounded-lg px-2 py-1 -ml-2"
              )}
              aria-label="Critvue home"
            >
              Critvue
            </Link>

            {/* Desktop Navigation Items */}
            {(variant === "full" || variant === "responsive") && (
              <div className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-foreground/[0.02]">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        // Layout - 48px minimum touch target
                        "group relative px-4 py-2.5 min-h-[44px]",
                        "flex items-center justify-center gap-2",
                        "rounded-xl font-medium text-sm",
                        // Transitions with spring easing
                        "transition-all duration-300",
                        "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                        // States
                        active
                          ? "text-accent-blue bg-white shadow-sm"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/50",
                        // Focus
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {/* Optional icon with micro-animation */}
                      {Icon && (
                        <Icon
                          className={cn(
                            "size-4 transition-transform duration-300",
                            "group-hover:scale-110",
                            active && "text-accent-blue"
                          )}
                        />
                      )}
                      <span>{item.label}</span>
                      {/* Animated underline on hover (non-active items) */}
                      {!active && (
                        <span
                          className={cn(
                            "absolute bottom-1.5 left-1/2 -translate-x-1/2",
                            "w-0 h-0.5 bg-accent-blue/50 rounded-full",
                            "transition-all duration-300 ease-out",
                            "group-hover:w-8"
                          )}
                          aria-hidden="true"
                        />
                      )}
                      {/* Active indicator - subtle glow */}
                      {active && (
                        <span
                          className={cn(
                            "absolute inset-0 rounded-xl",
                            "ring-1 ring-accent-blue/20",
                            "shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Tablet Navigation Items */}
            {(variant === "expanded" || variant === "responsive") && (
              <div className="hidden md:flex lg:hidden items-center gap-1 p-1 rounded-2xl bg-foreground/[0.02]">
                {navItems
                  .filter((item) => item.showOn === "tablet")
                  .map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative px-4 py-2.5 min-h-[44px]",
                          "flex items-center justify-center gap-2",
                          "rounded-xl font-medium text-sm",
                          "transition-all duration-300",
                          "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                          active
                            ? "text-accent-blue bg-white shadow-sm"
                            : "text-foreground/70 hover:text-foreground hover:bg-white/50",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {Icon && (
                          <Icon
                            className={cn(
                              "size-4 transition-transform duration-300",
                              "group-hover:scale-110",
                              active && "text-accent-blue"
                            )}
                          />
                        )}
                        <span>{item.label}</span>
                        {!active && (
                          <span
                            className={cn(
                              "absolute bottom-1.5 left-1/2 -translate-x-1/2",
                              "w-0 h-0.5 bg-accent-blue/50 rounded-full",
                              "transition-all duration-300 ease-out",
                              "group-hover:w-8"
                            )}
                            aria-hidden="true"
                          />
                        )}
                        {active && (
                          <span
                            className={cn(
                              "absolute inset-0 rounded-xl",
                              "ring-1 ring-accent-blue/20",
                              "shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                            )}
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    );
                  })}
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Search Icon - Desktop only */}
              {(variant === "full" || variant === "responsive") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "hidden lg:flex",
                    "group transition-all duration-200",
                    "hover:bg-accent-blue/5"
                  )}
                  aria-label="Search"
                >
                  <Search
                    className={cn(
                      "size-5 transition-transform duration-300",
                      "group-hover:scale-110 group-hover:text-accent-blue"
                    )}
                  />
                </Button>
              )}

              {/* Notifications - Desktop only, authenticated users */}
              {user &&
                (variant === "full" || variant === "responsive") && (
                  <NotificationBell />
                )}

              {/* CTA Button - Tablet/Desktop */}
              {user ? (
                <>
                  {/* User Menu - Desktop */}
                  <div className="hidden lg:block">
                    <UserMenu user={user} />
                  </div>

                  {/* Hamburger Menu - Mobile/Tablet */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "lg:hidden group",
                      "transition-all duration-200",
                      "hover:bg-accent-blue/5"
                    )}
                    onClick={onMenuClick}
                    aria-label="Open menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <Menu
                      className={cn(
                        "size-6 transition-transform duration-300",
                        "group-hover:scale-110"
                      )}
                    />
                  </Button>
                </>
              ) : (
                <>
                  {/* Login/Signup buttons for non-authenticated users */}
                  <Link href="/login" className="hidden md:block">
                    <Button variant="ghost" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className={cn(
                        "bg-gradient-to-r from-accent-blue to-accent-peach",
                        "text-white font-semibold",
                        "hover:opacity-90 hover:shadow-lg",
                        "transition-all duration-200"
                      )}
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }
);

TopNav.displayName = "TopNav";

export { TopNav };
