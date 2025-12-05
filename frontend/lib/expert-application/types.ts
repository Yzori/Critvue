/**
 * Expert Reviewer Application Types
 * Mobile-first, comprehensive type definitions for the application flow
 */

export interface PersonalInfo {
  fullName: string
  email: string
  location: string
  timezone: string
  linkedinUrl?: string
}

export interface ProfessionalBackground {
  level: 'industry-professional' | 'senior-specialist' | 'mid-level-expert' | 'emerging-specialist' | 'academic-researcher' | 'other'
  customLevel?: string
  yearsOfExperience: number
  currentRole: string
  briefBio: string
}

export interface Skill {
  id: string
  name: string
  category: 'design' | 'photography' | 'video' | 'audio' | 'writing' | 'art' | 'custom'
  isPrimary: boolean
}

export interface PortfolioItem {
  id: string
  url: string
  fileName: string
  fileType: string
  fileSize: number
  title: string
  description: string
  thumbnailUrl?: string
  uploadedAt: Date
}

export interface Education {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startYear: number
  endYear: number
  isCurrent: boolean
}

export interface Certification {
  id: string
  name: string
  issuer: string
  year: number
  verificationUrl?: string
}

export interface Employment {
  id: string
  company: string
  role: string
  startYear: number
  endYear?: number
  isCurrent: boolean
}

export type CredentialsMode = 'quick' | 'detailed'

// Portfolio link with platform detection
export interface PortfolioLink {
  id: string
  url: string
  platform: string // detected platform name
  platformCategory: 'design' | 'photography' | 'video' | 'audio' | 'writing' | 'code' | 'universal' | 'social' | 'unknown'
}

export interface Credentials {
  mode: CredentialsMode
  portfolioLinks: PortfolioLink[]
  education: Education[]
  certifications: Certification[]
  employment: Employment[]
}

// Platform detection configuration
export const PORTFOLIO_PLATFORMS = {
  // Design
  behance: { name: 'Behance', category: 'design', icon: '🎨', domains: ['behance.net'] },
  dribbble: { name: 'Dribbble', category: 'design', icon: '🏀', domains: ['dribbble.com'] },
  figma: { name: 'Figma Community', category: 'design', icon: '🎯', domains: ['figma.com'] },
  adobeportfolio: { name: 'Adobe Portfolio', category: 'design', icon: '🅰️', domains: ['myportfolio.com', 'adobe.com/portfolio'] },
  cargo: { name: 'Cargo', category: 'design', icon: '📦', domains: ['cargo.site', 'cargocollective.com'] },
  coroflot: { name: 'Coroflot', category: 'design', icon: '🎨', domains: ['coroflot.com'] },

  // Photography
  '500px': { name: '500px', category: 'photography', icon: '📷', domains: ['500px.com'] },
  flickr: { name: 'Flickr', category: 'photography', icon: '📸', domains: ['flickr.com'] },
  vsco: { name: 'VSCO', category: 'photography', icon: '🌅', domains: ['vsco.co'] },
  smugmug: { name: 'SmugMug', category: 'photography', icon: '📷', domains: ['smugmug.com'] },
  format: { name: 'Format', category: 'photography', icon: '🖼️', domains: ['format.com'] },
  pixpa: { name: 'Pixpa', category: 'photography', icon: '📷', domains: ['pixpa.com'] },

  // Video & Motion
  vimeo: { name: 'Vimeo', category: 'video', icon: '🎬', domains: ['vimeo.com'] },
  youtube: { name: 'YouTube', category: 'video', icon: '▶️', domains: ['youtube.com', 'youtu.be'] },
  artstation: { name: 'ArtStation', category: 'video', icon: '🎨', domains: ['artstation.com'] },

  // Audio
  soundcloud: { name: 'SoundCloud', category: 'audio', icon: '🎵', domains: ['soundcloud.com'] },
  bandcamp: { name: 'Bandcamp', category: 'audio', icon: '🎸', domains: ['bandcamp.com'] },
  spotify: { name: 'Spotify', category: 'audio', icon: '🎧', domains: ['spotify.com', 'open.spotify.com'] },
  mixcloud: { name: 'Mixcloud', category: 'audio', icon: '🎛️', domains: ['mixcloud.com'] },
  audius: { name: 'Audius', category: 'audio', icon: '🎶', domains: ['audius.co'] },

  // Writing
  medium: { name: 'Medium', category: 'writing', icon: '✍️', domains: ['medium.com'] },
  substack: { name: 'Substack', category: 'writing', icon: '📰', domains: ['substack.com'] },
  devto: { name: 'Dev.to', category: 'writing', icon: '👩‍💻', domains: ['dev.to'] },
  contently: { name: 'Contently', category: 'writing', icon: '📝', domains: ['contently.com'] },

  // Code
  github: { name: 'GitHub', category: 'code', icon: '💻', domains: ['github.com'] },
  gitlab: { name: 'GitLab', category: 'code', icon: '🦊', domains: ['gitlab.com'] },
  codepen: { name: 'CodePen', category: 'code', icon: '🖊️', domains: ['codepen.io'] },
  replit: { name: 'Replit', category: 'code', icon: '⚡', domains: ['replit.com'] },

  // Universal / Personal
  notion: { name: 'Notion', category: 'universal', icon: '📓', domains: ['notion.so', 'notion.site'] },
  readcv: { name: 'Read.cv', category: 'universal', icon: '📄', domains: ['read.cv'] },
  bento: { name: 'Bento', category: 'universal', icon: '🍱', domains: ['bento.me'] },
  carrd: { name: 'Carrd', category: 'universal', icon: '🃏', domains: ['carrd.co'] },
  linktree: { name: 'Linktree', category: 'universal', icon: '🌳', domains: ['linktr.ee'] },
  webflow: { name: 'Webflow', category: 'universal', icon: '🌐', domains: ['webflow.io'] },
  squarespace: { name: 'Squarespace', category: 'universal', icon: '⬛', domains: ['squarespace.com'] },
  wix: { name: 'Wix', category: 'universal', icon: '🔷', domains: ['wix.com', 'wixsite.com'] },

  // Social / Content
  instagram: { name: 'Instagram', category: 'social', icon: '📱', domains: ['instagram.com'] },
  twitter: { name: 'X (Twitter)', category: 'social', icon: '𝕏', domains: ['twitter.com', 'x.com'] },
  linkedin: { name: 'LinkedIn', category: 'social', icon: '💼', domains: ['linkedin.com'] },
  tiktok: { name: 'TikTok', category: 'social', icon: '🎵', domains: ['tiktok.com'] },
  twitch: { name: 'Twitch', category: 'social', icon: '🎮', domains: ['twitch.tv'] },
} as const

// Helper function to detect platform from URL
export function detectPlatform(url: string): { platform: string; platformCategory: PortfolioLink['platformCategory'] } {
  try {
    const urlObj = new URL(url.toLowerCase())
    const hostname = urlObj.hostname.replace('www.', '')

    for (const [key, config] of Object.entries(PORTFOLIO_PLATFORMS)) {
      if (config.domains.some(domain => hostname.includes(domain))) {
        return { platform: key, platformCategory: config.category as PortfolioLink['platformCategory'] }
      }
    }

    // Check if it's a custom domain (personal portfolio)
    return { platform: 'custom', platformCategory: 'universal' }
  } catch {
    return { platform: 'unknown', platformCategory: 'unknown' }
  }
}

// Get suggested platforms based on skill categories
export function getSuggestedPlatforms(skillCategories: string[]): string[] {
  const suggestions: string[] = []

  const categoryToPlatforms: Record<string, string[]> = {
    design: ['behance', 'dribbble', 'figma', 'adobeportfolio'],
    photography: ['500px', 'flickr', 'vsco', 'format'],
    video: ['vimeo', 'youtube', 'artstation'],
    audio: ['soundcloud', 'bandcamp', 'spotify'],
    writing: ['medium', 'substack', 'contently'],
    art: ['artstation', 'behance', 'dribbble'],
  }

  // Always include universal platforms
  suggestions.push('notion', 'readcv', 'bento')

  for (const category of skillCategories) {
    const platforms = categoryToPlatforms[category]
    if (platforms) {
      suggestions.push(...platforms)
    }
  }

  return [...new Set(suggestions)]
}

export interface Reference {
  id: string
  fullName: string
  relationship: 'former-manager' | 'colleague' | 'client' | 'mentor' | 'other'
  customRelationship?: string
  email: string
  phone?: string
  company: string
}

export interface SampleReview {
  rating: number
  strengths: string
  areasForImprovement: string
  detailedFeedback: string
}

export interface ApplicationState {
  // Step tracking
  currentStep: number
  completedSteps: number[]

  // Form data
  personalInfo: Partial<PersonalInfo>
  professionalBackground: Partial<ProfessionalBackground>
  skills: Skill[]
  portfolio: PortfolioItem[]
  credentials: Credentials
  references: Reference[]
  sampleReview: Partial<SampleReview>

  // Meta
  startedAt: Date | null
  lastSavedAt: Date | null
  isDirty: boolean
  hasCelebrated50Percent: boolean
  applicationId?: string

  // Actions
  setCurrentStep: (step: number) => void
  markStepCompleted: (step: number) => void
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void
  updateProfessionalBackground: (data: Partial<ProfessionalBackground>) => void
  addSkill: (skill: Skill) => void
  removeSkill: (skillId: string) => void
  setPrimarySkill: (skillId: string) => void
  addPortfolioItem: (item: PortfolioItem) => void
  removePortfolioItem: (itemId: string) => void
  updatePortfolioItem: (itemId: string, data: Partial<PortfolioItem>) => void
  addEducation: (education: Education) => void
  removeEducation: (educationId: string) => void
  updateEducation: (educationId: string, data: Partial<Education>) => void
  addCertification: (certification: Certification) => void
  removeCertification: (certificationId: string) => void
  updateCertification: (certificationId: string, data: Partial<Certification>) => void
  addEmployment: (employment: Employment) => void
  removeEmployment: (employmentId: string) => void
  updateEmployment: (employmentId: string, data: Partial<Employment>) => void
  setCredentialsMode: (mode: CredentialsMode) => void
  addPortfolioLink: (link: PortfolioLink) => void
  removePortfolioLink: (linkId: string) => void
  updatePortfolioLink: (linkId: string, data: Partial<PortfolioLink>) => void
  addReference: (reference: Reference) => void
  removeReference: (referenceId: string) => void
  updateReference: (referenceId: string, data: Partial<Reference>) => void
  updateSampleReview: (data: Partial<SampleReview>) => void
  markCelebrated50Percent: () => void
  markAsSaved: () => void
  reset: () => void
}

export const TOTAL_STEPS = 7

export const STEP_LABELS = [
  'Welcome',
  'Personal Info',
  'Background',
  'Skills',
  'Portfolio',
  'Professional Background',
  'Sample Review'
]

export const PROFESSIONAL_LEVELS = [
  {
    value: 'industry-professional',
    label: 'Industry Professional',
    description: '15+ years of experience',
    icon: '👔'
  },
  {
    value: 'senior-specialist',
    label: 'Senior Specialist',
    description: '10-15 years of experience',
    icon: '🎯'
  },
  {
    value: 'mid-level-expert',
    label: 'Mid-Level Expert',
    description: '5-10 years of experience',
    icon: '⚡'
  },
  {
    value: 'emerging-specialist',
    label: 'Emerging Specialist',
    description: '2-5 years of experience',
    icon: '🌱'
  },
  {
    value: 'academic-researcher',
    label: 'Academic/Researcher',
    description: 'Research or academic focus',
    icon: '🎓'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Please specify',
    icon: '✏️'
  }
] as const

export const RELATIONSHIP_TYPES = [
  {
    value: 'former-manager',
    label: 'Former Manager'
  },
  {
    value: 'colleague',
    label: 'Colleague'
  },
  {
    value: 'client',
    label: 'Client'
  },
  {
    value: 'mentor',
    label: 'Mentor'
  },
  {
    value: 'other',
    label: 'Other'
  }
] as const

export const SKILL_CATEGORIES = [
  {
    id: 'design',
    label: 'Design',
    icon: '🎨',
    skills: [
      'UX Design',
      'UI Design',
      'Product Design',
      'Graphic Design',
      'Visual Design',
      'Interaction Design',
      'Design Systems',
      'Prototyping',
      'Figma',
      'Sketch',
      'Adobe XD',
      'Illustration'
    ]
  },
  {
    id: 'photography',
    label: 'Photography',
    icon: '📷',
    skills: [
      'Portrait Photography',
      'Landscape Photography',
      'Product Photography',
      'Fashion Photography',
      'Street Photography',
      'Wildlife Photography',
      'Event Photography',
      'Food Photography',
      'Architectural Photography',
      'Photo Editing',
      'Lightroom',
      'Photoshop',
      'Color Correction',
      'Retouching',
      'Studio Lighting',
      'Composition'
    ]
  },
  {
    id: 'video',
    label: 'Video',
    icon: '🎬',
    skills: [
      'Video Editing',
      'Motion Graphics',
      'Animation',
      'Color Grading',
      'After Effects',
      'Premiere Pro',
      'Final Cut Pro',
      'DaVinci Resolve',
      'Cinema 4D',
      'Blender'
    ]
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: '🎵',
    skills: [
      'Audio Editing',
      'Sound Design',
      'Music Production',
      'Voice Acting',
      'Podcast Production',
      'Mixing',
      'Mastering',
      'Pro Tools',
      'Logic Pro',
      'Ableton Live'
    ]
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: '✍️',
    skills: [
      'Technical Writing',
      'UX Writing',
      'Copywriting',
      'Content Strategy',
      'Editing',
      'Proofreading',
      'Documentation',
      'SEO Writing',
      'Blog Writing',
      'Marketing Copy'
    ]
  },
  {
    id: 'art',
    label: 'Art',
    icon: '🖼️',
    skills: [
      'Digital Art',
      'Traditional Art',
      '3D Modeling',
      'Character Design',
      'Concept Art',
      'Painting',
      'Drawing',
      'Sculpture',
      'Photography'
    ]
  }
] as const

export interface StepValidation {
  isValid: boolean
  errors: string[]
}

export const ESTIMATED_STEP_TIMES = [
  30,  // Step 1: Welcome (30 seconds)
  90,  // Step 2: Personal Info (1.5 minutes)
  60,  // Step 3: Background (1 minute)
  120, // Step 4: Skills (2 minutes)
  180, // Step 5: Portfolio (3 minutes)
  150, // Step 6: Professional Background (2.5 minutes - Quick mode faster)
  300  // Step 7: Sample Review (5 minutes)
] as const
