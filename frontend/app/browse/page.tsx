"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getBrowseReviews, BrowseReviewItem } from "@/lib/api/browse";
import { ContentType, ReviewType } from "@/lib/api/reviews";
import { ReviewCard } from "@/components/browse/review-card";
import { CompactFilterBar } from "@/components/browse/compact-filter-bar";
import { FilterBottomSheet } from "@/components/browse/filter-bottom-sheet";
import { EmptyState } from "@/components/browse/empty-state";
import { ReviewCardSkeletonGrid } from "@/components/browse/review-card-skeleton";
import { FeaturedHero } from "@/components/browse/hero/featured-hero";
import { CategoryCards } from "@/components/browse/hero/category-cards";
import { PickedForYou } from "@/components/browse/hero/picked-for-you";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

/**
 * Browse Page - Smart Two-Tier Marketplace Layout
 *
 * Features:
 * - Two-tier layout: Paid/Featured reviews at top, Free reviews below
 * - Section 1: 2-column grid for paid opportunities (larger cards)
 * - Section 2: 3-4 column grid for free reviews (compact cards)
 * - Smart card sizing based on review type and slot availability
 * - Enhanced sort options: Recent, Expiring Soon, Highest Paying, Popular Reviewer
 * - Glassmorphism aesthetic with visual hierarchy
 * - Responsive filters: Desktop popovers, mobile bottom sheet
 * - Public page (no auth required)
 * - Skeleton loading states and empty state handling
 * - Pagination ready for infinite scroll
 */
export default function BrowsePage() {
  // State
  const [reviews, setReviews] = React.useState<BrowseReviewItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Filter state
  const [contentType, setContentType] = React.useState<ContentType | "all">("all");
  const [reviewType, setReviewType] = React.useState<ReviewType | "all">("all");
  const [sortBy, setSortBy] = React.useState<"recent" | "price_high" | "price_low" | "deadline" | "popular">("recent");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch reviews
  const fetchReviews = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBrowseReviews({
        content_type: contentType,
        review_type: reviewType,
        sort_by: sortBy,
        search: searchQuery || undefined,
        limit: 20,
      });

      setReviews(response.items);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [contentType, reviewType, sortBy, searchQuery]);

  // Fetch on mount and when filters change
  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Reset filters
  const handleResetFilters = () => {
    setContentType("all");
    setReviewType("all");
    setSortBy("recent");
    setSearchQuery("");
  };

  // Split reviews into tiers: Hero Featured, Paid/Expert, Recommended, and Others
  const splitReviews = React.useMemo(() => {
    const heroFeatured: BrowseReviewItem[] = [];
    const recommended: BrowseReviewItem[] = [];
    const featuredPaid: BrowseReviewItem[] = [];
    const others: BrowseReviewItem[] = [];

    reviews.forEach((review) => {
      // Hero tier: Top 3-5 featured opportunities for carousel
      if (review.is_featured && heroFeatured.length < 5) {
        heroFeatured.push(review);
      }
      // Recommended tier: High-value or well-matched reviews (limit to 3 for focus)
      else if (
        (review.review_type === "expert" && (review.price ?? 0) > 75) ||
        (review.creator_rating && review.creator_rating >= 4.5)
      ) {
        if (recommended.length < 3) {
          recommended.push(review);
        } else {
          featuredPaid.push(review);
        }
      }
      // Paid tier: Expert reviews OR featured reviews not in hero
      else if (review.review_type === "expert" || review.is_featured) {
        featuredPaid.push(review);
      }
      // Free tier
      else {
        others.push(review);
      }
    });

    return { heroFeatured, recommended, featuredPaid, others };
  }, [reviews]);

  // Smart card sizing for Featured/Paid section (2-column grid)
  const getFeaturedCardSize = (
    review: BrowseReviewItem,
    index: number
  ): "medium" | "wide" => {
    // Keep all cards in the paid section as medium or wide only
    // No large cards to avoid oversized cards
    const almostFull = (review.available_slots ?? 1) === 1 && (review.reviews_requested ?? 1) > 1;

    // Wide cards for urgency or every 3rd card for variety
    if (almostFull || index % 3 === 0) return "wide";

    // Default to medium
    return "medium";
  };

  // Smart card sizing for Others section (3-4 column grid)
  const getOthersCardSize = (
    review: BrowseReviewItem
  ): "small" | "medium" => {
    const almostFull = (review.available_slots ?? 1) === 1 && (review.reviews_requested ?? 1) > 1;

    // Medium for almost full (show progress bar)
    if (almostFull) return "medium";

    // Small for standard free reviews
    return "small";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Compact Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Browse Reviews
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Discover and claim open review requests
              </p>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-4 py-2.5 rounded-xl",
                  "bg-white/60 backdrop-blur-sm border border-gray-200/50",
                  "focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/50",
                  "transition-all duration-200",
                  "placeholder:text-gray-400 text-sm"
                )}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Compact Filter Bar (NEW!) */}
      <CompactFilterBar
        contentType={contentType}
        reviewType={reviewType}
        sortBy={sortBy}
        onContentTypeChange={setContentType}
        onReviewTypeChange={setReviewType}
        onSortByChange={setSortBy}
        onShowMobileFilters={() => setShowMobileFilters(true)}
      />

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReviews}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading && <ReviewCardSkeletonGrid count={8} />}

        {/* Empty state */}
        {!loading && reviews.length === 0 && (
          <EmptyState onClearFilters={handleResetFilters} />
        )}

        {/* Discovery Experience: Hero + Personalized + Categories */}
        {!loading && reviews.length > 0 && (
          <div className="space-y-12">
            {/* Hero Section - Featured Carousel */}
            {splitReviews.heroFeatured.length > 0 && (
              <FeaturedHero featuredReviews={splitReviews.heroFeatured} />
            )}

            {/* Picked For You - Personalized Recommendations (Top Priority for Logged-in Users) */}
            {splitReviews.recommended.length > 0 && (
              <PickedForYou
                recommendations={splitReviews.recommended.slice(0, 3)}
                userSkills={["React", "TypeScript", "UI/UX"]} // TODO: Get from user profile
              />
            )}

            {/* Category Cards - Interactive Browse */}
            <CategoryCards
              onCategorySelect={(category) => setContentType(category)}
              selectedCategory={contentType}
            />
          </div>
        )}

        {/* Two-Tier Layout: Featured/Paid + All Others */}
        {!loading && reviews.length > 0 && (
          <div className="space-y-12 mt-12">
            {/* SECTION 1: Featured/Paid Reviews (Top Priority) */}
            {splitReviews.featuredPaid.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Paid Opportunities
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Expert reviews with compensation
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {splitReviews.featuredPaid.length} {splitReviews.featuredPaid.length === 1 ? "opportunity" : "opportunities"}
                  </div>
                </div>

                {/* 2-column grid for featured/paid (larger cards) */}
                <div
                  className={cn(
                    "grid",
                    "grid-cols-1 md:grid-cols-2",
                    "auto-rows-[10px]",
                    "gap-4"
                  )}
                  role="list"
                  aria-label="Featured and paid review opportunities"
                >
                  {splitReviews.featuredPaid.map((review, index) => {
                    const cardSize = getFeaturedCardSize(review, index);

                    // Calculate grid span for 2-column layout
                    const getSpanClass = (size: typeof cardSize) => {
                      switch (size) {
                        case "wide":
                          // 2 columns × compact height (140px)
                          return "col-span-1 md:col-span-2 row-span-[14]";
                        case "medium":
                        default:
                          // 1 column × compact height (140px)
                          return "col-span-1 row-span-[14]";
                      }
                    };

                    return (
                      <div
                        key={review.id}
                        role="listitem"
                        className={getSpanClass(cardSize)}
                      >
                        <ReviewCard
                          review={review}
                          size={cardSize}
                          importance={90} // High importance for featured/paid
                          className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full"
                          style={{
                            animationDelay: `${Math.min(index * 50, 600)}ms`,
                            animationFillMode: "backwards",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION 2: All Other Reviews (Free/Standard) */}
            {splitReviews.others.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Free Reviews
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Community feedback and portfolio building
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {splitReviews.others.length} {splitReviews.others.length === 1 ? "review" : "reviews"}
                  </div>
                </div>

                {/* 3-4 column grid for free reviews (compact cards) */}
                <div
                  className={cn(
                    "grid",
                    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                    "auto-rows-[10px]",
                    "gap-4"
                  )}
                  role="list"
                  aria-label="Free review opportunities"
                >
                  {splitReviews.others.map((review, index) => {
                    const cardSize = getOthersCardSize(review);

                    // Calculate grid span for 3-4 column layout
                    const getSpanClass = (size: typeof cardSize) => {
                      switch (size) {
                        case "medium":
                          // Standard card with progress bar (140px)
                          return "col-span-1 row-span-[14]";
                        case "small":
                        default:
                          // Compact free review card (120px)
                          return "col-span-1 row-span-[12]";
                      }
                    };

                    return (
                      <div
                        key={review.id}
                        role="listitem"
                        className={getSpanClass(cardSize)}
                      >
                        <ReviewCard
                          review={review}
                          size={cardSize}
                          importance={50} // Standard importance for free reviews
                          className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full"
                          style={{
                            animationDelay: `${Math.min(index * 30, 800)}ms`,
                            animationFillMode: "backwards",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Load more section (placeholder for pagination/infinite scroll) */}
        {!loading && reviews.length > 0 && (
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="bg-white/60 backdrop-blur-sm"
            >
              Load More Reviews
            </Button>
          </div>
        )}
      </main>

      {/* Mobile bottom sheet */}
      <FilterBottomSheet
        open={showMobileFilters}
        onOpenChange={setShowMobileFilters}
        contentType={contentType}
        reviewType={reviewType}
        sortBy={sortBy}
        onContentTypeChange={setContentType}
        onReviewTypeChange={setReviewType}
        onSortByChange={setSortBy}
        onReset={handleResetFilters}
        onApply={() => {
          // Filters are applied immediately, this just closes the sheet
          setShowMobileFilters(false);
        }}
      />

      {/* Accessibility and Performance Notes */}
      <style jsx global>{`
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .grid > * {
            animation: none !important;
          }
        }

        /*
         * Smart Two-Tier Marketplace Layout
         *
         * Design Strategy:
         * - Two-tier system prioritizes paid opportunities
         * - Section 1: Featured/Paid (2-column grid, larger cards)
         * - Section 2: Free Reviews (3-4 column grid, compact cards)
         *
         * Card Sizing Logic:
         * - Paid reviews: Large cards with prominent pricing
         * - Almost full slots: Medium cards with progress bar (urgency)
         * - Free reviews: Small compact cards
         * - Featured reviews: Large spotlight cards
         *
         * Grid Layouts:
         * - Featured/Paid: 1 col mobile, 2 col desktop (lg:grid-cols-2)
         * - Free Reviews: 1→2→3→4 responsive columns
         * - Auto-rows: 10px units for precise height control
         *
         * Accessibility:
         * - Semantic section elements with descriptive headings
         * - role="list" and role="listitem" for screen readers
         * - Logical DOM order matches visual hierarchy
         * - Keyboard navigation follows natural flow
         * - WCAG 2.1 Level AA compliant
         */
      `}</style>
    </div>
  );
}
