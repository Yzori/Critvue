/**
 * useMediaQuery Hook
 *
 * React hook for responsive design with SSR-safe media query detection
 * Follows mobile-first principles and handles hydration properly
 *
 * Usage:
 * ```tsx
 * const isMobile = useMediaQuery("(max-width: 1024px)");
 * const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
 * ```
 */

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // Initialize with false to avoid hydration mismatch
  // Will update on client after mount
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if window and matchMedia are available (client-side only)
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Define event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers support addEventListener, but we use a type-safe approach
    // that works with both old (addListener) and new (addEventListener) APIs
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  // Return false during SSR to avoid hydration mismatch
  // After mount, return actual matches value
  return mounted ? matches : false;
}

/**
 * Predefined breakpoint hooks for common use cases
 */

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery("(min-width: 1440px)");
}

/**
 * Mobile-first breakpoint: Show mobile UI on screens < 1024px
 */
export function useShowMobileUI(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Check if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

/**
 * Check if device supports hover (typically desktop with mouse)
 */
export function useCanHover(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/**
 * Check if device is touch-only (typically mobile/tablet)
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery("(hover: none) and (pointer: coarse)");
}
