"use client";

import * as React from "react";
import {
  Eye,
  EyeOff,
  Users,
  FileText,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import apiClient from "@/lib/api/client";

/**
 * Privacy Settings Page
 *
 * Allows users to manage privacy settings:
 * - Profile visibility
 * - Review visibility
 * - Activity visibility
 * - Data export
 */

interface PrivacySettings {
  profile_visibility: "public" | "private" | "connections";
  show_on_leaderboard: boolean;
  show_activity_status: boolean;
  allow_review_discovery: boolean;
  show_karma_publicly: boolean;
}

export default function PrivacySettingsPage() {
  const [settings, setSettings] = React.useState<PrivacySettings>({
    profile_visibility: "public",
    show_on_leaderboard: true,
    show_activity_status: true,
    allow_review_discovery: true,
    show_karma_publicly: true,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [originalSettings, setOriginalSettings] = React.useState<PrivacySettings | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Fetch privacy settings on mount
  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<PrivacySettings>("/settings/privacy");
      setSettings(data);
      setOriginalSettings(data);
    } catch (error) {
      console.error("Failed to fetch privacy settings:", error);
      toast.error("Failed to load privacy settings");
      // Fallback to defaults on error
      const defaultSettings: PrivacySettings = {
        profile_visibility: "public",
        show_on_leaderboard: true,
        show_activity_status: true,
        allow_review_discovery: true,
        show_karma_publicly: true,
      };
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedSettings = await apiClient.patch<PrivacySettings>("/settings/privacy", settings);
      setSettings(updatedSettings);
      setOriginalSettings(updatedSettings);
      setHasChanges(false);
      toast.success("Privacy settings saved");
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
      toast.error("Failed to save privacy settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      // In production, trigger data export
      // const data = await apiClient.get("/settings/export-data");
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
      toast.success("Your data export has been initiated. You'll receive an email when it's ready.");
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold lg:text-xl">Privacy</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Control your visibility and data sharing preferences
        </p>
      </div>

      {/* Profile Visibility Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="size-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Choose who can see your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Visibility Setting */}
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Who can see your profile</Label>
            <Select
              value={settings.profile_visibility}
              onValueChange={(value: PrivacySettings["profile_visibility"]) =>
                updateSetting("profile_visibility", value)
              }
            >
              <SelectTrigger id="profile-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4" />
                    <span>Public - Anyone can view</span>
                  </div>
                </SelectItem>
                <SelectItem value="connections">
                  <div className="flex items-center gap-2">
                    <Users className="size-4" />
                    <span>Connections - Only people you've worked with</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <EyeOff className="size-4" />
                    <span>Private - Only you</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Show on Leaderboard */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-leaderboard" className="text-base font-medium cursor-pointer">
                Show on leaderboard
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow your profile to appear on public leaderboards
              </p>
            </div>
            <Switch
              id="show-leaderboard"
              checked={settings.show_on_leaderboard}
              onCheckedChange={(checked) => updateSetting("show_on_leaderboard", checked)}
            />
          </div>

          <Separator />

          {/* Show Karma Publicly */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-karma" className="text-base font-medium cursor-pointer">
                Display karma points
              </Label>
              <p className="text-sm text-muted-foreground">
                Show your karma points on your public profile
              </p>
            </div>
            <Switch
              id="show-karma"
              checked={settings.show_karma_publicly}
              onCheckedChange={(checked) => updateSetting("show_karma_publicly", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity & Discovery Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5" />
            Activity & Discovery
          </CardTitle>
          <CardDescription>
            Control how others can find and interact with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activity Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="activity-status" className="text-base font-medium cursor-pointer">
                Show activity status
              </Label>
              <p className="text-sm text-muted-foreground">
                Let others see when you were last active
              </p>
            </div>
            <Switch
              id="activity-status"
              checked={settings.show_activity_status}
              onCheckedChange={(checked) => updateSetting("show_activity_status", checked)}
            />
          </div>

          <Separator />

          {/* Review Discovery */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="review-discovery" className="text-base font-medium cursor-pointer">
                Allow review discovery
              </Label>
              <p className="text-sm text-muted-foreground">
                Let reviewers find your public review requests
              </p>
            </div>
            <Switch
              id="review-discovery"
              checked={settings.allow_review_discovery}
              onCheckedChange={(checked) => updateSetting("allow_review_discovery", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5" />
            Your Data
          </CardTitle>
          <CardDescription>
            Download or delete your personal data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Export your data</p>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your Critvue data
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Delete Data */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Delete your data</p>
              <p className="text-sm text-muted-foreground">
                Request deletion of your personal data
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4 mr-2" />
                  Delete Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete your data?</DialogTitle>
                  <DialogDescription>
                    This will initiate a request to delete your personal data. Some data may be
                    retained for legal or legitimate business purposes. You'll receive an email
                    confirming when the deletion is complete.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="destructive" disabled>
                    Request Deletion
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Save Bar */}
      {hasChanges && (
        <div className="sticky bottom-4 flex items-center justify-end gap-3 p-4 bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-lg">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "bg-accent-blue text-white font-semibold",
              "hover:opacity-90"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
