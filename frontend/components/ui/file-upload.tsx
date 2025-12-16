/**
 * File Upload Component
 * Modern drag-and-drop file upload with preview and progress
 */

"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, File, Image, Video, Music, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/api/reviews/files";

export interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  error?: string;
  uploaded?: boolean;
}

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  uploadedFiles?: UploadedFile[];
  disabled?: boolean;
  contentType?: string;
  className?: string;
}

export function FileUpload({
  accept,
  maxSize,
  maxFiles = 10,
  onFilesSelected,
  onFileRemove,
  uploadedFiles = [],
  disabled = false,
  className
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files.slice(0, maxFiles - uploadedFiles.length));
    }
  }, [disabled, onFilesSelected, maxFiles, uploadedFiles.length]);

  // Handle file input change
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files.slice(0, maxFiles - uploadedFiles.length));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFilesSelected, maxFiles, uploadedFiles.length]);

  // Handle paste event
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;

    const items = Array.from(e.clipboardData.items);
    const files = items
      .filter(item => item.kind === "file")
      .map(item => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (files.length > 0) {
      onFilesSelected(files.slice(0, maxFiles - uploadedFiles.length));
    }
  }, [disabled, onFilesSelected, maxFiles, uploadedFiles.length]);

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type.startsWith("video/")) return Video;
    if (file.type.startsWith("audio/")) return Music;
    if (file.type.includes("pdf") || file.type.includes("document")) return FileText;
    return File;
  };

  // Open file browser
  const openFileBrowser = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const canAddMore = uploadedFiles.length < maxFiles;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={openFileBrowser}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
            "hover:border-accent-blue hover:bg-accent-blue/5",
            isDragging && "border-accent-blue bg-accent-blue/10",
            disabled && "opacity-50 cursor-not-allowed",
            !isDragging && !disabled && "border-border"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {/* Upload icon */}
            <div className={cn(
              "size-16 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-accent-blue/20" : "bg-muted"
            )}>
              <Upload className={cn(
                "size-8 transition-colors",
                isDragging ? "text-accent-blue" : "text-muted-foreground"
              )} />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <p className="text-base font-medium text-foreground">
                {isDragging ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse, or paste from clipboard
              </p>
              {maxSize && (
                <p className="text-xs text-muted-foreground">
                  Max file size: {formatFileSize(maxSize)} • Max {maxFiles} files
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => {
              const FileIcon = getFileIcon(uploadedFile.file);
              const hasError = !!uploadedFile.error;
              const isUploading = uploadedFile.progress > 0 && uploadedFile.progress < 100;
              const isComplete = uploadedFile.uploaded || uploadedFile.progress === 100;

              return (
                <div
                  key={uploadedFile.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    hasError ? "border-destructive bg-destructive/5" : "border-border bg-muted/50"
                  )}
                >
                  {/* File preview/icon */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="size-10 rounded object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded bg-background flex items-center justify-center">
                        <FileIcon className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {/* Progress bar */}
                    {isUploading && (
                      <div className="mt-2">
                        <div className="h-1 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-blue transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {uploadedFile.progress}%
                        </p>
                      </div>
                    )}

                    {/* Error message */}
                    {hasError && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="size-3 text-destructive" />
                        <p className="text-xs text-destructive">{uploadedFile.error}</p>
                      </div>
                    )}

                    {/* Success indicator */}
                    {isComplete && !hasError && (
                      <p className="text-xs text-green-600 mt-1">Upload complete</p>
                    )}
                  </div>

                  {/* Remove button */}
                  {onFileRemove && !isUploading && (
                    <button
                      onClick={() => onFileRemove(uploadedFile.id)}
                      className="flex-shrink-0 size-8 rounded-full hover:bg-background flex items-center justify-center transition-colors"
                      disabled={disabled}
                    >
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
