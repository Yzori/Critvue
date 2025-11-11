"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Sparkline Component - Minimal Trend Visualization
 *
 * Modern 2025 Design Pattern
 * Features:
 * - Lightweight SVG-based trend visualization
 * - Smooth bezier curve rendering
 * - Responsive to container size
 * - Color customization
 * - Optional gradient fill
 * - Optimized for stat cards
 */

export interface SparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of numeric data points to visualize
   */
  data: number[];
  /**
   * Width of the sparkline (default: 100%)
   */
  width?: number | string;
  /**
   * Height of the sparkline (default: 40px)
   */
  height?: number;
  /**
   * Stroke color (CSS color value)
   */
  color?: string;
  /**
   * Stroke width
   */
  strokeWidth?: number;
  /**
   * Show gradient fill under the line
   */
  showGradient?: boolean;
  /**
   * Smooth curve interpolation (default: true)
   */
  smooth?: boolean;
}

const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  ({
    data,
    width = "100%",
    height = 40,
    color = "currentColor",
    strokeWidth = 2,
    showGradient = false,
    smooth = true,
    className,
    ...props
  }, ref) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [path, setPath] = React.useState("");
    const [fillPath, setFillPath] = React.useState("");
    const gradientId = React.useId();

    React.useEffect(() => {
      if (!data || data.length < 2) {
        setPath("");
        setFillPath("");
        return;
      }

      // Normalize data to 0-1 range
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;

      const normalized = data.map((value) => (value - min) / range);

      // Calculate points
      const padding = strokeWidth * 2;
      const effectiveHeight = height - padding * 2;
      const stepX = 100 / (data.length - 1);

      const points = normalized.map((value, index) => ({
        x: index * stepX,
        y: padding + effectiveHeight * (1 - value),
      }));

      // Generate path
      let pathData: string;

      if (smooth && data.length > 2) {
        // Smooth bezier curve
        pathData = points.reduce((acc, point, i) => {
          if (i === 0) {
            return `M ${point.x} ${point.y}`;
          }

          const prev = points[i - 1];
          if (!prev) return acc;

          const controlX1 = prev.x + (point.x - prev.x) / 3;
          const controlY1 = prev.y;
          const controlX2 = prev.x + (2 * (point.x - prev.x)) / 3;
          const controlY2 = point.y;

          return `${acc} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${point.x} ${point.y}`;
        }, "");
      } else {
        // Linear path
        pathData = points.reduce((acc, point, i) => {
          if (i === 0) {
            return `M ${point.x} ${point.y}`;
          }
          return `${acc} L ${point.x} ${point.y}`;
        }, "");
      }

      setPath(pathData);

      // Create fill path for gradient
      if (showGradient) {
        const lastPoint = points[points.length - 1];
        if (lastPoint) {
          const fillPathData = `${pathData} L ${lastPoint.x} ${height} L 0 ${height} Z`;
          setFillPath(fillPathData);
        }
      }
    }, [data, height, strokeWidth, smooth, showGradient]);

    if (!data || data.length < 2) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        style={{ width }}
        {...props}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ height: `${height}px` }}
        >
          {showGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
          )}

          {showGradient && fillPath && (
            <path
              d={fillPath}
              fill={`url(#${gradientId})`}
            />
          )}

          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }
);

Sparkline.displayName = "Sparkline";

export { Sparkline };
