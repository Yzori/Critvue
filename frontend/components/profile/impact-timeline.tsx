'use client';

/**
 * Impact Timeline Component
 *
 * A chronological, visually rich timeline showing key profile moments,
 * achievements, and milestones with delightful animations.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Trophy,
  Star,
  TrendingUp,
  FileText,
  Zap,
  Clock,
  ChevronDown,
  Filter,
} from 'lucide-react';

export type TimelineEventType = 'review_given' | 'review_received' | 'badge_earned' | 'milestone' | 'rating' | 'streak';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;        // ISO date
  metadata?: {
    projectName?: string;
    rating?: number;
    badgeName?: string;
    milestoneValue?: number;
    streakDays?: number;
    quote?: string;
  };
}

export interface ImpactTimelineProps {
  events: TimelineEvent[];
  maxDisplay?: number;
  showFilters?: boolean;
  className?: string;
}

const eventConfig: Record<TimelineEventType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  review_given: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Review Given',
  },
  review_received: {
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Review Received',
  },
  badge_earned: {
    icon: Trophy,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Badge Earned',
  },
  milestone: {
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Milestone',
  },
  rating: {
    icon: Star,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    label: 'Rating',
  },
  streak: {
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Streak',
  },
};

const filterOptions: { value: TimelineEventType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Activity' },
  { value: 'review_given', label: 'Reviews' },
  { value: 'badge_earned', label: 'Badges' },
  { value: 'milestone', label: 'Milestones' },
  { value: 'rating', label: 'Ratings' },
];

export function ImpactTimeline({
  events,
  maxDisplay = 10,
  showFilters = true,
  className,
}: ImpactTimelineProps) {
  const [filter, setFilter] = React.useState<TimelineEventType | 'all'>('all');
  const [expanded, setExpanded] = React.useState(false);
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  // Filter and limit events
  const filteredEvents = events.filter(event =>
    filter === 'all' || event.type === filter
  );
  const displayEvents = expanded ? filteredEvents : filteredEvents.slice(0, maxDisplay);
  const hasMore = filteredEvents.length > maxDisplay;

  // Group events by date
  const groupedEvents = displayEvents.reduce((groups, event) => {
    const date = new Date(event.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with filters */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}
            >
              <Filter className="size-4" />
              {filterOptions.find(f => f.value === filter)?.label}
              <ChevronDown className={cn('size-4 transition-transform', showFilterMenu && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10"
                >
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilter(option.value);
                        setShowFilterMenu(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm transition-colors',
                        filter === option.value
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-gray-200" />

        {/* Events grouped by date */}
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dateEvents], groupIndex) => (
            <div key={date}>
              {/* Date header */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="flex items-center gap-3 mb-3"
              >
                <div className="size-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10">
                  <Clock className="size-4 text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-500">{date}</span>
              </motion.div>

              {/* Events for this date */}
              <div className="space-y-3 ml-5 pl-8 border-l-2 border-transparent">
                {dateEvents.map((event, eventIndex) => (
                  <TimelineEventCard
                    key={event.id}
                    event={event}
                    index={groupIndex * 10 + eventIndex}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="size-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="size-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No activity yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start reviewing to build your timeline
            </p>
          </motion.div>
        )}
      </div>

      {/* Load more button */}
      {hasMore && !expanded && (
        <motion.button
          onClick={() => setExpanded(true)}
          className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          View {filteredEvents.length - maxDisplay} more events
          <ChevronDown className="size-4" />
        </motion.button>
      )}
    </div>
  );
}

/**
 * Individual Timeline Event Card
 */
function TimelineEventCard({
  event,
  index,
  formatTime,
}: {
  event: TimelineEvent;
  index: number;
  formatTime: (timestamp: string) => string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = eventConfig[event.type];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'relative p-4 rounded-xl bg-white border border-gray-100 shadow-sm',
        'hover:shadow-md hover:border-gray-200 transition-all cursor-pointer'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Connection dot */}
      <div className={cn(
        'absolute -left-[41px] top-4 size-3 rounded-full border-2 border-white shadow-sm z-10',
        config.bgColor
      )} />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'size-10 rounded-xl flex items-center justify-center flex-shrink-0',
          config.bgColor
        )}>
          <IconComponent className={cn('size-5', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 text-sm leading-tight">
              {event.title}
            </h4>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTime(event.timestamp)}
            </span>
          </div>

          {event.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {event.metadata?.projectName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">
                <FileText className="size-3" />
                {event.metadata.projectName}
              </span>
            )}
            {event.metadata?.rating && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-xs text-amber-700">
                <Star className="size-3 fill-amber-400" />
                {event.metadata.rating.toFixed(1)}
              </span>
            )}
            {event.metadata?.milestoneValue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-xs text-purple-700">
                <TrendingUp className="size-3" />
                {event.metadata.milestoneValue} achieved
              </span>
            )}
            {event.metadata?.streakDays && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-xs text-orange-700">
                <Zap className="size-3" />
                {event.metadata.streakDays} day streak
              </span>
            )}
          </div>

          {/* Expandable quote */}
          <AnimatePresence>
            {isExpanded && event.metadata?.quote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-gray-100"
              >
                <p className="text-sm text-gray-600 italic">
                  "{event.metadata.quote}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Compact Timeline for smaller spaces
 */
export function CompactTimeline({
  events,
  maxDisplay = 5,
  className,
}: {
  events: TimelineEvent[];
  maxDisplay?: number;
  className?: string;
}) {
  const displayEvents = events.slice(0, maxDisplay);

  return (
    <div className={cn('space-y-2', className)}>
      {displayEvents.map((event, index) => {
        const config = eventConfig[event.type];
        const IconComponent = config.icon;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={cn(
              'size-8 rounded-lg flex items-center justify-center flex-shrink-0',
              config.bgColor
            )}>
              <IconComponent className={cn('size-4', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {event.title}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(event.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default ImpactTimeline;
