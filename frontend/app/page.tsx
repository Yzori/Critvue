"use client";

/**
 * Critvue Homepage - Video-First Design
 *
 * Cinematic video hero that sells the problem + solution,
 * followed by streamlined conversion-focused sections.
 * Detailed explanations moved to /how-it-works
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
  Award,
  Palette,
  Video,
  Mic,
  PenTool,
  Image as ImageIcon,
  Camera,
  ChevronDown,
  Twitter,
  Linkedin,
  Github,
  MessageSquare,
  ExternalLink,
  Play,
  Volume2,
  VolumeX,
  X,
  DollarSign,
  TrendingUp,
  Clock,
  Zap,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showBottomCTA, setShowBottomCTA] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Track scroll for sticky bottom CTA
  useEffect(() => {
    const handleScroll = () => {
      setShowBottomCTA(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className="min-h-screen bg-background">
      {/* ============================================
          VIDEO HERO SECTION
          Compact on mobile, cinematic on desktop
          ============================================ */}
      <section className="relative h-[75vh] min-h-[500px] max-h-[800px] md:h-screen md:min-h-[600px] md:max-h-[900px] overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="/hero-poster.jpg"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center px-4 sm:px-6 text-center">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-3 sm:mb-6"
            >
              <Badge
                variant="outline"
                className="bg-background/10 backdrop-blur-sm border-white/20 text-white px-3 py-1.5 text-xs sm:text-sm"
              >
                <Sparkles className="size-3 sm:size-4 mr-1.5" />
                Human feedback for the AI age
              </Badge>
            </motion.div>

            {/* Headline - tighter line height on mobile */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-6 tracking-tight leading-[1.05] sm:leading-[1.1]">
              Your work deserves
              <br />
              <span className="bg-gradient-to-r from-accent-blue via-cyan-400 to-accent-peach bg-clip-text text-transparent">
                real feedback
              </span>
            </h1>

            {/* Subheadline - 2 lines max on mobile */}
            <p className="text-base sm:text-xl md:text-2xl text-white/80 mb-5 sm:mb-10 max-w-2xl mx-auto leading-snug sm:leading-relaxed">
              Expert critiques from humans who understand your craft.
              <span className="hidden sm:inline"> Not AI telling you what you want to hear.</span>
            </p>

            {/* Split CTAs - Smaller on mobile with tap feedback */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => router.push("/register")}
                className="w-full sm:w-auto bg-background text-foreground hover:bg-muted active:scale-[0.98] active:shadow-lg font-semibold px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl min-h-[48px] sm:min-h-[56px] shadow-2xl transition-all duration-150 group"
              >
                <span className="flex items-center gap-2">
                  Get Feedback
                  <ArrowRight className="size-4 sm:size-5 group-hover:translate-x-1 group-active:translate-x-0.5 transition-transform" />
                </span>
              </Button>
              <Button
                size="lg"
                onClick={() => router.push("/apply/expert")}
                variant="outline"
                className="w-full sm:w-auto bg-gradient-to-r from-accent-peach/20 to-orange-500/20 border-2 border-accent-peach/50 text-white hover:bg-accent-peach/30 active:scale-[0.98] active:bg-accent-peach/40 font-semibold px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl min-h-[48px] sm:min-h-[56px] backdrop-blur-sm transition-all duration-150 group"
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="size-4 sm:size-5 group-hover:scale-110 transition-transform" />
                  Become a Reviewer
                </span>
              </Button>
            </div>

            {/* Watch Video Link - more prominent on desktop */}
            <motion.button
              onClick={() => setIsVideoModalOpen(true)}
              className="mt-4 sm:mt-6 md:mt-8 inline-flex items-center gap-2 sm:gap-2.5 text-white hover:text-foreground text-sm sm:text-base md:text-lg font-medium transition-all duration-200 active:scale-[0.98] group md:px-5 md:py-2.5 md:rounded-full md:bg-background/10 md:backdrop-blur-sm md:border md:border-white/20 md:hover:bg-background/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="size-7 sm:size-8 md:size-10 rounded-full bg-background/20 md:bg-background/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-background/40 group-hover:scale-105 transition-all border border-white/30">
                <Play className="size-3.5 sm:size-4 md:size-5 fill-current ml-0.5" />
              </div>
              <span>Watch how it works</span>
              <span className="hidden md:inline text-white/60 text-sm">(2 min)</span>
            </motion.button>

            {/* Earnings indicator - smaller on mobile */}
            <motion.div
              className="mt-4 sm:mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full text-xs sm:text-sm text-green-300">
                <TrendingUp className="size-3 sm:size-4" />
                <span>Alex earned <strong className="text-white">$120</strong> today</span>
              </div>
            </motion.div>

            {/* Quick Stats - tighter on mobile */}
            <motion.div
              className="mt-6 sm:mt-12 flex flex-wrap justify-center gap-4 sm:gap-8 text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex -space-x-1.5 sm:-space-x-2">
                  {["JM", "SK", "AL"].map((initials, i) => (
                    <div
                      key={i}
                      className="size-6 sm:size-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach border-2 border-white/20 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span className="text-xs sm:text-sm">
                  <strong className="text-white">2,500+</strong> creators
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-3 sm:size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs sm:text-sm">
                  <strong className="text-white">4.9/5</strong>
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator - hidden on very small screens */}
          <motion.div
            className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 6, 0] }}
            transition={{
              opacity: { delay: 1 },
              y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
            }}
          >
            <ChevronDown className="size-6 sm:size-8 text-white/50" />
          </motion.div>

          {/* Mute Toggle - smaller on mobile */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 p-2 sm:p-3 rounded-full bg-background/10 backdrop-blur-sm border border-white/20 text-white hover:bg-background/20 transition-all"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX className="size-4 sm:size-5" /> : <Volume2 className="size-4 sm:size-5" />}
          </button>
        </div>
      </section>

      {/* ============================================
          TWO PATHS SECTION
          Creator vs Reviewer paths - Tighter on mobile
          ============================================ */}
      <section className="py-10 sm:py-16 md:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-6 sm:mb-10"
            {...getMobileAnimation()}
          >
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
              Choose your path
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
              Whether you need feedback or want to give it
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Creator Path */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative p-5 sm:p-7 md:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 to-white dark:from-[var(--dark-tier-2)] dark:to-[var(--dark-tier-2)] border-2 border-blue-100 dark:border-accent-blue/30 hover:border-accent-blue/50 dark:hover:border-accent-blue/60 transition-all duration-300 hover:shadow-2xl h-full">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                  <div className="size-11 sm:size-14 rounded-xl sm:rounded-2xl bg-accent-blue flex items-center justify-center">
                    <Palette className="size-5 sm:size-7 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-accent-blue uppercase tracking-wide">For Creators</span>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-4">
                  Get feedback that actually helps
                </h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base md:text-lg">
                  Expert reviewers who understand your craft. Actionable insights within 24 hours.
                </p>

                <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-8">
                  {["Detailed, specific feedback", "24-hour turnaround", "100% confidential"].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3 text-foreground text-sm sm:text-base">
                      <CheckCircle className="size-4 sm:size-5 text-green-500 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  onClick={() => router.push("/register")}
                  className="w-full bg-accent-blue hover:bg-blue-600 active:scale-[0.98] active:bg-blue-700 text-white font-semibold py-4 sm:py-5 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-150 group/btn"
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Your First Review
                    <ArrowRight className="size-4 sm:size-5 group-hover/btn:translate-x-1 group-active/btn:translate-x-0.5 transition-transform" />
                  </span>
                </Button>
                <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2 sm:mt-4">Free to start</p>
              </div>
            </motion.div>

            {/* Reviewer Path - Stronger Visual, Tighter Mobile */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative p-5 sm:p-7 md:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50 dark:from-[var(--dark-tier-2)] dark:via-[var(--dark-tier-2)] dark:to-[var(--dark-tier-2)] border-2 border-accent-peach/40 dark:border-accent-peach/30 hover:border-accent-peach dark:hover:border-accent-peach/60 transition-all duration-300 hover:shadow-2xl shadow-lg h-full">
                {/* Decorative gradient glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-peach/20 to-amber-400/20 rounded-2xl sm:rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                    <div className="size-11 sm:size-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent-peach to-orange-600 flex items-center justify-center shadow-lg">
                      <Award className="size-5 sm:size-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-accent-peach uppercase tracking-wide">For Experts</span>
                        {/* Earn Income Badge - inline on mobile */}
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">
                          <DollarSign className="size-2.5 sm:size-3 mr-0.5" />
                          Earn
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 font-medium">
                        <TrendingUp className="size-2.5 sm:size-3" />
                        High demand
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                    Get paid for your expertise
                  </h3>
                  <p className="text-muted-foreground mb-3 sm:mb-5 text-sm sm:text-base md:text-lg">
                    Turn your knowledge into income. Set your own rates, work on your schedule.
                  </p>

                  {/* Earnings highlight - compact on mobile */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200 dark:border-green-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-5">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="size-8 sm:size-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                        <DollarSign className="size-4 sm:size-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Avg monthly earnings</div>
                        <div className="text-lg sm:text-xl font-bold text-foreground">$2,400+</div>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
                    {[
                      { text: "Earn $50-150 per review", icon: DollarSign },
                      { text: "Flexible schedule", icon: Clock },
                      { text: "Build your reputation", icon: TrendingUp },
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 sm:gap-3 text-foreground text-sm sm:text-base">
                        <div className="size-5 sm:size-6 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                          <benefit.icon className="size-3 sm:size-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        {benefit.text}
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="lg"
                    onClick={() => router.push("/apply/expert")}
                    className="w-full bg-gradient-to-r from-accent-peach to-orange-600 hover:from-orange-500 hover:to-orange-700 active:scale-[0.98] text-white font-semibold py-4 sm:py-5 text-sm sm:text-base rounded-lg sm:rounded-xl transition-all duration-150 group/btn shadow-lg active:shadow-md"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Start Earning Today
                      <ArrowRight className="size-4 sm:size-5 group-hover/btn:translate-x-1 group-active/btn:translate-x-0.5 transition-transform" />
                    </span>
                  </Button>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2 sm:mt-3">Join 200+ experts</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          CONTENT TYPES SECTION
          Compact cards on mobile
          ============================================ */}
      <section className="py-10 sm:py-14 md:py-20 bg-gradient-to-b from-slate-50 to-white dark:from-[var(--dark-tier-1)] dark:to-[var(--dark-tier-1)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-6 sm:mb-10"
            {...getMobileAnimation()}
          >
            <Badge variant="info" size="lg" className="mb-2 sm:mb-4 text-xs sm:text-sm">
              <Sparkles className="size-2.5 sm:size-3 mr-1" />
              All Creative Fields
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
              Experts across every creative field
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
              Whatever you create, we have vetted experts ready to help
            </p>
          </motion.div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-4">
            {[
              { icon: Camera, label: "Photo", color: "blue", gradient: "from-blue-50 to-cyan-50", borderColor: "border-blue-200" },
              { icon: Palette, label: "Design", color: "purple", gradient: "from-purple-50 to-violet-50", borderColor: "border-purple-200" },
              { icon: Video, label: "Video", color: "red", gradient: "from-red-50 to-rose-50", borderColor: "border-red-200" },
              { icon: PenTool, label: "Writing", color: "green", gradient: "from-green-50 to-emerald-50", borderColor: "border-green-200" },
              { icon: Mic, label: "Audio", color: "orange", gradient: "from-orange-50 to-amber-50", borderColor: "border-orange-200" },
              { icon: ImageIcon, label: "Art", color: "pink", gradient: "from-pink-50 to-rose-50", borderColor: "border-pink-200" },
              { icon: Play, label: "Stream", color: "violet", gradient: "from-violet-50 to-purple-50", borderColor: "border-violet-200" },
            ].map((type, index) => (
              <motion.div
                key={type.label}
                className="group cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={cn(
                  "p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br border hover:shadow-lg active:shadow-md transition-all duration-150 text-center h-full",
                  type.gradient,
                  type.borderColor,
                  "hover:border-accent-blue/40",
                  "dark:from-[var(--dark-tier-2)] dark:to-[var(--dark-tier-2)] dark:border-border dark:hover:border-accent-blue/40"
                )}>
                  <div
                    className={cn(
                      "size-9 sm:size-12 lg:size-12 mx-auto mb-1.5 sm:mb-3 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-active:scale-95",
                      type.color === "blue" && "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
                      type.color === "purple" && "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
                      type.color === "red" && "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
                      type.color === "green" && "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400",
                      type.color === "orange" && "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
                      type.color === "pink" && "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
                      type.color === "violet" && "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
                    )}
                  >
                    <type.icon className="size-4 sm:size-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-xs sm:text-sm leading-tight">{type.label}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-6 sm:mt-10"
            {...getMobileAnimation(0.3)}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/how-it-works")}
              className="font-semibold text-sm sm:text-base py-2.5 sm:py-3"
            >
              See How It Works
              <ArrowRight className="size-3.5 sm:size-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          PRICING SECTION
          Tighter on mobile, better contrast
          ============================================ */}
      <section className="py-10 sm:py-14 md:py-20 bg-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-6 sm:mb-10"
            {...getMobileAnimation()}
          >
            <Badge variant="success" size="lg" className="mb-2 sm:mb-3 text-xs sm:text-sm">
              Simple Pricing
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
              Invest in your craft
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Start free, upgrade when ready
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-3 sm:gap-5">
            {/* Free */}
            <motion.div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-background border border-border shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-4 sm:mb-5">
                <h3 className="text-sm sm:text-base font-bold text-muted-foreground uppercase tracking-wide mb-1">Free</h3>
                <div className="text-3xl sm:text-4xl font-black text-foreground">$0</div>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
                {[
                  "3 community reviews/month",
                  "All content types",
                  "48-hour turnaround"
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                    <CheckCircle className="size-3.5 sm:size-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => router.push("/register")}
                variant="outline"
                className="w-full py-3 sm:py-4 text-sm rounded-lg sm:rounded-xl active:scale-[0.98] transition-all duration-150"
              >
                Get Started
              </Button>
            </motion.div>

            {/* Pro - highlighted */}
            <motion.div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent-blue/10 to-blue-50 dark:from-accent-blue/10 dark:to-[var(--dark-tier-2)] border-2 border-accent-blue dark:border-accent-blue/60 shadow-lg relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-accent-blue text-white text-[10px] sm:text-xs shadow-lg">Most Popular</Badge>
              </div>
              <div className="mb-4 sm:mb-5 pt-1">
                <h3 className="text-sm sm:text-base font-bold text-accent-blue uppercase tracking-wide mb-1">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-foreground">$9</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-green-600 font-medium">Save $50+/month</p>
              </div>
              <ul className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6">
                {[
                  { text: "Unlimited reviews", icon: Sparkles },
                  { text: "24h faster turnaround", icon: Zap },
                  { text: "Priority queue", icon: TrendingUp },
                  { text: "15% off experts", icon: BadgeCheck },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-foreground text-xs sm:text-sm">
                    <div className="size-4 sm:size-5 rounded-full bg-accent-blue/10 flex items-center justify-center shrink-0">
                      <f.icon className="size-2.5 sm:size-3 text-accent-blue" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => router.push("/pricing")}
                className="w-full py-3 sm:py-4 text-sm rounded-lg sm:rounded-xl bg-accent-blue hover:bg-blue-600 active:scale-[0.98] active:bg-blue-700 shadow-md transition-all duration-150"
              >
                Upgrade to Pro
              </Button>
            </motion.div>

            {/* Expert Reviews */}
            <motion.div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-background border border-border shadow-sm relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2">
                <Badge variant="outline" className="bg-background border-accent-peach text-accent-peach text-[10px] sm:text-xs">
                  <Award className="size-2.5 sm:size-3 mr-0.5" />
                  Premium
                </Badge>
              </div>
              <div className="mb-4 sm:mb-5 pt-1">
                <h3 className="text-sm sm:text-base font-bold text-muted-foreground uppercase tracking-wide mb-1">Expert Reviews</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-foreground">$50</span>
                  <span className="text-sm text-muted-foreground">-150</span>
                </div>
                <p className="text-xs text-muted-foreground">Per review</p>
              </div>

              {/* Pro savings callout */}
              <div className="bg-accent-peach/10 rounded-lg p-2 sm:p-2.5 mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  <strong className="text-accent-peach">Pro saves 15%</strong> on all experts
                </p>
              </div>

              <ul className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6">
                {[
                  { text: "Industry experts", icon: Award },
                  { text: "Deep feedback", icon: MessageSquare },
                  { text: "24h guaranteed", icon: Clock },
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-foreground text-xs sm:text-sm">
                    <div className="size-4 sm:size-5 rounded-full bg-accent-peach/10 flex items-center justify-center shrink-0">
                      <f.icon className="size-2.5 sm:size-3 text-accent-peach" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => router.push("/browse")}
                className="w-full py-3 sm:py-4 text-sm rounded-lg sm:rounded-xl bg-gradient-to-r from-accent-peach to-orange-500 hover:from-orange-500 hover:to-orange-600 active:scale-[0.98] text-white transition-all duration-150"
              >
                Find Your Expert
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS SECTION - Compact on mobile
          ============================================ */}
      <section className="py-10 sm:py-14 md:py-20 bg-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-6 sm:mb-10"
            {...getMobileAnimation()}
          >
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-foreground">
              Loved by creators
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-3 sm:gap-5">
            {[
              {
                quote: "The expert caught issues I never would have seen—and explained exactly how to fix them.",
                author: "Sarah K.",
                role: "Product Designer",
                avatar: "SK",
              },
              {
                quote: "I earned $2,400 last month reviewing designs in my spare time. Genuinely rewarding.",
                author: "Alex R.",
                role: "Senior Designer • Reviewer",
                avatar: "AR",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-background border border-border shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex gap-0.5 mb-2 sm:mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="size-3 sm:size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 sm:mb-5 text-sm sm:text-base leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="size-9 sm:size-11 rounded-full bg-accent-blue flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm sm:text-base">{t.author}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA SECTION - Compact on mobile
          ============================================ */}
      <section className="py-12 sm:py-16 md:py-24 bg-accent-blue dark:bg-accent-blue relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div {...getMobileAnimation()} className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white">
              Ready to level up?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Join 2,500+ creators getting real feedback
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center pt-2">
              <Button
                size="lg"
                onClick={() => router.push("/register")}
                className="w-full sm:w-auto bg-white dark:bg-white text-accent-blue hover:bg-gray-100 dark:hover:bg-gray-100 font-semibold px-6 py-4 sm:px-8 sm:py-5 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-2xl"
              >
                Get Started Free
                <ArrowRight className="size-4 sm:size-5 ml-2" />
              </Button>
              <Button
                size="lg"
                onClick={() => router.push("/how-it-works")}
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 dark:hover:bg-white/20 font-semibold px-6 py-4 sm:px-8 sm:py-5 text-base sm:text-lg rounded-xl sm:rounded-2xl"
              >
                How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer router={router} />

      {/* Sticky Bottom CTA - Mobile - Compact */}
      <AnimatePresence>
        {showBottomCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl lg:hidden"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="w-full bg-accent-blue text-white font-semibold text-base rounded-xl min-h-[48px] shadow-lg group"
            >
              <span className="flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
                aria-label="Close video"
              >
                <X className="size-8" />
              </button>
              <video
                autoPlay
                controls
                className="w-full h-full rounded-2xl"
                src="/hero-video.mp4"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Footer Component
 */
function Footer({ router }: { router: ReturnType<typeof useRouter> }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
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
        { label: "How It Works", href: "/how-it-works" },
        { label: "Help Center", href: "/help" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
        { label: "Careers", href: "/careers" },
      ],
    },
  ];

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "https://twitter.com/critvue" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/critvue" },
    { name: "GitHub", icon: Github, href: "https://github.com/critvue" },
    { name: "Discord", icon: MessageSquare, href: "https://discord.gg/critvue" },
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-gray-900 dark:bg-[var(--dark-tier-1)] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-accent-blue mb-3">Critvue</h3>
            <p className="text-gray-400 dark:text-gray-400 text-sm mb-6 max-w-xs">
              Real feedback from real experts. Level up your creative work.
            </p>

            {/* Newsletter */}
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="size-4" />
                Thanks for subscribing!
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="flex-1 px-4 py-2 bg-gray-800 dark:bg-[var(--dark-tier-2)] border border-gray-700 dark:border-border rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                <Button type="submit" size="sm" className="bg-accent-blue hover:bg-accent-blue/90">
                  Subscribe
                </Button>
              </form>
            )}
          </div>

          {/* Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="hidden md:block">
              <h4 className="font-semibold mb-4 text-sm text-white">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => router.push(link.href)}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Mobile Accordion */}
          <div className="md:hidden col-span-full space-y-4">
            {footerSections.map((section) => (
              <div key={section.title} className="border-b border-gray-700 dark:border-gray-800 pb-4">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
                  className="w-full flex items-center justify-between font-semibold min-h-[44px] text-white"
                >
                  {section.title}
                  <ChevronDown className={cn("size-5 transition-transform text-gray-400", expandedSection === section.title && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {expandedSection === section.title && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-2"
                    >
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <button
                            onClick={() => router.push(link.href)}
                            className="text-gray-400 hover:text-white text-sm py-2"
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

        {/* Social Links */}
        <div className="flex justify-center gap-4 mb-8 pb-8 border-b border-gray-700 dark:border-gray-800">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="size-10 flex items-center justify-center bg-gray-800 dark:bg-[var(--dark-tier-2)] hover:bg-gray-700 dark:hover:bg-[var(--dark-tier-3)] text-gray-400 hover:text-white rounded-lg transition-all"
            >
              <social.icon className="size-5" />
            </a>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>&copy; 2025 Critvue. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => router.push("/privacy")} className="hover:text-white">Privacy</button>
            <button onClick={() => router.push("/terms")} className="hover:text-white">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
