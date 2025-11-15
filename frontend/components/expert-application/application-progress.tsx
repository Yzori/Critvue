/**
 * Application Progress Indicator
 * Hybrid progress bar with steps, percentage, and time remaining
 */

'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { TOTAL_STEPS, STEP_LABELS, ESTIMATED_STEP_TIMES } from '@/lib/expert-application/types'
import { calculateTimeRemaining, getAnimationDuration } from '@/lib/expert-application/auto-save'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

interface ApplicationProgressProps {
  className?: string
}

export function ApplicationProgress({ className = '' }: ApplicationProgressProps) {
  const currentStep = useExpertApplicationStore((state) => state.currentStep)
  const completedSteps = useExpertApplicationStore((state) => state.completedSteps)
  const startedAt = useExpertApplicationStore((state) => state.startedAt)

  const percentage = (currentStep / TOTAL_STEPS) * 100
  const timeRemaining = calculateTimeRemaining(
    currentStep,
    TOTAL_STEPS,
    ESTIMATED_STEP_TIMES,
    startedAt
  )

  // Color gradient based on progress
  const getProgressColor = (percent: number) => {
    if (percent < 33) return 'from-red-500 to-orange-500'
    if (percent < 66) return 'from-orange-500 to-yellow-500'
    return 'from-yellow-500 to-green-500'
  }

  const animDuration = getAnimationDuration(0.5)

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar with gradient */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className={`h-full bg-gradient-to-r ${getProgressColor(percentage)}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animDuration, ease: 'easeOut' }}
        />
      </div>

      {/* Step indicators */}
      <div className="mt-6 flex items-center justify-between">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
          const stepNumber = index + 1
          const isCompleted = completedSteps.includes(stepNumber)
          const isCurrent = stepNumber === currentStep
          const isPast = stepNumber < currentStep

          return (
            <div key={stepNumber} className="flex flex-col items-center">
              {/* Step circle */}
              <motion.div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  isCurrent
                    ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white'
                    : isCompleted || isPast
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-border-medium bg-background text-foreground-muted'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05, duration: animDuration }}
              >
                {isCompleted || isPast ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{stepNumber}</span>
                )}
              </motion.div>

              {/* Step label (hidden on mobile) */}
              <span className="mt-2 hidden text-xs text-foreground-muted sm:block">
                {STEP_LABELS[index]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress text */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Step {currentStep} of {TOTAL_STEPS}: {STEP_LABELS[currentStep - 1]}
        </span>
        <span className="text-foreground-muted">
          {Math.round(percentage)}% complete
          {timeRemaining > 0 && ` • ~${timeRemaining} min remaining`}
        </span>
      </div>

      {/* Mobile-friendly progress text */}
      <div className="mt-2 block text-xs text-foreground-muted sm:hidden">
        {Math.round(percentage)}% • {timeRemaining > 0 && `~${timeRemaining} min left`}
      </div>
    </div>
  )
}
