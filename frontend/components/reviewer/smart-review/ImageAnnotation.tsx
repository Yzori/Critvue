/**
 * Image Annotation Component
 *
 * Interactive image viewer with draggable pin-point annotations.
 * Features:
 * - Click to add pins
 * - Drag to reposition
 * - Click pin to edit comment
 * - Numbered pins for easy reference
 * - Responsive (percentage-based coordinates)
 */

"use client";

import * as React from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { VisualAnnotation } from "@/lib/types/smart-review";

interface ImageAnnotationProps {
  imageUrl: string;
  annotations: VisualAnnotation[];
  onChange: (annotations: VisualAnnotation[]) => void;
  maxAnnotations?: number;
  className?: string;
}

export function ImageAnnotation({
  imageUrl,
  annotations,
  onChange,
  maxAnnotations = 20,
  className,
}: ImageAnnotationProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editComment, setEditComment] = React.useState("");

  // Handle click on image to add new pin
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't add pin if clicking on existing pin
    if ((e.target as HTMLElement).closest('[data-annotation-pin]')) {
      return;
    }

    if (annotations.length >= maxAnnotations) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newAnnotation: VisualAnnotation = {
      id: crypto.randomUUID(),
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      comment: "",
    };

    onChange([...annotations, newAnnotation]);
    setEditingId(newAnnotation.id);
    setEditComment("");
  };

  // Handle pin drag start
  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  // Handle pin drag
  const handleDrag = (e: React.MouseEvent) => {
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const updated = annotations.map((ann) =>
      ann.id === draggingId
        ? {
            ...ann,
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
          }
        : ann
    );

    onChange(updated);
  };

  // Handle pin drag end
  const handleDragEnd = () => {
    setDraggingId(null);
  };

  // Handle edit comment
  const handleEditComment = (id: string) => {
    const annotation = annotations.find((ann) => ann.id === id);
    if (!annotation) return;

    setEditingId(id);
    setEditComment(annotation.comment);
  };

  // Handle save comment
  const handleSaveComment = () => {
    if (!editingId) return;

    const updated = annotations.map((ann) =>
      ann.id === editingId
        ? { ...ann, comment: editComment.trim() }
        : ann
    );

    onChange(updated);
    setEditingId(null);
    setEditComment("");
  };

  // Handle delete annotation
  const handleDelete = (id: string) => {
    onChange(annotations.filter((ann) => ann.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditComment("");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Image container with pins */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl border-2 border-border overflow-hidden cursor-crosshair bg-muted"
        style={{ minHeight: "400px" }}
        onClick={handleImageClick}
        onMouseMove={draggingId ? handleDrag : undefined}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Image */}
        <img
          src={imageUrl}
          alt="Annotation target"
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />

        {/* Annotation pins */}
        {annotations.map((annotation, index) => (
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
                  "size-8 rounded-full border-2 border-white shadow-lg",
                  "text-white text-sm font-bold",
                  "transition-all duration-200",
                  "hover:scale-110 active:scale-95",
                  draggingId === annotation.id
                    ? "bg-accent-blue scale-110 cursor-grabbing"
                    : "bg-accent-peach cursor-grab hover:bg-accent-peach/80"
                )}
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleDragStart(annotation.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!draggingId) {
                    handleEditComment(annotation.id);
                  }
                }}
              >
                {index + 1}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="center">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">
                    Annotation #{index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(annotation.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <Textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Add your comment here..."
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {editComment.length}/500
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSaveComment}
                    disabled={!editComment.trim()}
                  >
                    Save Comment
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </div>

      {/* Info and legend */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4" />
          <span>
            Click on image to add pins ({annotations.length}/{maxAnnotations})
          </span>
        </div>
        {annotations.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([])}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Annotations list */}
      {annotations.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h4 className="text-sm font-semibold mb-3">Annotations</h4>
          {annotations.map((annotation, index) => (
            <div
              key={annotation.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-shrink-0 size-6 rounded-full bg-accent-peach text-white flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                {annotation.comment ? (
                  <p className="text-sm text-foreground break-words">
                    {annotation.comment}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No comment yet
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditComment(annotation.id)}
                className="flex-shrink-0"
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
