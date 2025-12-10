"use client";

import * as React from "react";
import { Bell, Mail, Smartphone, Clock, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  type NotificationPreferences,
  type UpdatePreferencesPayload,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Notification Preferences Page
 *
 * Allows users to configure their notification settings:
 * - Email, push, and SMS notifications
 * - Email digest frequency and timing
 * - Quiet hours
 * - Per-category notification preferences
 */

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = React.useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Fetch preferences on mount
  React.useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const data = await getNotificationPreferences();
      setPreferences(data);
    } catch {
      toast.error("Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);

      const updates: UpdatePreferencesPayload = {
        email_enabled: preferences.email_enabled,
        push_enabled: preferences.push_enabled,
        sms_enabled: preferences.sms_enabled,
        email_digest_frequency: preferences.email_digest_frequency,
        email_digest_time: preferences.email_digest_time,
        email_digest_day: preferences.email_digest_day,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        category_preferences: preferences.category_preferences,
      };

      const updated = await updateNotificationPreferences(updates);
      setPreferences(updated);
      setHasChanges(false);
      toast.success("Notification preferences saved successfully");
    } catch {
      toast.error("Failed to save notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    fetchPreferences();
    setHasChanges(false);
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
    setHasChanges(true);
  };

  const updateCategoryPreference = (category: string, channel: string, enabled: boolean) => {
    if (!preferences) return;

    const categoryPreferences = preferences.category_preferences || {};
    const categorySettings = categoryPreferences[category] || {};

    setPreferences({
      ...preferences,
      category_preferences: {
        ...categoryPreferences,
        [category]: {
          ...categorySettings,
          [channel]: enabled,
        },
      },
    });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue" />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-16">
          <p className="text-destructive mb-4">Failed to load notification preferences</p>
          <Button onClick={fetchPreferences}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Manage how and when you receive notifications from Critvue
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-enabled" className="text-base font-medium cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-enabled"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => updatePreference("email_enabled", checked)}
              />
            </div>

            <Separator />

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="size-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="push-enabled" className="text-base font-medium cursor-pointer">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
              </div>
              <Switch
                id="push-enabled"
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => updatePreference("push_enabled", checked)}
              />
            </div>

            <Separator />

            {/* SMS Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="size-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sms-enabled" className="text-base font-medium cursor-pointer">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important notifications via SMS
                  </p>
                </div>
              </div>
              <Switch
                id="sms-enabled"
                checked={preferences.sms_enabled}
                onCheckedChange={(checked) => updatePreference("sms_enabled", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Digest Settings */}
        {preferences.email_enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-5" />
                Email Digest
              </CardTitle>
              <CardDescription>
                Receive a summary of your notifications via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="digest-frequency">Frequency</Label>
                <Select
                  value={preferences.email_digest_frequency}
                  onValueChange={(value) => updatePreference("email_digest_frequency", value)}
                >
                  <SelectTrigger id="digest-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Disabled</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time of Day (for daily/weekly) */}
              {(preferences.email_digest_frequency === "daily" ||
                preferences.email_digest_frequency === "weekly") && (
                <div className="space-y-2">
                  <Label htmlFor="digest-time">Time of Day</Label>
                  <Select
                    value={String(preferences.email_digest_time)}
                    onValueChange={(value) => updatePreference("email_digest_time", parseInt(value))}
                  >
                    <SelectTrigger id="digest-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6:00 AM</SelectItem>
                      <SelectItem value="8">8:00 AM</SelectItem>
                      <SelectItem value="10">10:00 AM</SelectItem>
                      <SelectItem value="12">12:00 PM</SelectItem>
                      <SelectItem value="14">2:00 PM</SelectItem>
                      <SelectItem value="16">4:00 PM</SelectItem>
                      <SelectItem value="18">6:00 PM</SelectItem>
                      <SelectItem value="20">8:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Day of Week (for weekly) */}
              {preferences.email_digest_frequency === "weekly" && (
                <div className="space-y-2">
                  <Label htmlFor="digest-day">Day of Week</Label>
                  <Select
                    value={String(preferences.email_digest_day)}
                    onValueChange={(value) => updatePreference("email_digest_day", parseInt(value))}
                  >
                    <SelectTrigger id="digest-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Quiet Hours
            </CardTitle>
            <CardDescription>
              Don't receive notifications during these hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable Quiet Hours */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {preferences.quiet_hours_enabled ? (
                  <VolumeX className="size-5 text-muted-foreground" />
                ) : (
                  <Volume2 className="size-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="quiet-hours-enabled" className="text-base font-medium cursor-pointer">
                    Enable Quiet Hours
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pause notifications during specific times
                  </p>
                </div>
              </div>
              <Switch
                id="quiet-hours-enabled"
                checked={preferences.quiet_hours_enabled}
                onCheckedChange={(checked) => updatePreference("quiet_hours_enabled", checked)}
              />
            </div>

            {/* Quiet Hours Time Range */}
            {preferences.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Select
                    value={String(preferences.quiet_hours_start ?? 22)}
                    onValueChange={(value) => updatePreference("quiet_hours_start", parseInt(value))}
                  >
                    <SelectTrigger id="quiet-start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Select
                    value={String(preferences.quiet_hours_end ?? 8)}
                    onValueChange={(value) => updatePreference("quiet_hours_end", parseInt(value))}
                  >
                    <SelectTrigger id="quiet-end">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Categories</CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationCategorySettings
              categoryPreferences={preferences.category_preferences || {}}
              onUpdate={updateCategoryPreference}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-lg border-t border-border p-4 -mx-4 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "bg-accent-blue",
                "text-white font-semibold",
                "hover:opacity-90"
              )}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== NotificationCategorySettings Component ====================

interface NotificationCategorySettingsProps {
  categoryPreferences: Record<string, Record<string, boolean>>;
  onUpdate: (category: string, channel: string, enabled: boolean) => void;
}

function NotificationCategorySettings({
  categoryPreferences,
  onUpdate,
}: NotificationCategorySettingsProps) {
  const categories = [
    {
      id: "reviews",
      label: "Reviews",
      description: "Updates about your code reviews",
      channels: [
        { id: "email", label: "Email" },
        { id: "push", label: "Push" },
        { id: "sms", label: "SMS" },
      ],
    },
    {
      id: "payments",
      label: "Payments",
      description: "Payment confirmations and receipts",
      channels: [
        { id: "email", label: "Email" },
        { id: "push", label: "Push" },
        { id: "sms", label: "SMS" },
      ],
    },
    {
      id: "karma",
      label: "Karma & Achievements",
      description: "Karma updates and tier promotions",
      channels: [
        { id: "email", label: "Email" },
        { id: "push", label: "Push" },
      ],
    },
    {
      id: "disputes",
      label: "Disputes",
      description: "Dispute notifications and resolutions",
      channels: [
        { id: "email", label: "Email" },
        { id: "push", label: "Push" },
        { id: "sms", label: "SMS" },
      ],
    },
    {
      id: "deadlines",
      label: "Deadlines",
      description: "Reminders for upcoming deadlines",
      channels: [
        { id: "email", label: "Email" },
        { id: "push", label: "Push" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {categories.map((category, index) => (
        <React.Fragment key={category.id}>
          {index > 0 && <Separator />}
          <div>
            <div className="mb-3">
              <h4 className="font-medium">{category.label}</h4>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>

            <div className="flex flex-wrap gap-4 pl-4">
              {category.channels.map((channel) => {
                const isEnabled = categoryPreferences[category.id]?.[channel.id] ?? true;
                return (
                  <div key={channel.id} className="flex items-center gap-2">
                    <Switch
                      id={`${category.id}-${channel.id}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => onUpdate(category.id, channel.id, checked)}
                    />
                    <Label
                      htmlFor={`${category.id}-${channel.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {channel.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
