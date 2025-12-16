"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useFormState, useToggle } from "@/hooks";
import {
  Share2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
} from "lucide-react";
import { LightboxWatermark } from "@/components/ui/watermark-overlay";
import { getFileUrl, formatFileSize } from "./constants";

interface FileItem {
  id: number;
  file_url?: string | null;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
}

interface LightboxProps {
  imageFiles: FileItem[];
  lightboxIndex: number | null;
  setLightboxIndex: (index: number | null) => void;
  isOwner: boolean;
  onShare: () => void;
}

export function Lightbox({
  imageFiles,
  lightboxIndex,
  setLightboxIndex,
  isOwner,
  onShare,
}: LightboxProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const draggingState = useToggle();
  const isDragging = draggingState.value;

  const lightboxView = useFormState({
    zoom: 1,
    rotation: 0,
    dragPosition: { x: 0, y: 0 },
    dragStart: { x: 0, y: 0 },
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentLightboxFile = lightboxIndex !== null ? imageFiles[lightboxIndex] : null;

  const resetLightboxView = React.useCallback(() => {
    lightboxView.setValue("zoom", 1);
    lightboxView.setValue("rotation", 0);
    lightboxView.setValue("dragPosition", { x: 0, y: 0 });
  }, [lightboxView]);

  const openLightbox = React.useCallback((imageIndex: number) => {
    setLightboxIndex(imageIndex);
    resetLightboxView();
  }, [setLightboxIndex, resetLightboxView]);

  const closeLightbox = React.useCallback(() => {
    setLightboxIndex(null);
    resetLightboxView();
  }, [setLightboxIndex, resetLightboxView]);

  const goToPrevImage = React.useCallback(() => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
      resetLightboxView();
    }
  }, [lightboxIndex, setLightboxIndex, resetLightboxView]);

  const goToNextImage = React.useCallback(() => {
    if (lightboxIndex !== null && lightboxIndex < imageFiles.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
      resetLightboxView();
    }
  }, [lightboxIndex, imageFiles.length, setLightboxIndex, resetLightboxView]);

  const handleZoomIn = React.useCallback(() => {
    lightboxView.setValue("zoom", Math.min(lightboxView.values.zoom + 0.5, 4));
  }, [lightboxView]);

  const handleZoomOut = React.useCallback(() => {
    const newZoom = Math.max(lightboxView.values.zoom - 0.5, 0.5);
    lightboxView.setValue("zoom", newZoom);
    if (newZoom <= 1) lightboxView.setValue("dragPosition", { x: 0, y: 0 });
  }, [lightboxView]);

  const handleRotate = React.useCallback(() => {
    lightboxView.setValue("rotation", (lightboxView.values.rotation + 90) % 360);
  }, [lightboxView]);

  const resetView = React.useCallback(() => {
    resetLightboxView();
  }, [resetLightboxView]);

  // Keyboard navigation
  React.useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape": closeLightbox(); break;
        case "ArrowLeft": goToPrevImage(); break;
        case "ArrowRight": goToNextImage(); break;
        case "+": case "=": handleZoomIn(); break;
        case "-": handleZoomOut(); break;
        case "r": case "R": handleRotate(); break;
        case "0": resetView(); break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, closeLightbox, goToPrevImage, goToNextImage, handleZoomIn, handleZoomOut, handleRotate, resetView]);

  // Mouse handlers
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (lightboxView.values.zoom > 1) {
      draggingState.setTrue();
      lightboxView.setValue("dragStart", {
        x: e.clientX - lightboxView.values.dragPosition.x,
        y: e.clientY - lightboxView.values.dragPosition.y,
      });
    }
  }, [lightboxView, draggingState]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (isDragging && lightboxView.values.zoom > 1) {
      lightboxView.setValue("dragPosition", {
        x: e.clientX - lightboxView.values.dragStart.x,
        y: e.clientY - lightboxView.values.dragStart.y,
      });
    }
  }, [isDragging, lightboxView]);

  const handleMouseUp = React.useCallback(() => draggingState.setFalse(), [draggingState]);

  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  }, [handleZoomIn, handleZoomOut]);

  if (!isMounted || lightboxIndex === null || !currentLightboxFile) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black flex flex-col"
      style={{ zIndex: 99999 }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-black border-b border-white/10">
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-medium text-white truncate text-sm sm:text-base">
            {currentLightboxFile.original_filename}
          </p>
          <p className="text-xs sm:text-sm text-white/60">
            {formatFileSize(currentLightboxFile.file_size)} • {lightboxIndex + 1} of {imageFiles.length}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onShare}
            className="p-2 sm:p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Share"
          >
            <Share2 className="size-5" />
          </button>
          {isOwner && (
            <a
              href={getFileUrl(currentLightboxFile)}
              download={currentLightboxFile.original_filename}
              className="p-2 sm:p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Download"
            >
              <Download className="size-5" />
            </a>
          )}
          <button
            onClick={closeLightbox}
            className="p-2 sm:p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            title="Close (Esc)"
          >
            <X className="size-5 sm:size-6" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center bg-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        style={{ cursor: lightboxView.values.zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        {/* Navigation Arrows */}
        {imageFiles.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
              disabled={lightboxIndex === 0}
              className={cn(
                "absolute left-4 z-10 p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 transition-all",
                lightboxIndex === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-black/70 hover:scale-110 text-white/80 hover:text-white"
              )}
              title="Previous"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
              disabled={lightboxIndex === imageFiles.length - 1}
              className={cn(
                "absolute right-4 z-10 p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 transition-all",
                lightboxIndex === imageFiles.length - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-black/70 hover:scale-110 text-white/80 hover:text-white"
              )}
              title="Next"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}

        {/* Image Container */}
        <div className="relative max-w-full max-h-full">
          <img
            src={getFileUrl(currentLightboxFile)}
            alt={currentLightboxFile.original_filename}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{
              transform: `translate(${lightboxView.values.dragPosition.x}px, ${lightboxView.values.dragPosition.y}px) scale(${lightboxView.values.zoom}) rotate(${lightboxView.values.rotation}deg)`,
            }}
            draggable={false}
            onContextMenu={(e) => !isOwner && e.preventDefault()}
          />
          {!isOwner && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${lightboxView.values.dragPosition.x}px, ${lightboxView.values.dragPosition.y}px) scale(${lightboxView.values.zoom}) rotate(${lightboxView.values.rotation}deg)`,
              }}
            >
              <LightboxWatermark opacity={12} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 bg-black border-t border-white/10">
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
            <button
              onClick={handleZoomOut}
              disabled={lightboxView.values.zoom <= 0.5}
              className={cn(
                "p-2 rounded-full transition-colors",
                lightboxView.values.zoom <= 0.5 ? "text-white/30 cursor-not-allowed" : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              title="Zoom Out"
            >
              <ZoomOut className="size-5" />
            </button>
            <span className="px-3 text-sm font-medium text-white/80 min-w-[60px] text-center">
              {Math.round(lightboxView.values.zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={lightboxView.values.zoom >= 4}
              className={cn(
                "p-2 rounded-full transition-colors",
                lightboxView.values.zoom >= 4 ? "text-white/30 cursor-not-allowed" : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              title="Zoom In"
            >
              <ZoomIn className="size-5" />
            </button>
          </div>
          <button
            onClick={handleRotate}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            title="Rotate"
          >
            <RotateCw className="size-5" />
          </button>
          <button
            onClick={resetView}
            className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            title="Reset View"
          >
            <Maximize2 className="size-5" />
          </button>
        </div>

        {/* Thumbnail Strip */}
        {imageFiles.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 overflow-x-auto pb-2">
            {imageFiles.map((file, idx) => (
              <button
                key={file.id}
                onClick={() => openLightbox(idx)}
                className={cn(
                  "shrink-0 size-14 rounded-lg overflow-hidden border-2 transition-all",
                  idx === lightboxIndex
                    ? "border-white ring-2 ring-white/30 scale-110"
                    : "border-transparent opacity-60 hover:opacity-100 hover:border-white/50"
                )}
              >
                <img
                  src={getFileUrl(file)}
                  alt={file.original_filename}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-white/40 mt-3 hidden sm:block">
          Arrows Navigate | +- Zoom | R Rotate | 0 Reset | Esc Close
        </p>
      </div>
    </div>,
    document.body
  );
}
