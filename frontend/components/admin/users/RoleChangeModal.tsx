"use client";

import * as React from "react";
import { UserCog, Shield, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { adminUsersApi, UserListItem, UserRole } from "@/lib/api/admin-users";

interface RoleChangeModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const roleDescriptions: Record<UserRole, string> = {
  creator: "Can submit work for review and participate in challenges",
  reviewer: "Can review work, earn sparks, and participate in challenges",
  admin: "Full platform access including user management and moderation",
};

export function RoleChangeModal({ user, isOpen, onClose, onSuccess }: RoleChangeModalProps) {
  const [newRole, setNewRole] = React.useState<UserRole>("creator");
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setNewRole(user.role);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      await adminUsersApi.changeRole(user.id, newRole, reason || undefined);
      toast.success(`${user.full_name || user.email}'s role changed to ${newRole}`);
      onSuccess();
      onClose();
      setReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPromotingToAdmin = newRole === "admin" && user?.role !== "admin";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-purple-100">
              <UserCog className="h-5 w-5 text-purple-600" />
            </div>
            <DialogTitle className="text-foreground">Change User Role</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Change the user's role to grant or restrict platform capabilities.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="py-4 space-y-4">
            {/* User info */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{user.full_name || "No name"}</p>
                <p>{user.email}</p>
                <p className="mt-1">
                  Current role: <span className="font-medium capitalize">{user.role}</span>
                </p>
              </div>
            </div>

            {/* New Role */}
            <div>
              <Label htmlFor="new-role" className="text-foreground">
                New Role
              </Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger className="mt-2 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {roleDescriptions[newRole]}
              </p>
            </div>

            {/* Admin warning */}
            {isPromotingToAdmin && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <Shield className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Promoting to Admin</p>
                  <p className="mt-1">
                    This will give the user full administrative access including the ability to manage other users.
                  </p>
                </div>
              </div>
            )}

            {/* Reason (required for admin promotion) */}
            <div>
              <Label htmlFor="role-reason" className="text-foreground">
                Reason {isPromotingToAdmin && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="role-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional: Explain reason for role change..."
                className="mt-2 bg-background border-border"
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || newRole === user?.role || (isPromotingToAdmin && !reason)}
          >
            {isSubmitting ? "Changing..." : "Change Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
