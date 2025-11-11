/**
 * File Upload Step
 * Upload files, links, and other content for review
 */

"use client";

import { useState, useEffect } from "react";
import { FileUpload, UploadedFile } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Camera,
} from "lucide-react";
import { ContentType } from "@/lib/api/reviews";
import {
  uploadFile,
  getAcceptedFileTypes,
  getFileSizeLimit,
  isFileTypeAllowed,
  formatFileSize,
} from "@/lib/api/files";

interface FileUploadStepProps {
  contentType: ContentType;
  reviewId: number | null;
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  externalLinks: string[];
  onLinksChange: (links: string[]) => void;
}

export function FileUploadStep({
  contentType,
  reviewId,
  uploadedFiles,
  onFilesChange,
  externalLinks,
  onLinksChange,
}: FileUploadStepProps) {
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Get content-specific configuration
  const acceptedTypes = getAcceptedFileTypes(contentType);
  const maxFileSize = getFileSizeLimit(contentType);
  const maxFiles = 10;

  // Get content-specific helper text
  const getHelperText = () => {
    switch (contentType) {
      case "design":
        return "Upload images (PNG, JPG, SVG, WebP), PDFs, or paste Figma/Sketch links";
      case "code":
        return "Upload ZIP files, GitHub repository links, or single code files";
      case "video":
        return "Upload video files (MP4, MOV, WebM) or YouTube/Vimeo links";
      case "audio":
        return "Upload audio files (MP3, WAV, OGG) or SoundCloud links";
      case "writing":
        return "Upload documents (PDF, DOCX, TXT) or Google Docs links";
      case "art":
        return "Upload images (PNG, JPG, WebP) or PDFs of your artwork";
      default:
        return "Upload your files or paste relevant links";
    }
  };

  // Get supported platforms for links
  const getSupportedPlatforms = () => {
    switch (contentType) {
      case "design":
        return ["Figma", "Sketch Cloud", "Adobe Cloud", "InVision"];
      case "code":
        return ["GitHub", "GitLab", "Bitbucket", "CodeSandbox"];
      case "video":
        return ["YouTube", "Vimeo", "TikTok", "Instagram"];
      case "audio":
        return ["SoundCloud", "Spotify", "Apple Music"];
      case "writing":
        return ["Google Docs", "Notion", "Medium", "Substack"];
      default:
        return [];
    }
  };

  // Handle files selected
  const handleFilesSelected = async (newFiles: File[]) => {
    // Validate files
    const validatedFiles: UploadedFile[] = [];

    for (const file of newFiles) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Check file type
      if (!isFileTypeAllowed(file, contentType)) {
        validatedFiles.push({
          file,
          id: fileId,
          progress: 0,
          error: `File type not allowed for ${contentType} content`,
        });
        continue;
      }

      // Check file size
      if (file.size > maxFileSize) {
        validatedFiles.push({
          file,
          id: fileId,
          progress: 0,
          error: `File size exceeds ${formatFileSize(maxFileSize)} limit`,
        });
        continue;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      validatedFiles.push({
        file,
        id: fileId,
        preview,
        progress: 0,
      });
    }

    // Add to uploaded files
    const newUploadedFiles = [...uploadedFiles, ...validatedFiles];
    onFilesChange(newUploadedFiles);

    // Start uploading valid files
    if (reviewId) {
      validatedFiles.forEach(async (uploadedFile) => {
        if (uploadedFile.error) return; // Skip files with errors

        try {
          await uploadFile(
            reviewId,
            uploadedFile.file,
            (progress) => {
              // Update progress
              onFilesChange(
                newUploadedFiles.map((f) =>
                  f.id === uploadedFile.id ? { ...f, progress } : f
                )
              );
            }
          );

          // Mark as uploaded
          onFilesChange(
            newUploadedFiles.map((f) =>
              f.id === uploadedFile.id ? { ...f, uploaded: true, progress: 100 } : f
            )
          );
        } catch (error: any) {
          // Update with error
          onFilesChange(
            newUploadedFiles.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, error: error.message || "Upload failed", progress: 0 }
                : f
            )
          );
        }
      });
    }
  };

  // Handle file removal
  const handleFileRemove = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(uploadedFiles.filter((f) => f.id !== fileId));
  };

  // Validate link
  const validateLink = (link: string): boolean => {
    try {
      const url = new URL(link);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Handle adding link
  const handleAddLink = () => {
    const trimmedLink = linkInput.trim();

    if (!trimmedLink) {
      setLinkError("Please enter a link");
      return;
    }

    if (!validateLink(trimmedLink)) {
      setLinkError("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    if (externalLinks.includes(trimmedLink)) {
      setLinkError("This link has already been added");
      return;
    }

    // Add link
    onLinksChange([...externalLinks, trimmedLink]);
    setLinkInput("");
    setLinkError("");
  };

  // Handle removing link
  const handleRemoveLink = (index: number) => {
    onLinksChange(externalLinks.filter((_, i) => i !== index));
  };

  // Handle camera on mobile
  const handleCameraCapture = () => {
    // Open file input with camera capture
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFilesSelected(Array.from(files));
      }
    };
    input.click();
  };

  const supportedPlatforms = getSupportedPlatforms();
  const showLinkInput = supportedPlatforms.length > 0;
  const hasContent = uploadedFiles.length > 0 || externalLinks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Upload your {contentType}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {getHelperText()}
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* File upload */}
        <FileUpload
          accept={acceptedTypes}
          maxSize={maxFileSize}
          maxFiles={maxFiles}
          onFilesSelected={handleFilesSelected}
          onFileRemove={handleFileRemove}
          uploadedFiles={uploadedFiles}
          contentType={contentType}
          disabled={!reviewId}
        />

        {/* Camera button for mobile */}
        {isMobile && contentType === "design" && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCameraCapture}
            className="w-full"
            disabled={!reviewId}
          >
            <Camera className="size-4" />
            Take Photo
          </Button>
        )}

        {/* External links section */}
        {showLinkInput && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">Or add links</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Link input */}
            <div className="space-y-2">
              <Label htmlFor="link-input" className="text-foreground">
                Add Link
              </Label>
              <div className="flex gap-2">
                <Input
                  id="link-input"
                  type="url"
                  placeholder={`Paste ${supportedPlatforms[0]} link, etc.`}
                  value={linkInput}
                  onChange={(e) => {
                    setLinkInput(e.target.value);
                    setLinkError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                  className="flex-1"
                  disabled={!reviewId}
                />
                <Button
                  type="button"
                  onClick={handleAddLink}
                  disabled={!reviewId}
                >
                  <LinkIcon className="size-4" />
                  Add
                </Button>
              </div>
              {linkError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {linkError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Supported: {supportedPlatforms.join(", ")}
              </p>
            </div>

            {/* Added links */}
            {externalLinks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Added Links ({externalLinks.length})
                </p>
                <div className="space-y-2">
                  {externalLinks.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50"
                    >
                      <LinkIcon className="size-4 text-accent-blue flex-shrink-0" />
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-foreground hover:text-accent-blue truncate"
                      >
                        {link}
                      </a>
                      <button
                        onClick={() => handleRemoveLink(index)}
                        className="flex-shrink-0 size-8 rounded-full hover:bg-background flex items-center justify-center transition-colors"
                      >
                        <AlertCircle className="size-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status message */}
        {!reviewId && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Files will be uploaded after providing basic info
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Continue to the next step to create your review request first
              </p>
            </div>
          </div>
        )}

        {hasContent && reviewId && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="size-5 text-green-600" />
            <p className="text-sm text-green-900">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} and {externalLinks.length} link{externalLinks.length !== 1 ? "s" : ""} ready
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
