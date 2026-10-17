'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Coins,
  Scale,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { WeeklyBucket } from './analyticsCalculations';

interface MonthlySavingsChartProps {
  weeklyData: WeeklyBucket[];
  dailyData?: {
    date: string;
    dayLabel: string;
    rupeesSaved: number;
    portionsRescued: number;
    kgSaved: number;
    prepared: number;
    leftovers: number;
  }[];
  timeView: 'monthly' | 'weekly';
  monthLabel: string;
}

export const MonthlySavingsChart: React.FC<MonthlySavingsChartProps> = ({
  weeklyData,
  dailyData = [],
  timeView,
  monthLabel,
}) => {
  const [metricMode, setMetricMode] = useState<'rupees' | 'portions' | 'kg'>('rupees');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const isWeekly = timeView === 'weekly';
  const dataItems = isWeekly && dailyData.length > 0
    ? dailyData.map((d) => ({
        label: d.dayLabel,
        sublabel: d.date,
        rupees: d.rupeesSaved,
        portions: d.portionsRescued,
        kg: d.kgSaved,
        prepared: d.prepared,
        leftovers: d.leftovers,
      }))
    : weeklyData.map((w) => ({
        label: w.weekLabel,
        sublabel: `${w.startDate.slice(5)} to ${w.endDate.slice(5)}`,
        rupees: w.metrics.totalRupeesSaved,
        portions: w.metrics.totalPortionsRescued,
        kg: w.metrics.totalKgSaved,
        prepared: w.metrics.totalPrepared,
        leftovers: w.metrics.totalLeftovers,
      }));

  if (dataItems.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-line-light shadow-sm text-center py-16">
        <p className="text-sm font-semibold text-ink-secondary">
          No meal service records logged for this selected period.
        </p>
      </div>
    );
  }

  const getMetricValue = (item: (typeof dataItems)[0]): number => {
    if (metricMode === 'rupees') return item.rupees;
    if (metricMode === 'portions') return item.portions;
    return item.kg;
  };

  const values = dataItems.map(getMetricValue);
  const maxValue = Math.max(1, ...values);

  // Cumulative line points calculation
  let cumulative = 0;
  const cumulativeValues = values.map((v) => {
    cumulative += v;
    return cumulative;
  });
  const maxCumulative = Math.max(1, cumulative);

  const formatDisplay = (val: number): string => {
    if (metricMode === 'rupees') return `₹${val.toLocaleString('en-IN')}`;
    if (metricMode === 'portions') return `${val.toLocaleString('en-IN')} portions`;
    return `${val.toFixed(1)} kg`;
  };

  const activeHover = hoveredIdx !== null ? dataItems[hoveredIdx] : null;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-6">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-forest">
              {isWeekly ? '7-DAY OPERATIONAL AUDIT' : 'MONTHLY SAVINGS & RESCUE CURVE'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sage text-forest border border-line-light">
              {monthLabel}
            </span>
          </div>
          <h2 className="text-xl font-black text-ink mt-0.5">
            {metricMode === 'rupees'
              ? 'Estimated Kitchen Financial Savings'
              : metricMode === 'portions'
              ? 'Edible Servings Rescued from Landfill'
              : 'Cumulative Food Mass Saved (kg)'}
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Calculated by benchmarking daily logged leftovers against the 14% unmanaged mess waste baseline.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center p-1 rounded-2xl bg-canvas border border-line-light self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('rupees')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'rupees'
                ? 'bg-forest text-lime shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Coins size={13} />
            <span>₹ Savings</span>
          </button>
          <button
            onClick={() => setMetricMode('portions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'portions'
                ? 'bg-forest text-lime shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Layers size={13} />
            <span>Portions</span>
          </button>
          <button
            onClick={() => setMetricMode('kg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              metricMode === 'kg'
                ? 'bg-forest text-lime shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Scale size={13} />
            <span>Weight (kg)</span>
          </button>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="relative pt-6 pb-2">
        {/* Dynamic Tooltip Header when hovering */}
        <div className="h-10 flex items-center justify-between text-xs font-bold px-2 bg-canvas/60 rounded-xl mb-4 border border-line-light">
          {activeHover ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <span className="text-forest font-black">
                {activeHover.label} ({activeHover.sublabel}):
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-ink">
                  Rescued:{' '}
                  <strong className="text-forest">
                    {formatDisplay(getMetricValue(activeHover))}
                  </strong>
                </span>
                <span className="text-ink-secondary hidden sm:inline">
                  Prepared: {activeHover.prepared.toLocaleString()}
                </span>
                <span className="text-ink-secondary hidden sm:inline">
                  Leftovers: {activeHover.leftovers.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-ink-secondary">
              <Info size={13} />
              <span>Hover over any bar to inspect period breakdown and portion counts</span>
            </div>
          )}
        </div>

        {/* Visual Bar Chart with SVG Cumulative Trendline */}
        <div className="relative h-56 flex items-end gap-2 sm:gap-6 px-2">
          {/* SVG Trendline for Cumulative Savings */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <polyline
              fill="none"
              stroke="#003F2F"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              strokeOpacity="0.45"
              points={dataItems
                .map((item, idx) => {
                  const xPercent = (idx + 0.5) / dataItems.length;
                  const yPercent = 1 - cumulativeValues[idx] / maxCumulative;
                  return `${xPercent * 100}%,${Math.max(10, yPercent * 80 + 10)}%`;
                })
                .join(' ')}
            />
          </svg>

          {dataItems.map((item, idx) => {
            const val = getMetricValue(item);
            const heightPercent = Math.max(12, Math.round((val / maxValue) * 100));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer group"
              >
                {/* Metric Value Label on Top */}
                <span
                  className={`text-[10px] font-black transition-all ${
                    isHovered ? 'text-forest scale-110' : 'text-ink-secondary opacity-75'
                  }`}
                >
                  {metricMode === 'rupees'
                    ? `₹${Math.round(val / 1000)}k`
                    : Math.round(val)}
                </span>

                {/* Bar Element */}
                <div className="w-full bg-canvas rounded-t-xl overflow-hidden h-40 flex items-end relative border border-line-light">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      isHovered
                        ? 'bg-forest'
                        : 'bg-forest/20 group-hover:bg-forest/40'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  {/* Subtle Top Accent */}
                  <div
                    className={`absolute top-0 inset-x-0 h-1 rounded-t-xl transition-all ${
                      isHovered ? 'bg-lime' : 'bg-transparent'
                    }`}
                  />
                </div>

                {/* X-Axis Label */}
                <div className="text-center">
                  <p
                    className={`text-xs font-bold transition-colors ${
                      isHovered ? 'text-forest font-black' : 'text-ink-secondary'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-[10px] text-ink-muted leading-tight">
                    {item.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Summary Notes */}
      <div className="pt-4 border-t border-line-light flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <span className="w-3 h-3 rounded bg-forest inline-block" />
            <span>Rescued Volume / Cost Saved</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-ink-secondary">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-forest/60 inline-block" />
            <span>Cumulative Trajectory Curve</span>
          </div>
        </div>
        <span className="text-ink-secondary font-medium">
          Total for {monthLabel}:{' '}
          <strong className="text-forest">
            {formatDisplay(cumulative)}
          </strong>
        </span>
      </div>
    </div>
  );
};
