/**
 * Step 6: Professional Credentials
 * Education, certifications, and employment history
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Award, Briefcase, Plus, X, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { Education, Certification, Employment } from '@/lib/expert-application/types'

interface Step6CredentialsProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step6Credentials({ onValidationChange }: Step6CredentialsProps) {
  const credentials = useExpertApplicationStore((state) => state.credentials)
  const [showEducationForm, setShowEducationForm] = useState(false)
  const [showCertificationForm, setShowCertificationForm] = useState(false)
  const [showEmploymentForm, setShowEmploymentForm] = useState(false)

  const isValid = credentials.education.length >= 1 && credentials.employment.length >= 1

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold">Professional Credentials</h2>
          <p className="mb-4 text-foreground-muted">
            Add your education, certifications, and work history.
          </p>

          {/* Quick tip */}
          <div className="mb-6 rounded-lg bg-muted/50 p-4 border border-border">
            <p className="text-sm text-foreground-muted">
              <span className="font-medium text-foreground">Tip:</span> Focus on relevant experience that demonstrates your expertise in the skills you selected.
            </p>
          </div>

          <div className="space-y-8">
            {/* Education Section */}
            <CredentialSection
              icon={GraduationCap}
              title="Education"
              count={credentials.education.length}
              required
              items={credentials.education}
              onAdd={() => setShowEducationForm(true)}
              renderItem={(edu) => (
                <EducationItem key={edu.id} education={edu} />
              )}
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
              renderItem={(cert) => (
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
              renderItem={(emp) => (
                <EmploymentItem key={emp.id} employment={emp} />
              )}
            />
            {showEmploymentForm && (
              <EmploymentForm onClose={() => setShowEmploymentForm(false)} />
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Requirements</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isValid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {isValid ? 'Complete' : 'In Progress'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${credentials.education.length >= 1 ? 'text-green-600' : 'text-foreground-muted'}`}>
                {credentials.education.length >= 1 ? '✓' : '○'} At least 1 education entry
              </div>
              <div className={`flex items-center gap-2 ${credentials.employment.length >= 1 ? 'text-green-600' : 'text-foreground-muted'}`}>
                {credentials.employment.length >= 1 ? '✓' : '○'} At least 1 employment entry
              </div>
              <div className={`flex items-center gap-2 ${credentials.certifications.length >= 1 ? 'text-green-600' : 'text-foreground-muted'}`}>
                {credentials.certifications.length >= 1 ? '✓' : '○'} Certifications (optional)
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

// Section Container
function CredentialSection({ icon: Icon, title, count, required, items, onAdd, renderItem }: any) {
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

      {/* List of items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(renderItem)}
        </div>
      )}

      {/* Add button */}
      <Button
        variant="outline"
        onClick={onAdd}
        className="w-full border-2 border-dashed"
      >
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
        <div className="font-semibold">{education.degree} in {education.fieldOfStudy}</div>
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
    isCurrent: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addEducation({
      id: `edu-${Date.now()}`,
      ...formData,
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
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
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
          <Label htmlFor="isCurrent" className="cursor-pointer">Currently attending</Label>
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
    verificationUrl: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addCertification({
      id: `cert-${Date.now()}`,
      ...formData,
      verificationUrl: formData.verificationUrl || undefined,
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
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
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
    isCurrent: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addEmployment({
      id: `emp-${Date.now()}`,
      ...formData,
      endYear: formData.isCurrent ? undefined : formData.endYear,
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
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
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
          <Label htmlFor="emp-isCurrent" className="cursor-pointer">Currently employed here</Label>
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
