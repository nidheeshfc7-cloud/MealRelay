'use client';

import React, { useState } from 'react';
import {
  Coins,
  Utensils,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { DailyRecordSummary } from './analyticsCalculations';

interface DailySavingsTimelineChartProps {
  dailyData: DailyRecordSummary[];
  monthLabel: string;
}

export const DailySavingsTimelineChart: React.FC<DailySavingsTimelineChartProps> = ({
  dailyData,
  monthLabel,
}) => {
  const [metricMode, setMetricMode] = useState<'savings' | 'portions'>('savings');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  if (dailyData.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-line-light shadow-sm text-center py-12">
        <p className="text-sm font-semibold text-ink-secondary">
          No meal logs recorded for this month yet.
        </p>
      </div>
    );
  }

  // Active day: either hovered/selected day or the latest day with data
  const daysWithData = dailyData.filter((d) => d.recordsCount > 0);
  const defaultDay = daysWithData.length > 0 ? daysWithData[daysWithData.length - 1] : dailyData[0];
  const activeDay = selectedDayIdx !== null ? dailyData[selectedDayIdx] : defaultDay;

  // Max values for responsive scaling
  const maxSavings = Math.max(1, ...dailyData.map((d) => d.rupeesSaved));
  const maxPortions = Math.max(1, ...dailyData.map((d) => Math.max(d.totalPrepared, d.totalServed)));

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-6">
      {/* Clean Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-forest">
              DAILY CALENDAR TIMELINE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sage text-forest">
              {monthLabel}
            </span>
          </div>
          <h2 className="text-xl font-black text-ink mt-0.5">
            {metricMode === 'savings'
              ? 'Daily Money Saved from Avoided Waste'
              : 'Daily Servings Cooked vs. Actually Eaten'}
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Tap or hover any day (1 to {dailyData.length}) to inspect cooking quantities and savings.
          </p>
        </div>

        {/* Simple Pill Toggle */}
        <div className="flex items-center p-1 rounded-2xl bg-canvas border border-line-light self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('savings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'savings'
                ? 'bg-forest text-lime shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Coins size={13} />
            <span>₹ Savings View</span>
          </button>
          <button
            onClick={() => setMetricMode('portions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'portions'
                ? 'bg-forest text-lime shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Utensils size={13} />
            <span>Cooked vs Eaten</span>
          </button>
        </div>
      </div>

      {/* Selected Day Inspector Banner */}
      {activeDay && (
        <div className="p-4 rounded-2xl bg-canvas border border-line-light flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest text-lime flex flex-col items-center justify-center font-black">
              <span className="text-[10px] leading-none uppercase">{activeDay.dayOfWeekShort}</span>
              <span className="text-sm leading-none mt-0.5">{activeDay.dayNumber}</span>
            </div>
            <div>
              <p className="font-bold text-sm text-ink">
                Day {activeDay.dayNumber} of {monthLabel}
                {activeDay.isWeekend && <span className="ml-2 text-[10px] font-bold text-ink-secondary">(Weekend)</span>}
              </p>
              <p className="text-[11px] text-ink-secondary mt-0.5">
                {activeDay.recordsCount > 0
                  ? `${activeDay.recordsCount} dishes prepared across all shifts`
                  : 'No meal service logged for this day'}
              </p>
            </div>
          </div>

          {activeDay.recordsCount > 0 ? (
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-ink-secondary uppercase">Cooked</span>
                <span className="font-extrabold text-ink text-sm">{activeDay.totalPrepared.toLocaleString()} plates</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-ink-secondary uppercase">Served</span>
                <span className="font-extrabold text-ink text-sm">{activeDay.totalServed.toLocaleString()} plates</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-ink-secondary uppercase">Leftovers</span>
                <span className="font-extrabold text-ink text-sm">
                  {activeDay.totalLeftovers} ({activeDay.leftoverPercent}%)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-forest uppercase">Money Saved</span>
                <span className="font-black text-forest text-sm">
                  ₹{activeDay.rupeesSaved.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs font-semibold text-ink-secondary italic">
              Kitchen scheduled off or untracked
            </span>
          )}
        </div>
      )}

      {/* 31-Day Bar Timeline */}
      <div className="relative pt-2">
        <div className="h-44 flex items-end gap-1 sm:gap-2 px-1">
          {dailyData.map((day, idx) => {
            const isSelected = activeDay?.dayNumber === day.dayNumber;
            const hasData = day.recordsCount > 0;

            if (metricMode === 'savings') {
              const heightPercent = hasData
                ? Math.max(10, Math.round((day.rupeesSaved / maxSavings) * 100))
                : 4;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayIdx(idx)}
                  onMouseEnter={() => setSelectedDayIdx(idx)}
                  className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group select-none"
                  title={`Day ${day.dayNumber} (${day.dayOfWeekShort}): ₹${day.rupeesSaved.toLocaleString('en-IN')} saved`}
                >
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 relative ${
                      isSelected
                        ? 'bg-forest shadow-md'
                        : hasData
                        ? day.isWeekend
                          ? 'bg-forest/30 group-hover:bg-forest/50'
                          : 'bg-forest/20 group-hover:bg-forest/40'
                        : 'bg-canvas border border-line-light'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    {isSelected && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-lime rounded-t-md" />
                    )}
                  </div>

                  {/* Day Label on X Axis */}
                  <span
                    className={`text-[10px] mt-2 font-bold transition-colors ${
                      isSelected
                        ? 'text-forest font-black scale-110'
                        : day.isWeekend
                        ? 'text-ink-secondary/60'
                        : 'text-ink'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </div>
              );
            }

            // Portions Mode (Cooked vs Served dual bars)
            const prepHeight = hasData
              ? Math.max(8, Math.round((day.totalPrepared / maxPortions) * 100))
              : 4;
            const servedHeight = hasData
              ? Math.max(8, Math.round((day.totalServed / maxPortions) * 100))
              : 4;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDayIdx(idx)}
                onMouseEnter={() => setSelectedDayIdx(idx)}
                className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group select-none"
                title={`Day ${day.dayNumber}: Cooked ${day.totalPrepared}, Served ${day.totalServed}`}
              >
                <div className="w-full flex items-end gap-0.5 h-full">
                  {/* Prepared Bar */}
                  <div
                    className={`flex-1 rounded-t-sm transition-all ${
                      isSelected ? 'bg-forest' : 'bg-forest/20 group-hover:bg-forest/35'
                    }`}
                    style={{ height: `${prepHeight}%` }}
                  />
                  {/* Served Bar */}
                  <div
                    className={`flex-1 rounded-t-sm transition-all ${
                      isSelected ? 'bg-forest-light' : 'bg-forest/40 group-hover:bg-forest/60'
                    }`}
                    style={{ height: `${servedHeight}%` }}
                  />
                </div>

                <span
                  className={`text-[10px] mt-2 font-bold ${
                    isSelected ? 'text-forest font-black scale-110' : 'text-ink-secondary'
                  }`}
                >
                  {day.dayNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Month Summary */}
      <div className="pt-3 border-t border-line-light flex flex-wrap items-center justify-between gap-3 text-xs text-ink-secondary">
        <div className="flex items-center gap-4">
          {metricMode === 'savings' ? (
            <>
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <span className="w-3 h-3 rounded bg-forest inline-block" />
                <span>Daily Savings (₹)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-forest/25 inline-block" />
                <span>Weekend Days</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <span className="w-3 h-3 rounded bg-forest/25 inline-block" />
                <span>Cooked Plates</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-forest">
                <span className="w-3 h-3 rounded bg-forest inline-block" />
                <span>Actually Served</span>
              </div>
            </>
          )}
        </div>

        <span className="font-semibold text-ink">
          Total Savings for {monthLabel}:{' '}
          <strong className="text-forest font-black">
            ₹{dailyData.reduce((acc, d) => acc + d.rupeesSaved, 0).toLocaleString('en-IN')}
          </strong>
        </span>
      </div>
    </div>
  );
};
