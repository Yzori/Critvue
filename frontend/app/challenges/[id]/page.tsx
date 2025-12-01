"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChallenge,
  castVote,
  getVoteStats,
  joinCategoryChallenge,
  createEntry,
  submitEntry,
  Challenge,
  ChallengeEntry,
  ChallengeVoteStats,
  ContentType,
  getContentTypeInfo,
  getChallengeStatusInfo,
  getChallengeTypeInfo,
  getTimeRemaining,
} from "@/lib/api/challenges";
import { getFileUrl } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  Vote,
  Eye,
  Lock,
  Crown,
  Users,
  Palette,
  Code,
  Video,
  FileText,
  Brush,
  Headphones,
  Radio,
  AlertCircle,
  Trophy,
  Sparkles,
  Award,
  Plus,
  Upload,
} from "lucide-react";

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
 * Challenge Detail Page
 *
 * Shows challenge information, entries, and voting/submission interface
 * Handles both 1v1 and category challenges
 */
export default function ChallengeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const challengeId = Number(params.id);
  const { isAuthenticated, user } = useAuth();

  // State
  const [challenge, setChallenge] = React.useState<Challenge | null>(null);
  const [voteStats, setVoteStats] = React.useState<ChallengeVoteStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [voting, setVoting] = React.useState(false);
  const [joining, setJoining] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = React.useState<number | null>(null);
  const [showVoteConfirm, setShowVoteConfirm] = React.useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = React.useState(false);
  const [showEntryForm, setShowEntryForm] = React.useState(false);
  const [entryTitle, setEntryTitle] = React.useState("");
  const [entryDescription, setEntryDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Fetch challenge data
  React.useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true);
        setError(null);

        const challengeData = await getChallenge(challengeId);
        setChallenge(challengeData);

        // Fetch vote stats if voting or completed
        if (["voting", "completed", "draw"].includes(challengeData.status)) {
          const stats = await getVoteStats(challengeId);
          setVoteStats(stats);
        }
      } catch (err) {
        console.error("Error fetching challenge:", err);
        setError("Failed to load challenge. It may not exist or you may not have access.");
      } finally {
        setLoading(false);
      }
    };

    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  // Handle vote
  const handleVote = async () => {
    if (!selectedEntry || !challenge) return;

    try {
      setVoting(true);
      await castVote(challenge.id, { entryId: selectedEntry });

      // Refresh challenge data
      const updatedChallenge = await getChallenge(challengeId);
      setChallenge(updatedChallenge);

      const stats = await getVoteStats(challengeId);
      setVoteStats(stats);

      setShowVoteConfirm(false);
      setSelectedEntry(null);
    } catch (err: any) {
      setError(err.message || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  // Handle join category challenge
  const handleJoin = async () => {
    if (!challenge) return;

    try {
      setJoining(true);
      await joinCategoryChallenge(challenge.id);

      // Refresh challenge data
      const updatedChallenge = await getChallenge(challengeId);
      setChallenge(updatedChallenge);

      setShowJoinConfirm(false);
    } catch (err: any) {
      setError(err.message || "Failed to join challenge");
    } finally {
      setJoining(false);
    }
  };

  // Handle create entry
  const handleCreateEntry = async () => {
    if (!challenge || !entryTitle.trim()) return;

    try {
      setSubmitting(true);
      await createEntry(challenge.id, {
        title: entryTitle,
        description: entryDescription || undefined,
      });

      // Refresh challenge data
      const updatedChallenge = await getChallenge(challengeId);
      setChallenge(updatedChallenge);

      setShowEntryForm(false);
      setEntryTitle("");
      setEntryDescription("");
    } catch (err: any) {
      setError(err.message || "Failed to create entry");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle submit entry
  const handleSubmitEntry = async () => {
    if (!challenge) return;

    try {
      setSubmitting(true);
      await submitEntry(challenge.id);

      // Refresh challenge data
      const updatedChallenge = await getChallenge(challengeId);
      setChallenge(updatedChallenge);
    } catch (err: any) {
      setError(err.message || "Failed to submit entry");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user is a participant
  const isParticipant = challenge && user && challenge.currentUserIsParticipant;

  // Check if user can vote
  const canVote = challenge?.status === "voting" && !challenge.currentUserVoted && !isParticipant && isAuthenticated;

  // Check if user can join (category challenges only)
  const canJoin = challenge?.challengeType === "category" &&
    challenge.status === "open" &&
    !isParticipant &&
    isAuthenticated;

  // Check if user can submit entry
  const canSubmitEntry = challenge?.status === "active" &&
    isParticipant &&
    challenge.currentUserEntry &&
    !challenge.currentUserEntry.submittedAt;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Challenge Not Found</h2>
            <p className="text-gray-400 mb-6">{error || "This challenge doesn't exist or has been removed."}</p>
            <Button onClick={() => router.push("/challenges")}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getChallengeStatusInfo(challenge.status);
  const contentInfo = getContentTypeInfo(challenge.contentType);
  const typeInfo = getChallengeTypeInfo(challenge.challengeType);
  const ContentIcon = contentTypeIcons[challenge.contentType];

  // Get deadline info
  const deadlineInfo = challenge.status === "active" && challenge.submissionDeadline
    ? getTimeRemaining(challenge.submissionDeadline)
    : challenge.status === "voting" && challenge.votingDeadline
    ? getTimeRemaining(challenge.votingDeadline)
    : challenge.status === "open" && challenge.submissionDeadline
    ? getTimeRemaining(challenge.submissionDeadline)
    : null;

  // For 1v1 challenges, find entries by participant
  const participant1Entry = challenge.entries.find((e) => e.userId === challenge.participant1Id);
  const participant2Entry = challenge.entries.find((e) => e.userId === challenge.participant2Id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto max-w-6xl p-4 md:p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white mb-6"
          onClick={() => router.push("/challenges")}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Challenges
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary" className={cn("text-sm", contentInfo.color, "bg-white/10")}>
              <ContentIcon className="w-4 h-4 mr-1" />
              {contentInfo.label}
            </Badge>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
              {typeInfo.label}
            </Badge>
            <Badge variant="secondary" className={cn(statusInfo.color, statusInfo.bgColor)}>
              {statusInfo.label}
            </Badge>
            {deadlineInfo && !deadlineInfo.isExpired && (
              <Badge variant="neutral" className="border-white/20 text-gray-300 bg-transparent">
                <Clock className="w-3 h-3 mr-1" />
                {deadlineInfo.days > 0
                  ? `${deadlineInfo.days}d ${deadlineInfo.hours}h left`
                  : `${deadlineInfo.hours}h ${deadlineInfo.minutes}m left`}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{challenge.title}</h1>

          {challenge.description && (
            <p className="text-gray-400 max-w-2xl">{challenge.description}</p>
          )}

          {challenge.prompt && (
            <Card className="mt-4 bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Challenge Prompt</h4>
                    <p className="text-sm text-gray-400">{challenge.prompt.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 1v1 Challenge View */}
        {challenge.challengeType === "one_on_one" && (
          <>
            {/* Participants vs Card */}
            <Card className="bg-white/5 border-white/10 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Participant 1 */}
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-4 border-blue-500">
                      <AvatarImage src={challenge.participant1Avatar} />
                      <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xl">
                        {challenge.participant1Name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-lg font-semibold text-white">{challenge.participant1Name || "TBD"}</div>
                      {challenge.status === "completed" && challenge.winnerId === challenge.participant1Id && (
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Crown className="w-4 h-4" />
                          Winner
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center px-8">
                    <Award className="w-8 h-8 text-purple-400 mb-2" />
                    <span className="text-gray-500 text-sm font-medium">VS</span>
                  </div>

                  {/* Participant 2 */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{challenge.participant2Name || "TBD"}</div>
                      {challenge.status === "completed" && challenge.winnerId === challenge.participant2Id && (
                        <div className="flex items-center justify-end gap-1 text-yellow-400 text-sm">
                          <Crown className="w-4 h-4" />
                          Winner
                        </div>
                      )}
                    </div>
                    <Avatar className="w-16 h-16 border-4 border-red-500">
                      <AvatarImage src={challenge.participant2Avatar} />
                      <AvatarFallback className="bg-red-500/20 text-red-400 text-xl">
                        {challenge.participant2Name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Vote Stats (if voting or completed) */}
                {voteStats && ["voting", "completed", "draw"].includes(challenge.status) && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {challenge.status === "voting" ? "Current Votes" : "Final Results"}
                      </span>
                      <span className="text-sm text-gray-400">{voteStats.totalVotes} total votes</span>
                    </div>

                    <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                        style={{ width: `${voteStats.participant1Percentage || 0}%` }}
                      />
                      <div
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400 transition-all"
                        style={{ width: `${voteStats.participant2Percentage || 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-blue-400 font-medium">{(voteStats.participant1Percentage || 0).toFixed(1)}%</span>
                      <span className="text-red-400 font-medium">{(voteStats.participant2Percentage || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entries Grid for 1v1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Participant 1 Entry */}
              <EntryCard
                entry={participant1Entry}
                participant={challenge.participant1Name || "Participant 1"}
                participantAvatar={challenge.participant1Avatar}
                isWinner={challenge.winnerId === challenge.participant1Id}
                isBlind={challenge.status === "active"}
                canVote={canVote}
                isSelected={selectedEntry === participant1Entry?.id}
                userVotedFor={challenge.currentUserVoteEntryId === participant1Entry?.id}
                onSelect={() => participant1Entry && setSelectedEntry(participant1Entry.id)}
                color="blue"
              />

              {/* Participant 2 Entry */}
              <EntryCard
                entry={participant2Entry}
                participant={challenge.participant2Name || "Participant 2"}
                participantAvatar={challenge.participant2Avatar}
                isWinner={challenge.winnerId === challenge.participant2Id}
                isBlind={challenge.status === "active"}
                canVote={canVote}
                isSelected={selectedEntry === participant2Entry?.id}
                userVotedFor={challenge.currentUserVoteEntryId === participant2Entry?.id}
                onSelect={() => participant2Entry && setSelectedEntry(participant2Entry.id)}
                color="red"
              />
            </div>
          </>
        )}

        {/* Category Challenge View */}
        {challenge.challengeType === "category" && (
          <>
            {/* Stats Card */}
            <Card className="bg-white/5 border-white/10 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{challenge.totalEntries}</div>
                      <div className="text-sm text-gray-400">Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{challenge.totalVotes}</div>
                      <div className="text-sm text-gray-400">Votes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{challenge.maxWinners}</div>
                      <div className="text-sm text-gray-400">Winners</div>
                    </div>
                  </div>

                  {/* Join Button */}
                  {canJoin && (
                    <Button
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={() => setShowJoinConfirm(true)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Join Competition
                    </Button>
                  )}

                  {/* Create Entry Button */}
                  {isParticipant && challenge.status === "active" && !challenge.currentUserEntry && (
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => setShowEntryForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Entry
                    </Button>
                  )}

                  {/* Submit Entry Button */}
                  {canSubmitEntry && (
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={handleSubmitEntry}
                      disabled={submitting}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {submitting ? "Submitting..." : "Submit Entry"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Entries Grid for Category */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                {challenge.status === "voting" ? "Vote for Your Favorite" : "Entries"}
              </h2>

              {challenge.entries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenge.entries.map((entry) => {
                    const isTopEntry = voteStats?.topEntries?.some((t) => t.entryId === entry.id);

                    return (
                      <Card
                        key={entry.id}
                        className={cn(
                          "bg-white/5 border-white/10 transition-all",
                          canVote && "cursor-pointer hover:border-purple-500/50",
                          selectedEntry === entry.id && "ring-2 ring-purple-500",
                          challenge.currentUserVoteEntryId === entry.id && "ring-2 ring-green-500"
                        )}
                        onClick={canVote ? () => setSelectedEntry(entry.id) : undefined}
                      >
                        <CardContent className="p-4">
                          {/* User Info */}
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={entry.userAvatar} />
                              <AvatarFallback className="bg-white/10 text-white text-xs">
                                {entry.userName?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{entry.userName}</div>
                            </div>
                            {isTopEntry && (
                              <Trophy className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>

                          {/* Entry Content */}
                          <h4 className="font-medium text-white mb-2">{entry.title}</h4>
                          {entry.description && (
                            <p className="text-sm text-gray-400 line-clamp-2 mb-3">{entry.description}</p>
                          )}

                          {/* Vote Count (if voting) */}
                          {challenge.status === "voting" && (
                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                              <span className="text-sm text-gray-400">{entry.voteCount} votes</span>
                              {canVote && (
                                <span className={cn(
                                  "text-sm",
                                  selectedEntry === entry.id ? "text-purple-400" : "text-gray-500"
                                )}>
                                  {selectedEntry === entry.id ? "Selected" : "Click to vote"}
                                </span>
                              )}
                              {challenge.currentUserVoteEntryId === entry.id && (
                                <Badge className="bg-green-500 text-white text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Your Vote
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Entries Yet</h3>
                    <p className="text-gray-400">Be the first to submit an entry!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Vote Button */}
        {canVote && selectedEntry && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 to-transparent">
            <div className="container mx-auto max-w-md">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={() => setShowVoteConfirm(true)}
              >
                <Vote className="w-5 h-5 mr-2" />
                Confirm Vote
              </Button>
            </div>
          </div>
        )}

        {/* Already Voted Message */}
        {challenge.currentUserVoted && (
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="flex items-center justify-center gap-3 py-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">You've voted in this challenge!</span>
            </CardContent>
          </Card>
        )}

        {/* Participant Message */}
        {isParticipant && challenge.status === "voting" && (
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="flex items-center justify-center gap-3 py-4">
              <Award className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400">You're a participant - let the community decide!</span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vote Confirmation Dialog */}
      <Dialog open={showVoteConfirm} onOpenChange={setShowVoteConfirm}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Your Vote</DialogTitle>
            <DialogDescription className="text-gray-400">
              Your vote is final and cannot be changed. Make sure you've reviewed all entries carefully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoteConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600"
              onClick={handleVote}
              disabled={voting}
            >
              {voting ? "Voting..." : "Cast Vote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Confirmation Dialog */}
      <Dialog open={showJoinConfirm} onOpenChange={setShowJoinConfirm}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Join Competition</DialogTitle>
            <DialogDescription className="text-gray-400">
              You're about to join this challenge. Once joined, you'll be able to create and submit your entry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? "Joining..." : "Join Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entry Form Dialog */}
      <Dialog open={showEntryForm} onOpenChange={setShowEntryForm}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create Your Entry</DialogTitle>
            <DialogDescription className="text-gray-400">
              Fill in the details for your challenge entry. You can edit this before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="entryTitle" className="text-white">Title</Label>
              <Input
                id="entryTitle"
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="Give your entry a title"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label htmlFor="entryDescription" className="text-white">Description (optional)</Label>
              <Textarea
                id="entryDescription"
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
                placeholder="Describe your entry..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryForm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleCreateEntry}
              disabled={submitting || !entryTitle.trim()}
            >
              {submitting ? "Creating..." : "Create Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Entry Card Component for 1v1 ====================

interface EntryCardProps {
  entry?: ChallengeEntry;
  participant: string;
  participantAvatar?: string;
  isWinner: boolean;
  isBlind: boolean;
  canVote: boolean;
  isSelected: boolean;
  userVotedFor: boolean;
  onSelect: () => void;
  color: "blue" | "red";
}

function EntryCard({
  entry,
  participant,
  participantAvatar,
  isWinner,
  isBlind,
  canVote,
  isSelected,
  userVotedFor,
  onSelect,
  color,
}: EntryCardProps) {
  const colorClasses = {
    blue: {
      border: "border-blue-500",
      ring: "ring-blue-500",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
    },
    red: {
      border: "border-red-500",
      ring: "ring-red-500",
      bg: "bg-red-500/10",
      text: "text-red-400",
    },
  };

  const colors = colorClasses[color];

  // Blind mode - hide content
  if (isBlind && entry) {
    return (
      <Card className={cn("bg-white/5 border-white/10", colors.border, "border-t-4")}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Lock className="w-12 h-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Entry Hidden</h3>
          <p className="text-gray-400 text-sm">
            Entries are hidden until both participants submit their work.
          </p>
        </CardContent>
      </Card>
    );
  }

  // No entry yet
  if (!entry) {
    return (
      <Card className={cn("bg-white/5 border-white/10", colors.border, "border-t-4")}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">{participant}</h3>
          <p className="text-gray-400 text-sm">Waiting for submission...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-white/5 border-white/10 transition-all relative",
        colors.border,
        "border-t-4",
        canVote && "cursor-pointer hover:bg-white/10",
        isSelected && "ring-2",
        isSelected && colors.ring,
        userVotedFor && "ring-2 ring-green-500"
      )}
      onClick={canVote ? onSelect : undefined}
    >
      {/* Winner Badge */}
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-yellow-500 text-black">
            <Crown className="w-3 h-3 mr-1" />
            Winner
          </Badge>
        </div>
      )}

      {/* User Voted Badge */}
      {userVotedFor && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Your Vote
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className={cn("w-10 h-10 border-2", colors.border)}>
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className={cn(colors.bg, colors.text)}>
              {participant[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base text-white">{participant}</CardTitle>
            {entry.submittedAt && (
              <p className="text-xs text-gray-500">
                Submitted {new Date(entry.submittedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <h3 className="text-lg font-semibold text-white mb-2">{entry.title}</h3>

        {entry.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">{entry.description}</p>
        )}

        {/* Thumbnail */}
        {entry.thumbnailUrl && (
          <div className="relative aspect-video rounded-lg overflow-hidden mb-4 bg-gray-800">
            <Image
              src={getFileUrl(entry.thumbnailUrl)}
              alt={entry.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Files */}
        {entry.fileUrls && entry.fileUrls.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-400">Files</h4>
            {entry.fileUrls.map((file, i) => (
              <a
                key={i}
                href={getFileUrl(file.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="truncate flex-1">{file.filename}</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        )}

        {/* External Links */}
        {entry.externalLinks && entry.externalLinks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Links</h4>
            {entry.externalLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-blue-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
                <span className="truncate flex-1">{link.title || link.url}</span>
              </a>
            ))}
          </div>
        )}

        {/* Vote indicator */}
        {canVote && (
          <div className={cn(
            "mt-4 p-3 rounded-lg border-2 border-dashed transition-colors text-center",
            isSelected ? colors.border : "border-gray-700",
            isSelected ? colors.text : "text-gray-500"
          )}>
            {isSelected ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Selected
              </span>
            ) : (
              <span>Click to vote for this entry</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
