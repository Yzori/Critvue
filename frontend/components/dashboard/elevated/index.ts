/**
 * Elevated Dashboard Components
 *
 * A collection of next-level dashboard components that go beyond
 * standard SaaS patterns. Features:
 *
 * - Emotional Intelligence (User Pulse)
 * - Hero Action Block (What to do next)
 * - Story Mode Stats (Narrative-driven data)
 * - Celebration System (Meaningful celebrations)
 * - Anticipation Engine (What's coming)
 * - Ambient Presence (Community activity)
 * - Reviewer Cockpit (Earnings focus)
 * - Role Transformation (Smooth transitions)
 * - Ambient Modes (Dark/Focus/Zen)
 */

// Main dashboard
export { ElevatedDashboard, default } from './ElevatedDashboard';

// Hero Action Block
export {
  HeroActionBlock,
  determineHeroAction,
  type HeroAction,
  type HeroActionType,
} from './HeroActionBlock';

// Story Mode Stats
export {
  StoryModeStats,
  StoryModeCompact,
  type StoryStats,
} from './StoryModeStats';

// Animated Stats
export {
  AnimatedNumber,
  AnimatedCurrency,
  TrendIndicator,
  Sparkline,
  AnimatedStatCard,
  AnimatedStatsGrid,
  EarningsDisplay,
  CompactStatRow,
  StreakCounter,
  type StatCardData,
} from './AnimatedStats';

// Celebration System
export {
  CelebrationOverlay,
  InlineCelebration,
  CelebrationToast,
  useCelebrations,
  celebrations,
  type CelebrationType,
  type CelebrationConfig,
} from './CelebrationSystem';

// Anticipation Engine
export {
  LiveActivityFeed,
  PredictionCard,
  CountdownCard,
  UpcomingEventsSection,
  generatePredictions,
  type ActivityEvent,
  type Prediction,
  type CountdownMoment,
} from './AnticipationEngine';

// Ambient Presence
export {
  OnlineCounter,
  ActivityPulse,
  ViewersIndicator,
  TrendingBadge,
  PlatformStatusBar,
  TypingIndicator,
  RecentActivityIndicator,
  GlobalActivityStream,
  PresenceHeader,
} from './AmbientPresence';

// Reviewer Cockpit
export {
  EarningsDashboard,
  EfficiencyMetrics,
  QueueOptimizer,
  ReviewerQuickStats,
  StreakBadgesDisplay,
  type QueueSuggestion,
} from './ReviewerCockpit';

// Role Transition
export {
  AnimatedRoleToggle,
  RoleTransitionOverlay,
  DashboardTransition,
  RoleBadge,
  RoleSwitchPrompt,
  useRoleTransition,
} from './RoleTransition';

// Ambient Mode System
export {
  AmbientModeProvider,
  useAmbientMode,
  ModeSwitcher,
  HideInZenMode,
  ReducedMotionWrapper,
  type AmbientMode,
} from './AmbientModeSystem';
