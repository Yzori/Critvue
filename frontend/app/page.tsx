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
  MessageSquare,
  Sparkles,
  Target,
  Zap,
  Shield,
  Award,
  Code,
  Palette,
  Video,
  Mic,
  PenTool,
  Image as ImageIcon,
  ChevronDown,
  Twitter,
  Linkedin,
  Github,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Note: Section components to be added later when needed

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
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
    <div className="min-h-screen bg-white">
      {/* Hero Section - Conversion Focused */}
      <section className="relative pt-16 pb-8 md:pt-24 md:pb-16 overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />

        <div className="relative max-w-6xl mx-auto px-6">
          {/* Main headline - Problem-aware */}
          <motion.div
            className="text-center max-w-4xl mx-auto mb-10 md:mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Context setter */}
            <motion.p
              className="text-sm md:text-base font-medium text-gray-500 mb-4 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              In the age of AI-generated everything...
            </motion.p>

            {/* Main headline */}
            <h1 className="text-[28px] leading-[1.2] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 tracking-tight">
              Your work deserves feedback
              <br />
              <span className="bg-gradient-to-r from-accent-blue via-blue-600 to-accent-peach bg-clip-text text-transparent">
                from someone who gets it
              </span>
            </h1>

            {/* Value prop */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Real experts. Real insight. Real improvement.
              <span className="hidden sm:inline"> Not another AI telling you what you want to hear.</span>
            </p>
          </motion.div>

          {/* Two paths - Split layout */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-14">
            {/* Creator Path */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="relative p-6 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
                {/* Label */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-10 rounded-xl bg-accent-blue flex items-center justify-center">
                    <Palette className="size-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-accent-blue uppercase tracking-wide">For Creators</span>
                </div>

                {/* Headline */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Get feedback that actually helps
                </h2>
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  Expert reviewers who understand your craft. Actionable insights within 24 hours.
                </p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6">
                  {["Detailed, specific feedback", "24-hour turnaround", "100% confidential"].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="size-4 text-green-500 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  size="lg"
                  onClick={() => router.push("/register")}
                  className="w-full bg-accent-blue hover:bg-blue-600 text-white font-semibold py-5 rounded-xl group/btn"
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Your First Review
                    <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">Free to start • No credit card required</p>
              </div>
            </motion.div>

            {/* Reviewer Path */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="relative p-6 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-xl">
                {/* Label */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-10 rounded-xl bg-accent-peach flex items-center justify-center">
                    <Award className="size-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-accent-peach uppercase tracking-wide">For Experts</span>
                </div>

                {/* Headline */}
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Get paid for your expertise
                </h2>
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  Turn your knowledge into income. Set your own rates, work on your schedule.
                </p>

                {/* Benefits */}
                <ul className="space-y-2 mb-6">
                  {["Earn $50-150 per review", "Flexible schedule", "Build your reputation"].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="size-4 text-green-500 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  size="lg"
                  onClick={() => router.push("/apply/expert")}
                  className="w-full bg-accent-peach hover:bg-orange-500 text-white font-semibold py-5 rounded-xl group/btn"
                >
                  <span className="flex items-center justify-center gap-2">
                    Apply as a Reviewer
                    <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">Join 200+ expert reviewers</p>
              </div>
            </motion.div>
          </div>

          {/* Social proof - Simple, credible */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["JM", "SK", "AL", "RD"].map((initials, i) => (
                  <div
                    key={i}
                    className="size-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                <strong className="text-gray-900">2,500+</strong> reviews completed
              </span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                <strong className="text-gray-900">4.9/5</strong> average rating
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial Band - Social Proof */}
      <section className="py-8 md:py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              {/* Quote */}
              <blockquote className="text-lg md:text-xl lg:text-2xl text-gray-800 font-medium leading-relaxed mb-6">
                "I've used AI tools for feedback, but they just tell you what sounds good.
                <span className="text-accent-blue"> The human reviewer caught issues I never would have seen</span>—and
                explained exactly how to fix them."
              </blockquote>

              {/* Attribution */}
              <div className="flex items-center justify-center gap-3">
                <div className="size-12 rounded-full bg-accent-blue flex items-center justify-center text-white font-bold">
                  SK
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Sarah K.</div>
                  <div className="text-sm text-gray-500">Product Designer at Figma</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Difference - Real Feedback Comparison */}
      <section className="py-12 md:py-20 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-8 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Same work. Different feedback.
            </h2>
            <p className="text-gray-600">
              See why creators choose human reviewers.
            </p>
          </motion.div>

          {/* Side-by-side feedback comparison */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* AI Feedback */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="absolute -top-3 left-4 z-10">
                <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wide">
                  AI Tool
                </span>
              </div>
              <div className="p-5 md:p-6 rounded-2xl bg-gray-50 border border-gray-200 h-full">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-8 rounded-lg bg-gray-300 flex items-center justify-center shrink-0">
                    <Sparkles className="size-4 text-gray-600" />
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✓ Color contrast meets accessibility standards</p>
                    <p>✓ Button size is appropriate for touch targets</p>
                    <p>✓ Typography hierarchy is clear</p>
                    <p className="text-gray-400 italic">
                      "Consider increasing whitespace between sections."
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-400">Generic. Surface-level. Misses the point.</p>
                </div>
              </div>
            </motion.div>

            {/* Human Feedback */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute -top-3 left-4 z-10">
                <span className="px-3 py-1 rounded-full bg-accent-blue text-white text-xs font-bold uppercase tracking-wide">
                  Human Expert
                </span>
              </div>
              <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-accent-blue/20 h-full">
                <div className="flex items-start gap-3 mb-4">
                  <div className="size-8 rounded-lg bg-accent-blue flex items-center justify-center shrink-0 text-white font-bold text-xs">
                    MK
                  </div>
                  <div className="space-y-2 text-sm text-gray-800">
                    <p>
                      <strong>"Your hero is fighting against itself."</strong> The headline says 'simple' but the visual complexity contradicts that. Your target user (busy founders) will bounce.
                    </p>
                    <p>
                      <span className="text-accent-blue font-medium">Try this:</span> Strip the hero to one message. Move the feature grid below the fold. Your conversion will thank you.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-accent-blue/10">
                  <p className="text-xs text-gray-600 font-medium">Strategic. Specific. Actionable.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What You Get - Outcome Focused */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="grid md:grid-cols-3 gap-6 md:gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {/* Speed */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white shadow-md mb-4">
                <Clock className="size-7 text-accent-blue" />
              </div>
              <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">24h</div>
              <p className="text-gray-600 text-sm">Most reviews delivered within a day</p>
            </div>

            {/* Depth */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white shadow-md mb-4">
                <Target className="size-7 text-accent-peach" />
              </div>
              <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">5-10</div>
              <p className="text-gray-600 text-sm">Actionable suggestions per review</p>
            </div>

            {/* Satisfaction */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white shadow-md mb-4">
                <Star className="size-7 text-amber-500" />
              </div>
              <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">97%</div>
              <p className="text-gray-600 text-sm">Creators say feedback was useful</p>
            </div>
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
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {[
              {
                quote: "The expert caught cultural nuances and emotional resonance that no AI could understand. They saw my design through the eyes of real users.",
                author: "Marcus Johnson",
                role: "UX Designer",
                type: "creator",
                rating: 5,
                avatar: "MJ",
              },
              {
                quote: "I earned $2,400 last month reviewing designs in my spare time. Getting paid for what I love doing—and helping creators improve—feels genuinely rewarding.",
                author: "Alex Rivera",
                role: "Senior Product Designer • Reviewer",
                type: "reviewer",
                rating: 5,
                avatar: "AR",
              },
              {
                quote: "I've tried AI tools, but Critvue's human reviewers actually understand context and intent. They give strategic advice, not surface-level observations.",
                author: "Priya Patel",
                role: "Content Creator",
                type: "creator",
                rating: 5,
                avatar: "PP",
              },
              {
                quote: "I review writing samples while my kids nap. $50-100 per review. I've made over $6K in 3 months. Perfect side income for someone with expertise.",
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
                  <div className="size-12 rounded-full bg-accent-blue flex items-center justify-center text-white font-bold text-sm">
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
              className="w-full bg-accent-blue text-white font-semibold text-base sm:text-lg rounded-2xl min-h-[56px] shadow-lg hover:shadow-xl transition-all duration-300 group touch-manipulation"
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
              <h3 className="text-2xl font-bold text-accent-blue mb-3">
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
              <h3 className="text-2xl font-bold text-accent-blue mb-3">
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
            className="w-full h-14 bg-accent-blue hover:shadow-lg text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 touch-manipulation"
          >
            Get Started Free
            <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
