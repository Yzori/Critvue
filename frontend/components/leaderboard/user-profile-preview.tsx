'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { UserProfilePreview as UserProfilePreviewType } from '@/lib/types/leaderboard';
import { TIER_CONFIG } from '@/lib/types/tier';
import { BadgeIcon } from '@/components/karma/badge-icon';
import {
  Star,
  MessageSquare,
  Clock,
  Calendar,
  ExternalLink,
  Send,
} from 'lucide-react';

interface UserProfilePreviewProps {
  user: UserProfilePreviewType | null;
  isLoading?: boolean;
  onRequestReview?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  children: React.ReactNode;
  className?: string;
}

// Mini Radar Chart for DNA scores
function MiniDnaRadar({
  scores,
  size = 80,
}: {
  scores: UserProfilePreviewType['dna'];
  size?: number;
}) {
  const categories = [
    { key: 'speed', label: 'Speed' },
    { key: 'depth', label: 'Depth' },
    { key: 'quality', label: 'Quality' },
    { key: 'communication', label: 'Comm' },
    { key: 'expertise', label: 'Expert' },
  ] as const;

  const center = size / 2;
  const radius = size / 2 - 10;
  const angleStep = (2 * Math.PI) / categories.length;

  // Calculate points for the filled area
  const points = categories.map((cat, i) => {
    const value = scores[cat.key] / 100;
    const angle = i * angleStep - Math.PI / 2;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return `${x},${y}`;
  });

  // Background grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map((level) => ({
    r: radius * level,
  }));

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid circles */}
      {gridCircles.map((circle, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={circle.r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      {/* Grid lines */}
      {categories.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x2}
            y2={y2}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {/* Filled area */}
      <polygon
        points={points.join(' ')}
        fill="rgba(249, 115, 22, 0.2)"
        stroke="#f97316"
        strokeWidth="2"
      />

      {/* Data points */}
      {categories.map((cat, i) => {
        const value = scores[cat.key] / 100;
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * value * Math.cos(angle);
        const y = center + radius * value * Math.sin(angle);
        return (
          <circle
            key={cat.key}
            cx={x}
            cy={y}
            r="3"
            fill="#f97316"
          />
        );
      })}
    </svg>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function PreviewContent({
  user,
  isLoading,
  onRequestReview,
  onViewProfile,
}: {
  user: UserProfilePreviewType | null;
  isLoading?: boolean;
  onRequestReview?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="w-72 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tierInfo = TIER_CONFIG[user.tier];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-72"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="rounded-full p-0.5"
          style={{
            background: `linear-gradient(135deg, ${tierInfo.color}, ${tierInfo.color}80)`,
          }}
        >
          <Avatar className="h-12 w-12 border-2 border-white">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ backgroundColor: tierInfo.color }}
            >
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {user.displayName}
          </p>
          <p className="text-sm text-gray-500">@{user.username}</p>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-1"
            style={{
              backgroundColor: `${tierInfo.color}15`,
              color: tierInfo.color,
            }}
          >
            {tierInfo.icon} {tierInfo.name}
          </span>
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {user.bio}
        </p>
      )}

      {/* DNA Radar */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-xs font-medium text-gray-500 mb-2 text-center">
          Reviewer DNA
        </p>
        <MiniDnaRadar scores={user.dna} size={80} />
        <div className="grid grid-cols-5 gap-1 text-center mt-2">
          {[
            { key: 'speed', label: 'Spd' },
            { key: 'depth', label: 'Dpt' },
            { key: 'quality', label: 'Qty' },
            { key: 'communication', label: 'Com' },
            { key: 'expertise', label: 'Exp' },
          ].map(({ key, label }) => (
            <div key={key} className="text-[10px] text-gray-500">
              <div className="font-medium text-gray-700">
                {user.dna[key as keyof typeof user.dna]}
              </div>
              <div>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-center">
        <div>
          <div className="flex items-center justify-center gap-0.5 text-gray-700 font-semibold text-sm">
            <MessageSquare className="h-3 w-3 text-blue-400" />
            {user.stats.reviews}
          </div>
          <div className="text-[10px] text-gray-500">Reviews</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-0.5 text-gray-700 font-semibold text-sm">
            <Star className="h-3 w-3 text-amber-400" />
            {user.stats.rating.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500">Rating</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-0.5 text-gray-700 font-semibold text-sm">
            <Clock className="h-3 w-3 text-green-400" />
            {user.stats.responseTime}
          </div>
          <div className="text-[10px] text-gray-500">Response</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-0.5 text-gray-700 font-semibold text-sm">
            <Calendar className="h-3 w-3 text-purple-400" />
            {user.stats.memberSince}
          </div>
          <div className="text-[10px] text-gray-500">Joined</div>
        </div>
      </div>

      {/* Badges & Skills */}
      <div className="flex items-center justify-between mb-4">
        {user.featuredBadges.length > 0 && (
          <div className="flex items-center gap-1">
            {user.featuredBadges.slice(0, 3).map((badge) => (
              <BadgeIcon
                key={badge.badge_code}
                badgeCode={badge.badge_code}
                rarity={badge.rarity}
                earned={true}
                size="sm"
              />
            ))}
          </div>
        )}
        {user.topSkills.length > 0 && (
          <div className="flex items-center gap-1">
            {user.topSkills.slice(0, 2).map((skill) => (
              <span
                key={skill}
                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onRequestReview && (
          <Button
            size="sm"
            className="flex-1 gap-1"
            onClick={() => onRequestReview(user.id)}
          >
            <Send className="h-3 w-3" />
            Request Review
          </Button>
        )}
        {onViewProfile && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => onViewProfile(user.id)}
          >
            <ExternalLink className="h-3 w-3" />
            Profile
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function UserProfilePreviewPopover({
  user,
  isLoading,
  onRequestReview,
  onViewProfile,
  children,
  className,
}: UserProfilePreviewProps) {
  return (
    <Popover>
      <PopoverTrigger asChild className={className}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="p-3 w-auto"
        side="right"
        align="start"
        sideOffset={8}
      >
        <PreviewContent
          user={user}
          isLoading={isLoading}
          onRequestReview={onRequestReview}
          onViewProfile={onViewProfile}
        />
      </PopoverContent>
    </Popover>
  );
}

export default UserProfilePreviewPopover;
