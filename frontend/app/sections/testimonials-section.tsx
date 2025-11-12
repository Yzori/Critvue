"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Testimonials Section - Swipeable Carousel on Mobile
 * Progressive enhancement to grid on desktop
 */
export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  const testimonials = [
    {
      quote:
        "The feedback I got on Critvue was so specific and actionable. It's like having a design mentor on demand.",
      author: {
        name: "Sarah Chen",
        role: "Product Designer at Stripe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      },
      rating: 5,
    },
    {
      quote:
        "As a reviewer, I love the flexibility. I can review when it fits my schedule and earn while helping creators grow.",
      author: {
        name: "Marcus Williams",
        role: "Senior Developer",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
      },
      rating: 5,
    },
    {
      quote:
        "The AI review gave me instant insights to iterate quickly. When I needed depth, the expert review was invaluable.",
      author: {
        name: "Priya Patel",
        role: "UX Designer",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
      },
      rating: 5,
    },
  ];

  // Auto-advance carousel every 5 seconds (mobile only)
  useEffect(() => {
    if (autoPlay && !prefersReducedMotion && window.innerWidth < 768) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoPlay, prefersReducedMotion, testimonials.length]);

  const handlePrevious = () => {
    setAutoPlay(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setAutoPlay(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        >
          <Badge variant="info" size="lg" className="mb-4">
            Loved by Creators
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Trusted by thousands
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            See what creators are saying
          </p>
        </motion.div>

        {/* Mobile: Swipeable carousel */}
        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handlePrevious}
              className="p-3 rounded-full bg-white border-2 border-gray-200 hover:border-accent-blue transition-colors min-h-[48px] min-w-[48px] touch-manipulation"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="size-5 text-gray-600" />
            </button>

            {/* Dot indicators */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setAutoPlay(false);
                    setActiveIndex(index);
                  }}
                  className={cn(
                    "size-2 rounded-full transition-all min-h-[44px] min-w-[44px] p-4 touch-manipulation",
                    activeIndex === index ? "bg-accent-blue" : "bg-gray-300"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-white border-2 border-gray-200 hover:border-accent-blue transition-colors min-h-[48px] min-w-[48px] touch-manipulation"
              aria-label="Next testimonial"
            >
              <ChevronRight className="size-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">2.5K+</span>
            <span>reviews</span>
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">98%</span>
            <Star className="size-4 text-amber-500 fill-amber-500" />
            <span>satisfaction</span>
          </div>
          <div className="w-px h-4 bg-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">24h</span>
            <span>avg turnaround</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index = 0,
}: {
  testimonial: any;
  index?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between min-h-[240px]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        delay: prefersReducedMotion ? 0 : index * 0.1,
      }}
    >
      {/* Quote */}
      <blockquote className="text-base md:text-lg text-gray-900 leading-relaxed mb-6">
        "{testimonial.quote}"
      </blockquote>

      {/* Author & Rating */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <img
            src={testimonial.author.avatar}
            alt={testimonial.author.name}
            className="size-12 rounded-full object-cover ring-2 ring-white"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              {testimonial.author.name}
            </div>
            <div className="text-sm text-gray-600">{testimonial.author.role}</div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex gap-0.5">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="size-4 fill-amber-500 text-amber-500" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
