/**
 * Content Viewer (Read-Only)
 *
 * Simplified content viewer for displaying reviewed content with annotations.
 * No editing capabilities - purely for viewing submitted reviews.
 */

"use client";

import * as React from "react";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { StudioAnnotation } from "@/lib/types/review-studio";
import { parseVideoUrl, getProviderName } from "@/lib/utils/video-embed";

// ===== Props =====

interface ContentViewerReadOnlyProps {
  imageUrl?: string;
  externalUrl?: string | null;
  annotations?: StudioAnnotation[];
  className?: string;
}

// ===== Helper =====

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ===== Component =====

export function ContentViewerReadOnly({
  imageUrl,
  externalUrl,
  annotations = [],
  className,
}: ContentViewerReadOnlyProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);

  // Parse external URL for video embedding
  const videoEmbed = React.useMemo(() => {
    if (externalUrl) {
      return parseVideoUrl(externalUrl);
    }
    return null;
  }, [externalUrl]);

  // Get pin annotations
  const pinAnnotations = annotations.filter(
    (ann) => ann.type === "pin" && ann.x !== undefined && ann.y !== undefined
  );

  // Get timestamp annotations
  const timestampAnnotations = annotations
    .filter((ann) => ann.type === "timestamp" && ann.timestamp !== undefined)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  // No image - check for video embed or external link
  if (!imageUrl) {
    // Video embed (YouTube, Vimeo, etc.)
    if (videoEmbed) {
      return (
        <div className={cn("h-full flex flex-col", className)}>
          {/* Video Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{getProviderName(videoEmbed.provider)}</span>
              {timestampAnnotations.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {timestampAnnotations.length} timestamp{timestampAnnotations.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {externalUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(externalUrl, "_blank")}
                  className="h-8 w-8"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-4 bg-black/5 min-h-0">
              <div className="w-full max-w-3xl aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
                {videoEmbed.provider === "direct" ? (
                  <video
                    src={videoEmbed.embedUrl}
                    className="w-full h-full"
                    controls
                    preload="metadata"
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
            </div>
          </div>

          {/* Timestamp Annotations List */}
          {timestampAnnotations.length > 0 && (
            <div className="border-t bg-muted/30 max-h-48 overflow-y-auto">
              <div className="p-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Timestamp Annotations
                </h4>
                {timestampAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="flex items-start gap-3 p-2 rounded-lg bg-background border"
                  >
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-mono font-medium bg-blue-100 text-blue-700 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(annotation.timestamp!)}
                    </span>
                    <div className="flex-1 min-w-0">
                      {annotation.comment ? (
                        <p className="text-sm">{annotation.comment}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No comment</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Non-video external link
    if (externalUrl) {
      return (
        <div className={cn("h-full flex flex-col items-center justify-center p-8", className)}>
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
              <ExternalLink className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">External Content</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                This review contains an external link
              </p>
              <Button onClick={() => window.open(externalUrl, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View External Link
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // No content at all
    return (
      <div className={cn("h-full flex flex-col items-center justify-center p-8", className)}>
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">No content uploaded</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The creator did not upload an image for this review
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {pinAnnotations.length} annotation{pinAnnotations.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleResetZoom} className="h-8 w-8">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image container with annotations */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={containerRef}
          className="relative inline-block rounded-lg border overflow-hidden shadow-sm mx-auto"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center top",
          }}
        >
          {/* Image */}
          <img
            src={imageUrl}
            alt="Reviewed content"
            className="w-full h-auto pointer-events-none select-none"
            draggable={false}
          />

          {/* Annotation pins (read-only) */}
          {pinAnnotations.map((annotation) => (
            <Popover key={annotation.id}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "absolute z-10 flex items-center justify-center",
                    "size-7 rounded-full border-2 border-white shadow-lg",
                    "text-white text-xs font-bold",
                    "transition-all duration-200",
                    "hover:scale-110",
                    "bg-blue-500 hover:bg-blue-600"
                  )}
                  style={{
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {annotation.number || "?"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-background shadow-lg" align="center" side="top" sideOffset={8} showArrow>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Annotation #{annotation.number}
                  </h4>
                  {annotation.comment ? (
                    <p className="text-sm text-foreground">{annotation.comment}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No comment provided</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>

      {/* Annotation list */}
      {pinAnnotations.length > 0 && (
        <div className="border-t bg-muted/30 p-3 max-h-40 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {pinAnnotations.map((annotation) => (
              <span
                key={annotation.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
              >
                <span className="font-bold">#{annotation.number}</span>
                {annotation.comment && (
                  <span className="truncate max-w-[100px]">
                    {annotation.comment}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentViewerReadOnly;
