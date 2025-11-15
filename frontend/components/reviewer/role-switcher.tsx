/**
 * Role Switcher Component
 *
 * Allows users to switch between Creator and Reviewer modes:
 * - Toggle in navigation
 * - Shows current role
 * - Switches dashboard view
 * - Persists preference in localStorage
 * - Clear visual distinction
 *
 * Brand Compliance:
 * - Critvue brand colors (blue for Creator, peach for Reviewer)
 * - Smooth toggle animation
 * - Glassmorphism design
 * - Mobile-friendly (44px minimum)
 */

"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Palette, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserRole = "creator" | "reviewer";

export interface RoleSwitcherProps {
  className?: string;
}

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current role from pathname
  const getCurrentRole = (): UserRole => {
    if (pathname.startsWith("/reviewer")) {
      return "reviewer";
    }
    return "creator";
  };

  const [role, setRole] = React.useState<UserRole>(getCurrentRole());

  // Update role when pathname changes
  React.useEffect(() => {
    setRole(getCurrentRole());
  }, [pathname]);

  // Load saved preference on mount
  React.useEffect(() => {
    const savedRole = localStorage.getItem("user-role") as UserRole | null;
    if (savedRole && savedRole !== role) {
      setRole(savedRole);
    }
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem("user-role", newRole);

    // Navigate to unified dashboard with role parameter
    router.push(`/dashboard?role=${newRole}`);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Desktop: Segmented Control */}
      <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border">
        <button
          onClick={() => handleRoleChange("creator")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px]",
            role === "creator"
              ? "bg-accent-blue text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Palette className="size-4" />
          <span>Creator</span>
        </button>
        <button
          onClick={() => handleRoleChange("reviewer")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px]",
            role === "reviewer"
              ? "bg-accent-peach text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Star className="size-4" />
          <span>Reviewer</span>
        </button>
      </div>

      {/* Mobile: Compact Badge Toggle */}
      <div className="sm:hidden flex items-center gap-2">
        <button
          onClick={() => handleRoleChange(role === "creator" ? "reviewer" : "creator")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-all min-h-[44px]"
        >
          {role === "creator" ? (
            <>
              <Palette className="size-4 text-accent-blue" />
              <span className="text-sm font-medium">Creator</span>
            </>
          ) : (
            <>
              <Star className="size-4 text-accent-peach" />
              <span className="text-sm font-medium">Reviewer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Compact Role Badge
 *
 * Shows current role in a compact badge format.
 * Useful for mobile navigation or constrained spaces.
 */
export function RoleBadge({ className }: { className?: string }) {
  const pathname = usePathname();
  const isReviewer = pathname.startsWith("/reviewer");

  return (
    <Badge
      variant={isReviewer ? "secondary" : "primary"}
      size="sm"
      showDot
      pulse={isReviewer}
      icon={isReviewer ? <Star className="size-3" /> : <Palette className="size-3" />}
      className={className}
    >
      {isReviewer ? "Reviewer" : "Creator"}
    </Badge>
  );
}
