"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
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

const getNavItems = (isAuthenticated: boolean): NavItem[] => [
  { label: "Browse", href: "/browse", showOn: "tablet" },
  { label: "Dashboard", href: "/dashboard", showOn: "tablet" },
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
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        // Layout - 48px minimum touch target
                        "relative px-4 py-2 min-h-[48px]",
                        "flex items-center justify-center",
                        "rounded-xl font-medium text-sm",
                        // Transitions
                        "transition-all duration-200",
                        // States
                        active
                          ? "text-accent-blue bg-accent-blue/10"
                          : "text-foreground hover:text-accent-blue hover:bg-accent-blue/5",
                        // Focus
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                      {/* Active indicator */}
                      {active && (
                        <span
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-blue rounded-full"
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
              <div className="hidden md:flex lg:hidden items-center gap-1">
                {navItems
                  .filter((item) => item.showOn === "tablet")
                  .map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "relative px-4 py-2 min-h-[48px]",
                          "flex items-center justify-center",
                          "rounded-xl font-medium text-sm",
                          "transition-all duration-200",
                          active
                            ? "text-accent-blue bg-accent-blue/10"
                            : "text-foreground hover:text-accent-blue hover:bg-accent-blue/5",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {item.label}
                        {active && (
                          <span
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-blue rounded-full"
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
                  className="hidden lg:flex"
                  aria-label="Search"
                >
                  <Search className="size-5" />
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
                    className="lg:hidden"
                    onClick={onMenuClick}
                    aria-label="Open menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <Menu className="size-6" />
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
