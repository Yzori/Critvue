"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ContentType } from "@/lib/api/reviews";
import {
  Palette,
  Code,
  Video,
  Headphones,
  PenTool,
  Sparkles,
  Cast,
} from "lucide-react";

export interface CategoryCardsProps {
  onCategorySelect: (category: ContentType) => void;
  selectedCategory?: ContentType | "all";
}

interface CategoryCardData {
  value: ContentType;
  label: string;
  icon: React.ElementType;
  gradient: string;
  hoverGradient: string;
  count: number;
  description: string;
}

/**
 * Category Cards Component - Interactive category selection
 *
 * Features:
 * - Beautiful gradient cards for each content type
 * - Smooth hover effects with scale and glow
 * - Icon animations on hover
 * - Count badges
 * - Mobile responsive grid
 */
export function CategoryCards({ onCategorySelect, selectedCategory }: CategoryCardsProps) {
  const categories: CategoryCardData[] = [
    {
      value: "design",
      label: "Design",
      icon: Palette,
      gradient: "from-pink-500 to-rose-500",
      hoverGradient: "from-pink-600 to-rose-600",
      count: 24,
      description: "UI/UX, Graphics, Branding",
    },
    {
      value: "code",
      label: "Code",
      icon: Code,
      gradient: "from-blue-500 to-cyan-500",
      hoverGradient: "from-blue-600 to-cyan-600",
      count: 18,
      description: "Web, Mobile, Backend",
    },
    {
      value: "video",
      label: "Video",
      icon: Video,
      gradient: "from-purple-500 to-indigo-500",
      hoverGradient: "from-purple-600 to-indigo-600",
      count: 15,
      description: "Editing, Animation, Motion",
    },
    {
      value: "stream",
      label: "Stream",
      icon: Cast,
      gradient: "from-red-500 to-pink-500",
      hoverGradient: "from-red-600 to-pink-600",
      count: 11,
      description: "Live, Shorts, TikTok",
    },
    {
      value: "audio",
      label: "Audio",
      icon: Headphones,
      gradient: "from-green-500 to-emerald-500",
      hoverGradient: "from-green-600 to-emerald-600",
      count: 8,
      description: "Music, Podcasts, Sound",
    },
    {
      value: "writing",
      label: "Writing",
      icon: PenTool,
      gradient: "from-amber-500 to-orange-500",
      hoverGradient: "from-amber-600 to-orange-600",
      count: 12,
      description: "Content, Copy, Technical",
    },
    {
      value: "art",
      label: "Art",
      icon: Sparkles,
      gradient: "from-violet-500 to-purple-500",
      hoverGradient: "from-violet-600 to-purple-600",
      count: 9,
      description: "Illustration, Digital, 3D",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Browse by Category
          </h2>
          <p className="text-gray-600 mt-1">
            Find reviews in your area of expertise
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.value;

          return (
            <button
              key={category.value}
              onClick={() => onCategorySelect(category.value)}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
                "hover:scale-105 hover:shadow-2xl",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue",
                isSelected && "ring-2 ring-accent-blue ring-offset-2 scale-105"
              )}
            >
              {/* Gradient Background */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br transition-opacity duration-300",
                  category.gradient,
                  "group-hover:opacity-90",
                  isSelected ? "opacity-100" : "opacity-80"
                )}
              />

              {/* Hover Glow Effect */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  category.hoverGradient
                )}
              />

              {/* Content */}
              <div className="relative flex flex-col items-center text-center space-y-3">
                {/* Icon with Animation */}
                <div
                  className={cn(
                    "size-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center",
                    "transition-all duration-300",
                    "group-hover:scale-110 group-hover:rotate-6"
                  )}
                >
                  <Icon className="size-6 text-white" strokeWidth={2.5} />
                </div>

                {/* Label */}
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {category.label}
                  </h3>
                  <p className="text-white/80 text-xs mt-0.5">
                    {category.description}
                  </p>
                </div>

                {/* Count Badge */}
                <div
                  className={cn(
                    "px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm",
                    "text-white font-semibold text-sm"
                  )}
                >
                  {category.count} reviews
                </div>
              </div>

              {/* Shine Effect on Hover */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  "bg-gradient-to-tr from-transparent via-white/10 to-transparent",
                  "translate-x-[-100%] group-hover:translate-x-[100%]",
                  "transition-transform duration-700"
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
