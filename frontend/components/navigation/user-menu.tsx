"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, CreditCard, HelpCircle, LogOut, ChevronDown, FileEdit, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { User as UserType } from "@/lib/types/auth";
import { Avatar } from "@/components/profile/avatar-display";
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
  variant?: "default" | "destructive";
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const menuItems: MenuItem[] = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "My Reviews", href: "/reviewer/hub", icon: FileEdit },
    // Admin link - only shown for admin users
    ...(user.role === "admin" ? [{ label: "Admin Panel", href: "/admin/applications", icon: Shield, separator: true }] : []),
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Billing", href: "/billing", icon: CreditCard },
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
          {/* Avatar with brand-consistent styling */}
          <Avatar
            avatarUrl={user.avatar_url}
            fullName={user.full_name || user.email}
            size="md"
            verified={user.is_verified}
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
          "bg-background/95 backdrop-blur-xl",
          "border border-border shadow-2xl"
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

          return (
            <React.Fragment key={item.label}>
              {item.separator && <DropdownMenuSeparator />}

              {item.href ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer",
                      "text-foreground hover:text-accent-blue",
                      "focus:text-accent-blue"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-3 cursor-pointer",
                    item.variant === "destructive"
                      ? "text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                      : "text-foreground hover:text-accent-blue focus:text-accent-blue"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
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
