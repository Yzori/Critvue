"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  side: "left" | "right";
}

interface ParticleBattleProps {
  voteRatio?: number; // 0-1, where 0 = all left, 1 = all right
  intensity?: number;
  isActive?: boolean;
  leftColor?: string;
  rightColor?: string;
  className?: string;
}

export function ParticleBattle({
  voteRatio = 0.5,
  intensity = 1,
  isActive = true,
  leftColor = "76, 201, 240", // accent-blue RGB
  rightColor = "249, 115, 22", // accent-peach RGB
  className,
}: ParticleBattleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0, isOver: false });

  const createParticle = useCallback(
    (canvas: HTMLCanvasElement, side: "left" | "right"): Particle => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Spawn position based on side
      const spawnX = side === "left" ? Math.random() * centerX * 0.3 : canvas.width - Math.random() * centerX * 0.3;
      const spawnY = centerY + (Math.random() - 0.5) * canvas.height * 0.8;

      // Velocity towards center with some randomness
      const targetX = centerX + (Math.random() - 0.5) * 100;
      const targetY = centerY + (Math.random() - 0.5) * 100;
      const angle = Math.atan2(targetY - spawnY, targetX - spawnX);
      const speed = 1 + Math.random() * 2;

      return {
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * speed * (side === "left" ? 1 : -1) * (side === "left" ? 1 : -1),
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        life: 1,
        maxLife: 100 + Math.random() * 100,
        color: side === "left" ? leftColor : rightColor,
        side,
      };
    },
    [leftColor, rightColor]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !isActive) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Calculate battle line based on vote ratio
    const battleLine = centerX + (voteRatio - 0.5) * canvas.width * 0.3;

    // Spawn new particles
    const spawnRate = Math.floor(intensity * 3);
    for (let i = 0; i < spawnRate; i++) {
      // More particles from winning side
      const leftChance = 1 - voteRatio;
      if (Math.random() < leftChance && particlesRef.current.length < 200) {
        particlesRef.current.push(createParticle(canvas, "left"));
      }
      if (Math.random() < voteRatio && particlesRef.current.length < 200) {
        particlesRef.current.push(createParticle(canvas, "right"));
      }
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((p) => {
      // Update life
      p.life -= 1 / p.maxLife;
      if (p.life <= 0) return false;

      // Calculate distance to center
      const dx = battleLine - p.x;
      const dy = centerY - p.y;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);

      // Particles are attracted to battle line
      const attraction = 0.02;
      p.vx += (dx / distToCenter) * attraction;
      p.vy += (dy / distToCenter) * attraction * 0.3;

      // Mouse interaction
      if (mouseRef.current.isOver) {
        const mx = mouseRef.current.x - p.x;
        const my = mouseRef.current.y - p.y;
        const mouseDist = Math.sqrt(mx * mx + my * my);
        if (mouseDist < 150) {
          const force = (150 - mouseDist) / 150;
          p.vx += (mx / mouseDist) * force * 0.3;
          p.vy += (my / mouseDist) * force * 0.3;
        }
      }

      // Apply friction
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Particle collision at battle line - create energy burst effect
      if (distToCenter < 50) {
        p.life -= 0.05; // Die faster at battle point
        p.size *= 0.95;
      }

      // Draw particle with glow
      const alpha = p.life * 0.8;
      const glowSize = p.size * 3;

      // Outer glow
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      gradient.addColorStop(0, `rgba(${p.color}, ${alpha * 0.8})`);
      gradient.addColorStop(0.5, `rgba(${p.color}, ${alpha * 0.3})`);
      gradient.addColorStop(1, `rgba(${p.color}, 0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      return true;
    });

    // Draw energy clash at battle point
    const clashIntensity = particlesRef.current.filter(
      (p) => Math.abs(p.x - battleLine) < 100
    ).length;

    if (clashIntensity > 10) {
      const clashAlpha = Math.min(clashIntensity / 50, 0.4);

      // Energy core at clash point
      const clashGradient = ctx.createRadialGradient(
        battleLine,
        centerY,
        0,
        battleLine,
        centerY,
        100
      );
      clashGradient.addColorStop(0, `rgba(255, 255, 255, ${clashAlpha})`);
      clashGradient.addColorStop(0.3, `rgba(139, 92, 246, ${clashAlpha * 0.5})`);
      clashGradient.addColorStop(1, "rgba(139, 92, 246, 0)");

      ctx.beginPath();
      ctx.arc(battleLine, centerY, 100, 0, Math.PI * 2);
      ctx.fillStyle = clashGradient;
      ctx.fill();
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [isActive, voteRatio, intensity, createParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
        isOver: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.isOver = false;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    if (isActive) {
      draw();
    }

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, draw]);

  return (
    <motion.canvas
      ref={canvasRef}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// Energy burst effect for winner announcements
export function EnergyBurst({
  side,
  onComplete,
}: {
  side: "left" | "right";
  onComplete?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const color = side === "left" ? "76, 201, 240" : "249, 115, 22";
    const centerX = side === "left" ? canvas.width * 0.3 : canvas.width * 0.7;
    const centerY = canvas.height / 2;

    interface BurstParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
    }

    const particles: BurstParticle[] = [];

    // Create burst particles
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      const speed = 5 + Math.random() * 15;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 8,
        life: 1,
      });
    }

    let frame = 0;
    const maxFrames = 60;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 1 / maxFrames;

        if (p.life > 0) {
          const alpha = p.life * 0.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${alpha})`;
          ctx.fill();
        }
      });

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animate();
  }, [side, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
