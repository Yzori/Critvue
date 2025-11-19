"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Pricing Section - Mobile-Optimized Expandable Cards
 * Progressive enhancement to side-by-side on desktop
 */
export default function PricingSection({ router }: { router: any }) {
  const [expandedTier, setExpandedTier] = useState<number>(0); // Default to "Most Popular"
  const prefersReducedMotion = useReducedMotion();

  const pricingTiers = [
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
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        >
          <Badge variant="info" size="lg" className="mb-4">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose the expertise level you need
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            From experienced creators to industry veterans
          </p>
        </motion.div>

        {/* Mobile: Expandable cards | Desktop: Side-by-side */}
        <div className="md:hidden space-y-4">
          {pricingTiers.map((tier, index) => (
            <PricingCardMobile
              key={tier.name}
              tier={tier}
              index={index}
              isExpanded={expandedTier === index}
              onToggle={() => setExpandedTier(expandedTier === index ? -1 : index)}
              router={router}
            />
          ))}
        </div>

        {/* Desktop: Grid layout (existing design) */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <PricingCardDesktop
              key={tier.name}
              tier={tier}
              index={index}
              router={router}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Mobile Pricing Card - Expandable/Collapsible
 */
function PricingCardMobile({
  tier,
  index,
  isExpanded,
  onToggle,
  router,
}: {
  tier: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  router: any;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "rounded-3xl border-2 bg-white transition-all duration-300",
        tier.popular
          ? "border-accent-blue shadow-lg"
          : "border-gray-200",
        isExpanded && "shadow-xl"
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        delay: prefersReducedMotion ? 0 : index * 0.1,
      }}
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-6 flex items-center justify-between min-h-[88px] touch-manipulation"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
            {tier.popular && (
              <Badge variant="info" size="sm" className="bg-accent-blue text-white">
                Most Popular
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
            <span className="text-sm text-gray-600">/ {tier.period}</span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-6 text-gray-400 transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <motion.div
          className="px-6 pb-6 space-y-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-gray-600">{tier.description}</p>

          <ul className="space-y-3">
            {tier.features.map((feature: string, i: number) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle className="size-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            onClick={() =>
              router.push(
                tier.price === "Free" ? "/review/new" : "/auth/register"
              )
            }
            className={cn(
              "w-full min-h-[56px] font-semibold rounded-2xl touch-manipulation",
              tier.popular
                ? "bg-accent-blue hover:bg-accent-blue/90 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            )}
          >
            {tier.cta}
            <ArrowRight className="ml-2 size-5" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Desktop Pricing Card - Always expanded
 */
function PricingCardDesktop({
  tier,
  index,
  router,
}: {
  tier: any;
  index: number;
  router: any;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "relative p-8 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl",
        tier.popular
          ? "border-accent-blue shadow-2xl scale-105 bg-white"
          : "border-gray-200 bg-white/60 backdrop-blur-sm"
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
        {tier.features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center gap-3">
            <CheckCircle className="size-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        onClick={() =>
          router.push(tier.price === "Free" ? "/review/new" : "/auth/register")
        }
        className={cn(
          "w-full",
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
