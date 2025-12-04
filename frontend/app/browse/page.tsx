"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getBrowseReviews, BrowseReviewItem } from "@/lib/api/browse";
import { getMyProfile } from "@/lib/api/profile";
import { ContentType, ReviewType } from "@/lib/api/reviews";
import { ReviewCard } from "@/components/browse/review-card";
import { CompactFilterBar } from "@/components/browse/compact-filter-bar";
import { FilterBottomSheet } from "@/components/browse/filter-bottom-sheet";
import { EmptyState } from "@/components/browse/empty-state";
import { ReviewCardSkeletonGrid } from "@/components/browse/review-card-skeleton";
import { FeaturedHero } from "@/components/browse/hero/featured-hero";
import { CategoryCards } from "@/components/browse/hero/category-cards";
import { PickedForYou } from "@/components/browse/hero/picked-for-you";
import { SkillsModal } from "@/components/browse/skills-modal";
import { PremiumHeroCard } from "@/components/browse/premium-hero-card";
import { CommunityGalleryCard } from "@/components/browse/community-gallery-card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
// Mobile-optimized components
import { MobileBrowseHeader } from "@/components/browse/mobile-browse-header";
import { MobileDiscoveryCarousel } from "@/components/browse/mobile-discovery-carousel";
import { CompactReviewCard } from "@/components/browse/compact-review-card";
import { QuickFilterChips } from "@/components/browse/quick-filter-chips";
import { useAuth } from "@/contexts/AuthContext";

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
  // Auth state
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [reviews, setReviews] = React.useState<BrowseReviewItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // User skills state
  const [userSkills, setUserSkills] = React.useState<string[]>([]);
  const [showSkillsModal, setShowSkillsModal] = React.useState(false);

  // Filter state
  const [contentType, setContentType] = React.useState<ContentType | "all">("all");
  const [reviewType, setReviewType] = React.useState<ReviewType | "all">("all");
  const [sortBy, setSortBy] = React.useState<"recent" | "price_high" | "price_low" | "deadline">("recent");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch user profile to get skills (only if authenticated)
  React.useEffect(() => {
    const fetchUserSkills = async () => {
      if (!isAuthenticated || authLoading) return;

      try {
        const profile = await getMyProfile();
        setUserSkills(profile.specialty_tags || []);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        // Non-critical error - just don't show personalized skills
      }
    };

    fetchUserSkills();
  }, [isAuthenticated, authLoading]);

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
        user_skills: userSkills.length > 0 ? userSkills : undefined,
      });

      setReviews(response.items);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [contentType, reviewType, sortBy, searchQuery, userSkills]);

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

  // Calculate importance score for sorting (higher = more prominent)
  const calculateImportanceScore = (review: BrowseReviewItem): number => {
    let score = 0;

    // Price factor (0-40 points) - higher paying = more prominent
    const price = review.price ?? 0;
    score += Math.min(price / 2.5, 40); // $100 = 40 points max

    // Creator rating factor (0-20 points)
    const rating = review.creator_rating ?? 0;
    score += rating * 4; // 5.0 rating = 20 points

    // Urgency factor (0-20 points) - closer deadline = more urgent
    if (review.deadline) {
      const daysUntil = Math.ceil(
        (new Date(review.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 1) score += 20;
      else if (daysUntil <= 3) score += 15;
      else if (daysUntil <= 7) score += 10;
      else score += 5;
    }

    // Scarcity factor (0-15 points) - fewer slots = more urgent
    const totalSlots = review.reviews_requested ?? 1;
    const availableSlots = review.available_slots ?? totalSlots;
    if (totalSlots > 1) {
      const fillRate = (totalSlots - availableSlots) / totalSlots;
      score += fillRate * 15; // Almost full = 15 points
    }

    // Featured bonus (5 points)
    if (review.is_featured) score += 5;

    return score;
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

    // Sort featuredPaid by importance score (highest first)
    // Hero card will be the highest scoring opportunity
    featuredPaid.sort((a, b) => calculateImportanceScore(b) - calculateImportanceScore(a));

    return { heroFeatured, recommended, featuredPaid, others };
  }, [reviews]);

  // Smart card sizing for Featured/Paid section (2-column grid)
  // const getFeaturedCardSize = (
//     review: BrowseReviewItem,
//     index: number
//   ): "medium" | "wide" => {
//     // Keep all cards in the paid section as medium or wide only
//     // No large cards to avoid oversized cards
//     const almostFull = (review.available_slots ?? 1) === 1 && (review.reviews_requested ?? 1) > 1;
// 
//     // Wide cards for urgency or every 3rd card for variety
//     if (almostFull || index % 3 === 0) return "wide";
// 
//     // Default to medium
//     return "medium";
//   };
// 
  // Smart card sizing for Others section (3-4 column grid)
//   const getOthersCardSize = (
//     review: BrowseReviewItem
//   ): "small" | "medium" => {
//     const almostFull = (review.available_slots ?? 1) === 1 && (review.reviews_requested ?? 1) > 1;
// 
//     // Medium for almost full (show progress bar)
//     if (almostFull) return "medium";
// 
//     // Small for standard free reviews
//     return "small";
//   };
// 
  // Calculate active filter count for mobile header
  const activeFilterCount =
    (contentType !== "all" ? 1 : 0) +
    (reviewType !== "all" ? 1 : 0) +
    (sortBy !== "recent" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500/5 via-background to-orange-500/5">
      {/* Mobile Header - Compact single row */}
      <MobileBrowseHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onShowFilters={() => setShowMobileFilters(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Desktop Header - Hidden on mobile */}
      <header className="hidden md:block sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Browse Reviews
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Discover and claim open review requests
              </p>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-4 py-2.5 rounded-xl",
                  "bg-background/60 backdrop-blur-sm border border-border/50",
                  "focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/50",
                  "transition-all duration-200",
                  "placeholder:text-muted-foreground text-sm"
                )}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Compact Filter Bar - Hidden on mobile */}
      <CompactFilterBar
        className="hidden md:block"
        contentType={contentType}
        reviewType={reviewType}
        sortBy={sortBy}
        onContentTypeChange={setContentType}
        onReviewTypeChange={setReviewType}
        onSortByChange={(val) => setSortBy(val === "popular" ? "recent" : val as any)}
        onShowMobileFilters={() => setShowMobileFilters(true)}
      />

      {/* Main content */}
      <main className={cn(
        "max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8",
        "pt-[72px] md:pt-8", // Account for fixed mobile header
        "pb-32 md:pb-8" // Extra bottom padding on mobile for quick filters
      )}>
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
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

        {/* Mobile Discovery - Horizontal Carousel */}
        {!loading && reviews.length > 0 && (
          <MobileDiscoveryCarousel
            featuredReviews={splitReviews.heroFeatured}
            recommendations={splitReviews.recommended}
            className="mb-6"
          />
        )}

        {/* Desktop Discovery Experience: Hero + Personalized + Categories */}
        {!loading && reviews.length > 0 && (
          <div className="hidden md:block space-y-12">
            {/* Hero Section - Featured Carousel */}
            {splitReviews.heroFeatured.length > 0 && (
              <FeaturedHero featuredReviews={splitReviews.heroFeatured} />
            )}

            {/* Picked For You - Personalized Recommendations (Top Priority for Logged-in Users) */}
            {splitReviews.recommended.length > 0 && (
              <PickedForYou
                recommendations={splitReviews.recommended.slice(0, 3)}
                userSkills={userSkills}
                isLoggedIn={isAuthenticated}
                onCustomizeSkills={() => setShowSkillsModal(true)}
              />
            )}

            {/* Category Cards - Interactive Browse */}
            <CategoryCards
              onCategorySelect={(category) => setContentType(category ?? "all")}
              selectedCategory={contentType}
            />
          </div>
        )}

        {/* Two-Tier Layout: Featured/Paid + All Others */}
        {!loading && reviews.length > 0 && (
          <div className="space-y-8 md:space-y-12 mt-6 md:mt-12">
            {/* SECTION 1: Marketplace Showcase - Premium Paid Opportunities */}
            {splitReviews.featuredPaid.length > 0 && (
              <section id="premium-marketplace">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-foreground">
                      Premium
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                      Paid opportunities
                    </p>
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {splitReviews.featuredPaid.length} {splitReviews.featuredPaid.length === 1 ? "review" : "reviews"}
                  </div>
                </div>

                {/* Mobile: 2-column compact grid for Premium */}
                <div className="grid md:hidden grid-cols-2 gap-3">
                  {splitReviews.featuredPaid.map((review, index) => (
                    <div
                      key={review.id}
                      className="animate-in fade-in duration-300"
                      style={{
                        animationDelay: `${Math.min(index * 30, 500)}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <CompactReviewCard review={review} />
                    </div>
                  ))}
                </div>

                {/* Desktop: Clean Premium Container - Subtle Refinement */}
                <div
                  className={cn(
                    "hidden md:block",
                    "relative overflow-hidden rounded-2xl p-4",
                    "bg-muted/50",
                    "border border-border",
                    "shadow-sm"
                  )}
                >
                  {/* Marketplace Showcase Layout - Stacked Banner Style */}
                  <div className="flex flex-col gap-4">
                    {/* TOP: Hero Featured Banner (full width) */}
                    {splitReviews.featuredPaid[0] && (
                      <PremiumHeroCard review={splitReviews.featuredPaid[0]} />
                    )}

                    {/* BOTTOM: Supporting Cards Row - 3 columns for better spacing */}
                    {splitReviews.featuredPaid.length > 1 && (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        {splitReviews.featuredPaid.slice(1, 4).map((review, index) => (
                          <ReviewCard
                            key={review.id}
                            review={review}
                            size="medium"
                            importance={70 - (index * 5)}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{
                              animationDelay: `${(index + 1) * 100}ms`,
                              animationFillMode: "backwards",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Show remaining paid reviews in standard grid if more than 4 */}
                  {splitReviews.featuredPaid.length > 4 && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                        {splitReviews.featuredPaid.slice(4).map((review, index) => (
                          <ReviewCard
                            key={review.id}
                            review={review}
                            size="medium"
                            importance={65}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{
                              animationDelay: `${(index + 4) * 50}ms`,
                              animationFillMode: "backwards",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* SECTION 2: Community Gallery - Free Reviews */}
            {splitReviews.others.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-foreground">
                      Community Gallery
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                      Free reviews from the community
                    </p>
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {splitReviews.others.length} {splitReviews.others.length === 1 ? "review" : "reviews"}
                  </div>
                </div>

                {/* Mobile: 2-column compact grid */}
                <div
                  className={cn(
                    "grid md:hidden",
                    "grid-cols-2 gap-3"
                  )}
                  role="list"
                  aria-label="Community gallery - free review opportunities"
                >
                  {splitReviews.others.map((review, index) => (
                    <div
                      key={review.id}
                      role="listitem"
                      className="animate-in fade-in duration-300"
                      style={{
                        animationDelay: `${Math.min(index * 30, 500)}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <CompactReviewCard review={review} />
                    </div>
                  ))}
                </div>

                {/* Desktop: Full-size card grid */}
                <div
                  className={cn(
                    "hidden md:grid",
                    "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                    "gap-4"
                  )}
                  role="list"
                  aria-label="Community gallery - free review opportunities"
                >
                  {splitReviews.others.map((review, index) => (
                    <div
                      key={review.id}
                      role="listitem"
                      className="animate-in fade-in duration-500"
                      style={{
                        animationDelay: `${Math.min(index * 50, 1000)}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <CommunityGalleryCard review={review} />
                    </div>
                  ))}
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
              className="bg-background/60 backdrop-blur-sm"
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

      {/* Skills selection modal */}
      <SkillsModal
        open={showSkillsModal}
        onOpenChange={setShowSkillsModal}
        currentSkills={userSkills}
        onSkillsUpdated={setUserSkills}
      />

      {/* Mobile Quick Filter Chips - Floating at bottom */}
      <QuickFilterChips
        reviewType={reviewType}
        sortBy={sortBy}
        onReviewTypeChange={setReviewType}
        onSortByChange={setSortBy}
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
