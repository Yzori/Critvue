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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Note: Section components to be added later when needed

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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
      {/* Mobile Header - Sticky */}
      <MobileHeader
        isMenuOpen={mobileMenuOpen}
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        router={router}
        user={user}
        isAuthenticated={isAuthenticated}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <MobileMenu
          onClose={() => setMobileMenuOpen(false)}
          router={router}
        />
      )}

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
              {/* Headline - Kinetic typography - Optimized for 320px */}
              <h1 className="text-[32px] leading-[1.15] sm:text-5xl lg:text-6xl font-bold text-gray-900 sm:leading-tight">
                Turn feedback into your{" "}
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
                  creative edge
                </motion.span>
              </h1>

              {/* Supporting text - Concise for mobile */}
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                Instant AI analysis, or detailed expert critique from industry professionals.
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

                {/* Turnaround Stat */}
                <motion.div
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 bg-gradient-to-br from-blue-500 via-accent-blue to-indigo-500 shadow-xl hover:shadow-2xl transition-all duration-500 group"
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
                      <Clock className="size-4 sm:size-6 md:size-7 text-white drop-shadow-lg" />
                    </motion.div>
                    <motion.div
                      className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-0.5 sm:mb-1 drop-shadow-md"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7, duration: 0.6, type: "spring", bounce: 0.5 }}
                    >
                      &lt;24h
                    </motion.div>
                    <div className="text-[10px] sm:text-sm font-semibold text-white/90 tracking-wide uppercase leading-tight">
                      Turnaround
                    </div>
                  </div>

                  <motion.div
                    className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    animate={{ left: ["100%", "-100%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 1 }}
                  />
                </motion.div>
              </div>

              {/* CTAs - Full width on mobile with enhanced micro-interactions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.div
                  className="w-full sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    size="lg"
                    onClick={() => router.push("/auth/register")}
                    className="w-full bg-gradient-to-r from-accent-blue to-accent-peach hover:shadow-2xl text-white font-semibold px-6 sm:px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] group touch-manipulation relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="relative flex items-center justify-center gap-2">
                      <span className="hidden min-[360px]:inline">Get Your First Review Free</span>
                      <span className="min-[360px]:hidden">First Review Free</span>
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
                    variant="outline"
                    onClick={() => router.push("/browse")}
                    className="w-full border-2 border-accent-blue/30 hover:border-accent-blue hover:bg-accent-blue/5 font-semibold px-8 py-6 text-lg rounded-2xl min-h-[48px] touch-manipulation"
                  >
                    Browse Reviewers
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
                description: "AI insights or human expert reviews",
                details: "Choose instant AI analysis or wait 24 hours for detailed expert critique.",
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
              Instant AI insights or human expert reviews—both get results
            </p>
          </motion.div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Free AI Plan */}
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
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">AI Reviews</h3>
                <p className="text-gray-600">Instant feedback powered by AI</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-gray-900">$0</span>
                  <span className="text-xl text-gray-600">/review</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Instant AI-powered analysis",
                  "Detailed actionable feedback",
                  "Unlimited free reviews",
                  "Support for all content types",
                  "Get results in seconds",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                onClick={() => router.push("/review/new?type=ai")}
                className="w-full bg-gradient-to-r from-accent-blue to-blue-600 hover:from-accent-blue/90 hover:to-blue-600/90 text-white font-semibold px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="hidden min-[360px]:inline">Try AI Review Free</span>
                <span className="min-[360px]:hidden">Try AI Free</span>
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </motion.div>

            {/* Expert Plan */}
            <motion.div
              className="relative p-8 sm:p-10 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-accent-peach/50"
              style={{
                background: "linear-gradient(135deg, #fff 0%, #fff5f0 100%)",
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
            >
              {/* Popular badge */}
              <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-accent-peach to-orange-500 text-white font-bold text-sm rounded-bl-2xl">
                Most Popular
              </div>

              <div className="mb-6 mt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm mb-4">
                  <Award className="size-4" />
                  Expert Quality
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Expert Reviews</h3>
                <p className="text-gray-600">Human experts with real expertise</p>
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
                  "In-depth personalized critique",
                  "Industry-specific expertise",
                  "24-hour turnaround",
                  "Direct communication with reviewer",
                  "100% satisfaction guarantee",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="size-5 text-accent-peach mt-0.5 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
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
              Loved by creators worldwide
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Join 2,500+ creators getting better feedback every day
            </p>
          </motion.div>

          {/* Testimonial grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                quote: "The AI feedback helped me catch accessibility issues I never would have noticed. It's like having a QA team on demand.",
                author: "Sarah Chen",
                role: "Frontend Developer",
                rating: 5,
                avatar: "SC",
              },
              {
                quote: "Getting my portfolio reviewed by an expert designer completely transformed my work. The feedback was detailed and actionable.",
                author: "Marcus Johnson",
                role: "UX Designer",
                rating: 5,
                avatar: "MJ",
              },
              {
                quote: "I've tried other platforms, but Critvue's reviewers actually understand my niche. The turnaround time is incredible too.",
                author: "Priya Patel",
                role: "Content Creator",
                rating: 5,
                avatar: "PP",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="relative p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
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

      {/* Dual Perspective - Premium Toggle Design */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/30" />
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
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="info" size="lg" className="mb-5 shadow-lg">
                Choose Your Path
              </Badge>
            </motion.div>
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              For creators and reviewers
            </motion.h2>

            {/* Enhanced segmented control with gradient backgrounds - Horizontal at all sizes with responsive text */}
            <motion.div
              className="inline-flex items-center gap-1 p-1 sm:p-1.5 rounded-2xl bg-gradient-to-r from-white via-gray-50 to-white border-2 border-gray-200/50 shadow-2xl backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.button
                onClick={() => setPerspective("creator")}
                className={cn(
                  "relative px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-semibold sm:font-bold text-sm sm:text-base transition-all duration-500 min-h-[48px] touch-manipulation overflow-hidden",
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
                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                  <Palette className="size-4 sm:size-5" />
                  <span className="whitespace-nowrap">
                    <span className="hidden min-[360px]:inline">I'm a </span>Creator
                  </span>
                </span>
              </motion.button>
              <motion.button
                onClick={() => setPerspective("reviewer")}
                className={cn(
                  "relative px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-semibold sm:font-bold text-sm sm:text-base transition-all duration-500 min-h-[48px] touch-manipulation overflow-hidden",
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
                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                  <Award className="size-4 sm:size-5" />
                  <span className="whitespace-nowrap">
                    <span className="hidden min-[360px]:inline">I'm a </span>Reviewer
                  </span>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Perspective content - Stacked on mobile */}
          <motion.div
            key={perspective}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {perspective === "creator" ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Target, title: "Actionable Feedback", description: "Specific critique on what matters most" },
                  { icon: Clock, title: "Fast Turnaround", description: "Most reviews within 24 hours" },
                  { icon: Shield, title: "Secure & Private", description: "Your work stays confidential" },
                  { icon: TrendingUp, title: "Track Improvement", description: "See your growth over time" },
                ].map((item, i) => (
                  <BenefitCard key={i} {...item} color="blue" delay={i * 0.05} />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Award, title: "Earn Money", description: "$50-150 per review" },
                  { icon: Users, title: "Build Reputation", description: "Showcase your expertise" },
                  { icon: Zap, title: "Flexible Schedule", description: "Review when it works for you" },
                  { icon: TrendingUp, title: "Help Creators", description: "Make a real impact" },
                ].map((item, i) => (
                  <BenefitCard key={i} {...item} color="peach" delay={i * 0.05} />
                ))}
              </div>
            )}

            {/* CTA - Thumb zone on mobile */}
            <div className="flex justify-center pt-6">
              <Button
                size="lg"
                onClick={() => router.push(perspective === "creator" ? "/review/new" : "/apply/expert")}
                className={cn(
                  "w-full sm:w-auto font-semibold px-6 sm:px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[56px] touch-manipulation",
                  perspective === "creator"
                    ? "bg-accent-blue hover:bg-accent-blue/90 text-white"
                    : "bg-accent-peach hover:bg-accent-peach/90 text-white"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="hidden min-[360px]:inline">
                    {perspective === "creator" ? "Get Your First Review Free" : "Become a Reviewer"}
                  </span>
                  <span className="min-[360px]:hidden">
                    {perspective === "creator" ? "First Review Free" : "Become Reviewer"}
                  </span>
                  <ArrowRight className="size-5" />
                </span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Note: Additional sections (Pricing, Testimonials, Stats) to be added later */}

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
                onClick={() => router.push("/auth/register")}
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
                variant="outline"
                onClick={() => router.push("/browse")}
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 font-semibold px-6 sm:px-8 py-6 text-base sm:text-lg rounded-2xl min-h-[48px] transition-all duration-300 touch-manipulation"
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
              onClick={() => router.push("/auth/register")}
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
 * Mobile Header Component
 * Sticky header with logo and hamburger menu
 * 48px height for thumb accessibility
 */
function MobileHeader({
  isMenuOpen,
  onMenuToggle,
  router,
  user,
  isAuthenticated,
}: {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  router: any;
  user: any;
  isAuthenticated: boolean;
}) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent min-h-[44px] min-w-[44px] flex items-center touch-manipulation"
        >
          Critvue
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => router.push("/browse")}
            className="text-gray-700 hover:text-gray-900 font-medium min-h-[44px] px-4 touch-manipulation"
          >
            Browse
          </button>
          <button
            onClick={() => router.push(isAuthenticated ? "/dashboard" : "/review/new")}
            className="text-gray-700 hover:text-gray-900 font-medium min-h-[44px] px-4 touch-manipulation"
          >
            {isAuthenticated ? "Dashboard" : "Get Review"}
          </button>

          {isAuthenticated ? (
            <Button
              onClick={() => router.push("/profile")}
              className="bg-gradient-to-r from-accent-blue to-accent-peach text-white min-h-[44px] touch-manipulation"
            >
              {user?.email?.split('@')[0] || "Profile"}
            </Button>
          ) : (
            <Button
              onClick={() => router.push("/auth/register")}
              className="bg-gradient-to-r from-accent-blue to-accent-peach text-white min-h-[44px] touch-manipulation"
            >
              Sign Up
            </Button>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-3 -mr-3 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="size-6 text-gray-900" />
          ) : (
            <Menu className="size-6 text-gray-900" />
          )}
        </button>
      </div>
    </motion.header>
  );
}

/**
 * Mobile Menu Overlay
 * Full-screen menu with touch-friendly links
 */
function MobileMenu({
  onClose,
  router,
}: {
  onClose: () => void;
  router: any;
}) {
  const menuItems = [
    { label: "Browse Reviewers", href: "/browse" },
    { label: "Get Review", href: "/review/new" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-white md:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="pt-24 px-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.href}
            onClick={() => {
              router.push(item.href);
              onClose();
            }}
            className="w-full text-left px-6 py-4 text-xl font-semibold text-gray-900 hover:bg-gray-50 rounded-2xl min-h-[56px] transition-colors touch-manipulation"
          >
            {item.label}
          </button>
        ))}

        <div className="pt-6">
          <Button
            size="lg"
            onClick={() => {
              router.push("/auth/register");
              onClose();
            }}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-peach text-white font-semibold min-h-[56px] rounded-2xl touch-manipulation"
          >
            Sign Up Free
          </Button>
        </div>
      </div>
    </motion.div>
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
 * Minimal footer with collapsible links on mobile
 */
function Footer({ router }: { router: any }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Browse Reviews", href: "/browse" },
        { label: "Request Review", href: "/review/new" },
        { label: "Become Reviewer", href: "/apply/expert" },
        { label: "Pricing", href: "#pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Brand */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent mb-3">
            Critvue
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md">
            Transform feedback into your creative advantage
          </p>
        </div>

        {/* Links - Collapsible on mobile */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === section.title ? null : section.title
                  )
                }
                className="w-full flex items-center justify-between md:justify-start font-semibold mb-4 text-white min-h-[44px] touch-manipulation"
              >
                {section.title}
                <ChevronDown
                  className={cn(
                    "size-5 md:hidden transition-transform",
                    expandedSection === section.title && "rotate-180"
                  )}
                />
              </button>
              <ul
                className={cn(
                  "space-y-3",
                  expandedSection === section.title ? "block" : "hidden md:block"
                )}
              >
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => router.push(link.href)}
                      className="text-gray-400 hover:text-white transition-colors text-sm min-h-[44px] flex items-center py-2 touch-manipulation"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-800 text-center md:text-left">
          <p className="text-gray-400 text-sm">
            © 2025 Critvue. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
