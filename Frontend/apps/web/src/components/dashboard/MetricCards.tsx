"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  BarChart2,
  Info,
  ShieldCheck,
  Users,
  UtensilsCrossed,
} from "lucide-react";

interface MetricCardsProps {
  estimatedDemand: number;
  demandTrendText?: string;
  recommendedPrep: number;
  safetyBufferPct?: number;
  confidenceLevel?: "High" | "Moderate" | "Good";
  confidencePct?: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  estimatedDemand = 166,
  demandTrendText = "5% lower than usual (similar Tuesdays)",
  recommendedPrep = 175,
  safetyBufferPct = 5,
  confidenceLevel = "High",
  confidencePct = 88,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleTooltip = (key: string) => {
    setActiveTooltip((prev) => (prev === key ? null : key));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Estimated Demand Card */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col justify-between hover:border-forest/20 transition-all relative">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-sage text-forest flex items-center justify-center shrink-0">
            <Users size={20} className="stroke-[2.2]" />
          </div>
          <button
            onClick={() => toggleTooltip("demand")}
            type="button"
            className="text-xs font-bold text-ink-secondary hover:text-ink flex items-center gap-1 transition-colors"
            title="Estimated student appetite based on attendance"
          >
            <span>Estimated Demand</span>
            <Info size={14} className="text-ink-secondary/70" />
          </button>
        </div>

        {activeTooltip === "demand" && (
          <div className="absolute top-14 right-4 left-4 p-3 rounded-xl bg-forest text-white text-[11px] z-20 shadow-lg border border-line-dark">
            Calculated from student hostel registrations, day-of-week dining patterns, and past Tuesday meals.
          </div>
        )}

        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-ink tracking-tight">
              {estimatedDemand}
            </span>
            <span className="text-sm font-semibold text-ink-secondary">
              portions
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-1.5 flex items-center gap-1.5 font-medium">
            <ArrowDown size={13} className="text-amber-600 shrink-0" />
            <span>{demandTrendText}</span>
          </p>
        </div>
      </div>

      {/* 2. Recommended Preparation (FEATURED ACCENT CARD: Forest Green + Electric Lime) */}
      <div className="p-6 rounded-3xl bg-forest text-white border-2 border-lime/40 shadow-xl relative overflow-hidden flex flex-col justify-between group">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-lime/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-lime text-forest-dark flex items-center justify-center shrink-0 shadow-sm">
            <UtensilsCrossed size={20} className="stroke-[2.5]" />
          </div>
          <button
            onClick={() => toggleTooltip("prep")}
            type="button"
            className="text-xs font-bold text-white/80 hover:text-white flex items-center gap-1 transition-colors"
            title="Final cooking volume including safety buffer"
          >
            <span>Recommended Preparation</span>
            <Info size={14} className="text-lime" />
          </button>
        </div>

        {activeTooltip === "prep" && (
          <div className="absolute top-14 right-4 left-4 p-3 rounded-xl bg-forest-dark text-lime text-[11px] z-20 shadow-xl border border-lime/30">
            Base estimated demand plus a protective safety buffer to guarantee no student leaves without a meal.
          </div>
        )}

        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-lime tracking-tight">
              {recommendedPrep}
            </span>
            <span className="text-sm font-bold text-white/80">portions</span>
          </div>
          <p className="text-xs text-white/80 mt-1.5 flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-lime shrink-0" />
            <span>Includes {safetyBufferPct}% safety buffer</span>
          </p>
        </div>
      </div>

      {/* 3. Forecast Confidence Card */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col justify-between hover:border-forest/20 transition-all relative">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-canvas text-forest flex items-center justify-center shrink-0">
            <BarChart2 size={20} className="stroke-[2.2]" />
          </div>
          <button
            onClick={() => toggleTooltip("confidence")}
            type="button"
            className="text-xs font-bold text-ink-secondary hover:text-ink flex items-center gap-1 transition-colors"
            title="Model confidence score"
          >
            <span>Forecast Confidence</span>
            <Info size={14} className="text-ink-secondary/70" />
          </button>
        </div>

        {activeTooltip === "confidence" && (
          <div className="absolute top-14 right-4 left-4 p-3 rounded-xl bg-forest text-white text-[11px] z-20 shadow-lg border border-line-dark">
            High statistical consistency observed across the last 30 daily service sessions.
          </div>
        )}

        <div className="mt-5">
          <span className="text-4xl sm:text-5xl font-black text-ink tracking-tight">
            {confidenceLevel}
          </span>
          <div className="w-full h-2.5 rounded-full bg-canvas mt-3.5 overflow-hidden flex">
            <div
              className="bg-forest h-full rounded-full transition-all duration-500"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
