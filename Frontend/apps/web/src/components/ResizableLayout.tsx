"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical, RotateCcw } from "lucide-react";

export interface ResizableLayoutProps {
  leftChild: React.ReactNode;
  rightChild: React.ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  storageKey?: string;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftChild,
  rightChild,
  defaultLeftPercent = 63,
  minLeftPercent = 46,
  maxLeftPercent = 75,
  storageKey = "mealrelay_dashboard_split_pct",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidthPct, setLeftWidthPct] = useState<number>(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Restore saved layout preference on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= minLeftPercent && parsed <= maxLeftPercent) {
        setLeftWidthPct(parsed);
      }
    } catch {
      // Storage access restricted; proceed with default
    }
  }, [storageKey, minLeftPercent, maxLeftPercent]);

  // Save layout preference when dragging finishes
  const persistWidth = useCallback(
    (pct: number) => {
      try {
        localStorage.setItem(storageKey, pct.toFixed(1));
      } catch {
        // Storage access restricted
      }
    },
    [storageKey]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const rawPct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(minLeftPercent, Math.min(maxLeftPercent, rawPct));
      setLeftWidthPct(Math.round(clamped * 10) / 10);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      setIsDragging(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPct = ((upEvent.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(minLeftPercent, Math.min(maxLeftPercent, rawPct));
      persistWidth(clamped);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleReset = () => {
    setLeftWidthPct(defaultLeftPercent);
    persistWidth(defaultLeftPercent);
  };

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col xl:flex-row gap-0 xl:gap-0 items-start ${
        isDragging ? "select-none cursor-col-resize" : ""
      }`}
    >
      {/* Left Workspace Panel: Kitchen Prep Station */}
      <div
        className="w-full xl:shrink-0 transition-all duration-75"
        style={{
          width: isMounted ? `calc(${leftWidthPct}% - 8px)` : "63%",
        }}
      >
        {leftChild}
      </div>

      {/* Draggable Divider Handle Bar (Desktop XL+) */}
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={handleReset}
        title="Drag to resize panels (Double-click to reset)"
        className="hidden xl:flex flex-col items-center justify-center shrink-0 w-4 group cursor-col-resize py-6 px-0.5 select-none self-stretch z-20"
      >
        <div
          className={`h-full min-h-[300px] w-1 rounded-full transition-all duration-200 flex items-center justify-center ${
            isDragging
              ? "bg-lime w-1.5 shadow-[0_0_12px_rgba(213,251,83,0.8)]"
              : "bg-line-light group-hover:bg-lime/80 group-hover:w-1.5"
          }`}
        >
          {/* Subtle pill grab indicator with icon */}
          <div
            className={`w-5 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
              isDragging
                ? "bg-forest text-lime border-lime scale-110 shadow-lg"
                : "bg-white text-ink-secondary border-line-light group-hover:bg-forest group-hover:text-lime group-hover:border-lime/40"
            }`}
          >
            <GripVertical size={13} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Hover / Drag split percentage indicator pill */}
        <div
          className={`absolute top-2 pointer-events-none transition-all duration-200 z-30 ${
            isDragging
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0"
          }`}
        >
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide bg-forest text-lime border border-lime/40 shadow-xl whitespace-nowrap">
            {Math.round(leftWidthPct)}% : {Math.round(100 - leftWidthPct)}%
          </span>
        </div>
      </div>

      {/* Right Intelligence Panel: Cushion Controls, AI Insights & Impact */}
      <div
        className="w-full xl:flex-1 min-w-0 transition-all duration-75 mt-8 xl:mt-0 xl:pl-3"
        style={{
          width: isMounted ? `calc(${100 - leftWidthPct}% - 8px)` : "37%",
        }}
      >
        {rightChild}
      </div>
    </div>
  );
};
