"use client";

import * as React from "react";
import {
  X,
  Ban,
  Clock,
  UserCog,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Swords,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { adminUsersApi, UserDetail, UserRole, UserTier } from "@/lib/api/admin-users";

interface UserDetailDrawerProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: "ban" | "suspend" | "role") => void;
}

const roleColors: Record<UserRole, { bg: string; text: string }> = {
  creator: { bg: "bg-blue-100", text: "text-blue-700" },
  reviewer: { bg: "bg-purple-100", text: "text-purple-700" },
  admin: { bg: "bg-red-100", text: "text-red-700" },
};

const tierColors: Record<UserTier, string> = {
  novice: "text-muted-foreground",
  contributor: "text-green-600",
  skilled: "text-blue-600",
  trusted_advisor: "text-purple-600",
  expert: "text-amber-600",
  master: "text-orange-600",
};

export function UserDetailDrawer({ userId, isOpen, onClose, onAction }: UserDetailDrawerProps) {
  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const data = await adminUsersApi.getUser(userId);
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && userId) {
      fetchUser();
    }
  }, [isOpen, userId]);

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">User Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#4CC9F0]" />
            </div>
          ) : user ? (
            <div className="p-4 space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#4CC9F0]/10 text-[#4CC9F0] text-lg">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">
                    {user.full_name || "No name"}
                  </h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={cn("capitalize", roleColors[user.role].bg, roleColors[user.role].text)}>
                      {user.role}
                    </Badge>
                    <Badge variant="outline" className={cn("capitalize", tierColors[user.user_tier])}>
                      {user.user_tier.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status */}
              {(user.is_banned || user.is_suspended) && (
                <div className={cn(
                  "p-4 rounded-lg",
                  user.is_banned ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {user.is_banned ? (
                      <Ban className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                    <span className={cn("font-medium", user.is_banned ? "text-red-700" : "text-amber-700")}>
                      {user.is_banned ? "Banned" : "Suspended"}
                    </span>
                  </div>
                  <p className={cn("text-sm", user.is_banned ? "text-red-600" : "text-amber-600")}>
                    {user.is_banned ? user.ban_reason : user.suspension_reason}
                  </p>
                  {user.is_suspended && user.suspended_until && (
                    <p className="text-xs text-amber-500 mt-1">
                      Until: {formatDate(user.suspended_until)}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {/* Stats */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <StatItem
                    icon={Star}
                    label="Karma"
                    value={user.karma_points.toLocaleString()}
                    color="text-amber-500"
                  />
                  <StatItem
                    icon={TrendingUp}
                    label="XP"
                    value={user.xp_points.toLocaleString()}
                    color="text-blue-500"
                  />
                  <StatItem
                    icon={Award}
                    label="Reviews Given"
                    value={user.total_reviews_given.toString()}
                    color="text-purple-500"
                  />
                  <StatItem
                    icon={Award}
                    label="Reviews Received"
                    value={user.total_reviews_received.toString()}
                    color="text-green-500"
                  />
                </div>
              </div>

              {/* Challenges */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Challenges</h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Swords className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">{user.challenges_won} won</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Swords className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">{user.challenges_lost} lost</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Swords className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{user.challenges_drawn} drawn</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Info */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Account</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Verified</span>
                    {user.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        No
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subscription</span>
                    <span className="text-foreground capitalize">{user.subscription_tier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="text-foreground">{formatDate(user.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Login</span>
                    <span className="text-foreground">{formatDate(user.last_login)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              User not found
            </div>
          )}
        </div>

        {/* Actions */}
        {user && !user.is_banned && (
          <div className="border-t border-border p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onAction("role")}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Change Role
            </Button>
            {!user.is_suspended && (
              <Button
                variant="outline"
                className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => onAction("suspend")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Suspend User
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onAction("ban")}
            >
              <Ban className="h-4 w-4 mr-2" />
              Ban User
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
      <Icon className={cn("h-5 w-5", color)} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
