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
  isLoading?: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  estimatedDemand = 166,
  demandTrendText = "5% lower than usual (similar Tuesdays)",
  recommendedPrep = 175,
  safetyBufferPct = 5,
  confidenceLevel = "High",
  confidencePct = 91,
  isLoading = false,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleTooltip = (key: string): void => {
    setActiveTooltip((prev) => (prev === key ? null : key));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. Estimated Demand Card */}
      <div className="p-6 rounded-2xl bg-white border border-line-light shadow-sm flex flex-col justify-between hover:border-forest/20 transition-all relative">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
            <Users size={20} strokeWidth={2} />
          </div>
          <button
            onClick={() => toggleTooltip("demand")}
            type="button"
            className="text-sm font-bold text-ink hover:text-forest flex items-center gap-2 transition-colors"
            title="Estimated student appetite based on attendance"
          >
            <span>Estimated Demand</span>
            <Info size={15} className="text-ink-secondary" />
          </button>
        </div>

        {activeTooltip === "demand" && (
          <div className="absolute top-14 right-4 left-4 p-3 rounded-xl bg-forest text-white text-xs z-20 shadow-lg border border-line-dark animate-fadeIn">
            Calculated from student hostel registrations, day-of-week dining patterns, and past Tuesday meals.
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight font-mono tabular-nums">
              {estimatedDemand}
            </span>
            <span className="text-sm font-semibold text-ink-secondary">
              portions
            </span>
          </div>
          <p className="text-sm text-ink-secondary mt-3 flex items-center gap-2 font-medium">
            <ArrowDown size={15} strokeWidth={2} className="text-amber-600 shrink-0" />
            <span>{demandTrendText}</span>
          </p>
        </div>
      </div>

      {/* 2. Recommended Preparation (Featured Accent Card) */}
      <div className="p-6 rounded-2xl bg-forest text-white border border-forest-mid shadow-md flex flex-col justify-between relative group hover:border-lime/30 transition-all">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-xl bg-lime text-forest-dark flex items-center justify-center shrink-0 shadow-sm">
            <UtensilsCrossed size={20} strokeWidth={2} />
          </div>
          <button
            onClick={() => toggleTooltip("prep")}
            type="button"
            className="text-sm font-bold text-white hover:text-lime flex items-center gap-2 transition-colors"
            title="Final cooking volume including safety buffer"
          >
            <span>Recommended Prep</span>
            <Info size={15} className="text-lime" />
          </button>
        </div>

        {activeTooltip === "prep" && (
          <div className="absolute top-14 right-4 left-4 p-3 rounded-xl bg-forest-dark text-lime text-xs z-20 shadow-xl border border-lime/30 animate-fadeIn">
            Base estimated demand plus a protective safety buffer to prevent meal shortages.
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-lime tracking-tight font-mono tabular-nums">
              {recommendedPrep}
            </span>
            <span className="text-sm font-semibold text-white/80">portions</span>
          </div>
          <p className="text-sm text-white/90 mt-3 flex items-center gap-2 font-medium">
            <ShieldCheck size={16} strokeWidth={2} className="text-lime shrink-0" />
            <span>Includes +{safetyBufferPct}% safety buffer</span>
          </p>
        </div>
      </div>

      {/* 3. Forecast Confidence Card */}
      <div className="p-6 rounded-2xl bg-white border border-line-light shadow-sm flex flex-col justify-between hover:border-forest/20 transition-all relative">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-xl bg-canvas text-forest flex items-center justify-center shrink-0">
            <BarChart2 size={20} strokeWidth={2} />
          </div>
          <button
            onClick={() => toggleTooltip("confidence")}
            type="button"
            className="text-sm font-bold text-ink hover:text-forest flex items-center gap-2 transition-colors"
            title="Model confidence score"
          >
            <span>Forecast Confidence</span>
            <Info size={15} className="text-ink-secondary" />
          </button>
        </div>

        {activeTooltip === "confidence" && (
          <div className="absolute top-14 right-4 left-4 p-3 rounded-xl bg-forest text-white text-xs z-20 shadow-lg border border-line-dark animate-fadeIn">
            High statistical consistency observed across the last 60 daily service sessions.
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight">
              {confidenceLevel}
            </span>
            <span className="text-sm font-mono font-bold text-forest bg-sage px-3 py-1 rounded-lg border border-forest/10">
              {confidencePct}% score
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-canvas mt-4 overflow-hidden flex">
            <div
              className="bg-forest h-full rounded-full transition-all duration-500"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <p className="text-sm text-ink-secondary mt-3 font-medium">
            Trained on 60-day historical attendance
          </p>
        </div>
      </div>
    </div>
  );
};


