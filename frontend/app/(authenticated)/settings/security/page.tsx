"use client";

import * as React from "react";
import {
  Shield,
  Key,
  Smartphone,
  Monitor,
  LogOut,
  Loader2,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Security Settings Page
 *
 * Allows users to manage security settings:
 * - Change password
 * - Two-factor authentication
 * - Connected accounts (Google OAuth)
 * - Active sessions
 */

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

interface ConnectedAccount {
  provider: string;
  email: string;
  connected_at: string;
}

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordForm, setPasswordForm] = React.useState<PasswordFormData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = React.useState<Partial<PasswordFormData>>({});
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);
  const [twoFactorEnabled] = React.useState(false);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [connectedAccounts, setConnectedAccounts] = React.useState<ConnectedAccount[]>([]);

  // Fetch sessions from API
  const fetchSessions = React.useCallback(async () => {
    try {
      const data = await apiClient.get<Session[]>("/auth/sessions");
      setSessions(data);
    } catch {
      // Fallback to showing current session
      setSessions([
        {
          id: "current",
          device: "Desktop",
          browser: "Chrome",
          location: "Current session",
          last_active: new Date().toISOString(),
          is_current: true,
        },
      ]);
    }
  }, []);

  React.useEffect(() => {
    fetchSessions();

    // Check for connected OAuth accounts
    // This would come from the user object or a separate API call
    if (user?.email) {
      // Placeholder - check if user signed up with Google
      setConnectedAccounts([]);
    }
  }, [user, fetchSessions]);

  const validatePassword = (): boolean => {
    const errors: Partial<PasswordFormData> = {};

    if (!passwordForm.current_password) {
      errors.current_password = "Current password is required";
    }

    if (!passwordForm.new_password) {
      errors.new_password = "New password is required";
    } else if (passwordForm.new_password.length < 8) {
      errors.new_password = "Password must be at least 8 characters";
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) return;

    try {
      setIsSavingPassword(true);
      await apiClient.post("/auth/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordErrors({});
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      toast.success("Session revoked successfully");
      // Refresh sessions list
      await fetchSessions();
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      const result = await apiClient.delete<{ revoked_count: number }>("/auth/sessions");
      toast.success(`Revoked ${result.revoked_count} session(s)`);
      // Refresh sessions list
      await fetchSessions();
    } catch {
      toast.error("Failed to revoke sessions");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold lg:text-xl">Security</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your password and security settings
        </p>
      </div>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="size-5" />
            Password
          </CardTitle>
          <CardDescription>
            Change your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Last changed: Unknown
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(true)}
              >
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      current_password: e.target.value,
                    }))
                  }
                  placeholder="Enter current password"
                />
                {passwordErrors.current_password && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.current_password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      new_password: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                />
                {passwordErrors.new_password && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.new_password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }))
                  }
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirm_password && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.confirm_password}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({
                      current_password: "",
                      new_password: "",
                      confirm_password: "",
                    });
                    setPasswordErrors({});
                  }}
                  disabled={isSavingPassword}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={isSavingPassword}
                  className={cn(
                    "bg-accent-blue text-white font-semibold",
                    "hover:opacity-90"
                  )}
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="size-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {twoFactorEnabled ? (
                <Badge variant="success">
                  <Check className="size-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="neutral">
                  <X className="size-3 mr-1" />
                  Disabled
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled
                  ? "Your account is protected with 2FA"
                  : "Protect your account with 2FA"}
              </p>
            </div>
            <Button variant="outline" disabled>
              {twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Two-factor authentication is coming soon
          </p>
        </CardContent>
      </Card>

      {/* Connected Accounts Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="size-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage third-party accounts linked to your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Google Account */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-white border flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="size-5">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Google</p>
                  <p className="text-sm text-muted-foreground">
                    {connectedAccounts.find((a) => a.provider === "google")
                      ? connectedAccounts.find((a) => a.provider === "google")?.email
                      : "Not connected"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                {connectedAccounts.find((a) => a.provider === "google")
                  ? "Disconnect"
                  : "Connect"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="size-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage devices where you're logged in
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllSessions}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="size-4 mr-2" />
                Sign out all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <React.Fragment key={session.id}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                      <Monitor className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {session.browser} on {session.device}
                        </p>
                        {session.is_current && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.location}
                      </p>
                    </div>
                  </div>
                  {!session.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertTriangle className="size-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="destructive" disabled>
                    Delete Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
