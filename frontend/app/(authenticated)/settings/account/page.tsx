"use client";

import * as React from "react";
import { User, Mail, Camera, Loader2, Check, X, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/profile/avatar-display";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api/client";
import { uploadAvatar, checkUsernameAvailability } from "@/lib/api/profile/public";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Account Settings Page
 *
 * Allows users to manage their profile information:
 * - Profile picture
 * - Display name
 * - Email (read-only, requires verification to change)
 * - Bio
 */

interface ProfileFormData {
  username: string;
  full_name: string;
  bio: string;
}

export default function AccountSettingsPage() {
  const { user, updateUserAvatar } = useAuth();
  const [formData, setFormData] = React.useState<ProfileFormData>({
    username: "",
    full_name: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [originalData, setOriginalData] = React.useState<ProfileFormData | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Username validation state
  const [usernameChecking, setUsernameChecking] = React.useState(false);
  const [usernameAvailability, setUsernameAvailability] = React.useState<{
    available: boolean;
    reason: string | null;
  } | null>(null);

  // Fetch profile data on mount
  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<{
        username: string | null;
        full_name: string;
        bio: string | null;
      }>("/profile/me");

      const profileData = {
        username: data.username || "",
        full_name: data.full_name || "",
        bio: data.bio || "",
      };

      setFormData(profileData);
      setOriginalData(profileData);
    } catch {
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Check username availability with debounce
  const checkUsername = React.useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailability(null);
      return;
    }

    // Don't check if it's the same as current username
    if (originalData && value.toLowerCase() === originalData.username.toLowerCase()) {
      setUsernameAvailability({ available: true, reason: null });
      return;
    }

    setUsernameChecking(true);
    try {
      const result = await checkUsernameAvailability(value);
      setUsernameAvailability({
        available: result.available,
        reason: result.reason,
      });
    } catch {
      setUsernameAvailability(null);
    } finally {
      setUsernameChecking(false);
    }
  }, [originalData]);

  // Debounce username changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && originalData && formData.username !== originalData.username) {
        checkUsername(formData.username);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.username, originalData, checkUsername]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize username: lowercase, only letters, numbers, underscores, hyphens
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setFormData((prev) => ({ ...prev, username: value }));
    setUsernameAvailability(null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validate username before saving
    if (formData.username.length > 0 && formData.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (usernameAvailability && !usernameAvailability.available) {
      toast.error(usernameAvailability.reason || "Username is not available");
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.patch("/profile/me", {
        username: formData.username || null,
        full_name: formData.full_name,
        bio: formData.bio || null,
      });
      setOriginalData(formData);
      setHasChanges(false);
      setUsernameAvailability(null);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
      setHasChanges(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const response = await uploadAvatar(file);
      updateUserAvatar(response.avatar_url);
      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to upload profile picture");
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        <h2 className="text-2xl font-bold lg:text-xl">Account</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile information and account details
        </p>
      </div>

      {/* Profile Picture Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="size-5" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Click on your avatar to upload a new profile picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className={cn(
                "relative rounded-full transition-opacity",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
                isUploadingAvatar && "opacity-50 cursor-not-allowed"
              )}
            >
              <Avatar
                avatarUrl={user?.avatar_url}
                fullName={user?.full_name || user?.email || "User"}
                size="xl"
                verified={user?.is_verified}
              />
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="size-6 text-white animate-spin" />
                </div>
              )}
              <div
                className={cn(
                  "absolute bottom-0 right-0 p-1.5 rounded-full",
                  "bg-accent-blue text-white",
                  "shadow-md"
                )}
              >
                <Camera className="size-3.5" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="text-sm text-muted-foreground">
              <p>Recommended: Square image, at least 200x200px</p>
              <p>Max file size: 5MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your name and bio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <AtSign className="size-4 text-muted-foreground" />
              Username
            </Label>
            <div className="relative">
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleUsernameChange}
                placeholder="your-username"
                className={cn(
                  "pr-10",
                  usernameAvailability?.available === false &&
                    "border-red-500 focus-visible:ring-red-500",
                  usernameAvailability?.available === true &&
                    formData.username !== originalData?.username &&
                    "border-green-500 focus-visible:ring-green-500"
                )}
                maxLength={50}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameChecking ? (
                  <Loader2 className="size-4 text-muted-foreground animate-spin" />
                ) : usernameAvailability?.available === true &&
                  formData.username !== originalData?.username ? (
                  <Check className="size-4 text-green-500" />
                ) : usernameAvailability?.available === false ? (
                  <X className="size-4 text-red-500" />
                ) : null}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your profile URL: critvue.com/profile/
              <span className="font-medium text-foreground">
                {formData.username || "username"}
              </span>
            </p>
            {formData.username.length > 0 && formData.username.length < 3 && (
              <p className="text-xs text-amber-600">
                Username must be at least 3 characters
              </p>
            )}
            {usernameAvailability?.available === false && (
              <p className="text-xs text-red-600">
                {usernameAvailability.reason || "Username is not available"}
              </p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Display Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Enter your name"
              maxLength={100}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/500
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="size-5" />
            Email Address
          </CardTitle>
          <CardDescription>
            Your email address is used for login and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              {user?.is_verified && (
                <span className="flex items-center gap-1 text-xs text-green-600 whitespace-nowrap">
                  <Check className="size-3.5" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Contact support to change your email address
            </p>
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
