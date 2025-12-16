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
  Wallet,
  History,
  User,
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
  karmaSummary,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Find work CTA */}
        <div className="md:col-span-1 lg:row-span-2">
          <FindWorkCard />
        </div>

        {/* Quick access cards - Earnings, History, Profile */}
        <div className="md:col-span-1 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 md:gap-4 h-full">
            <QuickAccessCard
              href="/earnings"
              icon={Wallet}
              label="Earnings"
              description="Payout history"
              gradient="from-emerald-500 via-green-500 to-teal-600"
              shadowColor="shadow-emerald-500/25 hover:shadow-emerald-500/40"
            />
            <QuickAccessCard
              href="/reviewer/history"
              icon={History}
              label="History"
              description="Past reviews"
              gradient="from-blue-500 via-indigo-500 to-violet-600"
              shadowColor="shadow-blue-500/25 hover:shadow-blue-500/40"
            />
            <QuickAccessCard
              href="/profile"
              icon={User}
              label="Profile"
              description="Your page"
              gradient="from-violet-500 via-purple-500 to-fuchsia-600"
              shadowColor="shadow-violet-500/25 hover:shadow-violet-500/40"
            />
          </div>
        </div>

        {/* Stats card - richer info */}
        <div className="md:col-span-1 lg:col-span-2">
          <ReviewerStatsCard
            totalEarnings={totalEarnings}
            completedCount={completedReviews.length}
            activeCount={activeReviews.length}
            pendingCount={submittedReviews.length}
            acceptanceRate={karmaSummary?.acceptance_rate}
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

interface QuickAccessCardProps {
  href: string;
  icon: typeof Wallet;
  label: string;
  description: string;
  gradient: string;
  shadowColor: string;
}

function QuickAccessCard({ href, icon: Icon, label, description, gradient, shadowColor }: QuickAccessCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col items-center justify-center h-full min-h-[120px] md:min-h-[130px] overflow-hidden rounded-2xl p-5 md:p-6 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1',
        'bg-gradient-to-br',
        gradient,
        'shadow-xl',
        shadowColor
      )}
    >
      {/* Decorative blur elements */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl transition-all duration-700 group-hover:scale-150 group-hover:bg-white/20" />
      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-white/5 rounded-full blur-2xl transition-all duration-700 group-hover:scale-125 group-hover:bg-white/10" />

      <div className="relative flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-white transition-transform duration-300" />
        </div>

        {/* Text */}
        <h4 className="font-bold text-white text-base md:text-lg transition-transform duration-300 group-hover:scale-105">
          {label}
        </h4>
        <p className="text-white/70 text-xs md:text-sm mt-0.5 transition-colors duration-300 group-hover:text-white/80">
          {description}
        </p>
      </div>

      {/* Arrow */}
      <div className="absolute bottom-4 right-4 flex items-center text-white/50 transition-all duration-300 group-hover:text-white">
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

interface ReviewerStatsCardProps {
  totalEarnings: number;
  completedCount: number;
  activeCount: number;
  pendingCount: number;
  acceptanceRate?: number | null;
}

function ReviewerStatsCard({ totalEarnings, completedCount, activeCount, pendingCount, acceptanceRate }: ReviewerStatsCardProps) {
  return (
    <div className="group h-full min-h-[130px] rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-emerald-500/20 hover:bg-white/70 dark:hover:bg-white/10">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <p className="text-muted-foreground text-sm mb-2 transition-colors duration-200 group-hover:text-foreground/70">Your Desk Stats</p>

          {/* Primary stats row */}
          <div className="flex items-baseline gap-6 flex-wrap">
            {/* Total Earnings - Primary */}
            <div className="transition-transform duration-300 group-hover:scale-105 origin-left">
              <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ${totalEarnings.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-sm ml-1">earned</span>
            </div>

            {/* Completed */}
            <div className="transition-transform duration-300 group-hover:translate-x-1">
              <span className="text-lg font-semibold text-foreground">{completedCount}</span>
              <span className="text-muted-foreground text-sm ml-1">completed</span>
            </div>

            {/* Active */}
            {activeCount > 0 && (
              <div className="text-cyan-600 dark:text-cyan-400 transition-transform duration-300 group-hover:translate-x-1">
                <span className="text-lg font-semibold">{activeCount}</span>
                <span className="text-sm ml-1">active</span>
              </div>
            )}

            {/* Pending */}
            {pendingCount > 0 && (
              <div className="text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:translate-x-1">
                <span className="text-lg font-semibold">{pendingCount}</span>
                <span className="text-sm ml-1">pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Acceptance rate badge */}
        {acceptanceRate !== undefined && acceptanceRate !== null && acceptanceRate > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20">
            <CheckCircle className="w-5 h-5 text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {Math.round(acceptanceRate)}%
            </span>
          </div>
        )}
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
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-emerald-500/40">
        <DollarSign className="w-8 h-8 text-white transition-all duration-300 group-hover:scale-110" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 transition-transform duration-300 group-hover:scale-105">
        Your desk is clear
      </h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto transition-colors duration-300 group-hover:text-foreground/70">
        Find creative work to review and start earning. Your expertise is valuable!
      </p>

      {/* Earning potential hint */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm mb-6 transition-all duration-300 group-hover:bg-emerald-500/20">
        <DollarSign className="w-4 h-4" />
        <span>Reviews typically pay <strong>$5 - $25</strong></span>
      </div>

      <div className="block">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 hover:gap-3"
        >
          <Search className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
          Browse available work
        </Link>
      </div>
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
