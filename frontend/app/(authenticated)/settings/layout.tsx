"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  Bell,
  Eye,
  Palette,
  ChevronLeft,
  Menu,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Settings Layout
 *
 * Provides a consistent layout for all settings pages with:
 * - Sidebar navigation on desktop (lg+)
 * - Sheet/drawer navigation on mobile/tablet
 * - Breadcrumb back navigation
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    label: "Account",
    href: "/settings/account",
    icon: User,
    description: "Profile, email, and personal info",
  },
  {
    label: "Reviewer",
    href: "/settings/reviewer",
    icon: MessageSquare,
    description: "Reviewer directory settings",
  },
  {
    label: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    description: "Subscription, payments & payouts",
  },
  {
    label: "Security",
    href: "/settings/security",
    icon: Shield,
    description: "Password, 2FA, and sessions",
  },
  {
    label: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Email, push, and SMS preferences",
  },
  {
    label: "Privacy",
    href: "/settings/privacy",
    icon: Eye,
    description: "Visibility and data controls",
  },
  {
    label: "Appearance",
    href: "/settings/appearance",
    icon: Palette,
    description: "Theme and display options",
  },
];

function SettingsNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              "hover:bg-accent-blue/5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue",
              isActive && "bg-accent-blue/10 text-accent-blue font-medium"
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0",
                isActive ? "text-accent-blue" : "text-muted-foreground"
              )}
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm truncate",
                  isActive ? "text-accent-blue" : "text-foreground"
                )}
              >
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground truncate hidden xl:block">
                {item.description}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Find current page label
  const currentPage = navItems.find((item) => item.href === pathname);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden flex items-center gap-2"
        >
          <Menu className="size-4" />
          <span>{currentPage?.label || "Settings"}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="text-left">
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <SettingsNav onItemClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container max-w-6xl mx-auto py-6 px-4 lg:py-8">
        {/* Header with back button and mobile nav */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-1 text-sm text-muted-foreground",
              "hover:text-foreground transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue rounded"
            )}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <Separator orientation="vertical" className="h-5 hidden lg:block" />

          {/* Desktop title */}
          <h1 className="text-2xl font-bold hidden lg:block">Settings</h1>

          {/* Mobile navigation trigger */}
          <div className="lg:hidden ml-auto">
            <MobileNav />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <SettingsNav />
              </ScrollArea>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
