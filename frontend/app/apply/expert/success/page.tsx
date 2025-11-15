/**
 * Application Success Page
 * Confirmation page after successful submission
 */

'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Home, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

export default function ApplicationSuccessPage() {
  const router = useRouter()
  const applicationId = useExpertApplicationStore((state) => state.applicationId)
  const reset = useExpertApplicationStore((state) => state.reset)

  // Generate a temporary application ID if not set
  const displayId = applicationId || `CR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`

  useEffect(() => {
    // Clear the application data after showing success
    const timer = setTimeout(() => {
      // Don't reset immediately - let user view the page
    }, 60000) // Reset after 1 minute

    return () => clearTimeout(timer)
  }, [])

  const handleReturnHome = () => {
    reset()
    router.push('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--accent-blue)]/10 to-[var(--accent-peach)]/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="glass-heavy p-8 sm:p-12">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"
          >
            <CheckCircle2 className="h-12 w-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 text-center text-3xl font-bold text-foreground sm:text-4xl"
          >
            Application Submitted Successfully!
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 text-center text-lg text-foreground-muted"
          >
            Thank you for applying to become a Critvue expert reviewer.
          </motion.p>

          {/* Application ID */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 rounded-lg bg-[var(--accent-blue)]/10 p-4 text-center"
          >
            <div className="mb-1 text-sm text-foreground-muted">Application ID</div>
            <div className="font-mono text-xl font-bold text-[var(--accent-blue)]">
              {displayId}
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8 space-y-4"
          >
            <h2 className="text-xl font-bold text-foreground">What Happens Next?</h2>

            <div className="space-y-3">
              <NextStep
                number={1}
                text="We'll review your application carefully (3-5 business days)"
              />
              <NextStep
                number={2}
                text="You'll receive an email with our decision and next steps"
              />
              <NextStep
                number={3}
                text="Selected applicants will be invited to a brief onboarding session"
              />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button
              onClick={handleReturnHome}
              className="flex-1 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Homepage
            </Button>

            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Save Application Summary
            </Button>
          </motion.div>

          {/* Footer Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center text-sm text-foreground-muted"
          >
            Questions? Contact us at{' '}
            <a
              href="mailto:experts@critvue.com"
              className="text-[var(--accent-blue)] hover:underline"
            >
              experts@critvue.com
            </a>
          </motion.p>
        </Card>
      </motion.div>
    </div>
  )
}

interface NextStepProps {
  number: number
  text: string
}

function NextStep({ number, text }: NextStepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
        {number}
      </div>
      <p className="pt-1 text-foreground">{text}</p>
    </div>
  )
}
