"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ReviewFile } from "@/lib/api/reviews";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File as FileIcon,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * FileGallery Component
 *
 * Features:
 * - Grid display of uploaded files
 * - Preview modal for images
 * - Download buttons for all files
 * - File type indicators with appropriate icons
 * - Mobile-responsive layout
 * - Glassmorphism design
 * - WCAG 2.1 Level AA compliant
 * - 44px minimum touch targets
 */

interface FileGalleryProps {
  files: ReviewFile[];
  className?: string;
}

// Backend URL for file access (without /api/v1)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Helper to get file URL
function getFileUrl(file: ReviewFile): string {
  // Full URL already provided (e.g., S3/cloud storage)
  if (file.file_url) {
    // If it's already an absolute URL, return as-is
    if (file.file_url.startsWith("http://") || file.file_url.startsWith("https://")) {
      return file.file_url;
    }
    // Otherwise prepend backend URL to relative path
    return `${BACKEND_URL}${file.file_url}`;
  }
  // Construct URL from filename - files are served at /files/{path}
  if (file.filename) return `${BACKEND_URL}/files/${file.filename}`;
  return "";
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Helper to get file type category
function getFileCategory(mimeType: string): "image" | "video" | "audio" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text") ||
    mimeType.includes("presentation") ||
    mimeType.includes("spreadsheet")
  ) {
    return "document";
  }
  return "other";
}

// Helper to get icon for file type
function getFileIcon(category: string, className?: string) {
  switch (category) {
    case "image":
      return <ImageIcon className={className} />;
    case "video":
      return <Video className={className} />;
    case "audio":
      return <Music className={className} />;
    case "document":
      return <FileText className={className} />;
    default:
      return <FileIcon className={className} />;
  }
}

export function FileGallery({ files, className }: FileGalleryProps) {
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);

  // Filter images for preview
  const imageFiles = React.useMemo(
    () => files.filter((f) => getFileCategory(f.file_type) === "image"),
    [files]
  );

  // Handle keyboard navigation in preview
  React.useEffect(() => {
    if (previewIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewIndex(null);
      } else if (e.key === "ArrowLeft") {
        setPreviewIndex((prev) => (prev === null || prev === 0 ? imageFiles.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setPreviewIndex((prev) => (prev === null || prev === imageFiles.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, imageFiles.length]);

  // Handle download
  const handleDownload = (file: ReviewFile) => {
    const url = getFileUrl(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.original_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (files.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileIcon className="size-12 mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-600">No files uploaded</p>
      </div>
    );
  }

  return (
    <>
      {/* File Grid */}
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
          className
        )}
        role="list"
        aria-label="Uploaded files"
      >
        {files.map((file, index) => {
          const category = getFileCategory(file.file_type);
          const isImage = category === "image";
          const imageIndex = isImage ? imageFiles.findIndex((f) => f.id === file.id) : -1;

          return (
            <div
              key={file.id}
              role="listitem"
              className={cn(
                "group relative rounded-xl overflow-hidden",
                "bg-white/60 backdrop-blur-sm border border-gray-200/50",
                "hover:border-accent-blue/30 hover:shadow-md",
                "transition-all duration-300"
              )}
            >
              {/* File Preview/Icon */}
              <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                {isImage ? (
                  <>
                    <img
                      src={getFileUrl(file)}
                      alt={file.original_filename}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPreviewIndex(imageIndex)}
                      className={cn(
                        "absolute inset-0 bg-black/0 group-hover:bg-black/40",
                        "flex items-center justify-center",
                        "transition-all duration-300 opacity-0 group-hover:opacity-100",
                        "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      )}
                      aria-label={`Preview ${file.original_filename}`}
                    >
                      <ZoomIn className="size-8 text-white drop-shadow-lg" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {getFileIcon(category, "size-12 text-gray-400")}
                    <span className="text-xs text-gray-500 uppercase font-medium px-2 py-1 bg-white/80 rounded">
                      {file.file_type.split("/")[1] || category}
                    </span>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="p-4">
                <h4
                  className="text-sm font-medium text-gray-900 truncate mb-1"
                  title={file.original_filename}
                >
                  {file.original_filename}
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  {formatFileSize(file.file_size)}
                </p>

                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="w-full min-h-[44px]"
                  aria-label={`Download ${file.original_filename}`}
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      {previewIndex !== null && imageFiles[previewIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex(null);
            }}
            className={cn(
              "absolute top-4 right-4 z-10",
              "size-12 rounded-full bg-white/10 backdrop-blur-sm",
              "hover:bg-white/20 transition-colors",
              "flex items-center justify-center",
              "focus:outline-none focus:ring-2 focus:ring-white"
            )}
            aria-label="Close preview"
          >
            <X className="size-6 text-white" />
          </button>

          {/* Navigation Buttons */}
          {imageFiles.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((prev) =>
                    prev === null || prev === 0 ? imageFiles.length - 1 : prev - 1
                  );
                }}
                className={cn(
                  "absolute left-4 z-10",
                  "size-12 rounded-full bg-white/10 backdrop-blur-sm",
                  "hover:bg-white/20 transition-colors",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-white"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-6 text-white" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((prev) =>
                    prev === null || prev === imageFiles.length - 1 ? 0 : prev + 1
                  );
                }}
                className={cn(
                  "absolute right-4 z-10",
                  "size-12 rounded-full bg-white/10 backdrop-blur-sm",
                  "hover:bg-white/20 transition-colors",
                  "flex items-center justify-center",
                  "focus:outline-none focus:ring-2 focus:ring-white"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="size-6 text-white" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getFileUrl(imageFiles[previewIndex])}
              alt={imageFiles[previewIndex].original_filename}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <p className="text-white text-sm font-medium">
                {imageFiles[previewIndex].original_filename}
              </p>
              <p className="text-white/70 text-xs mt-1">
                {previewIndex + 1} of {imageFiles.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
