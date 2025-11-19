/**
 * Content Type Configuration
 *
 * Shared configuration for content types across the application
 * Defines icons, colors, and labels for each content type
 *
 * Brand Compliance:
 * - Uses Critvue brand colors (accent-blue, accent-peach, accent-sage)
 * - Consistent across all components
 */

import {
  Palette,
  Code,
  Video,
  Mic,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

export interface ContentTypeConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

export const CONTENT_TYPE_CONFIG = {
  design: {
    icon: Palette,
    color: "text-accent-blue",
    bg: "bg-accent-blue/10",
    label: "Design",
  },
  code: {
    icon: Code,
    color: "text-accent-blue",
    bg: "bg-accent-blue/10",
    label: "Code",
  },
  video: {
    icon: Video,
    color: "text-accent-peach",
    bg: "bg-accent-peach/10",
    label: "Video",
  },
  audio: {
    icon: Mic,
    color: "text-accent-peach",
    bg: "bg-accent-peach/10",
    label: "Audio",
  },
  writing: {
    icon: FileText,
    color: "text-accent-sage",
    bg: "bg-accent-sage/10",
    label: "Writing",
  },
  art: {
    icon: ImageIcon,
    color: "text-accent-peach",
    bg: "bg-accent-peach/10",
    label: "Art",
  },
};

/**
 * Get content type configuration with fallback
 */
export function getContentTypeConfig(
  contentType: string | undefined | null
): ContentTypeConfig {
  if (!contentType) {
    return CONTENT_TYPE_CONFIG.design;
  }

  const config = CONTENT_TYPE_CONFIG[contentType as keyof typeof CONTENT_TYPE_CONFIG];
  return config ?? CONTENT_TYPE_CONFIG.design;
}
