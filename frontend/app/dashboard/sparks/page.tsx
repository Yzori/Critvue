'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KarmaDashboard, BadgesDisplay, Leaderboard } from '@/components/karma';
import {
  getKarmaSummary,
  getKarmaBreakdown,
  getKarmaHistory,
  getMyBadges,
  getAvailableBadges,
  toggleBadgeFeatured,
  getLeaderboard,
  getMyRanking,
  type KarmaSummary,
  type KarmaBreakdown,
  type KarmaTransaction,
  type Badge as BadgeType,
  type LeaderboardEntry,
  type UserRanking,
  type Season,
  type SeasonType,
  type LeaderboardCategory,
} from '@/lib/api/karma';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Award,
  BarChart3,
  History,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Karma Page
 *
 * Comprehensive karma dashboard with:
 * - Modern karma stats (XP, reputation, weekly goals, streak shields)
 * - Badges and achievements
 * - Seasonal leaderboards
 * - Transaction history
 */

export default function KarmaPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [summary, setSummary] = useState<KarmaSummary | null>(null);
  const [breakdown, setBreakdown] = useState<KarmaBreakdown | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<BadgeType[]>([]);
  const [availableBadges, setAvailableBadges] = useState<BadgeType[]>([]);
  const [transactions, setTransactions] = useState<KarmaTransaction[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRanking, setUserRanking] = useState<UserRanking | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);

  // Loading states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Leaderboard filters
  const [seasonType, setSeasonType] = useState<SeasonType>('weekly');
  const [category, setCategory] = useState<LeaderboardCategory>('overall');

  // History pagination
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Fetch overview data
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const [summaryData, breakdownData] = await Promise.all([
        getKarmaSummary(),
        getKarmaBreakdown(),
      ]);
      setSummary(summaryData);
      setBreakdown(breakdownData);
    } catch (error) {
      console.error('Failed to fetch karma overview:', error);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch badges
  const fetchBadges = async () => {
    setLoadingBadges(true);
    try {
      const [earned, available] = await Promise.all([
        getMyBadges(true),
        getAvailableBadges(),
      ]);
      setEarnedBadges(earned);
      setAvailableBadges(available);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoadingBadges(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const [leaderboard, ranking] = await Promise.all([
        getLeaderboard(seasonType, category),
        getMyRanking(seasonType, category).catch(() => null),
      ]);
      setLeaderboardData(leaderboard.rankings);
      setCurrentSeason(leaderboard.season);
      setUserRanking(ranking);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Fetch transaction history
  const fetchHistory = async (reset = false) => {
    setLoadingHistory(true);
    const offset = reset ? 0 : historyPage * 20;
    try {
      const data = await getKarmaHistory(20, offset);
      if (reset) {
        setTransactions(data.transactions);
        setHistoryPage(1);
      } else {
        setTransactions((prev) => [...prev, ...data.transactions]);
        setHistoryPage((p) => p + 1);
      }
      setHasMoreHistory(data.transactions.length === 20);
    } catch (error) {
      console.error('Failed to fetch karma history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Toggle badge featured
  const handleToggleFeatured = async (badgeId: number) => {
    try {
      await toggleBadgeFeatured(badgeId);
      // Refresh badges
      await fetchBadges();
    } catch (error) {
      console.error('Failed to toggle badge featured:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchOverview();
      fetchBadges();
      fetchHistory(true);
    }
  }, [isAuthenticated]);

  // Fetch leaderboard when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'leaderboard' && isAuthenticated) {
      fetchLeaderboard();
    }
  }, [activeTab, seasonType, category, isAuthenticated]);

  // Calculate history stats
  const totalGained = transactions
    .filter((t) => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);
  const totalLost = Math.abs(
    transactions.filter((t) => t.points < 0).reduce((sum, t) => sum + t.points, 0)
  );

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="mt-1 shrink-0"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Karma & Achievements</h1>
            <p className="text-muted-foreground mt-1">
              Track your progress, earn badges, and climb the leaderboard
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchOverview();
            fetchBadges();
            fetchHistory(true);
          }}
          disabled={loadingOverview}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', loadingOverview && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Badges</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <KarmaDashboard
            summary={summary || undefined}
            breakdown={breakdown || undefined}
            isLoading={loadingOverview}
            onViewDetails={() => setActiveTab('history')}
            onViewBadges={() => setActiveTab('badges')}
            onViewLeaderboard={() => setActiveTab('leaderboard')}
          />
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-6">
          <BadgesDisplay
            earnedBadges={earnedBadges}
            availableBadges={availableBadges}
            isLoading={loadingBadges}
            onToggleFeatured={handleToggleFeatured}
          />
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-6">
          <Leaderboard
            rankings={leaderboardData}
            userRanking={userRanking}
            season={currentSeason}
            seasonType={seasonType}
            category={category}
            isLoading={loadingLeaderboard}
            onSeasonTypeChange={setSeasonType}
            onCategoryChange={setCategory}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Karma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(totalGained - totalLost).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {transactions.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Karma Gained
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{totalGained.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.filter((t) => t.points > 0).length} positive actions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Karma Lost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  -{totalLost.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.filter((t) => t.points < 0).length} deductions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction List */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Recent karma changes and their reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory && transactions.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="h-12 w-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-48 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No karma transactions yet</p>
                  <p className="text-sm">Start reviewing to earn karma!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMoreHistory && (
                    <div className="mt-6 text-center">
                      <Button
                        variant="outline"
                        onClick={() => fetchHistory()}
                        disabled={loadingHistory}
                      >
                        {loadingHistory ? 'Loading...' : 'Load More'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TransactionItemProps {
  transaction: KarmaTransaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isPositive = transaction.points > 0;
  const isNeutral = transaction.points === 0;

  // Format action label
  const getActionLabel = (action: string): string => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
      {/* Points Badge */}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full font-bold text-sm flex-shrink-0',
          isPositive && 'bg-green-50 text-green-700',
          !isPositive && !isNeutral && 'bg-red-50 text-red-700',
          isNeutral && 'bg-gray-50 text-gray-700'
        )}
      >
        {isPositive && '+'}
        {transaction.points}
      </div>

      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-sm">
                {getActionLabel(transaction.action)}
              </h3>
              <Badge
                variant={isPositive ? 'success' : 'error'}
                className="text-xs"
              >
                {isPositive ? 'Gained' : 'Lost'}
              </Badge>
            </div>
            {transaction.reason && (
              <p className="text-sm text-muted-foreground mt-1">
                {transaction.reason}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Balance after: {transaction.balance_after.toLocaleString()}
            </p>
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(transaction.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
