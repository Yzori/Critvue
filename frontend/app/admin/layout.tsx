"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "@/components/admin";
import { Loader2 } from "lucide-react";

/**
 * Admin Layout
 *
 * Wraps all admin pages with the AdminShell component.
 * Handles admin authentication and authorization.
 * Hides the main navigation in favor of the admin sidebar.
 */

interface AdminStats {
  pendingApplications: number;
  bannedCount: number;
  suspendedCount: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    pendingApplications: 0,
    bannedCount: 0,
    suspendedCount: 0,
  });

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch admin stats for sidebar badges
  useEffect(() => {
    const fetchStats = async () => {
      if (user?.role !== "admin") return;

      try {
        // TODO: Fetch actual stats from API
        // For now using placeholder - will be updated when API is ready
        const response = await fetch("/api/v1/admin/applications/stats", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setStats({
            pendingApplications: data.pending_applications || 0,
            bannedCount: 0, // Will be added when moderation API is ready
            suspendedCount: 0,
          });
        }
      } catch {
        // Non-critical - stats will just show as 0
      }
    };

    fetchStats();
  }, [user]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-[#4CC9F0]" />
      </div>
    );
  }

  // Not authorized
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <AdminShell
      pendingApplications={stats.pendingApplications}
      bannedCount={stats.bannedCount}
      suspendedCount={stats.suspendedCount}
    >
      {children}
    </AdminShell>
  );
}
