"use client";

/**
 * How It Works Page - Interactive Journey Redesign
 *
 * An immersive, scroll-driven interactive journey with:
 * - Sticky progress bar that fills as user scrolls
 * - Animated matching visualization (priority feature)
 * - Perspective-aware content (creator/reviewer toggle)
 * - Chapter-based navigation with smooth animations
 *
 * Brand Compliance:
 * - Colors: accent-blue (#3B82F6), accent-peach (#F97316)
 * - Spacing: 8px grid system
 * - Typography: Inter font family with proper hierarchy
 * - Glass morphism effects for cards
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Upload,
  Sparkles,
  Users,
  MessageSquare,
  Target,
  Award,
  PenTool,
  TrendingUp,
  ChevronDown,
  Star,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  FileCode,
  Palette,
  Video,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom components
import {
  JourneyProgressBar,
  PerspectiveToggle,
  JourneyChapter,
  ChapterHeader,
  MatchingVisualization,
  AnimatedCounter,
  AnimatedStatCard,
  ReviewerCardStack,
  ComparisonFlipCard,
} from "@/components/how-it-works";
import { useScrollProgress } from "@/hooks/useScrollProgress";

// Chapter configuration
const chapters = [
  { id: "hero", label: "Start Here", shortLabel: "Start" },
  { id: "upload", label: "Upload Work", shortLabel: "Upload" },
  { id: "find", label: "Find Reviewer", shortLabel: "Find" },
  { id: "matching", label: "Smart Matching", shortLabel: "Match" },
  { id: "results", label: "Get Feedback", shortLabel: "Results" },
  { id: "social-proof", label: "Success Stories", shortLabel: "Proof" },
  { id: "comparison", label: "Compare Options", shortLabel: "Compare" },
  { id: "faq", label: "FAQ", shortLabel: "FAQ" },
  { id: "cta", label: "Get Started", shortLabel: "Start" },
];

const chapterIds = chapters.map((c) => c.id);

export default function HowItWorksPage() {
  const router = useRouter();
  const [perspective, setPerspective] = useState<"creator" | "reviewer">("creator");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Scroll progress tracking
  const { progress, activeChapter, scrollToChapter } = useScrollProgress({
    chapterIds,
    offset: 120,
  });

  // Show progress bar after scrolling past hero
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { amount: 0.5 });

  // Matching visualization ref
  const matchingRef = useRef<HTMLDivElement>(null);
  const matchingInView = useInView(matchingRef, { once: false, amount: 0.5 });

  const isCreator = perspective === "creator";

  // Content for dynamic sections
  const creatorSteps = [
    {
      icon: Upload,
      headline: "Upload in seconds",
      description: "Code, design, video, writing—any creative work. Add context about what feedback you need.",
    },
    {
      icon: Sparkles,
      headline: "Pick your review type",
      description: "Community reviewers for peer perspective, or Expert reviewers for professional validation.",
    },
    {
      icon: Target,
      headline: "We find the right match",
      description: "Our system matches you with reviewers based on expertise and your specific needs.",
    },
    {
      icon: MessageSquare,
      headline: "Feedback you can use",
      description: "Detailed critique, specific suggestions, and actionable next steps.",
    },
  ];

  const reviewerSteps = [
    {
      icon: Award,
      headline: "Share your expertise",
      description: "Community reviewers start immediately. Experts undergo vetting with portfolio review.",
    },
    {
      icon: Target,
      headline: "Choose your projects",
      description: "Select work matching your expertise. Set your availability and preferences.",
    },
    {
      icon: PenTool,
      headline: "Review with powerful tools",
      description: "Annotate, comment, and provide structured feedback with templates.",
    },
    {
      icon: TrendingUp,
      headline: "Earn and grow",
      description: "Build reputation, unlock expert status, and get paid for your insights.",
    },
  ];

  const currentSteps = isCreator ? creatorSteps : reviewerSteps;

  // Content types for upload section
  const contentTypes = [
    { icon: FileCode, label: "Code", color: "blue" },
    { icon: Palette, label: "Design", color: "purple" },
    { icon: Video, label: "Video", color: "red" },
    { icon: FileText, label: "Writing", color: "green" },
  ];

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

  const allFAQs = isCreator
    ? [...creatorFAQs, ...reviewerFAQs.slice(0, 1)]
    : [...reviewerFAQs, ...creatorFAQs.slice(0, 1)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sticky Progress Bar - appears after scrolling past hero */}
      <AnimatePresence>
        {!heroInView && (
          <JourneyProgressBar
            chapters={chapters}
            activeChapter={activeChapter}
            progress={progress}
            onChapterClick={scrollToChapter}
            perspective={perspective}
          />
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className="relative pt-20 pb-12 px-6 md:pt-32 md:pb-20 overflow-hidden"
      >
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className={cn(
              "absolute top-1/4 -left-1/4 w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl",
              isCreator ? "bg-accent-blue/10" : "bg-accent-peach/10"
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className={cn(
              "absolute bottom-1/4 -right-1/4 w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl",
              isCreator ? "bg-accent-peach/10" : "bg-accent-blue/10"
            )}
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
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Badge variant="info" size="lg" className="mb-6">
                Interactive Guide
              </Badge>
            </motion.div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Your journey to{" "}
              <motion.span
                className={cn(
                  "inline-block bg-clip-text text-transparent",
                  isCreator
                    ? "bg-gradient-to-r from-accent-blue to-blue-600"
                    : "bg-gradient-to-r from-accent-peach to-orange-500"
                )}
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        scale: [1, 1.02, 1],
                      }
                }
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                better feedback
              </motion.span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 md:mb-10 leading-relaxed">
              {isCreator
                ? "See exactly how to get expert eyes on your work in under 5 minutes"
                : "Discover how to earn while helping creators grow their skills"}
            </p>

            {/* Perspective Toggle */}
            <PerspectiveToggle
              perspective={perspective}
              onPerspectiveChange={setPerspective}
              className="mb-8"
            />

            {/* Primary CTA */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                size="lg"
                onClick={() =>
                  router.push(isCreator ? "/auth/register" : "/apply/expert")
                }
                className={cn(
                  "w-full sm:w-auto font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-xl hover:shadow-2xl transition-all duration-300 touch-manipulation",
                  isCreator
                    ? "bg-gradient-to-r from-accent-blue to-blue-600 hover:from-accent-blue/90 hover:to-blue-600/90 text-white"
                    : "bg-gradient-to-r from-accent-peach to-orange-500 hover:from-accent-peach/90 hover:to-orange-500/90 text-white"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {isCreator ? "Start Your First Review Free" : "Become a Reviewer"}
                  <ArrowRight className="size-5" />
                </span>
              </Button>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              className="mt-12 flex flex-col items-center gap-2 text-gray-400"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-sm">Scroll to explore</span>
              <ChevronDown className="size-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Chapter 1: Upload/Share */}
      <JourneyChapter id="upload" variant="default" perspective={perspective}>
        <div className="max-w-7xl mx-auto px-6">
          <ChapterHeader
            badge={`Step 1 of 4`}
            title={isCreator ? "Upload in seconds" : "Share your expertise"}
            subtitle={
              isCreator
                ? "Any creative work, any format. We've got you covered."
                : "Set up your profile and start receiving projects"
            }
            perspective={perspective}
          />

          {/* Content Types Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            {contentTypes.map((type, index) => (
              <motion.div
                key={type.label}
                className={cn(
                  "group relative p-6 rounded-2xl border-2 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300",
                  isCreator
                    ? "border-accent-blue/10 hover:border-accent-blue/30"
                    : "border-accent-peach/10 hover:border-accent-peach/30"
                )}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className={cn(
                    "size-14 rounded-xl flex items-center justify-center mb-4 ring-2 ring-offset-2",
                    isCreator
                      ? "bg-accent-blue/10 text-accent-blue ring-accent-blue/20"
                      : "bg-accent-peach/10 text-accent-peach ring-accent-peach/20"
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <type.icon className="size-7" />
                </motion.div>
                <h3 className="font-semibold text-gray-900">{type.label}</h3>
              </motion.div>
            ))}
          </div>

          {/* Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {currentSteps.slice(0, 2).map((step, index) => (
              <motion.div
                key={index}
                className={cn(
                  "group relative p-6 sm:p-8 rounded-3xl border-2 transition-all duration-500 overflow-hidden",
                  "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl",
                  isCreator
                    ? "border-accent-blue/20 hover:border-accent-blue/50"
                    : "border-accent-peach/20 hover:border-accent-peach/50"
                )}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -4 }}
              >
                {/* Gradient overlay */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    isCreator
                      ? "bg-gradient-to-br from-accent-blue/5 to-blue-50/50"
                      : "bg-gradient-to-br from-accent-peach/5 to-orange-50/50"
                  )}
                />

                {/* Step number */}
                <div
                  className={cn(
                    "inline-flex items-center justify-center size-10 rounded-full font-bold text-lg mb-4 relative z-10",
                    isCreator
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "bg-accent-peach/10 text-accent-peach"
                  )}
                >
                  {index + 1}
                </div>

                {/* Icon */}
                <motion.div
                  className={cn(
                    "inline-flex items-center justify-center size-14 rounded-2xl mb-5 ring-2 ring-offset-2 transition-all duration-300 relative z-10",
                    isCreator
                      ? "bg-gradient-to-br from-blue-500 to-accent-blue text-white ring-accent-blue/20"
                      : "bg-gradient-to-br from-orange-500 to-accent-peach text-white ring-accent-peach/20"
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <step.icon className="size-7" />
                </motion.div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    {step.headline}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </JourneyChapter>

      {/* Chapter 2: Find Reviewer / Choose Projects */}
      <JourneyChapter id="find" variant="alt" perspective={perspective}>
        <div className="max-w-7xl mx-auto px-6">
          <ChapterHeader
            badge={`Step 2 of 4`}
            title={isCreator ? "Find your perfect reviewer" : "Choose your projects"}
            subtitle={
              isCreator
                ? "Browse experts or let us match you automatically"
                : "Pick work that matches your skills and interests"
            }
            perspective={perspective}
          />

          <ReviewerCardStack perspective={perspective} />
        </div>
      </JourneyChapter>

      {/* Chapter 3: Smart Matching (PRIORITY) */}
      <JourneyChapter id="matching" variant="gradient" perspective={perspective}>
        <div className="max-w-7xl mx-auto px-6">
          <ChapterHeader
            badge={`Step 3 of 4`}
            title="Smart matching magic"
            subtitle={
              isCreator
                ? "Our algorithm finds the perfect reviewer for your work"
                : "Get matched with projects that fit your expertise"
            }
            perspective={perspective}
          />

          <div ref={matchingRef}>
            <MatchingVisualization
              perspective={perspective}
              isInView={matchingInView}
            />
          </div>

          {/* Additional matching info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: Zap,
                title: "Instant matching",
                desc: "Most matches happen within minutes",
              },
              {
                icon: Target,
                title: "Skill-based",
                desc: "Matched by expertise and experience",
              },
              {
                icon: Clock,
                title: "Real-time updates",
                desc: "Track progress every step of the way",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <div
                  className={cn(
                    "size-12 rounded-xl flex items-center justify-center mx-auto mb-4",
                    isCreator ? "bg-accent-blue/10" : "bg-accent-peach/10"
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-6",
                      isCreator ? "text-accent-blue" : "text-accent-peach"
                    )}
                  />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </JourneyChapter>

      {/* Chapter 4: Results */}
      <JourneyChapter id="results" variant="default" perspective={perspective}>
        <div className="max-w-7xl mx-auto px-6">
          <ChapterHeader
            badge={`Step 4 of 4`}
            title={isCreator ? "Feedback that actually helps" : "Earn and grow"}
            subtitle={
              isCreator
                ? "Detailed critique with actionable next steps"
                : "Build reputation and income doing what you love"
            }
            perspective={perspective}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {currentSteps.slice(2, 4).map((step, index) => (
              <motion.div
                key={index}
                className={cn(
                  "group relative p-6 sm:p-8 rounded-3xl border-2 transition-all duration-500 overflow-hidden",
                  "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl",
                  isCreator
                    ? "border-accent-blue/20 hover:border-accent-blue/50"
                    : "border-accent-peach/20 hover:border-accent-peach/50"
                )}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -4 }}
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    isCreator
                      ? "bg-gradient-to-br from-accent-blue/5 to-blue-50/50"
                      : "bg-gradient-to-br from-accent-peach/5 to-orange-50/50"
                  )}
                />

                <div
                  className={cn(
                    "inline-flex items-center justify-center size-10 rounded-full font-bold text-lg mb-4 relative z-10",
                    isCreator
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "bg-accent-peach/10 text-accent-peach"
                  )}
                >
                  {index + 3}
                </div>

                <motion.div
                  className={cn(
                    "inline-flex items-center justify-center size-14 rounded-2xl mb-5 ring-2 ring-offset-2 transition-all duration-300 relative z-10",
                    isCreator
                      ? "bg-gradient-to-br from-blue-500 to-accent-blue text-white ring-accent-blue/20"
                      : "bg-gradient-to-br from-orange-500 to-accent-peach text-white ring-accent-peach/20"
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <step.icon className="size-7" />
                </motion.div>

                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    {step.headline}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Satisfaction guarantee */}
          {isCreator && (
            <motion.div
              className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Shield className="size-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">
                100% Satisfaction Guarantee
              </h4>
              <p className="text-sm text-gray-600">
                Not happy with your expert review? Full refund, no questions asked.
              </p>
            </motion.div>
          )}
        </div>
      </JourneyChapter>

      {/* Social Proof Section */}
      <JourneyChapter id="social-proof" variant="alt" perspective={perspective}>
        <div className="max-w-7xl mx-auto px-6">
          <ChapterHeader
            badge="Trusted by Creators"
            title="Join thousands of happy users"
            subtitle="Real results from real creators and reviewers"
            perspective={perspective}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
            <AnimatedStatCard
              value={2500}
              suffix="+"
              label="Reviews delivered"
              icon={<MessageSquare className="size-5" />}
              perspective={perspective}
            />
            <AnimatedStatCard
              value={24}
              suffix="h"
              label="Average turnaround"
              icon={<Clock className="size-5" />}
              perspective={perspective}
            />
            <AnimatedStatCard
              value={97}
              suffix="%"
              label="Satisfaction rate"
              icon={<Star className="size-5" />}
              perspective={perspective}
            />
            <AnimatedStatCard
              value={500}
              suffix="+"
              label="Expert reviewers"
              icon={<Users className="size-5" />}
              perspective={perspective}
            />
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                quote:
                  "The structured feedback helped me catch accessibility issues I never would have noticed. It's like having a QA team on demand.",
                author: "Sarah Chen",
                role: "Frontend Developer",
                rating: 5,
              },
              {
                quote:
                  "Getting my portfolio reviewed by an expert designer completely transformed my work. The feedback was detailed and actionable.",
                author: "Marcus Johnson",
                role: "UX Designer",
                rating: 5,
              },
              {
                quote:
                  "I've tried other platforms, but Critvue's reviewers actually understand my niche. The turnaround time is incredible too.",
                author: "Priya Patel",
                role: "Content Creator",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="group relative p-6 sm:p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div
                  className={cn(
                    "absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-10 blur-2xl rounded-full transition-opacity duration-500",
                    isCreator ? "bg-accent-blue" : "bg-accent-peach"
                  )}
                />

                <div className="flex items-center gap-1 mb-4 relative z-10">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed mb-6 text-sm sm:text-base relative z-10">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-3 relative z-10">
                  <div
                    className={cn(
                      "size-12 rounded-full flex items-center justify-center text-white font-bold text-sm",
                      isCreator
                        ? "bg-gradient-to-br from-accent-blue to-blue-600"
                        : "bg-gradient-to-br from-accent-peach to-orange-500"
                    )}
                  >
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </JourneyChapter>

      {/* Comparison Section */}
      <JourneyChapter id="comparison" variant="default" perspective={perspective}>
        <div className="max-w-7xl mx-auto px-6">
          <ChapterHeader
            badge="Compare Options"
            title="Choose your review type"
            subtitle="From community peer feedback to expert critique"
            perspective={perspective}
          />

          <ComparisonFlipCard
            onCommunityClick={() => router.push("/review/new")}
            onExpertClick={() => router.push("/browse")}
          />
        </div>
      </JourneyChapter>

      {/* FAQ Section */}
      <JourneyChapter id="faq" variant="alt" perspective={perspective}>
        <div className="max-w-4xl mx-auto px-6">
          <ChapterHeader
            badge="FAQ"
            title="Frequently asked questions"
            subtitle="Everything you need to know about Critvue"
            perspective={perspective}
          />

          <div className="space-y-4">
            {allFAQs.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
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
      </JourneyChapter>

      {/* Final CTA Section */}
      <section id="cta" className="py-16 md:py-24 relative overflow-hidden">
        {/* Gradient background */}
        <div
          className={cn(
            "absolute inset-0",
            isCreator
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 md:space-y-8"
          >
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Ready to start?
            </Badge>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              {isCreator ? "Ready to level up?" : "Start earning with your expertise"}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              {isCreator
                ? "Join 2,500+ creators getting better feedback every day"
                : "Help creators grow while building your reputation and income"}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() =>
                    router.push(isCreator ? "/auth/register" : "/apply/expert")
                  }
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-xl hover:shadow-2xl transition-all duration-300 touch-manipulation"
                  style={{
                    color: isCreator ? "#3B82F6" : "#F97316",
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isCreator ? "Start Your First Review Free" : "Become a Reviewer"}
                    <ArrowRight className="size-5" />
                  </span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() => router.push(isCreator ? "/browse" : "/pricing")}
                  className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[48px] transition-all duration-300 touch-manipulation"
                >
                  {isCreator ? "Browse Expert Reviewers" : "Learn More"}
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
