'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Leaf } from 'lucide-react';

export interface ColorFrame {
  id: number;
  text: string;
  line1: string;
  line2?: string;
  bg: string;
  textColor: string;
  accentColor?: string;
  direction: 'up' | 'left' | 'down' | 'right' | 'center';
  scaleShift?: boolean;
  isLightBg: boolean;
  startMs: number;
  endMs: number;
}

export const RAPID_FRAMES: ColorFrame[] = [
  {
    id: 1,
    text: 'STILL GUESSING?',
    line1: 'STILL',
    line2: 'GUESSING?',
    bg: '#D5FB53', // Electric lime
    textColor: '#003F2F', // Forest green
    direction: 'up',
    scaleShift: false,
    isLightBg: true,
    startMs: 0,
    endMs: 380,
  },
  {
    id: 2,
    text: 'TOO MUCH FOOD.',
    line1: 'TOO MUCH',
    line2: 'FOOD.',
    bg: '#003F2F', // Forest green
    textColor: '#F7F7F1', // Warm ivory
    direction: 'left',
    scaleShift: false,
    isLightBg: false,
    startMs: 380,
    endMs: 760,
  },
  {
    id: 3,
    text: 'TOO MUCH WASTE.',
    line1: 'TOO MUCH',
    line2: 'WASTE.',
    bg: '#EF693C', // Burnt orange
    textColor: '#FFFFFF', // Pure white
    direction: 'down',
    scaleShift: true,
    isLightBg: false,
    startMs: 760,
    endMs: 1140,
  },
  {
    id: 4,
    text: 'TIME TO CHANGE.',
    line1: 'TIME TO',
    line2: 'CHANGE.',
    bg: '#F7F7F1', // Warm ivory
    textColor: '#080A09', // Near black
    direction: 'right',
    scaleShift: false,
    isLightBg: true,
    startMs: 1140,
    endMs: 1520,
  },
  {
    id: 5,
    text: 'THINK AHEAD.',
    line1: 'THINK',
    line2: 'AHEAD.',
    bg: '#245BFF', // Vibrant cobalt
    textColor: '#FFFFFF', // Pure white
    direction: 'up',
    scaleShift: true,
    isLightBg: false,
    startMs: 1520,
    endMs: 1900,
  },
  {
    id: 6,
    text: 'PREPARE SMARTER.',
    line1: 'PREPARE',
    line2: 'SMARTER.',
    bg: '#080A09', // Near black
    textColor: '#D5FB53', // Electric lime
    direction: 'down',
    scaleShift: false,
    isLightBg: false,
    startMs: 1900,
    endMs: 2280,
  },
  {
    id: 7,
    text: 'WASTE LESS.',
    line1: 'WASTE',
    line2: 'LESS.',
    bg: '#D5FB53', // Electric lime
    textColor: '#003F2F', // Forest green
    direction: 'up',
    scaleShift: true,
    isLightBg: true,
    startMs: 2280,
    endMs: 2700,
  },
  {
    id: 8,
    text: 'MEALRELAY.',
    line1: 'MEALRELAY.',
    bg: '#003F2F', // Forest green
    textColor: '#F7F7F1', // Warm ivory
    accentColor: '#D5FB53', // Electric lime
    direction: 'center',
    scaleShift: true,
    isLightBg: false,
    startMs: 2700,
    endMs: 3200,
  },
];

interface CinematicIntroProps {
  onDone?: () => void;
  forcePlay?: boolean;
}

export function CinematicIntro({ onDone, forcePlay = false }: CinematicIntroProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [textRevealed, setTextRevealed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [screenOpacity, setScreenOpacity] = useState(1);
  const [isExiting, setIsExiting] = useState(false);

  const finishedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  };

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    try {
      sessionStorage.setItem('mealrelay_intro_seen', 'true');
    } catch {
      // Ignore sessionStorage restrictions
    }

    setIsExiting(true);
    setScreenOpacity(0);
    setTimeout(() => {
      setIsVisible(false);
      onDone?.();
    }, 380);
  }, [onDone]);

  const scheduleFrame = useCallback((frameIdx: number) => {
    setCurrentFrameIndex(frameIdx);
    // Instant reset, then fast directional reveal
    setTextRevealed(false);
    requestAnimationFrame(() => {
      setTextRevealed(true);
    });
  }, []);

  const triggerPlay = useCallback(() => {
    finishedRef.current = false;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setIsExiting(false);
    setScreenOpacity(1);
    setIsVisible(true);

    if (reduceMotion) {
      // Accessible pacing for reduced-motion users (no rapid flashing)
      scheduleFrame(5); // PREPARE SMARTER.
      later(() => scheduleFrame(6), 1000); // WASTE LESS.
      later(() => scheduleFrame(7), 2000); // MEALRELAY.
      later(() => finish(), 3100);
      return;
    }

    // High-energy rapid-fire color cuts (total ~3.2s)
    RAPID_FRAMES.forEach((frame, idx) => {
      later(() => {
        scheduleFrame(idx);
      }, frame.startMs);
    });

    // 3.20s: Final transition smoothly into the application landing
    later(() => {
      finish();
    }, 3200);
  }, [finish, reduceMotion, scheduleFrame]);

  // Determine whether to play intro on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setReduceMotion(prefersReduced);

      const urlParams = new URLSearchParams(window.location.search);
      const isReplayRequested = urlParams.get('intro') === 'replay' || forcePlay;
      const testPhase = urlParams.get('phase');

      // Deterministic phase inspection: ?phase=1 .. 8
      if (testPhase) {
        const pNum = parseInt(testPhase, 10);
        if (pNum >= 1 && pNum <= 8) {
          setIsVisible(true);
          setScreenOpacity(1);
          setCurrentFrameIndex(pNum - 1);
          setTextRevealed(true);
          return;
        }
      }

      let hasSeenIntro = false;
      try {
        hasSeenIntro = sessionStorage.getItem('mealrelay_intro_seen') === 'true';
      } catch {
        hasSeenIntro = false;
      }

      if (!hasSeenIntro || isReplayRequested) {
        triggerPlay();
      }
    }
  }, [forcePlay, triggerPlay]);

  // Listen for global custom replay event
  useEffect(() => {
    const handleReplayEvent = () => {
      try {
        sessionStorage.removeItem('mealrelay_intro_seen');
      } catch {
        // Ignore storage errors
      }
      triggerPlay();
    };

    window.addEventListener('mealrelay:replay-intro', handleReplayEvent);
    return () => {
      window.removeEventListener('mealrelay:replay-intro', handleReplayEvent);
    };
  }, [triggerPlay]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  if (!isVisible) return null;

  const currentFrame = RAPID_FRAMES[currentFrameIndex] || RAPID_FRAMES[0];

  // Fast directional transform calculations
  const getInitialTransform = (dir: ColorFrame['direction'], scaleShift?: boolean) => {
    const baseScale = scaleShift ? 'scale(1.04)' : 'scale(1)';
    switch (dir) {
      case 'up':
        return `translateY(42px) ${baseScale}`;
      case 'down':
        return `translateY(-42px) ${baseScale}`;
      case 'left':
        return `translateX(-54px) ${baseScale}`;
      case 'right':
        return `translateX(54px) ${baseScale}`;
      case 'center':
        return 'scale(0.92)';
      default:
        return 'translateY(40px)';
    }
  };

  const initialTransform = getInitialTransform(currentFrame.direction, currentFrame.scaleShift);

  return (
    <div
      id="cinematic-intro-overlay"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        backgroundColor: currentFrame.bg,
        opacity: screenOpacity,
        // Sharp instant color cuts during playback; smooth coordinated fade only upon exit
        transition: isExiting ? 'opacity 0.38s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        willChange: 'opacity, background-color',
      }}
      role="region"
      aria-label="High-energy cinematic intro"
    >
      {/* Subtle depth spotlight vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.06)_0%,_transparent_75%)]"
        aria-hidden="true"
      />

      {/* High-Contrast Adaptive Skip Intro Button */}
      <button
        id="skip-intro-btn"
        onClick={finish}
        type="button"
        className={`absolute top-6 right-6 sm:top-8 sm:right-8 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all backdrop-blur-md cursor-pointer active:scale-95 border ${
          currentFrame.isLightBg
            ? 'bg-black/10 hover:bg-black/20 text-[#003F2F] border-black/15 shadow-sm'
            : 'bg-white/10 hover:bg-white/20 text-[#F7F7F1] border-white/20 shadow-sm'
        }`}
        aria-label="Skip cinematic introduction"
      >
        <span>Skip Intro</span>
        <ArrowRight size={12} className="opacity-80" />
      </button>

      {/* Kinetic Typography Stage with Fast Directional Masked Reveal */}
      <div className="relative w-full max-w-6xl px-4 sm:px-12 flex flex-col items-center justify-center text-center">
        {currentFrame.id !== 8 ? (
          <div className="overflow-hidden py-3">
            <div
              style={{
                transform: textRevealed ? 'translate3d(0,0,0) scale(1)' : initialTransform,
                opacity: textRevealed ? 1 : 0,
                transition: 'transform 115ms cubic-bezier(0.16, 1, 0.3, 1), opacity 85ms ease-out',
                color: currentFrame.textColor,
              }}
            >
              <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-[-0.04em] uppercase leading-[1.05] sm:leading-[1.02]">
                <span className="block sm:inline">{currentFrame.line1} </span>
                {currentFrame.line2 && <span className="block sm:inline">{currentFrame.line2}</span>}
              </h1>
            </div>
          </div>
        ) : (
          /* Frame 8: MEALRELAY. Brand Wordmark Climax */
          <div className="overflow-hidden py-3">
            <div
              className="flex items-center justify-center gap-2.5 xs:gap-3.5 sm:gap-6"
              style={{
                transform: textRevealed ? 'translate3d(0,0,0) scale(1)' : initialTransform,
                opacity: textRevealed ? 1 : 0,
                transition: 'transform 130ms cubic-bezier(0.16, 1, 0.3, 1), opacity 90ms ease-out',
                color: currentFrame.textColor,
              }}
            >
              <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl md:rounded-3xl bg-[#D5FB53] text-[#003F2F] flex items-center justify-center -rotate-6 shadow-2xl shrink-0">
                <Leaf className="w-5 h-5 xs:w-6 xs:h-6 sm:w-9 sm:h-9 md:w-12 md:h-12 stroke-[2.5]" />
              </div>
              <h1 className="text-3xl xs:text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-[-0.04em] uppercase text-[#F7F7F1] leading-none whitespace-nowrap">
                MEALRELAY<span className="text-[#D5FB53]">.</span>
              </h1>
            </div>
          </div>
        )}
      </div>

      {/* Editorial Rhythm Bar & Frame Counter */}
      <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 flex items-center justify-between pointer-events-none px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: currentFrame.textColor }}
          />
          <span
            className="text-[10px] sm:text-[11px] font-black tracking-[0.25em] uppercase opacity-80"
            style={{ color: currentFrame.textColor }}
          >
            Stage 1.1 · Rapid-Fire Color Cut
          </span>
        </div>

        {/* Dynamic Frame Counter (01/08 .. 08/08) */}
        <div
          className="text-[11px] sm:text-[12px] font-mono font-black tracking-wider opacity-90"
          style={{ color: currentFrame.textColor }}
        >
          0{currentFrame.id} / 08
        </div>
      </div>
    </div>
  );
}
