'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Calendar,
  Users,
} from 'lucide-react';
import {
  type SeasonType,
  type LeaderboardCategory,
  type LeaderboardEntry,
  type UserRanking,
  type Season,
} from '@/lib/api/karma';

/**
 * Leaderboard Component
 *
 * Displays seasonal leaderboards with rankings by various categories.
 */

export interface LeaderboardProps {
  rankings?: LeaderboardEntry[];
  userRanking?: UserRanking | null;
  season?: Season | null;
  seasonType: SeasonType;
  category: LeaderboardCategory;
  isLoading?: boolean;
  onSeasonTypeChange?: (type: SeasonType) => void;
  onCategoryChange?: (category: LeaderboardCategory) => void;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  rankings = [],
  userRanking,
  season,
  seasonType,
  category,
  isLoading = false,
  onSeasonTypeChange,
  onCategoryChange,
  className,
}) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-muted rounded mb-1" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-6 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
            {season && (
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3" />
                {season.name}
              </CardDescription>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select
              value={seasonType}
              onValueChange={(v) => onSeasonTypeChange?.(v as SeasonType)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={category}
              onValueChange={(v) => onCategoryChange?.(v as LeaderboardCategory)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="helpful">Helpful</SelectItem>
                <SelectItem value="newcomer">Newcomer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User's own ranking */}
        {userRanking && (
          <div className="rounded-lg border-2 border-accent-blue bg-accent-blue/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-accent-blue">
                  #{userRanking.rank}
                </div>
                <div>
                  <p className="font-medium">Your Ranking</p>
                  <p className="text-sm text-muted-foreground">
                    Top {userRanking.percentile}% of {userRanking.total_participants.toLocaleString()} participants
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{userRanking.score.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </div>
        )}

        {/* Rankings list */}
        {rankings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No rankings yet</p>
            <p className="text-sm">Be the first to compete!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((entry, index) => (
              <LeaderboardRow
                key={entry.user_id}
                entry={entry}
                position={index + 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  position: number;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, position }) => {
  const getRankIcon = () => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 text-center text-sm font-medium text-muted-foreground">
            {position}
          </span>
        );
    }
  };

  const getRankBg = () => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-transparent border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-transparent border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-transparent border-amber-200';
      default:
        return 'hover:bg-muted/50';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        getRankBg()
      )}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">{getRankIcon()}</div>

      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatar_url || undefined} alt={entry.username} />
        <AvatarFallback className="bg-gradient-to-br from-accent-blue to-accent-peach text-white text-xs">
          {getInitials(entry.username)}
        </AvatarFallback>
      </Avatar>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{entry.username}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs capitalize">
            {entry.user_tier.replace('_', ' ')}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {entry.reviews_count} reviews
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <p className="font-bold">{entry.score.toLocaleString()}</p>
        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-green-500" />
          +{entry.karma_earned}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
