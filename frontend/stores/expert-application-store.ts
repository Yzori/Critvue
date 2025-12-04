/**
 * Expert Reviewer Application Store
 * Zustand store with localStorage persistence for auto-save functionality
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ApplicationState,
  Credentials
} from '@/lib/expert-application/types'

const initialCredentials: Credentials = {
  mode: 'quick',
  portfolioLinks: [],
  education: [],
  certifications: [],
  employment: []
}

export const useExpertApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      // Step tracking
      currentStep: 1,
      completedSteps: [],

      // Form data
      personalInfo: {},
      professionalBackground: {},
      skills: [],
      portfolio: [],
      credentials: initialCredentials,
      references: [],
      sampleReview: {},

      // Meta
      startedAt: null,
      lastSavedAt: null,
      isDirty: false,
      hasCelebrated50Percent: false,
      applicationId: undefined,

      // Actions
      setCurrentStep: (step) =>
        set((state) => {
          // Mark previous step as completed when moving forward
          const newCompletedSteps = step > state.currentStep
            ? [...new Set([...state.completedSteps, state.currentStep])]
            : state.completedSteps

          return {
            currentStep: step,
            completedSteps: newCompletedSteps,
            isDirty: true,
            startedAt: state.startedAt || new Date()
          }
        }),

      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
          isDirty: true
        })),

      updatePersonalInfo: (data) =>
        set((state) => ({
          personalInfo: { ...state.personalInfo, ...data },
          isDirty: true,
          startedAt: state.startedAt || new Date()
        })),

      updateProfessionalBackground: (data) =>
        set((state) => ({
          professionalBackground: { ...state.professionalBackground, ...data },
          isDirty: true
        })),

      addSkill: (skill) =>
        set((state) => {
          // If this is the first skill, make it primary
          const isPrimary = state.skills.length === 0 ? true : skill.isPrimary

          return {
            skills: [...state.skills, { ...skill, isPrimary }],
            isDirty: true
          }
        }),

      removeSkill: (skillId) =>
        set((state) => {
          const updatedSkills = state.skills.filter((s) => s.id !== skillId)

          // If we removed the primary skill, make the first remaining skill primary
          const hasPrimary = updatedSkills.some((s) => s.isPrimary)
          if (!hasPrimary && updatedSkills.length > 0) {
            updatedSkills[0].isPrimary = true
          }

          return {
            skills: updatedSkills,
            isDirty: true
          }
        }),

      setPrimarySkill: (skillId) =>
        set((state) => ({
          skills: state.skills.map((s) => ({
            ...s,
            isPrimary: s.id === skillId
          })),
          isDirty: true
        })),

      addPortfolioItem: (item) =>
        set((state) => ({
          portfolio: [...state.portfolio, item],
          isDirty: true
        })),

      removePortfolioItem: (itemId) =>
        set((state) => ({
          portfolio: state.portfolio.filter((item) => item.id !== itemId),
          isDirty: true
        })),

      updatePortfolioItem: (itemId, data) =>
        set((state) => ({
          portfolio: state.portfolio.map((item) =>
            item.id === itemId ? { ...item, ...data } : item
          ),
          isDirty: true
        })),

      addEducation: (education) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            education: [...state.credentials.education, education]
          },
          isDirty: true
        })),

      removeEducation: (educationId) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            education: state.credentials.education.filter((e) => e.id !== educationId)
          },
          isDirty: true
        })),

      updateEducation: (educationId, data) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            education: state.credentials.education.map((e) =>
              e.id === educationId ? { ...e, ...data } : e
            )
          },
          isDirty: true
        })),

      addCertification: (certification) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            certifications: [...state.credentials.certifications, certification]
          },
          isDirty: true
        })),

      removeCertification: (certificationId) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            certifications: state.credentials.certifications.filter(
              (c) => c.id !== certificationId
            )
          },
          isDirty: true
        })),

      updateCertification: (certificationId, data) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            certifications: state.credentials.certifications.map((c) =>
              c.id === certificationId ? { ...c, ...data } : c
            )
          },
          isDirty: true
        })),

      addEmployment: (employment) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            employment: [...state.credentials.employment, employment]
          },
          isDirty: true
        })),

      removeEmployment: (employmentId) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            employment: state.credentials.employment.filter((e) => e.id !== employmentId)
          },
          isDirty: true
        })),

      updateEmployment: (employmentId, data) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            employment: state.credentials.employment.map((e) =>
              e.id === employmentId ? { ...e, ...data } : e
            )
          },
          isDirty: true
        })),

      setCredentialsMode: (mode) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            mode
          },
          isDirty: true
        })),

      addPortfolioLink: (link) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            portfolioLinks: [...(state.credentials.portfolioLinks || []), link]
          },
          isDirty: true
        })),

      removePortfolioLink: (linkId) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            portfolioLinks: (state.credentials.portfolioLinks || []).filter((l) => l.id !== linkId)
          },
          isDirty: true
        })),

      updatePortfolioLink: (linkId, data) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            portfolioLinks: (state.credentials.portfolioLinks || []).map((l) =>
              l.id === linkId ? { ...l, ...data } : l
            )
          },
          isDirty: true
        })),

      addReference: (reference) =>
        set((state) => ({
          references: [...state.references, reference],
          isDirty: true
        })),

      removeReference: (referenceId) =>
        set((state) => ({
          references: state.references.filter((ref) => ref.id !== referenceId),
          isDirty: true
        })),

      updateReference: (referenceId, data) =>
        set((state) => ({
          references: state.references.map((ref) =>
            ref.id === referenceId ? { ...ref, ...data } : ref
          ),
          isDirty: true
        })),

      updateSampleReview: (data) =>
        set((state) => ({
          sampleReview: { ...state.sampleReview, ...data },
          isDirty: true
        })),

      markCelebrated50Percent: () =>
        set({ hasCelebrated50Percent: true }),

      markAsSaved: () =>
        set({
          lastSavedAt: new Date(),
          isDirty: false
        }),

      reset: () =>
        set({
          currentStep: 1,
          completedSteps: [],
          personalInfo: {},
          professionalBackground: {},
          skills: [],
          portfolio: [],
          credentials: initialCredentials,
          references: [],
          sampleReview: {},
          startedAt: null,
          lastSavedAt: null,
          isDirty: false,
          hasCelebrated50Percent: false,
          applicationId: undefined
        })
    }),
    {
      name: 'critvue-expert-application',
      storage: createJSONStorage(() => localStorage),
      // Only persist form data, not UI state
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        personalInfo: state.personalInfo,
        professionalBackground: state.professionalBackground,
        skills: state.skills,
        portfolio: state.portfolio,
        credentials: state.credentials,
        references: state.references,
        sampleReview: state.sampleReview,
        startedAt: state.startedAt,
        lastSavedAt: state.lastSavedAt,
        hasCelebrated50Percent: state.hasCelebrated50Percent,
        applicationId: state.applicationId
      })
    }
  )
)

// Helper hooks for convenience
export const useCurrentStep = () =>
  useExpertApplicationStore((state) => state.currentStep)

export const useCompletedSteps = () =>
  useExpertApplicationStore((state) => state.completedSteps)

export const usePersonalInfo = () =>
  useExpertApplicationStore((state) => state.personalInfo)

export const useProfessionalBackground = () =>
  useExpertApplicationStore((state) => state.professionalBackground)

export const useSkills = () =>
  useExpertApplicationStore((state) => state.skills)

export const usePortfolio = () =>
  useExpertApplicationStore((state) => state.portfolio)

export const useCredentials = () =>
  useExpertApplicationStore((state) => state.credentials)

export const useReferences = () =>
  useExpertApplicationStore((state) => state.references)

export const useSampleReview = () =>
  useExpertApplicationStore((state) => state.sampleReview)

export const useApplicationMeta = () =>
  useExpertApplicationStore((state) => ({
    startedAt: state.startedAt,
    lastSavedAt: state.lastSavedAt,
    isDirty: state.isDirty,
    hasCelebrated50Percent: state.hasCelebrated50Percent,
    applicationId: state.applicationId
  }))
