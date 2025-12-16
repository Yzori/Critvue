/**
 * Step 6: Professional Background (Combined Credentials & References)
 * Two modes: Quick (LinkedIn + 1 reference) or Detailed (full credentials + references)
 */

'use client'

import { useState, useEffect } from 'react'
import { useToggle } from '@/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { CredentialsMode } from '@/lib/expert-application/types'
import { QuickModeContent } from './quick-mode'
import { DetailedModeContent } from './detailed-mode'

interface Step6ProfessionalBackgroundProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step6ProfessionalBackground({ onValidationChange }: Step6ProfessionalBackgroundProps) {
  const credentials = useExpertApplicationStore((state) => state.credentials)
  const references = useExpertApplicationStore((state) => state.references)
  const setCredentialsMode = useExpertApplicationStore((state) => state.setCredentialsMode)

  const [activeTab, setActiveTab] = useState<'credentials' | 'references'>('credentials')
  const educationForm = useToggle()
  const certificationForm = useToggle()
  const employmentForm = useToggle()

  const mode = credentials.mode

  // Validation logic (with fallbacks for existing stored state)
  const portfolioLinks = credentials.portfolioLinks || []
  const isQuickModeValid = portfolioLinks.length >= 1 || references.length >= 1
  const isDetailedModeValid =
    credentials.education.length >= 1 &&
    credentials.employment.length >= 1 &&
    references.length >= 1

  const isValid = mode === 'quick' ? isQuickModeValid : isDetailedModeValid

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  const handleModeChange = (newMode: CredentialsMode) => {
    setCredentialsMode(newMode)
    // Reset to credentials tab when switching modes
    if (newMode === 'detailed') {
      setActiveTab('credentials')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold">Professional Background</h2>
          <p className="mb-6 text-foreground-muted">
            Choose how you'd like to provide your professional background.
          </p>

          {/* Mode Toggle */}
          <div className="mb-8 flex items-stretch gap-2 p-1.5 bg-muted/50 rounded-xl">
            <button
              onClick={() => handleModeChange('quick')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                font-semibold text-sm transition-all duration-200
                ${mode === 'quick'
                  ? 'bg-[var(--accent-blue)] text-white shadow-md'
                  : 'bg-transparent text-foreground-muted hover:bg-muted/50'
                }
              `}
              style={{ minHeight: '44px' }}
            >
              <Zap className="w-4 h-4" />
              Quick Mode
            </button>
            <button
              onClick={() => handleModeChange('detailed')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                font-semibold text-sm transition-all duration-200
                ${mode === 'detailed'
                  ? 'bg-[var(--accent-blue)] text-white shadow-md'
                  : 'bg-transparent text-foreground-muted hover:bg-muted/50'
                }
              `}
              style={{ minHeight: '44px' }}
            >
              <FileText className="w-4 h-4" />
              Detailed Mode
            </button>
          </div>

          {/* Content based on mode */}
          <AnimatePresence mode="wait">
            {mode === 'quick' ? (
              <QuickModeContent key="quick" />
            ) : (
              <DetailedModeContent
                key="detailed"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                educationForm={educationForm}
                certificationForm={certificationForm}
                employmentForm={employmentForm}
              />
            )}
          </AnimatePresence>

          {/* Validation Message */}
          {!isValid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4"
            >
              <p className="text-sm text-destructive">
                {mode === 'quick'
                  ? 'Please add at least 1 portfolio link or 1 professional reference to continue.'
                  : 'Please add at least 1 education entry, 1 employment entry, and 1 professional reference to continue.'
                }
              </p>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
