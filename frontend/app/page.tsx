"use client";

/**
 * Critvue Homepage - Mobile-First Redesign
 *
 * Complete redesign prioritizing 375px viewport with progressive enhancement.
 * Key principles:
 * - Mobile-first architecture (not desktop adapted down)
 * - Native mobile patterns (swipe, bottom sheets, thumb-zone CTAs)
 * - Touch targets ≥48px (exceeds 44px WCAG minimum)
 * - Progressive disclosure (reveal details on interaction)
 * - Performance-optimized (lazy loading, reduced mobile animations)
 *
 * Design Philosophy: Think app, not website.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Clock,
  Upload,
  MessageSquare,
  Sparkles,
  Users,
  Target,
  Zap,
  Shield,
  TrendingUp,
  Award,
  Code,
  Palette,
  Video,
  Mic,
  PenTool,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Twitter,
  Linkedin,
  Github,
  Mail,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Note: Section components to be added later when needed

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [perspective, setPerspective] = useState<"creator" | "reviewer">("creator");
  const [expandedHowItWorks, setExpandedHowItWorks] = useState<number | null>(null);
  const [showBottomCTA, setShowBottomCTA] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Track scroll for sticky bottom CTA
  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling past hero (400px - reduced for better conversion)
      setShowBottomCTA(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mobile-optimized animation config
  const getMobileAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
      delay: prefersReducedMotion ? 0 : delay,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section - Mobile-First */}
      <section className="relative pt-20 pb-12 px-6 md:pt-32 md:pb-20 overflow-hidden">
        {/* Background gradient orbs - Simplified on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 -left-1/4 w-64 h-64 md:w-96 md:h-96 bg-accent-blue/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-1/4 w-64 h-64 md:w-96 md:h-96 bg-accent-peach/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Mobile-first layout: Single column stacked */}
          <div className="flex flex-col gap-8 md:gap-12 lg:grid lg:grid-cols-2 lg:items-center">
            {/* Content - Mobile prioritized */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Human-centric badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Badge variant="info" size="lg" className="shadow-lg">
                  <Users className="size-4 mr-1.5" />
                  Real Human Feedback
                </Badge>
              </motion.div>

              {/* Headline - Dual value proposition */}
              <h1 className="text-[32px] leading-[1.15] sm:text-5xl lg:text-6xl font-bold text-gray-900 sm:leading-tight">
                Level up your work—
                <br />
                <motion.span
                  className="inline-block bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  or get paid to review it
                </motion.span>
              </h1>

              {/* Supporting text - Dual marketplace messaging */}
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-900">Creators level up fast.</span> Reviewers get paid for their expertise.
                Critvue blends AI + human insight to make feedback valuable for everyone.
              </p>

              {/* Social proof - Premium stats with gradients - Optimized for 320px */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-6">
                {/* Reviews Stat */}
                <motion.div
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 shadow-xl hover:shadow-2xl transition-all duration-500 group"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative text-center">
                    <motion.div
                      className="inline-flex items-center justify-center size-8 sm:size-12 md:size-14 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm mb-1.5 sm:mb-3 ring-1 sm:ring-2 ring-white/30"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ delay: 0.5, duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <CheckCircle className="size-4 sm:size-6 md:size-7 text-white drop-shadow-lg" />
                    </motion.div>
                    <motion.div
                      className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-0.5 sm:mb-1 drop-shadow-md"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.6, type: "spring", bounce: 0.5 }}
                    >
                      2.5K+
                    </motion.div>
                    <div className="text-[10px] sm:text-sm font-semibold text-white/90 tracking-wide uppercase leading-tight">
                      Reviews
                    </div>
                  </div>

                  {/* Animated shimmer effect */}
                  <motion.div
                    className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    animate={{ left: ["100%", "-100%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  />
                </motion.div>

                {/* Satisfaction Stat */}
                <motion.div
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-xl hover:shadow-2xl transition-all duration-500 group"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative text-center">
                    <motion.div
                      className="inline-flex items-center justify-center size-8 sm:size-12 md:size-14 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm mb-1.5 sm:mb-3 ring-1 sm:ring-2 ring-white/30"
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ delay: 0.6, duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Star className="size-4 sm:size-6 md:size-7 text-white drop-shadow-lg fill-white" />
                    </motion.div>
                    <motion.div
                      className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-0.5 sm:mb-1 drop-shadow-md"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.6, type: "spring", bounce: 0.5 }}
                    >
                      98%
                    </motion.div>
                    <div className="text-[10px] sm:text-sm font-semibold text-white/90 tracking-wide uppercase leading-tight">
                      Satisfaction
                    </div>
                  </div>

                  <motion.div
                    className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    animate={{ left: ["100%", "-100%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 0.5 }}
                  />
                </motion.div>

                {/* Reviewer Earnings Stat - NEW */}
                <motion.div
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 shadow-xl hover:shadow-2xl transition-all duration-500 group"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative text-center">
                    <motion.div
                      className="inline-flex items-center justify-center size-8 sm:size-12 md:size-14 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm mb-1.5 sm:mb-3 ring-1 sm:ring-2 ring-white/30"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ delay: 0.7, duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Award className="size-4 sm:size-6 md:size-7 text-white drop-shadow-lg" />
                    </motion.div>
                    <motion.div
                      className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-0.5 sm:mb-1 drop-shadow-md"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7, duration: 0.6, type: "spring", bounce: 0.5 }}
                    >
                      $50-150
                    </motion.div>
                    <div className="text-[10px] sm:text-sm font-semibold text-white/90 tracking-wide uppercase leading-tight">
                      Per Review
                    </div>
                  </div>

                  <motion.div
                    className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    animate={{ left: ["100%", "-100%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 1 }}
                  />
                </motion.div>
              </div>

              {/* CTAs - Dual focus: Creator and Reviewer paths */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.div
                  className="w-full sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    size="lg"
                    onClick={() => router.push("/register")}
                    className="w-full bg-gradient-to-r from-accent-blue to-blue-600 hover:shadow-2xl text-white font-semibold px-6 sm:px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] group touch-manipulation relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="relative flex items-center justify-center gap-2">
                      <Palette className="size-5" />
                      <span className="hidden min-[360px]:inline">Get Feedback</span>
                      <span className="min-[360px]:hidden">Get Feedback</span>
                      <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.div>
                <motion.div
                  className="w-full sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    size="lg"
                    onClick={() => router.push("/apply/expert")}
                    className="w-full bg-gradient-to-r from-accent-peach to-orange-500 hover:shadow-2xl text-white font-semibold px-6 sm:px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] group touch-manipulation relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="relative flex items-center justify-center gap-2">
                      <Award className="size-5" />
                      <span className="hidden min-[360px]:inline">Become a Reviewer</span>
                      <span className="min-[360px]:hidden">Become Reviewer</span>
                      <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Visual Demo - Animated Feedback Flow */}
            <motion.div
              className="relative aspect-video rounded-3xl bg-gradient-to-br from-accent-blue/5 to-accent-peach/5 border border-accent-blue/20 overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Animated feedback workflow visualization */}
              <div className="absolute inset-0 p-8 md:p-12">
                {/* Step 1: Upload Animation */}
                <motion.div
                  className="absolute top-8 left-8 right-8 md:top-12 md:left-12 md:right-12"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                        <Upload className="size-5 text-accent-blue" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full w-3/4 mb-2" />
                        <div className="h-2 bg-gray-200 rounded-full w-1/2" />
                      </div>
                    </div>
                    <motion.div
                      className="h-24 md:h-32 bg-gradient-to-br from-accent-blue/10 to-accent-peach/10 rounded-xl border-2 border-dashed border-accent-blue/30"
                      animate={{
                        borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.6)", "rgba(59, 130, 246, 0.3)"],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </motion.div>

                {/* Step 2: AI Analysis Animation */}
                <motion.div
                  className="absolute top-1/2 left-8 right-8 md:left-12 md:right-12 -translate-y-1/2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="size-5 text-accent-peach" />
                      </motion.div>
                      <span className="text-sm font-medium text-gray-700">Analyzing...</span>
                    </div>
                    <div className="space-y-2">
                      {[60, 80, 40].map((width, i) => (
                        <motion.div
                          key={i}
                          className="h-2 bg-gradient-to-r from-accent-blue/20 to-accent-peach/20 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ delay: 1.5 + i * 0.2, duration: 0.8 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Step 3: Feedback Result */}
                <motion.div
                  className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 md:right-12"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 2.5, duration: 0.6 }}
                >
                  <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="size-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">Review Complete</div>
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 2.8 + i * 0.1, duration: 0.3 }}
                            >
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Choose Your Path - Dual Marketplace Toggle */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/30">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-accent-blue/5 via-transparent to-accent-peach/5"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-10 md:mb-14"
            {...getMobileAnimation()}
          >
            <Badge variant="info" size="lg" className="mb-5 shadow-lg">
              <Users className="size-4 mr-1.5" />
              Choose Your Path
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              For creators and reviewers
            </h2>

            {/* Enhanced segmented control with gradient backgrounds */}
            <motion.div
              className="inline-flex items-center gap-1 p-1 sm:p-1.5 rounded-2xl bg-gradient-to-r from-white via-gray-50 to-white border-2 border-gray-200/50 shadow-2xl backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.button
                onClick={() => setPerspective("creator")}
                className={cn(
                  "relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl font-semibold sm:font-bold text-sm sm:text-base transition-all duration-500 min-h-[48px] touch-manipulation overflow-hidden",
                  perspective === "creator"
                    ? "text-white shadow-xl"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                whileHover={perspective !== "creator" ? { scale: 1.02 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                {perspective === "creator" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-500 via-accent-blue to-blue-600"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Palette className="size-5" />
                  <span className="whitespace-nowrap">I'm a Creator</span>
                </span>
              </motion.button>
              <motion.button
                onClick={() => setPerspective("reviewer")}
                className={cn(
                  "relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl font-semibold sm:font-bold text-sm sm:text-base transition-all duration-500 min-h-[48px] touch-manipulation overflow-hidden",
                  perspective === "reviewer"
                    ? "text-white shadow-xl"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                whileHover={perspective !== "reviewer" ? { scale: 1.02 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                {perspective === "reviewer" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-orange-500 via-accent-peach to-amber-500"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Award className="size-5" />
                  <span className="whitespace-nowrap">I'm a Reviewer</span>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Perspective content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={perspective}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {perspective === "creator" ? (
                <>
                  {/* Creator benefits grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        icon: Target,
                        title: "Actionable Feedback",
                        description: "Get specific, implementable suggestions on what matters most",
                        color: "blue"
                      },
                      {
                        icon: Clock,
                        title: "24h Turnaround",
                        description: "Most reviews completed within 24 hours—fast enough to keep shipping",
                        color: "blue"
                      },
                      {
                        icon: TrendingUp,
                        title: "Track Improvement",
                        description: "See your growth over time with detailed progress analytics",
                        color: "blue"
                      },
                      {
                        icon: Shield,
                        title: "100% Confidential",
                        description: "Your work stays private and secure—we never share without permission",
                        color: "blue"
                      },
                    ].map((item, i) => (
                      <BenefitCard key={i} {...item} delay={i * 0.05} />
                    ))}
                  </div>

                  {/* Creator CTA */}
                  <div className="flex justify-center pt-4">
                    <Button
                      size="lg"
                      onClick={() => router.push("/register")}
                      className="w-full sm:w-auto bg-gradient-to-r from-accent-blue to-blue-600 hover:shadow-2xl text-white font-semibold px-8 py-6 text-lg rounded-2xl min-h-[56px] group touch-manipulation"
                    >
                      <span className="flex items-center gap-2">
                        Get Your First Review Free
                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Reviewer benefits grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        icon: Award,
                        title: "Earn $50-150 per Review",
                        description: "Turn your expertise into income—set your own rates",
                        color: "peach"
                      },
                      {
                        icon: Users,
                        title: "Build Your Reputation",
                        description: "Showcase your expertise with a public profile and verified reviews",
                        color: "peach"
                      },
                      {
                        icon: Zap,
                        title: "Flexible Schedule",
                        description: "Review when it works for you—no commitments, just opportunities",
                        color: "peach"
                      },
                      {
                        icon: TrendingUp,
                        title: "Help Creators Succeed",
                        description: "Make a real impact by sharing insights that transform work",
                        color: "peach"
                      },
                    ].map((item, i) => (
                      <BenefitCard key={i} {...item} delay={i * 0.05} />
                    ))}
                  </div>

                  {/* Reviewer CTA */}
                  <div className="flex justify-center pt-4">
                    <Button
                      size="lg"
                      onClick={() => router.push("/apply/expert")}
                      className="w-full sm:w-auto bg-gradient-to-r from-accent-peach to-orange-500 hover:shadow-2xl text-white font-semibold px-8 py-6 text-lg rounded-2xl min-h-[56px] group touch-manipulation"
                    >
                      <span className="flex items-center gap-2">
                        Start Earning as a Reviewer
                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* How It Works - Mobile-First Vertical Stack */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            {...getMobileAnimation()}
          >
            <Badge variant="info" size="lg" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Three simple steps
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              From upload to iteration in minutes
            </p>
          </motion.div>

          {/* Mobile: Vertical stack | Desktop: Horizontal timeline */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            {[
              {
                step: "1",
                icon: Upload,
                title: "Upload Your Work",
                description: "Share your design, code, or creative work",
                details: "Drag and drop or tap to upload. Add context about what feedback you need most.",
              },
              {
                step: "2",
                icon: MessageSquare,
                title: "Get Feedback",
                description: "AI for speed, humans for depth",
                details: "Choose instant AI analysis for quick wins, or expert human reviews for strategic insights that transform your work.",
              },
              {
                step: "3",
                icon: Sparkles,
                title: "Iterate & Ship",
                description: "Apply feedback and improve",
                details: "Use actionable suggestions to refine your work and ship with confidence.",
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                className="flex-1"
                {...getMobileAnimation(index * 0.1)}
              >
                <div className="relative">
                  {/* Connecting line - Desktop only */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-accent-blue/30 to-transparent -z-10" />
                  )}

                  <button
                    onClick={() => setExpandedHowItWorks(expandedHowItWorks === index ? null : index)}
                    className="w-full text-left p-6 md:p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-accent-blue/30 hover:shadow-xl transition-all duration-300 min-h-[88px] touch-manipulation"
                  >
                    {/* Step number badge */}
                    <div className="inline-flex items-center justify-center size-12 rounded-full bg-accent-blue/10 text-accent-blue font-bold text-xl mb-4">
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-blue/5 mb-4">
                      <step.icon className="size-8 text-accent-blue" />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center justify-between">
                      {step.title}
                      <ChevronDown
                        className={cn(
                          "size-5 md:hidden transition-transform",
                          expandedHowItWorks === index && "rotate-180"
                        )}
                      />
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Expandable details - Mobile only */}
                    {expandedHowItWorks === index && (
                      <motion.p
                        className="mt-4 text-sm text-gray-500 md:hidden"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {step.details}
                      </motion.p>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Human Expertise Matters - NEW SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50/30 via-white to-orange-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-12 md:mb-16"
            {...getMobileAnimation()}
          >
            <Badge variant="info" size="lg" className="mb-4">
              <Shield className="size-4 mr-1.5" />
              Why Human Expertise
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What AI misses (and why you need real insight)
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              In the age of AI, human understanding is more valuable than ever. Here's what only human experts can provide.
            </p>
          </motion.div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Context & Nuance */}
            <motion.div
              className="relative p-8 rounded-3xl bg-white border-2 border-gray-200 hover:border-accent-blue/50 shadow-lg hover:shadow-2xl transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              <div className="relative">
                <div className="size-14 md:size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-accent-blue flex items-center justify-center mb-6 ring-2 ring-accent-blue/20 group-hover:ring-accent-blue/40 transition-all">
                  <Target className="size-7 md:size-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                  Context & Nuance
                </h3>
                <div className="space-y-3 text-sm md:text-base">
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-600">AI</span>
                    </div>
                    <p className="text-gray-600">Spots patterns in data</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-accent-blue flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="size-3.5 text-white" />
                    </div>
                    <p className="text-gray-900 font-semibold">Understands <em>why</em> they matter for your goals</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Empathy & Intent */}
            <motion.div
              className="relative p-8 rounded-3xl bg-white border-2 border-gray-200 hover:border-accent-peach/50 shadow-lg hover:shadow-2xl transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-peach/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              <div className="relative">
                <div className="size-14 md:size-16 rounded-2xl bg-gradient-to-br from-orange-500 to-accent-peach flex items-center justify-center mb-6 ring-2 ring-accent-peach/20 group-hover:ring-accent-peach/40 transition-all">
                  <Users className="size-7 md:size-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                  Empathy & Audience
                </h3>
                <div className="space-y-3 text-sm md:text-base">
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-600">AI</span>
                    </div>
                    <p className="text-gray-600">Measures metrics and engagement</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-accent-peach flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="size-3.5 text-white" />
                    </div>
                    <p className="text-gray-900 font-semibold">Feels the emotional impact on real people</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Strategic Thinking */}
            <motion.div
              className="relative p-8 rounded-3xl bg-white border-2 border-gray-200 hover:border-green-500/50 shadow-lg hover:shadow-2xl transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              <div className="relative">
                <div className="size-14 md:size-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 ring-2 ring-green-500/20 group-hover:ring-green-500/40 transition-all">
                  <TrendingUp className="size-7 md:size-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                  Strategic Judgment
                </h3>
                <div className="space-y-3 text-sm md:text-base">
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-600">AI</span>
                    </div>
                    <p className="text-gray-600">Processes data and recommends</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="size-3.5 text-white" />
                    </div>
                    <p className="text-gray-900 font-semibold">Makes judgment calls for your unique situation</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom CTA with compelling message */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-6">
              <strong className="text-gray-900">AI can analyze. Only humans can truly understand.</strong> That's why our expert reviewers combine industry experience with genuine empathy for your creative vision.
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/browse")}
              className="bg-gradient-to-r from-accent-blue to-accent-peach hover:shadow-xl text-white font-semibold px-6 sm:px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] group touch-manipulation"
            >
              <span className="flex items-center gap-2">
                Meet Our Expert Reviewers
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Content Types - What You Can Get Reviewed */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-12 md:mb-16"
            {...getMobileAnimation()}
          >
            <Badge variant="info" size="lg" className="mb-4">
              What We Review
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get feedback on any creative work
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              From code to design, writing to video—we've got you covered
            </p>
          </motion.div>

          {/* Content type grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              { icon: Code, label: "Code", color: "blue" },
              { icon: Palette, label: "Design", color: "purple" },
              { icon: Video, label: "Video", color: "red" },
              { icon: PenTool, label: "Writing", color: "green" },
              { icon: Mic, label: "Audio", color: "orange" },
              { icon: ImageIcon, label: "Art", color: "pink" },
            ].map((type, index) => (
              <motion.div
                key={type.label}
                className="group relative"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -4 }}
              >
                <div className="relative p-6 sm:p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-accent-blue/50 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden">
                  {/* Decorative gradient on hover */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                    type.color === "blue" && "bg-gradient-to-br from-blue-500 to-indigo-500",
                    type.color === "purple" && "bg-gradient-to-br from-purple-500 to-pink-500",
                    type.color === "red" && "bg-gradient-to-br from-red-500 to-orange-500",
                    type.color === "green" && "bg-gradient-to-br from-green-500 to-emerald-500",
                    type.color === "orange" && "bg-gradient-to-br from-orange-500 to-amber-500",
                    type.color === "pink" && "bg-gradient-to-br from-pink-500 to-rose-500"
                  )} />

                  {/* Icon */}
                  <div className="relative flex flex-col items-center gap-3">
                    <motion.div
                      className={cn(
                        "size-12 sm:size-14 md:size-16 rounded-xl flex items-center justify-center ring-2 ring-offset-2 transition-all duration-300",
                        type.color === "blue" && "bg-gradient-to-br from-blue-500 to-indigo-500 text-white ring-blue-500/20 group-hover:ring-blue-500/40",
                        type.color === "purple" && "bg-gradient-to-br from-purple-500 to-pink-500 text-white ring-purple-500/20 group-hover:ring-purple-500/40",
                        type.color === "red" && "bg-gradient-to-br from-red-500 to-orange-500 text-white ring-red-500/20 group-hover:ring-red-500/40",
                        type.color === "green" && "bg-gradient-to-br from-green-500 to-emerald-500 text-white ring-green-500/20 group-hover:ring-green-500/40",
                        type.color === "orange" && "bg-gradient-to-br from-orange-500 to-amber-500 text-white ring-orange-500/20 group-hover:ring-orange-500/40",
                        type.color === "pink" && "bg-gradient-to-br from-pink-500 to-rose-500 text-white ring-pink-500/20 group-hover:ring-pink-500/40"
                      )}
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <type.icon className="size-6 sm:size-7 md:size-8" />
                    </motion.div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {type.label}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings for Reviewers - MUST HAVE SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-12 md:mb-16"
            {...getMobileAnimation()}
          >
            <Badge variant="success" size="lg" className="mb-4">
              <Award className="size-4 mr-1.5" />
              For Reviewers
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Turn your expertise into income
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Join our community of expert reviewers earning $50-$150 per review on their own schedule
            </p>
          </motion.div>

          {/* Earnings highlights grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {/* Average Earnings */}
            <motion.div
              className="relative p-8 rounded-3xl bg-white border-2 border-green-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 ring-2 ring-green-500/20">
                  <Award className="size-8 text-white" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">$50-150</div>
                <div className="text-lg font-semibold text-gray-700 mb-2">Per Review</div>
                <p className="text-sm text-gray-600">
                  Set your own rates based on your expertise and review complexity
                </p>
              </div>
            </motion.div>

            {/* Payment Speed */}
            <motion.div
              className="relative p-8 rounded-3xl bg-white border-2 border-blue-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-6 ring-2 ring-blue-500/20">
                  <Clock className="size-8 text-white" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">24h</div>
                <div className="text-lg font-semibold text-gray-700 mb-2">Payment Release</div>
                <p className="text-sm text-gray-600">
                  Get paid 24 hours after review acceptance—fast, reliable payments
                </p>
              </div>
            </motion.div>

            {/* Flexibility */}
            <motion.div
              className="relative p-8 rounded-3xl bg-white border-2 border-orange-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-6 ring-2 ring-orange-500/20">
                  <Zap className="size-8 text-white" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">100%</div>
                <div className="text-lg font-semibold text-gray-700 mb-2">Flexible</div>
                <p className="text-sm text-gray-600">
                  Work when you want—no minimums, no commitments, just opportunities
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sample earning scenarios */}
          <motion.div
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-200 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Real earning examples
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Part-Time",
                  reviews: "2-3 reviews/week",
                  earnings: "$400-900",
                  period: "per month",
                  color: "blue"
                },
                {
                  title: "Active",
                  reviews: "5-7 reviews/week",
                  earnings: "$1,000-2,100",
                  period: "per month",
                  color: "green"
                },
                {
                  title: "Expert",
                  reviews: "10+ reviews/week",
                  earnings: "$2,000-6,000",
                  period: "per month",
                  color: "purple"
                },
              ].map((scenario, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all duration-300",
                    scenario.color === "blue" && "border-blue-200 bg-blue-50/50 hover:border-blue-300",
                    scenario.color === "green" && "border-green-200 bg-green-50/50 hover:border-green-300",
                    scenario.color === "purple" && "border-purple-200 bg-purple-50/50 hover:border-purple-300"
                  )}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-2">{scenario.title}</div>
                    <div className="text-sm text-gray-600 mb-4">{scenario.reviews}</div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{scenario.earnings}</div>
                    <div className="text-sm text-gray-500">{scenario.period}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              * Actual earnings vary based on review complexity, your expertise level, and time invested
            </p>
          </motion.div>

          {/* How payouts work */}
          <motion.div
            className="grid md:grid-cols-2 gap-8 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-200 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="size-6 text-green-500" />
                How you get paid
              </h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">1</span>
                  </div>
                  <span>Complete a review and submit to the creator</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">2</span>
                  </div>
                  <span>Creator accepts review (or auto-accepts after 48 hours)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">3</span>
                  </div>
                  <span>Payment released to your account within 24 hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">4</span>
                  </div>
                  <span>Withdraw anytime via Stripe Connect</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-200 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="size-6 text-blue-500" />
                Payment protection
              </h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Escrow protection</strong> - Funds held securely until acceptance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Auto-accept</strong> - Get paid even if creator doesn't respond</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>Dispute resolution</strong> - Fair mediation for any conflicts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-500 mt-0.5 shrink-0" />
                  <span><strong>100% guarantee</strong> - You get paid for quality work, always</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Button
              size="lg"
              onClick={() => router.push("/apply/expert")}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-10 py-7 text-lg rounded-2xl min-h-[60px] shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              <span className="flex items-center gap-2">
                Apply to Become a Reviewer
                <ArrowRight className="size-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Application review typically takes 24-48 hours
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing - Simple & Transparent */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-12 md:mb-16"
            {...getMobileAnimation()}
          >
            <Badge variant="success" size="lg" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose your feedback style
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              From free community reviews to expert critiques—scale as you grow
            </p>
          </motion.div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <motion.div
              className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm mb-4">
                  <CheckCircle className="size-4" />
                  Free Forever
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Free</h3>
                <p className="text-gray-600">Get started with community reviews</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-gray-900">$0</span>
                  <span className="text-xl text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "3 community reviews/month",
                  "Quick turnaround",
                  "All content types supported",
                  "Perfect for quick iterations",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                onClick={() => router.push("/review/new")}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="hidden min-[360px]:inline">Start Free</span>
                <span className="min-[360px]:hidden">Start Free</span>
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </motion.div>

            {/* Pro Subscription - MOST POPULAR */}
            <motion.div
              className="relative p-8 sm:p-10 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-accent-blue/50 md:scale-105"
              style={{
                background: "linear-gradient(135deg, #fff 0%, #f0f7ff 100%)",
                boxShadow: "0 0 40px rgba(59, 130, 246, 0.2)",
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -6, boxShadow: "0 0 60px rgba(59, 130, 246, 0.3)" }}
            >
              {/* Most Popular badge */}
              <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-accent-blue to-blue-600 text-white font-bold text-sm rounded-bl-2xl">
                Most Popular
              </div>

              <div className="mb-6 mt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-4">
                  <Sparkles className="size-4" />
                  Best Value
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Pro</h3>
                <p className="text-gray-600">Unlimited reviews plus expert discounts</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-gray-900">$9</span>
                  <span className="text-xl text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited community reviews",
                  "15% discount on expert reviews",
                  "Priority queue for experts",
                  "All Free features included",
                  "Cancel anytime",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-accent-blue mt-0.5 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                onClick={() => router.push("/pricing")}
                className="w-full bg-gradient-to-r from-accent-blue to-blue-600 hover:from-accent-blue/90 hover:to-blue-600/90 text-white font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="hidden min-[360px]:inline">Upgrade to Pro</span>
                <span className="min-[360px]:hidden">Get Pro</span>
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </motion.div>

            {/* Expert Reviews */}
            <motion.div
              className="relative p-8 sm:p-10 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-accent-peach/50"
              style={{
                background: "linear-gradient(135deg, #fff 0%, #fff5f0 100%)",
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm mb-4">
                  <Award className="size-4" />
                  Human Expertise
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Expert Reviews</h3>
                <p className="text-gray-600">Context, empathy & strategic insight AI can't replicate</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-gray-900">$50</span>
                  <span className="text-xl text-gray-600">- $150</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">per review</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Professional human reviewers",
                  "Personalized critique for your goals",
                  "Industry-specific expertise",
                  "24-hour turnaround",
                  "Direct communication",
                  "100% satisfaction guarantee",
                  "15% off with Pro subscription",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-accent-peach mt-0.5 shrink-0" />
                    <span className={cn("text-gray-700", i === 6 && "font-semibold text-accent-blue")}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                onClick={() => router.push("/browse")}
                className="w-full bg-gradient-to-r from-accent-peach to-orange-500 hover:from-accent-peach/90 hover:to-orange-500/90 text-white font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="hidden min-[360px]:inline">Browse Reviewers</span>
                <span className="min-[360px]:hidden">Browse Experts</span>
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </motion.div>
          </div>

          {/* Trust footer */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-gray-500">
              <Shield className="inline size-4 mr-1" />
              All payments secured • Full refund if not satisfied
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials - Social Proof */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-12 md:mb-16"
            {...getMobileAnimation()}
          >
            <Badge variant="success" size="lg" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Loved by creators and reviewers
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of creators leveling up—and experts earning from their knowledge
            </p>
          </motion.div>

          {/* Testimonial grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                quote: "The structured feedback format helped me see patterns in my work I'd never noticed. But it was the human reviewer's insight on WHY those patterns mattered for my specific audience that actually improved my work.",
                author: "Sarah Chen",
                role: "Frontend Developer",
                type: "creator",
                rating: 5,
                avatar: "SC",
              },
              {
                quote: "I earned $2,400 last month reviewing designs in my spare time. It's amazing getting paid for what I already love doing—and helping creators improve their work feels genuinely rewarding.",
                author: "Alex Rivera",
                role: "Senior Product Designer • Reviewer",
                type: "reviewer",
                rating: 5,
                avatar: "AR",
              },
              {
                quote: "The expert caught cultural nuances and emotional resonance that no AI could understand. They saw my design through the eyes of real users, not just algorithms.",
                author: "Marcus Johnson",
                role: "UX Designer",
                type: "creator",
                rating: 5,
                avatar: "MJ",
              },
              {
                quote: "As a freelance developer, Critvue gives me a steady income stream between projects. I can review 5-10 codebases a week and earn $800-1500. Complete flexibility, no meetings.",
                author: "Jamie Park",
                role: "Full-Stack Developer • Reviewer",
                type: "reviewer",
                rating: 5,
                avatar: "JP",
              },
              {
                quote: "I've tried AI tools, but Critvue's human reviewers actually understand context and intent. They give strategic advice, not just surface-level observations.",
                author: "Priya Patel",
                role: "Content Creator",
                type: "creator",
                rating: 5,
                avatar: "PP",
              },
              {
                quote: "I review writing samples while my kids nap. $50-100 per review, 30-45 minutes each. I've made over $6K in 3 months. It's the perfect side income for a stay-at-home parent with expertise.",
                author: "Taylor Morrison",
                role: "Former Editor • Reviewer",
                type: "reviewer",
                rating: 5,
                avatar: "TM",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className={cn(
                  "relative p-6 sm:p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300",
                  testimonial.type === "reviewer"
                    ? "border-2 border-green-200"
                    : "border border-gray-200"
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                {/* Reviewer badge */}
                {testimonial.type === "reviewer" && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="success" size="sm">
                      <Award className="size-3 mr-1" />
                      Reviewer
                    </Badge>
                  </div>
                )}

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 leading-relaxed mb-6 text-sm sm:text-base">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Thumb Zone Optimized */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-accent-blue via-accent-blue/90 to-accent-peach">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            {...getMobileAnimation()}
            className="space-y-6 md:space-y-8"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Ready to level up?
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Join 2,500+ creators getting better feedback
            </p>

            {/* CTAs - Full width on mobile */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push("/register")}
                className="w-full sm:w-auto bg-white text-accent-blue hover:bg-gray-50 font-semibold px-6 sm:px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-xl hover:shadow-2xl transition-all duration-300 touch-manipulation"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="hidden min-[360px]:inline">Get Your First Review Free</span>
                  <span className="min-[360px]:hidden">First Review Free</span>
                  <ArrowRight className="size-5" />
                </span>
              </Button>
              <Button
                size="lg"
                onClick={() => router.push("/browse")}
                className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-6 sm:px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[48px] transition-all duration-300 touch-manipulation"
              >
                Browse Reviewers
              </Button>
            </div>

            {/* Trust signal */}
            <p className="text-sm text-white/80">
              No credit card required • Free AI reviews • 5 min setup
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer - Minimal on mobile */}
      <Footer router={router} />

      {/* Sticky Bottom CTA Bar - Mobile Only */}
      <AnimatePresence>
        {showBottomCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl lg:hidden"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="w-full bg-gradient-to-r from-accent-blue to-accent-peach text-white font-semibold text-base sm:text-lg rounded-2xl min-h-[56px] shadow-lg hover:shadow-xl transition-all duration-300 group touch-manipulation"
            >
              <motion.span
                className="flex items-center justify-center gap-2"
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden min-[360px]:inline">Get Your First Review Free</span>
                <span className="min-[360px]:hidden">First Review Free</span>
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </motion.span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Benefit Card Component
 * Mobile-optimized benefit cards with icons
 */
function BenefitCard({
  icon: Icon,
  title,
  description,
  color,
  delay = 0,
}: {
  icon: any;
  title: string;
  description: string;
  color: "blue" | "peach";
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "group relative p-5 sm:p-6 md:p-7 rounded-2xl border-2 transition-all duration-500 touch-manipulation overflow-hidden",
        "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl",
        color === "blue"
          ? "border-accent-blue/20 hover:border-accent-blue/50"
          : "border-accent-peach/20 hover:border-accent-peach/50"
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        delay: prefersReducedMotion ? 0 : delay,
        type: "spring",
        bounce: 0.3,
      }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      {/* Gradient background overlay on hover */}
      <motion.div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          color === "blue"
            ? "bg-gradient-to-br from-accent-blue/5 via-blue-50/50 to-accent-blue/10"
            : "bg-gradient-to-br from-accent-peach/5 via-orange-50/50 to-accent-peach/10"
        )}
      />

      {/* Decorative corner accent */}
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 opacity-10 blur-2xl rounded-full transition-all duration-500 group-hover:opacity-20",
          color === "blue" ? "bg-accent-blue" : "bg-accent-peach"
        )}
      />

      <div className="relative">
        {/* Enhanced icon with gradient background */}
        <motion.div
          className={cn(
            "inline-flex items-center justify-center size-11 sm:size-12 md:size-14 rounded-xl mb-3 sm:mb-4 md:mb-5 ring-2 ring-offset-2 transition-all duration-300",
            color === "blue"
              ? "bg-gradient-to-br from-blue-500 to-accent-blue text-white ring-accent-blue/20 group-hover:ring-accent-blue/40"
              : "bg-gradient-to-br from-orange-500 to-accent-peach text-white ring-accent-peach/20 group-hover:ring-accent-peach/40"
          )}
          whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <Icon className="size-5 sm:size-6 md:size-7" />
        </motion.div>

        {/* Title and description */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-2.5 group-hover:text-gray-800 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
          {description}
        </p>
      </div>

      {/* Animated shimmer on hover */}
      <motion.div
        className="absolute top-0 -left-full h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
        animate={{ left: ["100%", "-100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
      />
    </motion.div>
  );
}


/**
 * Footer Component
 * Modern, comprehensive footer with dark theme, newsletter signup, social links
 * Mobile: Accordion sections with sticky CTA bar
 * Desktop: Multi-column layout with inline legal links
 */
function Footer({ router }: { router: any }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Browse Reviews", href: "/browse" },
        { label: "Request Review", href: "/review/new" },
        { label: "Become Reviewer", href: "/apply/expert" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Help Center", href: "/help" },
        { label: "API Docs", href: "/docs/api" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact", href: "/contact" },
        { label: "FAQ", href: "/faq" },
        { label: "Community", href: "/community" },
        { label: "System Status", href: "/status" },
      ],
    },
  ];

  const socialLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      href: "https://twitter.com/critvue",
      ariaLabel: "Follow us on Twitter",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "https://linkedin.com/company/critvue",
      ariaLabel: "Connect with us on LinkedIn",
    },
    {
      name: "GitHub",
      icon: Github,
      href: "https://github.com/critvue",
      ariaLabel: "View our GitHub repository",
    },
    {
      name: "Discord",
      icon: MessageSquare,
      href: "https://discord.gg/critvue",
      ariaLabel: "Join our Discord community",
    },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Accessibility", href: "/accessibility" },
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubscribed(true);
    setIsSubmitting(false);
    setEmail("");

    // Reset success message after 5 seconds
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <>
      {/* Main Footer */}
      <footer className="bg-gray-900 text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
          {/* Desktop Layout - Grid */}
          <div className="hidden md:grid md:grid-cols-5 md:gap-8 md:mb-12">
            {/* Column 1: Branding + Newsletter */}
            <div className="col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent mb-3">
                Critvue
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
                Transform feedback into your creative advantage
              </p>

              {/* Newsletter Signup */}
              <div className="mt-8">
                <h4 className="text-base font-semibold text-white mb-3">
                  Stay updated
                </h4>
                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-green-400 text-sm"
                  >
                    <CheckCircle className="size-4" />
                    <span>Thanks for subscribing!</span>
                  </motion.div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
                      aria-label="Email address for newsletter"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "..." : "Subscribe"}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Columns 2-4: Link Sections */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-white mb-4 text-sm">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => router.push(link.href)}
                        className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center group"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile Layout - Accordion + Branding */}
          <div className="md:hidden">
            {/* Brand */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent mb-3">
                Critvue
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Transform feedback into your creative advantage
              </p>
            </div>

            {/* Newsletter Signup - Mobile */}
            <div className="mb-8 pb-8 border-b border-gray-800">
              <h4 className="text-base font-semibold text-white mb-3">
                Stay updated
              </h4>
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-green-400 text-sm"
                >
                  <CheckCircle className="size-4" />
                  <span>Thanks for subscribing!</span>
                </motion.div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all min-h-[48px]"
                    aria-label="Email address for newsletter"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </Button>
                </form>
              )}
            </div>

            {/* Accordion Sections */}
            <div className="space-y-4 mb-8">
              {footerSections.map((section) => (
                <div key={section.title} className="border-b border-gray-800 pb-4 last:border-b-0">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === section.title ? null : section.title
                      )
                    }
                    className="w-full flex items-center justify-between font-semibold text-white min-h-[44px] touch-manipulation"
                    aria-expanded={expandedSection === section.title}
                    aria-controls={`footer-section-${section.title}`}
                  >
                    <span className="text-base">{section.title}</span>
                    <ChevronDown
                      className={cn(
                        "size-5 transition-transform duration-200",
                        expandedSection === section.title && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedSection === section.title && (
                      <motion.ul
                        id={`footer-section-${section.title}`}
                        initial={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
                        animate={prefersReducedMotion ? {} : { height: "auto", opacity: 1 }}
                        exit={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden space-y-1 mt-3"
                      >
                        {section.links.map((link) => (
                          <li key={link.label}>
                            <button
                              onClick={() => router.push(link.href)}
                              className="text-gray-400 hover:text-white transition-colors text-sm min-h-[44px] flex items-center py-2 touch-manipulation w-full text-left"
                            >
                              {link.label}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media Links - Both Desktop & Mobile */}
          <div className="flex justify-center md:justify-start gap-4 mb-8 pb-8 border-b border-gray-800">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.ariaLabel}
                  className="flex items-center justify-center size-10 md:size-9 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-gray-900"
                  whileHover={prefersReducedMotion ? {} : { y: -2 }}
                  whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                >
                  <Icon className="size-5 md:size-4" />
                </motion.a>
              );
            })}
          </div>

          {/* Bottom Bar - Copyright & Legal Links */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-400">
            <p className="text-center md:text-left">
              © 2025 Critvue. All rights reserved.
            </p>

            {/* Legal Links */}
            <nav aria-label="Legal links">
              <ul className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
                {legalLinks.map((link, index) => (
                  <li key={link.label}>
                    <button
                      onClick={() => router.push(link.href)}
                      className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA Bar - Only visible on mobile */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="px-6 py-3">
          <Button
            onClick={() => router.push("/register")}
            className="w-full h-14 bg-gradient-to-r from-accent-blue to-accent-peach hover:shadow-lg text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 touch-manipulation"
          >
            Get Started Free
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
