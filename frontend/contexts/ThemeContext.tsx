"use client";

import * as React from "react";

/**
 * ThemeProvider - Centralized dark mode management
 *
 * Features:
 * - Three theme options: light, dark, system
 * - Persists to localStorage
 * - Listens to system preference changes
 * - No flash on page load (via inline script in layout)
 * - SSR-safe implementation
 */

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "critvue-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

  // Remove both classes first
  root.classList.remove("light", "dark");
  // Add the resolved theme class
  root.classList.add(resolvedTheme);

  // Also set a data attribute for potential CSS selectors
  root.setAttribute("data-theme", resolvedTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");
  const [mounted, setMounted] = React.useState(false);

  // Initialize theme from localStorage on mount
  React.useEffect(() => {
    const storedTheme = getStoredTheme();
    setThemeState(storedTheme);
    setResolvedTheme(storedTheme === "system" ? getSystemTheme() : storedTheme);
    setMounted(true);
  }, []);

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const newResolvedTheme = e.matches ? "dark" : "light";
        setResolvedTheme(newResolvedTheme);
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Apply theme whenever it changes
  React.useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
  }, [theme, mounted]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setResolvedTheme(newTheme === "system" ? getSystemTheme() : newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  // Provide a stable context value
  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Inline script to prevent theme flash on page load
 * This should be added to the <head> of the document
 */
export const themeInitScript = `
(function() {
  const STORAGE_KEY = 'critvue-theme';
  const stored = localStorage.getItem(STORAGE_KEY);
  const theme = (stored === 'light' || stored === 'dark') ? stored :
    (stored === 'system' || !stored) ?
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') :
      'light';
  document.documentElement.classList.add(theme);
  document.documentElement.setAttribute('data-theme', theme);
})();
`;
