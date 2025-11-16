/**
 * Expert Reviewer Application Page
 * Mobile-first, modern application flow
 */

'use client'

import { useEffect, useState } from 'react'
import { ApplicationContainer } from '@/components/expert-application/application-container'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ExpertApplicationPage() {
  const [showResumeDraft, setShowResumeDraft] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const currentStep = useExpertApplicationStore((state) => state.currentStep)
  const startedAt = useExpertApplicationStore((state) => state.startedAt)
  const reset = useExpertApplicationStore((state) => state.reset)
  const setCurrentStep = useExpertApplicationStore((state) => state.setCurrentStep)

  useEffect(() => {
    // Check if user already has an application
    fetch('http://localhost:8000/api/v1/expert-applications/me/status', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        // Backend returns {has_application: bool, application: {...} | null}
        if (data.has_application && data.application && data.application.status !== 'withdrawn') {
          // User has an existing application that isn't withdrawn, redirect to status page
          window.location.href = '/apply/expert/status'
        } else {
          // No application or withdrawn, allow to apply
          setCheckingStatus(false)

          // Check if there's a saved draft
          if (startedAt && currentStep > 1) {
            setShowResumeDraft(true)
          }
        }
      })
      .catch(err => {
        console.error('Failed to check application status:', err)
        // On error, allow to continue (they might not be authenticated)
        setCheckingStatus(false)

        // Check if there's a saved draft
        if (startedAt && currentStep > 1) {
          setShowResumeDraft(true)
        }
      })
  }, [])

  const handleResumeDraft = () => {
    setShowResumeDraft(false)
  }

  const handleStartFresh = () => {
    reset()
    setShowResumeDraft(false)
  }

  // Show loading while checking application status
  if (checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent mx-auto mb-4" />
          <p className="text-foreground-muted">Checking application status...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Resume Draft Dialog */}
      <AnimatePresence>
        {showResumeDraft && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/50 backdrop-blur-sm"
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
              >
                <Card className="glass-medium max-w-md p-8">
                  <h2 className="mb-4 text-2xl font-bold text-foreground">Welcome Back!</h2>
                  <p className="mb-6 text-foreground-muted">
                    We found your saved application from{' '}
                    {startedAt && formatDistanceToNow(new Date(startedAt), { addSuffix: true })}.
                    You were on step {currentStep} of 8.
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={handleStartFresh}
                      className="flex-1"
                    >
                      Start Fresh
                    </Button>
                    <Button
                      onClick={handleResumeDraft}
                      className="flex-1 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90"
                    >
                      Resume Application
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main Application */}
      <ApplicationContainer />
    </>
  )
}
