"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
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
import { Progress } from "@/components/ui/progress";
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
  ArrowRight,
  Star,
} from "lucide-react";

// Content type icons and config
const contentTypeConfig: Record<ContentType, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  design: { icon: Palette, color: "text-accent-blue", bg: "bg-accent-blue/10" },
  code: { icon: Code, color: "text-accent-sage", bg: "bg-accent-sage/10" },
  video: { icon: Video, color: "text-red-500", bg: "bg-red-50" },
  audio: { icon: Headphones, color: "text-accent-peach", bg: "bg-accent-peach/10" },
  writing: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
  art: { icon: Brush, color: "text-purple-500", bg: "bg-purple-50" },
  stream: { icon: Radio, color: "text-pink-500", bg: "bg-pink-50" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-gray-500", bg: "bg-gray-100" },
  inviting: { label: "Inviting", color: "text-blue-500", bg: "bg-blue-50" },
  open: { label: "Open for Entries", color: "text-accent-sage", bg: "bg-accent-sage/10" },
  active: { label: "Submissions Open", color: "text-accent-blue", bg: "bg-accent-blue/10" },
  voting: { label: "Voting", color: "text-accent-peach", bg: "bg-accent-peach/10" },
  completed: { label: "Completed", color: "text-gray-500", bg: "bg-muted" },
  draw: { label: "Draw", color: "text-gray-500", bg: "bg-muted" },
};

// Mock data flag - should match the main challenges page
const USE_MOCK_DATA = true;

// Mock challenge data for demo
const getMockChallenge = (id: number): Challenge | null => {
  const mockChallenges: Record<number, Challenge> = {
    1: {
      id: 1,
      title: "Cyberpunk UI Battle",
      description: "Design a futuristic dashboard interface with neon aesthetics and dark themes. Show us your vision of 2077. The best designs will be featured in our showcase.",
      challengeType: "one_on_one",
      contentType: "design",
      status: "voting",
      submissionHours: 48,
      votingHours: 24,
      votingDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      maxWinners: 1,
      totalEntries: 2,
      participant1Id: 1,
      participant2Id: 2,
      participant1Votes: 127,
      participant2Votes: 98,
      participant1Name: "PixelMaster",
      participant1Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PixelMaster",
      participant2Name: "NeonDreamer",
      participant2Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NeonDreamer",
      isFeatured: true,
      totalVotes: 225,
      createdAt: new Date().toISOString(),
      createdBy: 1,
      entries: [
        {
          id: 1,
          challengeId: 1,
          userId: 1,
          title: "Neon Dashboard Concept",
          description: "A cyberpunk-inspired dashboard with holographic elements",
          thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop",
          voteCount: 127,
          submittedAt: new Date().toISOString(),
          userName: "PixelMaster",
          userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PixelMaster",
        },
        {
          id: 2,
          challengeId: 1,
          userId: 2,
          title: "Cyber Control Panel",
          description: "Minimalist neon interface with dynamic data visualization",
          thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop",
          voteCount: 98,
          submittedAt: new Date().toISOString(),
          userName: "NeonDreamer",
          userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NeonDreamer",
        },
      ],
      invitations: [],
      currentUserVoted: false,
      currentUserIsParticipant: false,
    },
    2: {
      id: 2,
      title: "Algorithm Showdown",
      description: "Implement the most elegant sorting algorithm visualization. Show creativity in how you display data transformations.",
      challengeType: "one_on_one",
      contentType: "code",
      status: "voting",
      submissionHours: 24,
      votingHours: 12,
      votingDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      maxWinners: 1,
      totalEntries: 2,
      participant1Id: 3,
      participant2Id: 4,
      participant1Votes: 45,
      participant2Votes: 52,
      participant1Name: "CodeNinja",
      participant1Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CodeNinja",
      participant2Name: "ByteWizard",
      participant2Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ByteWizard",
      isFeatured: false,
      totalVotes: 97,
      createdAt: new Date().toISOString(),
      createdBy: 1,
      entries: [
        {
          id: 3,
          challengeId: 2,
          userId: 3,
          title: "Bubble Sort Symphony",
          description: "Musical visualization of bubble sort",
          voteCount: 45,
          submittedAt: new Date().toISOString(),
          userName: "CodeNinja",
          userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CodeNinja",
        },
        {
          id: 4,
          challengeId: 2,
          userId: 4,
          title: "Quick Sort Galaxy",
          description: "Space-themed quick sort visualization",
          voteCount: 52,
          submittedAt: new Date().toISOString(),
          userName: "ByteWizard",
          userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ByteWizard",
        },
      ],
      invitations: [],
      currentUserVoted: false,
      currentUserIsParticipant: false,
    },
    3: {
      id: 3,
      title: "Motion Magic",
      description: "Create a mesmerizing loading animation that captivates users while they wait.",
      challengeType: "one_on_one",
      contentType: "design",
      status: "voting",
      submissionHours: 24,
      votingHours: 12,
      votingDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      maxWinners: 1,
      totalEntries: 2,
      participant1Id: 5,
      participant2Id: 6,
      participant1Votes: 78,
      participant2Votes: 65,
      participant1Name: "AnimateX",
      participant1Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnimateX",
      participant2Name: "FrameFlow",
      participant2Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=FrameFlow",
      isFeatured: false,
      totalVotes: 143,
      createdAt: new Date().toISOString(),
      createdBy: 1,
      entries: [
        {
          id: 5,
          challengeId: 3,
          userId: 5,
          title: "Morphing Loader",
          description: "A smooth morphing animation",
          voteCount: 78,
          submittedAt: new Date().toISOString(),
          userName: "AnimateX",
          userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnimateX",
        },
        {
          id: 6,
          challengeId: 3,
          userId: 6,
          title: "Particle Storm",
          description: "Dynamic particle-based loading animation",
          voteCount: 65,
          submittedAt: new Date().toISOString(),
          userName: "FrameFlow",
          userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=FrameFlow",
        },
      ],
      invitations: [],
      currentUserVoted: false,
      currentUserIsParticipant: false,
    },
    101: {
      id: 101,
      title: "Mobile App Redesign Sprint",
      description: "Reimagine a popular app's user experience with fresh, modern design principles. Focus on usability, accessibility, and visual appeal.",
      challengeType: "category",
      contentType: "design",
      status: "open",
      submissionHours: 72,
      votingHours: 48,
      submissionDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      maxWinners: 3,
      totalEntries: 24,
      participant1Votes: 0,
      participant2Votes: 0,
      isFeatured: true,
      totalVotes: 0,
      winnerKarmaReward: 100,
      prizeDescription: "Top 3 designs will be featured on our homepage",
      createdAt: new Date().toISOString(),
      createdBy: 1,
      entries: [],
      invitations: [],
      currentUserVoted: false,
      currentUserIsParticipant: false,
    },
    102: {
      id: 102,
      title: "React Component Challenge",
      description: "Build an innovative, reusable React component that solves a common problem.",
      challengeType: "category",
      contentType: "code",
      status: "open",
      submissionHours: 48,
      votingHours: 24,
      submissionDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      maxWinners: 1,
      totalEntries: 18,
      participant1Votes: 0,
      participant2Votes: 0,
      isFeatured: false,
      totalVotes: 0,
      winnerKarmaReward: 75,
      createdAt: new Date().toISOString(),
      createdBy: 1,
      entries: [],
      invitations: [],
      currentUserVoted: false,
      currentUserIsParticipant: false,
    },
    103: {
      id: 103,
      title: "Short Film Festival",
      description: "Create a compelling 60-second short film on the theme of 'Connection'.",
      challengeType: "category",
      contentType: "video",
      status: "open",
      submissionHours: 168,
      votingHours: 72,
      submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxWinners: 5,
      totalEntries: 12,
      participant1Votes: 0,
      participant2Votes: 0,
      isFeatured: false,
      totalVotes: 0,
      winnerKarmaReward: 150,
      createdAt: new Date().toISOString(),
      createdBy: 1,
      entries: [],
      invitations: [],
      currentUserVoted: false,
      currentUserIsParticipant: false,
    },
    104: {
      id: 104,
      title: "Podcast Intro Battle",
      description: "Produce a captivating 30-second podcast intro with music and voice.",
      challengeType: "category",
      contentType: "audio",
      status: "voting",
      submissionHours: 48,
      votingHours: 24,
      votingDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      maxWinners: 1,
      totalEntries: 8,
      participant1Votes: 0,
      participant2Votes: 0,
      isFeatured: false,
      totalVotes: 45,
      winnerKarmaReward: 50,
      createdAt: new Date().toISOString(),
      createdBy: 1,
      entries: [],
      invitations: [],
      currentUserVoted: false,
      currentUserIsParticipant: false,
    },
  };
  return mockChallenges[id] || null;
};

/**
 * Challenge Detail Page - Light Theme
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

        if (USE_MOCK_DATA) {
          // Use mock data for demo
          await new Promise((r) => setTimeout(r, 300)); // Simulate loading
          const mockChallenge = getMockChallenge(challengeId);
          if (mockChallenge) {
            setChallenge(mockChallenge);
            // Mock vote stats
            if (["voting", "completed", "draw"].includes(mockChallenge.status)) {
              setVoteStats({
                totalVotes: mockChallenge.totalVotes,
                showVoteCounts: mockChallenge.status !== "voting",
                topEntries: mockChallenge.entries?.slice(0, 10).map((e) => ({
                  entryId: e.id,
                  votes: e.voteCount || 0,
                })) || [],
              });
            }
          } else {
            setError("Challenge not found");
          }
          setLoading(false);
          return;
        }

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
      <div className="min-h-screen bg-[var(--background-subtle)]">
        <div className="container mx-auto max-w-6xl p-4 md:p-8">
          <Skeleton className="h-8 w-32 mb-8 bg-muted" />
          <Skeleton className="h-64 w-full mb-8 bg-muted rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full bg-muted rounded-2xl" />
            <Skeleton className="h-96 w-full bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-[var(--background-subtle)] flex items-center justify-center p-4">
        <Card className="bg-background border-border shadow-sm max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Challenge Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || "This challenge doesn't exist or has been removed."}</p>
            <Button
              className="bg-accent-blue hover:bg-accent-blue/90 text-white"
              onClick={() => router.push("/challenges")}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeConfig = contentTypeConfig[challenge.contentType] || contentTypeConfig.design;
  const currentStatusConfig = statusConfig[challenge.status] || statusConfig.open;
  const ContentIcon = typeConfig.icon;

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

  // Calculate vote percentages for 1v1
  const totalVotes = (challenge.participant1Votes || 0) + (challenge.participant2Votes || 0);
  const p1Percentage = totalVotes > 0 ? Math.round((challenge.participant1Votes || 0) / totalVotes * 100) : 50;
  const p2Percentage = 100 - p1Percentage;

  return (
    <div className="min-h-screen bg-[var(--background-subtle)]">
      <div className="container mx-auto max-w-6xl p-4 md:p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground hover:bg-muted mb-6"
          onClick={() => router.push("/challenges")}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Challenges
        </Button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className={cn(
            "bg-background border-border shadow-sm mb-6 overflow-hidden",
            challenge.isFeatured && "ring-2 ring-accent-peach/30"
          )}>
            {/* Featured Banner */}
            {challenge.isFeatured && (
              <div className="bg-gradient-to-r from-accent-peach to-orange-500 px-4 py-2 flex items-center justify-center gap-2">
                <Star className="w-4 h-4 text-white fill-white" />
                <span className="text-sm font-semibold text-white">Featured Challenge</span>
              </div>
            )}

            <CardContent className="p-6">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className={cn("p-2 rounded-xl", typeConfig.bg)}>
                  <ContentIcon className={cn("w-5 h-5", typeConfig.color)} />
                </div>
                <Badge variant="outline" className={cn("font-medium border-0", typeConfig.bg, typeConfig.color)}>
                  {challenge.contentType.charAt(0).toUpperCase() + challenge.contentType.slice(1)}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-0 font-medium">
                  {challenge.challengeType === "one_on_one" ? "1v1 Battle" : "Open Challenge"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("font-medium border-0", currentStatusConfig.bg, currentStatusConfig.color)}
                >
                  {challenge.status === "voting" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-peach animate-pulse mr-1.5" />
                  )}
                  {currentStatusConfig.label}
                </Badge>
                {deadlineInfo && !deadlineInfo.isExpired && (
                  <Badge variant="outline" className="border-gray-200 text-gray-600 font-medium">
                    <Clock className="w-3 h-3 mr-1" />
                    {deadlineInfo.days > 0
                      ? `${deadlineInfo.days}d ${deadlineInfo.hours}h left`
                      : `${deadlineInfo.hours}h ${deadlineInfo.minutes}m left`}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{challenge.title}</h1>

              {challenge.description && (
                <p className="text-muted-foreground max-w-2xl mb-4">{challenge.description}</p>
              )}

              {challenge.prompt && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Challenge Prompt</h4>
                      <p className="text-sm text-muted-foreground">{challenge.prompt.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 1v1 Challenge View */}
        {challenge.challengeType === "one_on_one" && (
          <>
            {/* VS Battle Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="bg-background border-border shadow-sm mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Participant 1 */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "relative",
                        challenge.winnerId === challenge.participant1Id && "ring-4 ring-accent-sage ring-offset-2 rounded-full"
                      )}>
                        <Avatar className="w-16 h-16 border-4 border-accent-blue">
                          <AvatarImage src={challenge.participant1Avatar} />
                          <AvatarFallback className="bg-accent-blue/10 text-accent-blue text-xl font-semibold">
                            {challenge.participant1Name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {challenge.winnerId === challenge.participant1Id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-sage flex items-center justify-center">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-foreground">{challenge.participant1Name || "TBD"}</div>
                        {["voting", "completed", "draw"].includes(challenge.status) && (
                          <div className="text-sm text-muted-foreground">{challenge.participant1Votes || 0} votes</div>
                        )}
                      </div>
                    </div>

                    {/* VS Badge */}
                    <div className="flex-shrink-0 flex flex-col items-center px-8">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-blue via-purple-500 to-accent-peach flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold text-white">VS</span>
                      </div>
                    </div>

                    {/* Participant 2 */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-foreground">{challenge.participant2Name || "TBD"}</div>
                        {["voting", "completed", "draw"].includes(challenge.status) && (
                          <div className="text-sm text-muted-foreground">{challenge.participant2Votes || 0} votes</div>
                        )}
                      </div>
                      <div className={cn(
                        "relative",
                        challenge.winnerId === challenge.participant2Id && "ring-4 ring-accent-sage ring-offset-2 rounded-full"
                      )}>
                        <Avatar className="w-16 h-16 border-4 border-purple-500">
                          <AvatarImage src={challenge.participant2Avatar} />
                          <AvatarFallback className="bg-purple-500/10 text-purple-600 text-xl font-semibold">
                            {challenge.participant2Name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {challenge.winnerId === challenge.participant2Id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-sage flex items-center justify-center">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vote Progress Bar */}
                  {["voting", "completed", "draw"].includes(challenge.status) && totalVotes > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className={cn(
                          "font-semibold",
                          challenge.winnerId === challenge.participant1Id ? "text-accent-sage" : "text-accent-blue"
                        )}>
                          {p1Percentage}%
                        </span>
                        <span className="text-muted-foreground">{totalVotes} total votes</span>
                        <span className={cn(
                          "font-semibold",
                          challenge.winnerId === challenge.participant2Id ? "text-accent-sage" : "text-purple-500"
                        )}>
                          {p2Percentage}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden bg-muted">
                        <div className="h-full flex">
                          <motion.div
                            className={cn(
                              "transition-all",
                              challenge.winnerId === challenge.participant1Id
                                ? "bg-accent-sage"
                                : "bg-gradient-to-r from-accent-blue to-cyan-400"
                            )}
                            initial={{ width: "50%" }}
                            animate={{ width: `${p1Percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                          <motion.div
                            className={cn(
                              "transition-all",
                              challenge.winnerId === challenge.participant2Id
                                ? "bg-accent-sage"
                                : "bg-gradient-to-l from-purple-500 to-violet-400"
                            )}
                            initial={{ width: "50%" }}
                            animate={{ width: `${p2Percentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Entries Grid for 1v1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Participant 1 Entry */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
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
              </motion.div>

              {/* Participant 2 Entry */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
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
                  color="purple"
                />
              </motion.div>
            </div>
          </>
        )}

        {/* Category Challenge View */}
        {challenge.challengeType === "category" && (
          <>
            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="bg-background border-border shadow-sm mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{challenge.totalEntries}</div>
                        <div className="text-sm text-muted-foreground">Entries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{challenge.totalVotes}</div>
                        <div className="text-sm text-muted-foreground">Votes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent-peach">{challenge.maxWinners}</div>
                        <div className="text-sm text-muted-foreground">Winners</div>
                      </div>
                      {challenge.winnerKarmaReward && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent-sage">+{challenge.winnerKarmaReward}</div>
                          <div className="text-sm text-muted-foreground">Karma</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {canJoin && (
                        <Button
                          className="bg-gradient-to-r from-accent-blue to-cyan-500 hover:opacity-90 text-white"
                          onClick={() => setShowJoinConfirm(true)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Join Challenge
                        </Button>
                      )}

                      {isParticipant && challenge.status === "active" && !challenge.currentUserEntry && (
                        <Button
                          className="bg-accent-blue hover:bg-accent-blue/90 text-white"
                          onClick={() => setShowEntryForm(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Entry
                        </Button>
                      )}

                      {canSubmitEntry && (
                        <Button
                          className="bg-accent-sage hover:bg-accent-sage/90 text-white"
                          onClick={handleSubmitEntry}
                          disabled={submitting}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {submitting ? "Submitting..." : "Submit Entry"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Prize Description */}
                  {challenge.prizeDescription && (
                    <div className="mt-4 p-4 rounded-xl bg-accent-peach/5 border border-accent-peach/20">
                      <div className="flex items-center gap-2 text-accent-peach font-medium">
                        <Trophy className="w-4 h-4" />
                        Prize: {challenge.prizeDescription}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Entries Grid for Category */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {challenge.status === "voting" ? "Vote for Your Favorite" : "Entries"}
              </h2>

              {challenge.entries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenge.entries.map((entry, index) => {
                    const isTopEntry = voteStats?.topEntries?.some((t) => t.entryId === entry.id);

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card
                          className={cn(
                            "bg-background border-border shadow-sm transition-all hover:shadow-md",
                            canVote && "cursor-pointer hover:border-accent-blue/50",
                            selectedEntry === entry.id && "ring-2 ring-accent-blue",
                            challenge.currentUserVoteEntryId === entry.id && "ring-2 ring-accent-sage"
                          )}
                          onClick={canVote ? () => setSelectedEntry(entry.id) : undefined}
                        >
                          <CardContent className="p-4">
                            {/* User Info */}
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="w-8 h-8 border border-border">
                                <AvatarImage src={entry.userAvatar} />
                                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                  {entry.userName?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{entry.userName}</div>
                              </div>
                              {isTopEntry && (
                                <Trophy className="w-4 h-4 text-accent-peach" />
                              )}
                            </div>

                            {/* Entry Content */}
                            <h4 className="font-medium text-foreground mb-2">{entry.title}</h4>
                            {entry.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{entry.description}</p>
                            )}

                            {/* Vote Count (if voting) */}
                            {challenge.status === "voting" && (
                              <div className="flex items-center justify-between pt-3 border-t border-border">
                                <span className="text-sm text-muted-foreground">{entry.voteCount} votes</span>
                                {canVote && (
                                  <span className={cn(
                                    "text-sm font-medium",
                                    selectedEntry === entry.id ? "text-accent-blue" : "text-muted-foreground"
                                  )}>
                                    {selectedEntry === entry.id ? "Selected" : "Click to select"}
                                  </span>
                                )}
                                {challenge.currentUserVoteEntryId === entry.id && (
                                  <Badge className="bg-accent-sage text-white text-xs border-0">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Your Vote
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-background border-border shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Entries Yet</h3>
                    <p className="text-muted-foreground">Be the first to submit an entry!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Vote Button */}
        {canVote && selectedEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent"
          >
            <div className="container mx-auto max-w-md">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-accent-blue to-cyan-500 hover:opacity-90 text-white shadow-lg"
                onClick={() => setShowVoteConfirm(true)}
              >
                <Vote className="w-5 h-5 mr-2" />
                Confirm Vote
              </Button>
            </div>
          </motion.div>
        )}

        {/* Already Voted Message */}
        {challenge.currentUserVoted && (
          <Card className="bg-accent-sage/10 border-accent-sage/20 shadow-sm">
            <CardContent className="flex items-center justify-center gap-3 py-4">
              <CheckCircle className="w-5 h-5 text-accent-sage" />
              <span className="text-accent-sage font-medium">You've voted in this challenge!</span>
            </CardContent>
          </Card>
        )}

        {/* Participant Message */}
        {isParticipant && challenge.status === "voting" && (
          <Card className="bg-accent-blue/10 border-accent-blue/20 shadow-sm">
            <CardContent className="flex items-center justify-center gap-3 py-4">
              <Award className="w-5 h-5 text-accent-blue" />
              <span className="text-accent-blue font-medium">You're a participant - let the community decide!</span>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vote Confirmation Dialog */}
      <Dialog open={showVoteConfirm} onOpenChange={setShowVoteConfirm}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Your Vote</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Your vote is final and cannot be changed. Make sure you've reviewed all entries carefully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowVoteConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent-blue hover:bg-accent-blue/90 text-white"
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
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Join Challenge</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You're about to join this challenge. Once joined, you'll be able to create and submit your entry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowJoinConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent-blue hover:bg-accent-blue/90 text-white"
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
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Your Entry</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the details for your challenge entry. You can edit this before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="entryTitle" className="text-foreground">Title</Label>
              <Input
                id="entryTitle"
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="Give your entry a title"
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <Label htmlFor="entryDescription" className="text-foreground">Description (optional)</Label>
              <Textarea
                id="entryDescription"
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
                placeholder="Describe your entry..."
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEntryForm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent-blue hover:bg-accent-blue/90 text-white"
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
  color: "blue" | "purple";
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
      border: "border-t-accent-blue",
      ring: "ring-accent-blue",
      bg: "bg-accent-blue/10",
      text: "text-accent-blue",
      avatar: "border-accent-blue",
    },
    purple: {
      border: "border-t-purple-500",
      ring: "ring-purple-500",
      bg: "bg-purple-50",
      text: "text-purple-600",
      avatar: "border-purple-500",
    },
  };

  const colors = colorClasses[color];

  // Blind mode - hide content
  if (isBlind && entry) {
    return (
      <Card className={cn("bg-background border-border shadow-sm border-t-4", colors.border)}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Entry Hidden</h3>
          <p className="text-muted-foreground text-sm">
            Entries are hidden until both participants submit their work.
          </p>
        </CardContent>
      </Card>
    );
  }

  // No entry yet
  if (!entry) {
    return (
      <Card className={cn("bg-background border-border shadow-sm border-t-4", colors.border)}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Avatar className={cn("w-16 h-16 mb-4 border-4", colors.avatar)}>
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className={cn(colors.bg, colors.text, "text-xl font-semibold")}>
              {participant[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-medium text-foreground mb-2">{participant}</h3>
          <p className="text-muted-foreground text-sm">Waiting for submission...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-background border-border shadow-sm transition-all relative border-t-4",
        colors.border,
        canVote && "cursor-pointer hover:shadow-lg hover:border-border",
        isSelected && "ring-2",
        isSelected && colors.ring,
        userVotedFor && "ring-2 ring-accent-sage"
      )}
      onClick={canVote ? onSelect : undefined}
    >
      {/* Winner Badge */}
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-accent-sage text-white border-0 shadow-md">
            <Crown className="w-3 h-3 mr-1" />
            Winner
          </Badge>
        </div>
      )}

      {/* User Voted Badge */}
      {userVotedFor && (
        <div className="absolute -top-3 right-4 z-10">
          <Badge className="bg-accent-sage text-white border-0 shadow-md">
            <CheckCircle className="w-3 h-3 mr-1" />
            Your Vote
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className={cn("w-10 h-10 border-2", colors.avatar)}>
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className={cn(colors.bg, colors.text, "font-semibold")}>
              {participant[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base text-foreground">{participant}</CardTitle>
            {entry.submittedAt && (
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(entry.submittedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <h3 className="text-lg font-semibold text-foreground mb-2">{entry.title}</h3>

        {entry.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{entry.description}</p>
        )}

        {/* Thumbnail */}
        {entry.thumbnailUrl && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-muted">
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
            <h4 className="text-sm font-medium text-muted-foreground">Files</h4>
            {entry.fileUrls.map((file, i) => (
              <a
                key={i}
                href={getFileUrl(file.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted text-sm text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="truncate flex-1">{file.filename}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        {/* External Links */}
        {entry.externalLinks && entry.externalLinks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Links</h4>
            {entry.externalLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted text-sm text-accent-blue transition-colors"
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
            "mt-4 p-3 rounded-xl border-2 border-dashed transition-colors text-center",
            isSelected ? colors.border.replace("border-t-", "border-") : "border-border",
            isSelected ? colors.text : "text-muted-foreground"
          )}>
            {isSelected ? (
              <span className="flex items-center justify-center gap-2 font-medium">
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
