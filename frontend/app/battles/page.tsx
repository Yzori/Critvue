"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveBattles,
  getBattlePrompts,
  getMyBattleStats,
  getBattleLeaderboard,
  Battle,
  BattlePrompt,
  BattleStats,
  BattleLeaderboardEntry,
  ContentType,
  getContentTypeInfo,
  getTimeRemaining,
} from "@/lib/api/battles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Swords,
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
  Plus,
  Zap,
  Crown,
  Medal,
  Star,
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
 * Battles Landing Page
 *
 * Features:
 * - Interactive hero with Competition.png graphic
 * - Hover zones for content type filtering
 * - Active battles grid (voting phase)
 * - Featured prompts carousel
 * - User battle stats
 * - Mini leaderboard
 */
export default function BattlesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [activeBattles, setActiveBattles] = React.useState<Battle[]>([]);
  const [prompts, setPrompts] = React.useState<BattlePrompt[]>([]);
  const [myStats, setMyStats] = React.useState<BattleStats | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<BattleLeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedContentType, setSelectedContentType] = React.useState<ContentType | null>(null);
  const [hoveredZone, setHoveredZone] = React.useState<ContentType | null>(null);

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch active battles
        const battles = await getActiveBattles(selectedContentType || undefined, 6);
        setActiveBattles(battles);

        // Fetch prompts
        const promptsResponse = await getBattlePrompts(undefined, 8);
        setPrompts(promptsResponse.items);

        // Fetch leaderboard
        const leaderboardResponse = await getBattleLeaderboard(5);
        setLeaderboard(leaderboardResponse.entries);

        // Fetch user stats if authenticated
        if (isAuthenticated && !authLoading) {
          try {
            const stats = await getMyBattleStats();
            setMyStats(stats);
          } catch {
            // User might not have battle stats yet
          }
        }
      } catch (error) {
        console.error("Error fetching battles data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, selectedContentType]);

  // Handle content type filter from hero
  const handleContentTypeSelect = (contentType: ContentType) => {
    setSelectedContentType(contentType === selectedContentType ? null : contentType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Hero Section with Interactive Graphic */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-orange-500/10 to-transparent rounded-full blur-3xl" />

        <div className="container mx-auto px-4 pt-8 pb-16">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
              <Swords className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">1v1 Creative Battles</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Prove Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Skills</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Challenge other creators to 1v1 battles. Submit your best work, let the community vote, and climb the leaderboard.
            </p>
          </div>

          {/* Interactive Competition Graphic */}
          <div className="relative max-w-4xl mx-auto mb-8">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="/Competition.png"
                alt="Creative Battles Arena"
                fill
                className="object-cover"
                priority
              />

              {/* Hover Zones Overlay */}
              <div className="absolute inset-0 grid grid-cols-7 gap-1 p-4 opacity-0 hover:opacity-100 transition-opacity">
                {(["design", "code", "video", "stream", "audio", "writing", "art"] as ContentType[]).map((type) => {
                  const Icon = contentTypeIcons[type];
                  const info = getContentTypeInfo(type);
                  const isSelected = selectedContentType === type;
                  const isHovered = hoveredZone === type;

                  return (
                    <button
                      key={type}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-xl transition-all duration-200",
                        "bg-black/0 hover:bg-black/60 backdrop-blur-sm",
                        isSelected && "bg-orange-500/30 ring-2 ring-orange-400",
                        isHovered && !isSelected && "bg-black/40"
                      )}
                      onClick={() => handleContentTypeSelect(type)}
                      onMouseEnter={() => setHoveredZone(type)}
                      onMouseLeave={() => setHoveredZone(null)}
                    >
                      <Icon className={cn("w-8 h-8 mb-2 transition-colors", info.color)} />
                      <span className="text-xs font-medium text-white">{info.label}</span>
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Filter Badge */}
            {selectedContentType && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                <Badge
                  variant="secondary"
                  className="bg-orange-500 text-white px-4 py-1 text-sm cursor-pointer hover:bg-orange-600"
                  onClick={() => setSelectedContentType(null)}
                >
                  Filtering: {getContentTypeInfo(selectedContentType).label} &times;
                </Badge>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8"
              onClick={() => router.push("/battles/create")}
            >
              <Swords className="w-5 h-5 mr-2" />
              Start a Battle
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="border border-white/30 text-white bg-white/5 hover:bg-white/15"
              onClick={() => router.push("/battles/create?mode=queue")}
            >
              <Target className="w-5 h-5 mr-2" />
              Quick Match
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Active Battles */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Battles */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Vote Now</h2>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                    {activeBattles.length} Active
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
              ) : activeBattles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBattles.map((battle) => (
                    <BattleCard key={battle.id} battle={battle} onClick={() => router.push(`/battles/${battle.id}`)} />
                  ))}
                </div>
              ) : (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Swords className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Active Battles</h3>
                    <p className="text-gray-400 mb-4">Be the first to start a battle and get the community voting!</p>
                    <Button onClick={() => router.push("/battles/create")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Battle
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Featured Prompts */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Battle Prompts</h2>
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
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onClick={() => router.push(`/battles/create?prompt=${prompt.id}`)}
                    />
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
                    Your Battle Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <StatItem label="Wins" value={myStats.battlesWon} icon={Crown} color="text-yellow-400" />
                    <StatItem label="Win Rate" value={`${myStats.winRate}%`} icon={Target} color="text-green-400" />
                    <StatItem label="Streak" value={myStats.currentStreak} icon={Flame} color="text-orange-400" />
                    <StatItem label="Best Streak" value={myStats.bestStreak} icon={Star} color="text-purple-400" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                    onClick={() => router.push("/battles/my")}
                  >
                    View My Battles
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Medal className="w-5 h-5 text-orange-400" />
                  Top Battlers
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
                  onClick={() => router.push("/leaderboard?mode=battles")}
                >
                  View Full Leaderboard <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Ready to Battle?</h3>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => router.push("/battles/create")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Battle
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    onClick={() => router.push("/battles/queue")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Quick Match
                  </Button>
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

function BattleCard({ battle, onClick }: { battle: Battle; onClick: () => void }) {
  const timeRemaining = battle.votingDeadline ? getTimeRemaining(battle.votingDeadline) : null;
  const contentInfo = getContentTypeInfo(battle.contentType);
  const Icon = contentTypeIcons[battle.contentType];

  return (
    <Card
      className="bg-white/5 border-white/10 hover:border-orange-500/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Badge variant="secondary" className={cn("text-xs", contentInfo.color, "bg-white/10")}>
            <Icon className="w-3 h-3 mr-1" />
            {contentInfo.label}
          </Badge>
          {timeRemaining && !timeRemaining.isExpired && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {timeRemaining.formatted}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-white mb-3 line-clamp-2 group-hover:text-orange-400 transition-colors">
          {battle.title}
        </h3>

        {/* Participants */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-blue-500">
              <AvatarImage src={battle.creatorAvatar} />
              <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                {battle.creatorName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-400">vs</span>
            <Avatar className="w-8 h-8 border-2 border-red-500">
              <AvatarImage src={battle.opponentAvatar} />
              <AvatarFallback className="bg-red-500/20 text-red-400 text-xs">
                {battle.opponentName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-white">{battle.totalVotes}</div>
            <div className="text-xs text-gray-500">votes</div>
          </div>
        </div>

        {/* Vote CTA */}
        <Button size="sm" className="w-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
          <Zap className="w-4 h-4 mr-2" />
          Cast Your Vote
        </Button>
      </CardContent>
    </Card>
  );
}

function PromptCard({ prompt, onClick }: { prompt: BattlePrompt; onClick: () => void }) {
  const Icon = contentTypeIcons[prompt.contentType];
  const info = getContentTypeInfo(prompt.contentType);

  return (
    <Card
      className="bg-white/5 border-white/10 hover:border-blue-500/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className={cn("p-2 rounded-lg w-fit mb-3", "bg-white/5")}>
          <Icon className={cn("w-5 h-5", info.color)} />
        </div>
        <h4 className="font-medium text-white text-sm mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {prompt.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Badge variant="neutral" className="text-[10px] px-1.5 py-0 bg-transparent border border-white/10">
            {prompt.difficulty}
          </Badge>
          <span>{prompt.timesUsed} battles</span>
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

function LeaderboardRow({ entry }: { entry: BattleLeaderboardEntry }) {
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
        <div className="text-xs text-gray-500">{entry.battlesWon} wins</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-green-400">{entry.winRate}%</div>
      </div>
    </div>
  );
}
