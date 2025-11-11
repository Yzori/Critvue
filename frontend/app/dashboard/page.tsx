"use client";

/**
 * Dashboard Page (Example)
 * Protected page requiring authentication
 * Demonstrates usage of ProtectedRoute and auth state
 */

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-semibold">Critvue</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="size-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {user?.full_name}!
              </h1>
              <p className="text-muted-foreground mt-2">
                This is a protected page that requires authentication.
              </p>
            </div>

            {/* User Info Card */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Your Account
              </h2>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">{user?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Status:</span>
                  <span className={user?.is_active ? "text-green-600" : "text-destructive"}>
                    {user?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Verified:</span>
                  <span className={user?.is_verified ? "text-green-600" : "text-accent-peach"}>
                    {user?.is_verified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Quick Actions
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="justify-start">
                  Create New Project
                </Button>
                <Button variant="outline" className="justify-start">
                  View My Projects
                </Button>
                <Button variant="outline" className="justify-start">
                  Account Settings
                </Button>
                <Button variant="outline" className="justify-start">
                  Get Feedback
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
