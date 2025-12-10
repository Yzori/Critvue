"use client";

import * as React from "react";
import { useMemo } from "react";
import { Search, X, Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SKILL_CATEGORIES } from "@/lib/expert-application/types";
import { updateProfile } from "@/lib/api/profile";
import { useSelection, useAsyncCallback } from "@/hooks";

export interface SkillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSkills: string[];
  onSkillsUpdated: (skills: string[]) => void;
}

/**
 * Skills Selection Modal
 * Allows users to select their skills for personalized recommendations
 */
export function SkillsModal({
  open,
  onOpenChange,
  currentSkills,
  onSkillsUpdated,
}: SkillsModalProps) {
  // Selection state with max 10 skills
  const {
    selectedArray: selectedSkills,
    isSelected,
    toggle: toggleSkill,
    setSelection,
    clear: clearSelection,
    count: selectedCount,
    isMaxReached,
  } = useSelection<string>(currentSkills, { maxSelection: 10 });

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Async save state
  const {
    isLoading: saving,
    error,
    execute: executeSave,
  } = useAsyncCallback(async () => {
    await updateProfile({ specialty_tags: selectedSkills });
    onSkillsUpdated(selectedSkills);
    onOpenChange(false);
  });

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setSelection(currentSkills);
      setSearchQuery("");
      setSelectedCategory(null);
    }
  }, [open, currentSkills, setSelection]);

  // Filter skills based on search and category
  const filteredSkills = useMemo(() => {
    return SKILL_CATEGORIES.flatMap((category) =>
      category.skills
        .filter((skill) => {
          const matchesSearch = skill
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const matchesCategory =
            !selectedCategory || category.id === selectedCategory;
          return matchesSearch && matchesCategory;
        })
        .map((skill) => ({ skill, category: category.id, icon: category.icon }))
    );
  }, [searchQuery, selectedCategory]);

  const handleRemoveSkill = (skill: string) => {
    toggleSkill(skill);
  };

  const handleSave = async () => {
    await executeSave();
  };

  const hasChanges =
    JSON.stringify([...selectedSkills].sort()) !==
    JSON.stringify([...currentSkills].sort());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-accent-blue flex items-center justify-center">
              <Sparkles className="size-4 text-white" />
            </div>
            Set Your Skills
          </DialogTitle>
          <DialogDescription>
            Tell us your expertise to get personalized review recommendations.
            Select up to 10 skills.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Selected Skills */}
          {selectedCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Your Skills ({selectedCount}/10)
                </span>
                {selectedCount > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue/10 border-accent-blue/20 text-accent-blue"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-0.5 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Empty state prompt */}
          {selectedCount === 0 && (
            <div className="text-center py-3 px-4 rounded-lg bg-muted/50 border border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                Select skills below to get better recommendations
              </p>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                !selectedCategory
                  ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                  : "border-border hover:border-accent-blue/50"
              )}
            >
              All
            </button>
            {SKILL_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selectedCategory === category.id
                    ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                    : "border-border hover:border-accent-blue/50"
                )}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Available Skills Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 rounded-lg border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredSkills.map(({ skill, icon }) => {
                const skillIsSelected = isSelected(skill);
                const canAdd = !isMaxReached;

                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    disabled={!skillIsSelected && !canAdd}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-all",
                      skillIsSelected
                        ? "border-accent-blue bg-accent-blue/5 text-accent-blue"
                        : canAdd
                          ? "border-border hover:border-accent-blue/50 hover:bg-muted/50"
                          : "cursor-not-allowed opacity-50 border-border"
                    )}
                  >
                    <span>
                      <span className="mr-2">{icon}</span>
                      {skill}
                    </span>
                    {skillIsSelected && (
                      <Check className="size-4 text-accent-blue" />
                    )}
                  </button>
                );
              })}
            </div>

            {filteredSkills.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No skills found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-accent-blue text-white hover:opacity-90"
          >
            {saving ? "Saving..." : "Save Skills"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
