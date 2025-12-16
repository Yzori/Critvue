'use client'

import { motion } from 'framer-motion'
import { Users, Plus } from 'lucide-react'
import { useToggle, useModal } from '@/hooks'
import { Button } from '@/components/ui/button'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import { PortfolioLinks } from '@/components/expert-application/portfolio-links'
import { QuickReferenceItem } from './reference-items'
import { QuickReferenceForm } from './reference-forms'

// Quick Mode Content
export function QuickModeContent() {
  const credentials = useExpertApplicationStore((state) => state.credentials)
  const skills = useExpertApplicationStore((state) => state.skills)
  const addPortfolioLink = useExpertApplicationStore((state) => state.addPortfolioLink)
  const removePortfolioLink = useExpertApplicationStore((state) => state.removePortfolioLink)
  const updatePortfolioLink = useExpertApplicationStore((state) => state.updatePortfolioLink)
  const references = useExpertApplicationStore((state) => state.references)
  const editReferenceModal = useModal<string>()
  const addReferenceForm = useToggle()

  // Get skill categories for platform suggestions
  const skillCategories = [...new Set(skills.map(s => s.category))]

  // Fallback for existing stored state
  const portfolioLinks = credentials.portfolioLinks || []

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Portfolio Links Section */}
      <PortfolioLinks
        links={portfolioLinks}
        skillCategories={skillCategories}
        onAdd={addPortfolioLink}
        onRemove={removePortfolioLink}
        onUpdate={updatePortfolioLink}
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-foreground-muted">or</span>
        </div>
      </div>

      {/* References Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--accent-blue)]" />
            <h3 className="font-semibold text-lg">Professional Reference</h3>
            {portfolioLinks.length === 0 && (
              <span className="text-xs text-destructive">* Required if no portfolio links</span>
            )}
          </div>
          <span className="text-sm text-foreground-muted">{references.length} added</span>
        </div>

        <p className="text-sm text-foreground-muted">
          Add a professional contact who can vouch for your work (optional if you have portfolio links).
        </p>

        {/* List of references */}
        {references.length > 0 && (
          <div className="space-y-2">
            {references.map((ref) => (
              <div key={ref.id}>
                {editReferenceModal.data === ref.id ? (
                  <QuickReferenceForm
                    existingReference={ref}
                    onClose={editReferenceModal.close}
                    onSave={editReferenceModal.close}
                  />
                ) : (
                  <QuickReferenceItem
                    reference={ref}
                    onEdit={() => editReferenceModal.open(ref.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Reference Form/Button */}
        {addReferenceForm.value ? (
          <QuickReferenceForm
            onClose={addReferenceForm.setFalse}
            onSave={addReferenceForm.setFalse}
          />
        ) : (
          <Button
            variant="outline"
            onClick={addReferenceForm.setTrue}
            className="w-full border-2 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reference
          </Button>
        )}
      </div>
    </motion.div>
  )
}
