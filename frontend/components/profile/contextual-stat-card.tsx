'use client';

/**
 * Contextual Stat Card
 *
 * Stats that go beyond raw numbers with:
 * - Trend indicators and sparklines
 * - Percentile rankings
 * - Comparative context
 * - Animated count-up
 */

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: {
    value: number;      // percentage change
    direction: 'up' | 'down' | 'neutral';
    label?: string;     // "from last month"
  };
  percentile?: number;  // 0-100
  comparison?: string;  // "Faster than 78% of peers"
  sparklineData?: number[];
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function ContextualStatCard({
  label,
  value,
  suffix = '',
  prefix = '',
  icon,
  iconBg,
  trend,
  percentile,
  comparison,
  sparklineData,
  size = 'md',
  onClick,
  className,
}: StatCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = React.useState(0);

  // Animated count-up on mount
  React.useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: 'easeOut',
    });

    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  const sizeClasses = {
    sm: { container: 'p-4', icon: 'size-10', value: 'text-2xl', label: 'text-xs' },
    md: { container: 'p-5', icon: 'size-12', value: 'text-3xl', label: 'text-sm' },
    lg: { container: 'p-6', icon: 'size-14', value: 'text-4xl', label: 'text-base' },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl bg-white border border-gray-200/60 shadow-sm overflow-hidden cursor-pointer',
        'hover:shadow-lg hover:border-gray-300/60 transition-all duration-300',
        sizes.container,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Gradient background on hover */}
      <motion.div
        className={cn('absolute inset-0 opacity-0 transition-opacity', iconBg.replace('from-', 'bg-gradient-to-br from-').split(' ')[0] + '/5')}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Sparkline background */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
          <Sparkline data={sparklineData} color={iconBg.includes('blue') ? '#4CC9F0' : iconBg.includes('green') ? '#10B981' : iconBg.includes('amber') ? '#F59E0B' : '#8B5CF6'} />
        </div>
      )}

      <div className="relative">
        {/* Header: Icon + Trend */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            'rounded-xl flex items-center justify-center shadow-md',
            sizes.icon,
            iconBg
          )}>
            {icon}
          </div>

          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              trend.direction === 'up' && 'bg-green-100 text-green-700',
              trend.direction === 'down' && 'bg-red-100 text-red-700',
              trend.direction === 'neutral' && 'bg-gray-100 text-gray-600'
            )}>
              {trend.direction === 'up' && <ChevronUp className="size-3" />}
              {trend.direction === 'down' && <ChevronDown className="size-3" />}
              {trend.direction === 'neutral' && <Minus className="size-3" />}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-1">
          <span className={cn('font-black text-gray-900', sizes.value)}>
            {prefix}
            {displayValue}
            {suffix}
          </span>
        </div>

        {/* Label */}
        <p className={cn('font-semibold text-gray-600 uppercase tracking-wide mb-3', sizes.label)}>
          {label}
        </p>

        {/* Percentile bar */}
        {percentile !== undefined && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Percentile</span>
              <span className="font-semibold text-blue-600">Top {100 - percentile}%</span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentile}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              />
              {/* Marker */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 size-3 bg-white border-2 border-blue-500 rounded-full shadow-sm"
                initial={{ left: 0 }}
                animate={{ left: `calc(${percentile}% - 6px)` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Comparison text */}
        {comparison && (
          <p className="text-xs text-gray-500 mt-2">
            {comparison}
          </p>
        )}

        {/* Trend label */}
        {trend?.label && (
          <p className="text-xs text-gray-400 mt-1">
            {trend.label}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Sparkline Component
 */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sparkline-gradient-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Stat Card Grid - Bento Layout
 */
export function StatCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'grid grid-cols-2 lg:grid-cols-4 gap-4',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Mini Stat (for compact displays)
 */
export function MiniStat({
  label,
  value,
  suffix = '',
  icon,
  trend,
  className,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {icon && (
        <div className="size-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
          {icon}
        </div>
      )}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-gray-900">
            {value}{suffix}
          </span>
          {trend && (
            <>
              {trend === 'up' && <TrendingUp className="size-3.5 text-green-500" />}
              {trend === 'down' && <TrendingDown className="size-3.5 text-red-500" />}
              {trend === 'neutral' && <Minus className="size-3.5 text-gray-400" />}
            </>
          )}
        </div>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default ContextualStatCard;
