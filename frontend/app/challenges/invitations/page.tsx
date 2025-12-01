"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyInvitations,
  respondToInvitation,
  getChallenge,
  ChallengeInvitation,
  Challenge,
  getContentTypeInfo,
  getChallengeTypeInfo,
  getTimeRemaining,
} from "@/lib/api/challenges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Award,
  Eye,
  MessageSquare,
  Palette,
  Code,
  Video,
  FileText,
  Brush,
  Headphones,
  Radio,
  Bell,
} from "lucide-react";
import { ContentType } from "@/lib/api/challenges";

// Content type icons
const contentTypeIcons: Record<ContentType, React.ComponentType<{ className?: string }>> = {
  design: Palette,
  code: Code,
  video: Video,
  stream: Radio,
  audio: Headphones,
  writing: FileText,
  art: Brush,
};

/**
 * Challenge Invitations Page
 *
 * Displays pending invitations and allows users to accept/decline
 */
export default function InvitationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [invitations, setInvitations] = React.useState<ChallengeInvitation[]>([]);
  const [challengeDetails, setChallengeDetails] = React.useState<Record<number, Challenge>>({});
  const [loading, setLoading] = React.useState(true);
  const [responding, setResponding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] = React.useState<ChallengeInvitation | null>(null);
  const [showDeclineConfirm, setShowDeclineConfirm] = React.useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/challenges/invitations");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch invitations
  React.useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        const data = await getMyInvitations();
        setInvitations(data);

        // Fetch challenge details for each invitation
        const details: Record<number, Challenge> = {};
        for (const inv of data) {
          try {
            const challenge = await getChallenge(inv.challengeId);
            details[inv.challengeId] = challenge;
          } catch {
            // Challenge might not be accessible
          }
        }
        setChallengeDetails(details);
      } catch (err) {
        console.error("Error fetching invitations:", err);
        setError("Failed to load invitations");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      fetchInvitations();
    }
  }, [isAuthenticated, authLoading]);

  // Handle accept invitation
  const handleAccept = async (invitation: ChallengeInvitation) => {
    try {
      setResponding(true);
      await respondToInvitation(invitation.id, true);

      // Remove from list
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));

      // Navigate to challenge
      router.push(`/challenges/${invitation.challengeId}`);
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
    } finally {
      setResponding(false);
    }
  };

  // Handle decline invitation
  const handleDecline = async () => {
    if (!selectedInvitation) return;

    try {
      setResponding(true);
      await respondToInvitation(selectedInvitation.id, false);

      // Remove from list
      setInvitations((prev) => prev.filter((i) => i.id !== selectedInvitation.id));

      setShowDeclineConfirm(false);
      setSelectedInvitation(null);
    } catch (err: any) {
      setError(err.message || "Failed to decline invitation");
    } finally {
      setResponding(false);
    }
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-8">
        <div className="container mx-auto max-w-3xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto max-w-3xl p-4 md:p-8">
        {/* Header */}
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white mb-6"
          onClick={() => router.push("/challenges")}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Challenges
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Bell className="w-6 h-6 text-orange-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Challenge Invitations</h1>
          </div>
          <p className="text-gray-400">
            You've been selected to compete in these 1v1 challenges. Accept to participate!
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-red-400"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invitations List */}
        {invitations.length > 0 ? (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const challenge = challengeDetails[invitation.challengeId];
              const timeRemaining = getTimeRemaining(invitation.expiresAt);
              const contentInfo = challenge ? getContentTypeInfo(challenge.contentType) : null;
              const Icon = challenge ? contentTypeIcons[challenge.contentType] : Sparkles;

              return (
                <Card
                  key={invitation.id}
                  className="bg-white/5 border-white/10 overflow-hidden"
                >
                  {/* Expiry Warning */}
                  {timeRemaining && !timeRemaining.isExpired && timeRemaining.days < 1 && (
                    <div className="bg-orange-500/20 px-4 py-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-orange-400">
                        Expires in {timeRemaining.hours}h {timeRemaining.minutes}m
                      </span>
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn("p-3 rounded-xl bg-purple-500/10 shrink-0")}>
                        <Icon className={cn("w-6 h-6", contentInfo?.color || "text-purple-400")} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                            1v1 Challenge
                          </Badge>
                          {contentInfo && (
                            <Badge variant="secondary" className={cn("bg-white/10", contentInfo.color)}>
                              {contentInfo.label}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-2">
                          {challenge?.title || "Loading..."}
                        </h3>

                        {invitation.message && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 mb-4">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-400 italic">"{invitation.message}"</p>
                          </div>
                        )}

                        {challenge?.prompt && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-1">Challenge Theme:</h4>
                            <p className="text-sm text-gray-300">{challenge.prompt.title}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Button
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handleAccept(invitation)}
                            disabled={responding}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept Challenge
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            onClick={() => {
                              setSelectedInvitation(invitation);
                              setShowDeclineConfirm(true);
                            }}
                            disabled={responding}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                          {challenge && (
                            <Button
                              variant="ghost"
                              className="text-gray-400 hover:text-white"
                              onClick={() => router.push(`/challenges/${invitation.challengeId}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Pending Invitations</h3>
              <p className="text-gray-400 mb-6">
                You don't have any challenge invitations at the moment.
                <br />
                Keep creating great work and you might be selected for a 1v1 challenge!
              </p>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => router.push("/challenges")}
              >
                Browse Challenges
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Decline Confirmation Dialog */}
      <Dialog open={showDeclineConfirm} onOpenChange={setShowDeclineConfirm}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Decline Invitation?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to decline this challenge invitation? The platform may select another creator to take your place.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDecline}
              disabled={responding}
            >
              {responding ? "Declining..." : "Yes, Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
