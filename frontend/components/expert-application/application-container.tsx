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
import { Step6Credentials } from './steps/step-6-credentials'
import { Step7References } from './steps/step-7-references'
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

      // TODO: Submit to API
      console.log('Submitting application:', applicationData)

      // Show 100% celebration
      setCelebration('100-percent')

      // Navigate to success page after celebration
      setTimeout(() => {
        router.push('/apply/expert/success')
      }, 4000)
    } catch (error) {
      console.error('Failed to submit application:', error)
      // TODO: Show error toast
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
        return <Step6Credentials {...stepProps} />
      case 7:
        return <Step7References {...stepProps} />
      case 8:
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
