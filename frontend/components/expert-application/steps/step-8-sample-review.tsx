/**
 * Step 8: Sample Review
 * Test reviewing skills with a sample design
 */

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sampleReviewSchema, type SampleReviewFormData } from '@/lib/expert-application/validation'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

interface Step8SampleReviewProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step8SampleReview({ onValidationChange }: Step8SampleReviewProps) {
  const sampleReview = useExpertApplicationStore((state) => state.sampleReview)
  const updateSampleReview = useExpertApplicationStore((state) => state.updateSampleReview)
  const [hoverRating, setHoverRating] = useState(0)

  const { register, formState: { errors, isValid }, watch, setValue } = useForm<SampleReviewFormData>({
    resolver: zodResolver(sampleReviewSchema),
    mode: 'onBlur',
    defaultValues: {
      rating: sampleReview.rating || 0,
      strengths: sampleReview.strengths || '',
      areasForImprovement: sampleReview.areasForImprovement || '',
      detailedFeedback: sampleReview.detailedFeedback || ''
    }
  })

  const currentRating = watch('rating') || 0

  useEffect(() => {
    const subscription = watch((data) => {
      updateSampleReview(data as any)
    })
    return () => subscription.unsubscribe()
  }, [watch, updateSampleReview])

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold">Sample Review</h2>
          <p className="mb-6 text-foreground-muted">
            Review the sample design below to demonstrate your feedback skills.
          </p>

          {/* Sample Design Placeholder */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-border bg-gray-50 p-12 text-center">
            <p className="text-foreground-muted">Sample Design Image</p>
            <p className="text-xs text-foreground-muted">(Would display actual design here)</p>
          </div>

          <div className="space-y-6">
            {/* Rating */}
            <div className="space-y-2">
              <Label>
                Overall Rating <span className="text-destructive">*</span>
              </Label>
              <div
                className="flex gap-2"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const displayRating = hoverRating || currentRating
                  const isFilled = star <= displayRating

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setValue('rating', star, { shouldValidate: true })}
                      onMouseEnter={() => setHoverRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          isFilled
                            ? 'fill-[var(--accent-blue)] text-[var(--accent-blue)]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              {currentRating > 0 && (
                <p className="text-sm text-foreground-muted">
                  {currentRating} out of 5 stars
                </p>
              )}
              {errors.rating && <p className="text-sm text-red-600">⚠ {errors.rating.message}</p>}
            </div>

            {/* Strengths */}
            <div className="space-y-2">
              <Label htmlFor="strengths">Strengths (50-500 chars)</Label>
              <Textarea
                {...register('strengths')}
                id="strengths"
                className="min-h-[80px]"
                placeholder="What works well in this design?"
                maxLength={500}
              />
              <span className="text-sm text-foreground-muted">
                {watch('strengths')?.length || 0} / 500
              </span>
              {errors.strengths && <p className="text-sm text-red-600">⚠ {errors.strengths.message}</p>}
            </div>

            {/* Areas for Improvement */}
            <div className="space-y-2">
              <Label htmlFor="areasForImprovement">Areas for Improvement (50-500 chars)</Label>
              <Textarea
                {...register('areasForImprovement')}
                id="areasForImprovement"
                className="min-h-[80px]"
                placeholder="What could be improved?"
                maxLength={500}
              />
              <span className="text-sm text-foreground-muted">
                {watch('areasForImprovement')?.length || 0} / 500
              </span>
              {errors.areasForImprovement && <p className="text-sm text-red-600">⚠ {errors.areasForImprovement.message}</p>}
            </div>

            {/* Detailed Feedback */}
            <div className="space-y-2">
              <Label htmlFor="detailedFeedback">Detailed Feedback (200-2000 chars)</Label>
              <Textarea
                {...register('detailedFeedback')}
                id="detailedFeedback"
                className="min-h-[150px]"
                placeholder="Provide comprehensive feedback..."
                maxLength={2000}
              />
              <span className={`text-sm ${(watch('detailedFeedback')?.length || 0) < 200 ? 'text-red-600' : 'text-green-600'}`}>
                {watch('detailedFeedback')?.length || 0} / 2000 (min: 200)
              </span>
              {errors.detailedFeedback && <p className="text-sm text-red-600">⚠ {errors.detailedFeedback.message}</p>}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
