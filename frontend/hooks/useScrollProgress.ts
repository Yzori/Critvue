"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ScrollProgressOptions {
  /** IDs of chapter sections to track */
  chapterIds?: string[];
  /** Offset from top when determining active chapter (default: 100) */
  offset?: number;
}

interface ScrollProgressResult {
  /** Overall page scroll progress from 0 to 1 */
  progress: number;
  /** Currently active chapter index (0-based) */
  activeChapter: number;
  /** Progress within the current chapter from 0 to 1 */
  chapterProgress: number;
  /** Scroll to a specific chapter by index */
  scrollToChapter: (index: number) => void;
}

/**
 * Hook to track scroll progress and active chapter
 * Used for the journey progress bar in How It Works page
 */
export function useScrollProgress(options: ScrollProgressOptions = {}): ScrollProgressResult {
  const { chapterIds = [], offset = 100 } = options;

  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const ticking = useRef(false);

  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

    setProgress(scrollProgress);

    // Calculate active chapter if chapter IDs are provided
    if (chapterIds.length > 0) {
      const chapters = chapterIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

      if (chapters.length > 0) {
        let currentChapter = 0;
        let currentChapterTop = 0;
        let nextChapterTop = docHeight + window.innerHeight;

        for (let i = 0; i < chapters.length; i++) {
          const chapterTop = chapters[i].offsetTop - offset;
          if (scrollTop >= chapterTop) {
            currentChapter = i;
            currentChapterTop = chapterTop;
            nextChapterTop = chapters[i + 1]?.offsetTop - offset ?? docHeight + window.innerHeight;
          }
        }

        setActiveChapter(currentChapter);

        // Calculate progress within current chapter
        const chapterHeight = nextChapterTop - currentChapterTop;
        const scrollInChapter = scrollTop - currentChapterTop;
        const chapterProg = chapterHeight > 0
          ? Math.max(0, Math.min(scrollInChapter / chapterHeight, 1))
          : 0;
        setChapterProgress(chapterProg);
      }
    }

    ticking.current = false;
  }, [chapterIds, offset]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(calculateProgress);
      ticking.current = true;
    }
  }, [calculateProgress]);

  const scrollToChapter = useCallback((index: number) => {
    if (index >= 0 && index < chapterIds.length) {
      const element = document.getElementById(chapterIds[index]);
      if (element) {
        const top = element.offsetTop - offset + 10;
        window.scrollTo({
          top,
          behavior: "smooth",
        });
      }
    }
  }, [chapterIds, offset]);

  useEffect(() => {
    // Calculate initial progress
    calculateProgress();

    // Add scroll listener with passive option for performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll, calculateProgress]);

  return {
    progress,
    activeChapter,
    chapterProgress,
    scrollToChapter,
  };
}
