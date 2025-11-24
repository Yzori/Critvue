/**
 * Dashboard Shared Components Barrel Export
 *
 * Centralized exports for shared dashboard utilities and components.
 * These components are used across both mobile and desktop dashboard implementations.
 *
 * @module dashboard/shared
 */

// Urgency utilities
export {
  calculateUrgency,
  getUrgencyConfig,
  UrgencyIndicator,
} from "./urgency-indicator";
export type {
  UrgencyLevel,
  UrgencyData,
  UrgencyIndicatorProps,
} from "./urgency-indicator";

// Status utilities
export {
  getStatusConfig,
  ReviewStatusBadge,
} from "./review-status-badge";
export type {
  ReviewStatus,
  StatusConfig,
  ReviewStatusBadgeProps,
} from "./review-status-badge";

// Timer components
export { AutoAcceptTimer } from "./auto-accept-timer";
export type { AutoAcceptTimerProps } from "./auto-accept-timer";

// Empty and loading states
export { EmptyState } from "./empty-state";
export type { EmptyStateProps } from "./empty-state";

export {
  Skeleton,
  CardSkeleton,
  StatCardSkeleton,
  ListSkeleton,
  DashboardSkeleton,
} from "./loading-skeleton";
export type { SkeletonProps } from "./loading-skeleton";

// Stats components (re-export from stats subfolder)
export {
  StatCard,
  MiniStat,
  MiniStatList,
  TrendIndicator,
  Sparkline,
} from "./stats";
export type {
  StatCardProps,
  MiniStatProps,
  MiniStatListProps,
  TrendIndicatorProps,
  SparklineProps,
} from "./stats";
