/**
 * Step 5: Portfolio Submission
 * Upload 3-5 work samples with titles and descriptions
 * TODO: Integrate with actual file upload service (S3, Cloudinary, etc.)
 */

'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Camera, Link as LinkIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { useExpertApplicationStore } from '@/stores/expert-application-store'

interface Step5PortfolioProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step5Portfolio({ onValidationChange }: Step5PortfolioProps) {
  const portfolio = useExpertApplicationStore((state) => state.portfolio)
  const addPortfolioItem = useExpertApplicationStore((state) => state.addPortfolioItem)

  const isValid = portfolio.length >= 3 && portfolio.length <= 5 &&
    portfolio.every(item => item.title && item.description)

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-light p-6 sm:p-8">
          <h2 className="mb-2 text-2xl font-bold">Portfolio Submission</h2>
          <p className="mb-6 text-foreground-muted">
            Upload 3-5 work samples showcasing your expertise. Each sample should include a title and description.
          </p>

          <FileUpload
            maxFiles={5}
            accept="image/*,.pdf,.doc,.docx"
            onFilesSelected={(files) => {
              // TODO: Handle file uploads
              console.log('Files:', files)
            }}
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <UploadOption
              icon={Upload}
              label="Upload Files"
              description="PDF, DOC, or Images"
            />
            <UploadOption
              icon={Camera}
              label="Take Photo"
              description="Use device camera"
            />
            <UploadOption
              icon={LinkIcon}
              label="Add URL"
              description="Link to work online"
            />
          </div>

          <p className="mt-6 text-sm text-foreground-muted">
            Current: {portfolio.length} of 3-5 samples required
          </p>
        </Card>
      </motion.div>
    </div>
  )
}

function UploadOption({ icon: Icon, label, description }: any) {
  return (
    <button className="rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5">
      <Icon className="mx-auto mb-2 h-8 w-8 text-[var(--accent-blue)]" />
      <div className="font-medium">{label}</div>
      <div className="text-xs text-foreground-muted">{description}</div>
    </button>
  )
}
