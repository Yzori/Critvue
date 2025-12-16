'use client'

import { X, Plus, Mail, Phone, Building } from 'lucide-react'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { Reference } from '@/lib/expert-application/types'

const RELATIONSHIP_LABELS: Record<string, string> = {
  'former-manager': 'Former Manager',
  colleague: 'Colleague',
  client: 'Client',
  mentor: 'Mentor',
  other: 'Other'
}

// Quick Reference Item Display
export function QuickReferenceItem({
  reference,
  onEdit
}: {
  reference: Reference
  onEdit: () => void
}) {
  const removeReference = useExpertApplicationStore((state) => state.removeReference)

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold">{reference.fullName}</div>
          <div className="text-sm text-foreground-muted">
            {RELATIONSHIP_LABELS[reference.relationship]}
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

// Detailed Reference Item
export function DetailedReferenceItem({
  reference,
  index,
  onEdit
}: {
  reference: Reference
  index: number
  onEdit: () => void
}) {
  const removeReference = useExpertApplicationStore((state) => state.removeReference)

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
              {RELATIONSHIP_LABELS[reference.relationship]}
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
