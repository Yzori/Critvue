"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WatermarkOverlay Component
 *
 * A semi-transparent diagonal watermark pattern to protect creative work.
 * Used on review images to prevent unauthorized downloading/theft while
 * still allowing reviewers to evaluate the work.
 *
 * Features:
 * - Diagonal repeating "CRITVUE" text pattern
 * - Configurable opacity (default 15%)
 * - Non-intrusive but visible protection
 * - Pointer-events disabled so users can still interact with underlying content
 */

interface WatermarkOverlayProps {
  className?: string;
  opacity?: number; // 0-100
  text?: string;
  fontSize?: "sm" | "md" | "lg";
}

export function WatermarkOverlay({
  className,
  opacity = 15,
  text = "CRITVUE",
  fontSize = "md",
}: WatermarkOverlayProps) {
  const fontSizeClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[fontSize];

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none select-none z-10",
        className
      )}
      aria-hidden="true"
    >
      {/* Diagonal pattern using CSS */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 80px,
              rgba(0, 0, 0, ${opacity / 100}) 80px,
              rgba(0, 0, 0, ${opacity / 100}) 81px
            )
          `,
        }}
      />

      {/* Repeating text pattern */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: "rotate(-45deg) scale(2)",
          transformOrigin: "center center",
        }}
      >
        <div className="flex flex-col gap-12">
          {Array.from({ length: 15 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-16 whitespace-nowrap">
              {Array.from({ length: 10 }).map((_, colIndex) => (
                <span
                  key={colIndex}
                  className={cn(
                    fontSizeClass,
                    "font-bold tracking-widest uppercase"
                  )}
                  style={{
                    color: `rgba(128, 128, 128, ${opacity / 100})`,
                    textShadow: `0 0 1px rgba(255, 255, 255, ${opacity / 200})`,
                  }}
                >
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight watermark for lightbox/fullscreen view
 * Uses a more subtle approach optimized for dark backgrounds
 */
export function LightboxWatermark({
  className,
  opacity = 12,
  text = "CRITVUE",
}: WatermarkOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none select-none z-10",
        className
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: "rotate(-45deg) scale(2.5)",
          transformOrigin: "center center",
        }}
      >
        <div className="flex flex-col gap-16">
          {Array.from({ length: 12 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-24 whitespace-nowrap">
              {Array.from({ length: 8 }).map((_, colIndex) => (
                <span
                  key={colIndex}
                  className="text-base font-bold tracking-[0.3em] uppercase"
                  style={{
                    color: `rgba(255, 255, 255, ${opacity / 100})`,
                    textShadow: `0 0 2px rgba(0, 0, 0, 0.5)`,
                  }}
                >
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
