"use client";

/**
 * Select Featured Works Modal
 *
 * Allows users to select up to 3 portfolio items to feature on their profile.
 * Displays all portfolio items with checkboxes for selection.
 */

import { useState, useEffect } from "react";
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
} from "@/lib/api/portfolio";
import { getFileUrl } from "@/lib/api/client";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(currentFeaturedIds));

  // Load portfolio items when modal opens
  useEffect(() => {
    if (open) {
      loadPortfolio();
      // Initialize with current featured items
      setSelectedIds(new Set(currentFeaturedIds));
    }
  }, [open, currentFeaturedIds]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyPortfolio({ page_size: 50 });
      setPortfolioItems(response.items);
    } catch {
      setError("Failed to load your portfolio items");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelection = (itemId: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else if (newSet.size < MAX_FEATURED) {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

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
    } catch {
      setError("Failed to update featured items. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const currentSet = new Set(currentFeaturedIds);
    if (selectedIds.size !== currentSet.size) return true;
    for (const id of selectedIds) {
      if (!currentSet.has(id)) return true;
    }
    return false;
  };

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
            {selectedIds.size > 0 && (
              <span className="ml-2 text-foreground font-medium">
                ({selectedIds.size}/{MAX_FEATURED} selected)
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
                  const isSelected = selectedIds.has(item.id);
                  const canSelect = isSelected || selectedIds.size < MAX_FEATURED;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => canSelect && handleToggleSelection(item.id)}
                      disabled={!canSelect}
                      className={cn(
                        "relative aspect-[4/3] rounded-xl overflow-hidden group text-left transition-all",
                        isSelected
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
                        isSelected
                          ? "bg-amber-500/20"
                          : "bg-black/0 group-hover:bg-black/30"
                      )} />

                      {/* Selection indicator */}
                      <div className={cn(
                        "absolute top-3 right-3 size-6 rounded-full flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-amber-500 scale-100"
                          : "bg-black/50 border-2 border-white scale-90 group-hover:scale-100"
                      )}>
                        {isSelected && (
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
            {selectedIds.size === 0
              ? "Select items to feature"
              : `${selectedIds.size} item${selectedIds.size !== 1 ? "s" : ""} selected`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges()}
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
