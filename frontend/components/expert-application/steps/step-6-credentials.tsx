/**
 * Step 6: Professional Credentials
 * Education, certifications, and employment history
 */

'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Award, Briefcase } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

interface Step6CredentialsProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step6Credentials({ onValidationChange }: Step6CredentialsProps) {
  const credentials = useExpertApplicationStore((state) => state.credentials)

  const isValid = credentials.education.length >= 1 && credentials.employment.length >= 1

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold">Professional Credentials</h2>
          <p className="mb-6 text-foreground-muted">
            Add your education, certifications, and work history.
          </p>

          <div className="space-y-6">
            <CredentialSection
              icon={GraduationCap}
              title="Education"
              count={credentials.education.length}
              required
            />
            <CredentialSection
              icon={Award}
              title="Certifications"
              count={credentials.certifications.length}
            />
            <CredentialSection
              icon={Briefcase}
              title="Employment"
              count={credentials.employment.length}
              required
            />
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

function CredentialSection({ icon: Icon, title, count, required }: any) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[var(--accent-blue)]" />
          <h3 className="font-semibold">{title}</h3>
          {required && <span className="text-sm text-red-600">*</span>}
        </div>
        <span className="text-sm text-foreground-muted">{count} added</span>
      </div>
      <button className="w-full rounded-lg border-2 border-dashed border-border py-3 text-sm text-foreground-muted transition-colors hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]">
        + Add {title}
      </button>
    </div>
  )
}
