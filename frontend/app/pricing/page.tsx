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
import { Switch } from "@/components/ui/switch";
import { CheckCircle, ArrowRight, Star, Crown, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractApiErrorMessage } from "@/lib/api/client";

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Pricing constants
  const MONTHLY_PRICE = 9;
  const ANNUAL_PRICE = 90; // $7.50/month, save 17%
  const ANNUAL_SAVINGS = Math.round((1 - ANNUAL_PRICE / (MONTHLY_PRICE * 12)) * 100);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push("/register?redirect=/pricing");
      return;
    }

    setIsLoading(true);
    try {
      // Call backend to create Stripe checkout session
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/checkout`, {
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
        throw new Error(extractApiErrorMessage(error, "Failed to create checkout session"));
      }

      const data = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (error: any) {
      console.error("Subscription error:", error);
      alert(error.message || "Failed to start subscription. Please try again.");
      setIsLoading(false);
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
      isLoading: false,
    },
    {
      name: "Pro",
      price: isAnnual ? `$${Math.round(ANNUAL_PRICE / 12)}` : `$${MONTHLY_PRICE}`,
      period: isAnnual ? "per month, billed annually" : "per month",
      originalPrice: isAnnual ? `$${MONTHLY_PRICE}` : null,
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
      isLoading: isLoading,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <section className="relative pt-20 pb-8 px-6 md:pt-32 md:pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="info" size="lg" className="mb-4">
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Your Plan
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees, cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="pb-8 px-6">
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className={cn(
            "text-sm font-medium transition-colors",
            !isAnnual ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
          )}>
            Monthly
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-accent-blue"
          />
          <span className={cn(
            "text-sm font-medium transition-colors",
            isAnnual ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
          )}>
            Annual
          </span>
          {isAnnual && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Save {ANNUAL_SAVINGS}%
            </Badge>
          )}
        </motion.div>
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
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
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
          ? "border-accent-blue shadow-2xl md:scale-105 bg-white dark:bg-gray-800"
          : "border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:shadow-xl"
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
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-accent-blue text-white text-sm font-bold tracking-wide uppercase shadow-lg shadow-accent-blue/40">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "p-3 rounded-xl",
            tier.popular ? "bg-accent-blue/10" : "bg-gray-100 dark:bg-gray-700"
          )}>
            <Icon className={cn(
              "size-6",
              tier.popular ? "text-accent-blue" : "text-gray-600 dark:text-gray-400"
            )} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{tier.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          {tier.originalPrice && (
            <span className="text-2xl font-medium text-gray-400 line-through">
              {tier.originalPrice}
            </span>
          )}
          <span className="text-5xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
        </div>
        <span className="text-gray-600 dark:text-gray-400 text-sm">/ {tier.period}</span>
      </div>

      <ul className="space-y-3 mb-8">
        {tier.features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="size-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        onClick={tier.ctaAction}
        disabled={tier.isLoading}
        className={cn(
          "w-full min-h-[56px] font-semibold rounded-xl touch-manipulation",
          tier.popular
            ? "bg-accent-blue hover:bg-accent-blue/90 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        )}
      >
        {tier.isLoading ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {tier.cta}
            <ArrowRight className="ml-2 size-5" />
          </>
        )}
      </Button>

      {/* Trust signals for Pro tier */}
      {tier.popular && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Shield className="size-3.5" />
              <span>30-day money-back</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="size-3.5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white pr-4">{question}</h3>
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
          <p className="text-gray-600 dark:text-gray-400">{answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
