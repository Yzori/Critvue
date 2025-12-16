'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Award, Briefcase, Users } from 'lucide-react'
import { useToggle, useModal } from '@/hooks'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { Education, Certification, Employment } from '@/lib/expert-application/types'
import { CredentialSection, EducationItem, CertificationItem, EmploymentItem } from './credential-items'
import { EducationForm, CertificationForm, EmploymentForm } from './credential-forms'
import { DetailedReferenceItem } from './reference-items'
import { DetailedReferenceForm } from './reference-forms'

// Detailed Mode Content
export function DetailedModeContent({
  activeTab,
  setActiveTab,
  educationForm,
  certificationForm,
  employmentForm
}: {
  activeTab: 'credentials' | 'references'
  setActiveTab: (tab: 'credentials' | 'references') => void
  educationForm: ReturnType<typeof useToggle>
  certificationForm: ReturnType<typeof useToggle>
  employmentForm: ReturnType<typeof useToggle>
}) {
  const credentials = useExpertApplicationStore((state) => state.credentials)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('credentials')}
          className={`
            px-4 py-2 font-semibold text-sm transition-colors relative
            ${activeTab === 'credentials'
              ? 'text-[var(--accent-blue)]'
              : 'text-foreground-muted hover:text-foreground'
            }
          `}
        >
          Credentials
          {activeTab === 'credentials' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-blue)]"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('references')}
          className={`
            px-4 py-2 font-semibold text-sm transition-colors relative
            ${activeTab === 'references'
              ? 'text-[var(--accent-blue)]'
              : 'text-foreground-muted hover:text-foreground'
            }
          `}
        >
          References
          {activeTab === 'references' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-blue)]"
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'credentials' ? (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-8"
          >
            {/* Education Section */}
            <CredentialSection
              icon={GraduationCap}
              title="Education"
              count={credentials.education.length}
              required
              items={credentials.education}
              onAdd={educationForm.setTrue}
              renderItem={(edu: Education) => <EducationItem key={edu.id} education={edu} />}
            />
            {educationForm.value && (
              <EducationForm onClose={educationForm.setFalse} />
            )}

            {/* Certifications Section */}
            <CredentialSection
              icon={Award}
              title="Certifications"
              count={credentials.certifications.length}
              items={credentials.certifications}
              onAdd={certificationForm.setTrue}
              renderItem={(cert: Certification) => (
                <CertificationItem key={cert.id} certification={cert} />
              )}
            />
            {certificationForm.value && (
              <CertificationForm onClose={certificationForm.setFalse} />
            )}

            {/* Employment Section */}
            <CredentialSection
              icon={Briefcase}
              title="Employment"
              count={credentials.employment.length}
              required
              items={credentials.employment}
              onAdd={employmentForm.setTrue}
              renderItem={(emp: Employment) => <EmploymentItem key={emp.id} employment={emp} />}
            />
            {employmentForm.value && (
              <EmploymentForm onClose={employmentForm.setFalse} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="references"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <DetailedReferencesSection />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Detailed References Section
export function DetailedReferencesSection() {
  const references = useExpertApplicationStore((state) => state.references)
  const editingModal = useModal<number>()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--accent-blue)]" />
          <h3 className="font-semibold text-lg">Professional References</h3>
          <span className="text-destructive text-sm">* At least 1 required</span>
        </div>
        <span className="text-sm text-foreground-muted">{references.length} / 3</span>
      </div>

      <p className="text-sm text-foreground-muted">
        Provide 1-3 professional contacts who can speak to your work quality.
      </p>

      {[0, 1, 2].map((index) => {
        const ref = references[index]
        const isEditing = editingModal.data === index

        return (
          <div key={index}>
            {ref && !isEditing ? (
              <DetailedReferenceItem
                reference={ref}
                index={index}
                onEdit={() => editingModal.open(index)}
              />
            ) : (
              <DetailedReferenceForm
                index={index}
                existingReference={ref}
                onClose={editingModal.close}
                onSave={editingModal.close}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
