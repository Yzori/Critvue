/**
 * Step 5: Portfolio Submission
 * Upload 3-5 work samples with titles and descriptions
 * TODO: Integrate with actual file upload service (S3, Cloudinary, etc.)
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Camera, Link as LinkIcon, X, FileText, Image as ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { PortfolioItem } from '@/lib/expert-application/types'

interface Step5PortfolioProps {
  onValidationChange?: (isValid: boolean) => void
}

export function Step5Portfolio({ onValidationChange }: Step5PortfolioProps) {
  const portfolio = useExpertApplicationStore((state) => state.portfolio)
  const addPortfolioItem = useExpertApplicationStore((state) => state.addPortfolioItem)
  const updatePortfolioItem = useExpertApplicationStore((state) => state.updatePortfolioItem)
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

          {/* Portfolio Items with Title and Description */}
          {portfolio.length > 0 && (
            <div className="mt-8 space-y-6">
              <h3 className="text-lg font-semibold">Work Sample Details</h3>
              <p className="text-sm text-foreground-muted -mt-2">
                Add a title and description for each uploaded sample
              </p>

              {portfolio.map((item, index) => (
                <Card key={item.id} className="p-4 border-2">
                  <div className="flex gap-4">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.fileName}
                          className="w-20 h-20 rounded object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded bg-muted flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Input Fields */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-3">
                            Sample {index + 1}: {item.fileName}
                          </p>
                        </div>
                        <button
                          onClick={() => handleFileRemove(item.id)}
                          className="flex-shrink-0 p-1 hover:bg-destructive/10 rounded transition-colors"
                          aria-label="Remove file"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>

                      <div>
                        <Label htmlFor={`title-${item.id}`} className="text-sm font-medium">
                          Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`title-${item.id}`}
                          value={item.title}
                          onChange={(e) => updatePortfolioItem(item.id, { title: e.target.value })}
                          placeholder="e.g., E-commerce Website Redesign"
                          className="mt-1.5"
                          maxLength={100}
                        />
                        {!item.title && portfolio.length >= 3 && (
                          <p className="text-xs text-destructive mt-1">Title is required</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`description-${item.id}`} className="text-sm font-medium">
                          Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id={`description-${item.id}`}
                          value={item.description}
                          onChange={(e) => updatePortfolioItem(item.id, { description: e.target.value })}
                          placeholder="Briefly describe this work sample, your role, and what makes it notable..."
                          className="mt-1.5 min-h-[80px]"
                          maxLength={500}
                        />
                        <div className="flex justify-between mt-1">
                          <span>
                            {!item.description && portfolio.length >= 3 && (
                              <p className="text-xs text-destructive">Description is required</p>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.description.length}/500
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

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
