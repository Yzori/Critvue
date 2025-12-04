"use client";

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

type CursorType = "default" | "pointer" | "crosshair" | "magnify" | "vote" | "left" | "right";

interface CursorContextType {
  cursorType: CursorType;
  setCursorType: (type: CursorType) => void;
  cursorText: string;
  setCursorText: (text: string) => void;
}

const CursorContext = createContext<CursorContextType>({
  cursorType: "default",
  setCursorType: () => {},
  cursorText: "",
  setCursorText: () => {},
});

export function useCursor() {
  return useContext(CursorContext);
}

interface CursorProviderProps {
  children: ReactNode;
}

export function CursorProvider({ children }: CursorProviderProps) {
  const [cursorType, setCursorType] = useState<CursorType>("default");
  const [cursorText, setCursorText] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", checkMobile);
    };
  }, [mouseX, mouseY]);

  // Don't render custom cursor on mobile
  if (isMobile) {
    return (
      <CursorContext.Provider
        value={{ cursorType, setCursorType, cursorText, setCursorText }}
      >
        {children}
      </CursorContext.Provider>
    );
  }

  const getCursorStyles = () => {
    switch (cursorType) {
      case "crosshair":
        return {
          size: 40,
          borderColor: "rgba(255, 255, 255, 0.8)",
          bgColor: "transparent",
          borderWidth: 2,
          mixBlendMode: "difference" as const,
        };
      case "magnify":
        return {
          size: 60,
          borderColor: "rgba(76, 201, 240, 0.8)",
          bgColor: "rgba(76, 201, 240, 0.1)",
          borderWidth: 2,
          mixBlendMode: "normal" as const,
        };
      case "vote":
        return {
          size: 50,
          borderColor: "rgba(255, 255, 255, 1)",
          bgColor: "rgba(139, 92, 246, 0.9)",
          borderWidth: 0,
          mixBlendMode: "normal" as const,
        };
      case "left":
        return {
          size: 50,
          borderColor: "rgba(76, 201, 240, 1)",
          bgColor: "rgba(76, 201, 240, 0.2)",
          borderWidth: 3,
          mixBlendMode: "normal" as const,
        };
      case "right":
        return {
          size: 50,
          borderColor: "rgba(249, 115, 22, 1)",
          bgColor: "rgba(249, 115, 22, 0.2)",
          borderWidth: 3,
          mixBlendMode: "normal" as const,
        };
      case "pointer":
        return {
          size: 20,
          borderColor: "rgba(255, 255, 255, 0.9)",
          bgColor: "rgba(139, 92, 246, 0.9)",
          borderWidth: 0,
          mixBlendMode: "normal" as const,
        };
      default:
        return {
          size: 12,
          borderColor: "rgba(255, 255, 255, 0.8)",
          bgColor: "transparent",
          borderWidth: 2,
          mixBlendMode: "difference" as const,
        };
    }
  };

  const styles = getCursorStyles();

  return (
    <CursorContext.Provider
      value={{ cursorType, setCursorType, cursorText, setCursorText }}
    >
      {/* Hide default cursor globally when custom cursor is active */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {children}

      {/* Custom cursor */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9999]"
            style={{
              x: cursorX,
              y: cursorY,
            }}
          >
            {/* Main cursor circle */}
            <motion.div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                width: styles.size,
                height: styles.size,
                marginLeft: -styles.size / 2,
                marginTop: -styles.size / 2,
                backgroundColor: styles.bgColor,
                border: `${styles.borderWidth}px solid ${styles.borderColor}`,
                mixBlendMode: styles.mixBlendMode,
              }}
              animate={{
                scale: cursorType === "default" ? 1 : 1,
                opacity: 1,
              }}
              transition={{ duration: 0.15 }}
            >
              {/* Crosshair lines */}
              {cursorType === "crosshair" && (
                <>
                  <motion.div
                    className="absolute w-px bg-white/80"
                    style={{ height: styles.size * 0.4 }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.div
                    className="absolute h-px bg-white/80"
                    style={{ width: styles.size * 0.4 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </>
              )}

              {/* Magnify icon */}
              {cursorType === "magnify" && (
                <motion.div
                  className="text-accent-blue"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </motion.div>
              )}

              {/* Vote cursor */}
              {cursorType === "vote" && (
                <motion.span
                  className="text-white text-xs font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  VOTE
                </motion.span>
              )}

              {/* Left/Right cursor arrows */}
              {cursorType === "left" && (
                <motion.div
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-accent-blue"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                  </svg>
                </motion.div>
              )}

              {cursorType === "right" && (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-accent-peach"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                  </svg>
                </motion.div>
              )}

              {/* Cursor text label */}
              {cursorText && (
                <motion.span
                  className="absolute top-full mt-2 whitespace-nowrap text-xs font-medium text-white bg-black/70 px-2 py-1 rounded"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {cursorText}
                </motion.span>
              )}
            </motion.div>

            {/* Trailing dot */}
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-white"
              style={{
                marginLeft: -4,
                marginTop: -4,
                mixBlendMode: "difference",
              }}
              animate={{
                scale: cursorType === "default" ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </CursorContext.Provider>
  );
}

// Hook components for easy cursor zone definition
interface CursorZoneProps {
  type: CursorType;
  text?: string;
  children: ReactNode;
  className?: string;
}

export function CursorZone({ type, text = "", children, className }: CursorZoneProps) {
  const { setCursorType, setCursorText } = useCursor();

  const handleEnter = useCallback(() => {
    setCursorType(type);
    setCursorText(text);
  }, [type, text, setCursorType, setCursorText]);

  const handleLeave = useCallback(() => {
    setCursorType("default");
    setCursorText("");
  }, [setCursorType, setCursorText]);

  return (
    <div
      className={className}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
}
