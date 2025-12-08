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
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  compressImage,
  validateImageFile,
  formatFileSize,
  getNetworkAwareQuality,
  type CompressionResult,
} from "@/lib/utils/image-compression";
import { UserTier, TIER_CONFIG } from "@/lib/types/tier";

// Laurel wreath SVG component for Curator and Visionary tiers
function LaurelWreath({
  size,
  color,
  isVisionary,
}: {
  size: number;
  color: string;
  isVisionary: boolean;
}) {
  const laurelColor = isVisionary ? '#FFD700' : color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ transform: 'scale(1.15)' }}
    >
      {/* Left laurel branch */}
      <g transform="translate(10, 50)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={`left-${i}`}
            cx={8 + i * 2}
            cy={-5 - i * 7}
            rx={4}
            ry={8}
            fill={laurelColor}
            opacity={0.8 + i * 0.03}
            transform={`rotate(${-20 - i * 8}, ${8 + i * 2}, ${-5 - i * 7})`}
          />
        ))}
        {/* Stem */}
        <path
          d="M 5 0 Q 15 -25 20 -45"
          stroke={laurelColor}
          strokeWidth="2"
          fill="none"
          opacity={0.6}
        />
      </g>

      {/* Right laurel branch (mirrored) */}
      <g transform="translate(90, 50) scale(-1, 1)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={`right-${i}`}
            cx={8 + i * 2}
            cy={-5 - i * 7}
            rx={4}
            ry={8}
            fill={laurelColor}
            opacity={0.8 + i * 0.03}
            transform={`rotate(${-20 - i * 8}, ${8 + i * 2}, ${-5 - i * 7})`}
          />
        ))}
        {/* Stem */}
        <path
          d="M 5 0 Q 15 -25 20 -45"
          stroke={laurelColor}
          strokeWidth="2"
          fill="none"
          opacity={0.6}
        />
      </g>

      {/* Sparkle effects for Visionary */}
      {isVisionary && (
        <>
          <circle cx="50" cy="5" r="2" fill="#FFD700" className="animate-pulse" />
          <circle cx="20" cy="25" r="1.5" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
          <circle cx="80" cy="25" r="1.5" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
        </>
      )}
    </svg>
  );
}

// Crown SVG component for Visionary tier
function Crown({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 24 17"
      className={cn('drop-shadow-lg', className)}
    >
      {/* Crown shape */}
      <path
        d="M2 14 L4 6 L8 10 L12 4 L16 10 L20 6 L22 14 Z"
        fill="url(#crownGradientUpload)"
        stroke="#B8860B"
        strokeWidth="0.5"
      />
      {/* Crown base */}
      <rect x="2" y="14" width="20" height="3" rx="1" fill="url(#crownGradientUpload)" stroke="#B8860B" strokeWidth="0.5" />
      {/* Jewels */}
      <circle cx="12" cy="9" r="1.5" fill="#DC2626" />
      <circle cx="6" cy="11" r="1" fill="#3B82F6" />
      <circle cx="18" cy="11" r="1" fill="#3B82F6" />

      <defs>
        <linearGradient id="crownGradientUpload" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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
        throw new Error(error.detail || "Upload failed");
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
        {/* Tier glow effect for higher tiers */}
        {tier !== UserTier.NEWCOMER && (
          <div
            className={`absolute inset-0 rounded-full blur-md opacity-40 ${
              tier === UserTier.MENTOR || tier === UserTier.CURATOR || tier === UserTier.VISIONARY
                ? 'animate-pulse'
                : ''
            }`}
            style={{ backgroundColor: tierColor }}
          />
        )}

        {/* Laurel wreath for Curator and Visionary tiers */}
        {(tier === UserTier.CURATOR || tier === UserTier.VISIONARY) && (
          <LaurelWreath
            size={160} // lg:size-40 = 160px
            color={tierColor}
            isVisionary={tier === UserTier.VISIONARY}
          />
        )}

        {/* Crown for Visionary tier */}
        {tier === UserTier.VISIONARY && (
          <Crown size={28} className="absolute -top-3 left-1/2 -translate-x-1/2 z-20" />
        )}

        {/* Avatar Display */}
        <div
          className="relative size-24 sm:size-32 lg:size-40 rounded-full overflow-hidden shadow-xl"
          style={{
            borderWidth: tier === UserTier.NEWCOMER ? '3px' : '4px',
            borderStyle: 'solid',
            borderColor: tierColor,
            background: `linear-gradient(135deg, ${tierColor}20, ${tierColor}40)`,
          }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                {fullName
                  .split(' ')
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
          )}

          {/* Upload State Overlay */}
          <AnimatePresence>
            {uploadState !== "idle" && uploadState !== "selecting" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center"
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
          className="absolute bottom-0 right-0 size-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center touch-manipulation transition-colors z-10"
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
