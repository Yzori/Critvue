/**
 * Content Type Selection Step - Two-Step Selection
 *
 * Step 1: Select main content type (code, design, art, audio, video, writing)
 * Step 2: Select specific subcategory (e.g., frontend, ui_ux, illustration)
 *
 * Features:
 * - Smooth sliding animations between steps
 * - Mobile-optimized touch targets
 * - Visual feedback for selections
 * - Back navigation to change main type
 */

"use client";

import * as React from "react";
import { ContentType } from "@/lib/api/reviews/requests";
import {
  getAllContentTypes,
  getSubcategories,
  type Subcategory
} from "@/lib/constants/content-types";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentTypeStepProps {
  selectedType: ContentType | null;
  selectedSubcategory: string | null;
  onSelect: (type: ContentType, subcategory: string | null) => void;
}

export function ContentTypeStep({
  selectedType,
  selectedSubcategory,
  onSelect
}: ContentTypeStepProps) {
  const [showingSubcategories, setShowingSubcategories] = React.useState(false);
  const [selectedMainType, setSelectedMainType] = React.useState<ContentType | null>(selectedType);

  const contentTypes = getAllContentTypes();

  // Handle main type selection
  const handleMainTypeSelect = (type: ContentType) => {
    setSelectedMainType(type);
    const subcategories = getSubcategories(type);

    if (subcategories.length > 0) {
      // Show subcategory selection
      setShowingSubcategories(true);
    } else {
      // No subcategories, complete selection
      onSelect(type, null);
    }
  };

  // Handle subcategory selection
  const handleSubcategorySelect = (subcategory: Subcategory) => {
    if (selectedMainType) {
      onSelect(selectedMainType, subcategory.id);
    }
  };

  // Handle back to main types
  const handleBack = () => {
    setShowingSubcategories(false);
    setSelectedMainType(null);
  };

  const subcategories = selectedMainType ? getSubcategories(selectedMainType) : [];
  const selectedMainConfig = selectedMainType
    ? contentTypes.find(ct => ct.id === selectedMainType)
    : null;

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          {showingSubcategories
            ? `What type of ${selectedMainConfig?.label.toLowerCase()}?`
            : "What would you like feedback on?"
          }
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {showingSubcategories
            ? "Choose the specific type for tailored feedback criteria"
            : "Choose the type of work you'd like to share"
          }
        </p>
      </div>

      {/* Main Types Grid */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          showingSubcategories && "opacity-0 pointer-events-none absolute inset-0"
        )}
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {contentTypes.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.id && !showingSubcategories;

            return (
              <button
                key={option.id}
                onClick={() => handleMainTypeSelect(option.id as ContentType)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-card",
                  "border-2 transition-all duration-200",
                  "p-6 min-h-[140px] flex flex-col items-center justify-center text-center",
                  "hover:shadow-lg active:scale-[0.98] touch-manipulation",
                  isSelected
                    ? "border-accent-blue shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                    : "border-border hover:border-accent-blue/30"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "size-14 rounded-xl flex items-center justify-center mb-3",
                    "group-hover:scale-110 transition-transform duration-200",
                    option.bg,
                    isSelected && "scale-110"
                  )}
                >
                  <Icon className={cn("size-6", option.color)} />
                </div>

                {/* Label */}
                <h3 className="font-semibold text-base text-foreground mb-1">
                  {option.label}
                </h3>

                {/* Subcategory count hint */}
                {option.subcategories && option.subcategories.length > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {option.subcategories.length} types
                    <ChevronRight className="size-3" />
                  </p>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 size-6 rounded-full bg-accent-blue flex items-center justify-center">
                    <svg
                      className="size-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategories Grid - Slides in */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          !showingSubcategories && "opacity-0 pointer-events-none absolute inset-0"
        )}
      >
        {showingSubcategories && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50 touch-manipulation min-h-[44px]"
            >
              <ArrowLeft className="size-4" />
              Back to all types
            </button>

            {/* Selected main type reminder */}
            {selectedMainConfig && (
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl border",
                selectedMainConfig.bg,
                "border-" + selectedMainConfig.color.replace("text-", "")
              )}>
                <div className={cn("size-10 rounded-lg flex items-center justify-center bg-white/50")}>
                  <selectedMainConfig.icon className={cn("size-5", selectedMainConfig.color)} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{selectedMainConfig.label}</p>
                  <p className="text-xs text-muted-foreground">Select specific type below</p>
                </div>
              </div>
            )}

            {/* Subcategories grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subcategories.map((subcategory) => {
                const SubIcon = subcategory.icon;
                const isSelected = selectedSubcategory === subcategory.id;

                return (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategorySelect(subcategory)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl bg-card",
                      "border-2 transition-all duration-200",
                      "p-4 min-h-[100px] flex items-start gap-3 text-left",
                      "hover:shadow-md active:scale-[0.98] touch-manipulation",
                      isSelected
                        ? "border-accent-blue shadow-[0_0_0_3px_rgba(59,130,246,0.1)] bg-accent-blue/5"
                        : "border-border hover:border-accent-blue/30"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "size-12 rounded-lg flex items-center justify-center shrink-0",
                        selectedMainConfig?.bg,
                        "group-hover:scale-105 transition-transform duration-200",
                        isSelected && "scale-105"
                      )}
                    >
                      <SubIcon className={cn("size-5", selectedMainConfig?.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        {subcategory.label}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {subcategory.description}
                      </p>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 size-5 rounded-full bg-accent-blue flex items-center justify-center">
                        <svg
                          className="size-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
