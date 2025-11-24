"use client";

/**
 * Desktop Dashboard Container
 *
 * REVOLUTIONARY Command Center Dashboard (2024-2025)
 *
 * Replaces generic three-panel layout with action-first, keyboard-driven interface.
 *
 * Architecture:
 * - Slim top bar (role toggle, Cmd+K, profile)
 * - Urgent actions floating card (when critical items exist)
 * - Kanban board (3 columns for visual workflow)
 * - Quick action bar (persistent keyboard shortcuts)
 * - Command palette (Cmd+K universal search)
 *
 * Features:
 * - NO boring three-panel left/center/right layout
 * - Keyboard-first navigation (Cmd+K, shortcuts everywhere)
 * - Inline actions (no click-through required)
 * - Smooth Framer Motion animations
 * - Role-specific workflows (Creator vs Reviewer)
 *
 * Brand Compliance:
 * - Critvue brand colors (#3B82F6, #F97316)
 * - WCAG AA accessible
 * - Smooth, purposeful animations
 * - Responsive (1280px+ for optimal experience)
 *
 * @module DesktopDashboardContainer
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// Import revolutionary Command Center
import { CommandCenterDashboard } from "./command-center";

export type DashboardRole = "creator" | "reviewer";

export interface DesktopDashboardContainerProps {
  /**
   * Current dashboard role (creator or reviewer)
   */
  role: DashboardRole;

  /**
   * Callback when role changes
   */
  onRoleChange: (role: DashboardRole) => void;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Desktop Dashboard Container Component
 *
 * Main container for revolutionary Command Center dashboard.
 * Completely reimagined from the ground up - NO three-panel layout.
 */
export function DesktopDashboardContainer({
  role,
  onRoleChange,
  className,
}: DesktopDashboardContainerProps) {
  return (
    <div className={cn("min-h-screen", className)}>
      <CommandCenterDashboard
        role={role}
        onRoleChange={onRoleChange}
      />
    </div>
  );
}
