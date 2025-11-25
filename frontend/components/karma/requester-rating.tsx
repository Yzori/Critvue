'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Star,
  MessageSquare,
  Clock,
  Scale,
  ThumbsUp,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { type RequesterStats, type RequesterRatingRequest } from '@/lib/api/karma';

/**
 * RequesterRating Component
 *
 * Two-sided reputation: Reviewers can rate requesters
 * Displays requester stats and allows submitting ratings
 */

// Star Rating Input Component
interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  label,
  icon,
  description,
}) => {
  const [hovered, setHovered] = React.useState(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="font-medium">{label}</Label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                (hovered || value) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );
};

// Requester Stats Display
export interface RequesterStatsDisplayProps {
  stats: RequesterStats;
  className?: string;
}

export const RequesterStatsDisplay: React.FC<RequesterStatsDisplayProps> = ({
  stats,
  className,
}) => {
  const getStatColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    if (value >= 4.5) return 'text-green-600';
    if (value >= 3.5) return 'text-blue-600';
    if (value >= 2.5) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Requester Reputation</CardTitle>
          <CardDescription className="text-xs">
            Based on {stats.total_ratings} reviewer ratings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Rating */}
          {stats.avg_overall !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Rating</span>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-4 w-4',
                        star <= Math.round(stats.avg_overall!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted'
                      )}
                    />
                  ))}
                </div>
                <span className={cn('font-semibold', getStatColor(stats.avg_overall))}>
                  {stats.avg_overall.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* Individual Metrics */}
          <div className="grid gap-3">
            <StatRow
              icon={<MessageSquare className="h-4 w-4" />}
              label="Clarity"
              value={stats.avg_clarity}
              tooltip="How clear are their requirements?"
            />
            <StatRow
              icon={<Clock className="h-4 w-4" />}
              label="Responsiveness"
              value={stats.avg_responsiveness}
              tooltip="How quickly do they respond to reviews?"
            />
            <StatRow
              icon={<Scale className="h-4 w-4" />}
              label="Fairness"
              value={stats.avg_fairness}
              tooltip="Are their accept/reject decisions fair?"
            />
          </div>

          {/* Badges */}
          {stats.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {stats.badges.map((badge) => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  {badge === 'responsive' && <Clock className="h-3 w-3 mr-1" />}
                  {badge === 'fair' && <Scale className="h-3 w-3 mr-1" />}
                  {badge === 'clear' && <MessageSquare className="h-3 w-3 mr-1" />}
                  {badge.charAt(0).toUpperCase() + badge.slice(1)}
                </Badge>
              ))}
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-4 text-xs">
            <Tooltip>
              <TooltipTrigger>
                <div className={cn(
                  'flex items-center gap-1',
                  stats.is_responsive ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {stats.is_responsive ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {stats.is_responsive ? 'Responsive' : 'May be slow'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Typically responds within 48 hours</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className={cn(
                  'flex items-center gap-1',
                  stats.is_fair ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {stats.is_fair ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {stats.is_fair ? 'Fair reviewer' : 'Mixed feedback'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Consistently gives fair feedback</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  tooltip: string;
}

const StatRow: React.FC<StatRowProps> = ({ icon, label, value, tooltip }) => {
  const getColor = (v: number | null) => {
    if (v === null) return 'text-muted-foreground';
    if (v >= 4) return 'text-green-600';
    if (v >= 3) return 'text-blue-600';
    if (v >= 2) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {icon}
              {label}
            </div>
            <span className={cn('font-medium', getColor(value))}>
              {value !== null ? value.toFixed(1) : 'N/A'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Rating Form Dialog
export interface RequesterRatingFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (rating: RequesterRatingRequest) => Promise<void>;
  requesterName?: string;
  trigger?: React.ReactNode;
  className?: string;
}

export const RequesterRatingForm: React.FC<RequesterRatingFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  requesterName = 'this requester',
  trigger,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [clarity, setClarity] = React.useState(0);
  const [responsiveness, setResponsiveness] = React.useState(0);
  const [fairness, setFairness] = React.useState(0);
  const [feedback, setFeedback] = React.useState('');
  const [isAnonymous, setIsAnonymous] = React.useState(true);

  const controlledOpen = open ?? isOpen;
  const setControlledOpen = onOpenChange ?? setIsOpen;

  const canSubmit = clarity > 0 && responsiveness > 0 && fairness > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        clarity_rating: clarity,
        responsiveness_rating: responsiveness,
        fairness_rating: fairness,
        feedback_text: feedback || undefined,
        is_anonymous: isAnonymous,
      });
      setControlledOpen(false);
      // Reset form
      setClarity(0);
      setResponsiveness(0);
      setFairness(0);
      setFeedback('');
      setIsAnonymous(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={controlledOpen} onOpenChange={setControlledOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-accent-blue" />
            Rate {requesterName}
          </DialogTitle>
          <DialogDescription>
            Help other reviewers by sharing your experience. All ratings are private.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <StarRating
            value={clarity}
            onChange={setClarity}
            label="Clarity of Requirements"
            icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
            description="Were the review requirements clear and specific?"
          />

          <StarRating
            value={responsiveness}
            onChange={setResponsiveness}
            label="Responsiveness"
            icon={<Clock className="h-4 w-4 text-green-500" />}
            description="Did they respond to your review in a timely manner?"
          />

          <StarRating
            value={fairness}
            onChange={setFairness}
            label="Fairness"
            icon={<Scale className="h-4 w-4 text-purple-500" />}
            description="Was their accept/reject decision fair and justified?"
          />

          <div className="space-y-2">
            <Label>Additional Feedback (Optional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share any additional feedback about your experience..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {feedback.length}/500
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              {isAnonymous ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label className="text-sm">Anonymous Rating</Label>
                <p className="text-xs text-muted-foreground">
                  {isAnonymous ? 'Your name will be hidden' : 'Your name will be visible'}
                </p>
              </div>
            </div>
            <Switch
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setControlledOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequesterRatingForm;
