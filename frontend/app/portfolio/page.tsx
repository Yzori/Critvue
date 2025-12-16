"use client";

/**
 * Portfolio Page - "The Critique Canvas"
 *
 * A unique portfolio experience that showcases the creator's growth journey
 * through feedback and critique. Unlike standard portfolios that only show
 * finished work, this tells the story of transformation.
 */

import { useState, useEffect } from "react";
import { useToggle } from "@/hooks";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  MessageSquare,
  Award,
  ChevronDown,
  Plus,
  Upload,
  BadgeCheck,
} from "lucide-react";

// Portfolio Components
import { GrowthRing } from "@/components/portfolio/growth-ring";
import { ProjectJourneyCard } from "@/components/portfolio/project-journey-card";
import { ReviewerNetwork } from "@/components/portfolio/reviewer-network";
import { GrowthMilestones } from "@/components/portfolio/growth-milestones";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { PortfolioUploadDialog } from "@/components/portfolio/portfolio-upload-dialog";
import { AddFromReviewsDialog } from "@/components/portfolio/add-from-reviews-dialog";

// API & Auth
import { useAuth } from "@/contexts/AuthContext";
import {
  getFullPortfolioGrowth,
  transformGrowthData,
  transformMilestones,
  transformReviewers,
} from "@/lib/api/profile/growth";
import {
  getPortfolioSlots,
  getFeaturedSlots,
  togglePortfolioFeatured,
  type PortfolioSlotsResponse,
  type FeaturedSlotsResponse,
} from "@/lib/api/profile/portfolio";
import { getFileUrl } from "@/lib/api/client";
import { toast } from "sonner";

// Types for transformed data
interface TransformedGrowthData {
  totalReviews: number;
  improvementScore: number;
  topCategory: string;
  growthPercentile: number;
  streakDays: number;
  totalProjects: number;
}

interface TransformedMilestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface TransformedReviewer {
  id: number;
  name: string;
  avatar: string | null;
  specialty: string;
  reviewCount: number;
  impactScore: number;
}

// Transform project from API to journey card format
interface JourneyProject {
  id: number;
  title: string;
  description: string;
  contentType: "design" | "photography" | "video" | "stream" | "audio" | "writing" | "art";
  beforeImage: string | null;
  afterImage: string | null;
  isSelfDocumented: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  reviewsReceived: number;
  projectUrl: string | null;
}

// Default fallback data
const defaultGrowthData: TransformedGrowthData = {
  totalReviews: 0,
  improvementScore: 0,
  topCategory: "Design",
  growthPercentile: 0,
  streakDays: 0,
  totalProjects: 0,
};

const defaultMilestones: TransformedMilestone[] = [
  {
    id: "first_review",
    title: "First Critique",
    description: "Receive your first expert review",
    icon: "message",
    earnedAt: null,
    rarity: "common",
  },
  {
    id: "five_reviews",
    title: "Feedback Seeker",
    description: "Receive critiques from 5 different reviewers",
    icon: "users",
    earnedAt: null,
    rarity: "uncommon",
  },
  {
    id: "top_50",
    title: "Rising Star",
    description: "Reach top 50% improvement on the platform",
    icon: "star",
    earnedAt: null,
    rarity: "rare",
  },
];

export default function PortfolioPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Portfolio data state
  const [growthData, setGrowthData] = useState<TransformedGrowthData>(defaultGrowthData);
  const [milestones, setMilestones] = useState<TransformedMilestone[]>(defaultMilestones);
  const [reviewers, setReviewers] = useState<TransformedReviewer[]>([]);
  const [projects, setProjects] = useState<JourneyProject[]>([]);
  const [portfolioSlots, setPortfolioSlots] = useState<PortfolioSlotsResponse | null>(null);
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlotsResponse | null>(null);

  // Boolean states using useToggle
  const loadingState = useToggle(true);
  const uploadDialog = useToggle();
  const addFromReviewsDialog = useToggle();

  // Convenient alias
  const loading = loadingState.value;

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/portfolio");
      return;
    }

    if (user) {
      loadPortfolio();
    }
  }, [user, authLoading, router]);

  const loadPortfolio = async () => {
    try {
      loadingState.setTrue();
      setError(null);

      // Fetch portfolio slots (for self-documented items limit)
      try {
        const slots = await getPortfolioSlots();
        setPortfolioSlots(slots);
      } catch {
        // Ignore - slots will just show as null
      }

      // Fetch featured slots (for featuring limit)
      try {
        const featured = await getFeaturedSlots();
        setFeaturedSlots(featured);
      } catch {
        // Ignore - featured slots will just show as null
      }

      // Fetch complete portfolio growth data from API
      const response = await getFullPortfolioGrowth();

      // Transform and set growth data
      const transformedGrowth = transformGrowthData(response.growth_data);
      setGrowthData(transformedGrowth);

      // Transform and set milestones
      const transformedMilestones = transformMilestones(response.milestones);
      setMilestones(transformedMilestones);

      // Transform and set reviewers
      const transformedReviewers = transformReviewers(response.top_reviewers);
      setReviewers(transformedReviewers);

      // Transform projects to journey format - use actual data, no fake placeholders
      // Convert relative file URLs to full backend URLs
      const journeyProjects: JourneyProject[] = response.projects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        contentType: (p.content_type as JourneyProject["contentType"]) || "design",
        beforeImage: p.before_image_url ? getFileUrl(p.before_image_url) : null,
        afterImage: p.image_url ? getFileUrl(p.image_url) : null,
        isSelfDocumented: p.is_self_documented,
        isVerified: p.is_verified,
        isFeatured: p.is_featured,
        reviewsReceived: p.reviews_received,
        projectUrl: p.project_url,
      }));
      setProjects(journeyProjects);

    } catch {
      setError("Failed to load portfolio data. Please try again.");
      // Keep default data on error
    } finally {
      loadingState.setFalse();
    }
  };

  // Handle toggling featured status of a project
  const handleToggleFeatured = async (projectId: number, featured: boolean) => {
    try {
      const updatedItem = await togglePortfolioFeatured(projectId, featured);

      // Update local state
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, isFeatured: updatedItem.is_featured } : p
        )
      );

      // Update featured slots count
      setFeaturedSlots((prev) =>
        prev
          ? {
              ...prev,
              used: featured ? prev.used + 1 : prev.used - 1,
              remaining: featured ? prev.remaining - 1 : prev.remaining + 1,
            }
          : null
      );
    } catch {
      // Could show a toast notification here
    }
  };

  // Handle portfolio share
  const handleShare = async () => {
    const url = `${window.location.origin}/portfolio/${user?.username || user?.id}`;
    const title = `${user?.full_name || "My"} Portfolio on Critvue`;
    const text = "Check out my creative growth journey powered by expert feedback!";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled or error occurred - silent fail
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  if (authLoading || loading) {
    return <PortfolioSkeleton />;
  }

  // Show error state if needed
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadPortfolio}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Upload Dialog */}
      <PortfolioUploadDialog
        open={uploadDialog.value}
        onOpenChange={uploadDialog.set}
        slotsRemaining={portfolioSlots?.remaining ?? 3}
        onSuccess={loadPortfolio}
      />

      {/* Add from Reviews Dialog */}
      <AddFromReviewsDialog
        open={addFromReviewsDialog.value}
        onOpenChange={addFromReviewsDialog.set}
        onSuccess={loadPortfolio}
      />

      {/* Floating Progress Indicator */}
      <motion.div
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-4 text-emerald-500" />
            <span className="font-semibold text-foreground">+{growthData.improvementScore}%</span>
            <span className="text-muted-foreground">growth</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-4 text-blue-500" />
            <span className="font-semibold text-foreground">{growthData.totalReviews}</span>
            <span className="text-muted-foreground">reviews</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            onClick={addFromReviewsDialog.setTrue}
          >
            <BadgeCheck className="size-3.5 text-emerald-500" />
            Add Verified
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            onClick={uploadDialog.setTrue}
          >
            <Plus className="size-3.5" />
            Upload
            {portfolioSlots && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {portfolioSlots.remaining}/3
              </Badge>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Hero Section with Growth Ring */}
      <motion.section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-purple-950/20" />

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute size-2 rounded-full bg-accent-blue/20"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              }}
              animate={{
                y: [null, Math.random() * -200 - 100],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <PortfolioHero user={user} growthData={growthData} onShare={handleShare} />

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="size-8 text-muted-foreground" />
          </motion.div>
        </div>
      </motion.section>

      {/* Growth Ring Visualization */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge variant="info" className="mb-4">
              <Sparkles className="size-3 mr-1" />
              Your Growth DNA
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Every critique shapes your journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how feedback transformed your work over time. Each ring represents a milestone in your creative evolution.
            </p>
          </motion.div>

          <GrowthRing data={growthData} milestones={milestones} />
        </div>
      </section>

      {/* Project Journey Cards - The Feedback Theater */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">
              <TrendingUp className="size-3 mr-1" />
              Transformation Stories
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              From feedback to breakthrough
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See the before and after of each project, powered by expert critique.
            </p>
          </motion.div>

          <div className="space-y-24">
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <ProjectJourneyCard
                  key={project.id}
                  project={project}
                  index={index}
                  onToggleFeatured={handleToggleFeatured}
                  featuredSlotsRemaining={featuredSlots?.remaining ?? 3}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 rounded-2xl bg-muted/30 border border-border/50"
              >
                <div className="size-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Sparkles className="size-10 text-accent-blue" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Start Your Growth Journey
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Submit your work for expert review to earn verified portfolio entries,
                  or add up to 3 self-documented projects to showcase your best work.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button onClick={() => router.push("/review/new")} className="gap-2">
                    <ArrowRight className="size-4" />
                    Submit for Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={addFromReviewsDialog.setTrue}
                    className="gap-2"
                  >
                    <BadgeCheck className="size-4" />
                    Add from Reviews
                  </Button>
                  <Button
                    variant="outline"
                    onClick={uploadDialog.setTrue}
                    className="gap-2"
                  >
                    <Upload className="size-4" />
                    Upload Work
                    {portfolioSlots && portfolioSlots.remaining > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {portfolioSlots.remaining}/3
                      </Badge>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Reviewer Network */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge variant="primary" className="mb-4">
              <Users className="size-3 mr-1" />
              Growth Network
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The experts behind your growth
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet the reviewers who shaped your creative journey with their expertise.
            </p>
          </motion.div>

          {reviewers.length > 0 ? (
            <ReviewerNetwork reviewers={reviewers} />
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-2xl">
              <Users className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Your reviewer network will appear here once you receive feedback from experts.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Growth Milestones */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge variant="success" className="mb-4">
              <Award className="size-3 mr-1" />
              Achievements
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Milestones unlocked
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Celebrate your progress with achievements earned through dedication to improvement.
            </p>
          </motion.div>

          <GrowthMilestones milestones={milestones} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to continue growing?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Submit your next project and get feedback from experts who can help you reach the next level.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={() => router.push("/review/new")}
              >
                Submit New Work
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2" onClick={handleShare}>
                <Share2 className="size-4" />
                Share Portfolio
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="min-h-[90vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="size-32 mx-auto rounded-full bg-muted" />
          <div className="h-10 w-64 mx-auto rounded-lg bg-muted" />
          <div className="h-6 w-96 mx-auto rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
