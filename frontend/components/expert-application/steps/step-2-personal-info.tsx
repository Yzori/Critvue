/**
 * Step 2: Personal Information
 * Name, email, location, timezone, LinkedIn
 * Auto-fills email and name from logged-in user
 */

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { User, Mail, MapPin, Globe, Linkedin, Lock, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { personalInfoSchema, type PersonalInfoFormData } from '@/lib/expert-application/validation'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import { getAnimationDuration } from '@/lib/expert-application/auto-save'
import { useAuth } from '@/contexts/AuthContext'

// Map common timezones to city/country locations
const TIMEZONE_TO_LOCATION: Record<string, string> = {
  // North America
  'America/New_York': 'New York, USA',
  'America/Chicago': 'Chicago, USA',
  'America/Denver': 'Denver, USA',
  'America/Los_Angeles': 'Los Angeles, USA',
  'America/Phoenix': 'Phoenix, USA',
  'America/Anchorage': 'Anchorage, USA',
  'America/Detroit': 'Detroit, USA',
  'America/Indiana/Indianapolis': 'Indianapolis, USA',
  'America/Toronto': 'Toronto, Canada',
  'America/Vancouver': 'Vancouver, Canada',
  'America/Montreal': 'Montreal, Canada',
  'America/Edmonton': 'Edmonton, Canada',
  'America/Winnipeg': 'Winnipeg, Canada',
  'America/Halifax': 'Halifax, Canada',
  'America/Mexico_City': 'Mexico City, Mexico',
  'America/Tijuana': 'Tijuana, Mexico',

  // Europe
  'Europe/London': 'London, UK',
  'Europe/Paris': 'Paris, France',
  'Europe/Berlin': 'Berlin, Germany',
  'Europe/Madrid': 'Madrid, Spain',
  'Europe/Rome': 'Rome, Italy',
  'Europe/Amsterdam': 'Amsterdam, Netherlands',
  'Europe/Brussels': 'Brussels, Belgium',
  'Europe/Vienna': 'Vienna, Austria',
  'Europe/Zurich': 'Zurich, Switzerland',
  'Europe/Stockholm': 'Stockholm, Sweden',
  'Europe/Oslo': 'Oslo, Norway',
  'Europe/Copenhagen': 'Copenhagen, Denmark',
  'Europe/Helsinki': 'Helsinki, Finland',
  'Europe/Warsaw': 'Warsaw, Poland',
  'Europe/Prague': 'Prague, Czech Republic',
  'Europe/Dublin': 'Dublin, Ireland',
  'Europe/Lisbon': 'Lisbon, Portugal',
  'Europe/Athens': 'Athens, Greece',
  'Europe/Istanbul': 'Istanbul, Turkey',
  'Europe/Moscow': 'Moscow, Russia',
  'Europe/Kiev': 'Kyiv, Ukraine',
  'Europe/Bucharest': 'Bucharest, Romania',
  'Europe/Budapest': 'Budapest, Hungary',

  // Asia
  'Asia/Tokyo': 'Tokyo, Japan',
  'Asia/Seoul': 'Seoul, South Korea',
  'Asia/Shanghai': 'Shanghai, China',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Singapore': 'Singapore',
  'Asia/Taipei': 'Taipei, Taiwan',
  'Asia/Bangkok': 'Bangkok, Thailand',
  'Asia/Jakarta': 'Jakarta, Indonesia',
  'Asia/Manila': 'Manila, Philippines',
  'Asia/Kuala_Lumpur': 'Kuala Lumpur, Malaysia',
  'Asia/Ho_Chi_Minh': 'Ho Chi Minh City, Vietnam',
  'Asia/Kolkata': 'Mumbai, India',
  'Asia/Dubai': 'Dubai, UAE',
  'Asia/Riyadh': 'Riyadh, Saudi Arabia',
  'Asia/Jerusalem': 'Tel Aviv, Israel',
  'Asia/Beirut': 'Beirut, Lebanon',

  // Oceania
  'Australia/Sydney': 'Sydney, Australia',
  'Australia/Melbourne': 'Melbourne, Australia',
  'Australia/Brisbane': 'Brisbane, Australia',
  'Australia/Perth': 'Perth, Australia',
  'Australia/Adelaide': 'Adelaide, Australia',
  'Pacific/Auckland': 'Auckland, New Zealand',
  'Pacific/Honolulu': 'Honolulu, USA',

  // South America
  'America/Sao_Paulo': 'São Paulo, Brazil',
  'America/Buenos_Aires': 'Buenos Aires, Argentina',
  'America/Santiago': 'Santiago, Chile',
  'America/Lima': 'Lima, Peru',
  'America/Bogota': 'Bogotá, Colombia',
  'America/Caracas': 'Caracas, Venezuela',

  // Africa
  'Africa/Cairo': 'Cairo, Egypt',
  'Africa/Johannesburg': 'Johannesburg, South Africa',
  'Africa/Lagos': 'Lagos, Nigeria',
  'Africa/Nairobi': 'Nairobi, Kenya',
  'Africa/Casablanca': 'Casablanca, Morocco',
}

function getLocationFromTimezone(timezone: string): string {
  // Direct match
  if (TIMEZONE_TO_LOCATION[timezone]) {
    return TIMEZONE_TO_LOCATION[timezone]
  }

  // Try to extract city from timezone (e.g., "America/New_York" -> "New York")
  const parts = timezone.split('/')
  if (parts.length >= 2) {
    const city = parts[parts.length - 1].replace(/_/g, ' ')
    return city
  }

  return ''
}

interface Step2PersonalInfoProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step2PersonalInfo({ onValidationChange }: Step2PersonalInfoProps) {
  const { user } = useAuth()
  const personalInfo = useExpertApplicationStore((state) => state.personalInfo)
  const updatePersonalInfo = useExpertApplicationStore((state) => state.updatePersonalInfo)
  const animDuration = getAnimationDuration(0.3)

  // Auto-detect timezone and location
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const detectedLocation = getLocationFromTimezone(detectedTimezone)

  // Pre-fill with user data if available and form is empty
  const defaultEmail = personalInfo.email || user?.email || ''
  const defaultFullName = personalInfo.fullName || user?.full_name || ''

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: defaultFullName,
      email: defaultEmail,
      location: personalInfo.location || detectedLocation,
      timezone: personalInfo.timezone || detectedTimezone,
      linkedinUrl: personalInfo.linkedinUrl || ''
    }
  })

  // Update form when user data becomes available
  useEffect(() => {
    if (user) {
      if (!personalInfo.email && user.email) {
        setValue('email', user.email)
      }
      if (!personalInfo.fullName && user.full_name) {
        setValue('fullName', user.full_name)
      }
    }
  }, [user, personalInfo.email, personalInfo.fullName, setValue])

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

            {/* Email - Read-only, linked to account */}
            <FormField
              icon={Mail}
              label="Email Address"
              error={errors.email?.message}
              hint={user?.email ? "Linked to your Critvue account" : undefined}
            >
              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  className={`h-12 ${user?.email ? 'pr-10 bg-muted/50' : ''}`}
                  readOnly={!!user?.email}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {user?.email && (
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </FormField>

            {/* Location - Auto-detected but editable */}
            <FormField
              icon={MapPin}
              label="Location"
              error={errors.location?.message}
              hint={detectedLocation ? "Auto-detected • Edit if incorrect" : "City, Country"}
              tooltip="Helps match you with creators in similar regions for scheduling."
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

            {/* Timezone - Auto-detected and read-only */}
            <FormField
              icon={Globe}
              label="Timezone"
              error={errors.timezone?.message}
              tooltip="Used to display accurate scheduling times and match you with creators for live sessions."
            >
              <div className="relative">
                <Input
                  {...register('timezone')}
                  type="text"
                  placeholder="America/Los_Angeles"
                  className="h-12 pr-10 bg-muted/50"
                  readOnly
                  aria-invalid={!!errors.timezone}
                  aria-describedby={errors.timezone ? 'timezone-error' : undefined}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-1 text-xs text-foreground-muted flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                Detected automatically • Current time: {new Date().toLocaleTimeString()}
              </p>
            </FormField>

            {/* LinkedIn (optional) */}
            <FormField
              icon={Linkedin}
              label="LinkedIn Profile"
              error={errors.linkedinUrl?.message}
              optional
              tooltip="You can add more portfolio links (Behance, Dribbble, etc.) in Step 6."
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
  tooltip?: string
  optional?: boolean
  children: React.ReactNode
}

function FormField({ icon: Icon, label, error, hint, tooltip, optional, children }: FormFieldProps) {
  const fieldId = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="flex items-center gap-2 text-base font-medium">
        <Icon className="h-4 w-4 text-[var(--accent-blue)]" />
        {label}
        {optional && (
          <span className="text-sm font-normal text-foreground-muted">(optional)</span>
        )}
        {tooltip && (
          <span className="group relative cursor-help">
            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-64 text-center z-50 shadow-lg">
              {tooltip}
              <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900"></span>
            </span>
          </span>
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
