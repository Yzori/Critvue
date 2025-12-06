"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { AtSign, Check, X, Loader2, AlertCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateProfile, checkUsernameAvailability } from "@/lib/api/profile";

export interface UsernameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  onUsernameUpdated: (username: string) => void;
}

/**
 * Username Edit Modal
 * Allows users to change their username with real-time availability checking
 */
export function UsernameModal({
  open,
  onOpenChange,
  currentUsername,
  onUsernameUpdated,
}: UsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason: string | null;
  } | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setUsername(currentUsername);
      setError(null);
      setAvailability(null);
    }
  }, [open, currentUsername]);

  // Debounced availability check
  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setAvailability(null);
      return;
    }

    // Don't check if it's the same as current username
    if (value.toLowerCase() === currentUsername.toLowerCase()) {
      setAvailability({ available: true, reason: null });
      return;
    }

    setChecking(true);
    try {
      const result = await checkUsernameAvailability(value);
      setAvailability({
        available: result.available,
        reason: result.reason,
      });
    } catch (err) {
      console.error("Error checking username:", err);
      setAvailability(null);
    } finally {
      setChecking(false);
    }
  }, [currentUsername]);

  // Debounce username changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username && username !== currentUsername) {
        checkAvailability(username);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, currentUsername, checkAvailability]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(value);
    setError(null);
    setAvailability(null);
  };

  const handleSave = async () => {
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (availability && !availability.available) {
      setError(availability.reason || "Username is not available");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateProfile({ username });
      onUsernameUpdated(username);
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving username:", err);
      setError("Failed to save username. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = username !== currentUsername;
  const isValid = username.length >= 3 && (!availability || availability.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <AtSign className="size-4 text-white" />
            </div>
            Edit Username
          </DialogTitle>
          <DialogDescription>
            Your username is used in your profile URL for SEO-friendly links.
            It can only contain letters, numbers, underscores, and hyphens.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current URL Preview */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Your profile URL: </span>
            <span className="font-medium text-foreground">
              critvue.com/profile/
              <span className="text-blue-600">{username || "username"}</span>
            </span>
          </div>

          {/* Username Input */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter username"
                className={cn(
                  "pr-10",
                  availability?.available === false && "border-red-500 focus-visible:ring-red-500",
                  availability?.available === true && hasChanges && "border-green-500 focus-visible:ring-green-500"
                )}
                maxLength={50}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking ? (
                  <Loader2 className="size-4 text-muted-foreground animate-spin" />
                ) : availability?.available === true && hasChanges ? (
                  <Check className="size-4 text-green-500" />
                ) : availability?.available === false ? (
                  <X className="size-4 text-red-500" />
                ) : null}
              </div>
            </div>

            {/* Validation Feedback */}
            {username.length > 0 && username.length < 3 && (
              <p className="text-xs text-amber-600">
                Username must be at least 3 characters
              </p>
            )}
            {availability?.available === false && (
              <p className="text-xs text-red-600">
                {availability.reason || "Username is not available"}
              </p>
            )}
            {availability?.available === true && hasChanges && (
              <p className="text-xs text-green-600">
                Username is available
              </p>
            )}
          </div>

          {/* Username Rules */}
          <div className="rounded-lg border border-border p-3 space-y-1">
            <p className="text-xs font-medium text-foreground">Username rules:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li className={cn(
                "flex items-center gap-1.5",
                username.length >= 3 ? "text-green-600" : ""
              )}>
                {username.length >= 3 ? <Check className="size-3" /> : <span className="size-3" />}
                At least 3 characters
              </li>
              <li className={cn(
                "flex items-center gap-1.5",
                username.length <= 50 ? "text-green-600" : ""
              )}>
                {username.length <= 50 ? <Check className="size-3" /> : <span className="size-3" />}
                Maximum 50 characters
              </li>
              <li className={cn(
                "flex items-center gap-1.5",
                /^[a-z0-9_-]*$/.test(username) ? "text-green-600" : ""
              )}>
                {/^[a-z0-9_-]*$/.test(username) ? <Check className="size-3" /> : <span className="size-3" />}
                Only lowercase letters, numbers, underscores, hyphens
              </li>
              <li className={cn(
                "flex items-center gap-1.5",
                username.length > 0 && !/^\d+$/.test(username) ? "text-green-600" : ""
              )}>
                {username.length > 0 && !/^\d+$/.test(username) ? <Check className="size-3" /> : <span className="size-3" />}
                Cannot be purely numeric
              </li>
            </ul>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
            <AlertCircle className="size-4" />
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
            disabled={saving || !hasChanges || !isValid || checking}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Username"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
