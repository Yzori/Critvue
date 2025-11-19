/**
 * Content Type Configuration with Subcategories
 *
 * Shared configuration for content types across the application
 * Defines icons, colors, labels, and subcategories for each content type
 *
 * Brand Compliance:
 * - Uses Critvue brand colors (accent-blue, accent-peach, accent-sage)
 * - Consistent across all components
 *
 * Subcategories enable:
 * - Specialized rubrics per subcategory
 * - Content-specific annotation tools
 * - Better reviewer matching
 */

import {
  Palette,
  Code,
  Video,
  Mic,
  FileText,
  Image as ImageIcon,
  Monitor,
  Server,
  Database,
  Cloud,
  Smartphone,
  Cpu,
  Layout,
  Sparkles,
  Megaphone,
  Globe,
  Tablet,
  Printer,
  Brush,
  Pencil,
  Box,
  User,
  Layers,
  Radio,
  Music,
  Headphones,
  Waves,
  Film,
  Scissors,
  Play,
  Gamepad2,
  GraduationCap,
  Zap,
  BookOpen,
  FileCode,
  Lightbulb,
  ShoppingBag,
  Clapperboard,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";

export interface Subcategory {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  // Metadata for future use
  supportsAnnotations?: boolean;
  annotationType?: "image" | "waveform" | "timeline" | "code" | "document";
}

export interface ContentTypeConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
  subcategories?: Subcategory[];
}

export const CONTENT_TYPE_CONFIG = {
  code: {
    icon: Code,
    color: "text-accent-blue",
    bg: "bg-accent-blue/10",
    label: "Code",
    subcategories: [
      {
        id: "frontend",
        label: "Frontend / UI",
        icon: Monitor,
        description: "React, Vue, Angular, HTML/CSS, component libraries",
        supportsAnnotations: true,
        annotationType: "code",
      },
      {
        id: "backend",
        label: "Backend / API",
        icon: Server,
        description: "REST APIs, GraphQL, server logic, microservices",
        supportsAnnotations: true,
        annotationType: "code",
      },
      {
        id: "database",
        label: "Database / Query",
        icon: Database,
        description: "SQL, NoSQL, queries, schema design, migrations",
        supportsAnnotations: true,
        annotationType: "code",
      },
      {
        id: "devops",
        label: "DevOps / Infrastructure",
        icon: Cloud,
        description: "CI/CD, Docker, Kubernetes, cloud config, deployment",
        supportsAnnotations: true,
        annotationType: "code",
      },
      {
        id: "mobile",
        label: "Mobile App",
        icon: Smartphone,
        description: "iOS, Android, React Native, Flutter, SwiftUI",
        supportsAnnotations: true,
        annotationType: "code",
      },
      {
        id: "algorithm",
        label: "Algorithm / Logic",
        icon: Cpu,
        description: "Data structures, algorithms, performance optimization",
        supportsAnnotations: true,
        annotationType: "code",
      },
    ],
  },
  design: {
    icon: Palette,
    color: "text-accent-blue",
    bg: "bg-accent-blue/10",
    label: "Design",
    subcategories: [
      {
        id: "ui_ux",
        label: "UI/UX Design",
        icon: Layout,
        description: "App interfaces, user flows, wireframes, prototypes",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "branding",
        label: "Branding / Logo",
        icon: Sparkles,
        description: "Brand identity, logo design, style guides",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "marketing",
        label: "Marketing / Social",
        icon: Megaphone,
        description: "Ad creatives, social media graphics, promotional materials",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "web_design",
        label: "Web Design",
        icon: Globe,
        description: "Landing pages, website layouts, responsive design",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "mobile_design",
        label: "Mobile App Design",
        icon: Tablet,
        description: "iOS/Android app screens, mobile-first design",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "print",
        label: "Print Design",
        icon: Printer,
        description: "Posters, brochures, business cards, packaging",
        supportsAnnotations: true,
        annotationType: "image",
      },
    ],
  },
  art: {
    icon: ImageIcon,
    color: "text-accent-peach",
    bg: "bg-accent-peach/10",
    label: "Art",
    subcategories: [
      {
        id: "illustration",
        label: "Illustration (2D)",
        icon: Brush,
        description: "Digital illustrations, vector art, editorial",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "traditional",
        label: "Traditional / Hand-drawn",
        icon: Pencil,
        description: "Paintings, sketches, watercolor, mixed media",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "3d_modeling",
        label: "3D Modeling",
        icon: Box,
        description: "3D models, sculpting, texturing, rendering",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "concept_art",
        label: "Concept Art",
        icon: Lightbulb,
        description: "Game/film concept art, environment design, prop design",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "character_design",
        label: "Character Design",
        icon: User,
        description: "Character illustrations, turnarounds, costume design",
        supportsAnnotations: true,
        annotationType: "image",
      },
      {
        id: "digital_painting",
        label: "Digital Painting",
        icon: Layers,
        description: "Photorealistic painting, matte painting, fine art",
        supportsAnnotations: true,
        annotationType: "image",
      },
    ],
  },
  audio: {
    icon: Mic,
    color: "text-accent-peach",
    bg: "bg-accent-peach/10",
    label: "Audio",
    subcategories: [
      {
        id: "voiceover",
        label: "Voiceover",
        icon: Radio,
        description: "Narration, character voices, commercial VO",
        supportsAnnotations: true,
        annotationType: "waveform",
      },
      {
        id: "podcast",
        label: "Podcast",
        icon: Headphones,
        description: "Podcast episodes, interview shows, audio storytelling",
        supportsAnnotations: true,
        annotationType: "waveform",
      },
      {
        id: "music",
        label: "Music Composition",
        icon: Music,
        description: "Original songs, instrumentals, film scores",
        supportsAnnotations: true,
        annotationType: "waveform",
      },
      {
        id: "sound_design",
        label: "Sound Design",
        icon: Waves,
        description: "SFX, foley, ambience, game audio, film sound",
        supportsAnnotations: true,
        annotationType: "waveform",
      },
      {
        id: "mixing",
        label: "Audio Mix / Master",
        icon: Layers,
        description: "Mixing, mastering, audio engineering, post-production",
        supportsAnnotations: true,
        annotationType: "waveform",
      },
    ],
  },
  video: {
    icon: Video,
    color: "text-accent-peach",
    bg: "bg-accent-peach/10",
    label: "Video",
    subcategories: [
      {
        id: "filmed",
        label: "Filmed Video",
        icon: Film,
        description: "Live action, interviews, vlogs, documentaries",
        supportsAnnotations: true,
        annotationType: "timeline",
      },
      {
        id: "edited_clip",
        label: "Edited Clip / Reel",
        icon: Scissors,
        description: "Highlight reels, showreels, montages, compilations",
        supportsAnnotations: true,
        annotationType: "timeline",
      },
      {
        id: "animation",
        label: "Animation / Motion Design",
        icon: Play,
        description: "Motion graphics, 2D/3D animation, explainer videos",
        supportsAnnotations: true,
        annotationType: "timeline",
      },
      {
        id: "game_capture",
        label: "Game Capture",
        icon: Gamepad2,
        description: "Gameplay videos, let's plays, walkthroughs",
        supportsAnnotations: true,
        annotationType: "timeline",
      },
      {
        id: "tutorial",
        label: "Tutorial / Educational",
        icon: GraduationCap,
        description: "How-to videos, courses, educational content",
        supportsAnnotations: true,
        annotationType: "timeline",
      },
      {
        id: "short_form",
        label: "Short Form / Social",
        icon: Zap,
        description: "TikTok, Reels, Shorts, social media video content",
        supportsAnnotations: true,
        annotationType: "timeline",
      },
    ],
  },
  writing: {
    icon: FileText,
    color: "text-accent-sage",
    bg: "bg-accent-sage/10",
    label: "Writing",
    subcategories: [
      {
        id: "blog_article",
        label: "Blog / Article",
        icon: BookOpen,
        description: "Blog posts, articles, thought leadership, opinion pieces",
        supportsAnnotations: true,
        annotationType: "document",
      },
      {
        id: "technical",
        label: "Technical Documentation",
        icon: FileCode,
        description: "API docs, user guides, technical specs, README files",
        supportsAnnotations: true,
        annotationType: "document",
      },
      {
        id: "creative",
        label: "Creative / Fiction",
        icon: Lightbulb,
        description: "Short stories, novels, poetry, creative writing",
        supportsAnnotations: true,
        annotationType: "document",
      },
      {
        id: "marketing_copy",
        label: "Marketing Copy",
        icon: ShoppingBag,
        description: "Ad copy, sales pages, email campaigns, product descriptions",
        supportsAnnotations: true,
        annotationType: "document",
      },
      {
        id: "script",
        label: "Script / Screenplay",
        icon: Clapperboard,
        description: "Film scripts, video scripts, dialogue, stage plays",
        supportsAnnotations: true,
        annotationType: "document",
      },
      {
        id: "academic",
        label: "Academic / Research",
        icon: FlaskConical,
        description: "Research papers, essays, academic writing, citations",
        supportsAnnotations: true,
        annotationType: "document",
      },
    ],
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

/**
 * Get subcategories for a content type
 */
export function getSubcategories(contentType: string): Subcategory[] {
  const config = CONTENT_TYPE_CONFIG[contentType as keyof typeof CONTENT_TYPE_CONFIG];
  return config?.subcategories ?? [];
}

/**
 * Get a specific subcategory by ID
 */
export function getSubcategory(
  contentType: string,
  subcategoryId: string
): Subcategory | undefined {
  const subcategories = getSubcategories(contentType);
  return subcategories.find((sub) => sub.id === subcategoryId);
}

/**
 * Check if a content type has subcategories
 */
export function hasSubcategories(contentType: string): boolean {
  const subcategories = getSubcategories(contentType);
  return subcategories.length > 0;
}

/**
 * Get all content types as array
 */
export function getAllContentTypes() {
  return Object.entries(CONTENT_TYPE_CONFIG).map(([id, config]) => ({
    id,
    ...config,
  }));
}
