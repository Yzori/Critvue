/**
 * Step 6: Professional Background (Combined Credentials & References)
 * Two modes: Quick (LinkedIn + 1 reference) or Detailed (full credentials + references)
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, FileText, GraduationCap, Award, Briefcase, Users,
  Plus, X, Check, Mail, Phone, Building, Linkedin
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { Education, Certification, Employment, Reference, CredentialsMode } from '@/lib/expert-application/types'

interface Step6ProfessionalBackgroundProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step6ProfessionalBackground({ onValidationChange }: Step6ProfessionalBackgroundProps) {
  const credentials = useExpertApplicationStore((state) => state.credentials)
  const references = useExpertApplicationStore((state) => state.references)
  const setCredentialsMode = useExpertApplicationStore((state) => state.setCredentialsMode)

  const [activeTab, setActiveTab] = useState<'credentials' | 'references'>('credentials')
  const [showEducationForm, setShowEducationForm] = useState(false)
  const [showCertificationForm, setShowCertificationForm] = useState(false)
  const [showEmploymentForm, setShowEmploymentForm] = useState(false)

  const mode = credentials.mode

  // Validation logic
  const isQuickModeValid = !!(credentials.linkedInUrl?.trim()) || references.length >= 1
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
                showEducationForm={showEducationForm}
                setShowEducationForm={setShowEducationForm}
                showCertificationForm={showCertificationForm}
                setShowCertificationForm={setShowCertificationForm}
                showEmploymentForm={showEmploymentForm}
                setShowEmploymentForm={setShowEmploymentForm}
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
                  ? 'Please provide your LinkedIn profile URL or add at least 1 professional reference to continue.'
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

// Quick Mode Content
function QuickModeContent() {
  const credentials = useExpertApplicationStore((state) => state.credentials)
  const updateLinkedInUrl = useExpertApplicationStore((state) => state.updateLinkedInUrl)
  const references = useExpertApplicationStore((state) => state.references)
  const [editingReferenceId, setEditingReferenceId] = useState<string | null>(null)
  const [showAddReference, setShowAddReference] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* LinkedIn Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-[var(--accent-blue)]" />
          <h3 className="font-semibold text-lg">LinkedIn Profile</h3>
          <span className="text-xs text-foreground-muted">(Recommended)</span>
        </div>
        <Input
          type="url"
          value={credentials.linkedInUrl || ''}
          onChange={(e) => updateLinkedInUrl(e.target.value || undefined)}
          placeholder="https://linkedin.com/in/yourprofile"
          className="w-full"
        />
        <p className="text-xs text-foreground-muted">
          Providing your LinkedIn helps us verify your background quickly.
        </p>
      </div>

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
            <span className="text-xs text-destructive">* At least 1 required</span>
          </div>
          <span className="text-sm text-foreground-muted">{references.length} added</span>
        </div>

        <p className="text-sm text-foreground-muted">
          Add at least 1 professional contact who can vouch for your work.
        </p>

        {/* List of references */}
        {references.length > 0 && (
          <div className="space-y-2">
            {references.map((ref) => (
              <div key={ref.id}>
                {editingReferenceId === ref.id ? (
                  <QuickReferenceForm
                    existingReference={ref}
                    onClose={() => setEditingReferenceId(null)}
                    onSave={() => setEditingReferenceId(null)}
                  />
                ) : (
                  <QuickReferenceItem
                    reference={ref}
                    onEdit={() => setEditingReferenceId(ref.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Reference Form/Button */}
        {showAddReference ? (
          <QuickReferenceForm
            onClose={() => setShowAddReference(false)}
            onSave={() => setShowAddReference(false)}
          />
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddReference(true)}
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

// Quick Reference Item Display
function QuickReferenceItem({
  reference,
  onEdit
}: {
  reference: Reference
  onEdit: () => void
}) {
  const removeReference = useExpertApplicationStore((state) => state.removeReference)

  const relationshipLabels: Record<string, string> = {
    'former-manager': 'Former Manager',
    colleague: 'Colleague',
    client: 'Client',
    mentor: 'Mentor',
    other: 'Other'
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold">{reference.fullName}</div>
          <div className="text-sm text-foreground-muted">
            {relationshipLabels[reference.relationship]}
            {reference.customRelationship && ` (${reference.customRelationship})`}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            aria-label="Edit reference"
          >
            <Plus className="w-4 h-4 rotate-45" />
          </button>
          <button
            onClick={() => removeReference(reference.id)}
            className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
            aria-label="Remove reference"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-foreground-muted">
          <Building className="w-4 h-4" />
          {reference.company}
        </div>
        <div className="flex items-center gap-2 text-foreground-muted">
          <Mail className="w-4 h-4" />
          {reference.email}
        </div>
        {reference.phone && (
          <div className="flex items-center gap-2 text-foreground-muted">
            <Phone className="w-4 h-4" />
            {reference.phone}
          </div>
        )}
      </div>
    </div>
  )
}

// Quick Reference Form
function QuickReferenceForm({
  existingReference,
  onClose,
  onSave
}: {
  existingReference?: Reference
  onClose: () => void
  onSave: () => void
}) {
  const addReference = useExpertApplicationStore((state) => state.addReference)
  const updateReference = useExpertApplicationStore((state) => state.updateReference)

  const [formData, setFormData] = useState({
    fullName: existingReference?.fullName || '',
    relationship: existingReference?.relationship || ('colleague' as const),
    customRelationship: existingReference?.customRelationship || '',
    email: existingReference?.email || '',
    phone: existingReference?.phone || '',
    company: existingReference?.company || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (existingReference) {
      updateReference(existingReference.id, formData)
    } else {
      addReference({
        id: `ref-${Date.now()}`,
        ...formData,
        phone: formData.phone || undefined,
        customRelationship: formData.customRelationship || undefined
      })
    }

    onSave()
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-lg border-2 border-[var(--accent-blue)] bg-background p-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">
            {existingReference ? 'Edit' : 'Add'} Reference
          </h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <Label htmlFor="fullName">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g., Jane Smith"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="relationship">
            Relationship <span className="text-destructive">*</span>
          </Label>
          <select
            id="relationship"
            value={formData.relationship}
            onChange={(e) =>
              setFormData({
                ...formData,
                relationship: e.target.value as any
              })
            }
            required
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="former-manager">Former Manager</option>
            <option value="colleague">Colleague</option>
            <option value="client">Client</option>
            <option value="mentor">Mentor</option>
            <option value="other">Other</option>
          </select>
        </div>

        {formData.relationship === 'other' && (
          <div>
            <Label htmlFor="customRelationship">
              Specify Relationship <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customRelationship"
              value={formData.customRelationship}
              onChange={(e) => setFormData({ ...formData, customRelationship: e.target.value })}
              placeholder="e.g., Business Partner"
              required={formData.relationship === 'other'}
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label htmlFor="company">
            Company <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="e.g., Acme Corporation"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jane.smith@example.com"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className="mt-1"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            {existingReference ? 'Update' : 'Add'} Reference
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

// Detailed Mode Content
function DetailedModeContent({
  activeTab,
  setActiveTab,
  showEducationForm,
  setShowEducationForm,
  showCertificationForm,
  setShowCertificationForm,
  showEmploymentForm,
  setShowEmploymentForm
}: {
  activeTab: 'credentials' | 'references'
  setActiveTab: (tab: 'credentials' | 'references') => void
  showEducationForm: boolean
  setShowEducationForm: (show: boolean) => void
  showCertificationForm: boolean
  setShowCertificationForm: (show: boolean) => void
  showEmploymentForm: boolean
  setShowEmploymentForm: (show: boolean) => void
}) {
  const credentials = useExpertApplicationStore((state) => state.credentials)
  const references = useExpertApplicationStore((state) => state.references)

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
              onAdd={() => setShowEducationForm(true)}
              renderItem={(edu: Education) => <EducationItem key={edu.id} education={edu} />}
            />
            {showEducationForm && (
              <EducationForm onClose={() => setShowEducationForm(false)} />
            )}

            {/* Certifications Section */}
            <CredentialSection
              icon={Award}
              title="Certifications"
              count={credentials.certifications.length}
              items={credentials.certifications}
              onAdd={() => setShowCertificationForm(true)}
              renderItem={(cert: Certification) => (
                <CertificationItem key={cert.id} certification={cert} />
              )}
            />
            {showCertificationForm && (
              <CertificationForm onClose={() => setShowCertificationForm(false)} />
            )}

            {/* Employment Section */}
            <CredentialSection
              icon={Briefcase}
              title="Employment"
              count={credentials.employment.length}
              required
              items={credentials.employment}
              onAdd={() => setShowEmploymentForm(true)}
              renderItem={(emp: Employment) => <EmploymentItem key={emp.id} employment={emp} />}
            />
            {showEmploymentForm && (
              <EmploymentForm onClose={() => setShowEmploymentForm(false)} />
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

// Credential Section Component
function CredentialSection({
  icon: Icon,
  title,
  count,
  required,
  items,
  onAdd,
  renderItem
}: {
  icon: any
  title: string
  count: number
  required?: boolean
  items: any[]
  onAdd: () => void
  renderItem: (item: any) => React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[var(--accent-blue)]" />
          <h3 className="font-semibold text-lg">{title}</h3>
          {required && <span className="text-destructive text-sm">* Required</span>}
        </div>
        <span className="text-sm text-foreground-muted">{count} added</span>
      </div>

      {items.length > 0 && <div className="space-y-2">{items.map(renderItem)}</div>}

      <Button variant="outline" onClick={onAdd} className="w-full border-2 border-dashed">
        <Plus className="w-4 h-4 mr-2" />
        Add {title}
      </Button>
    </div>
  )
}

// Education Item Display
function EducationItem({ education }: { education: Education }) {
  const removeEducation = useExpertApplicationStore((state) => state.removeEducation)

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="font-semibold">
          {education.degree} in {education.fieldOfStudy}
        </div>
        <div className="text-sm text-foreground-muted">{education.institution}</div>
        <div className="text-xs text-foreground-muted mt-1">
          {education.startYear} - {education.isCurrent ? 'Present' : education.endYear}
        </div>
      </div>
      <button
        onClick={() => removeEducation(education.id)}
        className="p-1 hover:bg-destructive/10 rounded transition-colors"
        aria-label="Remove education"
      >
        <X className="w-4 h-4 text-destructive" />
      </button>
    </div>
  )
}

// Education Form
function EducationForm({ onClose }: { onClose: () => void }) {
  const addEducation = useExpertApplicationStore((state) => state.addEducation)
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
    isCurrent: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addEducation({
      id: `edu-${Date.now()}`,
      ...formData
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-lg border-2 border-[var(--accent-blue)] bg-background p-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Add Education</h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <Label htmlFor="institution">Institution *</Label>
          <Input
            id="institution"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            placeholder="e.g., MIT, Stanford University"
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="degree">Degree *</Label>
            <Input
              id="degree"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              placeholder="e.g., Bachelor's"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="fieldOfStudy">Field of Study *</Label>
            <Input
              id="fieldOfStudy"
              value={formData.fieldOfStudy}
              onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
              placeholder="e.g., Computer Science"
              required
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startYear">Start Year *</Label>
            <Input
              id="startYear"
              type="number"
              min="1950"
              max={new Date().getFullYear()}
              value={formData.startYear}
              onChange={(e) => setFormData({ ...formData, startYear: parseInt(e.target.value) })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endYear">End Year</Label>
            <Input
              id="endYear"
              type="number"
              min="1950"
              max={new Date().getFullYear() + 10}
              value={formData.endYear}
              onChange={(e) => setFormData({ ...formData, endYear: parseInt(e.target.value) })}
              disabled={formData.isCurrent}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isCurrent"
            checked={formData.isCurrent}
            onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="isCurrent" className="cursor-pointer">
            Currently attending
          </Label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Add Education
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

// Certification Item Display
function CertificationItem({ certification }: { certification: Certification }) {
  const removeCertification = useExpertApplicationStore((state) => state.removeCertification)

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="font-semibold">{certification.name}</div>
        <div className="text-sm text-foreground-muted">{certification.issuer}</div>
        <div className="text-xs text-foreground-muted mt-1">Year: {certification.year}</div>
      </div>
      <button
        onClick={() => removeCertification(certification.id)}
        className="p-1 hover:bg-destructive/10 rounded transition-colors"
        aria-label="Remove certification"
      >
        <X className="w-4 h-4 text-destructive" />
      </button>
    </div>
  )
}

// Certification Form
function CertificationForm({ onClose }: { onClose: () => void }) {
  const addCertification = useExpertApplicationStore((state) => state.addCertification)
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    year: new Date().getFullYear(),
    verificationUrl: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addCertification({
      id: `cert-${Date.now()}`,
      ...formData,
      verificationUrl: formData.verificationUrl || undefined
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-lg border-2 border-[var(--accent-blue)] bg-background p-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Add Certification</h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <Label htmlFor="cert-name">Certification Name *</Label>
          <Input
            id="cert-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., AWS Certified Solutions Architect"
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="issuer">Issuing Organization *</Label>
            <Input
              id="issuer"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              placeholder="e.g., Amazon Web Services"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cert-year">Year Obtained *</Label>
            <Input
              id="cert-year"
              type="number"
              min="1950"
              max={new Date().getFullYear()}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="verificationUrl">Verification URL (optional)</Label>
          <Input
            id="verificationUrl"
            type="url"
            value={formData.verificationUrl}
            onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
            placeholder="https://..."
            className="mt-1"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

// Employment Item Display
function EmploymentItem({ employment }: { employment: Employment }) {
  const removeEmployment = useExpertApplicationStore((state) => state.removeEmployment)

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="font-semibold">{employment.role}</div>
        <div className="text-sm text-foreground-muted">{employment.company}</div>
        <div className="text-xs text-foreground-muted mt-1">
          {employment.startYear} - {employment.isCurrent ? 'Present' : employment.endYear}
        </div>
      </div>
      <button
        onClick={() => removeEmployment(employment.id)}
        className="p-1 hover:bg-destructive/10 rounded transition-colors"
        aria-label="Remove employment"
      >
        <X className="w-4 h-4 text-destructive" />
      </button>
    </div>
  )
}

// Employment Form
function EmploymentForm({ onClose }: { onClose: () => void }) {
  const addEmployment = useExpertApplicationStore((state) => state.addEmployment)
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
    isCurrent: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addEmployment({
      id: `emp-${Date.now()}`,
      ...formData,
      endYear: formData.isCurrent ? undefined : formData.endYear
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-lg border-2 border-[var(--accent-blue)] bg-background p-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Add Employment</h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="e.g., Google, Acme Inc."
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="role">Job Title *</Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="e.g., Senior UX Designer"
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emp-startYear">Start Year *</Label>
            <Input
              id="emp-startYear"
              type="number"
              min="1950"
              max={new Date().getFullYear()}
              value={formData.startYear}
              onChange={(e) => setFormData({ ...formData, startYear: parseInt(e.target.value) })}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emp-endYear">End Year</Label>
            <Input
              id="emp-endYear"
              type="number"
              min="1950"
              max={new Date().getFullYear() + 10}
              value={formData.endYear}
              onChange={(e) => setFormData({ ...formData, endYear: parseInt(e.target.value) })}
              disabled={formData.isCurrent}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="emp-isCurrent"
            checked={formData.isCurrent}
            onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="emp-isCurrent" className="cursor-pointer">
            Currently employed here
          </Label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            Add Employment
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

// Detailed References Section
function DetailedReferencesSection() {
  const references = useExpertApplicationStore((state) => state.references)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

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
        const isEditing = editingIndex === index

        return (
          <div key={index}>
            {ref && !isEditing ? (
              <DetailedReferenceItem
                reference={ref}
                index={index}
                onEdit={() => setEditingIndex(index)}
              />
            ) : (
              <DetailedReferenceForm
                index={index}
                existingReference={ref}
                onClose={() => setEditingIndex(null)}
                onSave={() => setEditingIndex(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Detailed Reference Item
function DetailedReferenceItem({
  reference,
  index,
  onEdit
}: {
  reference: Reference
  index: number
  onEdit: () => void
}) {
  const removeReference = useExpertApplicationStore((state) => state.removeReference)

  const relationshipLabels: Record<string, string> = {
    'former-manager': 'Former Manager',
    colleague: 'Colleague',
    client: 'Client',
    mentor: 'Mentor',
    other: 'Other'
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center">
            <span className="font-bold text-[var(--accent-blue)]">{index + 1}</span>
          </div>
          <div>
            <div className="font-semibold">{reference.fullName}</div>
            <div className="text-sm text-foreground-muted">
              {relationshipLabels[reference.relationship]}
              {reference.customRelationship && ` (${reference.customRelationship})`}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            aria-label="Edit reference"
          >
            <Plus className="w-4 h-4 rotate-45" />
          </button>
          <button
            onClick={() => removeReference(reference.id)}
            className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
            aria-label="Remove reference"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-foreground-muted">
          <Building className="w-4 h-4" />
          {reference.company}
        </div>
        <div className="flex items-center gap-2 text-foreground-muted">
          <Mail className="w-4 h-4" />
          {reference.email}
        </div>
        {reference.phone && (
          <div className="flex items-center gap-2 text-foreground-muted">
            <Phone className="w-4 h-4" />
            {reference.phone}
          </div>
        )}
      </div>
    </div>
  )
}

// Detailed Reference Form
function DetailedReferenceForm({
  index,
  existingReference,
  onClose,
  onSave
}: {
  index: number
  existingReference?: Reference
  onClose: () => void
  onSave: () => void
}) {
  const addReference = useExpertApplicationStore((state) => state.addReference)
  const updateReference = useExpertApplicationStore((state) => state.updateReference)

  const [formData, setFormData] = useState({
    fullName: existingReference?.fullName || '',
    relationship: existingReference?.relationship || ('colleague' as const),
    customRelationship: existingReference?.customRelationship || '',
    email: existingReference?.email || '',
    phone: existingReference?.phone || '',
    company: existingReference?.company || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (existingReference) {
      updateReference(existingReference.id, formData)
    } else {
      addReference({
        id: `ref-${Date.now()}`,
        ...formData,
        phone: formData.phone || undefined,
        customRelationship: formData.customRelationship || undefined
      })
    }

    onSave()
  }

  const handleCancel = () => {
    if (existingReference) {
      onClose()
    } else {
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-lg border-2 border-[var(--accent-blue)] bg-background p-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center">
              <span className="font-bold text-[var(--accent-blue)] text-sm">{index + 1}</span>
            </div>
            {existingReference ? 'Edit' : 'Add'} Reference
          </h4>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <Label htmlFor={`fullName-${index}`}>
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`fullName-${index}`}
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g., Jane Smith"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor={`relationship-${index}`}>
            Relationship <span className="text-destructive">*</span>
          </Label>
          <select
            id={`relationship-${index}`}
            value={formData.relationship}
            onChange={(e) =>
              setFormData({
                ...formData,
                relationship: e.target.value as any
              })
            }
            required
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="former-manager">Former Manager</option>
            <option value="colleague">Colleague</option>
            <option value="client">Client</option>
            <option value="mentor">Mentor</option>
            <option value="other">Other</option>
          </select>
        </div>

        {formData.relationship === 'other' && (
          <div>
            <Label htmlFor={`customRelationship-${index}`}>
              Specify Relationship <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`customRelationship-${index}`}
              value={formData.customRelationship}
              onChange={(e) => setFormData({ ...formData, customRelationship: e.target.value })}
              placeholder="e.g., Business Partner"
              required={formData.relationship === 'other'}
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label htmlFor={`company-${index}`}>
            Company <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`company-${index}`}
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="e.g., Acme Corporation"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor={`email-${index}`}>
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`email-${index}`}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jane.smith@example.com"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor={`phone-${index}`}>Phone (optional)</Label>
          <Input
            id={`phone-${index}`}
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className="mt-1"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            {existingReference ? 'Update' : 'Add'} Reference
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
