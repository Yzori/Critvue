"use client";

/**
 * Select Featured Works Modal
 *
 * Allows users to select up to 3 portfolio items to feature on their profile.
 * Displays all portfolio items with checkboxes for selection.
 */

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Star,
  CheckCircle2,
  Sparkles,
  Code,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  getMyPortfolio,
  togglePortfolioFeatured,
  type PortfolioItem,
} from "@/lib/api/profile/portfolio";
import { getFileUrl } from "@/lib/api/client";
import { useAsync, useAsyncCallback, useSelection } from "@/hooks";

interface SelectFeaturedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeaturedUpdated: (featuredItems: PortfolioItem[]) => void;
  currentFeaturedIds?: number[];
}

const MAX_FEATURED = 3;

export function SelectFeaturedModal({
  open,
  onOpenChange,
  onFeaturedUpdated,
  currentFeaturedIds = [],
}: SelectFeaturedModalProps) {
  // Async state for loading portfolio
  const {
    data: portfolioResponse,
    isLoading: loading,
    error: loadError,
    refetch: loadPortfolio,
  } = useAsync(
    () => getMyPortfolio({ page_size: 50 }),
    { immediate: false }
  );

  const portfolioItems = portfolioResponse?.items ?? [];

  // Selection state with max limit
  const {
    selected: selectedIds,
    isSelected,
    toggle: handleToggleSelection,
    setSelection,
    count: selectedCount,
    isMaxReached,
  } = useSelection<number>(currentFeaturedIds, { maxSelection: MAX_FEATURED });

  // Async state for saving
  const {
    isLoading: saving,
    error: saveError,
    execute: executeSave,
  } = useAsyncCallback(async () => {
    // Find items to feature and unfeature
    const currentFeaturedSet = new Set(currentFeaturedIds);
    const toFeature = [...selectedIds].filter((id) => !currentFeaturedSet.has(id));
    const toUnfeature = currentFeaturedIds.filter((id) => !selectedIds.has(id));

    // Process all changes
    const promises: Promise<PortfolioItem>[] = [];

    for (const id of toFeature) {
      promises.push(togglePortfolioFeatured(id, true));
    }

    for (const id of toUnfeature) {
      promises.push(togglePortfolioFeatured(id, false));
    }

    await Promise.all(promises);

    // Get the updated featured items
    const featuredItems = portfolioItems.filter((item) => selectedIds.has(item.id));
    onFeaturedUpdated(featuredItems);
    onOpenChange(false);
  });

  const error = loadError || saveError;

  // Load portfolio items when modal opens
  useEffect(() => {
    if (open) {
      loadPortfolio();
      // Initialize with current featured items
      setSelection(currentFeaturedIds);
    }
  }, [open, currentFeaturedIds, loadPortfolio, setSelection]);

  const hasChanges = useMemo(() => {
    const currentSet = new Set(currentFeaturedIds);
    if (selectedIds.size !== currentSet.size) return true;
    for (const id of selectedIds) {
      if (!currentSet.has(id)) return true;
    }
    return false;
  }, [selectedIds, currentFeaturedIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="size-5 text-amber-500 fill-amber-500" />
            Select Featured Works
          </DialogTitle>
          <DialogDescription>
            Choose up to {MAX_FEATURED} portfolio items to highlight on your profile.
            {selectedCount > 0 && (
              <span className="ml-2 text-foreground font-medium">
                ({selectedCount}/{MAX_FEATURED} selected)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : portfolioItems.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Portfolio Items</h3>
              <p className="text-sm text-muted-foreground">
                Add projects to your portfolio first, then select which ones to feature.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 py-4">
              <AnimatePresence mode="popLayout">
                {portfolioItems.map((item, index) => {
                  const itemIsSelected = isSelected(item.id);
                  const canSelect = itemIsSelected || !isMaxReached;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => canSelect && handleToggleSelection(item.id)}
                      disabled={!canSelect}
                      className={cn(
                        "relative aspect-[4/3] rounded-xl overflow-hidden group text-left transition-all",
                        itemIsSelected
                          ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
                          : canSelect
                            ? "hover:ring-2 hover:ring-muted-foreground/30 hover:ring-offset-2 hover:ring-offset-background"
                            : "opacity-50 cursor-not-allowed"
                      )}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Image */}
                      {item.image_url ? (
                        <img
                          src={getFileUrl(item.image_url)}
                          alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
                          <Code className="size-10 text-muted-foreground" />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className={cn(
                        "absolute inset-0 transition-colors",
                        itemIsSelected
                          ? "bg-amber-500/20"
                          : "bg-black/0 group-hover:bg-black/30"
                      )} />

                      {/* Selection indicator */}
                      <div className={cn(
                        "absolute top-3 right-3 size-6 rounded-full flex items-center justify-center transition-all",
                        itemIsSelected
                          ? "bg-amber-500 scale-100"
                          : "bg-black/50 border-2 border-white scale-90 group-hover:scale-100"
                      )}>
                        {itemIsSelected && (
                          <CheckCircle2 className="size-4 text-white" />
                        )}
                      </div>

                      {/* Content type badge */}
                      <Badge
                        variant="secondary"
                        className="absolute top-3 left-3 capitalize text-[10px] bg-black/50 text-white border-0"
                      >
                        {item.content_type}
                      </Badge>

                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-sm font-medium truncate">{item.title}</p>
                        {item.is_verified && (
                          <Badge variant="success" size="sm" className="mt-1 text-[10px]">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {selectedCount === 0
              ? "Select items to feature"
              : `${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeSave}
              disabled={saving || !hasChanges}
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Star className="size-4 fill-white" />
                  Save Featured
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SelectFeaturedModal;
