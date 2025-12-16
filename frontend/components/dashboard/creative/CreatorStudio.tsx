'use client';

/**
 * CreatorStudio - The creative workspace for creators
 *
 * Displays work as "canvases" with incoming feedback as floating notes.
 * Uses bento-style asymmetric grid for visual interest.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Plus,
  ArrowRight,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Image,
  FileText,
  Video,
  Music,
  Code,
  Palette,
  User,
  Briefcase,
  Settings,
} from 'lucide-react';
import type { PendingReviewItem, MyRequestItem } from '@/lib/api/dashboard/mobile';
import type { KarmaSummary } from '@/lib/api/gamification/karma';

interface CreatorStudioProps {
  pendingReviews: PendingReviewItem[];
  myRequests: MyRequestItem[];
  karmaSummary: KarmaSummary | null;
  isLoading: boolean;
}

export function CreatorStudio({
  pendingReviews,
  myRequests,
  karmaSummary,
  isLoading,
}: CreatorStudioProps) {
  const activeProjects = myRequests.filter(
    (r) => r.status === 'in_review' || r.status === 'pending'
  );
  const completedCount = myRequests.filter((r) => r.status === 'completed').length;
  const hasPendingFeedback = pendingReviews.length > 0;

  if (isLoading) {
    return <StudioSkeleton />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Bento grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Primary CTA - New Project */}
        <div className="md:col-span-1 lg:row-span-2">
          <NewProjectCard />
        </div>

        {/* Quick access cards - Profile, Portfolio, Settings */}
        <div className="md:col-span-1 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 md:gap-4 h-full">
            <QuickAccessCard
              href="/profile"
              icon={User}
              label="Profile"
              description="Your public page"
              gradient="from-violet-500 via-purple-500 to-fuchsia-600"
              shadowColor="shadow-violet-500/25 hover:shadow-violet-500/40"
            />
            <QuickAccessCard
              href="/portfolio"
              icon={Briefcase}
              label="Portfolio"
              description="Showcase work"
              gradient="from-amber-500 via-orange-500 to-red-500"
              shadowColor="shadow-amber-500/25 hover:shadow-amber-500/40"
            />
            <QuickAccessCard
              href="/settings"
              icon={Settings}
              label="Settings"
              description="Preferences"
              gradient="from-slate-600 via-slate-700 to-zinc-800"
              shadowColor="shadow-slate-500/25 hover:shadow-slate-500/40"
            />
          </div>
        </div>

        {/* Stats card - now below quick access */}
        <div className="md:col-span-1 lg:col-span-2">
          <StatsCard
            totalProjects={myRequests.length}
            completedCount={completedCount}
            sparks={karmaSummary?.total_sparks}
          />
        </div>

        {/* Pending feedback alert - if exists */}
        {hasPendingFeedback && (
          <div className="md:col-span-2 lg:col-span-3">
            <FeedbackAlertCard pendingReviews={pendingReviews} />
          </div>
        )}

        {/* Active projects section */}
        <div className="md:col-span-2 lg:col-span-3">
          <ActiveProjectsSection projects={activeProjects} />
        </div>
      </div>
    </div>
  );
}

function NewProjectCard() {
  return (
    <Link
      href="/review/new"
      className="group relative block h-full min-h-[200px] md:min-h-[280px] overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-6 md:p-8 shadow-xl shadow-blue-500/20 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-[1.02]"
    >
      {/* Decorative elements - animated on hover */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-all duration-700 group-hover:scale-150 group-hover:bg-white/20" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl transition-all duration-700 group-hover:scale-125 group-hover:bg-white/10" />

      <div className="relative h-full flex flex-col justify-between">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-3">
            <Plus className="w-7 h-7 text-white transition-transform duration-300 group-hover:rotate-90" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 transition-transform duration-300 group-hover:translate-x-1">
            New Project
          </h3>
          <p className="text-white/80 text-sm md:text-base transition-all duration-300 group-hover:text-white/90">
            Get expert feedback on your creative work
          </p>
        </div>

        <div className="flex items-center gap-2 text-white/90 font-medium mt-4 transition-all duration-300 group-hover:text-white group-hover:gap-3">
          <span>Start creating</span>
          <ArrowRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-2" />
        </div>
      </div>
    </Link>
  );
}

interface QuickAccessCardProps {
  href: string;
  icon: typeof User;
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
          <Icon className={cn(
            'w-6 h-6 md:w-7 md:h-7 text-white transition-transform duration-300',
            label === 'Settings' && 'group-hover:rotate-90'
          )} />
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

interface FeedbackAlertCardProps {
  pendingReviews: PendingReviewItem[];
}

function FeedbackAlertCard({ pendingReviews }: FeedbackAlertCardProps) {
  const mostUrgent = pendingReviews[0];
  const count = pendingReviews.length;

  if (!mostUrgent) {
    return null;
  }

  return (
    <Link
      href={`/review/${mostUrgent.review_request_id}`}
      className="group relative block h-full min-h-[140px] overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl shadow-emerald-500/20 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-[1.02]"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl transition-all duration-700 group-hover:scale-150 group-hover:bg-white/20" />

      <div className="relative flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
          <MessageSquare className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/80 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Feedback ready
            </span>
            {count > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium transition-all duration-300 group-hover:bg-white/30">
                +{count - 1} more
              </span>
            )}
          </div>
          <h4 className="text-white font-semibold truncate transition-transform duration-300 group-hover:translate-x-1">
            {mostUrgent.review_request_title}
          </h4>
          <p className="text-white/70 text-sm mt-1 transition-colors duration-300 group-hover:text-white/80">
            From {mostUrgent.reviewer?.name || 'Expert reviewer'}
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white/80 text-sm transition-all duration-300 group-hover:text-white group-hover:gap-2">
        <span>Review</span>
        <ArrowRight className="w-4 h-4 transition-all duration-300 group-hover:translate-x-2" />
      </div>
    </Link>
  );
}

interface StatsCardProps {
  totalProjects: number;
  completedCount: number;
  sparks?: number;
}

function StatsCard({ totalProjects, completedCount, sparks }: StatsCardProps) {
  return (
    <div className="group h-full min-h-[140px] rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-cyan-500/20 hover:bg-white/70 dark:hover:bg-white/10">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <p className="text-muted-foreground text-sm mb-1 transition-colors duration-200 group-hover:text-foreground/70">Your Studio</p>
          <div className="flex items-baseline gap-4">
            <div className="transition-transform duration-300 group-hover:scale-105 origin-left">
              <span className="text-3xl font-bold text-foreground">{totalProjects}</span>
              <span className="text-muted-foreground text-sm ml-1">projects</span>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:translate-x-1">
              <span className="text-lg font-semibold">{completedCount}</span>
              <span className="text-sm ml-1">completed</span>
            </div>
          </div>
        </div>

        {sparks !== undefined && sparks > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100 dark:bg-amber-500/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-amber-500 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-amber-700 dark:text-amber-400 font-semibold">
              {sparks}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActiveProjectsSectionProps {
  projects: MyRequestItem[];
}

function ActiveProjectsSection({ projects }: ActiveProjectsSectionProps) {
  if (projects.length === 0) {
    return <EmptyProjectsState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Active Projects</h2>
        <Link
          href="/my-reviews"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.slice(0, 6).map((project) => (
          <ProjectCanvas key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

interface ProjectCanvasProps {
  project: MyRequestItem;
}

function ProjectCanvas({ project }: ProjectCanvasProps) {
  const Icon = getContentTypeIcon(project.content_type);
  const progress = project.progress;
  const progressPercent = progress.requested > 0
    ? Math.round((progress.submitted / progress.requested) * 100)
    : 0;

  return (
    <Link
      href={`/review/${project.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 p-5 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-cyan-500/30 hover:-translate-y-1"
    >
      {/* Content type indicator */}
      <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all duration-300 group-hover:bg-cyan-500/10 group-hover:scale-110">
        <Icon className="w-4 h-4 text-slate-500 transition-colors duration-300 group-hover:text-cyan-600" />
      </div>

      <div className="pr-10">
        <h4 className="font-semibold text-foreground truncate mb-1 transition-transform duration-300 group-hover:translate-x-1">
          {project.title}
        </h4>
        <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover:text-foreground/70">
          {progress.submitted}/{progress.requested} reviews
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out group-hover:shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span className="transition-colors duration-300 group-hover:text-foreground/70">{progressPercent}% complete</span>
          {progress.accepted > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 transition-transform duration-300 group-hover:scale-105">
              <CheckCircle className="w-3 h-3" />
              {progress.accepted} accepted
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyProjectsState() {
  return (
    <div className="group rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-dashed border-white/50 dark:border-white/10 p-8 md:p-12 text-center transition-all duration-500 hover:border-cyan-500/30 hover:bg-white/50 dark:hover:bg-white/10">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-cyan-500/10">
        <Palette className="w-8 h-8 text-slate-400 transition-all duration-300 group-hover:text-cyan-500 group-hover:rotate-12" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 transition-transform duration-300 group-hover:scale-105">
        Your studio awaits
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto transition-colors duration-300 group-hover:text-foreground/70">
        Start your creative journey by submitting work for expert review.
        Get actionable feedback to level up your craft.
      </p>
      <Link
        href="/review/new"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 hover:gap-3"
      >
        <Plus className="w-4 h-4 transition-transform duration-300 hover:rotate-90" />
        Create your first project
      </Link>
    </div>
  );
}

function StudioSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-1 lg:row-span-2">
          <div className="h-[280px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
        <div className="md:col-span-1">
          <div className="h-[140px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
        <div className="md:col-span-1">
          <div className="h-[140px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <div className="h-[200px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function getContentTypeIcon(contentType?: string) {
  const icons: Record<string, typeof Image> = {
    image: Image,
    design: Palette,
    video: Video,
    audio: Music,
    music: Music,
    code: Code,
    writing: FileText,
  };
  return icons[contentType?.toLowerCase() || ''] || FileText;
}

export default CreatorStudio;
