/**
 * Basic Info Step
 * Form for entering title and description of the work to be reviewed
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BasicInfoStepProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  errors?: {
    title?: string;
    description?: string;
  };
}

export function BasicInfoStep({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  errors,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Tell us about your work
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Provide some details so reviewers can give better feedback
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground">
            Project Title
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="What would you like reviewed?"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            aria-invalid={!!errors?.title}
            className="text-base"
          />
          {errors?.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Give your project a clear, descriptive title
          </p>
        </div>

        {/* Description Textarea */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Tell us more about your work... What are you working on? What specific feedback are you looking for?"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            aria-invalid={!!errors?.description}
            rows={6}
            className="text-base resize-none"
          />
          {errors?.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Include context, goals, and any specific areas you'd like feedback on
          </p>
        </div>
      </div>
    </div>
  );
}
