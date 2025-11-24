/**
 * Dashboard Components Master Barrel Export
 *
 * Centralized export point for all dashboard components.
 * Maintains backward compatibility with old import paths.
 *
 * New Structure:
 * - `/dashboard/shared` - Shared utilities and components
 * - `/dashboard/mobile` - Mobile-optimized components
 * - `/dashboard/desktop` - Desktop-optimized components (to be implemented)
 *
 * @module dashboard
 */

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
export * from "./shared";

// ============================================================================
// MOBILE COMPONENTS
// ============================================================================
export * from "./mobile";

// Backward compatibility: Re-export mobile components at root level
export { default as MobileCreatorDashboard } from "./mobile/mobile-creator-dashboard";
export { default as MobileReviewerDashboard } from "./mobile/mobile-reviewer-dashboard";
export { SwipeableReviewCard } from "./mobile/swipeable-review-card";
export { DashboardBottomNav } from "./mobile/dashboard-bottom-nav";
export { PullToRefresh } from "./mobile/pull-to-refresh";
export { UrgencyCountdown, UrgencyBadge } from "./mobile/urgency-countdown";
export { BatchAcceptButton, SelectionModeToggle } from "./mobile/batch-accept-button";

// Backward compatibility: Auto-accept timer
export { AutoAcceptTimer } from "./shared/auto-accept-timer";

// ============================================================================
// DESKTOP COMPONENTS (To be implemented)
// ============================================================================
export * from "./desktop";

// ============================================================================
// LEGACY COMPONENTS (Root level - will be moved/deprecated)
// ============================================================================

// Note: The following components remain at root level for now:
// - creator-dashboard.tsx (desktop legacy)
// - reviewer-dashboard.tsx (desktop legacy)
// - accept-review-modal.tsx
// - reject-review-modal.tsx
// - multi-review-status-card.tsx
// - pending-feedbacks-section.tsx
// - pending-review-alert.tsx
// - review-slot-card.tsx
// - subscription-status-card.tsx
//
// These will be refactored in future phases as desktop components are built.
