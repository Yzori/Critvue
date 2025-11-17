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
          Help the reviewer help you
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Give the reviewer context so they can provide targeted, valuable feedback
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground">
            Give your work a title
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="E-commerce Dashboard Redesign"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            aria-invalid={!!errors?.title}
            autoComplete="off"
            className="text-base sm:text-sm"
          />
          {errors?.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Make it clear and descriptive so reviewers know what to expect
          </p>
        </div>

        {/* Description Textarea */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">
            What should reviewers know?
          </Label>
          <Textarea
            id="description"
            placeholder="I'm redesigning our checkout flow to reduce drop-off rates. The main concern is whether the payment step feels trustworthy enough. I'd also love feedback on the overall visual hierarchy..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            aria-invalid={!!errors?.description}
            autoComplete="off"
            rows={6}
            className="text-base sm:text-sm resize-none"
          />
          {errors?.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Share the context, your goals, and what kind of feedback would be most helpful
          </p>
        </div>
      </div>
    </div>
  );
}
