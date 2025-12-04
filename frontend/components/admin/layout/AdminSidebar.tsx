"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Swords,
  UserCog,
  Ban,
  Clock,
  ScrollText,
  BarChart3,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "warning";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  pendingApplications?: number;
  bannedCount?: number;
  suspendedCount?: number;
}

export function AdminSidebar({
  pendingApplications = 0,
  bannedCount = 0,
  suspendedCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const navSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          label: "Users",
          href: "/admin/users",
          icon: Users,
        },
        {
          label: "Applications",
          href: "/admin/applications",
          icon: FileText,
          badge: pendingApplications > 0 ? pendingApplications : undefined,
        },
        {
          label: "Challenges",
          href: "/admin/challenges",
          icon: Swords,
        },
        {
          label: "Committee",
          href: "/admin/committee",
          icon: UserCog,
        },
      ],
    },
    {
      title: "Moderation",
      items: [
        {
          label: "Banned Users",
          href: "/admin/moderation/banned",
          icon: Ban,
          badge: bannedCount > 0 ? bannedCount : undefined,
          badgeVariant: "destructive",
        },
        {
          label: "Suspended",
          href: "/admin/moderation/suspended",
          icon: Clock,
          badge: suspendedCount > 0 ? suspendedCount : undefined,
          badgeVariant: "warning",
        },
        {
          label: "Audit Log",
          href: "/admin/moderation/audit",
          icon: ScrollText,
        },
      ],
    },
    {
      title: "Insights",
      items: [
        {
          label: "Analytics",
          href: "/admin/analytics",
          icon: BarChart3,
        },
        {
          label: "Leaderboard",
          href: "/admin/leaderboard",
          icon: Trophy,
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-background border-r border-border transition-all duration-300 flex flex-col",
        isCollapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4CC9F0] to-[#4361EE]">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Critvue</span>
              <span className="ml-1 text-xs text-muted-foreground">Admin</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4CC9F0] to-[#4361EE] mx-auto">
            <Shield className="h-4 w-4 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", isCollapsed && "absolute -right-3 top-6 bg-background border shadow-sm rounded-full")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex > 0 && "mt-6")}>
            {!isCollapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <Separator className="my-3" />
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#4CC9F0]/10 text-[#4CC9F0]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-[#4CC9F0]")} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge !== undefined && (
                            <Badge
                              variant={item.badgeVariant === "destructive" ? "destructive" : item.badgeVariant === "warning" ? "secondary" : "default"}
                              className={cn(
                                "h-5 min-w-5 px-1.5 text-xs",
                                item.badgeVariant === "warning" && "bg-amber-100 text-amber-700"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            isCollapsed && "justify-center px-2",
            pathname === "/admin/settings" && "bg-[#4CC9F0]/10 text-[#4CC9F0]"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={() => logout()}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors w-full",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Exit Admin" : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Exit Admin</span>}
        </button>
      </div>
    </aside>
  );
}
