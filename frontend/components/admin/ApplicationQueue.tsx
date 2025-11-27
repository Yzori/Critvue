"use client";

/**
 * Application Queue Component
 *
 * Modern queue display for expert applications pending review.
 * Features:
 * - Animated list items with staggered entrance
 * - Status badges with visual indicators
 * - Quick actions (claim, view details)
 * - Escalation indicators for overdue applications
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Mail,
  User,
  Calendar,
  ChevronRight,
  Inbox,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApplicationQueueItem } from "@/lib/api/admin";
import { formatDistanceToNow } from "date-fns";

interface ApplicationQueueProps {
  applications: ApplicationQueueItem[];
  isLoading?: boolean;
  onClaim: (id: number) => void;
  onViewDetails: (id: number) => void;
  claimingId?: number | null;
}

function ApplicationCard({
  application,
  onClaim,
  onViewDetails,
  isClaiming,
  index,
}: {
  application: ApplicationQueueItem;
  onClaim: () => void;
  onViewDetails: () => void;
  isClaiming: boolean;
  index: number;
}) {
  const isEscalated = application.is_escalated || application.days_in_queue > 7;
  const submittedDate = new Date(application.submitted_at);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
        isEscalated && "border-amber-200 bg-amber-50/30"
      )}
    >
      {/* Escalation indicator */}
      {isEscalated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-3 top-3"
        >
          <Badge variant="warning" size="sm" showDot pulse>
            Escalated
          </Badge>
        </motion.div>
      )}

      <div className={cn("flex items-start justify-between gap-4", isEscalated && "pt-6")}>
        {/* Application info */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-peach/20">
              <User className="h-5 w-5 text-accent-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {application.full_name}
              </h3>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {application.email}
              </p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Submitted {formatDistanceToNow(submittedDate, { addSuffix: true })}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {application.days_in_queue} day{application.days_in_queue !== 1 && "s"} in queue
            </span>
            {application.claim_count > 0 && (
              <Badge variant="neutral" size="sm">
                {application.claim_count} previous claim{application.claim_count !== 1 && "s"}
              </Badge>
            )}
          </div>

          {/* Application number */}
          <p className="font-mono text-xs text-muted-foreground">
            {application.application_number}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={onClaim}
            disabled={isClaiming}
            className="group/btn relative"
          >
            {isClaiming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Claim
                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
        </div>
      </div>

      {/* Hover decoration */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5 transition-all group-hover:ring-accent-blue/20" />
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16"
    >
      <div className="rounded-full bg-white p-4 shadow-sm">
        <Inbox className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        Queue is empty
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        No applications are waiting for review right now.
      </p>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl bg-gray-100"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function ApplicationQueue({
  applications,
  isLoading,
  onClaim,
  onViewDetails,
  claimingId,
}: ApplicationQueueProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (applications.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Queue header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Application Queue
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({applications.length} pending)
          </span>
        </h2>
        {applications.some((a) => a.is_escalated) && (
          <Badge variant="warning" showDot pulse>
            <AlertTriangle className="mr-1 h-3 w-3" />
            {applications.filter((a) => a.is_escalated).length} escalated
          </Badge>
        )}
      </div>

      {/* Application list */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {applications.map((application, index) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onClaim={() => onClaim(application.id)}
              onViewDetails={() => onViewDetails(application.id)}
              isClaiming={claimingId === application.id}
              index={index}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
