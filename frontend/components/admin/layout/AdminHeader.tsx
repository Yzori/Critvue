"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Bell,
  Search,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  className?: string;
}

// Map paths to breadcrumb labels
const pathLabels: Record<string, string> = {
  admin: "Admin",
  users: "Users",
  applications: "Applications",
  challenges: "Challenges",
  committee: "Committee",
  moderation: "Moderation",
  banned: "Banned Users",
  suspended: "Suspended Users",
  audit: "Audit Log",
  analytics: "Analytics",
  leaderboard: "Leaderboard",
  settings: "Settings",
};

export function AdminHeader({ className }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Generate breadcrumbs from pathname
  const breadcrumbs = React.useMemo((): Breadcrumb[] => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Breadcrumb[] = [];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // Last item doesn't get a link
      if (index === segments.length - 1) {
        crumbs.push({ label });
      } else {
        crumbs.push({ label, href: currentPath });
      }
    });

    return crumbs;
  }, [pathname]);

  const getInitials = (name?: string | null) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6",
        className
      )}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Back to main site"
        >
          <Home className="h-4 w-4" />
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search users, applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 pl-2 pr-3">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="bg-[#4CC9F0]/10 text-[#4CC9F0] text-xs">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {user?.full_name || "Admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.full_name}</span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">View Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">Admin Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
