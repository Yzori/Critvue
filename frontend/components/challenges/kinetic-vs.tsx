"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface KineticVSProps {
  isActive?: boolean;
  winnerId?: "left" | "right" | null;
  intensity?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function KineticVS({
  isActive = true,
  winnerId = null,
  intensity = 1,
  size = "lg",
  className,
}: KineticVSProps) {
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for dynamic effects
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);

  // Transform for glow intensity
  const glowOpacity = useTransform(scale, [1, 1.2], [0.5, 1]);

  const sizes = {
    sm: { container: "w-16 h-16", text: "text-xl", glow: 20 },
    md: { container: "w-24 h-24", text: "text-3xl", glow: 30 },
    lg: { container: "w-32 h-32", text: "text-5xl", glow: 40 },
    xl: { container: "w-44 h-44", text: "text-7xl", glow: 60 },
  };

  const sizeConfig = sizes[size];

  // Continuous pulse animation
  useEffect(() => {
    if (!isActive) return;

    const pulseSequence = async () => {
      while (true) {
        await controls.start({
          scale: [1, 1.08, 1],
          rotate: [0, 2, -2, 0],
          transition: {
            duration: 2,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          },
        });
      }
    };

    pulseSequence();

    return () => {
      controls.stop();
    };
  }, [controls, isActive]);

  // Winner announcement effect
  useEffect(() => {
    if (winnerId) {
      controls.start({
        scale: [1, 1.5, 1.2],
        rotate: [0, 15, -15, 0],
        transition: {
          duration: 0.8,
          ease: "easeOut",
        },
      });
    }
  }, [winnerId, controls]);

  return (
    <motion.div
      ref={containerRef}
      className={cn("relative flex items-center justify-center", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer energy rings */}
      <motion.div
        className="absolute inset-0"
        animate={
          isActive
            ? {
                rotate: 360,
              }
            : {}
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-dashed"
            style={{
              borderColor: `rgba(76, 201, 240, ${0.1 + i * 0.1})`,
              transform: `scale(${1.2 + i * 0.15})`,
            }}
            animate={{
              rotate: i % 2 === 0 ? 360 : -360,
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              rotate: {
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: "linear",
              },
              opacity: {
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />
        ))}
      </motion.div>

      {/* Main VS container */}
      <motion.div
        className={cn(
          "relative rounded-full flex items-center justify-center",
          sizeConfig.container
        )}
        animate={controls}
        style={{ scale, rotate }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Gradient background orb */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(76, 201, 240, 0.8) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(249, 115, 22, 0.8) 0%, transparent 50%),
              linear-gradient(135deg, #4CC9F0 0%, #8B5CF6 50%, #F97316 100%)
            `,
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Inner glow layer */}
        <motion.div
          className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm"
          animate={{
            opacity: isHovered ? 0.4 : 0.2,
          }}
        />

        {/* Energy pulse rings */}
        {isActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/30"
              animate={{
                scale: [1, 1.5, 1.8],
                opacity: [0.6, 0.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/30"
              animate={{
                scale: [1, 1.5, 1.8],
                opacity: [0.6, 0.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.7,
              }}
            />
          </>
        )}

        {/* VS Text with kinetic effect */}
        <motion.div className="relative z-10">
          {/* Shadow/glow text layers */}
          <motion.span
            className={cn(
              "absolute inset-0 font-black text-transparent select-none",
              sizeConfig.text
            )}
            style={{
              WebkitTextStroke: "2px rgba(76, 201, 240, 0.5)",
              filter: `blur(${sizeConfig.glow / 4}px)`,
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            VS
          </motion.span>

          {/* Main text */}
          <motion.span
            className={cn(
              "relative font-black text-white drop-shadow-lg",
              sizeConfig.text
            )}
            style={{
              textShadow: `
                0 0 ${sizeConfig.glow}px rgba(255, 255, 255, 0.8),
                0 0 ${sizeConfig.glow * 2}px rgba(76, 201, 240, 0.5),
                0 0 ${sizeConfig.glow * 3}px rgba(249, 115, 22, 0.3)
              `,
            }}
            animate={
              isActive
                ? {
                    textShadow: [
                      `0 0 ${sizeConfig.glow}px rgba(255, 255, 255, 0.8), 0 0 ${sizeConfig.glow * 2}px rgba(76, 201, 240, 0.5), 0 0 ${sizeConfig.glow * 3}px rgba(249, 115, 22, 0.3)`,
                      `0 0 ${sizeConfig.glow * 1.5}px rgba(255, 255, 255, 1), 0 0 ${sizeConfig.glow * 2.5}px rgba(76, 201, 240, 0.7), 0 0 ${sizeConfig.glow * 4}px rgba(249, 115, 22, 0.5)`,
                      `0 0 ${sizeConfig.glow}px rgba(255, 255, 255, 0.8), 0 0 ${sizeConfig.glow * 2}px rgba(76, 201, 240, 0.5), 0 0 ${sizeConfig.glow * 3}px rgba(249, 115, 22, 0.3)`,
                    ],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            VS
          </motion.span>
        </motion.div>

        {/* Sparkle particles */}
        {isActive &&
          [...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: "50%",
                top: "50%",
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI * 2) / 6) * 60],
                y: [0, Math.sin((i * Math.PI * 2) / 6) * 60],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut",
              }}
            />
          ))}
      </motion.div>

      {/* Hover energy burst effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.5 }}
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          }}
        />
      )}
    </motion.div>
  );
}

// Mini VS badge for compact displays
export function KineticVSBadge({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        "bg-gradient-to-br from-accent-blue via-purple-500 to-accent-peach",
        className
      )}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <span className="text-[10px] font-black text-white">VS</span>
    </motion.div>
  );
}

// Winner flash effect overlay
export function WinnerFlash({
  side,
  onComplete,
}: {
  side: "left" | "right";
  onComplete?: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onComplete}
      style={{
        background:
          side === "left"
            ? "radial-gradient(circle at 30% 50%, rgba(76, 201, 240, 0.4) 0%, transparent 60%)"
            : "radial-gradient(circle at 70% 50%, rgba(249, 115, 22, 0.4) 0%, transparent 60%)",
      }}
    />
  );
}
