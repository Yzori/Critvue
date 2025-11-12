"use client";

/**
 * Critvue Homepage - "Living Critique" Experience
 *
 * A standout homepage that demonstrates the value of critique through
 * interactive design and dual perspective storytelling.
 *
 * Key Features:
 * - Interactive critique demo in hero
 * - Asymmetric bento grid layouts
 * - Glassmorphic design with brand colors
 * - Scroll-triggered animations
 * - Dual perspective toggle (creator/reviewer)
 * - Mobile-first responsive design
 */

import { useState, useEffect, useRef } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
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
  Eye,
  Heart,
  Code,
  Palette,
  Video,
  Mic,
  PenTool,
  Image as ImageIcon,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [perspective, setPerspective] = useState<"creator" | "reviewer">("creator");
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();

  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Auto-cycle critique markers on load
  useEffect(() => {
    const markers = [1, 2, 3];
    let index = 0;

    const interval = setInterval(() => {
      setActiveMarker(markers[index]);
      index = (index + 1) % markers.length;
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section - Interactive Split Canvas */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent-peach/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              style={{ y: heroY, opacity }}
              className="space-y-8"
            >
              {/* Headline with progressive reveal */}
              <div className="space-y-2">
                <motion.h1
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  Turn feedback into your
                </motion.h1>
                <motion.h1
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  creative advantage
                </motion.h1>
              </div>

              {/* Supporting text */}
              <motion.p
                className="text-xl text-gray-600 max-w-lg leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Get AI-powered insights in seconds, or expert reviews from top creators in your field.
                Critvue transforms critique from dreaded to game-changing.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button
                  size="lg"
                  onClick={() => router.push("/auth/register")}
                  className="bg-gradient-to-r from-accent-blue to-accent-peach hover:shadow-xl hover:scale-105 text-white font-semibold px-8 py-6 text-lg rounded-2xl min-h-[56px] transition-all duration-300 group"
                >
                  Get Your First Review Free
                  <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/browse")}
                  className="border-2 border-accent-blue/30 hover:border-accent-blue hover:bg-accent-blue/5 font-semibold px-8 py-6 text-lg rounded-2xl min-h-[56px] transition-all duration-300"
                >
                  Browse Expert Reviewers
                </Button>
              </motion.div>

              {/* Social proof ticker */}
              <motion.div
                className="inline-flex items-center gap-6 px-6 py-3 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CheckCircle className="size-4 text-green-500" />
                  <span>2,500+ reviews</span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Star className="size-4 text-amber-400 fill-amber-400" />
                  <span>98% satisfaction</span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="size-4 text-accent-blue" />
                  <span>24hr avg turnaround</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Interactive Critique Demo */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <InteractiveCritiqueDemo
                activeMarker={activeMarker}
                onMarkerClick={setActiveMarker}
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2 text-gray-400"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-sm font-medium">Scroll to explore</span>
            <ArrowRight className="size-4 rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works - 3-Step Flow */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="info" size="lg" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              From upload to iteration in 3 simple steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get actionable feedback that moves your work forward
            </p>
          </motion.div>

          {/* 3-step cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: Upload,
                title: "Upload Your Work",
                description: "Share your design, code, video, or any creative work. Add context about what feedback you need most.",
                color: "accent-blue",
              },
              {
                step: "2",
                icon: MessageSquare,
                title: "Get Expert Feedback",
                description: "Choose AI insights or human expert reviews. Receive detailed, actionable critique within 24 hours.",
                color: "accent-peach",
              },
              {
                step: "3",
                icon: Sparkles,
                title: "Iterate & Ship",
                description: "Apply feedback, refine your work, and ship with confidence. Track improvement over time.",
                color: "accent-blue",
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                className="relative"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {/* Connecting line (desktop only) */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-accent-blue/30 to-transparent -z-10" />
                )}

                <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-accent-blue/30 hover:shadow-xl transition-all duration-300 group">
                  {/* Step number badge */}
                  <div className="inline-flex items-center justify-center size-12 rounded-full bg-accent-blue/10 text-accent-blue font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-${step.color}/10 to-${step.color}/5 mb-6`}>
                    <step.icon className={`size-8 text-${step.color}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Perspective - Toggle between Creator & Reviewer */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="info" size="lg" className="mb-4">
              Built For Both Sides
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Whether you're creating or critiquing
            </h2>

            {/* Perspective toggle */}
            <div className="inline-flex items-center gap-2 p-2 rounded-2xl bg-white border-2 border-gray-200 shadow-lg">
              <button
                onClick={() => setPerspective("creator")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  perspective === "creator"
                    ? "bg-accent-blue text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                I'm a Creator
              </button>
              <button
                onClick={() => setPerspective("reviewer")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  perspective === "reviewer"
                    ? "bg-accent-peach text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                I'm a Reviewer
              </button>
            </div>
          </motion.div>

          {/* Perspective content */}
          <motion.div
            key={perspective}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            {perspective === "creator" ? (
              <>
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Get feedback that makes a difference
                  </h3>
                  <ul className="space-y-4">
                    {[
                      { icon: Target, text: "Specific, actionable critique on what matters most" },
                      { icon: Clock, text: "Fast turnaround - most reviews within 24 hours" },
                      { icon: Shield, text: "Confidential and secure - your work stays private" },
                      { icon: TrendingUp, text: "Track improvement across multiple iterations" },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="size-6 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <item.icon className="size-4 text-accent-blue" />
                        </div>
                        <span className="text-lg text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    onClick={() => router.push("/review/new")}
                    className="bg-accent-blue hover:bg-accent-blue/90 text-white"
                  >
                    Request Your First Review
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </div>
                <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-accent-blue/10 to-accent-blue/5 border border-accent-blue/20 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Eye className="size-32 opacity-20" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-accent-peach/10 to-accent-peach/5 border border-accent-peach/20 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Heart className="size-32 opacity-20" />
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Share your expertise and get paid
                  </h3>
                  <ul className="space-y-4">
                    {[
                      { icon: Award, text: "Earn $50-$150 per review based on your expertise" },
                      { icon: Users, text: "Build your reputation in the creative community" },
                      { icon: Zap, text: "Flexible schedule - review when it works for you" },
                      { icon: TrendingUp, text: "Help creators level up their craft" },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="size-6 rounded-full bg-accent-peach/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <item.icon className="size-4 text-accent-peach" />
                        </div>
                        <span className="text-lg text-gray-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    onClick={() => router.push("/auth/register")}
                    className="bg-accent-peach hover:bg-accent-peach/90 text-white"
                  >
                    Become a Reviewer
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content Types - Asymmetric Bento Grid */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="info" size="lg" className="mb-4">
              All Creative Work Welcome
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get feedback on anything you create
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From design to code, video to writing - expert reviewers for every medium
            </p>
          </motion.div>

          {/* Asymmetric grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Palette, label: "Design", color: "blue" },
              { icon: Code, label: "Code", color: "peach" },
              { icon: Video, label: "Video", color: "blue" },
              { icon: Mic, label: "Audio", color: "peach" },
              { icon: PenTool, label: "Writing", color: "blue" },
              { icon: ImageIcon, label: "Art", color: "peach" },
            ].map((type, index) => (
              <motion.div
                key={type.label}
                className={`p-6 rounded-2xl bg-gradient-to-br ${
                  type.color === "blue"
                    ? "from-accent-blue/5 to-accent-blue/10 border border-accent-blue/20"
                    : "from-accent-peach/5 to-accent-peach/10 border border-accent-peach/20"
                } hover:shadow-xl transition-all duration-300 group cursor-pointer ${
                  index === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className={`inline-flex items-center justify-center ${
                  index === 0 ? "size-20" : "size-12"
                } rounded-xl bg-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  <type.icon className={`${
                    index === 0 ? "size-10" : "size-6"
                  } ${type.color === "blue" ? "text-accent-blue" : "text-accent-peach"}`} />
                </div>
                <h3 className={`${
                  index === 0 ? "text-2xl" : "text-xl"
                } font-bold text-gray-900`}>
                  {type.label}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="info" size="lg" className="mb-4">
              Transparent Pricing
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose the expertise level you need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From quick AI insights to deep expert reviews
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "AI Review",
                price: "Free",
                period: "forever",
                description: "Perfect for quick feedback and early iterations",
                features: [
                  "GPT-4 powered analysis",
                  "Instant feedback",
                  "Basic recommendations",
                  "Unlimited reviews",
                ],
                cta: "Start Free",
                popular: false,
                color: "gray",
              },
              {
                name: "Junior Expert",
                price: "$49",
                period: "per review",
                description: "Quality feedback from experienced creators",
                features: [
                  "2-5 years experience",
                  "Detailed written critique",
                  "Actionable suggestions",
                  "24-48 hour turnaround",
                ],
                cta: "Get Review",
                popular: true,
                color: "blue",
              },
              {
                name: "Senior Expert",
                price: "$99",
                period: "per review",
                description: "Industry veterans with proven track records",
                features: [
                  "8+ years experience",
                  "Comprehensive analysis",
                  "Portfolio examples",
                  "Priority 24hr delivery",
                ],
                cta: "Get Review",
                popular: false,
                color: "peach",
              },
            ].map((tier, index) => (
              <motion.div
                key={tier.name}
                className={`relative p-8 rounded-3xl border-2 ${
                  tier.popular
                    ? "border-accent-blue shadow-2xl scale-105 bg-white"
                    : "border-gray-200 bg-white/60 backdrop-blur-sm"
                } transition-all duration-300 hover:shadow-xl`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="info" size="md" className="bg-accent-blue text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-sm text-gray-600">{tier.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600">/ {tier.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="size-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  onClick={() => router.push(tier.price === "Free" ? "/review/new" : "/auth/register")}
                  className={`w-full ${
                    tier.popular
                      ? "bg-accent-blue hover:bg-accent-blue/90 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 2500, suffix: "+", label: "Reviews Delivered", icon: CheckCircle },
              { value: 98, suffix: "%", label: "Satisfaction Rate", icon: Star },
              { value: 24, suffix: "h", label: "Avg Turnaround", icon: Clock },
              { value: 150, suffix: "+", label: "Expert Reviewers", icon: Users },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-blue/5 mb-4">
                  <stat.icon className="size-8 text-accent-blue" />
                </div>
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2"
                />
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-accent-blue via-accent-blue/90 to-accent-peach">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-4xl lg:text-6xl font-bold text-white">
              Ready to transform your creative work?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of creators getting better feedback, faster
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => router.push("/auth/register")}
                className="bg-white text-accent-blue hover:bg-gray-50 font-semibold px-8 py-6 text-lg rounded-2xl min-h-[56px] shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Start Free
                <ArrowRight className="ml-2 size-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/browse")}
                className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg rounded-2xl min-h-[56px] transition-all duration-300"
              >
                Browse Experts
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent">
                Critvue
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Transform feedback into your creative advantage with AI-powered insights and expert reviews.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-3">
                {[
                  { label: "Browse Reviews", href: "/browse" },
                  { label: "Request Review", href: "/review/new" },
                  { label: "Become Reviewer", href: "/auth/register" },
                  { label: "Pricing", href: "#pricing" },
                ].map((link) => (
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

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-3">
                {[
                  { label: "Documentation", href: "/docs" },
                  { label: "API", href: "/api" },
                  { label: "Support", href: "/support" },
                  { label: "Blog", href: "/blog" },
                ].map((link) => (
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

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: "About", href: "/about" },
                  { label: "Careers", href: "/careers" },
                  { label: "Privacy", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                ].map((link) => (
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
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 Critvue. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 touch-manipulation" aria-label="Twitter">
                <span className="sr-only">Twitter</span>
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 touch-manipulation" aria-label="GitHub">
                <span className="sr-only">GitHub</span>
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 touch-manipulation" aria-label="LinkedIn">
                <span className="sr-only">LinkedIn</span>
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Interactive Critique Demo Component
 * Shows a live example of Critvue feedback with explorable markers
 */
interface InteractiveCritiqueDemoProps {
  activeMarker: number | null;
  onMarkerClick: (marker: number | null) => void;
}

function InteractiveCritiqueDemo({ activeMarker, onMarkerClick }: InteractiveCritiqueDemoProps) {
  const critiques = [
    {
      id: 1,
      position: { top: "20%", left: "30%" },
      title: "Improve Visual Hierarchy",
      feedback: "The headline could be more prominent. Consider increasing font size and using a bolder weight to draw attention.",
      severity: "medium",
    },
    {
      id: 2,
      position: { top: "50%", right: "25%" },
      title: "Great Color Choice",
      feedback: "Love the use of the brand colors here. The gradient creates nice depth and draws the eye naturally.",
      severity: "positive",
    },
    {
      id: 3,
      position: { bottom: "25%", left: "20%" },
      title: "Consider Mobile Tap Targets",
      feedback: "These buttons look good but ensure they meet the 48px minimum touch target size on mobile devices.",
      severity: "low",
    },
  ];

  return (
    <div className="relative w-full aspect-[4/3] rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white/40 shadow-2xl overflow-hidden group">
      {/* Realistic design mockup */}
      <div className="absolute inset-0 p-8">
        <div className="h-full rounded-2xl bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 p-8 space-y-6 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Nav bar */}
          <div className="relative flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-peach" />
              <div className="h-3 w-20 bg-gray-300 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-7 bg-gray-200 rounded-lg" />
              <div className="w-7 h-7 bg-accent-blue/20 rounded-lg" />
            </div>
          </div>

          {/* Hero content */}
          <div className="relative space-y-3">
            <div className="h-10 w-3/4 bg-gray-800 rounded-lg" />
            <div className="h-5 w-full bg-gray-300 rounded" />
            <div className="h-5 w-4/5 bg-gray-300 rounded" />
          </div>

          {/* CTA buttons */}
          <div className="relative flex gap-3 pt-2">
            <div className="h-12 w-40 bg-gradient-to-r from-accent-blue to-accent-blue/80 rounded-xl shadow-lg" />
            <div className="h-12 w-36 border-2 border-accent-blue/30 rounded-xl" />
          </div>

          {/* Feature cards preview */}
          <div className="relative grid grid-cols-3 gap-3 pt-4">
            <div className="h-20 bg-white rounded-xl shadow-sm border border-gray-100" />
            <div className="h-20 bg-white rounded-xl shadow-sm border border-gray-100" />
            <div className="h-20 bg-white rounded-xl shadow-sm border border-gray-100" />
          </div>
        </div>
      </div>

      {/* Critique markers */}
      {critiques.map((critique) => (
        <motion.div
          key={critique.id}
          className="absolute z-10"
          style={critique.position}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: critique.id * 0.2, duration: 0.4 }}
        >
          {/* Marker button - 48px touch target for mobile accessibility */}
          <motion.button
            onClick={() => onMarkerClick(activeMarker === critique.id ? null : critique.id)}
            className={`size-12 rounded-full font-bold shadow-lg transition-all duration-300 touch-manipulation ${
              activeMarker === critique.id
                ? "bg-accent-blue text-white ring-4 ring-accent-blue/30 scale-125"
                : "bg-white text-accent-blue hover:scale-110 hover:ring-4 hover:ring-accent-blue/20"
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`View critique ${critique.id}: ${critique.title}`}
          >
            {critique.id}
          </motion.button>

          {/* Feedback tooltip */}
          {activeMarker === critique.id && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 p-4 rounded-xl bg-white/95 backdrop-blur-lg shadow-xl border border-white/60 z-20"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {critique.title}
                  </h4>
                  <Badge
                    variant={
                      critique.severity === "positive"
                        ? "success"
                        : critique.severity === "medium"
                        ? "warning"
                        : "info"
                    }
                    size="sm"
                  >
                    {critique.severity === "positive" ? "✓" : "!"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {critique.feedback}
                </p>
              </div>
              {/* Arrow pointer */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 border-l border-t border-white/60 rotate-45" />
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Hover hint */}
      <motion.div
        className="absolute bottom-4 right-4 text-xs text-gray-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 2 }}
      >
        Click markers to explore feedback
      </motion.div>
    </div>
  );
}

/**
 * Animated Counter Component
 * Counts up from 0 to target value when scrolled into view
 */
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  className?: string;
}

function AnimatedCounter({ value, suffix = "", className = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          // Animate counter
          const duration = 2000; // 2 seconds
          const steps = 60;
          const increment = value / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={counterRef} className={className}>
      {count}{suffix}
    </div>
  );
}
