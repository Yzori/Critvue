/**
 * Step 7: References
 * 3 professional references
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, X, Check, Mail, Phone, Building } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { Reference } from '@/lib/expert-application/types'

interface Step7ReferencesProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step7References({ onValidationChange }: Step7ReferencesProps) {
  const references = useExpertApplicationStore((state) => state.references)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const isValid =
    references.length === 3 &&
    references.every((ref) => ref.fullName && ref.email && ref.company && ref.relationship)

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  // Check for duplicate emails
  const emails = references.map((r) => r.email.toLowerCase())
  const hasDuplicateEmails = emails.length !== new Set(emails).size

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-[var(--accent-blue)]" />
            Professional References
          </h2>
          <p className="mb-4 text-foreground-muted">
            Provide exactly 3 professional contacts who can speak to your work quality.
          </p>

          {/* Progress indicator */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    references[i]
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-muted text-muted-foreground border-2 border-border'
                  }`}
                >
                  {references[i] ? '✓' : i + 1}
                </div>
              ))}
            </div>
            <span className="text-sm text-foreground-muted">
              {references.length}/3 references added
            </span>
          </div>

          <div className="space-y-4">
            {[0, 1, 2].map((index) => {
              const ref = references[index]
              const isEditing = editingIndex === index

              return (
                <div key={index}>
                  {ref && !isEditing ? (
                    <ReferenceItem
                      reference={ref}
                      index={index}
                      onEdit={() => setEditingIndex(index)}
                    />
                  ) : (
                    <ReferenceForm
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

          {/* Validation Messages */}
          {hasDuplicateEmails && (
            <div className="mt-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">
                ⚠️ Each reference must have a unique email address.
              </p>
            </div>
          )}

          {!isValid && references.length === 3 && !hasDuplicateEmails && (
            <div className="mt-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">
                Please fill in all required fields for each reference to continue.
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

// Reference Item Display
function ReferenceItem({
  reference,
  index,
  onEdit,
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
    other: 'Other',
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

// Reference Form
function ReferenceForm({
  index,
  existingReference,
  onClose,
  onSave,
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
    company: existingReference?.company || '',
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
        customRelationship: formData.customRelationship || undefined,
      })
    }

    onSave()
  }

  const handleCancel = () => {
    if (existingReference) {
      onClose()
    } else {
      // If no existing reference, just close (leave empty slot)
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
                relationship: e.target.value as any,
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
            <p className="text-xs text-green-600 mt-1">✓ Valid email format</p>
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
