"use client";

/**
 * How It Works Page - Critvue
 *
 * Research-backed conversion-optimized landing page that addresses both creators and reviewers.
 * Key principles:
 * - Dual-audience toggle (creators/reviewers) with dynamic content
 * - Mobile-first responsive design with proper touch targets
 * - Scroll-triggered animations with reduced motion support
 * - Brand-consistent colors, typography, and spacing
 * - Comprehensive FAQ accordion with smooth animations
 * - Social proof through testimonials
 * - Strategic CTAs throughout the journey
 *
 * Brand Compliance:
 * - Colors: accent-blue (#3B82F6), accent-peach (#F97316)
 * - Spacing: 8px grid system
 * - Typography: Inter font family with proper hierarchy
 * - Glass morphism effects for cards
 * - Gradient backgrounds for visual interest
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Upload,
  Sparkles,
  Users,
  MessageSquare,
  CheckCircle,
  Target,
  Award,
  PenTool,
  TrendingUp,
  ChevronDown,
  Star,
  Shield,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HowItWorksPage() {
  const router = useRouter();
  const [perspective, setPerspective] = useState<"creator" | "reviewer">("creator");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mobile-optimized animation config
  const getFadeInAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: {
      duration: prefersReducedMotion ? 0 : 0.5,
      delay: prefersReducedMotion ? 0 : delay,
    },
  });

  // Content for dynamic sections
  const creatorSteps = [
    {
      icon: Upload,
      headline: "Upload in seconds",
      description: "Code, design, video, writing—any creative work. Add context about what feedback you need.",
    },
    {
      icon: Sparkles,
      headline: "Pick your perfect reviewer",
      description: "AI for instant insights, Community for peer perspective, or Expert for professional validation.",
    },
    {
      icon: Target,
      headline: "We find the right eyes for your work",
      description: "Our system matches you with reviewers based on expertise and your specific needs. Track progress in real-time.",
    },
    {
      icon: MessageSquare,
      headline: "Feedback you can actually use",
      description: "Detailed critique, specific suggestions, and next steps. Not satisfied? Our satisfaction guarantee has you covered.",
    },
  ];

  const reviewerSteps = [
    {
      icon: Award,
      headline: "Share your expertise",
      description: "Community reviewers start immediately. Expert reviewers undergo vetting with portfolio review.",
    },
    {
      icon: Target,
      headline: "Review work you're passionate about",
      description: "Choose projects matching your expertise. Set your availability and review preferences.",
    },
    {
      icon: PenTool,
      headline: "Use our intuitive review tools",
      description: "Annotate, comment, and provide structured feedback. Templates help you give comprehensive reviews faster.",
    },
    {
      icon: TrendingUp,
      headline: "Grow as you help others grow",
      description: "Earn reputation points, unlock expert reviewer status, and get paid for your insights.",
    },
  ];

  const currentSteps = perspective === "creator" ? creatorSteps : reviewerSteps;

  // FAQ content
  const creatorFAQs = [
    {
      question: "What if I don't like the feedback?",
      answer: "We offer a 100% satisfaction guarantee. If you're not happy with an expert review, we'll provide a full refund, no questions asked.",
    },
    {
      question: "How are expert reviewers vetted?",
      answer: "Expert reviewers undergo a rigorous vetting process including portfolio review, test feedback evaluation, and background verification. Only professionals with 5+ years of experience and proven track records are approved.",
    },
    {
      question: "Can I request revisions?",
      answer: "Yes! Expert reviews include one round of follow-up questions. You can ask for clarification or additional feedback on specific areas.",
    },
  ];

  const reviewerFAQs = [
    {
      question: "How much can I earn as a reviewer?",
      answer: "Community reviewers build reputation for free. Expert reviewers earn $50-150 per review depending on complexity. Top reviewers completing 10+ reviews per month can earn $500-1500.",
    },
    {
      question: "How long does a review take?",
      answer: "Most reviews take 30-60 minutes for community reviews, 1-2 hours for expert reviews. You set your own pace and availability.",
    },
    {
      question: "What if a creator disputes my feedback?",
      answer: "Critvue protects reviewers. All disputes go through our mediation process. If feedback is constructive and meets quality standards, payment is guaranteed regardless of creator satisfaction.",
    },
  ];

  const allFAQs = [...creatorFAQs, ...reviewerFAQs];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 px-6 md:pt-32 md:pb-20 overflow-hidden">
        {/* Background gradient orbs */}
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
          <motion.div
            className="text-center mb-10 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Get expert eyes on your work{" "}
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
                in 24 hours
              </motion.span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed">
              Submit code, design, or video. Choose AI, community, or expert review. Grow faster with feedback that actually helps.
            </p>

            {/* Segmented Control Toggle */}
            <motion.div
              className="inline-flex items-center gap-1 p-1 sm:p-1.5 rounded-2xl bg-gradient-to-r from-white via-gray-50 to-white border-2 border-gray-200/50 shadow-xl backdrop-blur-sm mb-8"
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
                aria-pressed={perspective === "creator"}
                aria-label="View information for creators"
              >
                {perspective === "creator" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-500 via-accent-blue to-blue-600"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">I'm a Creator</span>
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
                aria-pressed={perspective === "reviewer"}
                aria-label="View information for reviewers"
              >
                {perspective === "reviewer" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-orange-500 via-accent-peach to-amber-500"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap">I'm a Reviewer</span>
              </motion.button>
            </motion.div>

            {/* Primary CTA */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                size="lg"
                onClick={() =>
                  router.push(perspective === "creator" ? "/auth/register" : "/apply/expert")
                }
                className={cn(
                  "w-full sm:w-auto font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-xl hover:shadow-2xl transition-all duration-300 touch-manipulation",
                  perspective === "creator"
                    ? "bg-gradient-to-r from-accent-blue to-blue-600 hover:from-accent-blue/90 hover:to-blue-600/90 text-white"
                    : "bg-gradient-to-r from-accent-peach to-orange-500 hover:from-accent-peach/90 hover:to-orange-500/90 text-white"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {perspective === "creator" ? "Start Your First Review Free" : "Become a Reviewer"}
                  <ArrowRight className="size-5" />
                </span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div className="text-center mb-12 md:mb-16" {...getFadeInAnimation()}>
            <Badge variant="info" size="lg" className="mb-4">
              {perspective === "creator" ? "For Creators" : "For Reviewers"}
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {perspective === "creator"
                ? "Four simple steps to better feedback"
                : "Start earning with your expertise"}
            </p>
          </motion.div>

          {/* Desktop: 2x2 Bento Grid | Mobile: Vertical Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {currentSteps.map((step, index) => (
              <motion.div
                key={index}
                className={cn(
                  "group relative p-6 sm:p-8 rounded-3xl border-2 transition-all duration-500 overflow-hidden",
                  "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl",
                  perspective === "creator"
                    ? "border-accent-blue/20 hover:border-accent-blue/50"
                    : "border-accent-peach/20 hover:border-accent-peach/50"
                )}
                {...getFadeInAnimation(index * 0.1)}
                whileHover={{ y: -4 }}
              >
                {/* Gradient overlay */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    perspective === "creator"
                      ? "bg-gradient-to-br from-accent-blue/5 to-blue-50/50"
                      : "bg-gradient-to-br from-accent-peach/5 to-orange-50/50"
                  )}
                />

                {/* Step number */}
                <div
                  className={cn(
                    "inline-flex items-center justify-center size-12 rounded-full font-bold text-xl mb-4 relative z-10",
                    perspective === "creator"
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "bg-accent-peach/10 text-accent-peach"
                  )}
                >
                  {index + 1}
                </div>

                {/* Icon */}
                <motion.div
                  className={cn(
                    "inline-flex items-center justify-center size-16 rounded-2xl mb-5 ring-2 ring-offset-2 transition-all duration-300 relative z-10",
                    perspective === "creator"
                      ? "bg-gradient-to-br from-blue-500 to-accent-blue text-white ring-accent-blue/20 group-hover:ring-accent-blue/40"
                      : "bg-gradient-to-br from-orange-500 to-accent-peach text-white ring-accent-peach/20 group-hover:ring-accent-peach/40"
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <step.icon className="size-8" />
                </motion.div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    {step.headline}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>

                {/* Visual placeholder - decorative element */}
                <div
                  className={cn(
                    "absolute bottom-0 right-0 w-32 h-32 opacity-5 blur-2xl rounded-full transition-all duration-500 group-hover:opacity-10",
                    perspective === "creator" ? "bg-accent-blue" : "bg-accent-peach"
                  )}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div className="text-center mb-12 md:mb-16" {...getFadeInAnimation()}>
            <Badge variant="success" size="lg" className="mb-4">
              Compare Options
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose your review type
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              From instant AI feedback to expert human critique
            </p>
          </motion.div>

          {/* Desktop: Table | Mobile: Swipe Cards */}
          <div className="hidden md:block">
            <motion.div
              className="overflow-x-auto rounded-3xl border-2 border-gray-200 shadow-xl bg-white"
              {...getFadeInAnimation(0.2)}
            >
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-accent-blue uppercase tracking-wider border-l-2 border-accent-blue/20">
                      AI Review
                    </th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-green-700 uppercase tracking-wider border-l-2 border-green-200">
                      Community Review
                    </th>
                    <th className="px-6 py-5 text-center text-sm font-bold text-accent-peach uppercase tracking-wider border-l-2 border-accent-peach/20">
                      Expert Review
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 font-semibold text-gray-900">Cost</td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-blue/10">
                      <span className="font-bold text-accent-blue">Free forever</span>
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-green-100">
                      <span className="font-bold text-green-700">Free (3/month)</span>
                      <br />
                      <span className="text-sm text-gray-600">or Pro ($9/month)</span>
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-peach/10">
                      <span className="font-bold text-accent-peach">$50-150</span>
                      <br />
                      <span className="text-sm text-gray-600">per review</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 font-semibold text-gray-900">Turnaround</td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-blue/10 font-medium text-gray-700">
                      Instant
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-green-100 font-medium text-gray-700">
                      24-48 hours
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-peach/10 font-medium text-gray-700">
                      24 hours guaranteed
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 font-semibold text-gray-900">Best For</td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-blue/10 text-sm text-gray-700">
                      Quick iterations, syntax checks
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-green-100 text-sm text-gray-700">
                      Peer perspective, general feedback
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-peach/10 text-sm text-gray-700">
                      Professional validation, career-critical work
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 font-semibold text-gray-900">Depth</td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-blue/10 text-sm text-gray-700">
                      Technical analysis
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-green-100 text-sm text-gray-700">
                      Thoughtful critique
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-peach/10 text-sm text-gray-700">
                      Industry-specific expertise
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 font-semibold text-gray-900">Reviewers</td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-blue/10 text-sm text-gray-700">
                      AI agents
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-green-100 text-sm text-gray-700">
                      Verified creators
                    </td>
                    <td className="px-6 py-5 text-center border-l-2 border-accent-peach/10 text-sm text-gray-700">
                      Vetted professionals
                    </td>
                  </tr>
                </tbody>
              </table>
            </motion.div>

            {/* CTAs below table */}
            <div className="grid grid-cols-3 gap-6 mt-8">
              <Button
                onClick={() => router.push("/review/new?type=ai")}
                className="bg-gradient-to-r from-accent-blue to-blue-600 hover:from-accent-blue/90 hover:to-blue-600/90 text-white font-semibold py-6 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Try AI Review
              </Button>
              <Button
                onClick={() => router.push("/review/new?type=community")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Get Community Feedback
              </Button>
              <Button
                onClick={() => router.push("/browse")}
                className="bg-gradient-to-r from-accent-peach to-orange-500 hover:from-accent-peach/90 hover:to-orange-500/90 text-white font-semibold py-6 text-base rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Browse Experts
              </Button>
            </div>
          </div>

          {/* Mobile: Horizontal Swipe Cards */}
          <div className="md:hidden">
            <div className="relative">
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
                {/* AI Review Card */}
                <motion.div
                  className="min-w-[85vw] snap-center rounded-3xl border-2 border-accent-blue/30 bg-gradient-to-br from-white to-blue-50/30 shadow-xl overflow-hidden"
                  {...getFadeInAnimation(0.1)}
                >
                  <div className="p-6 bg-gradient-to-r from-accent-blue to-blue-600 text-white">
                    <h3 className="text-2xl font-bold mb-1">AI Review</h3>
                    <p className="text-blue-100 text-sm">Instant feedback</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Cost</div>
                      <div className="text-xl font-bold text-accent-blue">Free forever</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Turnaround</div>
                      <div className="text-lg font-medium text-gray-900">Instant</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Best For</div>
                      <div className="text-sm text-gray-600">Quick iterations, syntax checks</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Depth</div>
                      <div className="text-sm text-gray-600">Technical analysis</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Reviewers</div>
                      <div className="text-sm text-gray-600">AI agents</div>
                    </div>
                    <Button
                      onClick={() => router.push("/review/new?type=ai")}
                      className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold py-4 rounded-2xl min-h-[48px] shadow-lg"
                    >
                      Try AI Review
                    </Button>
                  </div>
                </motion.div>

                {/* Community Review Card */}
                <motion.div
                  className="min-w-[85vw] snap-center rounded-3xl border-2 border-green-300 bg-gradient-to-br from-white to-green-50/30 shadow-xl overflow-hidden"
                  {...getFadeInAnimation(0.2)}
                >
                  <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <h3 className="text-2xl font-bold mb-1">Community Review</h3>
                    <p className="text-green-100 text-sm">Peer feedback</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Cost</div>
                      <div className="text-xl font-bold text-green-700">
                        Free (3/month)
                        <br />
                        <span className="text-base font-medium text-gray-600">or Pro ($9/month)</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Turnaround</div>
                      <div className="text-lg font-medium text-gray-900">24-48 hours</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Best For</div>
                      <div className="text-sm text-gray-600">Peer perspective, general feedback</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Depth</div>
                      <div className="text-sm text-gray-600">Thoughtful critique</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Reviewers</div>
                      <div className="text-sm text-gray-600">Verified creators</div>
                    </div>
                    <Button
                      onClick={() => router.push("/review/new?type=community")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-2xl min-h-[48px] shadow-lg"
                    >
                      Get Community Feedback
                    </Button>
                  </div>
                </motion.div>

                {/* Expert Review Card */}
                <motion.div
                  className="min-w-[85vw] snap-center rounded-3xl border-2 border-accent-peach/30 bg-gradient-to-br from-white to-orange-50/30 shadow-xl overflow-hidden"
                  {...getFadeInAnimation(0.3)}
                >
                  <div className="p-6 bg-gradient-to-r from-accent-peach to-orange-500 text-white">
                    <h3 className="text-2xl font-bold mb-1">Expert Review</h3>
                    <p className="text-orange-100 text-sm">Professional critique</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Cost</div>
                      <div className="text-xl font-bold text-accent-peach">
                        $50-150
                        <br />
                        <span className="text-base font-medium text-gray-600">per review</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Turnaround</div>
                      <div className="text-lg font-medium text-gray-900">24 hours guaranteed</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Best For</div>
                      <div className="text-sm text-gray-600">Professional validation, career-critical work</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Depth</div>
                      <div className="text-sm text-gray-600">Industry-specific expertise</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Reviewers</div>
                      <div className="text-sm text-gray-600">Vetted professionals</div>
                    </div>
                    <Button
                      onClick={() => router.push("/browse")}
                      className="w-full bg-accent-peach hover:bg-accent-peach/90 text-white font-semibold py-4 rounded-2xl min-h-[48px] shadow-lg"
                    >
                      Browse Experts
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Indicator dots */}
              <div className="flex justify-center gap-2 mt-4">
                <div className="size-2 rounded-full bg-accent-blue" />
                <div className="size-2 rounded-full bg-gray-300" />
                <div className="size-2 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div className="text-center mb-12 md:mb-16" {...getFadeInAnimation()}>
            <Badge variant="success" size="lg" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Loved by creators worldwide
            </h2>
            <div className="flex items-center justify-center gap-2 text-lg text-gray-600">
              <motion.span
                className="text-3xl font-bold text-accent-blue"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                2,500+
              </motion.span>
              <span>reviews delivered</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                quote: "The AI feedback helped me catch accessibility issues I never would have noticed. It's like having a QA team on demand.",
                author: "Sarah Chen",
                role: "Frontend Developer",
                rating: 5,
              },
              {
                quote: "Getting my portfolio reviewed by an expert designer completely transformed my work. The feedback was detailed and actionable.",
                author: "Marcus Johnson",
                role: "UX Designer",
                rating: 5,
              },
              {
                quote: "I've tried other platforms, but Critvue's reviewers actually understand my niche. The turnaround time is incredible too.",
                author: "Priya Patel",
                role: "Content Creator",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="group relative p-6 sm:p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                {...getFadeInAnimation(index * 0.1)}
                whileHover={{ y: -4 }}
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-10 blur-2xl rounded-full bg-accent-blue transition-opacity duration-500" />

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4 relative z-10">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 leading-relaxed mb-6 text-sm sm:text-base relative z-10">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 relative z-10">
                  <div className="size-12 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
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

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div className="text-center mb-12 md:mb-16" {...getFadeInAnimation()}>
            <Badge variant="info" size="lg" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              Everything you need to know about Critvue
            </p>
          </motion.div>

          <div className="space-y-4">
            {allFAQs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                {...getFadeInAnimation(index * 0.05)}
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left min-h-[64px] touch-manipulation hover:bg-gray-50 transition-colors"
                  aria-expanded={expandedFAQ === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="text-base sm:text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 text-gray-500 transition-transform duration-300 shrink-0",
                      expandedFAQ === index && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {expandedFAQ === index && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
                      animate={prefersReducedMotion ? {} : { height: "auto", opacity: 1 }}
                      exit={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sm sm:text-base text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Gradient background */}
        <div
          className={cn(
            "absolute inset-0",
            perspective === "creator"
              ? "bg-gradient-to-br from-accent-blue via-accent-blue/90 to-blue-600"
              : "bg-gradient-to-br from-accent-peach via-accent-peach/90 to-orange-500"
          )}
        />

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.1, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div {...getFadeInAnimation()} className="space-y-6 md:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              {perspective === "creator" ? "Ready to level up?" : "Start earning with your expertise"}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {perspective === "creator"
                ? "Join 2,500+ creators getting better feedback every day"
                : "Help creators grow while building your reputation and income"}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() =>
                    router.push(perspective === "creator" ? "/auth/register" : "/apply/expert")
                  }
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-xl hover:shadow-2xl transition-all duration-300 touch-manipulation"
                  style={{
                    color: perspective === "creator" ? "#3B82F6" : "#F97316",
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {perspective === "creator"
                      ? "Start Your First Review Free"
                      : "Become a Reviewer"}
                    <ArrowRight className="size-5" />
                  </span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() => router.push(perspective === "creator" ? "/browse" : "/pricing")}
                  className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[48px] transition-all duration-300 touch-manipulation"
                >
                  {perspective === "creator" ? "Browse Expert Reviewers" : "Learn More About Expert Program"}
                </Button>
              </motion.div>
            </div>

            {/* Trust signal */}
            <p className="text-sm text-white/80 flex items-center justify-center gap-2">
              <Shield className="size-4" />
              No credit card required • 100% satisfaction guarantee
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
