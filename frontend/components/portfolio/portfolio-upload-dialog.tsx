"use client";

/**
 * Portfolio Upload Dialog
 *
 * Allows users to upload self-documented portfolio items (max 3).
 * Supports before/after image comparison for showcasing growth.
 */

import { useState, useCallback } from "react";
import { useFormState } from "@/hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Image as ImageIcon,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  Palette,
  Video,
  Mic,
  FileText,
  Brush,
  Cast,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createPortfolioItem,
  type PortfolioContentType,
  type CreatePortfolioData,
} from "@/lib/api/profile/portfolio";
import { uploadGenericFile } from "@/lib/api/reviews/files";

interface PortfolioUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotsRemaining: number;
  onSuccess?: () => void;
}

const contentTypeOptions: { value: PortfolioContentType; label: string; icon: React.ElementType }[] = [
  { value: "design", label: "Design", icon: Palette },
  { value: "photography", label: "Photography", icon: Camera },
  { value: "video", label: "Video", icon: Video },
  { value: "stream", label: "Stream/VOD", icon: Cast },
  { value: "audio", label: "Audio/Music", icon: Mic },
  { value: "writing", label: "Writing", icon: FileText },
  { value: "art", label: "Art", icon: Brush },
];

export function PortfolioUploadDialog({
  open,
  onOpenChange,
  slotsRemaining,
  onSuccess,
}: PortfolioUploadDialogProps) {
  const [step, setStep] = useState<"form" | "uploading" | "success" | "error">("form");
  const [error, setError] = useState<string | null>(null);

  // Form state using useFormState
  const form = useFormState({
    title: "",
    description: "",
    contentType: "design" as PortfolioContentType,
    projectUrl: "",
    beforeImage: null as File | null,
    afterImage: null as File | null,
    beforePreview: null as string | null,
    afterPreview: null as string | null,
  });

  const resetForm = useCallback(() => {
    setStep("form");
    setError(null);
    form.reset();
  }, [form]);

  const handleImageSelect = useCallback((
    file: File | null,
    type: "before" | "after"
  ) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === "before") {
        form.setValue("beforeImage", file);
        form.setValue("beforePreview", e.target?.result as string);
      } else {
        form.setValue("afterImage", file);
        form.setValue("afterPreview", e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, [form]);

  const handleSubmit = async () => {
    if (!form.values.title.trim()) {
      setError("Please enter a title for your work");
      return;
    }

    if (!form.values.afterImage) {
      setError("Please upload at least an after/current image of your work");
      return;
    }

    setStep("uploading");
    setError(null);

    try {
      // Upload images first
      let beforeImageUrl: string | undefined;
      let afterImageUrl: string | undefined;

      if (form.values.beforeImage) {
        const beforeResponse = await uploadGenericFile(form.values.beforeImage, "portfolio");
        beforeImageUrl = beforeResponse.url;
      }

      const afterResponse = await uploadGenericFile(form.values.afterImage, "portfolio");
      afterImageUrl = afterResponse.url;

      // Create portfolio item
      const data: CreatePortfolioData = {
        title: form.values.title.trim(),
        description: form.values.description.trim() || undefined,
        content_type: form.values.contentType,
        image_url: afterImageUrl,
        before_image_url: beforeImageUrl,
        project_url: form.values.projectUrl.trim() || undefined,
      };

      await createPortfolioItem(data);
      setStep("success");

      // Close and refresh after brief delay
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      }, 1500);

    } catch (err: unknown) {
      setStep("error");
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create portfolio item. Please try again.");
      }
    }
  };

  const handleClose = () => {
    if (step !== "uploading") {
      onOpenChange(false);
      resetForm();
    }
  };

  const canSubmit = slotsRemaining > 0 && form.values.title.trim() && form.values.afterImage;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-accent-blue" />
            Add Portfolio Work
          </DialogTitle>
          <DialogDescription>
            Showcase your best work with optional before/after comparison.
            <Badge variant="secondary" className="ml-2">
              {slotsRemaining} / 3 slots remaining
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-4"
            >
              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="My Creative Project"
                    value={form.values.title}
                    onChange={(e) => form.setValue("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select value={form.values.contentType} onValueChange={(v) => form.setValue("contentType", v as PortfolioContentType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="size-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your work and growth journey..."
                  value={form.values.description}
                  onChange={(e) => form.setValue("description", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Before/After Images */}
              <div className="space-y-3">
                <Label>Images</Label>
                <p className="text-sm text-muted-foreground">
                  Upload a before and after image to showcase your growth, or just the final result.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Before Image */}
                  <ImageUploadZone
                    label="Before (Optional)"
                    preview={form.values.beforePreview}
                    onSelect={(f) => handleImageSelect(f, "before")}
                    onClear={() => {
                      form.setValue("beforeImage", null);
                      form.setValue("beforePreview", null);
                    }}
                  />

                  {/* Arrow */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden sm:block">
                    <div className="size-8 rounded-full bg-background border border-border flex items-center justify-center">
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* After Image */}
                  <ImageUploadZone
                    label="After/Current *"
                    preview={form.values.afterPreview}
                    onSelect={(f) => handleImageSelect(f, "after")}
                    onClear={() => {
                      form.setValue("afterImage", null);
                      form.setValue("afterPreview", null);
                    }}
                    required
                  />
                </div>
              </div>

              {/* Project URL */}
              <div className="space-y-2">
                <Label htmlFor="projectUrl">Project URL (Optional)</Label>
                <Input
                  id="projectUrl"
                  type="url"
                  placeholder="https://example.com/project"
                  value={form.values.projectUrl}
                  onChange={(e) => form.setValue("projectUrl", e.target.value)}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}

              {/* No slots warning */}
              {slotsRemaining === 0 && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You&apos;ve used all 3 self-documented slots. Complete reviews on the platform
                    to earn unlimited verified portfolio entries!
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="gap-2"
                >
                  <Upload className="size-4" />
                  Add to Portfolio
                </Button>
              </div>
            </motion.div>
          )}

          {step === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <Loader2 className="size-12 mx-auto text-accent-blue animate-spin mb-4" />
              <p className="text-lg font-medium">Uploading your work...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle2 className="size-16 mx-auto text-emerald-500 mb-4" />
              </motion.div>
              <p className="text-lg font-medium text-foreground">Successfully Added!</p>
              <p className="text-sm text-muted-foreground">
                Your work is now part of your portfolio
              </p>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <AlertCircle className="size-16 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-foreground">Upload Failed</p>
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button onClick={() => setStep("form")}>Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

interface ImageUploadZoneProps {
  label: string;
  preview: string | null;
  onSelect: (file: File | null) => void;
  onClear: () => void;
  required?: boolean;
}

function ImageUploadZone({ label, preview, onSelect, onClear, required }: ImageUploadZoneProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onSelect(file);
    }
  }, [onSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
    }
  }, [onSelect]);

  return (
    <div className="relative">
      <p className="text-sm font-medium mb-2">{label}</p>
      {preview ? (
        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 size-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            "border-muted-foreground/25 hover:border-accent-blue hover:bg-accent-blue/5",
            required && "border-muted-foreground/40"
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <ImageIcon className="size-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">
            Drop image or click to upload
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
        </label>
      )}
    </div>
  );
}
