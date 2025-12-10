/**
 * Avatar Display Component
 * Shows current avatar with edit/delete actions
 * Supports multiple sizes and contexts (profile, navigation, comments, etc.)
 * Follows Critvue brand guidelines with gradient fallbacks
 */

"use client";

import { useState } from "react";
import { Camera, Trash2, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "./avatar-upload";

// Avatar size variants
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-6",
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-16",
  "2xl": "size-32",
};

const iconSizes: Record<AvatarSize, string> = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
  "2xl": "size-12",
};

interface AvatarDisplayProps {
  avatarUrl?: string | null;
  fullName?: string;
  size?: AvatarSize;
  editable?: boolean;
  showUploadButton?: boolean;
  showDeleteButton?: boolean;
  onUploadComplete?: (avatarUrl: string) => void;
  onDelete?: () => void;
  className?: string;
}

export function AvatarDisplay({
  avatarUrl,
  fullName = "User",
  size = "xl",
  editable = false,
  showUploadButton = false,
  showDeleteButton = false,
  onUploadComplete,
  onDelete,
  className,
}: AvatarDisplayProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(avatarUrl);

  // Generate initials from full name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Handle upload complete
  const handleUploadComplete = (newAvatarUrl: string) => {
    setLocalAvatarUrl(newAvatarUrl);
    setShowUploader(false);
    if (onUploadComplete) {
      onUploadComplete(newAvatarUrl);
    }
  };

  // Handle delete avatar
  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
      setLocalAvatarUrl(null);
    } catch {
      // Failed to delete avatar - silent fail
    } finally {
      setIsDeleting(false);
    }
  };

  // If showing uploader
  if (showUploader && editable) {
    return (
      <div className={cn("space-y-4", className)}>
        <AvatarUpload
          currentAvatarUrl={localAvatarUrl || undefined}
          onUploadComplete={handleUploadComplete}
          onUploadError={() => { /* Silent fail */ }}
        />
        <Button
          variant="outline"
          onClick={() => setShowUploader(false)}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Render avatar display
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Avatar container */}
      <div className="relative group">
        {/* Avatar image or initials */}
        <div
          className={cn(
            sizeClasses[size],
            "rounded-full overflow-hidden border-4 border-white shadow-lg transition-all",
            editable && "group-hover:shadow-xl group-hover:scale-105"
          )}
        >
          {localAvatarUrl ? (
            <img
              src={localAvatarUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            // Gradient fallback with initials
            <div className="w-full h-full bg-gradient-to-br from-accent-blue via-accent-peach to-accent-blue flex items-center justify-center">
              <span
                className={cn(
                  "font-bold text-white",
                  size === "xs" && "text-xs",
                  size === "sm" && "text-sm",
                  size === "md" && "text-base",
                  size === "lg" && "text-lg",
                  size === "xl" && "text-2xl",
                  size === "2xl" && "text-4xl"
                )}
              >
                {getInitials(fullName)}
              </span>
            </div>
          )}
        </div>

        {/* Edit button overlay (only for larger sizes and when editable) */}
        {editable && (size === "xl" || size === "2xl") && (
          <button
            onClick={() => setShowUploader(true)}
            className={cn(
              "absolute bottom-0 right-0 rounded-full bg-accent-blue text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform",
              size === "2xl" ? "size-12" : "size-10"
            )}
          >
            <Camera className={size === "2xl" ? "size-6" : "size-5"} />
          </button>
        )}
      </div>

      {/* Action buttons (for smaller sizes or when explicitly shown) */}
      {editable && (showUploadButton || showDeleteButton) && (
        <div className="flex gap-2">
          {showUploadButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploader(true)}
              className="gap-2"
            >
              <Camera className="size-4" />
              {localAvatarUrl ? "Change" : "Upload"}
            </Button>
          )}

          {showDeleteButton && localAvatarUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simple Avatar Component (for display-only contexts)
 * Used in navigation, comments, reviews, etc.
 */
export function Avatar({
  avatarUrl,
  fullName = "User",
  size = "md",
  verified = false,
  className,
}: {
  avatarUrl?: string | null;
  fullName?: string;
  size?: AvatarSize;
  verified?: boolean;
  className?: string;
}) {
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          sizeClasses[size],
          "rounded-full overflow-hidden border-2 border-white shadow-sm"
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          // Gradient fallback with initials
          <div className="w-full h-full bg-gradient-to-br from-accent-blue via-accent-peach to-accent-blue flex items-center justify-center">
            <span
              className={cn(
                "font-bold text-white",
                size === "xs" && "text-xs",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                size === "lg" && "text-base",
                size === "xl" && "text-xl",
                size === "2xl" && "text-3xl"
              )}
            >
              {getInitials(fullName)}
            </span>
          </div>
        )}
      </div>

      {/* Verification badge */}
      {verified && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center",
            size === "xs" || size === "sm" ? "size-3" : "size-4"
          )}
        >
          <Check
            className={cn(
              "text-white",
              size === "xs" || size === "sm" ? "size-2" : "size-2.5"
            )}
          />
        </div>
      )}
    </div>
  );
}
