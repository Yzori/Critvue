/**
 * Expert Reviewer Application Types
 * Mobile-first, comprehensive type definitions for the application flow
 */

export interface PersonalInfo {
  fullName: string
  email: string
  phone: string
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
  category: 'design' | 'code' | 'video' | 'audio' | 'writing' | 'art' | 'custom'
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

export interface Credentials {
  education: Education[]
  certifications: Certification[]
  employment: Employment[]
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
  addReference: (reference: Reference) => void
  removeReference: (referenceId: string) => void
  updateReference: (referenceId: string, data: Partial<Reference>) => void
  updateSampleReview: (data: Partial<SampleReview>) => void
  markCelebrated50Percent: () => void
  markAsSaved: () => void
  reset: () => void
}

export const TOTAL_STEPS = 8

export const STEP_LABELS = [
  'Welcome',
  'Personal Info',
  'Background',
  'Skills',
  'Portfolio',
  'Credentials',
  'References',
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
    id: 'code',
    label: 'Code',
    icon: '💻',
    skills: [
      'Frontend Development',
      'Backend Development',
      'Full-Stack Development',
      'React',
      'Vue',
      'Angular',
      'TypeScript',
      'JavaScript',
      'Python',
      'Node.js',
      'Go',
      'Java',
      'Mobile Development',
      'iOS',
      'Android',
      'React Native'
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
      'Photography',
      'Photo Editing'
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
  150, // Step 6: Credentials (2.5 minutes)
  120, // Step 7: References (2 minutes)
  300  // Step 8: Sample Review (5 minutes)
] as const
