'use client';

/**
 * AmbientModeSystem - Dark/Focus/Zen Modes
 *
 * Not just inverting colors - a full ambient mode system:
 * - Light: Default, energetic, daytime
 * - Dark: Reduced eye strain, evening work
 * - Focus: Minimal chrome, maximum content
 * - Zen: Removes urgency indicators, streak pressure (for mental health)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Sun,
  Moon,
  Focus,
  Leaf,
  Monitor,
  Check,
  ChevronDown,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type AmbientMode = 'light' | 'dark' | 'focus' | 'zen' | 'system';

interface AmbientModeConfig {
  id: AmbientMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: {
    reducedMotion: boolean;
    hideUrgency: boolean;
    hideStreak: boolean;
    minimalChrome: boolean;
    dimmedColors: boolean;
  };
}

const modeConfigs: Record<AmbientMode, AmbientModeConfig> = {
  light: {
    id: 'light',
    label: 'Light',
    description: 'Default bright theme',
    icon: Sun,
    features: {
      reducedMotion: false,
      hideUrgency: false,
      hideStreak: false,
      minimalChrome: false,
      dimmedColors: false,
    },
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    description: 'Reduced eye strain',
    icon: Moon,
    features: {
      reducedMotion: false,
      hideUrgency: false,
      hideStreak: false,
      minimalChrome: false,
      dimmedColors: false,
    },
  },
  focus: {
    id: 'focus',
    label: 'Focus',
    description: 'Minimal distractions',
    icon: Focus,
    features: {
      reducedMotion: true,
      hideUrgency: false,
      hideStreak: false,
      minimalChrome: true,
      dimmedColors: false,
    },
  },
  zen: {
    id: 'zen',
    label: 'Zen',
    description: 'No pressure mode',
    icon: Leaf,
    features: {
      reducedMotion: true,
      hideUrgency: true,
      hideStreak: true,
      minimalChrome: true,
      dimmedColors: true,
    },
  },
  system: {
    id: 'system',
    label: 'System',
    description: 'Follow device settings',
    icon: Monitor,
    features: {
      reducedMotion: false,
      hideUrgency: false,
      hideStreak: false,
      minimalChrome: false,
      dimmedColors: false,
    },
  },
};

// =============================================================================
// CONTEXT
// =============================================================================

interface AmbientModeContextType {
  mode: AmbientMode;
  resolvedMode: 'light' | 'dark'; // Actual theme after resolving 'system'
  config: AmbientModeConfig;
  setMode: (mode: AmbientMode) => void;
  // Feature flags
  shouldReduceMotion: boolean;
  shouldHideUrgency: boolean;
  shouldHideStreak: boolean;
  shouldMinimizeChrome: boolean;
  shouldDimColors: boolean;
}

const AmbientModeContext = createContext<AmbientModeContextType | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface AmbientModeProviderProps {
  children: React.ReactNode;
  defaultMode?: AmbientMode;
}

export function AmbientModeProvider({
  children,
  defaultMode = 'system',
}: AmbientModeProviderProps) {
  const [mode, setModeState] = useState<AmbientMode>(defaultMode);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  // Detect system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('ambientMode') as AmbientMode | null;
    if (saved && modeConfigs[saved]) {
      setModeState(saved);
    }
  }, []);

  const setMode = useCallback((newMode: AmbientMode) => {
    setModeState(newMode);
    localStorage.setItem('ambientMode', newMode);

    // Apply theme to document
    const resolvedMode = newMode === 'system' ? systemPreference :
      (newMode === 'dark' ? 'dark' : 'light');

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedMode);

    // Apply focus/zen classes
    document.documentElement.classList.remove('focus-mode', 'zen-mode');
    if (newMode === 'focus') {
      document.documentElement.classList.add('focus-mode');
    } else if (newMode === 'zen') {
      document.documentElement.classList.add('zen-mode');
    }
  }, [systemPreference]);

  // Resolve actual theme
  const resolvedMode: 'light' | 'dark' = mode === 'system' ? systemPreference :
    (mode === 'dark' ? 'dark' : 'light');

  const config = modeConfigs[mode];

  // Feature flags
  const shouldReduceMotion = config.features.reducedMotion;
  const shouldHideUrgency = config.features.hideUrgency;
  const shouldHideStreak = config.features.hideStreak;
  const shouldMinimizeChrome = config.features.minimalChrome;
  const shouldDimColors = config.features.dimmedColors;

  // Apply theme on mount and mode change
  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  return (
    <AmbientModeContext.Provider
      value={{
        mode,
        resolvedMode,
        config,
        setMode,
        shouldReduceMotion,
        shouldHideUrgency,
        shouldHideStreak,
        shouldMinimizeChrome,
        shouldDimColors,
      }}
    >
      {children}
    </AmbientModeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useAmbientMode() {
  const context = useContext(AmbientModeContext);
  if (!context) {
    // Return defaults if not in provider (for SSR/testing)
    return {
      mode: 'light' as AmbientMode,
      resolvedMode: 'light' as const,
      config: modeConfigs.light,
      setMode: () => {},
      shouldReduceMotion: false,
      shouldHideUrgency: false,
      shouldHideStreak: false,
      shouldMinimizeChrome: false,
      shouldDimColors: false,
    };
  }
  return context;
}

// =============================================================================
// MODE SWITCHER COMPONENT
// =============================================================================

interface ModeSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'compact';
  className?: string;
}

export function ModeSwitcher({
  variant = 'dropdown',
  className,
}: ModeSwitcherProps) {
  const { mode, setMode, config } = useAmbientMode();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-muted/50', className)}>
        {Object.values(modeConfigs).filter(m => m.id !== 'system').map((modeConfig) => {
          const Icon = modeConfig.icon;
          const isActive = mode === modeConfig.id;

          return (
            <button
              key={modeConfig.id}
              onClick={() => setMode(modeConfig.id)}
              className={cn(
                'p-2 rounded-md transition-all',
                isActive
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
              title={modeConfig.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    const Icon = config.icon;
    return (
      <button
        onClick={() => {
          const modes: AmbientMode[] = ['light', 'dark', 'focus', 'zen'];
          const currentIndex = modes.indexOf(mode === 'system' ? 'light' : mode);
          const nextIndex = (currentIndex + 1) % modes.length;
          setMode(modes[nextIndex]);
        }}
        className={cn(
          'p-2 rounded-lg hover:bg-muted transition-colors',
          className
        )}
        title={`Current: ${config.label}. Click to change.`}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  }

  // Dropdown variant
  const Icon = config.icon;

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-muted/50 hover:bg-muted transition-colors',
          'text-sm font-medium'
        )}
      >
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'absolute top-full left-0 mt-2 z-50',
                'w-56 rounded-xl bg-card border border-border shadow-xl',
                'overflow-hidden'
              )}
            >
              <div className="p-2">
                {Object.values(modeConfigs).map((modeConfig) => {
                  const ModeIcon = modeConfig.icon;
                  const isActive = mode === modeConfig.id;

                  return (
                    <button
                      key={modeConfig.id}
                      onClick={() => {
                        setMode(modeConfig.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                        'text-left transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <ModeIcon className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{modeConfig.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {modeConfig.description}
                        </p>
                      </div>
                      {isActive && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// CONDITIONAL WRAPPER COMPONENTS
// =============================================================================

// Hide content in zen mode
export function HideInZenMode({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { shouldHideUrgency } = useAmbientMode();

  if (shouldHideUrgency) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Reduce motion wrapper
export function ReducedMotionWrapper({
  children,
  reducedChildren,
}: {
  children: React.ReactNode;
  reducedChildren: React.ReactNode;
}) {
  const { shouldReduceMotion } = useAmbientMode();

  return <>{shouldReduceMotion ? reducedChildren : children}</>;
}

// =============================================================================
// CSS VARIABLES (for reference - add to globals.css)
// =============================================================================

/*
Add these to your globals.css:

.focus-mode {
  --reduced-chrome: true;
}

.focus-mode .sidebar,
.focus-mode .quick-action-bar {
  opacity: 0.5;
  transition: opacity 0.2s;
}

.focus-mode .sidebar:hover,
.focus-mode .quick-action-bar:hover {
  opacity: 1;
}

.zen-mode {
  --hide-urgency: true;
  --hide-streak: true;
}

.zen-mode .urgency-indicator,
.zen-mode .streak-counter,
.zen-mode .deadline-warning {
  display: none !important;
}

.zen-mode .stat-card {
  filter: saturate(0.7);
}
*/

export default ModeSwitcher;
