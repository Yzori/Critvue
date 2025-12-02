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
    <div className="min-h-screen bg-white">
      {/* ============================================
          VIDEO HERO SECTION
          Full viewport, cinematic experience
          ============================================ */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
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
        <div className="relative z-10 h-full flex flex-col justify-center items-center px-6 text-center">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <Badge
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white px-4 py-2 text-sm"
              >
                <Sparkles className="size-4 mr-2" />
                Human feedback for the AI age
              </Badge>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
              Your work deserves
              <br />
              <span className="bg-gradient-to-r from-accent-blue via-cyan-400 to-accent-peach bg-clip-text text-transparent">
                real feedback
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Expert critiques from humans who understand your craft.
              <span className="hidden sm:inline"> Not AI telling you what you want to hear.</span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => router.push("/register")}
                className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-6 text-lg rounded-2xl min-h-[56px] shadow-2xl hover:shadow-3xl transition-all duration-300 group"
              >
                <span className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <Button
                size="lg"
                onClick={() => setIsVideoModalOpen(true)}
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-2xl min-h-[56px] backdrop-blur-sm transition-all duration-300 group"
              >
                <span className="flex items-center gap-2">
                  <Play className="size-5 fill-current" />
                  Watch Video
                </span>
              </Button>
            </div>

            {/* Quick Stats */}
            <motion.div
              className="mt-12 flex flex-wrap justify-center gap-8 text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["JM", "SK", "AL"].map((initials, i) => (
                    <div
                      key={i}
                      className="size-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span className="text-sm">
                  <strong className="text-white">2,500+</strong> creators
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm">
                  <strong className="text-white">4.9/5</strong> rating
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{
              opacity: { delay: 1.2 },
              y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
            }}
          >
            <ChevronDown className="size-8 text-white/50" />
          </motion.div>

          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-8 right-8 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </div>
      </section>

      {/* ============================================
          TWO PATHS SECTION
          Creator vs Reviewer paths
          ============================================ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            {...getMobileAnimation()}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose your path
            </h2>
            <p className="text-gray-600 text-lg">
              Whether you need feedback or want to give it
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Creator Path */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 hover:border-accent-blue/50 transition-all duration-300 hover:shadow-2xl h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-14 rounded-2xl bg-accent-blue flex items-center justify-center">
                    <Palette className="size-7 text-white" />
                  </div>
                  <span className="text-sm font-bold text-accent-blue uppercase tracking-wide">For Creators</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Get feedback that actually helps
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Expert reviewers who understand your craft. Actionable insights within 24 hours.
                </p>

                <ul className="space-y-3 mb-8">
                  {["Detailed, specific feedback", "24-hour turnaround", "100% confidential"].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="size-5 text-green-500 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  onClick={() => router.push("/register")}
                  className="w-full bg-accent-blue hover:bg-blue-600 text-white font-semibold py-6 rounded-xl group/btn"
                >
                  <span className="flex items-center justify-center gap-2">
                    Get Your First Review
                    <ArrowRight className="size-5 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </Button>
                <p className="text-sm text-gray-500 text-center mt-4">Free to start</p>
              </div>
            </motion.div>

            {/* Reviewer Path */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100 hover:border-accent-peach/50 transition-all duration-300 hover:shadow-2xl h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-14 rounded-2xl bg-accent-peach flex items-center justify-center">
                    <Award className="size-7 text-white" />
                  </div>
                  <span className="text-sm font-bold text-accent-peach uppercase tracking-wide">For Experts</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Get paid for your expertise
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Turn your knowledge into income. Set your own rates, work on your schedule.
                </p>

                <ul className="space-y-3 mb-8">
                  {["Earn $50-150 per review", "Flexible schedule", "Build your reputation"].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="size-5 text-green-500 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  onClick={() => router.push("/apply/expert")}
                  className="w-full bg-accent-peach hover:bg-orange-500 text-white font-semibold py-6 rounded-xl group/btn"
                >
                  <span className="flex items-center justify-center gap-2">
                    Apply as Reviewer
                    <ArrowRight className="size-5 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                </Button>
                <p className="text-sm text-gray-500 text-center mt-4">Join 200+ experts</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          CONTENT TYPES SECTION
          What you can get reviewed
          ============================================ */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            {...getMobileAnimation()}
          >
            <Badge variant="info" size="lg" className="mb-4">
              What We Review
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Feedback for any creative work
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Camera, label: "Photography", color: "blue" },
              { icon: Palette, label: "Design", color: "purple" },
              { icon: Video, label: "Video", color: "red" },
              { icon: PenTool, label: "Writing", color: "green" },
              { icon: Mic, label: "Audio", color: "orange" },
              { icon: ImageIcon, label: "Art", color: "pink" },
            ].map((type, index) => (
              <motion.div
                key={type.label}
                className="group"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -4 }}
              >
                <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-accent-blue/30 hover:shadow-lg transition-all duration-300 text-center">
                  <div
                    className={cn(
                      "size-12 mx-auto mb-3 rounded-xl flex items-center justify-center",
                      type.color === "blue" && "bg-blue-100 text-blue-600",
                      type.color === "purple" && "bg-purple-100 text-purple-600",
                      type.color === "red" && "bg-red-100 text-red-600",
                      type.color === "green" && "bg-green-100 text-green-600",
                      type.color === "orange" && "bg-orange-100 text-orange-600",
                      type.color === "pink" && "bg-pink-100 text-pink-600"
                    )}
                  >
                    <type.icon className="size-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{type.label}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-10"
            {...getMobileAnimation(0.3)}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/how-it-works")}
              className="font-semibold"
            >
              See How It Works
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          PRICING SECTION
          Simple, clear pricing
          ============================================ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            {...getMobileAnimation()}
          >
            <Badge variant="success" size="lg" className="mb-4">
              Simple Pricing
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Start free, upgrade when ready
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <motion.div
              className="p-8 rounded-3xl bg-gray-50 border-2 border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-black text-gray-900">$0</div>
              </div>
              <ul className="space-y-3 mb-8">
                {["3 community reviews/month", "All content types", "Quick turnaround"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="size-4 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => router.push("/register")}
                variant="outline"
                className="w-full py-5 rounded-xl"
              >
                Get Started
              </Button>
            </motion.div>

            {/* Pro */}
            <motion.div
              className="p-8 rounded-3xl bg-gradient-to-br from-accent-blue/5 to-blue-50 border-2 border-accent-blue/30 md:scale-105 shadow-xl relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute -top-3 right-6">
                <Badge className="bg-accent-blue text-white">Most Popular</Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="text-4xl font-black text-gray-900">
                  $9<span className="text-lg font-normal text-gray-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {["Unlimited community reviews", "15% off expert reviews", "Priority queue"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="size-4 text-accent-blue" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => router.push("/pricing")}
                className="w-full py-5 rounded-xl bg-accent-blue hover:bg-blue-600"
              >
                Upgrade to Pro
              </Button>
            </motion.div>

            {/* Expert */}
            <motion.div
              className="p-8 rounded-3xl bg-gradient-to-br from-accent-peach/5 to-orange-50 border-2 border-accent-peach/30"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Reviews</h3>
                <div className="text-4xl font-black text-gray-900">
                  $50<span className="text-lg font-normal text-gray-500">-150</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {["Human expert reviewers", "Personalized critique", "24h turnaround"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                    <CheckCircle className="size-4 text-accent-peach" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => router.push("/browse")}
                variant="outline"
                className="w-full py-5 rounded-xl border-accent-peach text-accent-peach hover:bg-accent-peach/10"
              >
                Browse Experts
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS SECTION
          ============================================ */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            {...getMobileAnimation()}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by creators
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
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
                className="p-8 rounded-2xl bg-white border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-accent-blue flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{t.author}</div>
                    <div className="text-sm text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA SECTION
          ============================================ */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-accent-blue via-accent-blue/90 to-accent-peach">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div {...getMobileAnimation()} className="space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
              Ready to level up?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join 2,500+ creators getting real feedback
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push("/register")}
                className="w-full sm:w-auto bg-white text-accent-blue hover:bg-gray-50 font-semibold px-8 py-6 text-lg rounded-2xl shadow-2xl"
              >
                Get Started Free
                <ArrowRight className="size-5 ml-2" />
              </Button>
              <Button
                size="lg"
                onClick={() => router.push("/how-it-works")}
                variant="outline"
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-2xl"
              >
                See How It Works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer router={router} />

      {/* Sticky Bottom CTA - Mobile */}
      <AnimatePresence>
        {showBottomCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl lg:hidden"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="w-full bg-accent-blue text-white font-semibold text-lg rounded-2xl min-h-[56px] shadow-lg group"
            >
              <span className="flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
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
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-accent-blue mb-3">Critvue</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
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
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
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
              <h4 className="font-semibold mb-4 text-sm">{section.title}</h4>
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
              <div key={section.title} className="border-b border-gray-800 pb-4">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
                  className="w-full flex items-center justify-between font-semibold min-h-[44px]"
                >
                  {section.title}
                  <ChevronDown className={cn("size-5 transition-transform", expandedSection === section.title && "rotate-180")} />
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
        <div className="flex justify-center gap-4 mb-8 pb-8 border-b border-gray-800">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="size-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all"
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
