"use client";

/**
 * Public Portfolio Page
 *
 * View-only portfolio page for viewing another user's portfolio.
 * Shows the creator's growth journey through feedback and critique.
 */

import { useState, useEffect, use } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  MessageSquare,
  Award,
  ChevronDown,
  User,
} from "lucide-react";

// Portfolio Components
import { GrowthRing } from "@/components/portfolio/growth-ring";
import { ProjectJourneyCard } from "@/components/portfolio/project-journey-card";
import { ReviewerNetwork } from "@/components/portfolio/reviewer-network";
import { GrowthMilestones } from "@/components/portfolio/growth-milestones";

// API
import { getUserProfile, ProfileData } from "@/lib/api/profile";
import { getUserPortfolio, PortfolioItem } from "@/lib/api/portfolio";
import { getFileUrl } from "@/lib/api/client";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicPortfolioPage({ params }: PageProps) {
  const { id } = use(params);
  const userId = parseInt(id, 10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Portfolio data state
  const [growthData, setGrowthData] = useState<TransformedGrowthData>(defaultGrowthData);
  const [milestones, setMilestones] = useState<TransformedMilestone[]>(defaultMilestones);
  const [reviewers, setReviewers] = useState<TransformedReviewer[]>([]);
  const [projects, setProjects] = useState<JourneyProject[]>([]);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    loadPortfolio();
  }, [userId]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile and portfolio in parallel
      const [profile, portfolioResponse] = await Promise.all([
        getUserProfile(userId),
        getUserPortfolio(userId, { page_size: 50 }),
      ]);

      setProfileData(profile);

      // Calculate growth data from portfolio
      const totalReviews = portfolioResponse.items.reduce((sum, item) => sum + (item.rating ? 1 : 0), 0);
      const verifiedItems = portfolioResponse.items.filter(item => item.is_verified);

      setGrowthData({
        totalReviews,
        improvementScore: Math.min(100, totalReviews * 10),
        topCategory: portfolioResponse.items[0]?.content_type || "Design",
        growthPercentile: Math.min(99, totalReviews * 5),
        streakDays: 0,
        totalProjects: portfolioResponse.items.length,
      });

      // Transform projects to journey format
      const journeyProjects: JourneyProject[] = portfolioResponse.items.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        contentType: (p.content_type as JourneyProject["contentType"]) || "design",
        beforeImage: p.before_image_url ? getFileUrl(p.before_image_url) : null,
        afterImage: p.image_url ? getFileUrl(p.image_url) : null,
        isSelfDocumented: p.is_self_documented,
        isVerified: p.is_verified,
        isFeatured: p.is_featured,
        reviewsReceived: p.rating ? 1 : 0,
        projectUrl: p.project_url,
      }));
      setProjects(journeyProjects);

    } catch (err) {
      console.error("Failed to load portfolio:", err);
      setError("Failed to load portfolio data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PortfolioSkeleton />;
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || "Portfolio not found"}</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Progress Indicator */}
      <motion.div
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/profile/${userId}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            <span className="text-muted-foreground">Back to Profile</span>
          </Link>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-4 text-emerald-500" />
            <span className="font-semibold text-foreground">+{growthData.improvementScore}%</span>
            <span className="text-muted-foreground">growth</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-4 text-blue-500" />
            <span className="font-semibold text-foreground">{projects.length}</span>
            <span className="text-muted-foreground">projects</span>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <motion.section
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-purple-950/20" />

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
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

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={profileData.full_name}
                  className="size-16 rounded-full border-2 border-background shadow-lg object-cover"
                />
              ) : (
                <div className="size-16 rounded-full border-2 border-background shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="size-8 text-white" />
                </div>
              )}
              <div className="text-left">
                <h2 className="text-xl font-bold text-foreground">{profileData.full_name}</h2>
                <p className="text-sm text-muted-foreground">{profileData.title}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge variant="info" className="mb-6">
              <Sparkles className="size-3 mr-1" />
              Portfolio Journey
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Growth Through{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
              Feedback
            </span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Explore {profileData.full_name.split(' ')[0]}'s creative journey and see how expert feedback has shaped their work.
          </motion.p>

          {/* Stats Row */}
          <motion.div
            className="flex items-center justify-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{projects.length}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{growthData.totalReviews}</p>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-500">+{growthData.improvementScore}%</p>
              <p className="text-sm text-muted-foreground">Growth</p>
            </div>
          </motion.div>

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
              Growth DNA
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Every critique shapes the journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how feedback has transformed this creator's work over time.
            </p>
          </motion.div>

          <GrowthRing data={growthData} milestones={milestones} />
        </div>
      </section>

      {/* Project Journey Cards */}
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
                  featuredSlotsRemaining={0}
                  isPublicView={true}
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
                  No projects yet
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This creator hasn't added any projects to their portfolio yet.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Growth Milestones */}
      <section className="py-20 px-4 bg-muted/30">
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
              Achievements earned through dedication to improvement.
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
              Want to work with {profileData.full_name.split(' ')[0]}?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get in touch or request a review from this talented creator.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={`/profile/${userId}`}>
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  View Profile
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2">
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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="size-16 mx-auto rounded-full bg-muted" />
          <div className="h-10 w-64 mx-auto rounded-lg bg-muted" />
          <div className="h-6 w-96 mx-auto rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
