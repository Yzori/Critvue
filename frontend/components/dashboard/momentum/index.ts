/**
 * Momentum Dashboard Components
 *
 * A distinctive, innovative dashboard experience featuring:
 * - Momentum Ring: Animated circular indicator of user's "flow state"
 * - Smart Action Cards: Contextual suggestions based on time/activity
 * - Quick Stats Bar: Compact gamification overview
 * - Celebrations: Micro-animations for achievements
 */

export { MomentumRing, type MomentumRingProps } from './MomentumRing';
export {
  SmartActionCard,
  generateSmartActions,
  type SmartActionCardProps,
  type SmartAction,
  type ActionType,
} from './SmartActionCard';
export { QuickStatsBar, type QuickStatsBarProps } from './QuickStatsBar';
export {
  Celebration,
  useCelebration,
  type CelebrationProps,
  type CelebrationType,
} from './Celebration';
export { MomentumDashboard, type MomentumDashboardProps } from './MomentumDashboard';
