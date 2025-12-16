"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { WatermarkOverlay } from "@/components/ui/watermark-overlay";
import { Image, FileText, Download, Eye, Shield } from "lucide-react";
import { getFileUrl, isImageFile, formatFileSize } from "./constants";

interface FileItem {
  id: number;
  file_url?: string | null;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
}

interface FilesGalleryProps {
  files: FileItem[];
  isOwner: boolean;
  onOpenLightbox: (imageIndex: number) => void;
}

export function FilesGallery({ files, isOwner, onOpenLightbox }: FilesGalleryProps) {
  const imageFiles = React.useMemo(() => files.filter(isImageFile), [files]);

  const handleDownloadAll = () => {
    if (files.length === 0) {
      toast.info("No files to download");
      return;
    }
    files.forEach((file) => {
      const url = getFileUrl(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    toast.success(`Downloading ${files.length} file(s)...`);
  };

  if (!files || files.length === 0) return null;

  return (
    <section className="rounded-3xl bg-white dark:bg-[var(--dark-tier-2)] border border-gray-100 dark:border-gray-800 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Image className="size-4 text-accent-blue" />
          </div>
          Files ({files.length})
        </h2>
        {isOwner ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="gap-2 hover:bg-accent-blue/5 hover:border-accent-blue/30 hover:text-accent-blue"
          >
            <Download className="size-4" />
            Download All
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Shield className="size-4" />
            <span>Protected</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {files.map((file, index) => {
          const isImage = isImageFile(file);
          const fileUrl = getFileUrl(file);
          const imageIndex = isImage ? imageFiles.findIndex(f => f.id === file.id) : -1;

          return (
            <div
              key={file.id}
              className={cn(
                "group relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[var(--dark-tier-3)]",
                "hover:border-accent-blue/30 hover:shadow-lg transition-all duration-300",
                index === 0 && files.length > 1 && "sm:col-span-2"
              )}
            >
              {isImage ? (
                <div
                  className={cn(
                    "relative cursor-zoom-in",
                    index === 0 && files.length > 1 ? "aspect-video" : "aspect-[4/3]"
                  )}
                  onClick={() => onOpenLightbox(imageIndex)}
                  onContextMenu={(e) => !isOwner && e.preventDefault()}
                >
                  <img
                    src={fileUrl}
                    alt={file.original_filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    draggable={isOwner}
                  />
                  {!isOwner && <WatermarkOverlay opacity={15} fontSize="sm" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 z-20">
                    <div className="text-white">
                      <p className="font-medium truncate max-w-[200px]">{file.original_filename}</p>
                      <p className="text-sm text-white/70">{formatFileSize(file.file_size)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLightbox(imageIndex);
                        }}
                      >
                        <Eye className="size-4" />
                      </button>
                      {isOwner && (
                        <a
                          href={fileUrl}
                          download={file.original_filename}
                          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="size-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 flex items-center gap-4">
                  <div className="size-14 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                    <FileText className="size-6 text-accent-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{file.original_filename}</p>
                    <p className="text-sm text-foreground-muted">{formatFileSize(file.file_size)}</p>
                  </div>
                  {isOwner ? (
                    <a
                      href={fileUrl}
                      download={file.original_filename}
                      className="p-2 rounded-lg hover:bg-accent-blue/10 text-foreground-muted hover:text-accent-blue transition-colors"
                    >
                      <Download className="size-5" />
                    </a>
                  ) : (
                    <div className="p-2 text-foreground-muted/50" title="Downloads disabled for reviewers">
                      <Shield className="size-5" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
