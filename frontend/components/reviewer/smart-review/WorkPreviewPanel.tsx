/**
 * Work Preview Panel
 *
 * Persistent panel showing the creator's work alongside the review form.
 * Supports images, PDFs, code files, and external links.
 *
 * Features:
 * - Resizable split view
 * - Zoom controls for images
 * - Pinnable to stay visible while scrolling
 * - Quick annotation mode
 */

"use client";

import * as React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ExternalLink,
  Pin,
  PinOff,
  FileText,
  Code,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFileUrl } from "@/lib/api/client";

export interface WorkFile {
  id: number;
  file_url: string;
  file_type: string;
  file_name: string;
}

interface WorkPreviewPanelProps {
  files: WorkFile[];
  title: string;
  description?: string;
  externalUrl?: string;
  contentType: string;
  className?: string;
  onAnnotationClick?: (x: number, y: number) => void;
}

export function WorkPreviewPanel({
  files,
  title,
  description,
  externalUrl,
  contentType,
  className,
  onAnnotationClick,
}: WorkPreviewPanelProps) {
  const [currentFileIndex, setCurrentFileIndex] = React.useState(0);
  const [zoom, setZoom] = React.useState(100);
  const [isPinned, setIsPinned] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const currentFile = files[currentFileIndex];
  const hasMultipleFiles = files.length > 1;

  // Determine file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return ImageIcon;
    if (fileType === "application/pdf") return FileText;
    if (fileType.includes("text") || fileType.includes("code")) return Code;
    return FileText;
  };

  // Handle zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);

  // Handle image click for annotation
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!onAnnotationClick || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAnnotationClick(x, y);
  };

  // File navigation
  const nextFile = () => setCurrentFileIndex((prev) => (prev + 1) % files.length);
  const prevFile = () => setCurrentFileIndex((prev) => (prev - 1 + files.length) % files.length);

  // Collapsed state - just show toggle
  if (isCollapsed) {
    return (
      <div className={cn("relative", className)}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-accent-blue text-white p-2 rounded-r-lg shadow-lg hover:bg-accent-blue/90 transition-colors"
          aria-label="Show work preview"
        >
          <Eye className="size-5" />
        </button>
      </div>
    );
  }

  // Expanded fullscreen modal
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="text-white hover:bg-white/20"
          >
            <ZoomOut className="size-5" />
          </Button>
          <span className="text-white text-sm font-medium min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="text-white hover:bg-white/20"
          >
            <ZoomIn className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(false)}
            className="text-white hover:bg-white/20"
          >
            <Minimize2 className="size-5" />
          </Button>
        </div>

        {currentFile && currentFile.file_type.startsWith("image/") && (
          <img
            src={getFileUrl(currentFile.file_url)}
            alt={currentFile.file_name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        )}

        {hasMultipleFiles && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevFile}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <span className="text-white text-sm">
              {currentFileIndex + 1} / {files.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextFile}
              className="text-white hover:bg-white/20"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-accent-blue/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 overflow-hidden",
        isPinned && "lg:sticky lg:top-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-accent-blue/20 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Eye className="size-4 text-accent-blue" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} to review
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPinned(!isPinned)}
            className="size-8"
            title={isPinned ? "Unpin panel" : "Pin panel"}
          >
            {isPinned ? (
              <Pin className="size-4 text-accent-blue" />
            ) : (
              <PinOff className="size-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="size-8"
            title="Collapse panel"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(true)}
            className="size-8"
            title="Expand fullscreen"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="relative">
        {/* Image Preview */}
        {currentFile && currentFile.file_type.startsWith("image/") && (
          <div className="relative overflow-auto max-h-[400px] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22grid%22%20width%3D%2220%22%20height%3D%2220%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23grid)%22%2F%3E%3C%2Fsvg%3E')]">
            <img
              ref={imageRef}
              src={getFileUrl(currentFile.file_url)}
              alt={currentFile.file_name}
              className="w-full h-auto cursor-crosshair transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
              onClick={handleImageClick}
            />
            {onAnnotationClick && (
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
                Click to add annotation
              </div>
            )}
          </div>
        )}

        {/* PDF Preview */}
        {currentFile && currentFile.file_type === "application/pdf" && (
          <div className="p-4">
            <iframe
              src={`${getFileUrl(currentFile.file_url)}#toolbar=0`}
              className="w-full h-[400px] rounded-lg border"
              title={currentFile.file_name}
            />
          </div>
        )}

        {/* No files - show description or external link */}
        {files.length === 0 && (
          <div className="p-6 text-center">
            {description && (
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
            )}
            {externalUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(externalUrl, "_blank")}
              >
                <ExternalLink className="size-4 mr-2" />
                View External Link
              </Button>
            )}
            {!description && !externalUrl && (
              <p className="text-sm text-muted-foreground">
                No preview available for this content type
              </p>
            )}
          </div>
        )}

        {/* Zoom Controls */}
        {currentFile && currentFile.file_type.startsWith("image/") && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 p-1 rounded-lg bg-black/60 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="size-7 text-white hover:bg-white/20"
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <button
              onClick={handleZoomReset}
              className="text-white text-xs font-medium min-w-[40px] hover:bg-white/20 rounded px-1 py-0.5"
            >
              {zoom}%
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="size-7 text-white hover:bg-white/20"
            >
              <ZoomIn className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* File Navigation */}
      {hasMultipleFiles && (
        <div className="flex items-center justify-between p-2 border-t border-accent-blue/20 bg-white/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevFile}
            className="h-8"
          >
            <ChevronLeft className="size-4 mr-1" />
            Prev
          </Button>

          <div className="flex items-center gap-1">
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.file_type);
              return (
                <button
                  key={file.id}
                  onClick={() => setCurrentFileIndex(index)}
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center transition-colors",
                    index === currentFileIndex
                      ? "bg-accent-blue text-white"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                  title={file.file_name}
                >
                  <FileIcon className="size-4" />
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextFile}
            className="h-8"
          >
            Next
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Download Link */}
      {currentFile && (
        <div className="p-2 border-t border-accent-blue/20 bg-white/40">
          <a
            href={getFileUrl(currentFile.file_url)}
            download={currentFile.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="size-3.5" />
            Download original
          </a>
        </div>
      )}
    </div>
  );
}
