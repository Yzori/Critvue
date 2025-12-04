/**
 * Mobile Review Drawer
 *
 * Bottom sheet drawer for mobile devices to switch between reviews:
 * - Swipe up from bottom to reveal
 * - Shows all active reviews
 * - Tap to switch
 * - Smooth animations
 *
 * Brand Compliance:
 * - Critvue brand colors
 * - Touch-friendly targets (min 44px)
 * - Smooth transitions
 */

"use client";

import * as React from "react";
import { motion, PanInfo } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { getContentTypeConfig } from "@/lib/constants/content-types";
import { cn } from "@/lib/utils";
import {
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
} from "@/lib/api/reviewer";

interface MobileReviewDrawerProps {
  slots: ReviewSlot[];
  currentSlotId: number;
  isOpen: boolean;
  onClose: () => void;
  onSlotChange: (slotId: number) => void;
}

export function MobileReviewDrawer({
  slots,
  currentSlotId,
  isOpen,
  onClose,
  onSlotChange,
}: MobileReviewDrawerProps) {
  const handleSelect = (slotId: number) => {
    onSlotChange(slotId);
    onClose();
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close drawer if dragged down more than 100px or fast swipe
    const shouldClose = info.offset.y > 100 || info.velocity.y > 500;
    if (shouldClose) {
      onClose();
    }
  };

  // Close drawer on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop with fade animation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer with swipe-to-dismiss */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        initial={{ y: "100%" }}
        animate={{ y: isOpen ? 0 : "100%" }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
          mass: 0.8,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 lg:hidden"
        style={{
          // Force GPU acceleration for smoother animations
          transform: "translate3d(0, 0, 0)",
          willChange: "transform",
        }}
      >
        {/* Interactive drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to close drawer"
        >
          <div className="w-12 h-1.5 bg-muted-foreground/40 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 flex items-center justify-between border-b border-border">
          <div>
            <h3 id="drawer-title" className="text-lg font-semibold text-foreground">
              My Reviews
            </h3>
            <p className="text-xs text-muted-foreground">
              {slots.length} active review{slots.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0 min-h-[48px] min-w-[48px]"
            aria-label="Close review drawer"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Review List with safe area padding */}
        <div
          className="max-h-[60vh] overflow-y-auto p-4 space-y-2"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          {slots.map(slot => (
            <MobileReviewCard
              key={slot.id}
              slot={slot}
              isActive={slot.id === currentSlotId}
              onSelect={() => handleSelect(slot.id)}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}

interface MobileReviewCardProps {
  slot: ReviewSlot;
  isActive: boolean;
  onSelect: () => void;
}

function MobileReviewCard({ slot, isActive, onSelect }: MobileReviewCardProps) {
  const hoursRemaining = slot.claim_deadline
    ? calculateHoursRemaining(slot.claim_deadline)
    : 0;
  const urgency = getDeadlineUrgency(hoursRemaining);

  const isSubmitted = slot.status === "submitted";

  // Calculate progress
  const progress = React.useMemo(() => {
    if (isSubmitted) return 100;

    let completion = 0;
    if (slot.rating) completion += 50;
    if (slot.review_text && slot.review_text.length >= 50) completion += 50;

    return completion;
  }, [slot, isSubmitted]);

  // Use shared content type config
  const config = getContentTypeConfig(slot.review_request?.content_type);
  const Icon = config.icon;

  const urgencyColors = {
    danger: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-500/20 dark:border-red-500/30",
    warning: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/20 dark:border-amber-500/30",
    safe: "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-500/20 dark:border-green-500/30",
  };

  const ariaLabel = `Switch to review: ${slot.review_request?.title || 'Untitled Review'}. ${progress}% complete. ${
    hoursRemaining < 24
      ? `${hoursRemaining} hours remaining`
      : `${Math.floor(hoursRemaining / 24)} days remaining`
  }.${isActive ? ' Currently selected.' : ''}`;

  return (
    <button
      className={cn(
        "w-full p-4 rounded-xl border bg-card text-left transition-all touch-manipulation",
        "hover:bg-muted/50 active:scale-98",
        "focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
        isActive && "border-2 border-primary bg-primary/5"
      )}
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-current={isActive ? "true" : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("mt-0.5", config.color, "dark:brightness-125 dark:saturate-150")}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground line-clamp-2">
            {slot.review_request?.title || "Untitled Review"}
          </h4>
        </div>
      </div>

      {/* Progress Bar */}
      {!isSubmitted && (
        <div className="mb-3">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                progress === 0 && "bg-muted-foreground/30",
                progress > 0 && progress < 100 && "bg-accent-blue",
                progress === 100 && "bg-accent-sage"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {progress}% complete
          </p>
        </div>
      )}

      {/* Meta Info */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Deadline */}
        {slot.claim_deadline && !isSubmitted && (
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium",
              urgencyColors[urgency]
            )}
          >
            <Clock className="size-3" />
            <span>
              {hoursRemaining < 1
                ? "Overdue"
                : hoursRemaining < 24
                  ? `${hoursRemaining}h left`
                  : `${Math.floor(hoursRemaining / 24)}d left`}
            </span>
          </div>
        )}

        {/* Payment */}
        <Badge variant="secondary" size="sm">
          {formatPayment(slot.payment_amount)}
        </Badge>

        {/* Submitted */}
        {isSubmitted && (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="size-3" />
            Submitted
          </Badge>
        )}

        {/* Current */}
        {isActive && (
          <Badge variant="primary" size="sm">
            Current
          </Badge>
        )}
      </div>
    </button>
  );
}
