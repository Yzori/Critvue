/**
 * Step 3: Professional Background
 * Experience level, current role, and brief bio
 */

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Briefcase } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PROFESSIONAL_LEVELS } from '@/lib/expert-application/types'
import { professionalBackgroundSchema, type ProfessionalBackgroundFormData } from '@/lib/expert-application/validation'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import { getAnimationDuration } from '@/lib/expert-application/auto-save'

interface Step3ProfessionalBackgroundProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step3ProfessionalBackground({ onValidationChange }: Step3ProfessionalBackgroundProps) {
  const professionalBackground = useExpertApplicationStore((state) => state.professionalBackground)
  const updateProfessionalBackground = useExpertApplicationStore((state) => state.updateProfessionalBackground)
  const animDuration = getAnimationDuration(0.3)

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger
  } = useForm<ProfessionalBackgroundFormData>({
    resolver: zodResolver(professionalBackgroundSchema),
    mode: 'onChange',
    defaultValues: {
      level: (professionalBackground.level as any) || undefined,
      customLevel: professionalBackground.customLevel || '',
      yearsOfExperience: professionalBackground.yearsOfExperience || 1,
      currentRole: professionalBackground.currentRole || '',
      briefBio: professionalBackground.briefBio || ''
    }
  })

  const yearsValue = watch('yearsOfExperience') || 1

  const selectedLevel = watch('level')

  // Trigger validation on mount to check saved data
  useEffect(() => {
    trigger()
  }, [trigger])

  useEffect(() => {
    const subscription = watch((data) => {
      updateProfessionalBackground(data as any)
    })
    return () => subscription.unsubscribe()
  }, [watch, updateProfessionalBackground])

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
          <h2 className="mb-2 text-2xl font-bold text-foreground">Professional Background</h2>
          <p className="mb-8 text-foreground-muted">
            Tell us about your professional experience and expertise.
          </p>

          <div className="space-y-6">
            {/* Professional Level */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Professional Level</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {PROFESSIONAL_LEVELS.map((level) => (
                  <label
                    key={level.value}
                    className="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={level.value}
                      {...register('level')}
                      className="peer sr-only"
                    />
                    <div className="flex h-full min-h-[80px] items-start gap-3 rounded-lg border-2 border-border bg-background p-4 transition-all peer-checked:border-[var(--accent-blue)] peer-checked:bg-[var(--accent-blue)]/5">
                      <span className="text-2xl">{level.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{level.label}</div>
                        <div className="text-sm text-foreground-muted">{level.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.level && (
                <p role="alert" className="text-sm text-red-600">
                  ⚠ {errors.level.message}
                </p>
              )}
            </div>

            {/* Custom Level (if "Other" selected) */}
            {selectedLevel === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="customLevel">Please specify your professional level</Label>
                <Input
                  {...register('customLevel')}
                  id="customLevel"
                  placeholder="e.g., Freelance Consultant"
                  className="h-12"
                />
                {errors.customLevel && (
                  <p role="alert" className="text-sm text-red-600">
                    ⚠ {errors.customLevel.message}
                  </p>
                )}
              </motion.div>
            )}

            {/* Years of Experience */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <span className="text-2xl font-bold text-[var(--accent-blue)]">
                  {yearsValue}
                </span>
              </div>
              <input
                type="range"
                id="yearsOfExperience"
                min="0"
                max="50"
                step="1"
                value={yearsValue}
                onChange={(e) => setValue('yearsOfExperience', parseInt(e.target.value), { shouldValidate: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent-blue)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-blue)] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--accent-blue)] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-foreground-muted">
                <span>0 years</span>
                <span>25 years</span>
                <span>50+ years</span>
              </div>
              {errors.yearsOfExperience && (
                <p role="alert" className="text-sm text-red-600">
                  ⚠ {errors.yearsOfExperience.message}
                </p>
              )}
            </div>

            {/* Current Role */}
            <div className="space-y-2">
              <Label htmlFor="currentRole" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[var(--accent-blue)]" />
                Current Role
              </Label>
              <Input
                {...register('currentRole')}
                id="currentRole"
                placeholder="Senior Product Designer"
                autoComplete="organization-title"
                className="h-12"
              />
              {errors.currentRole && (
                <p role="alert" className="text-sm text-red-600">
                  ⚠ {errors.currentRole.message}
                </p>
              )}
            </div>

            {/* Brief Bio */}
            <div className="space-y-2">
              <Label htmlFor="briefBio">Brief Bio</Label>
              <Textarea
                {...register('briefBio')}
                id="briefBio"
                placeholder="Tell us about your professional journey, key achievements, and areas of expertise..."
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">150-500 characters required</span>
                <span className={`${(watch('briefBio')?.length || 0) < 150 ? 'text-red-600' : 'text-green-600'}`}>
                  {watch('briefBio')?.length || 0} / 500
                </span>
              </div>
              {errors.briefBio && (
                <p role="alert" className="text-sm text-red-600">
                  ⚠ {errors.briefBio.message}
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
