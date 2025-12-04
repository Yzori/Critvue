/**
 * Step 5: Portfolio Submission
 * Upload 3-5 work samples with titles and descriptions
 * TODO: Integrate with actual file upload service (S3, Cloudinary, etc.)
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Camera, Link as LinkIcon, X, FileText, FileImage, File } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
import { useExpertApplicationStore } from '@/stores/expert-application-store'
import type { PortfolioItem } from '@/lib/expert-application/types'

// Helper to get file type icon based on file type
function getFileTypeIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <FileImage className="w-4 h-4 text-purple-500" />
  }
  if (fileType === 'application/pdf') {
    return <FileText className="w-4 h-4 text-red-500" />
  }
  if (fileType.includes('word') || fileType.includes('document')) {
    return <FileText className="w-4 h-4 text-blue-500" />
  }
  return <File className="w-4 h-4 text-gray-500" />
}

// Helper to get friendly file type name
function getFileTypeName(fileType: string) {
  if (fileType.startsWith('image/')) return 'Image'
  if (fileType === 'application/pdf') return 'PDF'
  if (fileType.includes('word') || fileType.includes('document')) return 'Document'
  return 'File'
}

// Premium Auto-Resize Textarea with Floating Label
interface AutoResizeTextareaProps {
  id: string
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  hint?: string
  maxLength?: number
  minHeight?: number
  maxHeight?: number
  required?: boolean
  error?: string
}

function AutoResizeTextarea({
  id,
  value,
  onChange,
  label,
  placeholder = '',
  hint,
  maxLength = 500,
  minHeight = 100,
  maxHeight = 280,
  required,
  error
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0

  // Smooth auto-resize function
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Calculate new height with smooth bounds
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${newHeight}px`

    // Show scrollbar only when content exceeds maxHeight
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [minHeight, maxHeight])

  // Adjust on value change
  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  // Adjust on mount
  useEffect(() => {
    adjustHeight()
  }, [adjustHeight])

  const showFloatingLabel = isFocused || hasValue

  return (
    <div className="relative">
      {/* Floating Label */}
      <label
        htmlFor={id}
        className={`
          absolute left-3 transition-all duration-150 ease-out pointer-events-none z-10
          ${showFloatingLabel
            ? '-top-2.5 text-xs px-1 bg-background text-[var(--accent-blue)] font-medium'
            : 'top-3 text-sm text-muted-foreground'
          }
        `}
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={showFloatingLabel ? placeholder : ''}
        maxLength={maxLength}
        className={`
          w-full px-3 py-3 pt-4 rounded-lg border-2 text-sm
          resize-none transition-all duration-150 ease-out
          bg-background
          focus:outline-none
          ${isFocused
            ? 'border-[var(--accent-blue)] shadow-[0_0_0_3px_rgba(59,130,246,0.1)] bg-[var(--accent-blue)]/[0.02]'
            : error
              ? 'border-destructive'
              : 'border-border hover:border-muted-foreground/50'
          }
        `}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          overflowX: 'hidden',
        }}
      />

      {/* Helper text and character count */}
      <div className="flex justify-between items-start mt-1.5 px-1">
        <div className="flex-1">
          {hint && !error && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
        <span className={`text-xs ml-2 tabular-nums ${
          value.length >= (maxLength * 0.9)
            ? value.length >= maxLength
              ? 'text-destructive'
              : 'text-amber-500'
            : value.length >= 10
              ? 'text-green-600'
              : 'text-muted-foreground'
        }`}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  )
}

// Premium Input with Floating Label
interface FloatingInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  hint?: string
  maxLength?: number
  required?: boolean
  error?: string
  autoFocus?: boolean
}

function FloatingInput({
  id,
  value,
  onChange,
  label,
  placeholder = '',
  hint,
  maxLength = 100,
  required,
  error,
  autoFocus
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0
  const showFloatingLabel = isFocused || hasValue

  return (
    <div className="relative">
      {/* Floating Label */}
      <label
        htmlFor={id}
        className={`
          absolute left-3 transition-all duration-150 ease-out pointer-events-none z-10
          ${showFloatingLabel
            ? '-top-2.5 text-xs px-1 bg-background text-[var(--accent-blue)] font-medium'
            : 'top-3 text-sm text-muted-foreground'
          }
        `}
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      {/* Input */}
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={showFloatingLabel ? placeholder : ''}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={`
          w-full h-12 px-3 pt-1 rounded-lg border-2 text-sm
          transition-all duration-150 ease-out
          bg-background
          focus:outline-none
          ${isFocused
            ? 'border-[var(--accent-blue)] shadow-[0_0_0_3px_rgba(59,130,246,0.1)] bg-[var(--accent-blue)]/[0.02]'
            : error
              ? 'border-destructive'
              : 'border-border hover:border-muted-foreground/50'
          }
        `}
      />

      {/* Helper text */}
      {(hint || error) && (
        <div className="mt-1.5 px-1">
          {hint && !error && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

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

  // Handle file selection - upload to server and get permanent URLs
  const handleFilesSelected = async (files: File[]) => {
    for (const file of files) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create local preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      // Add to UI state with uploading status
      const uploadedFile: UploadedFile = {
        file,
        id: fileId,
        preview,
        progress: 0,
      }
      setUploadedFiles(prev => [...prev, uploadedFile])

      try {
        // Upload to server
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('http://localhost:8000/api/v1/expert-applications/portfolio/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Upload failed')
        }

        const uploadResult = await response.json()

        // Create portfolio item with server URLs
        const portfolioItem: PortfolioItem = {
          id: uploadResult.id || fileId,
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          fileType: uploadResult.fileType,
          fileSize: uploadResult.fileSize,
          title: '',
          description: '',
          thumbnailUrl: uploadResult.thumbnailUrl,
          uploadedAt: new Date(uploadResult.uploadedAt),
        }

        addPortfolioItem(portfolioItem)

        // Update UI state to show complete
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, progress: 100, uploaded: true } : f)
        )

        // Clean up local preview URL
        if (preview) {
          URL.revokeObjectURL(preview)
        }
      } catch (error) {
        console.error('Failed to upload file:', error)
        // Remove from UI state on error
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
        if (preview) {
          URL.revokeObjectURL(preview)
        }
        alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
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
          <p className="mb-4 text-foreground-muted">
            Upload 3-5 work samples showcasing your expertise.
          </p>

          {/* Quality Expectations */}
          <div className="mb-6 rounded-lg bg-muted/50 p-4 border border-border">
            <p className="font-medium text-foreground mb-2">What makes a great sample?</p>
            <ul className="text-sm text-foreground-muted space-y-1">
              <li>• High-quality images or professionally formatted documents</li>
              <li>• Work that demonstrates your specific expertise</li>
              <li>• Projects where you played a significant role</li>
            </ul>
          </div>

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
                <Card key={item.id} className="p-4 border-2 overflow-hidden">
                  <div className="flex gap-4 min-w-0">
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
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted flex items-center gap-1">
                              {getFileTypeIcon(item.fileType)}
                              {getFileTypeName(item.fileType)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(item.fileSize / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            Sample {index + 1}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.fileName}
                          </p>
                        </div>
                        <button
                          onClick={() => handleFileRemove(item.id)}
                          className="flex-shrink-0 p-1.5 hover:bg-destructive/10 rounded-full transition-colors"
                          aria-label="Remove file"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>

                      {/* Premium Floating Input for Title */}
                      <FloatingInput
                        id={`title-${item.id}`}
                        value={item.title}
                        onChange={(value) => updatePortfolioItem(item.id, { title: value })}
                        label="Title"
                        placeholder="e.g., E-commerce Website Redesign"
                        hint="Give this work a clear, descriptive title"
                        maxLength={100}
                        required
                        error={!item.title && portfolio.length >= 3 ? 'Title is required' : undefined}
                        autoFocus={index === portfolio.length - 1 && !item.title}
                      />

                      {/* Premium Auto-Resize Textarea for Description */}
                      <AutoResizeTextarea
                        id={`description-${item.id}`}
                        value={item.description}
                        onChange={(value) => updatePortfolioItem(item.id, { description: value })}
                        label="Description"
                        placeholder="Describe your role, the tools you used, and the outcome achieved..."
                        hint={item.description.length < 10 ? 'Minimum 10 characters — explain your role, process, and impact' : 'Explain your role, process, and impact'}
                        maxLength={500}
                        minHeight={100}
                        maxHeight={280}
                        required
                        error={!item.description && portfolio.length >= 3 ? 'Description is required' : undefined}
                      />
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
