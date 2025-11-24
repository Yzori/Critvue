"use client";

/**
 * Review Status Badge Component
 *
 * Centralized status badge logic for review slots and requests.
 * Ensures consistent status representation across all dashboard views.
 *
 * @module dashboard/shared/review-status-badge
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, FileText } from "lucide-react";

export type ReviewStatus =
  | "pending_acceptance"
  | "in_progress"
  | "completed"
  | "rejected"
  | "expired"
  | "draft";

export interface StatusConfig {
  variant: "success" | "warning" | "error" | "info" | "secondary";
  label: string;
  icon: React.ReactNode;
  description: string;
}

/**
 * Get status configuration for a review status
 */
export function getStatusConfig(status: ReviewStatus): StatusConfig {
  const configs: Record<ReviewStatus, StatusConfig> = {
    pending_acceptance: {
      variant: "warning",
      label: "Pending",
      icon: <Clock className="size-3.5" />,
      description: "Waiting for acceptance",
    },
    in_progress: {
      variant: "info",
      label: "In Progress",
      icon: <FileText className="size-3.5" />,
      description: "Review is being completed",
    },
    completed: {
      variant: "success",
      label: "Completed",
      icon: <CheckCircle2 className="size-3.5" />,
      description: "Review has been submitted",
    },
    rejected: {
      variant: "error",
      label: "Rejected",
      icon: <XCircle className="size-3.5" />,
      description: "Review was declined",
    },
    expired: {
      variant: "secondary",
      label: "Expired",
      icon: <AlertCircle className="size-3.5" />,
      description: "Review opportunity expired",
    },
    draft: {
      variant: "secondary",
      label: "Draft",
      icon: <FileText className="size-3.5" />,
      description: "Review is being drafted",
    },
  };

  return configs[status];
}

export interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  showIcon?: boolean;
  showDot?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Review Status Badge Component
 *
 * Displays review status with consistent styling and icons
 */
export function ReviewStatusBadge({
  status,
  showIcon = true,
  showDot = false,
  size = "md",
  className,
}: ReviewStatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <Badge
      variant={config.variant}
      size={size}
      showDot={showDot}
      icon={showIcon ? config.icon : undefined}
      className={className}
    >
      {config.label}
    </Badge>
  );
}
