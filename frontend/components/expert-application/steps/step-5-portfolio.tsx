/**
 * Step 5: Portfolio Submission
 * Upload 3-5 work samples with titles and descriptions
 * TODO: Integrate with actual file upload service (S3, Cloudinary, etc.)
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Camera, Link as LinkIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { PortfolioItem } from '@/lib/expert-application/types'

interface Step5PortfolioProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step5Portfolio({ onValidationChange }: Step5PortfolioProps) {
  const portfolio = useExpertApplicationStore((state) => state.portfolio)
  const addPortfolioItem = useExpertApplicationStore((state) => state.addPortfolioItem)
  const removePortfolioItem = useExpertApplicationStore((state) => state.removePortfolioItem)

  // Local state for managing upload UI
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // Validation logic
  const isValid = portfolio.length >= 3 && portfolio.length <= 5 &&
    portfolio.every(item => item.title && item.description)

  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  // Handle file selection
  const handleFilesSelected = async (files: File[]) => {
    const newUploadedFiles: UploadedFile[] = files.map(file => {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      return {
        file,
        id: fileId,
        preview,
        progress: 0,
      }
    })

    setUploadedFiles(prev => [...prev, ...newUploadedFiles])

    // Convert to portfolio items
    // TODO: Actually upload files to a server and get URLs
    newUploadedFiles.forEach(uploadedFile => {
      const portfolioItem: PortfolioItem = {
        id: uploadedFile.id,
        url: uploadedFile.preview || '', // TODO: Replace with actual uploaded URL
        fileName: uploadedFile.file.name,
        fileType: uploadedFile.file.type,
        fileSize: uploadedFile.file.size,
        title: '', // User needs to fill this
        description: '', // User needs to fill this
        thumbnailUrl: uploadedFile.preview,
        uploadedAt: new Date(),
      }

      addPortfolioItem(portfolioItem)

      // Simulate upload progress
      setTimeout(() => {
        setUploadedFiles(prev =>
          prev.map(f => f.id === uploadedFile.id ? { ...f, progress: 100, uploaded: true } : f)
        )
      }, 1000)
    })
  }

  // Handle file removal
  const handleFileRemove = (fileId: string) => {
    // Clean up preview URL
    const file = uploadedFiles.find(f => f.id === fileId)
    if (file?.preview) {
      URL.revokeObjectURL(file.preview)
    }

    // Remove from UI state
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))

    // Remove from store
    removePortfolioItem(fileId)
  }

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
            maxSize={10 * 1024 * 1024}
            accept="image/*,.pdf,.doc,.docx"
            onFilesSelected={handleFilesSelected}
            onFileRemove={handleFileRemove}
            uploadedFiles={uploadedFiles}
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
