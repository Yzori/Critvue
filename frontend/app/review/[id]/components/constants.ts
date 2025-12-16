import * as React from "react";
import {
  Video,
  Image,
  Music,
  FileText,
  Camera,
  Palette,
  PenTool,
  Sparkles,
} from "lucide-react";
import { ContentType } from "@/lib/api/reviews/requests";
import { UserTier } from "@/lib/types/tier";

// Content type icons
export const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  video: React.createElement(Video, { className: "size-5" }),
  image: React.createElement(Image, { className: "size-5" }),
  audio: React.createElement(Music, { className: "size-5" }),
  document: React.createElement(FileText, { className: "size-5" }),
  photography: React.createElement(Camera, { className: "size-5" }),
  design: React.createElement(Palette, { className: "size-5" }),
  writing: React.createElement(PenTool, { className: "size-5" }),
  other: React.createElement(Sparkles, { className: "size-5" }),
};

// Tier limits for paid reviews
export const TIER_PAID_LIMITS: Record<UserTier, { canAcceptPaid: boolean; maxPrice: number | null }> = {
  [UserTier.NEWCOMER]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.SUPPORTER]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.GUIDE]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.MENTOR]: { canAcceptPaid: true, maxPrice: 25 },
  [UserTier.CURATOR]: { canAcceptPaid: true, maxPrice: 100 },
  [UserTier.VISIONARY]: { canAcceptPaid: true, maxPrice: null },
};

export function getRequiredTierForPrice(price: number): UserTier {
  if (price <= 25) return UserTier.MENTOR;
  if (price <= 100) return UserTier.CURATOR;
  return UserTier.VISIONARY;
}

export function canTierClaimPrice(tier: UserTier, price: number): boolean {
  const limits = TIER_PAID_LIMITS[tier];
  if (!limits || !limits.canAcceptPaid) return false;
  if (limits.maxPrice === null) return true;
  return price <= limits.maxPrice;
}

// Get file URL helper
export function getFileUrl(file: { file_url?: string | null; filename: string }) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  if (file.file_url?.startsWith("http")) return file.file_url;
  return `${BACKEND_URL}${file.file_url || `/files/${file.filename}`}`;
}

// Check if file is an image
export function isImageFile(file: { file_type: string }) {
  return file.file_type.startsWith("image/");
}

// Format file size
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format deadline
export function formatDeadline(deadline?: string) {
  if (!deadline) return null;
  try {
    const date = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { text: "Expired", variant: "error" as const, urgent: true };
    if (daysUntil === 0) return { text: "Due Today", variant: "error" as const, urgent: true };
    if (daysUntil === 1) return { text: "Due Tomorrow", variant: "warning" as const, urgent: true };
    if (daysUntil <= 3) return { text: `${daysUntil} days left`, variant: "warning" as const, urgent: true };
    if (daysUntil <= 7) return { text: `${daysUntil} days left`, variant: "warning" as const, urgent: false };
    return { text: date.toLocaleDateString(), variant: "info" as const, urgent: false };
  } catch {
    return null;
  }
}

// Status badge variant
export function getStatusConfig(status: string) {
  switch (status) {
    case "draft": return { variant: "neutral" as const, label: "Draft", color: "gray" };
    case "pending": return { variant: "info" as const, label: "Open", color: "blue" };
    case "in_review": return { variant: "warning" as const, label: "In Progress", color: "amber" };
    case "completed": return { variant: "success" as const, label: "Completed", color: "green" };
    case "cancelled": return { variant: "error" as const, label: "Cancelled", color: "red" };
    default: return { variant: "neutral" as const, label: status, color: "gray" };
  }
}
