"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Code, Palette, Video, Mic, PenTool, Image as ImageIcon, Cast } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Content Types Section - Swipeable Carousel on Mobile
 * Progressive enhancement to grid on desktop
 */
export default function ContentTypesSection() {
  const prefersReducedMotion = useReducedMotion();

  const contentTypes: Array<{ icon: typeof Palette; label: string; color: "blue" | "peach"; description: string }> = [
    { icon: Palette, label: "Design", color: "blue", description: "UI, branding, illustration" },
    { icon: Code, label: "Code", color: "peach", description: "Frontend, backend, architecture" },
    { icon: Video, label: "Video", color: "blue", description: "Editing, motion, storytelling" },
    { icon: Cast, label: "Stream", color: "peach", description: "Live streams, shorts, TikTok" },
    { icon: Mic, label: "Audio", color: "blue", description: "Music, podcasts, sound design" },
    { icon: PenTool, label: "Writing", color: "peach", description: "Copy, content, storytelling" },
    { icon: ImageIcon, label: "Art", color: "blue", description: "Digital, traditional, mixed media" },
  ];

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
            All Creative Work Welcome
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Get feedback on anything you create
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Expert reviewers for every medium
          </p>
        </motion.div>

        {/* Mobile: Horizontal swipeable | Desktop: Grid */}
        <div className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
          {contentTypes.map((type, index) => (
            <ContentTypeCard key={type.label} {...type} index={index} mobile />
          ))}
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {contentTypes.map((type, index) => (
            <ContentTypeCard key={type.label} {...type} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ContentTypeCard({
  icon: Icon,
  label,
  color,
  description,
  index,
  mobile = false,
}: {
  icon: any;
  label: string;
  color: "blue" | "peach";
  description: string;
  index: number;
  mobile?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "rounded-2xl border transition-all duration-300 p-6 touch-manipulation",
        mobile ? "min-w-[280px] snap-start" : "",
        color === "blue"
          ? "bg-gradient-to-br from-accent-blue/5 to-accent-blue/10 border-accent-blue/20 hover:border-accent-blue/40 hover:shadow-xl"
          : "bg-gradient-to-br from-accent-peach/5 to-accent-peach/10 border-accent-peach/20 hover:border-accent-peach/40 hover:shadow-xl"
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.4,
        delay: prefersReducedMotion ? 0 : index * 0.05,
      }}
    >
      <div
        className={cn(
          "inline-flex items-center justify-center size-16 rounded-2xl mb-4 shadow-lg",
          color === "blue" ? "bg-white text-accent-blue" : "bg-white text-accent-peach"
        )}
      >
        <Icon className="size-8" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{label}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </motion.div>
  );
}
