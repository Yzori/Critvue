'use client';

/**
 * UserPulseContext - Emotional Intelligence for the Dashboard
 *
 * Tracks user state and adapts the dashboard's personality based on:
 * - Time since last activity
 * - Current streak status
 * - Recent emotional events (rejection, acceptance, harsh rating)
 * - Time of day patterns
 * - Role and engagement level
 *
 * The dashboard responds with different greetings, color temperatures,
 * and featured content based on this context.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type UserMood =
  | 'welcome_back'      // First login of the day
  | 'on_fire'           // Active streak, high engagement
  | 'gentle_nudge'      // Inactive 3+ days
  | 'celebration'       // Just achieved something
  | 'supportive'        // Just received harsh feedback
  | 'focused'           // Deep in a review session
  | 'neutral';          // Default state

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface PulseEvent {
  type: 'review_accepted' | 'review_rejected' | 'harsh_rating' | 'streak_milestone' |
        'tier_promotion' | 'earnings_milestone' | 'first_review' | 'completion';
  timestamp: Date;
  value?: number | string;
}

export interface UserPulseState {
  // Core state
  mood: UserMood;
  timeOfDay: TimeOfDay;
  isFirstLoginToday: boolean;
  daysSinceLastActivity: number;

  // Streak & engagement
  currentStreak: number;
  streakAtRisk: boolean;
  weeklyProgress: number;
  weeklyGoal: number;

  // Recent events
  recentEvents: PulseEvent[];
  lastCelebration: PulseEvent | null;

  // Derived states
  greeting: string;
  subGreeting: string;
  accentColor: 'blue' | 'peach' | 'sage' | 'amber';
  showCelebrationPrompt: boolean;
  suggestedAction: string | null;

  // Reviewer-specific
  pendingEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
}

interface UserPulseContextType {
  pulse: UserPulseState;
  recordEvent: (event: Omit<PulseEvent, 'timestamp'>) => void;
  refreshPulse: () => void;
  dismissCelebration: () => void;
  setStreak: (streak: number) => void;
  setWeeklyProgress: (current: number, goal: number) => void;
  setEarnings: (today: number, week: number, pending: number) => void;
  setDaysSinceLastActivity: (days: number) => void;
}

const defaultPulse: UserPulseState = {
  mood: 'neutral',
  timeOfDay: 'morning',
  isFirstLoginToday: true,
  daysSinceLastActivity: 0,
  currentStreak: 0,
  streakAtRisk: false,
  weeklyProgress: 0,
  weeklyGoal: 5,
  recentEvents: [],
  lastCelebration: null,
  greeting: 'Welcome back',
  subGreeting: "Let's make today count",
  accentColor: 'blue',
  showCelebrationPrompt: false,
  suggestedAction: null,
  pendingEarnings: 0,
  todayEarnings: 0,
  weekEarnings: 0,
};

const UserPulseContext = createContext<UserPulseContextType | null>(null);

// Greeting templates based on mood and time
const greetingTemplates = {
  welcome_back: {
    morning: ["Good morning", "Rise and shine", "Fresh start today"],
    afternoon: ["Good afternoon", "Hope your day is going well", "Afternoon check-in"],
    evening: ["Good evening", "Winding down?", "Evening session"],
    night: ["Burning the midnight oil?", "Late night creativity", "Night owl mode"],
  },
  on_fire: {
    morning: ["You're on fire!", "Crushing it!", "Unstoppable"],
    afternoon: ["Keep the momentum!", "You're in the zone", "On a roll"],
    evening: ["What a day!", "Finishing strong", "Incredible progress"],
    night: ["Dedicated!", "True commitment", "Amazing work"],
  },
  gentle_nudge: {
    morning: ["We missed you!", "Welcome back", "Good to see you"],
    afternoon: ["Hey stranger!", "It's been a while", "Welcome back"],
    evening: ["There you are!", "Nice to see you", "Welcome back"],
    night: ["Back at it?", "Welcome back", "Good to see you"],
  },
  celebration: {
    morning: ["Congratulations!", "Amazing!", "Well done!"],
    afternoon: ["Fantastic work!", "You did it!", "Celebrating you"],
    evening: ["What an achievement!", "Incredible!", "So proud"],
    night: ["Legendary!", "Outstanding!", "Remarkable"],
  },
  supportive: {
    morning: ["Every review helps you grow", "Learning opportunity", "Onward and upward"],
    afternoon: ["Feedback makes us better", "Growth mindset", "Keep going"],
    evening: ["Tomorrow's a new day", "Progress, not perfection", "You've got this"],
    night: ["Rest and reset", "Better things ahead", "Stay positive"],
  },
  focused: {
    morning: ["Deep work mode", "In the zone", "Focus time"],
    afternoon: ["Staying focused", "Making progress", "Keep it up"],
    evening: ["Powering through", "Almost there", "Great focus"],
    night: ["Night focus", "Dedicated session", "In the flow"],
  },
  neutral: {
    morning: ["Good morning", "Ready to start?", "New day, new possibilities"],
    afternoon: ["Good afternoon", "How's it going?", "Making progress"],
    evening: ["Good evening", "Productive day?", "Evening check-in"],
    night: ["Late session?", "Night work", "Burning bright"],
  },
};

const subGreetingTemplates = {
  welcome_back: "Here's what happened while you were away",
  on_fire: "Keep the streak alive!",
  gentle_nudge: "We've got some things waiting for you",
  celebration: "Let's celebrate your achievement!",
  supportive: "Every piece of feedback is a stepping stone",
  focused: "Stay in the zone",
  neutral: "What would you like to work on?",
};

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getRandomGreeting(mood: UserMood, timeOfDay: TimeOfDay): string {
  const templates = greetingTemplates[mood][timeOfDay];
  return templates[Math.floor(Math.random() * templates.length)];
}

function determineMood(state: Partial<UserPulseState>): UserMood {
  // Priority-based mood determination

  // Check for recent celebrations
  if (state.lastCelebration &&
      (Date.now() - state.lastCelebration.timestamp.getTime()) < 5 * 60 * 1000) {
    return 'celebration';
  }

  // Check for harsh feedback recently
  const harshRating = state.recentEvents?.find(
    e => e.type === 'harsh_rating' &&
    (Date.now() - e.timestamp.getTime()) < 30 * 60 * 1000
  );
  if (harshRating) return 'supportive';

  // Check for long absence
  if ((state.daysSinceLastActivity ?? 0) >= 3) return 'gentle_nudge';

  // Check for active streak
  if ((state.currentStreak ?? 0) >= 3) return 'on_fire';

  // First login of the day
  if (state.isFirstLoginToday) return 'welcome_back';

  return 'neutral';
}

function getAccentColor(mood: UserMood): 'blue' | 'peach' | 'sage' | 'amber' {
  switch (mood) {
    case 'on_fire': return 'peach';
    case 'celebration': return 'sage';
    case 'supportive': return 'amber';
    case 'gentle_nudge': return 'amber';
    default: return 'blue';
  }
}

export function UserPulseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pulse, setPulse] = useState<UserPulseState>(defaultPulse);

  // Initialize pulse state
  useEffect(() => {
    if (user) {
      refreshPulse();
    }
  }, [user]);

  // Check if first login today
  useEffect(() => {
    const lastLoginDate = localStorage.getItem('lastLoginDate');
    const today = new Date().toDateString();

    const isFirstLoginToday = lastLoginDate !== today;

    if (isFirstLoginToday) {
      localStorage.setItem('lastLoginDate', today);
    }

    setPulse(prev => ({ ...prev, isFirstLoginToday }));
  }, []);

  const refreshPulse = useCallback(() => {
    const timeOfDay = getTimeOfDay();

    setPulse(prev => {
      const mood = determineMood(prev);
      const greeting = getRandomGreeting(mood, timeOfDay);
      const subGreeting = subGreetingTemplates[mood];
      const accentColor = getAccentColor(mood);

      return {
        ...prev,
        mood,
        timeOfDay,
        greeting,
        subGreeting,
        accentColor,
        streakAtRisk: prev.currentStreak > 0 && prev.daysSinceLastActivity >= 1,
        showCelebrationPrompt: mood === 'celebration',
      };
    });
  }, []);

  const recordEvent = useCallback((event: Omit<PulseEvent, 'timestamp'>) => {
    const fullEvent: PulseEvent = {
      ...event,
      timestamp: new Date(),
    };

    setPulse(prev => {
      const newEvents = [fullEvent, ...prev.recentEvents].slice(0, 20);

      // Check if this is a celebration-worthy event
      const celebrationTypes: PulseEvent['type'][] = [
        'streak_milestone', 'tier_promotion', 'earnings_milestone', 'first_review'
      ];

      const lastCelebration = celebrationTypes.includes(event.type)
        ? fullEvent
        : prev.lastCelebration;

      return {
        ...prev,
        recentEvents: newEvents,
        lastCelebration,
      };
    });

    // Refresh mood after recording event
    setTimeout(refreshPulse, 100);
  }, [refreshPulse]);

  const dismissCelebration = useCallback(() => {
    setPulse(prev => ({
      ...prev,
      showCelebrationPrompt: false,
      lastCelebration: null,
    }));
    refreshPulse();
  }, [refreshPulse]);

  const setStreak = useCallback((streak: number) => {
    setPulse(prev => ({
      ...prev,
      currentStreak: streak,
    }));
    refreshPulse();
  }, [refreshPulse]);

  const setWeeklyProgress = useCallback((current: number, goal: number) => {
    setPulse(prev => ({
      ...prev,
      weeklyProgress: current,
      weeklyGoal: goal,
    }));
  }, []);

  const setEarnings = useCallback((today: number, week: number, pending: number) => {
    setPulse(prev => ({
      ...prev,
      todayEarnings: today,
      weekEarnings: week,
      pendingEarnings: pending,
    }));
  }, []);

  const setDaysSinceLastActivity = useCallback((days: number) => {
    setPulse(prev => ({
      ...prev,
      daysSinceLastActivity: days,
    }));
    refreshPulse();
  }, [refreshPulse]);

  return (
    <UserPulseContext.Provider
      value={{
        pulse,
        recordEvent,
        refreshPulse,
        dismissCelebration,
        setStreak,
        setWeeklyProgress,
        setEarnings,
        setDaysSinceLastActivity,
      }}
    >
      {children}
    </UserPulseContext.Provider>
  );
}

export function useUserPulse() {
  const context = useContext(UserPulseContext);
  if (!context) {
    throw new Error('useUserPulse must be used within UserPulseProvider');
  }
  return context;
}

// Hook for getting just the pulse state (read-only)
export function usePulseState() {
  const { pulse } = useUserPulse();
  return pulse;
}
