"use client";

/**
 * Desktop Dashboard Container
 *
 * INNOVATIVE Momentum Dashboard (2025)
 *
 * A distinctive, game-like dashboard experience that goes beyond standard SaaS patterns.
 *
 * Architecture:
 * - Quick Stats Bar (karma, XP, badges, leaderboard at a glance)
 * - Momentum Ring (animated flow state indicator)
 * - Smart Action Cards (contextual suggestions based on time/activity)
 * - Kanban board (visual workflow)
 * - Command palette (Cmd+K universal search)
 * - Micro-celebrations (achievement animations)
 *
 * Features:
 * - Gamification integrated into main dashboard (not hidden in sub-pages)
 * - Contextual intelligence (suggestions change based on time/state)
 * - Momentum scoring system (combines streak, goals, activity)
 * - Keyboard-first navigation (Cmd+K, shortcuts)
 * - Role-fluid design (Creator vs Reviewer)
 * - Micro-celebration animations for achievements
 *
 * Brand Compliance:
 * - Critvue brand colors (#3B82F6, #F97316)
 * - WCAG AA accessible
 * - Smooth, purposeful Framer Motion animations
 * - Responsive (1280px+ for optimal experience)
 *
 * @module DesktopDashboardContainer
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// Import innovative Momentum Dashboard
import { MomentumDashboard } from "../momentum";

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
 * Main container for the innovative Momentum Dashboard.
 * A distinctive, engaging experience that differentiates Critvue.
 */
export function DesktopDashboardContainer({
  role,
  onRoleChange,
  className,
}: DesktopDashboardContainerProps) {
  return (
    <div className={cn("min-h-screen", className)}>
      <MomentumDashboard
        role={role}
        onRoleChange={onRoleChange}
      />
    </div>
  );
}
