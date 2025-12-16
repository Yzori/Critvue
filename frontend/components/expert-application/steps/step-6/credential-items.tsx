'use client'

import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { Education, Certification, Employment } from '@/lib/expert-application/types'

// Credential Section Component
export function CredentialSection({
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
export function EducationItem({ education }: { education: Education }) {
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

// Certification Item Display
export function CertificationItem({ certification }: { certification: Certification }) {
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

// Employment Item Display
export function EmploymentItem({ employment }: { employment: Employment }) {
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
