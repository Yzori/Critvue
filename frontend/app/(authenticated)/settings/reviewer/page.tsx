"use client";

/**
 * Reviewer Settings Page
 *
 * Allows users to manage their reviewer directory listing settings:
 * - Opt in/out of the reviewer directory
 * - Set availability status
 * - Update reviewer tagline
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CheckCircle2,
  Users,
  Clock,
  Eye,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  getReviewerSettings,
  updateReviewerSettings,
  type ReviewerSettings,
  type ReviewerAvailability,
} from "@/lib/api/onboarding";

type AvailabilityOption = {
  value: ReviewerAvailability;
  label: string;
  description: string;
};

const availabilityOptions: AvailabilityOption[] = [
  {
    value: "available",
    label: "Available",
    description: "Open to receiving review requests",
  },
  {
    value: "busy",
    label: "Busy",
    description: "Temporarily not taking new requests",
  },
  {
    value: "unavailable",
    label: "Unavailable",
    description: "Not accepting review requests",
  },
];

export default function ReviewerSettingsPage() {
  const [settings, setSettings] = useState<ReviewerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [isListed, setIsListed] = useState(false);
  const [availability, setAvailability] = useState<ReviewerAvailability>("available");
  const [tagline, setTagline] = useState("");

  // Track if form has changes
  const hasChanges =
    settings &&
    (isListed !== settings.isListedAsReviewer ||
      availability !== settings.reviewerAvailability ||
      tagline !== (settings.reviewerTagline || ""));

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getReviewerSettings();
      setSettings(data);
      setIsListed(data.isListedAsReviewer);
      setAvailability(data.reviewerAvailability);
      setTagline(data.reviewerTagline || "");
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateReviewerSettings({
        isListedAsReviewer: isListed,
        reviewerAvailability: availability,
        reviewerTagline: tagline,
      });
      setSettings(updated);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Reviewer Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your presence in the reviewer directory
        </p>
      </div>

      {/* Directory Listing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-accent-blue" />
            Reviewer Directory
          </CardTitle>
          <CardDescription>
            Control whether you appear in the public reviewer directory where creators can find you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* List in directory toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="listed-toggle" className="text-base font-medium">
                List me in the reviewer directory
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, creators can find you and request reviews
              </p>
            </div>
            <Switch
              id="listed-toggle"
              checked={isListed}
              onCheckedChange={setIsListed}
            />
          </div>

          {/* Only show remaining options if listed */}
          {isListed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 pt-4 border-t border-border"
            >
              {/* Availability Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Availability Status</Label>
                </div>
                <div className="grid gap-3">
                  {availabilityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        availability === option.value
                          ? "border-accent-blue bg-accent-blue/5"
                          : "border-border hover:border-accent-blue/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="availability"
                        value={option.value}
                        checked={availability === option.value}
                        onChange={(e) => setAvailability(e.target.value as ReviewerAvailability)}
                        className="sr-only"
                      />
                      <div
                        className={`size-4 rounded-full border-2 flex items-center justify-center ${
                          availability === option.value
                            ? "border-accent-blue"
                            : "border-muted-foreground"
                        }`}
                      >
                        {availability === option.value && (
                          <div className="size-2 rounded-full bg-accent-blue" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-muted-foreground" />
                  <Label htmlFor="tagline" className="text-base font-medium">
                    Tagline
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  A short description that appears on your directory card
                </p>
                <textarea
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g., Senior UI/UX designer with 10+ years experience"
                  maxLength={200}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {tagline.length}/200 characters
                </p>
              </div>

              {/* Preview link */}
              <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <span className="text-sm text-foreground">
                    Your profile is visible in the directory
                  </span>
                </div>
                <Link
                  href="/reviewers"
                  className="flex items-center gap-1 text-sm text-accent-blue hover:underline"
                >
                  View directory
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
