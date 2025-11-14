"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, CreditCard, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { User as UserType } from "@/lib/types/auth";

/**
 * UserMenu Component - Profile Dropdown Menu
 *
 * Brand-Consistent Features:
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
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const menuItems: MenuItem[] = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Billing", href: "/billing", icon: CreditCard },
    { label: "Help & Support", href: "/help", icon: HelpCircle, separator: true },
    { label: "Sign Out", onClick: handleLogout, icon: LogOut },
  ];

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(user.full_name || user.email);

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 min-h-[48px] px-3 py-2",
          "rounded-xl transition-all duration-200",
          "hover:bg-accent-blue/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {/* Avatar with gradient border */}
        <div
          className={cn(
            "relative size-10 rounded-full",
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
            {initials}
          </div>
        </div>

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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            // Layout - appears below button
            "absolute top-full right-0 mt-2",
            "w-56",
            // Glassmorphism
            "bg-background/95 backdrop-blur-xl",
            "border border-border rounded-2xl",
            "shadow-lg",
            // Animation
            "animate-in fade-in slide-in-from-top-4 duration-200",
            // Z-index - above nav but below modals
            "z-[60]",
            // Overflow
            "overflow-hidden"
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {user.full_name || "User"}
            </p>
            <p className="text-xs text-foreground-muted truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;

              return (
                <React.Fragment key={item.label}>
                  {item.separator && <div className="my-2 h-px bg-border" />}

                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 min-h-[44px]",
                        "text-sm text-foreground hover:text-accent-blue",
                        "hover:bg-accent-blue/5",
                        "transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:bg-accent-blue/10"
                      )}
                      role="menuitem"
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={item.onClick}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px]",
                        "text-sm text-left",
                        isLast
                          ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                          : "text-foreground hover:text-accent-blue hover:bg-accent-blue/5",
                        "transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:bg-accent-blue/10"
                      )}
                      role="menuitem"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
