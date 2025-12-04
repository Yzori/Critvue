"use client";

import * as React from "react";
import { Clock, AlertTriangle } from "lucide-react";
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
import { adminUsersApi, UserListItem } from "@/lib/api/admin-users";

interface SuspendUserModalProps {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const durationOptions = [
  { value: "1", label: "1 hour" },
  { value: "6", label: "6 hours" },
  { value: "24", label: "1 day" },
  { value: "72", label: "3 days" },
  { value: "168", label: "1 week" },
  { value: "336", label: "2 weeks" },
  { value: "720", label: "1 month" },
];

export function SuspendUserModal({ user, isOpen, onClose, onSuccess }: SuspendUserModalProps) {
  const [reason, setReason] = React.useState("");
  const [duration, setDuration] = React.useState("24");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!user || reason.length < 10) return;

    try {
      setIsSubmitting(true);
      const result = await adminUsersApi.suspendUser(user.id, reason, parseInt(duration));
      toast.success(result.message);
      onSuccess();
      onClose();
      setReason("");
      setDuration("24");
    } catch (error: any) {
      toast.error(error.message || "Failed to suspend user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExpiryDate = () => {
    const hours = parseInt(duration);
    const expiry = new Date(Date.now() + hours * 60 * 60 * 1000);
    return expiry.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-200 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle className="text-gray-900">Suspend User</DialogTitle>
          </div>
          <DialogDescription className="text-gray-500">
            Temporarily suspend the user. They will not be able to access the platform until the suspension expires.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="py-4 space-y-4">
            {/* User info */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{user.full_name || "No name"}</p>
                <p>{user.email}</p>
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration" className="text-gray-700">
                Suspension Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="mt-2 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Suspension will expire: {getExpiryDate()}
              </p>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="suspend-reason" className="text-gray-700">
                Reason for suspension <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="suspend-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this user is being suspended (min 10 characters)..."
                className="mt-2 bg-white border-gray-300"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
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
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting || reason.length < 10}
          >
            {isSubmitting ? "Suspending..." : "Suspend User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
