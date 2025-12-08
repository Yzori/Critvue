/**
 * Tier System Components
 *
 * Centralized exports for all tier-related UI components
 */

// Core Components
export { TierBadge } from './tier-badge';
export type { TierBadgeProps } from './tier-badge';

export { TieredAvatar } from './tiered-avatar';
export type { TieredAvatarProps, TieredAvatarSize } from './tiered-avatar';

export { SparksProgress } from './sparks-progress';
export type { SparksProgressProps } from './sparks-progress';
// Alias for backward compatibility
export { SparksProgress as KarmaProgress } from './sparks-progress';
export type { SparksProgressProps as KarmaProgressProps } from './sparks-progress';

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
  showSparksMilestoneNotification,
  showStreakNotification,
  useTierUnlockCheck,
} from './tier-unlock-notification';
// Alias for backward compatibility
export { showSparksMilestoneNotification as showKarmaMilestoneNotification } from './tier-unlock-notification';
export type { TierUnlockData } from './tier-unlock-notification';

