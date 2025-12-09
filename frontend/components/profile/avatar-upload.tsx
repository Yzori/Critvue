"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { extractApiErrorMessage } from "@/lib/api/client";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  compressImage,
  validateImageFile,
  formatFileSize,
  getNetworkAwareQuality,
  type CompressionResult,
} from "@/lib/utils/image-compression";
import { UserTier, TIER_CONFIG } from "@/lib/types/tier";
import { TieredAvatar } from "@/components/tier/tiered-avatar";

/**
 * Mobile-First Avatar Upload Component
 *
 * Features:
 * - Bottom sheet modal for upload options
 * - Mobile camera integration (capture: "environment" / "user")
 * - Touch-friendly action buttons (48px minimum)
 * - Client-side image compression
 * - Real-time preview with loading states
 * - Network-aware compression quality
 * - Haptic feedback simulation (visual)
 * - Progressive disclosure pattern
 * - Bandwidth-aware upload with progress
 * - One-handed operation optimized
 *
 * Mobile UX Compliance:
 * - All touch targets >= 48px
 * - Bottom sheet for actions (thumb-friendly)
 * - Swipe-to-dismiss support
 * - Immediate visual feedback
 * - Optimized image compression
 * - Landscape/portrait responsive
 */

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUploadComplete: (avatarUrl: string) => void;
  onUploadError?: (error: string) => void;
  tier?: UserTier;
  fullName?: string;
  className?: string;
}

type UploadState =
  | "idle"
  | "selecting"
  | "compressing"
  | "uploading"
  | "success"
  | "error";

export function AvatarUpload({
  currentAvatarUrl,
  onUploadComplete,
  onUploadError,
  tier = UserTier.NEWCOMER,
  fullName = "User",
  className,
}: AvatarUploadProps) {
  const tierInfo = TIER_CONFIG[tier];
  const tierColor = tierInfo.color;
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatarUrl);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection (from gallery or camera)
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Close bottom sheet
    setIsBottomSheetOpen(false);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadState("error");
      setErrorMessage(validation.error || "Invalid file");
      onUploadError?.(validation.error || "Invalid file");
      return;
    }

    try {
      setUploadState("compressing");
      setErrorMessage("");

      // Get network-aware compression quality
      const quality = getNetworkAwareQuality();

      // Compress image
      const compressed = await compressImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality,
        maxSizeMB: 0.5,
        outputFormat: "webp",
      });

      setCompressionInfo(compressed);
      setPreviewUrl(compressed.dataUrl);

      // Upload compressed file
      await uploadAvatar(compressed.file);
    } catch (error) {
      console.error("Compression error:", error);
      setUploadState("error");
      setErrorMessage("Failed to process image");
      onUploadError?.("Failed to process image");
    }
  };

  /**
   * Upload avatar to server
   * Uses httpOnly cookie authentication - no manual token handling needed
   */
  const uploadAvatar = async (file: File) => {
    try {
      setUploadState("uploading");
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Use credentials: 'include' to send httpOnly cookies
      // No Authorization header needed - authentication is via cookies
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/profile/me/avatar`, {
        method: "POST",
        credentials: "include", // Send httpOnly cookies with request
        body: formData,
        // NOTE: Don't set Content-Type header - browser sets it automatically with boundary for FormData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(extractApiErrorMessage(error, "Upload failed"));
      }

      const data = await response.json();

      // Success state
      setUploadState("success");
      setTimeout(() => {
        onUploadComplete(data.avatar_url);
        setUploadState("idle");
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      onUploadError?.(error instanceof Error ? error.message : "Upload failed");
    }
  };

  /**
   * Handle camera capture
   */
  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  /**
   * Handle gallery selection
   */
  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle avatar removal
   */
  const handleRemoveAvatar = async () => {
    setIsBottomSheetOpen(false);
    setPreviewUrl(undefined);
    // TODO: Call API to remove avatar
    onUploadComplete("");
  };

  /**
   * Open action bottom sheet
   */
  const openUploadOptions = () => {
    setIsBottomSheetOpen(true);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user" // Front camera for selfies
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Avatar Preview with Edit Button */}
      <div className="relative inline-block">
        {/* TieredAvatar with premium effects */}
        <div className="relative">
          <TieredAvatar
            avatarUrl={previewUrl}
            fullName={fullName}
            tier={tier}
            size="2xl"
            showTierEffects={true}
          />

          {/* Upload State Overlay */}
          <AnimatePresence>
            {uploadState !== "idle" && uploadState !== "selecting" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center z-20"
              >
                {uploadState === "compressing" && (
                  <div className="text-white text-center">
                    <Loader2 className="size-8 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-medium">Optimizing...</p>
                  </div>
                )}

                {uploadState === "uploading" && (
                  <div className="text-white text-center px-4">
                    <Loader2 className="size-8 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-medium mb-1">Uploading...</p>
                    <div className="w-20 h-1 bg-white/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {uploadState === "success" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="text-white text-center"
                  >
                    <div className="size-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-2">
                      <Check className="size-6" />
                    </div>
                    <p className="text-xs font-medium">Success!</p>
                  </motion.div>
                )}

                {uploadState === "error" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-white text-center"
                  >
                    <div className="size-12 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-2">
                      <AlertCircle className="size-6" />
                    </div>
                    <p className="text-xs font-medium">Failed</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Edit Button - Touch-friendly 48px minimum */}
        <motion.button
          onClick={openUploadOptions}
          className="absolute bottom-1 right-1 size-12 rounded-full border-4 border-background shadow-lg flex items-center justify-center touch-manipulation transition-colors z-30"
          style={{ backgroundColor: tierColor }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={uploadState === "compressing" || uploadState === "uploading"}
          aria-label="Change avatar"
        >
          <Camera className="size-5 text-white" />
        </motion.button>
      </div>

      {/* Compression Info (Dev/Debug) */}
      {compressionInfo && (
        <div className="mt-2 text-xs text-gray-500">
          <p>
            Original: {formatFileSize(compressionInfo.originalSize)} →{" "}
            {formatFileSize(compressionInfo.compressedSize)}
          </p>
          <p>
            Saved: {Math.round((1 - compressionInfo.compressionRatio) * 100)}%
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200"
        >
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="size-4" />
            {errorMessage}
          </p>
        </motion.div>
      )}

      {/* Bottom Sheet - Upload Options */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="Change Avatar"
        description="Choose how you'd like to update your profile photo"
      >
        <div className="space-y-3 pb-safe">
          {/* Camera Option */}
          <motion.button
            onClick={handleCameraCapture}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-accent-blue to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow touch-manipulation min-h-[56px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="size-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Camera className="size-6" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-base">Take Photo</p>
              <p className="text-sm text-white/80">Use your camera</p>
            </div>
          </motion.button>

          {/* Gallery Option */}
          <motion.button
            onClick={handleGallerySelect}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-accent-blue hover:bg-accent-blue/5 transition-all touch-manipulation min-h-[56px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Upload className="size-6 text-gray-700" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-base text-gray-900">
                Choose from Gallery
              </p>
              <p className="text-sm text-gray-600">Select existing photo</p>
            </div>
          </motion.button>

          {/* Remove Option (only if avatar exists) */}
          {previewUrl && (
            <motion.button
              onClick={handleRemoveAvatar}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all touch-manipulation min-h-[56px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="size-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-6 text-red-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-base text-red-700">
                  Remove Photo
                </p>
                <p className="text-sm text-red-600">Delete current avatar</p>
              </div>
            </motion.button>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
