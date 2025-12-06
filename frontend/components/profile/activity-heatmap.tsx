'use client';

/**
 * Activity Heatmap Component
 *
 * GitHub-style contribution graph with dual-track display
 * showing activity as both Creator and Reviewer.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Flame, Calendar, TrendingUp } from 'lucide-react';

export interface DayActivity {
  date: string;           // ISO date string
  reviewsGiven: number;
  reviewsReceived: number;
  challengeEntries: number;
  challengeVotes: number;
  reviewRequestsCreated: number;
  total: number;
}

export interface ActivityHeatmapProps {
  data: DayActivity[];
  currentStreak?: number;
  longestStreak?: number;
  totalContributions?: number;
  view?: 'combined' | 'split';
  className?: string;
}

// Generate months for labels with their actual week positions
const getMonthLabels = (startDate: Date) => {
  const months: { label: string; weekIndex: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate start of grid (aligned to start day)
  const gridStart = new Date(startDate);
  const startDay = gridStart.getDay();
  gridStart.setDate(gridStart.getDate() - startDay); // Go back to Sunday

  let currentMonth = -1;
  let weekIndex = 0;
  const currentDate = new Date(gridStart);

  while (currentDate <= today) {
    const month = currentDate.getMonth();

    // Check if this is a new month and it's on or after the first day of the grid
    if (month !== currentMonth && currentDate >= startDate) {
      currentMonth = month;
      months.push({
        label: currentDate.toLocaleDateString('en-US', { month: 'short' }),
        weekIndex: weekIndex,
      });
    }

    // Move to next week (next Sunday)
    currentDate.setDate(currentDate.getDate() + 7);
    weekIndex++;
  }

  return months;
};

// Get day labels
const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

// Color scales
const colorScale = {
  combined: [
    'bg-muted',         // 0
    'bg-blue-200 dark:bg-blue-900',      // 1-2
    'bg-blue-400 dark:bg-blue-700',      // 3-4
    'bg-blue-600 dark:bg-blue-500',      // 5-7
    'bg-blue-800 dark:bg-blue-400',      // 8+
  ],
  creator: [
    'bg-muted',
    'bg-green-200 dark:bg-green-900',
    'bg-green-400 dark:bg-green-700',
    'bg-green-600 dark:bg-green-500',
    'bg-green-800 dark:bg-green-400',
  ],
  reviewer: [
    'bg-muted',
    'bg-purple-200 dark:bg-purple-900',
    'bg-purple-400 dark:bg-purple-700',
    'bg-purple-600 dark:bg-purple-500',
    'bg-purple-800 dark:bg-purple-400',
  ],
};

const getColorIndex = (count: number): number => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
};

export function ActivityHeatmap({
  data,
  currentStreak = 0,
  longestStreak = 0,
  totalContributions = 0,
  view = 'combined',
  className,
}: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = React.useState<DayActivity | null>(null);
  const [hoverPosition, setHoverPosition] = React.useState({ x: 0, y: 0 });
  const [activeView, setActiveView] = React.useState(view);

  // Calculate start date for the grid
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const startDate = React.useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 364);
    return d;
  }, [today]);

  // Generate grid data for past 365 days
  const generateGridData = React.useCallback(() => {
    const grid: (DayActivity | null)[][] = Array(7).fill(null).map(() => []);

    // Pad to start on Sunday
    const startDay = startDate.getDay();
    for (let i = 0; i < startDay; i++) {
      grid[i]?.push(null);
    }

    // Fill in all days
    const dataMap = new Map(data.map(d => [d.date, d]));
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0] ?? '';
      const dayOfWeek = currentDate.getDay();
      const existingData = dataMap.get(dateStr);
      const dayData: DayActivity = existingData ?? {
        date: dateStr,
        reviewsGiven: 0,
        reviewsReceived: 0,
        challengeEntries: 0,
        challengeVotes: 0,
        reviewRequestsCreated: 0,
        total: 0,
      };
      grid[dayOfWeek]?.push(dayData);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return grid;
  }, [data, startDate, today]);

  const gridData = generateGridData();
  const months = React.useMemo(() => getMonthLabels(startDate), [startDate]);

  const handleDayHover = (day: DayActivity | null, e: React.MouseEvent) => {
    if (day) {
      setHoveredDay(day);
      setHoverPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredDay(null);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with stats and toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Flame className="size-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{currentStreak}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Day Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <TrendingUp className="size-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{longestStreak}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Best Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Calendar className="size-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{totalContributions}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">This Year</p>
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          <button
            onClick={() => setActiveView('combined')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              activeView === 'combined'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Combined
          </button>
          <button
            onClick={() => setActiveView('split')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              activeView === 'split'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Split View
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <AnimatePresence mode="wait">
          {activeView === 'combined' ? (
            <motion.div
              key="combined"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HeatmapGrid
                gridData={gridData}
                months={months}
                colorScale={colorScale.combined}
                onDayHover={handleDayHover}
                label="All Activity"
              />
            </motion.div>
          ) : (
            <motion.div
              key="split"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <HeatmapGrid
                gridData={gridData}
                months={months}
                colorScale={colorScale.creator}
                onDayHover={handleDayHover}
                label="As Creator"
                valueKey="reviewsReceived"
              />
              <HeatmapGrid
                gridData={gridData}
                months={months}
                colorScale={colorScale.reviewer}
                onDayHover={handleDayHover}
                label="As Reviewer"
                valueKey="reviewsGiven"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {(activeView === 'combined' ? colorScale.combined : colorScale.reviewer).map((color, i) => (
            <div key={i} className={cn('size-3 rounded-sm', color)} />
          ))}
        </div>
        <span>More</span>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: hoverPosition.x + 10,
              top: hoverPosition.y - 60,
            }}
          >
            <div className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs shadow-xl">
              <p className="font-semibold mb-1">
                {new Date(hoveredDay.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <div className="space-y-0.5 text-gray-300">
                {hoveredDay.reviewsGiven > 0 && <p>{hoveredDay.reviewsGiven} reviews given</p>}
                {hoveredDay.reviewsReceived > 0 && <p>{hoveredDay.reviewsReceived} reviews received</p>}
                {hoveredDay.challengeEntries > 0 && <p>{hoveredDay.challengeEntries} challenge submissions</p>}
                {hoveredDay.challengeVotes > 0 && <p>{hoveredDay.challengeVotes} challenge votes</p>}
                {hoveredDay.reviewRequestsCreated > 0 && <p>{hoveredDay.reviewRequestsCreated} review requests</p>}
                {hoveredDay.total === 0 && <p>No activity</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Heatmap Grid Sub-component
 */
function HeatmapGrid({
  gridData,
  months,
  colorScale,
  onDayHover,
  label,
  valueKey = 'total',
}: {
  gridData: (DayActivity | null)[][];
  months: { label: string; weekIndex: number }[];
  colorScale: string[];
  onDayHover: (day: DayActivity | null, e: React.MouseEvent) => void;
  label: string;
  valueKey?: keyof DayActivity;
}) {
  // Cell size + gap = 14px per week column
  const cellSize = 11;
  const gap = 3;
  const weekWidth = cellSize + gap;

  return (
    <div>
      {/* Label */}
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>

      <div className="inline-flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pr-2">
          {dayLabels.map((dayLabel, i) => (
            <div key={i} className="h-[11px] text-[10px] text-muted-foreground/70 leading-[11px]">
              {dayLabel}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div>
          {/* Month labels - positioned based on weekIndex */}
          <div className="relative h-4 mb-1">
            {months.map((month, i) => (
              <div
                key={i}
                className="absolute text-[10px] text-muted-foreground/70"
                style={{ left: `${month.weekIndex * weekWidth}px` }}
              >
                {month.label}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex flex-col gap-[3px]">
            {gridData.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-[3px]">
                {row.map((day, colIndex) => {
                  if (!day) {
                    return <div key={colIndex} className="size-[11px]" />;
                  }

                  const value = valueKey === 'total'
                    ? day.total
                    : (day[valueKey] as number);
                  const colorIndex = getColorIndex(value);

                  return (
                    <motion.div
                      key={colIndex}
                      className={cn(
                        'size-[11px] rounded-sm cursor-pointer transition-all',
                        colorScale[colorIndex],
                        'hover:ring-2 hover:ring-border hover:ring-offset-1 hover:ring-offset-background'
                      )}
                      onMouseEnter={(e) => onDayHover(day, e)}
                      onMouseLeave={() => onDayHover(null, {} as React.MouseEvent)}
                      whileHover={{ scale: 1.3 }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact streak display
 */
export function StreakDisplay({
  currentStreak,
  longestStreak,
  className,
}: {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-2">
        <Flame className={cn(
          'size-5',
          currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground/50'
        )} />
        <div>
          <p className="text-lg font-bold text-foreground">{currentStreak}</p>
          <p className="text-[10px] text-muted-foreground">Current</p>
        </div>
      </div>
      <div className="w-px h-8 bg-border" />
      <div>
        <p className="text-lg font-bold text-foreground">{longestStreak}</p>
        <p className="text-[10px] text-muted-foreground">Best</p>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
