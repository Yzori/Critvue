/**
 * Dashboard Components Barrel Export
 *
 * Structure:
 * - `/dashboard/creative` - Creative workspace (CreatorStudio & ReviewerDesk)
 * - `/dashboard/shared` - Shared utilities and components
 * - `/dashboard/mobile` - Mobile-optimized components
 *
 * @module dashboard
 */

// ============================================================================
// CREATIVE DASHBOARD (Primary)
// ============================================================================
export * from "./creative";

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
export * from "./shared";
export { AutoAcceptTimer } from "./shared/auto-accept-timer";

// ============================================================================
// MOBILE COMPONENTS
// ============================================================================
export * from "./mobile";
export { default as MobileCreatorDashboard } from "./mobile/mobile-creator-dashboard";
export { default as MobileReviewerDashboard } from "./mobile/mobile-reviewer-dashboard";
export { SwipeableReviewCard } from "./mobile/swipeable-review-card";
export { DashboardBottomNav } from "./mobile/dashboard-bottom-nav";
export { PullToRefresh } from "./mobile/pull-to-refresh";
export { UrgencyCountdown, UrgencyBadge } from "./mobile/urgency-countdown";
export { BatchAcceptButton, SelectionModeToggle } from "./mobile/batch-accept-button";
