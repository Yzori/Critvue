'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

// Education Form
export function EducationForm({ onClose }: { onClose: () => void }) {
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

// Certification Form
export function CertificationForm({ onClose }: { onClose: () => void }) {
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

// Employment Form
export function EmploymentForm({ onClose }: { onClose: () => void }) {
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
