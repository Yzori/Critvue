"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChallenges,
  getActiveChallenges,
  getChallengePrompts,
  getMyStats,
  getLeaderboard,
  getMyInvitations,
  Challenge,
  ChallengePrompt,
  ChallengeStats,
  ChallengeLeaderboardEntry,
  ChallengeInvitation,
  ContentType,
  ChallengeType,
  getContentTypeInfo,
  getChallengeTypeInfo,
  getChallengeStatusInfo,
  getTimeRemaining,
} from "@/lib/api/challenges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Users,
  Clock,
  Flame,
  Target,
  ChevronRight,
  Palette,
  Code,
  Video,
  FileText,
  Brush,
  Headphones,
  Radio,
  Zap,
  Crown,
  Medal,
  Star,
  Bell,
  Sparkles,
  Award,
} from "lucide-react";

// Content type icons mapping
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
 * Challenges Hub Page
 *
 * Features:
 * - Pending invitations banner (1v1 challenges)
 * - Active challenges grid (voting phase)
 * - Open category challenges
 * - Featured prompts
 * - User challenge stats
 * - Mini leaderboard
 */
export default function ChallengesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // State
  const [activeChallenges, setActiveChallenges] = React.useState<Challenge[]>([]);
  const [openChallenges, setOpenChallenges] = React.useState<Challenge[]>([]);
  const [prompts, setPrompts] = React.useState<ChallengePrompt[]>([]);
  const [myStats, setMyStats] = React.useState<ChallengeStats | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<ChallengeLeaderboardEntry[]>([]);
  const [pendingInvitations, setPendingInvitations] = React.useState<ChallengeInvitation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedContentType, setSelectedContentType] = React.useState<ContentType | null>(null);
  const [activeTab, setActiveTab] = React.useState<"all" | "1v1" | "category">("all");

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch active challenges (voting phase)
        const active = await getActiveChallenges(selectedContentType || undefined, 6);
        setActiveChallenges(active);

        // Fetch open category challenges
        const openResponse = await getChallenges("open", "category", selectedContentType || undefined, undefined, 0, 6);
        setOpenChallenges(openResponse.items);

        // Fetch prompts
        const promptsResponse = await getChallengePrompts(undefined, 8);
        setPrompts(promptsResponse.items);

        // Fetch leaderboard
        const leaderboardResponse = await getLeaderboard(5);
        setLeaderboard(leaderboardResponse.entries);

        // Fetch user-specific data if authenticated
        if (isAuthenticated && !authLoading) {
          try {
            const stats = await getMyStats();
            setMyStats(stats);
          } catch {
            // User might not have challenge stats yet
          }

          try {
            const invitations = await getMyInvitations();
            setPendingInvitations(invitations);
          } catch {
            // No pending invitations
          }
        }
      } catch (error) {
        console.error("Error fetching challenges data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, selectedContentType]);

  // Handle content type filter
  const handleContentTypeSelect = (contentType: ContentType) => {
    setSelectedContentType(contentType === selectedContentType ? null : contentType);
  };

  // Filter challenges by type
  const filteredActiveChallenges = activeTab === "all"
    ? activeChallenges
    : activeChallenges.filter((c) => c.challengeType === (activeTab === "1v1" ? "one_on_one" : "category"));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-orange-500/10 to-transparent rounded-full blur-3xl" />

        <div className="container mx-auto px-4 pt-8 pb-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Platform Challenges</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Creative <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Challenges</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Compete in platform-curated challenges. Show off your skills in 1v1 creator challenges or open competitions, and climb the leaderboard.
            </p>
          </div>

          {/* Content Type Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {(["design", "code", "video", "audio", "writing", "art"] as ContentType[]).map((type) => {
              const Icon = contentTypeIcons[type];
              const info = getContentTypeInfo(type);
              const isSelected = selectedContentType === type;

              return (
                <button
                  key={type}
                  onClick={() => handleContentTypeSelect(type)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                    isSelected
                      ? "bg-purple-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pending Invitations Banner */}
      {pendingInvitations.length > 0 && (
        <section className="container mx-auto px-4 mb-8">
          <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <Bell className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      You have {pendingInvitations.length} pending challenge invitation{pendingInvitations.length > 1 ? "s" : ""}!
                    </h3>
                    <p className="text-sm text-gray-400">
                      You've been selected to compete in a 1v1 challenge. Respond before the invitation expires.
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => router.push("/challenges/invitations")}
                >
                  View Invitations
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Challenges */}
          <div className="lg:col-span-2 space-y-8">
            {/* Challenge Type Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-white/5">
                  <TabsTrigger value="all" className="data-[state=active]:bg-purple-500">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="1v1" className="data-[state=active]:bg-purple-500">
                    1v1 Challenges
                  </TabsTrigger>
                  <TabsTrigger value="category" className="data-[state=active]:bg-purple-500">
                    Competitions
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Active Challenges - Voting Now */}
              <TabsContent value={activeTab} className="mt-0">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Vote Now</h2>
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                        {filteredActiveChallenges.length} Active
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="bg-white/5 border-white/10">
                          <CardContent className="p-4">
                            <Skeleton className="h-32 w-full mb-4" />
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredActiveChallenges.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredActiveChallenges.map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          onClick={() => router.push(`/challenges/${challenge.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Zap className="w-12 h-12 text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No Active Challenges</h3>
                        <p className="text-gray-400 mb-4">Check back soon for new challenges to vote on!</p>
                      </CardContent>
                    </Card>
                  )}
                </section>
              </TabsContent>
            </Tabs>

            {/* Open Category Challenges */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Open Competitions</h2>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                    Join Now
                  </Badge>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : openChallenges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {openChallenges.map((challenge) => (
                    <OpenChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClick={() => router.push(`/challenges/${challenge.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Open Competitions</h3>
                    <p className="text-gray-400">New competitions will be announced soon!</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Featured Prompts */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10">
                    <Target className="w-5 h-5 text-pink-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Challenge Themes</h2>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {prompts.slice(0, 8).map((prompt) => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Stats & Leaderboard */}
          <div className="space-y-6">
            {/* User Stats */}
            {isAuthenticated && myStats && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Your Challenge Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <StatItem label="Wins" value={myStats.challengesWon} icon={Crown} color="text-yellow-400" />
                    <StatItem label="Win Rate" value={`${myStats.winRate}%`} icon={Target} color="text-green-400" />
                    <StatItem label="Streak" value={myStats.currentStreak} icon={Flame} color="text-orange-400" />
                    <StatItem label="Best Streak" value={myStats.bestStreak} icon={Star} color="text-purple-400" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                    onClick={() => router.push("/profile?tab=challenges")}
                  >
                    View Full Stats
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Medal className="w-5 h-5 text-orange-400" />
                  Top Challengers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry) => (
                      <LeaderboardRow key={entry.userId} entry={entry} />
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full mt-4 text-gray-400 hover:text-white"
                  onClick={() => router.push("/leaderboard?mode=challenges")}
                >
                  View Full Leaderboard <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">How Challenges Work</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Award className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">1v1 Challenges</h4>
                      <p className="text-xs text-gray-400">Platform selects two creators to compete head-to-head</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Open Competitions</h4>
                      <p className="text-xs text-gray-400">Anyone can join and compete for top spots</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Trophy className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Earn Karma</h4>
                      <p className="text-xs text-gray-400">Winners receive karma rewards and climb the leaderboard</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

function ChallengeCard({ challenge, onClick }: { challenge: Challenge; onClick: () => void }) {
  const timeRemaining = challenge.votingDeadline ? getTimeRemaining(challenge.votingDeadline) : null;
  const contentInfo = getContentTypeInfo(challenge.contentType);
  const typeInfo = getChallengeTypeInfo(challenge.challengeType);
  const Icon = contentTypeIcons[challenge.contentType];

  return (
    <Card
      className="bg-white/5 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", contentInfo.color, "bg-white/10")}>
              <Icon className="w-3 h-3 mr-1" />
              {contentInfo.label}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
              {typeInfo.label}
            </Badge>
          </div>
          {timeRemaining && !timeRemaining.isExpired && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {timeRemaining.days > 0
                ? `${timeRemaining.days}d ${timeRemaining.hours}h`
                : `${timeRemaining.hours}h ${timeRemaining.minutes}m`}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors">
          {challenge.title}
        </h3>

        {/* 1v1 Participants */}
        {challenge.challengeType === "one_on_one" && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border-2 border-blue-500">
                <AvatarImage src={challenge.participant1Avatar} />
                <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                  {challenge.participant1Name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-400">vs</span>
              <Avatar className="w-8 h-8 border-2 border-red-500">
                <AvatarImage src={challenge.participant2Avatar} />
                <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                  {challenge.participant2Name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">{challenge.totalVotes}</div>
              <div className="text-xs text-gray-500">votes</div>
            </div>
          </div>
        )}

        {/* Category Challenge Stats */}
        {challenge.challengeType === "category" && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              {challenge.totalEntries} entries
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">{challenge.totalVotes}</div>
              <div className="text-xs text-gray-500">votes</div>
            </div>
          </div>
        )}

        {/* Vote CTA */}
        <Button size="sm" className="w-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
          <Zap className="w-4 h-4 mr-2" />
          Cast Your Vote
        </Button>
      </CardContent>
    </Card>
  );
}

function OpenChallengeCard({ challenge, onClick }: { challenge: Challenge; onClick: () => void }) {
  const timeRemaining = challenge.submissionDeadline ? getTimeRemaining(challenge.submissionDeadline) : null;
  const contentInfo = getContentTypeInfo(challenge.contentType);
  const Icon = contentTypeIcons[challenge.contentType];

  return (
    <Card
      className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:border-blue-400/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className={cn("text-xs", contentInfo.color, "bg-white/10")}>
            <Icon className="w-3 h-3 mr-1" />
            {contentInfo.label}
          </Badge>
          {challenge.isFeatured && (
            <Badge className="bg-yellow-500 text-black text-xs">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {challenge.title}
        </h3>
        {challenge.description && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{challenge.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {challenge.totalEntries} entries
            </span>
            {timeRemaining && !timeRemaining.isExpired && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {timeRemaining.days > 0
                  ? `${timeRemaining.days}d left`
                  : `${timeRemaining.hours}h left`}
              </span>
            )}
          </div>
          {challenge.maxWinners > 1 && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 text-xs">
              Top {challenge.maxWinners} win
            </Badge>
          )}
        </div>

        {/* Join CTA */}
        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
          <Users className="w-4 h-4 mr-2" />
          Join Competition
        </Button>
      </CardContent>
    </Card>
  );
}

function PromptCard({ prompt }: { prompt: ChallengePrompt }) {
  const Icon = contentTypeIcons[prompt.contentType];
  const info = getContentTypeInfo(prompt.contentType);

  return (
    <Card className="bg-white/5 border-white/10 hover:border-pink-500/50 transition-all cursor-pointer group">
      <CardContent className="p-4">
        <div className={cn("p-2 rounded-lg w-fit mb-3", "bg-white/5")}>
          <Icon className={cn("w-5 h-5", info.color)} />
        </div>
        <h4 className="font-medium text-white text-sm mb-1 line-clamp-2 group-hover:text-pink-400 transition-colors">
          {prompt.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Badge variant="neutral" className="text-[10px] px-1.5 py-0 bg-transparent border border-white/10">
            {prompt.difficulty}
          </Badge>
          <span>{prompt.timesUsed} uses</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-white/5">
      <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: ChallengeLeaderboardEntry }) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-gray-500">{rank}</span>;
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className="w-6 flex justify-center">{getRankIcon(entry.rank)}</div>
      <Avatar className="w-8 h-8">
        <AvatarImage src={entry.userAvatar} />
        <AvatarFallback className="bg-white/10 text-white text-xs">
          {entry.userName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{entry.userName}</div>
        <div className="text-xs text-gray-500">{entry.challengesWon} wins</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-green-400">{entry.winRate}%</div>
      </div>
    </div>
  );
}
