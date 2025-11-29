'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DiscoverySection, DiscoveryUser } from '@/lib/types/leaderboard';
import { DiscoveryCard } from './discovery-card';
import {
  TrendingUp,
  Zap,
  Clock,
  Sparkles,
  Users,
  ChevronRight,
} from 'lucide-react';

interface DiscoverySidebarProps {
  sections: DiscoverySection[];
  isLoading?: boolean;
  onUserClick?: (user: DiscoveryUser) => void;
  onSeeAll?: (section: DiscoverySection) => void;
  className?: string;
}

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  rising_stars: TrendingUp,
  skill_specialists: Zap,
  quick_responders: Clock,
  recommended: Sparkles,
  newcomers: Users,
};

const SECTION_COLORS: Record<string, string> = {
  rising_stars: 'text-green-500 bg-green-50',
  skill_specialists: 'text-purple-500 bg-purple-50',
  quick_responders: 'text-blue-500 bg-blue-50',
  recommended: 'text-amber-500 bg-amber-50',
  newcomers: 'text-pink-500 bg-pink-50',
};

function DiscoverySectionCard({
  section,
  onUserClick,
  onSeeAll,
}: {
  section: DiscoverySection;
  onUserClick?: (user: DiscoveryUser) => void;
  onSeeAll?: (section: DiscoverySection) => void;
}) {
  const Icon = SECTION_ICONS[section.type] || Users;
  const colors = SECTION_COLORS[section.type] || 'text-gray-500 bg-gray-50';
  const [iconBg, iconColor] = colors.split(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', iconBg)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              {section.title}
            </h3>
            {section.subtitle && (
              <p className="text-xs text-gray-500">{section.subtitle}</p>
            )}
          </div>
        </div>
        {onSeeAll && section.users.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => onSeeAll(section)}
          >
            See all
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {section.users.slice(0, 3).map((user) => (
          <DiscoveryCard
            key={user.id}
            user={user}
            onClick={onUserClick}
            compact
          />
        ))}
      </div>
    </motion.div>
  );
}

function SkeletonSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
        <div className="space-y-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function DiscoverySidebar({
  sections,
  isLoading,
  onUserClick,
  onSeeAll,
  className,
}: DiscoverySidebarProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-peach" />
            Discover Reviewers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SkeletonSection />
          <SkeletonSection />
        </CardContent>
      </Card>
    );
  }

  if (sections.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-peach" />
            Discover Reviewers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No discoveries yet</p>
            <p className="text-xs">Check back as the community grows!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-peach" />
          Discover Reviewers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section, index) => (
          <DiscoverySectionCard
            key={`${section.type}-${section.skill || index}`}
            section={section}
            onUserClick={onUserClick}
            onSeeAll={onSeeAll}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default DiscoverySidebar;
