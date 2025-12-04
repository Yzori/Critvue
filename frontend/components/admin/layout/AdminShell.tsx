"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminShellProps {
  children: React.ReactNode;
  pendingApplications?: number;
  bannedCount?: number;
  suspendedCount?: number;
}

export function AdminShell({
  children,
  pendingApplications = 0,
  bannedCount = 0,
  suspendedCount = 0,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        pendingApplications={pendingApplications}
        bannedCount={bannedCount}
        suspendedCount={suspendedCount}
      />

      {/* Main content area */}
      <div className="pl-[260px] transition-all duration-300">
        {/* Header */}
        <AdminHeader />

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
