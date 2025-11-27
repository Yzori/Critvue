"use client";

/**
 * Desktop Dashboard Container
 *
 * ELEVATED Dashboard Experience (2025)
 *
 * A next-level dashboard that goes beyond standard SaaS patterns with:
 *
 * - User Pulse (emotional intelligence - adapts to user state)
 * - Hero Action Block (single "what to do next" focus)
 * - Story Mode Stats (narrative-driven data)
 * - Celebration System (meaningful achievements)
 * - Anticipation Engine (what's coming next)
 * - Ambient Presence (community activity)
 * - Reviewer Cockpit (earnings focus for reviewers)
 * - Role Transformation (smooth animated transitions)
 * - Ambient Modes (dark/focus/zen modes)
 *
 * Philosophy:
 * "How do we make users feel like they're making progress every time they open this?"
 *
 * Brand Compliance:
 * - Critvue brand colors (#3B82F6, #F97316)
 * - WCAG AA accessible
 * - Smooth Framer Motion animations with reduced-motion support
 * - Responsive (1024px+ for optimal desktop experience)
 *
 * @module DesktopDashboardContainer
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// Import the new Elevated Dashboard
import { ElevatedDashboard } from "../elevated";
import { AmbientModeProvider } from "../elevated/AmbientModeSystem";
import { UserPulseProvider } from "@/contexts/UserPulseContext";

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
 * Main container for the Elevated Dashboard experience.
 * Wraps with necessary providers for pulse and ambient mode.
 */
export function DesktopDashboardContainer({
  role,
  onRoleChange,
  className,
}: DesktopDashboardContainerProps) {
  return (
    <AmbientModeProvider>
      <UserPulseProvider>
        <div className={cn("min-h-screen", className)}>
          <ElevatedDashboard
            initialRole={role}
            onRoleChange={onRoleChange}
          />
        </div>
      </UserPulseProvider>
    </AmbientModeProvider>
  );
}
