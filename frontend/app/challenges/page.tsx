"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveChallenges,
  getChallenges,
  getLeaderboard,
  getMyStats,
  getMyInvitations,
  getOpenSlotChallenges,
  claimChallengeSlot,
  Challenge,
  ChallengeStats,
  ChallengeLeaderboardEntry,
  ChallengeInvitation,
  OpenSlotChallenge,
  getTimeRemaining,
} from "@/lib/api/challenges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Battle1v1Card,
  Battle1v1CardCompact,
  OpenChallengeCard,
  OpenChallengeCardCompact,
} from "@/components/challenges";
import {
  Swords,
  Users,
  Trophy,
  Crown,
  Medal,
  Star,
  Target,
  Flame,
  Bell,
  ChevronRight,
  Zap,
  TrendingUp,
  Filter,
  ArrowRight,
  Unlock,
  Clock,
  UserPlus,
} from "lucide-react";

// ==================== MOCK DATA ====================
const USE_MOCK_DATA = true;

const mock1v1Battles: Challenge[] = [
  {
    id: 1,
    title: "Cyberpunk UI Battle",
    description: "Design a futuristic dashboard interface with neon aesthetics",
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
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
  {
    id: 2,
    title: "Algorithm Showdown",
    description: "Implement the most elegant sorting visualization",
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
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
  {
    id: 3,
    title: "Motion Magic",
    description: "Create a mesmerizing loading animation",
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
    entries: [],
    invitations: [],
    currentUserVoted: false,
    currentUserIsParticipant: false,
  },
];

const mockOpenChallenges: Challenge[] = [
  {
    id: 101,
    title: "Mobile App Redesign Sprint",
    description: "Reimagine a popular app's user experience with fresh, modern design principles.",
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
  {
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
  {
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
  {
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
];

// Mock open slots 1v1 challenges
const mockOpenSlots: OpenSlotChallenge[] = [
  {
    id: 201,
    title: "Brand Identity Duel",
    description: "Create a complete brand identity for a fictional startup",
    contentType: "design",
    availableSlots: 2,
    slotsCloseAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    submissionHours: 48,
    votingHours: 24,
    winnerKarmaReward: 75,
    isFeatured: true,
  },
  {
    id: 202,
    title: "CLI Tool Showdown",
    description: "Build a useful CLI tool in any language",
    contentType: "code",
    availableSlots: 1,
    slotsCloseAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    submissionHours: 72,
    votingHours: 48,
    winnerKarmaReward: 100,
    isFeatured: false,
    participant1Id: 5,
    participant1Name: "AnimateX",
    participant1Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnimateX",
  },
];

const mockLeaderboard: ChallengeLeaderboardEntry[] = [
  { rank: 1, userId: 1, userName: "PixelMaster", userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PixelMaster", challengesWon: 15, winRate: 78, bestStreak: 7 },
  { rank: 2, userId: 3, userName: "CodeNinja", userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CodeNinja", challengesWon: 12, winRate: 72, bestStreak: 5 },
  { rank: 3, userId: 5, userName: "AnimateX", userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnimateX", challengesWon: 10, winRate: 67, bestStreak: 4 },
  { rank: 4, userId: 2, userName: "NeonDreamer", userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NeonDreamer", challengesWon: 8, winRate: 62, bestStreak: 3 },
  { rank: 5, userId: 7, userName: "TypeLord", userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TypeLord", challengesWon: 6, winRate: 55, bestStreak: 2 },
];

const mockStats: ChallengeStats = {
  challengesWon: 8,
  challengesLost: 4,
  challengesDrawn: 1,
  totalChallenges: 13,
  winRate: 62,
  currentStreak: 3,
  bestStreak: 5,
  totalVotesReceived: 234,
  totalVotesCast: 47,
  categoryParticipations: 6,
};

// ==================== END MOCK DATA ====================

export default function ChallengesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [battles, setBattles] = useState<Challenge[]>([]);
  const [openChallenges, setOpenChallenges] = useState<Challenge[]>([]);
  const [openSlotChallenges, setOpenSlotChallenges] = useState<OpenSlotChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<ChallengeStats | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<ChallengeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingSlot, setClaimingSlot] = useState<number | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (USE_MOCK_DATA) {
          await new Promise((r) => setTimeout(r, 300));
          setBattles(mock1v1Battles);
          setOpenChallenges(mockOpenChallenges);
          setOpenSlotChallenges(mockOpenSlots);
          setLeaderboard(mockLeaderboard);
          setMyStats(mockStats);
          setLoading(false);
          return;
        }

        const [activeBattles, openResponse, openSlots, leaderboardData] = await Promise.all([
          getActiveChallenges(undefined, 10),
          getChallenges("open", "category", undefined, undefined, 0, 10),
          getOpenSlotChallenges(undefined, 10),
          getLeaderboard(5),
        ]);

        setBattles(activeBattles.filter((c) => c.challengeType === "one_on_one"));
        setOpenChallenges(openResponse.items);
        setOpenSlotChallenges(openSlots);
        setLeaderboard(leaderboardData.entries);

        if (isAuthenticated && !authLoading) {
          try {
            const [stats, invitations] = await Promise.all([
              getMyStats().catch(() => null),
              getMyInvitations().catch(() => []),
            ]);
            setMyStats(stats);
            setPendingInvitations(invitations);
          } catch {
            // Ignore errors
          }
        }
      } catch (error) {
        console.error("Error fetching challenges:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [isAuthenticated, authLoading]);

  // Handle claiming a slot
  const handleClaimSlot = async (challengeId: number) => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/challenges");
      return;
    }

    try {
      setClaimingSlot(challengeId);
      const result = await claimChallengeSlot(challengeId);

      if (result.challengeActivated) {
        // Challenge is now active, redirect to it
        router.push(`/challenges/${challengeId}`);
      } else {
        // Refresh the open slots list
        if (!USE_MOCK_DATA) {
          const newOpenSlots = await getOpenSlotChallenges(undefined, 10);
          setOpenSlotChallenges(newOpenSlots);
        } else {
          // For mock data, just update the state
          setOpenSlotChallenges((prev) =>
            prev.map((c) =>
              c.id === challengeId
                ? { ...c, availableSlots: c.availableSlots - 1 }
                : c
            ).filter((c) => c.availableSlots > 0)
          );
        }
      }
    } catch (error) {
      console.error("Error claiming slot:", error);
    } finally {
      setClaimingSlot(null);
    }
  };

  const getTimeLeft = (deadline?: string) => {
    if (!deadline) return undefined;
    const t = getTimeRemaining(deadline);
    if (t.isExpired) return undefined;
    if (t.days > 0) return `${t.days}d ${t.hours}h`;
    if (t.hours > 0) return `${t.hours}h ${t.minutes}m`;
    return `${t.minutes}m`;
  };

  const featured1v1 = battles.find((b) => b.isFeatured) || battles[0];
  const otherBattles = battles.filter((b) => b.id !== featured1v1?.id);

  const featuredOpen = openChallenges.find((c) => c.isFeatured) || openChallenges[0];
  const otherOpen = openChallenges.filter((c) => c.id !== featuredOpen?.id);

  return (
    <div className="min-h-screen bg-[var(--background-subtle)]">
      {/* Hero Section */}
      <section className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-3"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-accent-blue to-purple-500">
                  <Swords className="w-5 h-5 text-white" />
                </div>
                <Badge variant="secondary" className="bg-accent-blue/10 text-accent-blue border-0">
                  Battle Arena
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold text-foreground mb-2"
              >
                Creative{" "}
                <span className="bg-gradient-to-r from-accent-blue via-purple-500 to-accent-peach bg-clip-text text-transparent">
                  Challenges
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground max-w-xl"
              >
                Compete in 1v1 battles selected by the platform or join open community challenges.
                Prove your skills and climb the leaderboard.
              </motion.p>
            </div>

            {/* Quick Stats */}
            {(USE_MOCK_DATA || isAuthenticated) && myStats && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-6 p-4 rounded-2xl bg-muted border border-border"
              >
                <StatItem
                  icon={Trophy}
                  value={myStats.challengesWon}
                  label="Wins"
                  color="text-accent-peach"
                />
                <div className="w-px h-10 bg-muted" />
                <StatItem
                  icon={Target}
                  value={`${myStats.winRate}%`}
                  label="Win Rate"
                  color="text-accent-sage"
                />
                <div className="w-px h-10 bg-muted" />
                <StatItem
                  icon={Flame}
                  value={myStats.currentStreak}
                  label="Streak"
                  color="text-accent-blue"
                />
              </motion.div>
            )}

          </div>
        </div>
      </section>

      {/* Pending Invitations Banner */}
      <AnimatePresence>
        {pendingInvitations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="bg-gradient-to-r from-accent-peach/10 to-orange-500/10 border-b border-accent-peach/20"
          >
            <div className="container mx-auto px-4 py-4 max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-accent-peach/20">
                    <Bell className="w-5 h-5 text-accent-peach" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      You have {pendingInvitations.length} battle invitation{pendingInvitations.length > 1 ? "s" : ""}!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You've been selected for a 1v1 showdown
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-accent-peach hover:bg-accent-peach/90 text-white"
                  onClick={() => router.push("/challenges/invitations")}
                >
                  View Invitations
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* 1v1 Battles Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent-blue/10">
                    <Swords className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Live 1v1 Battles</h2>
                    <p className="text-sm text-muted-foreground">Platform-selected matchups</p>
                  </div>
                </div>
                <Badge className="bg-accent-sage/10 text-accent-sage border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-sage animate-pulse mr-1.5" />
                  {battles.length} Active
                </Badge>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-64 rounded-2xl bg-background animate-pulse" />
                  ))}
                </div>
              ) : battles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {battles.slice(0, 4).map((battle) => (
                    <Battle1v1Card
                      key={battle.id}
                      id={battle.id}
                      title={battle.title}
                      description={battle.description}
                      contentType={battle.contentType}
                      status={battle.status as "voting" | "completed" | "draw"}
                      participant1={{
                        id: battle.participant1Id || 0,
                        name: battle.participant1Name || "Challenger",
                        avatar: battle.participant1Avatar,
                        votes: battle.participant1Votes,
                      }}
                      participant2={{
                        id: battle.participant2Id || 0,
                        name: battle.participant2Name || "Challenger",
                        avatar: battle.participant2Avatar,
                        votes: battle.participant2Votes,
                      }}
                      totalVotes={battle.totalVotes}
                      timeLeft={getTimeLeft(battle.votingDeadline)}
                      winnerId={battle.winnerId}
                      isFeatured={battle.isFeatured}
                      userHasVoted={battle.currentUserVoted}
                      onClick={() => router.push(`/challenges/${battle.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-background rounded-2xl border border-border">
                  <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Active Battles</h3>
                  <p className="text-muted-foreground">Check back soon for new 1v1 matchups!</p>
                </div>
              )}
            </section>

            {/* Looking for Opponents Section - Open Slots 1v1s */}
            {openSlotChallenges.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent-sage/10">
                      <Unlock className="w-5 h-5 text-accent-sage" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Looking for Opponents</h2>
                      <p className="text-sm text-muted-foreground">Claim a spot in these 1v1 battles</p>
                    </div>
                  </div>
                  <Badge className="bg-accent-sage/10 text-accent-sage border-0">
                    {openSlotChallenges.length} Available
                  </Badge>
                </div>

                <div className="space-y-3">
                  {openSlotChallenges.map((challenge) => {
                    const timeLeft = getTimeLeft(challenge.slotsCloseAt);
                    const contentTypeLabels: Record<string, string> = {
                      design: "Design",
                      code: "Code",
                      video: "Video",
                      audio: "Audio",
                      writing: "Writing",
                      art: "Art",
                      stream: "Stream",
                    };

                    return (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-background rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs border-border">
                                {contentTypeLabels[challenge.contentType] || challenge.contentType}
                              </Badge>
                              {challenge.isFeatured && (
                                <Badge className="bg-accent-peach/10 text-accent-peach border-0 text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">{challenge.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{challenge.description}</p>

                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              {timeLeft && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Closes in {timeLeft}</span>
                                </div>
                              )}
                              {challenge.winnerKarmaReward && (
                                <div className="flex items-center gap-1 text-accent-peach">
                                  <Trophy className="w-3.5 h-3.5" />
                                  <span>{challenge.winnerKarmaReward} karma</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {/* Current participants */}
                            <div className="flex items-center gap-1">
                              {challenge.participant1Id ? (
                                <Avatar className="w-8 h-8 border-2 border-accent-sage">
                                  <AvatarImage src={challenge.participant1Avatar} />
                                  <AvatarFallback className="text-xs bg-accent-sage/10 text-accent-sage">
                                    {challenge.participant1Name?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <span className="text-xs text-muted-foreground mx-1">vs</span>
                              <div className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                                <UserPlus className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>

                            <Badge className={cn(
                              "text-xs",
                              challenge.availableSlots === 2
                                ? "bg-accent-sage/10 text-accent-sage"
                                : "bg-accent-blue/10 text-accent-blue"
                            )}>
                              {challenge.availableSlots} slot{challenge.availableSlots !== 1 ? "s" : ""} open
                            </Badge>

                            <Button
                              size="sm"
                              className="bg-accent-sage hover:bg-accent-sage/90 text-white"
                              onClick={() => handleClaimSlot(challenge.id)}
                              disabled={claimingSlot === challenge.id}
                            >
                              {claimingSlot === challenge.id ? (
                                "Claiming..."
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  Claim Spot
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Open Challenges Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent-peach/10">
                    <Users className="w-5 h-5 text-accent-peach" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Open Challenges</h2>
                    <p className="text-sm text-muted-foreground">Community competitions - join now!</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-muted-foreground">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-72 rounded-2xl bg-background animate-pulse" />
                  ))}
                </div>
              ) : openChallenges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {openChallenges.map((challenge) => (
                    <OpenChallengeCard
                      key={challenge.id}
                      id={challenge.id}
                      title={challenge.title}
                      description={challenge.description}
                      contentType={challenge.contentType}
                      status={challenge.status as "open" | "active" | "voting" | "completed"}
                      totalEntries={challenge.totalEntries}
                      maxWinners={challenge.maxWinners || 1}
                      timeLeft={getTimeLeft(challenge.submissionDeadline || challenge.votingDeadline)}
                      timeProgress={50} // Calculate from deadline
                      prizeDescription={challenge.prizeDescription}
                      winnerKarmaReward={challenge.winnerKarmaReward}
                      isFeatured={challenge.isFeatured}
                      userHasJoined={challenge.currentUserIsParticipant}
                      onClick={() => router.push(`/challenges/${challenge.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-background rounded-2xl border border-border">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Open Challenges</h3>
                  <p className="text-muted-foreground">New challenges will be announced soon!</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Leaderboard Card */}
            <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent-peach" />
                  <h3 className="font-bold text-foreground">Top Challengers</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  onClick={() => router.push("/leaderboard?mode=challenges")}
                >
                  View All
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <LeaderboardRow key={entry.userId} entry={entry} rank={index + 1} />
                  ))}
                </div>
              )}
            </div>

            {/* How It Works Card */}
            <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">How It Works</h3>
              <div className="space-y-4">
                <HowItWorksItem
                  icon={Swords}
                  title="1v1 Battles"
                  description="Platform selects creators for head-to-head battles"
                  color="text-accent-blue"
                  bg="bg-accent-blue/10"
                />
                <HowItWorksItem
                  icon={Users}
                  title="Open Challenges"
                  description="Join community-wide competitions freely"
                  color="text-accent-peach"
                  bg="bg-accent-peach/10"
                />
                <HowItWorksItem
                  icon={Trophy}
                  title="Win Karma"
                  description="Winners earn karma and climb the leaderboard"
                  color="text-accent-sage"
                  bg="bg-accent-sage/10"
                />
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-accent-blue to-purple-500 rounded-2xl p-5 text-white">
              <Zap className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">Ready to Compete?</h3>
              <p className="text-sm text-white/80 mb-4">
                Build your portfolio by participating in creative challenges.
              </p>
              <Button
                variant="secondary"
                className="w-full bg-background text-accent-blue hover:bg-background/90"
                onClick={() => router.push("/challenges")}
              >
                Browse All Challenges
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function StatItem({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function LeaderboardRow({ entry, rank }: { entry: ChallengeLeaderboardEntry; rank: number }) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (rank === 2) return { icon: Medal, color: "text-muted-foreground", bg: "bg-muted" };
    if (rank === 3) return { icon: Medal, color: "text-orange-400", bg: "bg-orange-500/10" };
    return { icon: null, color: "text-muted-foreground", bg: "bg-muted" };
  };

  const style = getRankStyle(rank);
  const RankIcon = style.icon;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", style.bg)}>
        {RankIcon ? (
          <RankIcon className={cn("w-4 h-4", style.color)} />
        ) : (
          <span className={cn("text-xs font-bold", style.color)}>{rank}</span>
        )}
      </div>
      <Avatar className="w-8 h-8 border border-border">
        <AvatarImage src={entry.userAvatar} />
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {entry.userName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">{entry.userName}</p>
      </div>
      <div className="text-xs font-medium text-accent-sage">{entry.winRate}%</div>
    </div>
  );
}

function HowItWorksItem({
  icon: Icon,
  title,
  description,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn("p-2 rounded-lg flex-shrink-0", bg)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
