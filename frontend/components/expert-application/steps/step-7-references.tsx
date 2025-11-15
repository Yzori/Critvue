/**
 * Step 7: References
 * 3 professional references
 */

'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

interface Step7ReferencesProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step7References({ onValidationChange }: Step7ReferencesProps) {
  const references = useExpertApplicationStore((state) => state.references)

  const isValid = references.length === 3 &&
    references.every(ref => ref.fullName && ref.email && ref.company)

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-[var(--accent-blue)]" />
            Professional References
          </h2>
          <p className="mb-6 text-foreground-muted">
            Provide 3 professional contacts who can speak to your work quality.
          </p>

          <div className="space-y-4">
            {[1, 2, 3].map((num) => {
              const ref = references[num - 1]
              return (
                <div key={num} className="rounded-lg border border-border p-4">
                  <div className="mb-2 font-semibold">Reference {num}</div>
                  {ref ? (
                    <div className="text-sm text-foreground-muted">
                      {ref.fullName} - {ref.company}
                    </div>
                  ) : (
                    <button className="w-full rounded border-2 border-dashed border-border py-2 text-sm text-foreground-muted">
                      + Add Reference {num}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
