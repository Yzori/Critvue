"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Perspective = "creator" | "reviewer";

interface PerspectiveColors {
  primary: string;
  primaryHex: string;
  gradient: string;
  gradientFrom: string;
  gradientTo: string;
  glow: string;
  border: string;
  bg: string;
  text: string;
}

interface PerspectiveContextValue {
  perspective: Perspective;
  setPerspective: (p: Perspective) => void;
  togglePerspective: () => void;
  colors: PerspectiveColors;
  isCreator: boolean;
  isReviewer: boolean;
}

const creatorColors: PerspectiveColors = {
  primary: "accent-blue",
  primaryHex: "#4CC9F0",
  gradient: "from-blue-500 via-accent-blue to-blue-600",
  gradientFrom: "from-accent-blue",
  gradientTo: "to-blue-600",
  glow: "rgba(59, 130, 246, 0.2)",
  border: "border-accent-blue",
  bg: "bg-accent-blue",
  text: "text-accent-blue",
};

const reviewerColors: PerspectiveColors = {
  primary: "accent-peach",
  primaryHex: "#F97316",
  gradient: "from-orange-500 via-accent-peach to-amber-500",
  gradientFrom: "from-accent-peach",
  gradientTo: "to-orange-500",
  glow: "rgba(249, 115, 22, 0.2)",
  border: "border-accent-peach",
  bg: "bg-accent-peach",
  text: "text-accent-peach",
};

const PerspectiveContext = createContext<PerspectiveContextValue | null>(null);

export function PerspectiveProvider({
  children,
  defaultPerspective = "creator"
}: {
  children: ReactNode;
  defaultPerspective?: Perspective;
}) {
  const [perspective, setPerspective] = useState<Perspective>(defaultPerspective);

  const togglePerspective = useCallback(() => {
    setPerspective((p) => (p === "creator" ? "reviewer" : "creator"));
  }, []);

  const colors = perspective === "creator" ? creatorColors : reviewerColors;

  const value: PerspectiveContextValue = {
    perspective,
    setPerspective,
    togglePerspective,
    colors,
    isCreator: perspective === "creator",
    isReviewer: perspective === "reviewer",
  };

  return (
    <PerspectiveContext.Provider value={value}>
      {children}
    </PerspectiveContext.Provider>
  );
}

export function usePerspective(): PerspectiveContextValue {
  const context = useContext(PerspectiveContext);
  if (!context) {
    throw new Error("usePerspective must be used within a PerspectiveProvider");
  }
  return context;
}

// Export colors for use outside of context
export { creatorColors, reviewerColors };
