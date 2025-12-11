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
import { useToggle } from "@/hooks";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
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
  Play,
  Video,
  X,
  RotateCcw,
  Smartphone,
  PictureInPicture2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getFileUrl } from "@/lib/api/client";
import { parseVideoUrl, getProviderName, type VideoEmbed } from "@/lib/utils/video-embed";

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

  // Boolean states using useToggle
  const pinnedState = useToggle(true);
  const expandedState = useToggle();
  const collapsedState = useToggle();
  const landscapeState = useToggle();
  const rotateHintState = useToggle();
  const piPActiveState = useToggle();
  const piPSupportedState = useToggle();

  // Convenient aliases
  const isPinned = pinnedState.value;
  const isExpanded = expandedState.value;
  const isCollapsed = collapsedState.value;
  const isLandscape = landscapeState.value;
  const showRotateHint = rotateHintState.value;
  const isPiPActive = piPActiveState.value;
  const isPiPSupported = piPSupportedState.value;

  const imageRef = React.useRef<HTMLImageElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Check if PiP is supported
  React.useEffect(() => {
    if (
      typeof document !== 'undefined' &&
      'pictureInPictureEnabled' in document &&
      document.pictureInPictureEnabled
    ) {
      piPSupportedState.setTrue();
    }
  }, [piPSupportedState]);

  // Handle PiP toggle
  const handlePiPToggle = React.useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        piPActiveState.setFalse();
      } else {
        await videoRef.current.requestPictureInPicture();
        piPActiveState.setTrue();
      }
    } catch {
      // PiP not supported or permission denied
    }
  }, [piPActiveState]);

  // Listen for PiP events
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => piPActiveState.setTrue();
    const handleLeavePiP = () => piPActiveState.setFalse();

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [currentFileIndex, piPActiveState]);

  // Check if device is mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Handle screen rotation for mobile
  const handleRotateScreen = React.useCallback(async () => {
    try {
      // Check if Screen Orientation API is available
      if (screen.orientation && 'lock' in screen.orientation) {
        const currentOrientation = screen.orientation.type;

        if (currentOrientation.includes('portrait')) {
          await screen.orientation.lock('landscape');
          landscapeState.setTrue();
        } else {
          await screen.orientation.unlock();
          landscapeState.setFalse();
        }
      } else {
        // Fallback: show hint to rotate device manually
        rotateHintState.setTrue();
        setTimeout(() => rotateHintState.setFalse(), 3000);
      }
    } catch {
      // API not supported or permission denied - show hint
      rotateHintState.setTrue();
      setTimeout(() => rotateHintState.setFalse(), 3000);
    }
  }, [landscapeState, rotateHintState]);

  // Reset orientation when closing fullscreen
  React.useEffect(() => {
    if (!isExpanded && isLandscape) {
      try {
        if (screen.orientation && 'unlock' in screen.orientation) {
          screen.orientation.unlock();
        }
      } catch {
        // Ignore errors
      }
      landscapeState.setFalse();
    }
  }, [isExpanded, isLandscape, landscapeState]);

  const currentFile = files[currentFileIndex];
  const hasMultipleFiles = files.length > 1;

  // Parse external URL for video embedding
  const videoEmbed = React.useMemo(() => {
    if (externalUrl) {
      return parseVideoUrl(externalUrl);
    }
    return null;
  }, [externalUrl]);

  // Determine file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return ImageIcon;
    if (fileType.startsWith("video/")) return Video;
    if (fileType === "application/pdf") return FileText;
    if (fileType.includes("text") || fileType.includes("code")) return Code;
    return FileText;
  };

  // Check if file is a video
  const isVideoFile = (fileType: string) => fileType.startsWith("video/");

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
          onClick={collapsedState.setFalse}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-accent-blue text-white p-2 rounded-r-lg shadow-lg hover:bg-accent-blue/90 transition-colors"
          aria-label="Show work preview"
        >
          <Eye className="size-5" />
        </button>
      </div>
    );
  }

  // Determine content type for fullscreen
  const isImageFullscreen = currentFile && currentFile.file_type.startsWith("image/");
  const isVideoFileFullscreen = currentFile && currentFile.file_type.startsWith("video/");

  // Fullscreen modal using Dialog with proper portal
  const FullscreenModal = () => (
    <Dialog open={isExpanded} onOpenChange={expandedState.set}>
      <DialogPortal>
        <DialogOverlay className="bg-black" />
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Close button - always visible, top right */}
          <button
            onClick={expandedState.setFalse}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close fullscreen"
          >
            <X className="size-6 text-white" />
          </button>

          {/* Rotate button - mobile only, for video content */}
          {isMobile && (videoEmbed || isVideoFileFullscreen) && (
            <button
              onClick={handleRotateScreen}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
              aria-label={isLandscape ? "Exit landscape mode" : "Rotate to landscape"}
            >
              <RotateCcw className={cn("size-5 text-white", isLandscape && "rotate-90")} />
              <span className="text-white text-xs hidden sm:inline">
                {isLandscape ? "Portrait" : "Landscape"}
              </span>
            </button>
          )}

          {/* Rotate hint toast - shown when API not supported */}
          {showRotateHint && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/90 text-gray-900 px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2">
              <Smartphone className="size-4 rotate-90" />
              <span className="text-sm font-medium">Rotate your device for best viewing</span>
            </div>
          )}

          {/* Zoom controls for images */}
          {isImageFullscreen && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="size-8 text-white hover:bg-white/20"
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="text-white text-sm font-medium min-w-[50px] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="size-8 text-white hover:bg-white/20"
              >
                <ZoomIn className="size-4" />
              </Button>
            </div>
          )}

          {/* Image preview */}
          {isImageFullscreen && currentFile && (
            <img
              src={getFileUrl(currentFile.file_url)}
              alt={currentFile.file_name}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          )}

          {/* Video file preview */}
          {isVideoFileFullscreen && currentFile && (
            <video
              src={getFileUrl(currentFile.file_url)}
              controls
              autoPlay
              className="max-h-[90vh] max-w-[90vw]"
            >
              Your browser does not support the video tag.
            </video>
          )}

          {/* Video embed preview (YouTube, Twitch, etc.) */}
          {!currentFile && videoEmbed && (
            <div className="w-full max-w-5xl aspect-video px-4">
              {videoEmbed.provider === 'direct' ? (
                <video
                  src={videoEmbed.embedUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={videoEmbed.embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Video preview"
                />
              )}
            </div>
          )}

          {/* File navigation */}
          {hasMultipleFiles && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevFile}
                className="size-8 text-white hover:bg-white/20"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-white text-sm">
                {currentFileIndex + 1} / {files.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextFile}
                className="size-8 text-white hover:bg-white/20"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogPortal>
    </Dialog>
  );

  return (
    <>
      {/* Fullscreen Modal */}
      <FullscreenModal />

      <div
        className={cn(
          "rounded-2xl border-2 border-accent-blue/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 overflow-hidden",
          isPinned && "lg:sticky lg:top-4",
          className
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-accent-blue/20 bg-background/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            {videoEmbed ? (
              <Play className="size-4 text-accent-blue" />
            ) : (
              <Eye className="size-4 text-accent-blue" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {files.length > 0
                ? `${files.length} file${files.length !== 1 ? "s" : ""} to review`
                : videoEmbed
                  ? `${getProviderName(videoEmbed.provider)} video`
                  : externalUrl
                    ? "External content"
                    : "Content to review"
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={pinnedState.toggle}
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
            onClick={collapsedState.setTrue}
            className="size-8"
            title="Collapse panel"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={expandedState.setTrue}
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

        {/* Video File Preview (direct uploads) */}
        {currentFile && isVideoFile(currentFile.file_type) && (
          <div className="p-4 relative">
            <video
              ref={videoRef}
              src={getFileUrl(currentFile.file_url)}
              controls
              className="w-full max-h-[400px] rounded-lg bg-black"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
            {/* PiP Button */}
            {isPiPSupported && (
              <button
                onClick={handlePiPToggle}
                className={cn(
                  "absolute top-6 right-6 p-2 rounded-full transition-colors",
                  isPiPActive
                    ? "bg-accent-blue text-white"
                    : "bg-black/60 text-white hover:bg-black/80"
                )}
                title={isPiPActive ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
              >
                <PictureInPicture2 className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* No files - show video embed or external link */}
        {files.length === 0 && (
          <div className="p-4">
            {/* Video Embed (YouTube, Vimeo, Twitch, etc.) */}
            {videoEmbed && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Play className="size-4" />
                  <span>{getProviderName(videoEmbed.provider)}</span>
                </div>
                {videoEmbed.provider === 'direct' ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={videoEmbed.embedUrl}
                      controls
                      className="w-full aspect-video rounded-lg bg-black"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                    {/* PiP Button */}
                    {isPiPSupported && (
                      <button
                        onClick={handlePiPToggle}
                        className={cn(
                          "absolute top-2 right-2 p-2 rounded-full transition-colors",
                          isPiPActive
                            ? "bg-accent-blue text-white"
                            : "bg-black/60 text-white hover:bg-black/80"
                        )}
                        title={isPiPActive ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
                      >
                        <PictureInPicture2 className="size-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                      <iframe
                        src={videoEmbed.embedUrl}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video preview"
                      />
                    </div>
                    {/* PiP hint for iframe embeds on mobile */}
                    {isMobile && (
                      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                        <PictureInPicture2 className="size-3" />
                        Use player controls for Picture-in-Picture
                      </p>
                    )}
                  </div>
                )}
                {externalUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(externalUrl, "_blank")}
                    className="w-full text-xs"
                  >
                    <ExternalLink className="size-3 mr-1.5" />
                    Open in new tab
                  </Button>
                )}
              </div>
            )}

            {/* Non-video external link */}
            {!videoEmbed && externalUrl && (
              <div className="text-center py-4">
                {description && (
                  <p className="text-sm text-muted-foreground mb-4">{description}</p>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.open(externalUrl, "_blank")}
                >
                  <ExternalLink className="size-4 mr-2" />
                  View External Link
                </Button>
              </div>
            )}

            {/* No content at all */}
            {!videoEmbed && !externalUrl && (
              <div className="text-center py-4">
                {description && (
                  <p className="text-sm text-muted-foreground mb-4">{description}</p>
                )}
                {!description && (
                  <p className="text-sm text-muted-foreground">
                    No preview available for this content type
                  </p>
                )}
              </div>
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
        <div className="flex items-center justify-between p-2 border-t border-accent-blue/20 bg-background/40">
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
        <div className="p-2 border-t border-accent-blue/20 bg-background/40">
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
    </>
  );
}
