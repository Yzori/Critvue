'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  KarmaAction,
  type KarmaTransaction,
} from '@/lib/types/tier';
import { formatDistanceToNow } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Karma Transaction History Page
 *
 * Displays a paginated list of karma transactions with filtering by action type.
 * Shows points gained/lost with color coding and detailed reasons.
 */

// Mock data for development - replace with API call
const MOCK_TRANSACTIONS: KarmaTransaction[] = [
  {
    id: '1',
    userId: 'user-1',
    action: KarmaAction.REVIEW_ACCEPTED,
    points: 50,
    reason: 'Your review for "E-commerce Dashboard" was accepted',
    metadata: { reviewId: 'rev-123' },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    id: '2',
    userId: 'user-1',
    action: KarmaAction.REVIEW_HELPFUL,
    points: 10,
    reason: 'Your review received a "helpful" rating',
    metadata: { reviewId: 'rev-120' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    userId: 'user-1',
    action: KarmaAction.STREAK_BONUS,
    points: 25,
    reason: '7-day review streak bonus',
    metadata: { streakDays: 7 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: '4',
    userId: 'user-1',
    action: KarmaAction.REVIEW_SUBMITTED,
    points: 20,
    reason: 'Submitted review for "Mobile App Redesign"',
    metadata: { reviewId: 'rev-125' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: '5',
    userId: 'user-1',
    action: KarmaAction.REVIEW_REJECTED,
    points: -30,
    reason: 'Review did not meet quality standards',
    metadata: { reviewId: 'rev-118' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
  {
    id: '6',
    userId: 'user-1',
    action: KarmaAction.REVIEW_VERY_HELPFUL,
    points: 25,
    reason: 'Your review received multiple "very helpful" ratings',
    metadata: { reviewId: 'rev-115' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
  {
    id: '7',
    userId: 'user-1',
    action: KarmaAction.MILESTONE_BONUS,
    points: 100,
    reason: 'Completed 50 reviews milestone',
    metadata: {},
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
  },
];

const ACTION_LABELS: Record<KarmaAction, string> = {
  [KarmaAction.REVIEW_SUBMITTED]: 'Review Submitted',
  [KarmaAction.REVIEW_ACCEPTED]: 'Review Accepted',
  [KarmaAction.REVIEW_HELPFUL]: 'Helpful Rating',
  [KarmaAction.REVIEW_VERY_HELPFUL]: 'Very Helpful',
  [KarmaAction.STREAK_BONUS]: 'Streak Bonus',
  [KarmaAction.MILESTONE_BONUS]: 'Milestone',
  [KarmaAction.REFERRAL_BONUS]: 'Referral Bonus',
  [KarmaAction.REVIEW_REJECTED]: 'Review Rejected',
  [KarmaAction.REVIEW_REPORTED]: 'Review Reported',
  [KarmaAction.STREAK_BROKEN]: 'Streak Broken',
  [KarmaAction.VIOLATION]: 'Violation',
  [KarmaAction.MANUAL_ADJUSTMENT]: 'Manual Adjustment',
  [KarmaAction.TIER_PROMOTION]: 'Tier Promotion',
};

export default function KarmaHistoryPage() {
  const [selectedFilter, setSelectedFilter] = useState<KarmaAction | 'all'>(
    'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter transactions
  const filteredTransactions =
    selectedFilter === 'all'
      ? MOCK_TRANSACTIONS
      : MOCK_TRANSACTIONS.filter((t) => t.action === selectedFilter);

  // Paginate
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Calculate summary stats
  const totalGained = MOCK_TRANSACTIONS.filter((t) => t.points > 0).reduce(
    (sum, t) => sum + t.points,
    0
  );
  const totalLost = Math.abs(
    MOCK_TRANSACTIONS.filter((t) => t.points < 0).reduce(
      (sum, t) => sum + t.points,
      0
    )
  );

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Karma History</h1>
        <p className="text-muted-foreground mt-2">
          Track your karma points and see how you've earned your reputation
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Karma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalGained - totalLost).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net karma earned
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
              From {MOCK_TRANSACTIONS.filter((t) => t.points > 0).length}{' '}
              actions
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
              From {MOCK_TRANSACTIONS.filter((t) => t.points < 0).length}{' '}
              actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filter by Action</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={selectedFilter === 'all'}
              onClick={() => {
                setSelectedFilter('all');
                setCurrentPage(1);
              }}
            >
              All
            </FilterButton>
            {Object.values(KarmaAction).map((action) => (
              <FilterButton
                key={action}
                active={selectedFilter === action}
                onClick={() => {
                  setSelectedFilter(action);
                  setCurrentPage(1);
                }}
              >
                {ACTION_LABELS[action]}
              </FilterButton>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Showing {paginatedTransactions.length} of{' '}
            {filteredTransactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
              />
            ))}

            {paginatedTransactions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No transactions found
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  currentPage === 1
                    ? 'text-muted-foreground cursor-not-allowed'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'text-muted-foreground cursor-not-allowed'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  active,
  onClick,
  children,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200',
        active
          ? 'bg-accent-blue text-white shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      {children}
    </button>
  );
};

interface TransactionItemProps {
  transaction: KarmaTransaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isPositive = transaction.points > 0;
  const isNeutral = transaction.points === 0;

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
                {ACTION_LABELS[transaction.action]}
              </h3>
              <Badge
                variant={isPositive ? 'success' : 'error'}
                size="sm"
              >
                {isPositive ? 'Gained' : 'Lost'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {transaction.reason}
            </p>
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(transaction.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
