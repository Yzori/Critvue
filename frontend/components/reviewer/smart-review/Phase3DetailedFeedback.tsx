/**
 * Phase 3: Detailed Feedback
 *
 * - Strengths (bullet list, 1-10 items)
 * - Areas for improvement (bullet list, 1-10 items)
 * - Additional notes (optional, rich text)
 * - Visual annotations (for design/art reviews)
 */

"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Phase3DetailedFeedback as Phase3Data, VisualAnnotation } from "@/lib/types/smart-review";
import { ImageAnnotation } from "./ImageAnnotation";

interface Phase3DetailedFeedbackProps {
  data: Phase3Data | null;
  onChange: (data: Phase3Data) => void;
  contentType?: string; // Content type to determine if visual annotations should be shown
  imageUrl?: string; // Image URL for design/art reviews
}

export function Phase3DetailedFeedback({
  data,
  onChange,
  contentType,
  imageUrl,
}: Phase3DetailedFeedbackProps) {
  const [strengths, setStrengths] = React.useState<string[]>(
    data?.strengths || [""]
  );
  const [improvements, setImprovements] = React.useState<string[]>(
    data?.improvements || [""]
  );
  const [additionalNotes, setAdditionalNotes] = React.useState(
    data?.additional_notes || ""
  );
  const [visualAnnotations, setVisualAnnotations] = React.useState<VisualAnnotation[]>(
    data?.visual_annotations || []
  );

  // Determine if we should show image annotations (for design/art content)
  const showImageAnnotations = (contentType === "design" || contentType === "art") && imageUrl;

  // Update parent when any field changes
  React.useEffect(() => {
    const validStrengths = strengths.filter((s) => s.trim().length > 0);
    const validImprovements = improvements.filter((i) => i.trim().length > 0);

    if (validStrengths.length > 0 || validImprovements.length > 0) {
      onChange({
        strengths: validStrengths,
        improvements: validImprovements,
        additional_notes: additionalNotes.trim() || undefined,
        visual_annotations: visualAnnotations.length > 0 ? visualAnnotations : undefined,
      });
    }
  }, [strengths, improvements, additionalNotes, visualAnnotations, onChange]);

  const updateStrength = (index: number, value: string) => {
    const newStrengths = [...strengths];
    newStrengths[index] = value;
    setStrengths(newStrengths);
  };

  const addStrength = () => {
    if (strengths.length < 10) {
      setStrengths([...strengths, ""]);
    }
  };

  const removeStrength = (index: number) => {
    if (strengths.length > 1) {
      setStrengths(strengths.filter((_, i) => i !== index));
    }
  };

  const updateImprovement = (index: number, value: string) => {
    const newImprovements = [...improvements];
    newImprovements[index] = value;
    setImprovements(newImprovements);
  };

  const addImprovement = () => {
    if (improvements.length < 10) {
      setImprovements([...improvements, ""]);
    }
  };

  const removeImprovement = (index: number) => {
    if (improvements.length > 1) {
      setImprovements(improvements.filter((_, i) => i !== index));
    }
  };

  const validStrengthsCount = strengths.filter((s) => s.trim().length > 0).length;
  const validImprovementsCount = improvements.filter((i) => i.trim().length > 0).length;

  return (
    <div className="space-y-8">
      {/* Strengths */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-semibold">✅ Strengths</Label>
            <p className="text-sm text-muted-foreground mt-1">
              What works well? List specific positives (1-10 items)
            </p>
          </div>
          {validStrengthsCount > 0 && (
            <span className="text-sm font-medium text-green-600">
              {validStrengthsCount} item{validStrengthsCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {strengths.map((strength, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`e.g., "Clear function names and good documentation"`}
                  value={strength}
                  onChange={(e) => updateStrength(index, e.target.value)}
                  className="text-base"
                />
              </div>
              {strengths.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStrength(index)}
                  className="flex-shrink-0"
                  aria-label="Remove strength"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {strengths.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStrength}
            className="w-full"
          >
            <Plus className="size-4 mr-2" />
            Add Strength
          </Button>
        )}
      </div>

      {/* Areas for Improvement */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-semibold">🔧 Areas for Improvement</Label>
            <p className="text-sm text-muted-foreground mt-1">
              What could be better? List specific, actionable suggestions (1-10 items)
            </p>
          </div>
          {validImprovementsCount > 0 && (
            <span className="text-sm font-medium text-amber-600">
              {validImprovementsCount} item{validImprovementsCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {improvements.map((improvement, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`e.g., "Add unit tests for edge cases"`}
                  value={improvement}
                  onChange={(e) => updateImprovement(index, e.target.value)}
                  className="text-base"
                />
              </div>
              {improvements.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImprovement(index)}
                  className="flex-shrink-0"
                  aria-label="Remove improvement"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {improvements.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addImprovement}
            className="w-full"
          >
            <Plus className="size-4 mr-2" />
            Add Improvement
          </Button>
        )}
      </div>

      {/* Visual Annotations (Design/Art only) */}
      {showImageAnnotations && (
        <div className="space-y-3">
          <div>
            <Label className="text-lg font-semibold">📍 Visual Annotations</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Click on the design to add pin-points with specific feedback
            </p>
          </div>
          <ImageAnnotation
            imageUrl={imageUrl!}
            annotations={visualAnnotations}
            onChange={setVisualAnnotations}
          />
        </div>
      )}

      {/* Additional Notes */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="additional-notes" className="text-lg font-semibold">
            📝 Additional Notes (Optional)
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Any other context, explanations, or suggestions
          </p>
        </div>
        <Textarea
          id="additional-notes"
          placeholder="Add any additional context that doesn't fit in the categories above..."
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          className={cn(
            "min-h-[150px] text-base resize-y",
            "focus:ring-2 focus:ring-accent-blue/50"
          )}
          maxLength={5000}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {additionalNotes.length} / 5000 characters
          </span>
          {additionalNotes.length > 0 && (
            <span className="text-green-600">✓ Notes added</span>
          )}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold mb-2">Phase 3 Progress:</h4>
        <ul className="space-y-1 text-sm">
          <li
            className={cn(
              validStrengthsCount >= 1
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {validStrengthsCount >= 1 ? "✓" : "○"} Strengths listed (
            {validStrengthsCount})
          </li>
          <li
            className={cn(
              validImprovementsCount >= 1
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {validImprovementsCount >= 1 ? "✓" : "○"} Improvements listed (
            {validImprovementsCount})
          </li>
          {showImageAnnotations && (
            <li
              className={cn(
                visualAnnotations.length > 0
                  ? "text-green-600"
                  : "text-muted-foreground"
              )}
            >
              {visualAnnotations.length > 0 ? "✓" : "○"} Visual annotations (
              {visualAnnotations.length})
            </li>
          )}
          <li
            className={cn(
              additionalNotes.length > 0
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {additionalNotes.length > 0 ? "✓" : "○"} Additional notes (optional)
          </li>
        </ul>
        {validStrengthsCount >= 2 && validImprovementsCount >= 2 && (
          <p className="text-xs text-green-600 mt-2">
            ✓ Excellent! Your feedback is comprehensive and actionable.
          </p>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-accent-blue/30 bg-accent-blue/5 p-4">
        <p className="text-sm font-medium text-accent-blue mb-2">
          💡 Tips for Great Feedback:
        </p>
        <ul className="text-xs space-y-1 text-muted-foreground">
          <li>• Be specific: Reference exact elements, lines, or sections</li>
          <li>• Be actionable: Suggest concrete steps for improvement</li>
          <li>• Be balanced: Highlight both strengths and areas to improve</li>
          <li>
            • Be constructive: Frame suggestions positively and supportively
          </li>
        </ul>
      </div>
    </div>
  );
}
