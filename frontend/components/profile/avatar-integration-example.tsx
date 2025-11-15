/**
 * Avatar Integration Example
 * Demonstrates how to integrate avatar components with AuthContext
 * This is a reference implementation for using avatars throughout the app
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarDisplay } from "./avatar-display";
import { AvatarShowcase } from "./avatar-showcase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

export function AvatarIntegrationExample() {
  const { user, updateUserAvatar } = useAuth();
  const [showShowcase, setShowShowcase] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Handle successful avatar upload
  const handleAvatarUploadComplete = (avatarUrl: string) => {
    // Update the user in AuthContext
    updateUserAvatar(avatarUrl);

    // Show success message
    setUploadStatus({
      type: "success",
      message: "Avatar uploaded successfully! Your profile has been updated.",
    });

    // Clear message after 5 seconds
    setTimeout(() => {
      setUploadStatus({ type: null, message: "" });
    }, 5000);
  };

  // Handle avatar upload error
  const handleAvatarUploadError = (error: string) => {
    setUploadStatus({
      type: "error",
      message: error,
    });

    // Clear message after 5 seconds
    setTimeout(() => {
      setUploadStatus({ type: null, message: "" });
    }, 5000);
  };

  // Handle avatar deletion
  const handleAvatarDelete = async () => {
    // In a real implementation, this would call an API endpoint
    // For now, we'll just update the context
    updateUserAvatar("");

    setUploadStatus({
      type: "success",
      message: "Avatar removed successfully.",
    });

    setTimeout(() => {
      setUploadStatus({ type: null, message: "" });
    }, 5000);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Please log in to manage your avatar.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Avatar Management
        </h1>
        <p className="text-muted-foreground">
          Upload and manage your profile avatar. Your avatar will be displayed
          across the platform in navigation, comments, reviews, and more.
        </p>
      </div>

      {/* Status Messages */}
      {uploadStatus.type && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border ${
            uploadStatus.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {uploadStatus.type === "success" ? (
            <CheckCircle className="size-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="size-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{uploadStatus.message}</p>
        </div>
      )}

      {/* Main Avatar Display with Edit Controls */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar Display */}
          <div className="flex-shrink-0">
            <AvatarDisplay
              avatarUrl={user.avatar_url}
              fullName={user.full_name}
              size="2xl"
              editable
              showUploadButton
              showDeleteButton={!!user.avatar_url}
              onUploadComplete={handleAvatarUploadComplete}
              onDelete={handleAvatarDelete}
            />
          </div>

          {/* Info and Guidelines */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Profile Avatar
              </h2>
              <p className="text-sm text-muted-foreground">
                Your avatar helps other users recognize you across the platform.
                Choose a clear, professional image that represents you.
              </p>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Name:
                </span>
                <span className="text-sm text-muted-foreground">
                  {user.full_name || "Not set"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Email:
                </span>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Verification:
                </span>
                {user.is_verified ? (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs opacity-50">
                    Unverified
                  </Badge>
                )}
              </div>
            </div>

            {/* Guidelines */}
            <div className="p-4 rounded-lg bg-accent-blue/5 border border-accent-blue/10">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Avatar Guidelines
              </h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Accepted formats: JPEG, PNG, WebP, GIF</li>
                <li>• Maximum file size: 5MB</li>
                <li>• Recommended: Square images (1:1 ratio)</li>
                <li>• Minimum resolution: 200x200 pixels</li>
                <li>• Avatar will be displayed in a circular shape</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Brand Compliance Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Brand Compliance
            </h2>
            <p className="text-sm text-muted-foreground">
              All avatar components follow Critvue brand guidelines
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowShowcase(!showShowcase)}
          >
            {showShowcase ? "Hide" : "Show"} Showcase
          </Button>
        </div>

        {/* Brand Tokens Used */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-background-subtle border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Colors
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Gradient: accent-blue to accent-peach</li>
              <li>• Border: white with shadow-lg</li>
              <li>• Verification badge: green-500</li>
              <li>• Fallback background: gradient brand colors</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-background-subtle border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Spacing & Sizing
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Border radius: rounded-full (50%)</li>
              <li>• Border width: 2px (sm) to 4px (lg)</li>
              <li>• Sizes: 24px, 32px, 40px, 48px, 64px, 128px</li>
              <li>• Spacing follows 4px/8px scale</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-background-subtle border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Typography
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Initials: font-bold, text-white</li>
              <li>• Font sizes: scale with avatar size</li>
              <li>• Font family: Inter/system fonts</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-background-subtle border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Animations
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Hover: scale-105 (editable avatars)</li>
              <li>• Upload progress: smooth width transition</li>
              <li>• Duration: 200-300ms ease-out</li>
              <li>• Supports reduced motion preferences</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Showcase */}
      {showShowcase && (
        <AvatarShowcase
          avatarUrl={user.avatar_url}
          fullName={user.full_name}
        />
      )}

      {/* Integration Notes */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Integration Notes
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              1. AuthContext Integration
            </h3>
            <p>
              The avatar components are fully integrated with AuthContext. When
              an avatar is uploaded, it automatically updates the user object
              and persists to localStorage.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">
              2. API Integration
            </h3>
            <p>
              Avatar uploads use the <code className="px-1 py-0.5 bg-muted rounded text-xs">uploadAvatar()</code> function
              from <code className="px-1 py-0.5 bg-muted rounded text-xs">@/lib/api/profile</code>, which handles
              multipart/form-data uploads to the backend.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">
              3. Component Usage
            </h3>
            <p>
              Use <code className="px-1 py-0.5 bg-muted rounded text-xs">Avatar</code> for display-only contexts
              (navigation, comments, reviews). Use{" "}
              <code className="px-1 py-0.5 bg-muted rounded text-xs">AvatarDisplay</code> for editable
              contexts (profile pages, settings).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">
              4. Accessibility
            </h3>
            <p>
              All components include proper alt text, semantic HTML, and
              keyboard navigation support. Verified badges include ARIA
              labels for screen readers.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
