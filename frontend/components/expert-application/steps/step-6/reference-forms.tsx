'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { Reference } from '@/lib/expert-application/types'

// Quick Reference Form
export function QuickReferenceForm({
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
            className={`mt-1 ${formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'border-destructive' : ''}`}
          />
          {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
            <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>
          )}
          {formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
            <p className="text-xs text-green-600 mt-1">Valid email format</p>
          )}
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

// Detailed Reference Form
export function DetailedReferenceForm({
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
            className={`mt-1 ${formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'border-destructive' : ''}`}
          />
          {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
            <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>
          )}
          {formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
            <p className="text-xs text-green-600 mt-1">Valid email format</p>
          )}
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
