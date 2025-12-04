"use client";

import { useRef, useState, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
  intensity?: number;
}

export function TiltCard({
  children,
  className,
  glowColor = "rgba(76, 201, 240, 0.15)",
  onClick,
  intensity = 8,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]), springConfig);

  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = (e.clientX - centerX) / rect.width;
    const y = (e.clientY - centerY) / rect.height;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative rounded-2xl overflow-hidden cursor-pointer",
        "transform-gpu",
        "bg-white border border-border shadow-sm",
        "hover:shadow-lg transition-shadow duration-300",
        className
      )}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      {/* Subtle inner glow that follows mouse */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]) =>
              `radial-gradient(circle at ${x}% ${y}%, ${glowColor} 0%, transparent 60%)`
          ),
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Card content */}
      <div className="relative" style={{ transform: "translateZ(10px)" }}>
        {children}
      </div>

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.4) 45%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 60%)",
          opacity: isHovered ? 0.5 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
    </motion.div>
  );
}

// Hero card variant with accent gradient
interface HeroCardProps extends TiltCardProps {
  accentColor?: "blue" | "peach" | "sage";
}

export function HeroCard({
  children,
  className,
  accentColor = "blue",
  onClick,
}: HeroCardProps) {
  const colors = {
    blue: {
      glow: "rgba(76, 201, 240, 0.2)",
      gradient: "from-accent-blue/5 via-transparent to-cyan-500/5",
      border: "border-accent-blue/20",
    },
    peach: {
      glow: "rgba(249, 115, 22, 0.2)",
      gradient: "from-accent-peach/5 via-transparent to-orange-500/5",
      border: "border-accent-peach/20",
    },
    sage: {
      glow: "rgba(74, 222, 128, 0.2)",
      gradient: "from-accent-sage/5 via-transparent to-green-500/5",
      border: "border-accent-sage/20",
    },
  };

  const colorConfig = colors[accentColor] || colors.blue;

  return (
    <TiltCard
      className={cn("border", colorConfig.border, className)}
      glowColor={colorConfig.glow}
      onClick={onClick}
      intensity={6}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", colorConfig.gradient)} />
      <div className="relative">{children}</div>
    </TiltCard>
  );
}

// Compact card for grid items
export function CompactCard({
  children,
  className,
  onClick,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "blue" | "peach" | "sage";
}) {
  const variants = {
    default: "rgba(0, 0, 0, 0.05)",
    blue: "rgba(76, 201, 240, 0.15)",
    peach: "rgba(249, 115, 22, 0.15)",
    sage: "rgba(74, 222, 128, 0.15)",
  };

  return (
    <TiltCard
      className={cn("border border-border", className)}
      glowColor={variants[variant]}
      onClick={onClick}
      intensity={5}
    >
      {children}
    </TiltCard>
  );
}
