'use client';

import React from 'react';
import { Play } from 'lucide-react';

export function DemoBanner() {
  const handleReplayIntro = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('mealrelay_intro_seen');
      } catch {
        // Ignore storage errors
      }
      window.dispatchEvent(new CustomEvent('mealrelay:replay-intro'));
    }
  };

  return (
    <div className="bg-forest-dark text-white/90 text-xs py-2 px-4 border-b border-line-dark flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-lime"></span>
        </span>
        <span className="font-semibold text-lime tracking-wide uppercase text-[10px]">Interactive Demo Mode</span>
        <span className="text-white/40 hidden sm:inline">|</span>
        <span className="text-white/70 hidden sm:inline">
          Operating on verified institutional heuristics. No live backend database connected.
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-white/60">
        <button
          id="replay-intro-btn"
          onClick={handleReplayIntro}
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-lime font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          title="Replay the cinematic flash intro animation"
        >
          <Play size={10} className="fill-current" />
          <span>Replay Intro</span>
        </button>
        <span className="hidden sm:inline">Campus Dining Prototype</span>
      </div>
    </div>
  );
}
