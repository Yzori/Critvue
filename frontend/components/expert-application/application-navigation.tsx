/**
 * Application Navigation
 * Bottom fixed navigation with prev/next buttons
 */

'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOTAL_STEPS } from '@/lib/expert-application/types'
import { vibrate, vibrationPatterns } from '@/lib/expert-application/auto-save'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

interface ApplicationNavigationProps {
  onNext: () => void
  onPrevious: () => void
  onSaveAndExit: () => void
  isNextDisabled?: boolean
  nextLabel?: string
  className?: string
}

export function ApplicationNavigation({
  onNext,
  onPrevious,
  onSaveAndExit,
  isNextDisabled = false,
  nextLabel,
  className = ''
}: ApplicationNavigationProps) {
  const currentStep = useExpertApplicationStore((state) => state.currentStep)

  const handleNext = () => {
    if (!isNextDisabled) {
      vibrate(vibrationPatterns.light)
      onNext()
    } else {
      vibrate(vibrationPatterns.error)
    }
  }

  const handlePrevious = () => {
    vibrate(vibrationPatterns.light)
    onPrevious()
  }

  const handleSaveAndExit = () => {
    vibrate(vibrationPatterns.success)
    onSaveAndExit()
  }

  const getNextLabel = () => {
    if (nextLabel) return nextLabel
    if (currentStep === TOTAL_STEPS) return 'Submit Application'
    return 'Continue'
  }

  const showPrevious = currentStep > 1
  const showSaveAndExit = currentStep > 1 && currentStep < TOTAL_STEPS

  return (
    <motion.div
      className={`fixed bottom-0 left-0 right-0 z-[var(--z-sticky-nav)] border-t border-border bg-background/95 backdrop-blur-md pb-safe ${className}`}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Previous button */}
        <div className="flex-1">
          {showPrevious && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="touch-manipulation w-full sm:w-auto"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {/* Save and exit (mobile: icon only, desktop: with text) */}
        {showSaveAndExit && (
          <Button
            variant="ghost"
            onClick={handleSaveAndExit}
            className="touch-manipulation hidden sm:flex"
          >
            <Save className="mr-2 h-4 w-4" />
            Save & Exit
          </Button>
        )}

        {showSaveAndExit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSaveAndExit}
            className="touch-manipulation flex sm:hidden"
            aria-label="Save and exit"
          >
            <Save className="h-5 w-5" />
          </Button>
        )}

        {/* Next button */}
        <div className="flex-1">
          <Button
            onClick={handleNext}
            disabled={isNextDisabled}
            className="touch-manipulation ml-auto flex w-full bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90 sm:w-auto"
          >
            {getNextLabel()}
            {currentStep < TOTAL_STEPS && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
