'use client';

/**
 * ReviewerDesk - The review workspace for critics
 *
 * Work is displayed as submissions on a desk, with earnings
 * prominently shown. Uses tactile card metaphors.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Search,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle,
  Play,
  Send,
  Trophy,
  Target,
  Zap,
} from 'lucide-react';
import type {
  ActiveReviewItem,
  SubmittedReviewItem,
  CompletedReviewItem,
} from '@/lib/api/dashboard/mobile';
import type { KarmaSummary } from '@/lib/api/gamification/karma';

interface ReviewerDeskProps {
  activeReviews: ActiveReviewItem[];
  submittedReviews: SubmittedReviewItem[];
  completedReviews: CompletedReviewItem[];
  karmaSummary: KarmaSummary | null;
  isLoading: boolean;
}

export function ReviewerDesk({
  activeReviews,
  submittedReviews,
  completedReviews,
  isLoading,
}: ReviewerDeskProps) {
  const totalEarnings = completedReviews.reduce(
    (sum, r) => sum + (r.payment_amount || 0),
    0
  );
  const hasActiveWork = activeReviews.length > 0 || submittedReviews.length > 0;

  if (isLoading) {
    return <DeskSkeleton />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Bento grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Find work CTA */}
        <div className="md:col-span-1 lg:col-span-2 lg:row-span-2">
          <FindWorkCard />
        </div>

        {/* Earnings card */}
        <div className="md:col-span-1 lg:col-span-2">
          <EarningsCard
            totalEarnings={totalEarnings}
            completedCount={completedReviews.length}
          />
        </div>

        {/* Stats row */}
        <div className="md:col-span-1">
          <StatCard
            icon={Target}
            label="Active"
            value={activeReviews.length}
            color="cyan"
          />
        </div>
        <div className="md:col-span-1">
          <StatCard
            icon={Send}
            label="Pending"
            value={submittedReviews.length}
            color="amber"
          />
        </div>
      </div>

      {/* Active work section */}
      {hasActiveWork && (
        <ActiveWorkSection
          activeReviews={activeReviews}
          submittedReviews={submittedReviews}
        />
      )}

      {/* Empty state when no active work */}
      {!hasActiveWork && completedReviews.length === 0 && <EmptyDeskState />}

      {/* Recent completions */}
      {completedReviews.length > 0 && (
        <RecentCompletionsSection completedReviews={completedReviews.slice(0, 3)} />
      )}
    </div>
  );
}

function FindWorkCard() {
  return (
    <Link
      href="/browse"
      className="group relative block h-full min-h-[200px] md:min-h-[280px] overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 md:p-8 shadow-xl shadow-emerald-500/20 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-[1.02]"
    >
      {/* Decorative elements - animated on hover */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-all duration-700 group-hover:scale-150 group-hover:bg-white/20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl transition-all duration-700 group-hover:scale-125 group-hover:bg-white/10" />

      <div className="relative h-full flex flex-col justify-between">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-3">
            <Search className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 transition-transform duration-300 group-hover:translate-x-1">
            Find Work
          </h3>
          <p className="text-white/80 text-sm md:text-base transition-all duration-300 group-hover:text-white/90">
            Browse available reviews and start earning
          </p>
        </div>

        <div className="flex items-center gap-2 text-white/90 font-medium mt-4 transition-all duration-300 group-hover:text-white group-hover:gap-3">
          <span>Browse reviews</span>
          <ArrowRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-2" />
        </div>
      </div>
    </Link>
  );
}

interface EarningsCardProps {
  totalEarnings: number;
  completedCount: number;
}

function EarningsCard({ totalEarnings, completedCount }: EarningsCardProps) {
  return (
    <div className="group h-full min-h-[140px] rounded-3xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 dark:from-violet-500/20 dark:to-purple-500/10 backdrop-blur-xl border border-violet-500/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-violet-500/40 hover:from-violet-500/15 hover:to-purple-500/10">
      <div className="flex items-center justify-between h-full">
        <div>
          <p className="text-muted-foreground text-sm mb-1 transition-colors duration-200 group-hover:text-foreground/70">Total Earnings</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-bold text-foreground transition-transform duration-300 group-hover:scale-105 origin-left">
              ${totalEarnings.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 transition-transform duration-300 group-hover:translate-x-1">
            from {completedCount} reviews
          </p>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-emerald-500/40 group-hover:rotate-3">
          <DollarSign className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: typeof Target;
  label: string;
  value: number;
  color: 'cyan' | 'amber' | 'emerald';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors = {
    cyan: 'from-cyan-500 to-blue-500 shadow-cyan-500/30 group-hover:shadow-cyan-500/50',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/30 group-hover:shadow-amber-500/50',
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/30 group-hover:shadow-emerald-500/50',
  };

  return (
    <div className="group h-full min-h-[100px] rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-5 shadow-lg flex items-center gap-4 transition-all duration-300 hover:shadow-xl hover:bg-white/70 dark:hover:bg-white/10 hover:scale-[1.02]">
      <div
        className={cn(
          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110',
          colors[color]
        )}
      >
        <Icon className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground transition-transform duration-300 group-hover:translate-x-1">{value}</p>
        <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground/70">{label}</p>
      </div>
    </div>
  );
}

interface ActiveWorkSectionProps {
  activeReviews: ActiveReviewItem[];
  submittedReviews: SubmittedReviewItem[];
}

function ActiveWorkSection({ activeReviews, submittedReviews }: ActiveWorkSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Your Desk</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeReviews.map((review) => (
          <ActiveReviewCard key={review.slot_id} review={review} />
        ))}
        {submittedReviews.map((review) => (
          <SubmittedReviewCard key={review.slot_id} review={review} />
        ))}
      </div>
    </div>
  );
}

interface ActiveReviewCardProps {
  review: ActiveReviewItem;
}

function ActiveReviewCard({ review }: ActiveReviewCardProps) {
  const hasDraft = review.draft_progress?.has_draft;
  const progress = review.draft_progress?.percentage ?? 0;

  return (
    <Link
      href={`/reviewer/review/${review.slot_id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-cyan-500/20 p-5 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-cyan-500/40 hover:-translate-y-1"
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium transition-all duration-300 group-hover:bg-cyan-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
        Active
      </div>

      <div className="pr-16">
        <h4 className="font-semibold text-foreground truncate mb-1 transition-transform duration-300 group-hover:translate-x-1">
          {review.review_request?.title || 'Untitled'}
        </h4>
        <p className="text-sm text-muted-foreground flex items-center gap-1 transition-colors duration-300 group-hover:text-foreground/70">
          <Clock className="w-3.5 h-3.5" />
          {review.countdown_text || 'No deadline'}
        </p>
      </div>

      {/* Earnings */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold transition-transform duration-300 group-hover:scale-105">
          <DollarSign className="w-4 h-4" />
          {review.earnings_potential}
        </div>

        <div className="flex items-center gap-2 text-sm">
          {hasDraft ? (
            <>
              <span className="text-muted-foreground">{progress}%</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1 transition-all duration-300 group-hover:gap-2">
                Continue <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </>
          ) : (
            <span className="text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1 transition-all duration-300 group-hover:gap-2">
              <Play className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" /> Start
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {hasDraft && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out group-hover:shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Link>
  );
}

interface SubmittedReviewCardProps {
  review: SubmittedReviewItem;
}

function SubmittedReviewCard({ review }: SubmittedReviewCardProps) {
  return (
    <Link
      href={`/reviewer/review/${review.slot_id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-amber-500/20 p-5 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-amber-500/40 hover:-translate-y-1"
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium transition-all duration-300 group-hover:bg-amber-500/20">
        <Send className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        Submitted
      </div>

      <div className="pr-20">
        <h4 className="font-semibold text-foreground truncate mb-1 transition-transform duration-300 group-hover:translate-x-1">
          {review.review_request?.title || 'Untitled'}
        </h4>
        <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground/70">Awaiting acceptance</p>
      </div>

      {/* Earnings */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold transition-transform duration-300 group-hover:scale-105">
          <DollarSign className="w-4 h-4" />
          {review.payment_amount}
        </div>

        <span className="text-muted-foreground text-sm flex items-center gap-1 transition-all duration-300 group-hover:text-foreground group-hover:gap-2">
          View <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

interface RecentCompletionsSectionProps {
  completedReviews: CompletedReviewItem[];
}

function RecentCompletionsSection({ completedReviews }: RecentCompletionsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Recent Completions
        </h2>
        <Link
          href="/reviewer/history"
          className="group/link text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors duration-300"
        >
          View all
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {completedReviews.map((review) => (
          <div
            key={review.slot_id}
            className="group rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white/60 dark:hover:bg-white/10 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate text-sm transition-transform duration-300 group-hover:translate-x-1">
                  {review.review_request?.title || 'Untitled'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 transition-colors duration-300 group-hover:text-foreground/70">
                  {review.accepted_at
                    ? new Date(review.accepted_at).toLocaleDateString()
                    : 'Recently'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold transition-transform duration-300 group-hover:scale-110">
                <CheckCircle className="w-4 h-4" />
                ${review.payment_amount}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyDeskState() {
  return (
    <div className="group rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-dashed border-white/50 dark:border-white/10 p-8 md:p-12 text-center transition-all duration-500 hover:border-emerald-500/30 hover:bg-white/50 dark:hover:bg-white/10">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/10">
        <Zap className="w-8 h-8 text-slate-400 transition-all duration-300 group-hover:text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 transition-transform duration-300 group-hover:scale-105">
        Your desk is clear
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto transition-colors duration-300 group-hover:text-foreground/70">
        Find creative work to review and start earning. Your expertise is valuable!
      </p>
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 hover:gap-3"
      >
        <Search className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
        Browse available work
      </Link>
    </div>
  );
}

function DeskSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-1 lg:col-span-2 lg:row-span-2">
          <div className="h-[280px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <div className="h-[140px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
        <div className="md:col-span-1">
          <div className="h-[100px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
        <div className="md:col-span-1">
          <div className="h-[100px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default ReviewerDesk;
