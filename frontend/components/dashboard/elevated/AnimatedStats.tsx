'use client';

/**
 * AnimatedStats - Count-up Animations and Trend Indicators
 *
 * Stats that come alive with smooth count-up animations,
 * sparklines, and meaningful trend indicators.
 *
 * Creates the feeling of data "arriving" rather than just being displayed.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  DollarSign,
  Star,
  Clock,
  FileText,
  CheckCircle2,
  Users,
} from 'lucide-react';

// Animated number with count-up effect
export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000,
  delay = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration / 1000,
  });

  const display = useTransform(spring, (current) =>
    current.toFixed(decimals)
  );

  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v);
    });
    return () => unsubscribe();
  }, [display]);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timer = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, value, delay, spring, hasAnimated]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {Number(displayValue).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

// Currency-specific animated number
export function AnimatedCurrency({
  value,
  currency = 'USD',
  duration = 1000,
  delay = 0,
  className,
}: {
  value: number;
  currency?: string;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <AnimatedNumber
      value={value}
      prefix={currency === 'USD' ? '$' : ''}
      decimals={value % 1 !== 0 ? 2 : 0}
      duration={duration}
      delay={delay}
      className={className}
    />
  );
}

// Trend indicator with animation
export function TrendIndicator({
  value,
  previousValue,
  format = 'percent',
  showLabel = true,
  size = 'md',
  className,
}: {
  value: number;
  previousValue: number;
  format?: 'percent' | 'absolute';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  if (previousValue === 0) return null;

  const change = value - previousValue;
  const percentChange = ((change / previousValue) * 100);
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const Icon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

  const sizeClasses = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
    lg: 'text-base gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'inline-flex items-center font-medium',
        sizeClasses[size],
        isNeutral
          ? 'text-muted-foreground'
          : isPositive
          ? 'text-emerald-600'
          : 'text-red-500',
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>
        {format === 'percent'
          ? `${Math.abs(percentChange).toFixed(1)}%`
          : Math.abs(change).toLocaleString()}
      </span>
      {showLabel && (
        <span className="text-muted-foreground font-normal">
          vs last period
        </span>
      )}
    </motion.div>
  );
}

// Mini sparkline chart
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'currentColor',
  showTrend = true,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showTrend?: boolean;
  className?: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const trend = data[data.length - 1] - data[0];
  const trendColor = trend >= 0 ? '#10B981' : '#EF4444';
  const finalColor = showTrend ? trendColor : color;

  return (
    <motion.svg
      width={width}
      height={height}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.polyline
        fill="none"
        stroke={finalColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {/* End dot */}
      <motion.circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={3}
        fill={finalColor}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8 }}
      />
    </motion.svg>
  );
}

// Stat card with animation
export interface StatCardData {
  label: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: React.ComponentType<{ className?: string }>;
  sparklineData?: number[];
  highlight?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'default';
}

export function AnimatedStatCard({
  data,
  delay = 0,
  className,
}: {
  data: StatCardData;
  delay?: number;
  className?: string;
}) {
  const Icon = data.icon || FileText;

  const colorClasses = {
    blue: {
      icon: 'text-blue-600 bg-blue-500/10',
      highlight: 'ring-2 ring-blue-500/30',
    },
    green: {
      icon: 'text-emerald-600 bg-emerald-500/10',
      highlight: 'ring-2 ring-emerald-500/30',
    },
    orange: {
      icon: 'text-orange-600 bg-orange-500/10',
      highlight: 'ring-2 ring-orange-500/30',
    },
    purple: {
      icon: 'text-violet-600 bg-violet-500/10',
      highlight: 'ring-2 ring-violet-500/30',
    },
    default: {
      icon: 'text-muted-foreground bg-muted',
      highlight: 'ring-2 ring-border',
    },
  };

  const colors = colorClasses[data.color || 'default'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        'relative p-5 rounded-2xl bg-card border border-border',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        data.highlight && colors.highlight,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground font-medium">
            {data.label}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              <AnimatedNumber
                value={data.value}
                prefix={data.prefix}
                suffix={data.suffix}
                decimals={data.decimals || 0}
                delay={delay * 1000 + 200}
              />
            </span>
          </div>
          {data.previousValue !== undefined && (
            <TrendIndicator
              value={data.value}
              previousValue={data.previousValue}
              size="sm"
              showLabel={false}
            />
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={cn('p-2.5 rounded-xl', colors.icon)}>
            <Icon className="w-5 h-5" />
          </div>
          {data.sparklineData && data.sparklineData.length > 1 && (
            <Sparkline data={data.sparklineData} width={60} height={20} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Grid of animated stat cards
export function AnimatedStatsGrid({
  stats,
  columns = 4,
  className,
}: {
  stats: StatCardData[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <AnimatedStatCard key={stat.label} data={stat} delay={index * 0.1} />
      ))}
    </div>
  );
}

// Earnings display with special animation
export function EarningsDisplay({
  today,
  week,
  month,
  goal,
  className,
}: {
  today: number;
  week: number;
  month: number;
  goal?: number;
  className?: string;
}) {
  const goalProgress = goal ? Math.min(100, (week / goal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5',
        'border border-emerald-500/20',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-emerald-500/10">
          <DollarSign className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-foreground">Your Earnings</h3>
      </div>

      <div className="space-y-4">
        {/* Primary stat - This week */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">This week</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-600">
              <AnimatedCurrency value={week} duration={1200} />
            </span>
            {goal && (
              <span className="text-sm text-muted-foreground">
                / ${goal} goal
              </span>
            )}
          </div>
          {goal && (
            <div className="mt-2">
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${goalProgress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200/60">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Today</p>
            <p className="text-lg font-semibold text-foreground">
              <AnimatedCurrency value={today} delay={300} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">This month</p>
            <p className="text-lg font-semibold text-foreground">
              <AnimatedCurrency value={month} delay={400} />
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Compact stat row for mobile
export function CompactStatRow({
  stats,
  className,
}: {
  stats: Array<{
    label: string;
    value: number | string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-xl',
        'bg-muted/50 border border-border/50',
        className
      )}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <React.Fragment key={stat.label}>
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-semibold text-foreground">
                  {typeof stat.value === 'number' ? (
                    <AnimatedNumber value={stat.value} delay={index * 100} />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            </div>
            {index < stats.length - 1 && (
              <div className="w-px h-8 bg-border" />
            )}
          </React.Fragment>
        );
      })}
    </motion.div>
  );
}

// Streak counter with flame animation
export function StreakCounter({
  streak,
  atRisk = false,
  className,
}: {
  streak: number;
  atRisk?: boolean;
  className?: string;
}) {
  if (streak === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        atRisk
          ? 'bg-amber-50 border border-amber-200 text-amber-700'
          : 'bg-orange-50 border border-orange-200 text-orange-700',
        className
      )}
    >
      <motion.div
        animate={atRisk ? { scale: [1, 1.2, 1] } : { rotate: [0, -5, 5, 0] }}
        transition={{
          duration: atRisk ? 0.5 : 1,
          repeat: Infinity,
          repeatDelay: atRisk ? 0.5 : 2,
        }}
      >
        <Sparkles className={cn('w-4 h-4', atRisk ? 'text-amber-500' : 'text-orange-500')} />
      </motion.div>
      <span className="font-bold tabular-nums">
        <AnimatedNumber value={streak} />
      </span>
      <span className="text-sm">day streak</span>
      {atRisk && (
        <motion.span
          className="text-xs bg-amber-200 px-1.5 py-0.5 rounded-full"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          at risk!
        </motion.span>
      )}
    </motion.div>
  );
}

export default AnimatedStatCard;
