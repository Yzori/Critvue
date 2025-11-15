/**
 * Step 2: Personal Information
 * Name, email, phone, location, timezone, LinkedIn
 */

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { personalInfoSchema, type PersonalInfoFormData } from '@/lib/expert-application/validation'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import { getAnimationDuration } from '@/lib/expert-application/auto-save'

interface Step2PersonalInfoProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step2PersonalInfo({ onValidationChange }: Step2PersonalInfoProps) {
  const personalInfo = useExpertApplicationStore((state) => state.personalInfo)
  const updatePersonalInfo = useExpertApplicationStore((state) => state.updatePersonalInfo)
  const animDuration = getAnimationDuration(0.3)

  const {
    register,
    formState: { errors, isValid },
    watch
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: personalInfo.fullName || '',
      email: personalInfo.email || '',
      phone: personalInfo.phone || '',
      location: personalInfo.location || '',
      timezone: personalInfo.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      linkedinUrl: personalInfo.linkedinUrl || ''
    }
  })

  // Watch all fields and update store
  useEffect(() => {
    const subscription = watch((data) => {
      updatePersonalInfo(data as PersonalInfoFormData)
    })
    return () => subscription.unsubscribe()
  }, [watch, updatePersonalInfo])

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animDuration }}
      >
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Personal Information</h2>
          <p className="mb-8 text-foreground-muted">
            Let's start with the basics. All fields are required unless marked optional.
          </p>

          <div className="space-y-6">
            {/* Full Name */}
            <FormField
              icon={User}
              label="Full Name"
              error={errors.fullName?.message}
            >
              <Input
                {...register('fullName')}
                type="text"
                placeholder="Jane Smith"
                autoComplete="name"
                className="h-12"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              />
            </FormField>

            {/* Email */}
            <FormField
              icon={Mail}
              label="Email Address"
              error={errors.email?.message}
            >
              <Input
                {...register('email')}
                type="email"
                placeholder="jane@example.com"
                autoComplete="email"
                className="h-12"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </FormField>

            {/* Phone */}
            <FormField
              icon={Phone}
              label="Phone Number"
              error={errors.phone?.message}
            >
              <Input
                {...register('phone')}
                type="tel"
                placeholder="+1 (555) 123-4567"
                autoComplete="tel"
                inputMode="tel"
                className="h-12"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
            </FormField>

            {/* Location */}
            <FormField
              icon={MapPin}
              label="Location"
              error={errors.location?.message}
              hint="City, Country"
            >
              <Input
                {...register('location')}
                type="text"
                placeholder="San Francisco, USA"
                autoComplete="address-level2"
                className="h-12"
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? 'location-error' : undefined}
              />
            </FormField>

            {/* Timezone */}
            <FormField
              icon={Globe}
              label="Timezone"
              error={errors.timezone?.message}
            >
              <Input
                {...register('timezone')}
                type="text"
                placeholder="America/Los_Angeles"
                className="h-12"
                aria-invalid={!!errors.timezone}
                aria-describedby={errors.timezone ? 'timezone-error' : undefined}
              />
              <p className="mt-1 text-xs text-foreground-muted">
                Current time: {new Date().toLocaleTimeString()}
              </p>
            </FormField>

            {/* LinkedIn (optional) */}
            <FormField
              icon={Linkedin}
              label="LinkedIn Profile"
              error={errors.linkedinUrl?.message}
              optional
            >
              <Input
                {...register('linkedinUrl')}
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                inputMode="url"
                className="h-12"
                aria-invalid={!!errors.linkedinUrl}
                aria-describedby={errors.linkedinUrl ? 'linkedinUrl-error' : undefined}
              />
            </FormField>
          </div>

          {/* Help text */}
          <div className="mt-8 rounded-lg bg-[var(--accent-blue)]/10 p-4">
            <p className="text-sm text-foreground-muted">
              <strong className="text-foreground">Privacy Note:</strong> Your personal information
              will only be used for application review and communication. We never share your data
              with third parties.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

interface FormFieldProps {
  icon: React.ElementType
  label: string
  error?: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
}

function FormField({ icon: Icon, label, error, hint, optional, children }: FormFieldProps) {
  const fieldId = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="flex items-center gap-2 text-base font-medium">
        <Icon className="h-4 w-4 text-[var(--accent-blue)]" />
        {label}
        {optional && (
          <span className="text-sm font-normal text-foreground-muted">(optional)</span>
        )}
      </Label>
      {children}
      {hint && !error && <p className="text-sm text-foreground-muted">{hint}</p>}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="flex items-start gap-1 text-sm text-red-600">
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}
