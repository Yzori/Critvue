/**
 * Content Viewer Component
 *
 * Interactive content viewer with annotation support.
 * Integrates with Review Studio context for:
 * - Adding annotations
 * - Linking annotations to cards
 * - Creating cards from annotations
 */

"use client";

import * as React from "react";
import {
  MapPin,
  X,
  Plus,
  AlertTriangle,
  ThumbsUp,
  Link2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  ExternalLink,
  Maximize2,
  Clock,
  SkipBack,
  SkipForward,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";

import type { StudioAnnotation } from "@/lib/types/review-studio";
import { useReviewStudio } from "../context/ReviewStudioContext";
import { parseVideoUrl, getProviderName } from "@/lib/utils/video-embed";

// ===== Props =====

interface ContentViewerProps {
  imageUrl?: string;
  externalUrl?: string | null;
  className?: string;
}

// ===== Component =====

// ===== Helper: Format seconds to MM:SS =====
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ===== Helper: Parse MM:SS to seconds =====
function parseTimestampInput(input: string): number | null {
  // Handle formats: "1:30", "01:30", "90" (seconds only)
  const colonMatch = input.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch && colonMatch[1] && colonMatch[2]) {
    const mins = parseInt(colonMatch[1], 10);
    const secs = parseInt(colonMatch[2], 10);
    if (secs < 60) {
      return mins * 60 + secs;
    }
  }
  // Try pure seconds
  const secondsOnly = parseInt(input, 10);
  if (!isNaN(secondsOnly) && secondsOnly >= 0) {
    return secondsOnly;
  }
  return null;
}

export function ContentViewer({ imageUrl, externalUrl, className }: ContentViewerProps) {
  const {
    state,
    addAnnotation,
    dispatch,
    createCardFromAnnotation,
  } = useReviewStudio();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editComment, setEditComment] = React.useState("");
  const [zoom, setZoom] = React.useState(1);
  const [_isFullscreen, setIsFullscreen] = React.useState(false);

  // Video-specific state
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [manualTimestamp, setManualTimestamp] = React.useState("");

  // Parse external URL for video embedding
  const videoEmbed = React.useMemo(() => {
    if (externalUrl) {
      return parseVideoUrl(externalUrl);
    }
    return null;
  }, [externalUrl]);

  const isAnnotateMode = state.selectionMode === "annotate";
  const isDirectVideo = videoEmbed?.provider === "direct";

  // Get timestamp annotations sorted by time
  const timestampAnnotations = React.useMemo(() => {
    return state.annotations
      .filter((ann) => ann.type === "timestamp" && ann.timestamp !== undefined)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [state.annotations]);

  // Handle adding timestamp annotation
  const handleAddTimestampAnnotation = (time?: number) => {
    const timestamp = time ?? (isDirectVideo ? currentTime : parseTimestampInput(manualTimestamp));
    if (timestamp === null || timestamp < 0) return;

    addAnnotation({
      type: "timestamp",
      timestamp,
    });

    setManualTimestamp("");
  };

  // Handle seeking to timestamp
  const handleSeekToTimestamp = (timestamp: number) => {
    if (videoRef.current && isDirectVideo) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  // Handle click on image to add new pin
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only add pins in annotate mode
    if (!isAnnotateMode) return;

    // Don't add pin if clicking on existing pin
    if ((e.target as HTMLElement).closest("[data-annotation-pin]")) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    addAnnotation({
      type: "pin",
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });

    // Exit annotate mode after adding
    dispatch({ type: "SET_SELECTION_MODE", payload: "normal" });
  };

  // Handle pin drag
  const handleDrag = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    dispatch({
      type: "UPDATE_ANNOTATION",
      payload: {
        id: draggingId,
        updates: {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
        },
      },
    });
  };

  // Handle pin drag end
  const handleDragEnd = () => {
    setDraggingId(null);
  };

  // Handle edit comment
  const handleEditComment = (id: string) => {
    const annotation = state.annotations.find((ann) => ann.id === id);
    if (!annotation) return;

    setEditingId(id);
    setEditComment(annotation.comment || "");
  };

  // Handle save comment
  const handleSaveComment = () => {
    if (!editingId) return;

    dispatch({
      type: "UPDATE_ANNOTATION",
      payload: {
        id: editingId,
        updates: { comment: editComment.trim() },
      },
    });
    setEditingId(null);
    setEditComment("");
  };

  // Handle delete annotation
  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_ANNOTATION", payload: id });
    if (editingId === id) {
      setEditingId(null);
      setEditComment("");
    }
  };

  // Handle create card from annotation
  const handleCreateCard = (annotation: StudioAnnotation, type: "issue" | "strength") => {
    createCardFromAnnotation(type, annotation);
    setEditingId(null);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Get card for linked annotation
  const getLinkedCard = (annotation: StudioAnnotation) => {
    if (!annotation.linkedCardId) return null;
    return state.issueCards.find((c) => c.id === annotation.linkedCardId);
  };

  // No image - check for video embed or external link
  if (!imageUrl) {
    // Video embed (YouTube, Vimeo, Twitch, etc.)
    if (videoEmbed) {
      return (
        <div className={cn("h-full flex flex-col", className)}>
          {/* Video Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{getProviderName(videoEmbed.provider)}</span>
              <span className="text-xs text-muted-foreground">
                {timestampAnnotations.length} timestamp{timestampAnnotations.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(true)}
                className="h-8 w-8"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
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
                {isDirectVideo ? (
                  <video
                    ref={videoRef}
                    src={videoEmbed.embedUrl}
                    className="w-full h-full"
                    preload="metadata"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
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

            {/* Video Controls (for direct videos) */}
            {isDirectVideo && (
              <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  className="h-8 w-8"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(-10)}
                  className="h-8 w-8"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(10)}
                  className="h-8 w-8"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono text-muted-foreground">
                  {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
                </span>
                <div className="flex-1" />
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAddTimestampAnnotation()}
                  className="gap-1.5"
                >
                  <Clock className="h-4 w-4" />
                  Add Timestamp
                </Button>
              </div>
            )}

            {/* Manual timestamp input (for iframe embeds) */}
            {!isDirectVideo && (
              <div className="px-4 py-3 border-t bg-muted/30">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={manualTimestamp}
                    onChange={(e) => setManualTimestamp(e.target.value)}
                    placeholder="Enter time (e.g. 1:30 or 90)"
                    className="flex-1 h-8 px-3 text-sm rounded-md border bg-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddTimestampAnnotation();
                      }
                    }}
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAddTimestampAnnotation()}
                    disabled={!manualTimestamp.trim()}
                  >
                    Add Timestamp
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Note the timestamp while watching, then add it here to create an annotation.
                </p>
              </div>
            )}
          </div>

          {/* Timestamp Annotations List */}
          {timestampAnnotations.length > 0 && (
            <div className="border-t bg-muted/30 max-h-48 overflow-y-auto">
              <div className="p-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Timestamp Annotations
                </h4>
                {timestampAnnotations.map((annotation) => {
                  const linkedCard = getLinkedCard(annotation);
                  return (
                    <div
                      key={annotation.id}
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-lg transition-colors",
                        "bg-background hover:bg-accent/50 border",
                        linkedCard ? "border-orange-200" : "border-transparent"
                      )}
                    >
                      {/* Timestamp badge - clickable for direct videos */}
                      <button
                        onClick={() => isDirectVideo && handleSeekToTimestamp(annotation.timestamp!)}
                        disabled={!isDirectVideo}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-mono font-medium shrink-0",
                          isDirectVideo
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                            : "bg-muted text-muted-foreground cursor-default"
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(annotation.timestamp!)}
                      </button>

                      {/* Comment and actions */}
                      <div className="flex-1 min-w-0">
                        {editingId === annotation.id ? (
                          <div className="space-y-2">
                            <AutoGrowTextarea
                              value={editComment}
                              onChange={setEditComment}
                              placeholder="Add a note about this moment..."
                              className="text-sm"
                              minRows={2}
                              maxLength={500}
                            />
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={handleSaveComment}>
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditComment("");
                                }}
                              >
                                Cancel
                              </Button>
                              {!linkedCard && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5 ml-auto">
                                      <Plus className="h-3 w-3" />
                                      Create Card
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => handleCreateCard(annotation, "issue")}
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                                      Issue Card
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleCreateCard(annotation, "strength")}
                                    >
                                      <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                                      Strength Card
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => handleEditComment(annotation.id)}
                              className="text-left text-sm flex-1"
                            >
                              {annotation.comment ? (
                                <span>{annotation.comment}</span>
                              ) : (
                                <span className="text-muted-foreground italic">Click to add note...</span>
                              )}
                              {linkedCard && (
                                <span className="inline-flex items-center gap-1 ml-2 text-xs text-orange-600">
                                  <Link2 className="h-3 w-3" />
                                  Linked
                                </span>
                              )}
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(annotation.id)}
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state for timestamp annotations */}
          {timestampAnnotations.length === 0 && (
            <div className="border-t bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground text-center">
                {isDirectVideo
                  ? "Play the video and click \"Add Timestamp\" to mark important moments"
                  : "Watch the video in the player above and enter timestamps to annotate key moments"}
              </p>
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
            <h3 className="font-medium">No content to review</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The content will appear here for annotation
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
            {state.annotations.length} annotation{state.annotations.length !== 1 ? "s" : ""}
          </span>
          {isAnnotateMode && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">
              Click on image to add pin
            </span>
          )}
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
          className={cn(
            "relative inline-block rounded-lg border overflow-hidden shadow-sm mx-auto",
            isAnnotateMode ? "cursor-crosshair" : "cursor-default"
          )}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center top",
          }}
          onClick={handleImageClick}
          onMouseMove={draggingId ? handleDrag : undefined}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {/* Image */}
          <img
            src={imageUrl}
            alt="Content to review"
            className="w-full h-auto pointer-events-none select-none"
            draggable={false}
          />

          {/* Annotate mode overlay */}
          {isAnnotateMode && (
            <div className="absolute inset-0 bg-blue-500/5 border-2 border-blue-500 border-dashed pointer-events-none" />
          )}

          {/* Annotation pins */}
          {state.annotations.map((annotation) => {
            if (annotation.type !== "pin" || annotation.x === undefined || annotation.y === undefined) {
              return null;
            }

            const linkedCard = getLinkedCard(annotation);
            const isActive = state.activeCardId === linkedCard?.id;

            return (
              <Popover
                key={annotation.id}
                open={editingId === annotation.id}
                onOpenChange={(open) => {
                  if (!open && editingId === annotation.id) {
                    setEditingId(null);
                    setEditComment("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    data-annotation-pin
                    className={cn(
                      "absolute z-10 flex items-center justify-center",
                      "size-7 rounded-full border-2 border-white shadow-lg",
                      "text-white text-xs font-bold",
                      "transition-all duration-200",
                      "hover:scale-110 active:scale-95",
                      draggingId === annotation.id
                        ? "bg-blue-500 scale-110 cursor-grabbing"
                        : linkedCard
                          ? "bg-orange-500 cursor-grab hover:bg-orange-600"
                          : "bg-blue-500 cursor-grab hover:bg-blue-600",
                      isActive && "ring-2 ring-offset-2 ring-orange-500 scale-110"
                    )}
                    style={{
                      left: `${annotation.x}%`,
                      top: `${annotation.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingId(annotation.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!draggingId) {
                        handleEditComment(annotation.id);
                      }
                    }}
                  >
                    {annotation.number || "?"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white shadow-lg" align="center" side="top" sideOffset={8} showArrow>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        Annotation #{annotation.number}
                        {linkedCard && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                            <Link2 className="h-3 w-3 inline mr-1" />
                            Linked
                          </span>
                        )}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(annotation.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    {/* Comment */}
                    <AutoGrowTextarea
                      value={editComment}
                      onChange={setEditComment}
                      placeholder="Add a note about this area..."
                      className="text-sm"
                      minRows={2}
                      maxLength={500}
                    />

                    {/* Character count */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{editComment.length}/500</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      {!linkedCard ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Plus className="h-3 w-3" />
                              Create Card
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleCreateCard(annotation, "issue")}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                              Issue Card
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCreateCard(annotation, "strength")}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                              Strength Card
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            dispatch({ type: "SET_ACTIVE_CARD", payload: linkedCard.id });
                            dispatch({ type: "SET_ACTIVE_DECK_TAB", payload: "issues" });
                            setEditingId(null);
                          }}
                        >
                          <Link2 className="h-3 w-3 mr-1.5" />
                          View Card
                        </Button>
                      )}

                      <Button size="sm" onClick={handleSaveComment}>
                        Save
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>

      {/* Annotation list (collapsed view) */}
      {state.annotations.length > 0 && (
        <div className="border-t bg-muted/30 p-3 max-h-40 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {state.annotations.map((annotation) => {
              const linkedCard = getLinkedCard(annotation);
              return (
                <button
                  key={annotation.id}
                  onClick={() => handleEditComment(annotation.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors",
                    linkedCard
                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  )}
                >
                  <span className="font-bold">#{annotation.number}</span>
                  {annotation.comment && (
                    <span className="truncate max-w-[100px]">
                      {annotation.comment}
                    </span>
                  )}
                  {linkedCard && <Link2 className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentViewer;
