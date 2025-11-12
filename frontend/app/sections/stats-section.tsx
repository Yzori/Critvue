"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle, Star, Clock, Users } from "lucide-react";

/**
 * Stats Counter Section
 * Animated counter that counts up when scrolled into view
 */
export default function StatsSection() {
  const prefersReducedMotion = useReducedMotion();

  const stats = [
    { value: 2500, suffix: "+", label: "Reviews Delivered", icon: CheckCircle },
    { value: 98, suffix: "%", label: "Satisfaction Rate", icon: Star },
    { value: 24, suffix: "h", label: "Avg Turnaround", icon: Clock },
    { value: 150, suffix: "+", label: "Expert Reviewers", icon: Users },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat, index }: { stat: any; index: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated && !prefersReducedMotion) {
          setHasAnimated(true);

          // Animate counter
          const duration = 2000; // 2 seconds
          const steps = 60;
          const increment = stat.value / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= stat.value) {
              setCount(stat.value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);

          return () => clearInterval(timer);
        } else if (prefersReducedMotion && !hasAnimated) {
          // Skip animation if reduced motion is preferred
          setCount(stat.value);
          setHasAnimated(true);
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [stat.value, hasAnimated, prefersReducedMotion]);

  return (
    <motion.div
      ref={counterRef}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.6,
        delay: prefersReducedMotion ? 0 : index * 0.1,
      }}
    >
      <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-blue/5 mb-4">
        <stat.icon className="size-8 text-accent-blue" />
      </div>
      <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
        {count}
        {stat.suffix}
      </div>
      <p className="text-gray-600 font-medium">{stat.label}</p>
    </motion.div>
  );
}
