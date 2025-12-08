'use client';

/**
 * Reviewer Directory Page
 *
 * Searchable, filterable directory of approved reviewers.
 * Features tier filtering, specialty tags, sorting, and pagination.
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  Star,
  Clock,
  MessageSquare,
  Filter,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  Flame,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getReviewers,
  getReviewerFilters,
  ReviewerEntry,
  ReviewerFiltersResponse,
  ReviewerSortBy,
  SortOrder,
} from '@/lib/api/reviewers';

const ITEMS_PER_PAGE = 24;

// Tier display info
const tierInfo: Record<string, { label: string; color: string; bgColor: string }> = {
  novice: { label: 'Novice', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  contributor: { label: 'Contributor', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
  skilled: { label: 'Skilled', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/30' },
  trusted_advisor: { label: 'Trusted Advisor', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
  expert: { label: 'Expert', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/30' },
  master: { label: 'Master', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/30' },
};

const sortOptions: { value: ReviewerSortBy; label: string }[] = [
  { value: 'karma', label: 'Sparks' },
  { value: 'rating', label: 'Avg Rating' },
  { value: 'reviews', label: 'Reviews Given' },
  { value: 'response_time', label: 'Response Time' },
  { value: 'acceptance_rate', label: 'Acceptance Rate' },
];

export default function ReviewerDirectoryPage() {
  const router = useRouter();

  // Filters state
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [tier, setTier] = React.useState<string>('all');
  const [specialty, setSpecialty] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<ReviewerSortBy>('karma');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = React.useState(false);

  // Data state
  const [reviewers, setReviewers] = React.useState<ReviewerEntry[]>([]);
  const [filters, setFilters] = React.useState<ReviewerFiltersResponse | null>(null);
  const [totalEntries, setTotalEntries] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch filters on mount
  React.useEffect(() => {
    async function fetchFilters() {
      try {
        const data = await getReviewerFilters();
        setFilters(data);
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      }
    }
    fetchFilters();
  }, []);

  // Fetch reviewers
  const fetchReviewers = React.useCallback(
    async (reset: boolean = true) => {
      try {
        if (reset) {
          setIsLoading(true);
          setOffset(0);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);

        const newOffset = reset ? 0 : offset + ITEMS_PER_PAGE;
        const data = await getReviewers({
          search: debouncedSearch || undefined,
          tier: tier !== 'all' ? tier : undefined,
          specialty: specialty !== 'all' ? specialty : undefined,
          sortBy,
          sortOrder,
          limit: ITEMS_PER_PAGE,
          offset: newOffset,
        });

        if (reset) {
          setReviewers(data.reviewers);
        } else {
          setReviewers((prev) => [...prev, ...data.reviewers]);
        }
        setTotalEntries(data.metadata.totalEntries);
        setOffset(newOffset);
      } catch (err) {
        console.error('Failed to fetch reviewers:', err);
        setError('Failed to load reviewers. Please try again.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, tier, specialty, sortBy, sortOrder, offset]
  );

  // Refetch on filter changes
  React.useEffect(() => {
    fetchReviewers(true);
  }, [debouncedSearch, tier, specialty, sortBy, sortOrder]);

  // Infinite scroll
  React.useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500 &&
        !isLoadingMore &&
        !isLoading &&
        reviewers.length < totalEntries
      ) {
        fetchReviewers(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, isLoading, reviewers.length, totalEntries, fetchReviewers]);

  const handleReviewerClick = (reviewer: ReviewerEntry) => {
    router.push(`/profile/${reviewer.username || reviewer.userId}`);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const clearFilters = () => {
    setSearch('');
    setTier('all');
    setSpecialty('all');
    setSortBy('karma');
    setSortOrder('desc');
  };

  const hasActiveFilters = search || tier !== 'all' || specialty !== 'all';

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-6 w-6 text-accent-peach" />
                Reviewer Directory
              </h1>
              <p className="text-muted-foreground mt-1">
                Find the perfect reviewer for your creative work
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {filters?.totalReviewers ?? '...'}
              </p>
              <p className="text-sm text-muted-foreground">Active Reviewers</p>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-background rounded-xl border border-border p-4 shadow-sm space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'gap-2',
                  hasActiveFilters && 'border-accent-peach text-accent-peach'
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" size="sm" className="ml-1">
                    Active
                  </Badge>
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    showFilters && 'rotate-180'
                  )}
                />
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Expandable Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tier Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Tier</label>
                    <Select value={tier} onValueChange={setTier}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Tiers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        {filters?.tiers.map((t) => (
                          <SelectItem key={t} value={t}>
                            {tierInfo[t]?.label || t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Specialty Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Specialty</label>
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Specialties</SelectItem>
                        {filters?.specialties.map((s) => (
                          <SelectItem key={s.tag} value={s.tag}>
                            {s.tag} ({s.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Sort By</label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as ReviewerSortBy)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Order</label>
                    <Button
                      variant="outline"
                      onClick={toggleSortOrder}
                      className="w-full justify-between"
                    >
                      {sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}
                      <ArrowUpDown className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                Showing <span className="font-medium text-foreground">{reviewers.length}</span> of{' '}
                <span className="font-medium text-foreground">{totalEntries}</span> reviewers
              </>
            )}
          </p>
        </div>

        {/* Reviewer Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-xl border border-border p-4 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-8 bg-muted rounded" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-12 text-center"
          >
            <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 font-semibold text-lg text-foreground">Unable to Load Reviewers</h3>
            <p className="mb-6 text-muted-foreground text-sm">{error}</p>
            <Button onClick={() => fetchReviewers(true)} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </motion.div>
        ) : reviewers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-12 text-center"
          >
            <Users className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 font-semibold text-lg text-foreground">No Reviewers Found</h3>
            <p className="text-muted-foreground text-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more reviewers.'
                : 'Be the first to become an active reviewer!'}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" className="mt-4">
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reviewers.map((reviewer, index) => (
                <ReviewerCard
                  key={reviewer.userId}
                  reviewer={reviewer}
                  index={index}
                  onClick={() => handleReviewerClick(reviewer)}
                />
              ))}
            </div>

            {/* Load More Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* End of List */}
            {reviewers.length >= totalEntries && reviewers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground text-sm py-8"
              >
                You've reached the end of the directory
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Reviewer Card Component
 */
function ReviewerCard({
  reviewer,
  index,
  onClick,
}: {
  reviewer: ReviewerEntry;
  index: number;
  onClick: () => void;
}) {
  const tier = tierInfo[reviewer.userTier] ?? tierInfo.novice!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="bg-background rounded-xl border border-border p-4 shadow-sm hover:shadow-md hover:border-accent-peach/50 cursor-pointer transition-all group"
    >
      {/* Header: Avatar + Name + Tier */}
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex-shrink-0 ring-2 ring-border group-hover:ring-accent-peach/50 transition-all">
            {reviewer.avatarUrl ? (
              <img
                src={reviewer.avatarUrl}
                alt={reviewer.fullName || reviewer.username || 'Reviewer'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-accent-peach/20 to-accent-blue/20 text-foreground font-semibold text-lg">
                {(reviewer.fullName || reviewer.username || 'R').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {reviewer.currentStreak > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-0.5">
              <Flame className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-accent-peach transition-colors">
            {reviewer.fullName || reviewer.username || `User ${reviewer.userId}`}
          </h3>
          {reviewer.username && reviewer.fullName && (
            <p className="text-sm text-muted-foreground truncate">@{reviewer.username}</p>
          )}
          <span className={cn('inline-flex text-xs font-medium px-2 py-0.5 rounded-full mt-1', tier.bgColor, tier.color)}>
            {tier.label}
          </span>
        </div>
      </div>

      {/* Title/Bio */}
      {reviewer.title && (
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{reviewer.title}</p>
      )}

      {/* Specialty Tags */}
      {reviewer.specialtyTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {reviewer.specialtyTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="neutral" size="sm">
              {tag}
            </Badge>
          ))}
          {reviewer.specialtyTags.length > 3 && (
            <Badge variant="neutral" size="sm">
              +{reviewer.specialtyTags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">{reviewer.totalReviewsGiven}</p>
            <p className="text-[10px] text-muted-foreground">Reviews</p>
          </div>
        </div>

        {reviewer.avgRating !== null ? (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">{reviewer.avgRating.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">--</p>
              <p className="text-[10px] text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        )}

        {reviewer.avgResponseTimeHours !== null && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {reviewer.avgResponseTimeHours < 24
                  ? `${reviewer.avgResponseTimeHours}h`
                  : `${Math.round(reviewer.avgResponseTimeHours / 24)}d`}
              </p>
              <p className="text-[10px] text-muted-foreground">Avg Response</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 flex items-center justify-center">
            <span className="text-accent-peach text-xs font-bold">S</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{reviewer.karmaPoints}</p>
            <p className="text-[10px] text-muted-foreground">Sparks</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
