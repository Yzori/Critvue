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
  Sparkles,
  UserCheck,
  MessageCircle,
  ThumbsUp,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Award,
} from 'lucide-react';

/**
 * ReviewerRating Component
 *
 * Two-sided reputation: Requesters can rate reviewers
 * Displays reviewer stats and allows submitting ratings
 */

// Types for reviewer ratings
export interface ReviewerStats {
  avg_quality: number | null;
  avg_professionalism: number | null;
  avg_helpfulness: number | null;
  avg_overall: number | null;
  total_ratings: number;
  total_reviews_completed: number;
  reviews_accepted: number;
  reviews_rejected: number;
  is_high_quality: boolean;
  is_professional: boolean;
  badges: string[];
}

export interface ReviewerRatingRequest {
  quality_rating: number;
  professionalism_rating: number;
  helpfulness_rating: number;
  feedback_text?: string;
  is_anonymous: boolean;
}

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

// Reviewer Stats Display
export interface ReviewerStatsDisplayProps {
  stats: ReviewerStats;
  className?: string;
}

export const ReviewerStatsDisplay: React.FC<ReviewerStatsDisplayProps> = ({
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
          <CardTitle className="text-sm font-medium">Reviewer Reputation</CardTitle>
          <CardDescription className="text-xs">
            Based on {stats.total_ratings} requester ratings
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
              icon={<Sparkles className="h-4 w-4" />}
              label="Quality"
              value={stats.avg_quality}
              tooltip="How thorough and helpful were their reviews?"
            />
            <StatRow
              icon={<UserCheck className="h-4 w-4" />}
              label="Professionalism"
              value={stats.avg_professionalism}
              tooltip="Were they constructive and appropriate?"
            />
            <StatRow
              icon={<MessageCircle className="h-4 w-4" />}
              label="Helpfulness"
              value={stats.avg_helpfulness}
              tooltip="Did they respond to follow-up questions?"
            />
          </div>

          {/* Badges */}
          {stats.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {stats.badges.map((badge) => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  {badge === 'Quality Reviews' && <Sparkles className="h-3 w-3 mr-1" />}
                  {badge === 'Professional' && <UserCheck className="h-3 w-3 mr-1" />}
                  {badge === 'Top Rated' && <Award className="h-3 w-3 mr-1" />}
                  {badge}
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
                  stats.is_high_quality ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {stats.is_high_quality ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {stats.is_high_quality ? 'High Quality' : 'Building reputation'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Consistently delivers quality reviews</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className={cn(
                  'flex items-center gap-1',
                  stats.is_professional ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {stats.is_professional ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {stats.is_professional ? 'Professional' : 'Mixed feedback'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Known for constructive feedback</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Stats Summary */}
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>{stats.total_reviews_completed} reviews completed</span>
            {stats.total_reviews_completed > 0 && (
              <span>
                {Math.round((stats.reviews_accepted / stats.total_reviews_completed) * 100)}% acceptance rate
              </span>
            )}
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
export interface ReviewerRatingFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (rating: ReviewerRatingRequest) => Promise<void>;
  reviewerName?: string;
  trigger?: React.ReactNode;
  className?: string;
}

export const ReviewerRatingForm: React.FC<ReviewerRatingFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  reviewerName = 'this reviewer',
  trigger,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [quality, setQuality] = React.useState(0);
  const [professionalism, setProfessionalism] = React.useState(0);
  const [helpfulness, setHelpfulness] = React.useState(0);
  const [feedback, setFeedback] = React.useState('');
  const [isAnonymous, setIsAnonymous] = React.useState(true);

  const controlledOpen = open ?? isOpen;
  const setControlledOpen = onOpenChange ?? setIsOpen;

  const canSubmit = quality > 0 && professionalism > 0 && helpfulness > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        quality_rating: quality,
        professionalism_rating: professionalism,
        helpfulness_rating: helpfulness,
        feedback_text: feedback || undefined,
        is_anonymous: isAnonymous,
      });
      setControlledOpen(false);
      // Reset form
      setQuality(0);
      setProfessionalism(0);
      setHelpfulness(0);
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
            Rate {reviewerName}
          </DialogTitle>
          <DialogDescription>
            Help others find great reviewers by sharing your experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <StarRating
            value={quality}
            onChange={setQuality}
            label="Review Quality"
            icon={<Sparkles className="h-4 w-4 text-amber-500" />}
            description="Was the review thorough, detailed, and helpful?"
          />

          <StarRating
            value={professionalism}
            onChange={setProfessionalism}
            label="Professionalism"
            icon={<UserCheck className="h-4 w-4 text-blue-500" />}
            description="Was the feedback constructive and appropriate?"
          />

          <StarRating
            value={helpfulness}
            onChange={setHelpfulness}
            label="Helpfulness"
            icon={<MessageCircle className="h-4 w-4 text-green-500" />}
            description="Did they respond to follow-up questions?"
          />

          <div className="space-y-2">
            <Label>Additional Feedback (Optional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share any additional feedback about this reviewer..."
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

export default ReviewerRatingForm;
