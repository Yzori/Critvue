/**
 * Badge Icon Mapping
 *
 * Maps badge codes to Lucide icons with appropriate colors.
 * Used by the BadgeIcon component for consistent badge visuals.
 */

import {
  // Development skills
  Atom,
  FileCode,
  Code2,
  Terminal,
  Server,
  Smartphone,
  Apple,
  Binary,
  Blocks,
  Braces,

  // Design skills
  Palette,
  Figma,
  PenTool,
  Layout,
  Brush,

  // Content skills
  FileText,
  Video,
  Music,

  // Milestones
  Footprints,
  Rocket,
  Medal,
  Trophy,
  Crown,
  Star,
  Gem,
  Sparkles,

  // Quality
  Heart,
  ThumbsUp,
  Award,
  BadgeCheck,
  Target,
  Zap,
  Clock,
  CheckCircle2,

  // Streaks
  Flame,
  CalendarDays,

  // Creator
  Send,
  MessageSquare,
  CreditCard,
  Gauge,
  FolderOpen,

  // Community
  Users,
  UserPlus,
  Network,
  GraduationCap,
  Shield,
  Building,
  TrendingUp,

  // Special
  Gift,
  Bug,
  Lightbulb,
  PartyPopper,
  Cake,
  History,
  type LucideIcon,
} from 'lucide-react';

export interface BadgeIconConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

/**
 * Badge icon configurations mapped by badge code.
 * Each badge gets a unique icon with on-brand colors.
 */
export const BADGE_ICONS: Record<string, BadgeIconConfig> = {
  // ============================================
  // SKILL BADGES - Development
  // ============================================

  // React
  skill_react_apprentice: {
    icon: Atom,
    color: '#61DAFB',
    bgColor: '#61DAFB20',
  },
  skill_react_expert: {
    icon: Atom,
    color: '#61DAFB',
    bgColor: '#61DAFB30',
  },

  // TypeScript
  skill_typescript_apprentice: {
    icon: FileCode,
    color: '#3178C6',
    bgColor: '#3178C620',
  },
  skill_typescript_expert: {
    icon: FileCode,
    color: '#3178C6',
    bgColor: '#3178C630',
  },

  // Python
  skill_python_apprentice: {
    icon: Terminal,
    color: '#3776AB',
    bgColor: '#3776AB20',
  },
  skill_python_expert: {
    icon: Terminal,
    color: '#3776AB',
    bgColor: '#3776AB30',
  },

  // Vue.js
  skill_vue_apprentice: {
    icon: Blocks,
    color: '#42B883',
    bgColor: '#42B88320',
  },
  skill_vue_expert: {
    icon: Blocks,
    color: '#42B883',
    bgColor: '#42B88330',
  },

  // Angular
  skill_angular_apprentice: {
    icon: Braces,
    color: '#DD0031',
    bgColor: '#DD003120',
  },
  skill_angular_expert: {
    icon: Braces,
    color: '#DD0031',
    bgColor: '#DD003130',
  },

  // Node.js
  skill_nodejs_apprentice: {
    icon: Server,
    color: '#339933',
    bgColor: '#33993320',
  },
  skill_nodejs_expert: {
    icon: Server,
    color: '#339933',
    bgColor: '#33993330',
  },

  // Go
  skill_go_apprentice: {
    icon: Binary,
    color: '#00ADD8',
    bgColor: '#00ADD820',
  },
  skill_go_expert: {
    icon: Binary,
    color: '#00ADD8',
    bgColor: '#00ADD830',
  },

  // Rust
  skill_rust_apprentice: {
    icon: Code2,
    color: '#CE422B',
    bgColor: '#CE422B20',
  },
  skill_rust_expert: {
    icon: Code2,
    color: '#CE422B',
    bgColor: '#CE422B30',
  },

  // Swift/iOS
  skill_swift_apprentice: {
    icon: Apple,
    color: '#F05138',
    bgColor: '#F0513820',
  },
  skill_swift_expert: {
    icon: Apple,
    color: '#F05138',
    bgColor: '#F0513830',
  },

  // Kotlin/Android
  skill_kotlin_apprentice: {
    icon: Smartphone,
    color: '#7F52FF',
    bgColor: '#7F52FF20',
  },
  skill_kotlin_expert: {
    icon: Smartphone,
    color: '#7F52FF',
    bgColor: '#7F52FF30',
  },

  // ============================================
  // SKILL BADGES - Design
  // ============================================

  // Design (general)
  skill_design_apprentice: {
    icon: Palette,
    color: '#FF6B6B',
    bgColor: '#FF6B6B20',
  },
  skill_design_expert: {
    icon: Palette,
    color: '#FF6B6B',
    bgColor: '#FF6B6B30',
  },

  // UI Design
  skill_ui_apprentice: {
    icon: Layout,
    color: '#845EF7',
    bgColor: '#845EF720',
  },
  skill_ui_expert: {
    icon: Layout,
    color: '#845EF7',
    bgColor: '#845EF730',
  },

  // UX Design
  skill_ux_apprentice: {
    icon: PenTool,
    color: '#20C997',
    bgColor: '#20C99720',
  },
  skill_ux_expert: {
    icon: PenTool,
    color: '#20C997',
    bgColor: '#20C99730',
  },

  // Brand/Logo
  skill_brand_apprentice: {
    icon: Figma,
    color: '#F24E1E',
    bgColor: '#F24E1E20',
  },
  skill_brand_expert: {
    icon: Figma,
    color: '#F24E1E',
    bgColor: '#F24E1E30',
  },

  // Illustration
  skill_illustration_apprentice: {
    icon: Brush,
    color: '#FCC419',
    bgColor: '#FCC41920',
  },
  skill_illustration_expert: {
    icon: Brush,
    color: '#FCC419',
    bgColor: '#FCC41930',
  },

  // ============================================
  // SKILL BADGES - Content
  // ============================================

  // Writing
  skill_writing_apprentice: {
    icon: FileText,
    color: '#748FFC',
    bgColor: '#748FFC20',
  },
  skill_writing_expert: {
    icon: FileText,
    color: '#748FFC',
    bgColor: '#748FFC30',
  },

  // Video/Stream
  skill_video_apprentice: {
    icon: Video,
    color: '#F03E3E',
    bgColor: '#F03E3E20',
  },
  skill_video_expert: {
    icon: Video,
    color: '#F03E3E',
    bgColor: '#F03E3E30',
  },

  // Music/Audio
  skill_audio_apprentice: {
    icon: Music,
    color: '#1DB954',
    bgColor: '#1DB95420',
  },
  skill_audio_expert: {
    icon: Music,
    color: '#1DB954',
    bgColor: '#1DB95430',
  },

  // ============================================
  // CREATOR BADGES
  // ============================================

  creator_first_request: {
    icon: Send,
    color: '#4DABF7',
    bgColor: '#4DABF720',
  },
  creator_feedback_seeker: {
    icon: MessageSquare,
    color: '#69DB7C',
    bgColor: '#69DB7C20',
  },
  creator_improvement_driven: {
    icon: TrendingUp,
    color: '#38D9A9',
    bgColor: '#38D9A920',
  },
  creator_quality_patron: {
    icon: CreditCard,
    color: '#9775FA',
    bgColor: '#9775FA20',
  },
  creator_generous_rater: {
    icon: Heart,
    color: '#FF8787',
    bgColor: '#FF878720',
  },
  creator_detailed_requester: {
    icon: Gauge,
    color: '#74C0FC',
    bgColor: '#74C0FC20',
  },
  creator_quick_responder: {
    icon: Zap,
    color: '#FFD43B',
    bgColor: '#FFD43B20',
  },
  creator_revision_master: {
    icon: Target,
    color: '#F783AC',
    bgColor: '#F783AC20',
  },
  creator_portfolio_builder: {
    icon: FolderOpen,
    color: '#A9E34B',
    bgColor: '#A9E34B20',
  },
  creator_critvue_champion: {
    icon: Crown,
    color: '#FAB005',
    bgColor: '#FAB00520',
  },

  // ============================================
  // COMMUNITY BADGES
  // ============================================

  community_profile_complete: {
    icon: BadgeCheck,
    color: '#4DABF7',
    bgColor: '#4DABF720',
  },
  community_first_referral: {
    icon: UserPlus,
    color: '#69DB7C',
    bgColor: '#69DB7C20',
  },
  community_network_builder: {
    icon: Network,
    color: '#9775FA',
    bgColor: '#9775FA20',
  },
  community_helpful_mentor: {
    icon: GraduationCap,
    color: '#38D9A9',
    bgColor: '#38D9A920',
  },
  community_constructive_voice: {
    icon: Shield,
    color: '#74C0FC',
    bgColor: '#74C0FC20',
  },
  community_pillar: {
    icon: Building,
    color: '#845EF7',
    bgColor: '#845EF720',
  },
  community_trending_reviewer: {
    icon: TrendingUp,
    color: '#FF6B6B',
    bgColor: '#FF6B6B20',
  },
  community_weekly_champion: {
    icon: Trophy,
    color: '#FFD43B',
    bgColor: '#FFD43B20',
  },

  // ============================================
  // MILESTONE BADGES
  // ============================================

  milestone_first_review: {
    icon: Footprints,
    color: '#69DB7C',
    bgColor: '#69DB7C20',
  },
  milestone_10_reviews: {
    icon: Rocket,
    color: '#4DABF7',
    bgColor: '#4DABF720',
  },
  milestone_25_reviews: {
    icon: Star,
    color: '#74C0FC',
    bgColor: '#74C0FC20',
  },
  milestone_50_reviews: {
    icon: Medal,
    color: '#9775FA',
    bgColor: '#9775FA20',
  },
  milestone_100_reviews: {
    icon: Trophy,
    color: '#F59F00',
    bgColor: '#F59F0020',
  },
  milestone_200_reviews: {
    icon: Award,
    color: '#FF922B',
    bgColor: '#FF922B20',
  },
  milestone_500_reviews: {
    icon: Crown,
    color: '#FAB005',
    bgColor: '#FAB00520',
  },
  milestone_1000_reviews: {
    icon: Gem,
    color: '#E64980',
    bgColor: '#E6498020',
  },
  milestone_karma_king: {
    icon: Sparkles,
    color: '#9775FA',
    bgColor: '#9775FA20',
  },
  milestone_xp_master: {
    icon: Sparkles,
    color: '#20C997',
    bgColor: '#20C99720',
  },

  // ============================================
  // QUALITY BADGES
  // ============================================

  quality_helpful_10: {
    icon: Heart,
    color: '#FF6B6B',
    bgColor: '#FF6B6B20',
  },
  quality_helpful_50: {
    icon: Heart,
    color: '#F03E3E',
    bgColor: '#F03E3E20',
  },
  quality_helpful_100: {
    icon: Heart,
    color: '#C92A2A',
    bgColor: '#C92A2A20',
  },
  quality_acceptance_90: {
    icon: ThumbsUp,
    color: '#69DB7C',
    bgColor: '#69DB7C20',
  },
  quality_perfectionist: {
    icon: BadgeCheck,
    color: '#38D9A9',
    bgColor: '#38D9A920',
  },
  quality_zero_rejections: {
    icon: CheckCircle2,
    color: '#20C997',
    bgColor: '#20C99720',
  },
  quality_detail_master: {
    icon: Target,
    color: '#9775FA',
    bgColor: '#9775FA20',
  },
  quality_speed_demon: {
    icon: Clock,
    color: '#4DABF7',
    bgColor: '#4DABF720',
  },

  // ============================================
  // STREAK BADGES
  // ============================================

  streak_7_days: {
    icon: Flame,
    color: '#FF922B',
    bgColor: '#FF922B20',
  },
  streak_14_days: {
    icon: Flame,
    color: '#FD7E14',
    bgColor: '#FD7E1420',
  },
  streak_30_days: {
    icon: Flame,
    color: '#F76707',
    bgColor: '#F7670720',
  },
  streak_60_days: {
    icon: Flame,
    color: '#E8590C',
    bgColor: '#E8590C20',
  },
  streak_100_days: {
    icon: Flame,
    color: '#D9480F',
    bgColor: '#D9480F20',
  },
  streak_weekend_warrior: {
    icon: CalendarDays,
    color: '#845EF7',
    bgColor: '#845EF720',
  },

  // ============================================
  // SPECIAL BADGES
  // ============================================

  special_early_adopter: {
    icon: Gift,
    color: '#9775FA',
    bgColor: '#9775FA20',
  },
  special_community_helper: {
    icon: Users,
    color: '#4DABF7',
    bgColor: '#4DABF720',
  },
  special_bug_hunter: {
    icon: Bug,
    color: '#FF6B6B',
    bgColor: '#FF6B6B20',
  },
  special_feature_pioneer: {
    icon: Lightbulb,
    color: '#FFD43B',
    bgColor: '#FFD43B20',
  },
  special_holiday_hero: {
    icon: PartyPopper,
    color: '#F783AC',
    bgColor: '#F783AC20',
  },
  special_new_year_reviewer: {
    icon: Sparkles,
    color: '#FAB005',
    bgColor: '#FAB00520',
  },
  special_anniversary: {
    icon: Cake,
    color: '#E64980',
    bgColor: '#E6498020',
  },
  special_og_status: {
    icon: History,
    color: '#845EF7',
    bgColor: '#845EF720',
  },
};

/**
 * Get badge icon config, with fallback for unknown badges
 */
export function getBadgeIconConfig(badgeCode: string): BadgeIconConfig {
  return BADGE_ICONS[badgeCode] || {
    icon: Award,
    color: '#868E96',
    bgColor: '#868E9620',
  };
}
