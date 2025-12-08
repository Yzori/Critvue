'use client';

import * as React from 'react';
import { BadgeIcon } from '@/components/karma/badge-icon';
import { TierBadge } from '@/components/tier/tier-badge';
import { UserTier, MasterTierType } from '@/lib/types/tier';
import type { BadgeRarity } from '@/lib/api/karma';

/**
 * Badge Preview Page
 *
 * Shows all 75 badges organized by category for visual review.
 * Access at: /badges/preview
 */

// Badge definitions with metadata for preview
const BADGE_PREVIEW_DATA: {
  code: string;
  name: string;
  rarity: BadgeRarity;
  category: string;
}[] = [
  // ============================================
  // SKILL BADGES - Development
  // ============================================
  { code: 'skill_react_apprentice', name: 'React Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_react_expert', name: 'React Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_typescript_apprentice', name: 'TypeScript Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_typescript_expert', name: 'TypeScript Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_python_apprentice', name: 'Python Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_python_expert', name: 'Python Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_vue_apprentice', name: 'Vue.js Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_vue_expert', name: 'Vue.js Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_angular_apprentice', name: 'Angular Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_angular_expert', name: 'Angular Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_nodejs_apprentice', name: 'Node.js Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_nodejs_expert', name: 'Node.js Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_go_apprentice', name: 'Go Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_go_expert', name: 'Go Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_rust_apprentice', name: 'Rust Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_rust_expert', name: 'Rust Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_swift_apprentice', name: 'Swift/iOS Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_swift_expert', name: 'Swift/iOS Expert', rarity: 'rare', category: 'Skill - Dev' },
  { code: 'skill_kotlin_apprentice', name: 'Kotlin/Android Apprentice', rarity: 'common', category: 'Skill - Dev' },
  { code: 'skill_kotlin_expert', name: 'Kotlin/Android Expert', rarity: 'rare', category: 'Skill - Dev' },

  // ============================================
  // SKILL BADGES - Design
  // ============================================
  { code: 'skill_design_apprentice', name: 'Design Apprentice', rarity: 'common', category: 'Skill - Design' },
  { code: 'skill_design_expert', name: 'Design Expert', rarity: 'rare', category: 'Skill - Design' },
  { code: 'skill_ui_apprentice', name: 'UI Design Apprentice', rarity: 'common', category: 'Skill - Design' },
  { code: 'skill_ui_expert', name: 'UI Design Expert', rarity: 'rare', category: 'Skill - Design' },
  { code: 'skill_ux_apprentice', name: 'UX Design Apprentice', rarity: 'common', category: 'Skill - Design' },
  { code: 'skill_ux_expert', name: 'UX Design Expert', rarity: 'rare', category: 'Skill - Design' },
  { code: 'skill_brand_apprentice', name: 'Branding Apprentice', rarity: 'common', category: 'Skill - Design' },
  { code: 'skill_brand_expert', name: 'Branding Expert', rarity: 'rare', category: 'Skill - Design' },
  { code: 'skill_illustration_apprentice', name: 'Illustration Apprentice', rarity: 'common', category: 'Skill - Design' },
  { code: 'skill_illustration_expert', name: 'Illustration Expert', rarity: 'rare', category: 'Skill - Design' },

  // ============================================
  // SKILL BADGES - Content
  // ============================================
  { code: 'skill_writing_apprentice', name: 'Writing Apprentice', rarity: 'common', category: 'Skill - Content' },
  { code: 'skill_writing_expert', name: 'Writing Expert', rarity: 'rare', category: 'Skill - Content' },
  { code: 'skill_video_apprentice', name: 'Video Apprentice', rarity: 'common', category: 'Skill - Content' },
  { code: 'skill_video_expert', name: 'Video Expert', rarity: 'rare', category: 'Skill - Content' },
  { code: 'skill_audio_apprentice', name: 'Audio Apprentice', rarity: 'common', category: 'Skill - Content' },
  { code: 'skill_audio_expert', name: 'Audio Expert', rarity: 'rare', category: 'Skill - Content' },

  // ============================================
  // CREATOR BADGES
  // ============================================
  { code: 'creator_first_request', name: 'First Request', rarity: 'common', category: 'Creator' },
  { code: 'creator_feedback_seeker', name: 'Feedback Seeker', rarity: 'common', category: 'Creator' },
  { code: 'creator_improvement_driven', name: 'Improvement Driven', rarity: 'uncommon', category: 'Creator' },
  { code: 'creator_quality_patron', name: 'Quality Patron', rarity: 'uncommon', category: 'Creator' },
  { code: 'creator_generous_rater', name: 'Generous Rater', rarity: 'common', category: 'Creator' },
  { code: 'creator_detailed_requester', name: 'Detailed Requester', rarity: 'common', category: 'Creator' },
  { code: 'creator_quick_responder', name: 'Quick Responder', rarity: 'uncommon', category: 'Creator' },
  { code: 'creator_revision_master', name: 'Revision Master', rarity: 'rare', category: 'Creator' },
  { code: 'creator_portfolio_builder', name: 'Portfolio Builder', rarity: 'common', category: 'Creator' },
  { code: 'creator_critvue_champion', name: 'Critvue Champion', rarity: 'epic', category: 'Creator' },

  // ============================================
  // COMMUNITY BADGES
  // ============================================
  { code: 'community_profile_complete', name: 'Profile Complete', rarity: 'common', category: 'Community' },
  { code: 'community_first_referral', name: 'First Referral', rarity: 'uncommon', category: 'Community' },
  { code: 'community_network_builder', name: 'Network Builder', rarity: 'rare', category: 'Community' },
  { code: 'community_helpful_mentor', name: 'Helpful Mentor', rarity: 'rare', category: 'Community' },
  { code: 'community_constructive_voice', name: 'Constructive Voice', rarity: 'epic', category: 'Community' },
  { code: 'community_pillar', name: 'Community Pillar', rarity: 'epic', category: 'Community' },
  { code: 'community_trending_reviewer', name: 'Trending Reviewer', rarity: 'rare', category: 'Community' },
  { code: 'community_weekly_champion', name: 'Weekly Champion', rarity: 'legendary', category: 'Community' },

  // ============================================
  // MILESTONE BADGES
  // ============================================
  { code: 'milestone_first_review', name: 'First Steps', rarity: 'common', category: 'Milestone' },
  { code: 'milestone_10_reviews', name: 'Getting Started', rarity: 'common', category: 'Milestone' },
  { code: 'milestone_25_reviews', name: 'Quarter Century', rarity: 'common', category: 'Milestone' },
  { code: 'milestone_50_reviews', name: 'Dedicated Reviewer', rarity: 'uncommon', category: 'Milestone' },
  { code: 'milestone_100_reviews', name: 'Century Club', rarity: 'rare', category: 'Milestone' },
  { code: 'milestone_200_reviews', name: 'Double Century', rarity: 'rare', category: 'Milestone' },
  { code: 'milestone_500_reviews', name: 'Review Legend', rarity: 'epic', category: 'Milestone' },
  { code: 'milestone_1000_reviews', name: 'Thousand Club', rarity: 'legendary', category: 'Milestone' },
  { code: 'milestone_karma_king', name: 'Sparks King', rarity: 'epic', category: 'Milestone' },
  { code: 'milestone_xp_master', name: 'XP Master', rarity: 'legendary', category: 'Milestone' },

  // ============================================
  // QUALITY BADGES
  // ============================================
  { code: 'quality_helpful_10', name: 'Helpful Hand', rarity: 'uncommon', category: 'Quality' },
  { code: 'quality_helpful_50', name: 'Invaluable Reviewer', rarity: 'rare', category: 'Quality' },
  { code: 'quality_helpful_100', name: 'Five-Star Legend', rarity: 'epic', category: 'Quality' },
  { code: 'quality_acceptance_90', name: 'Trusted Voice', rarity: 'rare', category: 'Quality' },
  { code: 'quality_perfectionist', name: 'Perfectionist', rarity: 'epic', category: 'Quality' },
  { code: 'quality_zero_rejections', name: 'Zero Rejections', rarity: 'rare', category: 'Quality' },
  { code: 'quality_detail_master', name: 'Detail Master', rarity: 'rare', category: 'Quality' },
  { code: 'quality_speed_demon', name: 'Speed Demon', rarity: 'uncommon', category: 'Quality' },

  // ============================================
  // STREAK BADGES
  // ============================================
  { code: 'streak_7_days', name: 'Week Warrior', rarity: 'common', category: 'Streak' },
  { code: 'streak_14_days', name: 'Fortnight Fighter', rarity: 'uncommon', category: 'Streak' },
  { code: 'streak_30_days', name: 'Month Master', rarity: 'rare', category: 'Streak' },
  { code: 'streak_60_days', name: '60-Day Dynamo', rarity: 'epic', category: 'Streak' },
  { code: 'streak_100_days', name: 'Unstoppable', rarity: 'legendary', category: 'Streak' },
  { code: 'streak_weekend_warrior', name: 'Weekend Warrior', rarity: 'uncommon', category: 'Streak' },

  // ============================================
  // SPECIAL BADGES
  // ============================================
  { code: 'special_early_adopter', name: 'Early Adopter', rarity: 'epic', category: 'Special' },
  { code: 'special_community_helper', name: 'Community Helper', rarity: 'rare', category: 'Special' },
  { code: 'special_bug_hunter', name: 'Bug Hunter', rarity: 'rare', category: 'Special' },
  { code: 'special_feature_pioneer', name: 'Feature Pioneer', rarity: 'uncommon', category: 'Special' },
  { code: 'special_holiday_hero', name: 'Holiday Hero', rarity: 'uncommon', category: 'Special' },
  { code: 'special_new_year_reviewer', name: 'New Year Reviewer', rarity: 'rare', category: 'Special' },
  { code: 'special_anniversary', name: 'Anniversary Badge', rarity: 'rare', category: 'Special' },
  { code: 'special_og_status', name: 'OG Status', rarity: 'legendary', category: 'Special' },
];

// Group badges by category
const groupedBadges = BADGE_PREVIEW_DATA.reduce((acc, badge) => {
  if (!acc[badge.category]) {
    acc[badge.category] = [];
  }
  acc[badge.category]!.push(badge);
  return acc;
}, {} as Record<string, typeof BADGE_PREVIEW_DATA>);

// Rarity colors for legend
const RARITY_COLORS: Record<BadgeRarity, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  uncommon: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-400' },
  rare: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-400' },
  epic: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-400' },
  legendary: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-400' },
};

export default function BadgePreviewPage() {
  const [showEarned, setShowEarned] = React.useState(true);
  const [selectedRarity, setSelectedRarity] = React.useState<BadgeRarity | 'all'>('all');

  const filteredGroups = Object.entries(groupedBadges).map(([category, badges]) => ({
    category,
    badges: badges.filter(b => selectedRarity === 'all' || b.rarity === selectedRarity),
  })).filter(g => g.badges.length > 0);

  const totalCount = BADGE_PREVIEW_DATA.length;
  const rarityCounts = BADGE_PREVIEW_DATA.reduce((acc, b) => {
    acc[b.rarity] = (acc[b.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Badge System Preview
          </h1>
          <p className="text-gray-600">
            {totalCount} badges across {Object.keys(groupedBadges).length} categories
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Rarity Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedRarity('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    selectedRarity === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({totalCount})
                </button>
                {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as BadgeRarity[]).map(rarity => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full capitalize transition-colors border ${
                      selectedRarity === rarity
                        ? `${RARITY_COLORS[rarity].bg} ${RARITY_COLORS[rarity].text} ${RARITY_COLORS[rarity].border}`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
                    }`}
                  >
                    {rarity} ({rarityCounts[rarity] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Earned Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Show as:</span>
              <button
                onClick={() => setShowEarned(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  showEarned
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Earned
              </button>
              <button
                onClick={() => setShowEarned(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  !showEarned
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Locked
              </button>
            </div>
          </div>
        </div>

        {/* Tier Badges Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            User Tiers
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Progression tiers based on reviews completed, sparks earned, and acceptance rate
          </p>

          {/* All Tiers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            {[
              { tier: UserTier.NOVICE, label: '0 reviews' },
              { tier: UserTier.CONTRIBUTOR, label: '10+ reviews' },
              { tier: UserTier.SKILLED, label: '50+ reviews' },
              { tier: UserTier.TRUSTED_ADVISOR, label: '100+ reviews' },
              { tier: UserTier.EXPERT, label: '250+ reviews' },
              { tier: UserTier.MASTER, masterType: MasterTierType.COMMUNITY, label: '500+ reviews' },
              { tier: UserTier.MASTER, masterType: MasterTierType.CERTIFIED, label: 'Verified expert' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <TierBadge
                  tier={item.tier}
                  masterType={item.masterType}
                  size="lg"
                  showName={true}
                  showTooltip={true}
                />
                <span className="mt-2 text-xs text-gray-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Size Comparison for Tiers */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tier Badge Sizes</h3>
            <div className="flex items-center gap-6 flex-wrap">
              {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <TierBadge tier={UserTier.EXPERT} size={size} showTooltip={false} />
                  <span className="text-xs text-gray-500">{size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Badge Grid by Category */}
        <div className="space-y-8">
          {filteredGroups.map(({ category, badges }) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                {category}
                <span className="text-sm font-normal text-gray-500">
                  ({badges.length} badges)
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.code}
                    className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BadgeIcon
                      badgeCode={badge.code}
                      rarity={badge.rarity}
                      earned={showEarned}
                      size="lg"
                      showGlow={showEarned}
                    />
                    <span className="mt-2 text-xs font-medium text-gray-900 line-clamp-2">
                      {badge.name}
                    </span>
                    <span
                      className={`mt-1 text-[10px] px-2 py-0.5 rounded-full capitalize ${RARITY_COLORS[badge.rarity].bg} ${RARITY_COLORS[badge.rarity].text}`}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Size Comparison */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Size Comparison
          </h2>
          <div className="flex items-end gap-8 justify-center">
            {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
              <div key={size} className="flex flex-col items-center gap-2">
                <BadgeIcon
                  badgeCode="milestone_1000_reviews"
                  rarity="legendary"
                  earned={true}
                  size={size}
                  showGlow={true}
                />
                <span className="text-xs text-gray-500">{size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rarity Effects */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rarity Effects
          </h2>
          <div className="flex items-center gap-8 justify-center flex-wrap">
            {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as BadgeRarity[]).map(rarity => (
              <div key={rarity} className="flex flex-col items-center gap-2">
                <BadgeIcon
                  badgeCode="milestone_first_review"
                  rarity={rarity}
                  earned={true}
                  size="lg"
                  showGlow={true}
                />
                <span className={`text-xs capitalize ${RARITY_COLORS[rarity].text}`}>
                  {rarity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
