/**
 * Expert Reviewer Application Validation Schemas
 * Zod validation for all application steps
 */

import { z } from 'zod'

// Step 2: Personal Information
export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Please enter a valid name'),

  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase(),

  phone: z
    .string()
    .regex(/^[\d\s()+\-ext.]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits'),

  location: z
    .string()
    .min(2, 'Please enter your location (city, country)'),

  timezone: z
    .string()
    .min(1, 'Please select your timezone'),

  linkedinUrl: z
    .string()
    .url('Please enter a valid LinkedIn URL')
    .refine(
      (url) => url.includes('linkedin.com'),
      'URL must be a LinkedIn profile'
    )
    .optional()
    .or(z.literal(''))
})

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

// Step 3: Professional Background
export const professionalBackgroundSchema = z.object({
  level: z.enum([
    'industry-professional',
    'senior-specialist',
    'mid-level-expert',
    'emerging-specialist',
    'academic-researcher',
    'other'
  ]),

  customLevel: z
    .string()
    .min(2, 'Please specify your professional level')
    .optional()
    .or(z.literal('')),

  yearsOfExperience: z
    .number()
    .min(0, 'Years of experience must be positive')
    .max(60, 'Please enter a valid number of years'),

  currentRole: z
    .string()
    .min(2, 'Please enter your current role')
    .max(100, 'Role must be less than 100 characters'),

  briefBio: z
    .string()
    .min(150, 'Bio must be at least 150 characters')
    .max(500, 'Bio must be less than 500 characters')
}).refine(
  (data) => {
    if (data.level === 'other') {
      return !!data.customLevel && data.customLevel.length >= 2
    }
    return true
  },
  {
    message: 'Please specify your professional level',
    path: ['customLevel']
  }
)

export type ProfessionalBackgroundFormData = z.infer<typeof professionalBackgroundSchema>

// Step 4: Skills
export const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Skill name is required'),
  category: z.enum(['design', 'code', 'video', 'audio', 'writing', 'art', 'custom']),
  isPrimary: z.boolean()
})

export const skillsSchema = z.object({
  skills: z
    .array(skillSchema)
    .min(1, 'Please select at least 1 skill')
    .max(10, 'You can select up to 10 skills')
    .refine(
      (skills) => skills.filter((s) => s.isPrimary).length >= 1,
      'Please select at least 1 primary skill'
    )
})

export type SkillsFormData = z.infer<typeof skillsSchema>

// Step 5: Portfolio
export const portfolioItemSchema = z.object({
  id: z.string(),
  url: z.string().url('Invalid file URL'),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number().max(10 * 1024 * 1024, 'File must be less than 10MB'),
  title: z.string().min(2, 'Title is required').max(100, 'Title too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  thumbnailUrl: z.string().url().optional(),
  uploadedAt: z.date()
})

export const portfolioSchema = z.object({
  portfolio: z
    .array(portfolioItemSchema)
    .min(3, 'Please upload at least 3 work samples')
    .max(5, 'You can upload up to 5 work samples')
})

export type PortfolioFormData = z.infer<typeof portfolioSchema>

// Step 6: Credentials
export const educationSchema = z.object({
  id: z.string(),
  institution: z.string().min(2, 'Institution name is required'),
  degree: z.string().min(2, 'Degree is required'),
  fieldOfStudy: z.string().min(2, 'Field of study is required'),
  startYear: z
    .number()
    .min(1950, 'Invalid year')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  endYear: z
    .number()
    .min(1950, 'Invalid year')
    .max(new Date().getFullYear() + 10, 'Invalid end year'),
  isCurrent: z.boolean()
}).refine(
  (data) => {
    if (!data.isCurrent) {
      return data.endYear >= data.startYear
    }
    return true
  },
  {
    message: 'End year must be after start year',
    path: ['endYear']
  }
)

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Certification name is required'),
  issuer: z.string().min(2, 'Issuer is required'),
  year: z
    .number()
    .min(1950, 'Invalid year')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  verificationUrl: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal(''))
})

export const employmentSchema = z.object({
  id: z.string(),
  company: z.string().min(2, 'Company name is required'),
  role: z.string().min(2, 'Role is required'),
  startYear: z
    .number()
    .min(1950, 'Invalid year')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  endYear: z
    .number()
    .min(1950, 'Invalid year')
    .max(new Date().getFullYear(), 'Invalid end year')
    .optional(),
  isCurrent: z.boolean()
}).refine(
  (data) => {
    if (!data.isCurrent && data.endYear) {
      return data.endYear >= data.startYear
    }
    return true
  },
  {
    message: 'End year must be after start year',
    path: ['endYear']
  }
)

export const credentialsSchema = z.object({
  education: z
    .array(educationSchema)
    .min(1, 'Please add at least one education entry'),
  certifications: z.array(certificationSchema),
  employment: z
    .array(employmentSchema)
    .min(1, 'Please add at least one employment entry')
})

export type CredentialsFormData = z.infer<typeof credentialsSchema>

// Step 7: References
export const referenceSchema = z.object({
  id: z.string(),
  fullName: z.string().min(2, 'Full name is required'),
  relationship: z.enum(['former-manager', 'colleague', 'client', 'mentor', 'other']),
  customRelationship: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  phone: z
    .string()
    .regex(/^[\d\s()+\-ext.]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  company: z.string().min(2, 'Company name is required')
}).refine(
  (data) => {
    if (data.relationship === 'other') {
      return !!data.customRelationship && data.customRelationship.length >= 2
    }
    return true
  },
  {
    message: 'Please specify the relationship',
    path: ['customRelationship']
  }
)

export const referencesSchema = z.object({
  references: z
    .array(referenceSchema)
    .length(3, 'Please provide exactly 3 references')
    .refine(
      (refs) => {
        const emails = refs.map((r) => r.email.toLowerCase())
        return new Set(emails).size === emails.length
      },
      {
        message: 'Reference emails must be unique'
      }
    )
})

export type ReferencesFormData = z.infer<typeof referencesSchema>

// Step 8: Sample Review
export const sampleReviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Please provide a rating')
    .max(5, 'Rating must be between 1 and 5'),

  strengths: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(500, 'Strengths must be less than 500 characters'),

  areasForImprovement: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(500, 'Must be less than 500 characters'),

  detailedFeedback: z
    .string()
    .min(200, 'Detailed feedback must be at least 200 characters')
    .max(2000, 'Detailed feedback must be less than 2000 characters')
})

export type SampleReviewFormData = z.infer<typeof sampleReviewSchema>

// Complete application validation
export const completeApplicationSchema = z.object({
  personalInfo: personalInfoSchema,
  professionalBackground: professionalBackgroundSchema,
  skills: skillsSchema,
  portfolio: portfolioSchema,
  credentials: credentialsSchema,
  references: referencesSchema,
  sampleReview: sampleReviewSchema
})

export type CompleteApplicationFormData = z.infer<typeof completeApplicationSchema>

// Helper function to validate a specific step
export function validateStep(step: number, data: any): { isValid: boolean; errors: string[] } {
  try {
    switch (step) {
      case 1:
        // Welcome screen - no validation
        return { isValid: true, errors: [] }

      case 2:
        personalInfoSchema.parse(data)
        return { isValid: true, errors: [] }

      case 3:
        professionalBackgroundSchema.parse(data)
        return { isValid: true, errors: [] }

      case 4:
        skillsSchema.parse({ skills: data })
        return { isValid: true, errors: [] }

      case 5:
        portfolioSchema.parse({ portfolio: data })
        return { isValid: true, errors: [] }

      case 6:
        credentialsSchema.parse(data)
        return { isValid: true, errors: [] }

      case 7:
        referencesSchema.parse({ references: data })
        return { isValid: true, errors: [] }

      case 8:
        sampleReviewSchema.parse(data)
        return { isValid: true, errors: [] }

      default:
        return { isValid: false, errors: ['Invalid step number'] }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => e.message)
      }
    }
    return { isValid: false, errors: ['Validation failed'] }
  }
}
