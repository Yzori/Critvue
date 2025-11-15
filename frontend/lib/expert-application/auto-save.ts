/**
 * Auto-Save Utilities
 * Debounced auto-save functionality for the expert application
 */

import { useEffect, useRef, useCallback } from 'react'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

/**
 * Custom hook for debouncing a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 2000ms / 2 seconds)
 */
export function useDebounce<T>(value: T, delay: number = 2000): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Auto-save hook that monitors store changes and saves to localStorage
 * This is already handled by Zustand persist middleware, but this hook
 * provides additional functionality like save indicators and API sync
 */
export function useAutoSave(apiSaveEnabled: boolean = false) {
  const isDirty = useExpertApplicationStore((state) => state.isDirty)
  const markAsSaved = useExpertApplicationStore((state) => state.markAsSaved)
  const lastSaveAttempt = useRef<number>(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  const saveToAPI = useCallback(async () => {
    if (!apiSaveEnabled) return

    try {
      const state = useExpertApplicationStore.getState()

      // Only save if there's actual data to save
      if (!state.startedAt) return

      const payload = {
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        personalInfo: state.personalInfo,
        professionalBackground: state.professionalBackground,
        skills: state.skills,
        portfolio: state.portfolio,
        credentials: state.credentials,
        references: state.references,
        sampleReview: state.sampleReview,
        applicationId: state.applicationId
      }

      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/expert-application/draft', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // })

      // if (!response.ok) {
      //   throw new Error('Failed to save to API')
      // }

      // const data = await response.json()
      // if (data.applicationId && !state.applicationId) {
      //   useExpertApplicationStore.setState({ applicationId: data.applicationId })
      // }

      console.log('[Auto-Save] Saved to API (stub):', payload)
    } catch (error) {
      console.error('[Auto-Save] Failed to save to API:', error)
      // Don't throw - localStorage still works
    }
  }, [apiSaveEnabled])

  useEffect(() => {
    if (isDirty) {
      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Debounce save - wait 2 seconds of inactivity
      saveTimeoutRef.current = setTimeout(async () => {
        const now = Date.now()

        // Throttle API calls to max once per 5 seconds
        if (now - lastSaveAttempt.current > 5000) {
          await saveToAPI()
          lastSaveAttempt.current = now
        }

        // Mark as saved (localStorage is already saved by Zustand)
        markAsSaved()
      }, 2000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isDirty, markAsSaved, saveToAPI])

  return {
    isSaving: isDirty,
    lastSavedAt: useExpertApplicationStore((state) => state.lastSavedAt)
  }
}

/**
 * Calculate estimated time remaining based on current progress
 */
export function calculateTimeRemaining(
  currentStep: number,
  totalSteps: number,
  stepTimes: readonly number[],
  startTime: Date | string | null
): number {
  if (!startTime) {
    // If not started, use default estimates
    const remainingSteps = totalSteps - currentStep
    const estimatedSeconds = stepTimes
      .slice(currentStep - 1)
      .reduce((sum, time) => sum + time, 0)
    return Math.ceil(estimatedSeconds / 60)
  }

  // Convert string to Date if needed (happens when loaded from localStorage)
  const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime
  const elapsedTime = Date.now() - startDate.getTime()
  const completedSteps = currentStep - 1

  // If we've completed at least one step, calculate average
  const avgTimePerStep = completedSteps > 0
    ? elapsedTime / completedSteps
    : stepTimes[currentStep - 1] * 1000

  const remainingSteps = totalSteps - currentStep
  const estimatedRemaining = remainingSteps * avgTimePerStep

  return Math.ceil(estimatedRemaining / 60000) // Convert to minutes
}

/**
 * Vibration patterns for haptic feedback
 */
export const vibrationPatterns = {
  light: 50,
  success: [50, 100, 50],
  error: [100, 50, 100],
  celebration: [100, 50, 100, 50, 200]
} as const

/**
 * Trigger haptic feedback if supported
 */
export function vibrate(pattern: number | number[]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch (error) {
      // Silently fail - not critical
      console.debug('[Vibration] Not supported or failed:', error)
    }
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get responsive animation duration based on user preferences
 */
export function getAnimationDuration(defaultDuration: number): number {
  return prefersReducedMotion() ? 0.1 : defaultDuration
}

import React from 'react'

// Fix the import issue
