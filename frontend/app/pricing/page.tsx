"use client";

/**
 * Subscription Pricing Page - Free vs Pro Tier
 * Mobile-first design with clear value proposition
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push("/register?redirect=/pricing");
      return;
    }

    try {
      // Call backend to create Stripe checkout session
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          success_url: `${window.location.origin}/dashboard?subscription=success`,
          cancel_url: `${window.location.origin}/pricing?subscription=canceled`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create checkout session");
      }

      const data = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (error: any) {
      console.error("Subscription error:", error);
      alert(error.message || "Failed to start subscription. Please try again.");
    }
  };

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "3 community reviews per month",
        "AI-powered instant feedback",
        "Full price for expert reviews",
        "Standard queue",
        "Access to review marketplace",
        "Basic analytics",
      ],
      cta: "Get Started",
      ctaAction: () => router.push(isAuthenticated ? "/review/new" : "/register"),
      popular: false,
      icon: Star,
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "Unlock unlimited reviews and discounts",
      features: [
        "Unlimited community reviews",
        "15% discount on expert reviews",
        "Priority queue for expert reviews",
        "AI-powered instant feedback",
        "Advanced analytics",
        "Early access to new features",
        "Priority support",
      ],
      cta: isAuthenticated ? "Upgrade to Pro" : "Start Pro Trial",
      ctaAction: handleSubscribe,
      popular: true,
      icon: Crown,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <section className="relative pt-20 pb-12 px-6 md:pt-32 md:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="info" size="lg" className="mb-4">
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Choose Your Plan
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees, cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {pricingTiers.map((tier, index) => (
              <PricingCard
                key={tier.name}
                tier={tier}
                index={index}
                prefersReducedMotion={prefersReducedMotion ?? false}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-6">
            <FAQItem
              question="What happens when I hit the 3 review limit on Free?"
              answer="You'll need to wait until the next month (resets on the 1st) or upgrade to Pro for unlimited community reviews."
            />
            <FAQItem
              question="Can I cancel my Pro subscription anytime?"
              answer="Yes! You can cancel anytime and you'll keep Pro benefits until the end of your billing period."
            />
            <FAQItem
              question="How does the 15% expert review discount work?"
              answer="Pro members automatically get 15% off all expert reviews. The discount is applied at checkout."
            />
            <FAQItem
              question="What's the priority queue?"
              answer="Pro members' expert review requests are shown first to reviewers, resulting in faster turnaround times."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-gradient-to-r from-accent-blue to-accent-purple rounded-3xl p-8 md:p-12 text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Ready to level up your creative work?
            </h2>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Join thousands of creators getting better feedback, faster.
            </p>
            <Button
              size="lg"
              onClick={() => router.push(isAuthenticated ? "/review/new" : "/register")}
              className="bg-white text-accent-blue hover:bg-gray-100 min-h-[56px] px-8 text-lg font-semibold"
            >
              {isAuthenticated ? "Create Review Request" : "Get Started Free"}
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function PricingCard({
  tier,
  index,
  prefersReducedMotion,
}: {
  tier: any;
  index: number;
  prefersReducedMotion: boolean;
}) {
  const Icon = tier.icon;

  return (
    <motion.div
      className={cn(
        "relative p-8 rounded-3xl border-2 transition-all duration-300",
        tier.popular
          ? "border-accent-blue shadow-2xl md:scale-105 bg-white"
          : "border-gray-200 bg-white/60 backdrop-blur-sm hover:shadow-xl"
      )}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.6,
        delay: prefersReducedMotion ? 0 : index * 0.1,
      }}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge variant="info" size="md" className="bg-accent-blue text-white">
            Most Popular
          </Badge>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "p-3 rounded-xl",
            tier.popular ? "bg-accent-blue/10" : "bg-gray-100"
          )}>
            <Icon className={cn(
              "size-6",
              tier.popular ? "text-accent-blue" : "text-gray-600"
            )} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
        </div>
        <p className="text-sm text-gray-600">{tier.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
          <span className="text-gray-600">/ {tier.period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {tier.features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="size-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        onClick={tier.ctaAction}
        className={cn(
          "w-full min-h-[56px] font-semibold rounded-xl touch-manipulation",
          tier.popular
            ? "bg-accent-blue hover:bg-accent-blue/90 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
        )}
      >
        {tier.cta}
        <ArrowRight className="ml-2 size-5" />
      </Button>
    </motion.div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between"
      >
        <h3 className="font-semibold text-gray-900 pr-4">{question}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRight className="size-5 text-gray-400 rotate-90" />
        </motion.div>
      </button>

      {isOpen && (
        <motion.div
          className="px-6 pb-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-gray-600">{answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
