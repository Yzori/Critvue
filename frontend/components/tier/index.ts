/**
 * Tier System Components
 *
 * Centralized exports for all tier-related UI components
 */

// Core Components
export { TierBadge } from './tier-badge';
export type { TierBadgeProps } from './tier-badge';

export { KarmaProgress } from './karma-progress';
export type { KarmaProgressProps } from './karma-progress';

export {
  TierStatsCards,
  CompactTierCard,
  TierProgressCard,
} from './tier-stats-cards';
export type {
  TierStatsCardsProps,
  CompactTierCardProps,
  TierProgressCardProps,
} from './tier-stats-cards';

// Tier Locked Components
export {
  TierLockedBadge,
  TierLockedButton,
  TierLockedOverlay,
  TierUpgradeMessage,
} from './tier-locked-review';
export type {
  TierLockedBadgeProps,
  TierLockedButtonProps,
  TierLockedOverlayProps,
  TierUpgradeMessageProps,
} from './tier-locked-review';

// Notification Components
export {
  showTierUnlockNotification,
  showBenefitUnlockNotification,
  showKarmaMilestoneNotification,
  showStreakNotification,
  useTierUnlockCheck,
} from './tier-unlock-notification';
export type { TierUnlockData } from './tier-unlock-notification';
