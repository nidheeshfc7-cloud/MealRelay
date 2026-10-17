'use client';

import React, { useState } from 'react';
import {
  CalendarRange,
  TrendingDown,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import { DayOfWeekSummary } from './analyticsCalculations';

interface DayOfWeekPatternChartProps {
  daySummaries: DayOfWeekSummary[];
}

export const DayOfWeekPatternChart: React.FC<DayOfWeekPatternChartProps> = ({
  daySummaries,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (daySummaries.length === 0) {
    return null;
  }

  const maxPrepared = Math.max(1, ...daySummaries.map((d) => d.totalPrepared));
  const activeDay = hoveredIdx !== null ? daySummaries[hoveredIdx] : null;

  // Find lowest waste day and highest leftover day
  const validDays = daySummaries.filter((d) => d.recordsCount > 0);
  const bestDay = [...validDays].sort((a, b) => a.leftoverPercent - b.leftoverPercent)[0];
  const worstDay = [...validDays].sort((a, b) => b.leftoverPercent - a.leftoverPercent)[0];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-forest">
              RECURRENT DEMAND CYCLES
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sage text-forest border border-line-light">
              ML Feature Signal
            </span>
          </div>
          <h3 className="text-lg font-black text-ink mt-0.5">
            Day-of-Week Food Consumption & Waste Variance
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Reveals recurring attendance shifts (e.g., weekend departures vs. Friday dinner surges) modeled by the Random Forest engine.
          </p>
        </div>

        {bestDay && (
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <Sparkles size={13} className="text-emerald-600" />
            <span>Optimal: {bestDay.dayShort} ({bestDay.leftoverPercent}% waste)</span>
          </div>
        )}
      </div>

      {/* Active Day Hover Insight Bar */}
      <div className="h-10 flex items-center justify-between text-xs font-bold px-3 bg-canvas/70 rounded-xl border border-line-light">
        {activeDay ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-forest font-black">
              {activeDay.dayName}:
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-ink">
                Prepared: <strong>{activeDay.totalPrepared.toLocaleString()}</strong>
              </span>
              <span className="text-ink">
                Served: <strong>{activeDay.totalServed.toLocaleString()}</strong>
              </span>
              <span className="text-forest">
                Rescued: <strong>{activeDay.portionsRescued.toLocaleString()} portions</strong>
              </span>
              <span className="text-ink font-black">
                ₹{activeDay.rupeesSaved.toLocaleString('en-IN')} Saved
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-ink-secondary">
            <Info size={13} />
            <span>Hover over any weekday to see average prep, consumption, and leftover rates</span>
          </div>
        )}
      </div>

      {/* 7-Day Visual Bars */}
      <div className="h-48 flex items-end gap-2 sm:gap-6 px-2 pt-2">
        {daySummaries.map((day, idx) => {
          const heightPercent = Math.max(12, Math.round((day.totalPrepared / maxPrepared) * 100));
          const isWeekend = day.dayIndex === 5 || day.dayIndex === 6;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={day.dayIndex}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer group"
            >
              {/* Waste % Tag */}
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition-all ${
                  day.leftoverPercent <= 6.0
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {day.leftoverPercent}%
              </span>

              {/* Bar Stack */}
              <div className="w-full bg-canvas rounded-t-xl overflow-hidden h-32 flex items-end relative border border-line-light">
                <div
                  className={`w-full rounded-t-xl transition-all duration-500 ${
                    isHovered
                      ? 'bg-forest'
                      : isWeekend
                      ? 'bg-forest/25 group-hover:bg-forest/40'
                      : 'bg-forest/15 group-hover:bg-forest/30'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                {/* Accent top stripe */}
                <div
                  className={`absolute top-0 inset-x-0 h-1 rounded-t-xl transition-all ${
                    isHovered ? 'bg-lime' : 'bg-transparent'
                  }`}
                />
              </div>

              {/* Day Label */}
              <div className="text-center">
                <p
                  className={`text-xs font-bold transition-colors ${
                    isHovered ? 'text-forest font-black' : isWeekend ? 'text-ink-secondary' : 'text-ink'
                  }`}
                >
                  {day.dayShort}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Notes */}
      <div className="pt-3 border-t border-line-light flex flex-wrap items-center justify-between gap-3 text-xs text-ink-secondary">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-forest/15 inline-block" />
            <span>Mon–Fri (Academic Turnout)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-forest/35 inline-block" />
            <span>Sat–Sun (Weekend Variance)</span>
          </span>
        </div>
        {worstDay && (
          <span className="text-[11px] font-medium text-amber-800">
            Note: {worstDay.dayName} experiences {worstDay.leftoverPercent}% leftover variance due to weekend excursions.
          </span>
        )}
      </div>
    </div>
  );
};
