'use client';

/**
 * Reviewer DNA Radar Chart
 *
 * A unique visualization showing a reviewer's style as a distinctive "fingerprint".
 * Displays 6 key dimensions that make up their review personality.
 *
 * Dimensions:
 * - Speed: How quickly they complete reviews
 * - Depth: Average review length/thoroughness
 * - Specificity: Actionable suggestions per review
 * - Constructiveness: Balance of positive/constructive feedback
 * - Technical: Domain expertise accuracy
 * - Encouragement: Supportive language score
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ReviewerDNAData {
  speed: number;        // 0-100
  depth: number;        // 0-100
  specificity: number;  // 0-100
  constructiveness: number; // 0-100
  technical: number;    // 0-100
  encouragement: number; // 0-100
}

export interface ReviewerDNAProps {
  data: ReviewerDNAData;
  platformAverage?: ReviewerDNAData;
  showComparison?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

const dimensions = [
  { key: 'speed', label: 'Speed', description: 'Review turnaround time' },
  { key: 'depth', label: 'Depth', description: 'Thoroughness of feedback' },
  { key: 'specificity', label: 'Specificity', description: 'Actionable suggestions' },
  { key: 'constructiveness', label: 'Constructive', description: 'Balanced feedback tone' },
  { key: 'technical', label: 'Technical', description: 'Domain expertise' },
  { key: 'encouragement', label: 'Supportive', description: 'Encouraging language' },
] as const;

const sizeConfig = {
  sm: { size: 200, labelOffset: 20, fontSize: 10 },
  md: { size: 280, labelOffset: 28, fontSize: 11 },
  lg: { size: 360, labelOffset: 36, fontSize: 12 },
};

// Brand colors
const colors = {
  primary: '#4CC9F0',      // blue-500
  primaryLight: '#93C5FD', // blue-300
  secondary: '#8B5CF6',    // violet-500
  accent: '#F59E0B',       // amber-500
  muted: '#E5E7EB',        // gray-200
};

export function ReviewerDNA({
  data,
  platformAverage,
  showComparison = false,
  size = 'md',
  className,
  animated = true,
}: ReviewerDNAProps) {
  const [hoveredDimension, setHoveredDimension] = React.useState<string | null>(null);
  const config = sizeConfig[size];
  const center = config.size / 2;
  const maxRadius = center - config.labelOffset - 10;

  // Calculate points for the radar polygon
  const getPolygonPoints = (values: ReviewerDNAData, radius: number = maxRadius) => {
    return dimensions.map((dim, i) => {
      const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
      const value = values[dim.key as keyof ReviewerDNAData] / 100;
      const r = value * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    });
  };

  const userPoints = getPolygonPoints(data);
  const avgPoints = platformAverage ? getPolygonPoints(platformAverage) : null;

  // Generate path string
  const pointsToPath = (points: { x: number; y: number }[]) => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  // Generate grid circles
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className={cn('relative', className)}>
      <svg
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
        className="overflow-visible"
      >
        {/* Background gradient */}
        <defs>
          <radialGradient id="dna-bg-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.03" />
            <stop offset="100%" stopColor={colors.primary} stopOpacity="0.08" />
          </radialGradient>
          <linearGradient id="dna-fill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="dna-stroke-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={maxRadius + 5}
          fill="url(#dna-bg-gradient)"
        />

        {/* Grid circles */}
        {gridLevels.map((level, i) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={maxRadius * level}
            fill="none"
            stroke={colors.muted}
            strokeWidth={i === gridLevels.length - 1 ? 1.5 : 1}
            strokeDasharray={i === gridLevels.length - 1 ? 'none' : '4 4'}
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        {dimensions.map((_, i) => {
          const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
          const endX = center + maxRadius * Math.cos(angle);
          const endY = center + maxRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke={colors.muted}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        {/* Platform average polygon (if showing comparison) */}
        {showComparison && avgPoints && (
          <motion.path
            d={pointsToPath(avgPoints)}
            fill={colors.muted}
            fillOpacity={0.2}
            stroke={colors.muted}
            strokeWidth={2}
            strokeDasharray="6 4"
            initial={animated ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          />
        )}

        {/* User data polygon */}
        <motion.path
          d={pointsToPath(userPoints)}
          fill="url(#dna-fill-gradient)"
          stroke="url(#dna-stroke-gradient)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={animated ? {
            d: pointsToPath(dimensions.map(() => ({ x: center, y: center }))),
            opacity: 0
          } : undefined}
          animate={{
            d: pointsToPath(userPoints),
            opacity: 1
          }}
          transition={{
            duration: 1,
            ease: 'easeOut',
            delay: 0.2
          }}
        />

        {/* Data points */}
        {userPoints.map((point, i) => {
          const dim = dimensions[i];
          if (!dim) return null;
          return (
            <motion.circle
              key={dim.key}
              cx={point.x}
              cy={point.y}
              r={hoveredDimension === dim.key ? 6 : 4}
              fill="white"
              stroke={colors.primary}
              strokeWidth={2}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredDimension(dim.key)}
              onMouseLeave={() => setHoveredDimension(null)}
              initial={animated ? { scale: 0, opacity: 0 } : undefined}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: animated ? 0.8 + i * 0.1 : 0
              }}
            />
          );
        })}

        {/* Labels */}
        {dimensions.map((dim, i) => {
          const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
          const labelRadius = maxRadius + config.labelOffset;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);
          const value = data[dim.key as keyof ReviewerDNAData];
          const isHovered = hoveredDimension === dim.key;

          return (
            <g key={dim.key}>
              <motion.text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cn(
                  'font-semibold transition-all cursor-pointer select-none',
                  isHovered ? 'fill-blue-600' : 'fill-gray-600'
                )}
                fontSize={config.fontSize}
                onMouseEnter={() => setHoveredDimension(dim.key)}
                onMouseLeave={() => setHoveredDimension(null)}
                initial={animated ? { opacity: 0 } : undefined}
                animate={{ opacity: 1 }}
                transition={{ delay: animated ? 0.5 + i * 0.05 : 0 }}
              >
                {dim.label}
              </motion.text>
              {isHovered && (
                <motion.text
                  x={x}
                  y={y + config.fontSize + 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-blue-500 font-bold"
                  fontSize={config.fontSize + 2}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {value}%
                </motion.text>
              )}
            </g>
          );
        })}

        {/* Center score */}
        <motion.g
          initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: animated ? 1.2 : 0, duration: 0.3 }}
        >
          <circle
            cx={center}
            cy={center}
            r={28}
            fill="white"
            stroke={colors.primaryLight}
            strokeWidth={2}
          />
          <text
            x={center}
            y={center - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-900 font-black"
            fontSize={16}
          >
            {Math.round(
              Object.values(data).reduce((a, b) => a + b, 0) / 6
            )}
          </text>
          <text
            x={center}
            y={center + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-500 font-medium"
            fontSize={8}
          >
            OVERALL
          </text>
        </motion.g>
      </svg>

      {/* Tooltip for hovered dimension */}
      {hoveredDimension && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full z-10"
        >
          <div className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap shadow-lg">
            <div className="font-semibold">
              {dimensions.find(d => d.key === hoveredDimension)?.label}
            </div>
            <div className="text-gray-300">
              {dimensions.find(d => d.key === hoveredDimension)?.description}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Compact DNA Display for smaller spaces
 */
export function ReviewerDNACompact({
  data,
  className,
}: {
  data: ReviewerDNAData;
  className?: string;
}) {
  const avgScore = Math.round(Object.values(data).reduce((a, b) => a + b, 0) / 6);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative size-12">
        <svg viewBox="0 0 48 48" className="size-full">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="4"
          />
          <motion.circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="url(#compact-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(avgScore / 100) * 125.6} 125.6`}
            transform="rotate(-90 24 24)"
            initial={{ strokeDasharray: '0 125.6' }}
            animate={{ strokeDasharray: `${(avgScore / 100) * 125.6} 125.6` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="compact-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4CC9F0" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{avgScore}</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-900">Reviewer DNA</div>
        <div className="text-xs text-gray-500">Your unique style</div>
      </div>
    </div>
  );
}

export default ReviewerDNA;
