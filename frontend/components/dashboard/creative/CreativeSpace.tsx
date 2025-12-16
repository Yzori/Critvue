'use client';

/**
 * CreativeSpace - The Critvue Dashboard
 *
 * An immersive creative workspace that feels like a studio for creators
 * and a review desk for reviewers. Non-standard, artistic layout.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAsync } from '@/hooks';
import { cn } from '@/lib/utils';

import { CreatorStudio } from './CreatorStudio';
import { ReviewerDesk } from './ReviewerDesk';
import { SpaceHeader } from './SpaceHeader';

import {
  getActionsNeeded,
  getMyRequests,
  getActiveReviews,
  getSubmittedReviews,
  getCompletedReviews,
  type PendingReviewItem,
  type MyRequestItem,
  type ActiveReviewItem,
  type SubmittedReviewItem,
  type CompletedReviewItem,
} from '@/lib/api/dashboard/mobile';
import { getKarmaSummary } from '@/lib/api/gamification/karma';

type Role = 'creator' | 'reviewer';

interface CreativeSpaceProps {
  initialRole?: Role;
  className?: string;
}

export function CreativeSpace({ initialRole = 'creator', className }: CreativeSpaceProps) {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>(initialRole);
  const [displayedRole, setDisplayedRole] = useState<Role>(initialRole);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isInitialMount = useRef(true);

  const loadDashboardData = useCallback(async () => {
    const karmaSummary = await getKarmaSummary().catch(() => null);

    if (role === 'creator') {
      const [actionsResponse, requestsResponse] = await Promise.all([
        getActionsNeeded(1, 20),
        getMyRequests(undefined, 1, 50),
      ]);
      return {
        karmaSummary,
        pendingReviews: actionsResponse.items,
        myRequests: requestsResponse.items,
        activeReviews: [] as ActiveReviewItem[],
        submittedReviews: [] as SubmittedReviewItem[],
        completedReviews: [] as CompletedReviewItem[],
      };
    }

    const [activeResponse, submittedResponse, completedResponse] = await Promise.all([
      getActiveReviews(1, 20),
      getSubmittedReviews(1, 20),
      getCompletedReviews(1, 20),
    ]);

    return {
      karmaSummary,
      pendingReviews: [] as PendingReviewItem[],
      myRequests: [] as MyRequestItem[],
      activeReviews: activeResponse.items,
      submittedReviews: submittedResponse.items,
      completedReviews: completedResponse.items,
    };
  }, [role]);

  const { data, isLoading, refetch } = useAsync(loadDashboardData, { immediate: true });

  useEffect(() => {
    refetch();
  }, [role, refetch]);

  const karmaSummary = data?.karmaSummary ?? null;
  const pendingReviews = data?.pendingReviews ?? [];
  const myRequests = data?.myRequests ?? [];
  const activeReviews = data?.activeReviews ?? [];
  const submittedReviews = data?.submittedReviews ?? [];
  const completedReviews = data?.completedReviews ?? [];

  const handleRoleChange = useCallback((newRole: Role) => {
    if (newRole === role || isTransitioning) return;

    // Start transition (fade out)
    setIsTransitioning(true);

    // After fade out, swap content and fade in
    setTimeout(() => {
      setDisplayedRole(newRole);
      setRole(newRole);
      // Small delay before removing transition state for fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  }, [role, isTransitioning]);

  // Skip animation on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  return (
    <div className={cn('min-h-screen relative overflow-hidden', className)}>
      {/* Animated gradient background */}
      <BackgroundCanvas />

      <div className="relative z-10">
        <SpaceHeader
          user={user}
          role={role}
          onRoleChange={handleRoleChange}
          streak={karmaSummary?.current_streak}
        />

        <main className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div
            className={cn(
              'transition-all duration-200 ease-out',
              isTransitioning
                ? 'opacity-0 scale-[0.98] translate-y-2'
                : 'opacity-100 scale-100 translate-y-0'
            )}
          >
            {displayedRole === 'creator' ? (
              <CreatorStudio
                pendingReviews={pendingReviews}
                myRequests={myRequests}
                karmaSummary={karmaSummary}
                isLoading={isLoading}
              />
            ) : (
              <ReviewerDesk
                activeReviews={activeReviews}
                submittedReviews={submittedReviews}
                completedReviews={completedReviews}
                karmaSummary={karmaSummary}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function BackgroundCanvas() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />

      {/* Organic floating shapes */}
      <div
        className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-blue-300/20 dark:from-cyan-500/10 dark:to-blue-500/5 rounded-full blur-3xl"
        style={{ animation: 'pulse 8s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-purple-300/20 dark:from-violet-500/10 dark:to-purple-500/5 rounded-full blur-3xl"
        style={{ animation: 'pulse 10s ease-in-out infinite 2s' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-300/10 dark:from-emerald-500/5 dark:to-teal-500/5 rounded-full blur-3xl"
        style={{ animation: 'pulse 12s ease-in-out infinite 4s' }}
      />
    </div>
  );
}

export default CreativeSpace;
