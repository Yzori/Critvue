"use client";

import * as React from "react";
import { Ban, AlertTriangle } from "lucide-react";
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
import { toast } from "sonner";
import { adminUsersApi, UserListItem } from "@/lib/api/admin-users";

interface BanUserModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BanUserModal({ user, isOpen, onClose, onSuccess }: BanUserModalProps) {
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!user || reason.length < 10) return;

    try {
      setIsSubmitting(true);
      await adminUsersApi.banUser(user.id, reason);
      toast.success(`${user.full_name || user.email} has been banned`);
      onSuccess();
      onClose();
      setReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to ban user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-100">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-foreground">Ban User</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            This will permanently ban the user from the platform. They will not be able to log in or access any features.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="py-4">
            {/* Warning */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">You are about to ban:</p>
                <p className="mt-1">{user.full_name || "No name"} ({user.email})</p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="ban-reason" className="text-foreground">
                Reason for ban <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="ban-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this user is being banned (min 10 characters)..."
                className="mt-2 bg-background border-border"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reason.length}/10 characters minimum
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || reason.length < 10}
          >
            {isSubmitting ? "Banning..." : "Ban User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
