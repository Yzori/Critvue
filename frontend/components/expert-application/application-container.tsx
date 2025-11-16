/**
 * Expert Application Container
 * Main container coordinating all steps with progress tracking and navigation
 */

'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ApplicationProgress } from './application-progress'
import { ApplicationNavigation } from './application-navigation'
import { AutoSaveIndicator } from './auto-save-indicator'
import { CelebrationModal } from './celebration-modal'
import { Step1Welcome } from './steps/step-1-welcome'
import { Step2PersonalInfo } from './steps/step-2-personal-info'
import { Step3ProfessionalBackground } from './steps/step-3-professional-background'
import { Step4Skills } from './steps/step-4-skills'
import { Step5Portfolio } from './steps/step-5-portfolio'
import { Step6ProfessionalBackground } from './steps/step-6-professional-background'
import { Step8SampleReview } from './steps/step-8-sample-review'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import { TOTAL_STEPS } from '@/lib/expert-application/types'
import { getAnimationDuration, vibrate, vibrationPatterns } from '@/lib/expert-application/auto-save'

type CelebrationType = '50-percent' | '100-percent' | null

export function ApplicationContainer() {
  const router = useRouter()
  const [isStepValid, setIsStepValid] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationType>(null)

  const currentStep = useExpertApplicationStore((state) => state.currentStep)
  const setCurrentStep = useExpertApplicationStore((state) => state.setCurrentStep)
  const markStepCompleted = useExpertApplicationStore((state) => state.markStepCompleted)
  const hasCelebrated50Percent = useExpertApplicationStore((state) => state.hasCelebrated50Percent)
  const markCelebrated50Percent = useExpertApplicationStore((state) => state.markCelebrated50Percent)

  // Check if we should show 50% celebration
  useEffect(() => {
    if (currentStep === Math.ceil(TOTAL_STEPS / 2) && !hasCelebrated50Percent) {
      setCelebration('50-percent')
      markCelebrated50Percent()
    }
  }, [currentStep, hasCelebrated50Percent, markCelebrated50Percent])

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      markStepCompleted(currentStep)
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Submit application
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSaveAndExit = () => {
    vibrate(vibrationPatterns.success)
    router.push('/')
  }

  const handleSubmit = async () => {
    try {
      const state = useExpertApplicationStore.getState()

      const applicationData = {
        personalInfo: state.personalInfo,
        professionalBackground: state.professionalBackground,
        skills: state.skills,
        portfolio: state.portfolio,
        credentials: state.credentials,
        references: state.references,
        sampleReview: state.sampleReview
      }

      // Step 1: Create draft application
      const createResponse = await fetch('http://localhost:8000/api/v1/expert-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: state.personalInfo.email || '',
          full_name: state.personalInfo.fullName || '',
          application_data: applicationData
        })
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        console.error('Failed to create draft:', errorData)
        throw new Error(errorData.detail || 'Failed to create application')
      }

      const createdApp = await createResponse.json()

      // Step 2: Submit the draft
      const submitResponse = await fetch(`http://localhost:8000/api/v1/expert-applications/${createdApp.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          application_data: applicationData
        })
      })

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json()
        console.error('Failed to submit application:', errorData)
        throw new Error(errorData.detail || 'Failed to submit application')
      }

      const submittedApp = await submitResponse.json()

      // Show 100% celebration
      setCelebration('100-percent')

      // Navigate to status page after celebration
      setTimeout(() => {
        router.push('/apply/expert/status')
      }, 4000)
    } catch (error) {
      console.error('Failed to submit application:', error)
      alert(`Failed to submit application: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const renderStep = () => {
    const stepProps = {
      onValidationChange: setIsStepValid
    }

    switch (currentStep) {
      case 1:
        return <Step1Welcome />
      case 2:
        return <Step2PersonalInfo {...stepProps} />
      case 3:
        return <Step3ProfessionalBackground {...stepProps} />
      case 4:
        return <Step4Skills {...stepProps} />
      case 5:
        return <Step5Portfolio {...stepProps} />
      case 6:
        return <Step6ProfessionalBackground {...stepProps} />
      case 7:
        return <Step8SampleReview {...stepProps} />
      default:
        return <Step1Welcome />
    }
  }

  // Step 1 is always valid (welcome screen)
  const isNextEnabled = currentStep === 1 || isStepValid

  const animDuration = getAnimationDuration(0.3)

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header with auto-save indicator */}
      <div className="sticky top-0 z-[var(--z-sticky-nav)] border-b border-border bg-background/95 backdrop-blur-md pt-safe">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-foreground">Expert Application</h1>
          <AutoSaveIndicator />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <ApplicationProgress />
      </div>

      {/* Step content with animation */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: animDuration }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <ApplicationNavigation
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSaveAndExit={handleSaveAndExit}
        isNextDisabled={!isNextEnabled}
      />

      {/* Celebration modals */}
      <CelebrationModal
        isOpen={celebration === '50-percent'}
        onClose={() => setCelebration(null)}
        type="50-percent"
      />

      <CelebrationModal
        isOpen={celebration === '100-percent'}
        onClose={() => setCelebration(null)}
        type="100-percent"
      />
    </div>
  )
}
