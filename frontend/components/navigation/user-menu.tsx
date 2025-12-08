"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, CreditCard, HelpCircle, LogOut, ChevronDown, FileEdit, Shield, PlusCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { User as UserType } from "@/lib/types/auth";
import { TieredAvatar } from "@/components/tier/tiered-avatar";
import { UserTier } from "@/lib/types/tier";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * UserMenu Component - Profile Dropdown Menu
 *
 * Brand-Consistent Features:
 * - Uses shadcn DropdownMenu for proper z-index handling
 * - Glassmorphism dropdown: bg-background/95 backdrop-blur-xl
 * - Gradient avatar border using Critvue brand colors
 * - Accessible keyboard navigation (Tab, Enter, Escape)
 * - WCAG AA compliant touch targets
 * - Smooth animations with proper z-index layering
 */

export interface UserMenuProps {
  user: UserType;
}

interface MenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  separator?: boolean;
  variant?: "default" | "destructive" | "primary";
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const menuItems: MenuItem[] = [
    // Primary CTA at top
    { label: "Request Review", href: "/review/new", icon: PlusCircle, variant: "primary" },
    // User navigation
    { label: "Profile", href: "/profile", icon: User, separator: true },
    { label: "My Reviews", href: "/reviewer/hub", icon: FileEdit },
    { label: "Sparks & Badges", href: "/dashboard/sparks", icon: Sparkles },
    // Admin link - only shown for admin users
    ...(user.role === "admin" ? [{ label: "Admin Panel", href: "/admin/applications", icon: Shield, separator: true }] : []),
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Billing", href: "/settings/billing", icon: CreditCard },
    { label: "Help & Support", href: "/help", icon: HelpCircle, separator: true },
    { label: "Sign Out", onClick: handleLogout, icon: LogOut, variant: "destructive" as const },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 min-h-[48px] px-3 py-2",
            "rounded-xl transition-all duration-200",
            "hover:bg-accent-blue/5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
          )}
          aria-label="User menu"
        >
          {/* Avatar with tier-based styling */}
          <TieredAvatar
            avatarUrl={user.avatar_url}
            fullName={user.full_name || user.email}
            tier={(user.user_tier as UserTier) || UserTier.NEWCOMER}
            size="sm"
          />

          {/* User name - hidden on smaller screens */}
          <span className="hidden xl:block text-sm font-medium max-w-[120px] truncate">
            {user.full_name || "User"}
          </span>

          {/* Chevron indicator */}
          <ChevronDown
            className={cn(
              "hidden xl:block size-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-56",
          // Explicit solid white background - no transparency
          "!bg-white dark:!bg-zinc-900",
          "border border-border/50",
          // Elevated shadow for depth
          "shadow-[0_4px_24px_rgba(0,0,0,0.12),0_8px_48px_rgba(0,0,0,0.08)]",
          // Subtle ring for definition
          "ring-1 ring-black/[0.03]"
        )}
        sideOffset={8}
      >
        {/* User info header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Menu items */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isPrimary = item.variant === "primary";
          const isDestructive = item.variant === "destructive";

          // Style classes based on variant
          const itemClasses = cn(
            "flex items-center gap-3 cursor-pointer rounded-md transition-colors",
            isPrimary && [
              "bg-accent-blue",
              "text-white font-medium",
              "hover:opacity-90",
              "focus:opacity-90",
            ],
            isDestructive && [
              "text-destructive",
              "hover:text-destructive hover:bg-destructive/10",
              "focus:text-destructive focus:bg-destructive/10",
            ],
            !isPrimary && !isDestructive && [
              "text-foreground",
              "hover:text-accent-blue hover:bg-accent-blue/5",
              "focus:text-accent-blue focus:bg-accent-blue/5",
            ]
          );

          const iconClasses = cn(
            "size-4 shrink-0",
            isPrimary && "text-white"
          );

          return (
            <React.Fragment key={item.label}>
              {item.separator && <DropdownMenuSeparator />}

              {item.href ? (
                <DropdownMenuItem asChild>
                  <Link href={item.href} className={itemClasses}>
                    <Icon className={iconClasses} />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={item.onClick} className={itemClasses}>
                  <Icon className={iconClasses} />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              )}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
