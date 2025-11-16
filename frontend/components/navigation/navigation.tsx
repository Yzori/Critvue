"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Home, Search, LayoutDashboard, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TopNav } from "./top-nav";
import { MobileDrawer } from "./mobile-drawer";
import { FAB } from "./fab";
import { BottomNav, type BottomNavItem } from "@/components/ui/bottom-nav";

/**
 * Navigation Component - Unified Navigation System
 *
 * Combines all navigation components:
 * - TopNav: Responsive header (minimal on mobile, full on desktop)
 * - BottomNav: Mobile/tablet bottom navigation (existing component)
 * - MobileDrawer: Slide-in drawer for secondary navigation
 * - FAB: Floating action button for primary CTA (mobile only, authenticated users)
 *
 * Brand-Consistent Features:
 * - Critvue brand colors and glassmorphism throughout
 * - Responsive behavior based on breakpoints
 * - Auth-aware navigation items
 * - Proper z-index layering
 * - Smooth animations and transitions
 */

export interface NavigationProps {
  transparent?: boolean; // For hero sections
}

export function Navigation({ transparent = false }: NavigationProps) {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Determine active bottom nav item based on current path
  const getActiveBottomNavId = () => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/browse")) return "browse";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/profile")) return "profile";
    return "home";
  };

  // Bottom navigation items (mobile/tablet only)
  const bottomNavItems: BottomNavItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="size-6" />,
      activeIcon: <Home className="size-6" fill="currentColor" />,
      onClick: () => router.push("/"),
    },
    {
      id: "browse",
      label: "Browse",
      icon: <Search className="size-6" />,
      activeIcon: <Search className="size-6" fill="currentColor" />,
      onClick: () => router.push("/browse"),
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="size-6" />,
      activeIcon: <LayoutDashboard className="size-6" fill="currentColor" />,
      onClick: () => router.push("/dashboard"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User className="size-6" />,
      activeIcon: <User className="size-6" fill="currentColor" />,
      onClick: () => router.push("/profile"),
    },
  ];

  return (
    <>
      {/* Top Navigation - Visible on all screen sizes */}
      <TopNav
        user={user}
        variant="responsive"
        transparent={transparent}
        onMenuClick={() => setIsDrawerOpen(true)}
      />

      {/* Bottom Navigation - Mobile/Tablet only */}
      <BottomNav
        items={bottomNavItems}
        activeId={getActiveBottomNavId()}
        className="lg:hidden"
      />

      {/* Mobile Drawer - Triggered by hamburger menu */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
      />

      {/* FAB - Mobile only, authenticated users only */}
      {isAuthenticated && <FAB href="/request-review" label="Request Review" />}
    </>
  );
}
