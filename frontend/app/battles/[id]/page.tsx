"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBattle,
  castVote,
  getVoteStats,
  Battle,
  BattleEntry,
  BattleVoteStats,
  getContentTypeInfo,
  getBattleStatusInfo,
  getTimeRemaining,
  ContentType,
} from "@/lib/api/battles";
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
import {
  Swords,
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
 * Battle Detail Page
 *
 * Shows battle information, entries, and voting interface
 */
export default function BattleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const battleId = Number(params.id);
  const { isAuthenticated, user } = useAuth();

  // State
  const [battle, setBattle] = React.useState<Battle | null>(null);
  const [voteStats, setVoteStats] = React.useState<BattleVoteStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [voting, setVoting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = React.useState<number | null>(null);
  const [showVoteConfirm, setShowVoteConfirm] = React.useState(false);

  // Fetch battle data
  React.useEffect(() => {
    const fetchBattle = async () => {
      try {
        setLoading(true);
        setError(null);

        const battleData = await getBattle(battleId);
        setBattle(battleData);

        // Fetch vote stats if voting or completed
        if (["voting", "completed", "draw"].includes(battleData.status)) {
          const stats = await getVoteStats(battleId);
          setVoteStats(stats);
        }
      } catch (err) {
        console.error("Error fetching battle:", err);
        setError("Failed to load battle. It may not exist or you may not have access.");
      } finally {
        setLoading(false);
      }
    };

    if (battleId) {
      fetchBattle();
    }
  }, [battleId]);

  // Handle vote
  const handleVote = async () => {
    if (!selectedEntry || !battle) return;

    try {
      setVoting(true);
      await castVote(battle.id, selectedEntry);

      // Refresh battle data
      const updatedBattle = await getBattle(battleId);
      setBattle(updatedBattle);

      const stats = await getVoteStats(battleId);
      setVoteStats(stats);

      setShowVoteConfirm(false);
      setSelectedEntry(null);
    } catch (err: any) {
      setError(err.message || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  // Check if user is a participant
  const isParticipant = battle && user && (battle.creatorId === user.id || battle.opponentId === user.id);

  // Check if user can vote
  const canVote = battle?.status === "voting" && !battle.currentUserVoted && !isParticipant && isAuthenticated;

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
  if (error || !battle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Battle Not Found</h2>
            <p className="text-gray-400 mb-6">{error || "This battle doesn't exist or has been removed."}</p>
            <Button onClick={() => router.push("/battles")}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Battles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getBattleStatusInfo(battle.status);
  const contentInfo = getContentTypeInfo(battle.contentType);
  const ContentIcon = contentTypeIcons[battle.contentType];

  // Get deadline info
  const deadlineInfo = battle.status === "active" && battle.submissionDeadline
    ? getTimeRemaining(battle.submissionDeadline)
    : battle.status === "voting" && battle.votingDeadline
    ? getTimeRemaining(battle.votingDeadline)
    : null;

  // Find entries by participant
  const creatorEntry = battle.entries.find((e) => e.userId === battle.creatorId);
  const opponentEntry = battle.entries.find((e) => e.userId === battle.opponentId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto max-w-6xl p-4 md:p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white mb-6"
          onClick={() => router.push("/battles")}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Battles
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary" className={cn("text-sm", contentInfo.color, "bg-white/10")}>
              <ContentIcon className="w-4 h-4 mr-1" />
              {contentInfo.label}
            </Badge>
            <Badge variant="secondary" className={cn(statusInfo.color, statusInfo.bgColor)}>
              {statusInfo.label}
            </Badge>
            {deadlineInfo && !deadlineInfo.isExpired && (
              <Badge variant="neutral" className="border-white/20 text-gray-300 bg-transparent">
                <Clock className="w-3 h-3 mr-1" />
                {deadlineInfo.formatted} left
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{battle.title}</h1>

          {battle.prompt && (
            <p className="text-gray-400 max-w-2xl">{battle.prompt.description}</p>
          )}
        </div>

        {/* Participants vs Card */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Creator */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-4 border-blue-500">
                  <AvatarImage src={battle.creatorAvatar} />
                  <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xl">
                    {battle.creatorName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-lg font-semibold text-white">{battle.creatorName || "Anonymous"}</div>
                  {battle.status === "completed" && battle.winnerId === battle.creatorId && (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Crown className="w-4 h-4" />
                      Winner
                    </div>
                  )}
                </div>
              </div>

              {/* VS */}
              <div className="flex flex-col items-center px-8">
                <Swords className="w-8 h-8 text-orange-400 mb-2" />
                <span className="text-gray-500 text-sm font-medium">VS</span>
              </div>

              {/* Opponent */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">{battle.opponentName || "Waiting..."}</div>
                  {battle.status === "completed" && battle.winnerId === battle.opponentId && (
                    <div className="flex items-center justify-end gap-1 text-yellow-400 text-sm">
                      <Crown className="w-4 h-4" />
                      Winner
                    </div>
                  )}
                </div>
                <Avatar className="w-16 h-16 border-4 border-red-500">
                  <AvatarImage src={battle.opponentAvatar} />
                  <AvatarFallback className="bg-red-500/20 text-red-400 text-xl">
                    {battle.opponentName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Vote Stats (if voting or completed) */}
            {voteStats && ["voting", "completed", "draw"].includes(battle.status) && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    {battle.status === "voting" ? "Current Votes" : "Final Results"}
                  </span>
                  <span className="text-sm text-gray-400">{voteStats.totalVotes} total votes</span>
                </div>

                <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                    style={{ width: `${voteStats.creatorPercentage}%` }}
                  />
                  <div
                    className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400 transition-all"
                    style={{ width: `${voteStats.opponentPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-400 font-medium">{voteStats.creatorPercentage.toFixed(1)}%</span>
                  <span className="text-red-400 font-medium">{voteStats.opponentPercentage.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Creator Entry */}
          <EntryCard
            entry={creatorEntry}
            participant={battle.creatorName || "Creator"}
            participantAvatar={battle.creatorAvatar}
            isWinner={battle.winnerId === battle.creatorId}
            isBlind={battle.status === "active"}
            canVote={canVote}
            isSelected={selectedEntry === creatorEntry?.id}
            userVotedFor={battle.currentUserVoteEntryId === creatorEntry?.id}
            onSelect={() => creatorEntry && setSelectedEntry(creatorEntry.id)}
            color="blue"
          />

          {/* Opponent Entry */}
          <EntryCard
            entry={opponentEntry}
            participant={battle.opponentName || "Opponent"}
            participantAvatar={battle.opponentAvatar}
            isWinner={battle.winnerId === battle.opponentId}
            isBlind={battle.status === "active"}
            canVote={canVote}
            isSelected={selectedEntry === opponentEntry?.id}
            userVotedFor={battle.currentUserVoteEntryId === opponentEntry?.id}
            onSelect={() => opponentEntry && setSelectedEntry(opponentEntry.id)}
            color="red"
          />
        </div>

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
        {battle.currentUserVoted && (
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="flex items-center justify-center gap-3 py-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">You've voted in this battle!</span>
            </CardContent>
          </Card>
        )}

        {/* Participant Message */}
        {isParticipant && battle.status === "voting" && (
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="flex items-center justify-center gap-3 py-4">
              <Swords className="w-5 h-5 text-blue-400" />
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
              Your vote is final and cannot be changed. Make sure you've reviewed both entries carefully.
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
    </div>
  );
}

// ==================== Entry Card Component ====================

interface EntryCardProps {
  entry?: BattleEntry;
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
        "bg-white/5 border-white/10 transition-all",
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
