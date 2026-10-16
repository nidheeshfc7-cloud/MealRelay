'use client';

import React from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Leaf,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  SAMPLE_METRICS,
  SAMPLE_WEEKLY_VOLUME,
  formatPortionNumber,
} from '@mealrelay/core';

export default function AnalyticsPage() {
  const peak = Math.max(...SAMPLE_WEEKLY_VOLUME);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <Header
            title="Kitchen Waste & Efficiency Analytics"
            subtitle="7-Day Performance Review · Closed-Loop Impact Measurements"
            action={
              <button
                onClick={() => alert('Exporting kitchen compliance summary CSV for institutional audit...')}
                className="px-4 py-2.5 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Download size={13} />
                <span>Export Operations Report</span>
              </button>
            }
          />

          {/* Top Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Weekly Volume</span>
              <p className="text-3xl font-black text-ink mt-2">
                {formatPortionNumber(SAMPLE_METRICS.sevenDayPlannedTotal)}
              </p>
              <p className="text-xs text-ink-secondary mt-1">Servings planned across 7 days</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Service Accuracy</span>
              <p className="text-3xl font-black text-forest mt-2">
                {SAMPLE_METRICS.serviceRate}%
              </p>
              <p className="text-xs text-ink-secondary mt-1">Met demand without running short</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Food Waste Avoided</span>
              <p className="text-3xl font-black text-forest mt-2">
                ~{SAMPLE_METRICS.wasteReductionPercent}%
              </p>
              <p className="text-xs text-ink-secondary mt-1">Against unmanaged baseline</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Weight Saved</span>
              <p className="text-3xl font-black text-ink mt-2">
                ~{SAMPLE_METRICS.wastePreventedKg} kg
              </p>
              <p className="text-xs text-ink-secondary mt-1">Daily edible food prevented from waste</p>
            </div>
          </div>

          {/* 7-Day Weekly Production Volume Chart */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-forest">TREND ANALYSIS</span>
                <h2 className="text-xl font-black text-ink mt-0.5">7-Day Servings Planned</h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-ink-secondary">
                  <span className="w-3 h-3 rounded bg-line-light inline-block"></span>
                  Past Weekdays
                </span>
                <span className="flex items-center gap-1.5 text-forest">
                  <span className="w-3 h-3 rounded bg-lime inline-block"></span>
                  Target Service (Today)
                </span>
              </div>
            </div>

            {/* Custom SVG/HTML Bar Chart */}
            <div className="pt-8 pb-4">
              <div className="h-48 flex items-end gap-3 sm:gap-6">
                {SAMPLE_WEEKLY_VOLUME.map((val, idx) => {
                  const heightPercent = Math.max(10, Math.round((val / peak) * 100));
                  const isToday = idx === SAMPLE_WEEKLY_VOLUME.length - 1;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[11px] font-bold text-ink-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                        {val}
                      </span>
                      <div className="w-full bg-canvas rounded-t-xl overflow-hidden h-36 flex items-end">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-700 ${
                            isToday ? 'bg-forest group-hover:bg-lime' : 'bg-forest/15 group-hover:bg-forest/30'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${isToday ? 'text-forest font-black' : 'text-ink-secondary'}`}>
                        {days[idx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Yesterday's Service Breakdown Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-forest">CLOSED-LOOP AUDIT</span>
              <h2 className="text-xl font-black text-ink mt-0.5">Yesterday's Actuals vs Planned</h2>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                Post-service audit comparing kitchen work orders against actual plates served and leftovers logged.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line-light text-xs font-extrabold uppercase tracking-wider text-ink-secondary">
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Prepared</th>
                    <th className="py-3 px-4">Served</th>
                    <th className="py-3 px-4">Leftovers</th>
                    <th className="py-3 px-4">Leftover %</th>
                    <th className="py-3 px-4">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-light">
                  <tr className="hover:bg-canvas/50">
                    <td className="py-3.5 px-4 font-bold text-ink">Breakfast</td>
                    <td className="py-3.5 px-4 font-semibold text-ink">182</td>
                    <td className="py-3.5 px-4 font-semibold text-ink">169</td>
                    <td className="py-3.5 px-4 font-semibold text-forest">13 portions</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-ink-secondary">7.1%</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-forest bg-sage border border-line-light px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={12} />
                        100% (No Shortage)
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-canvas/50">
                    <td className="py-3.5 px-4 font-bold text-ink">Lunch</td>
                    <td className="py-3.5 px-4 font-semibold text-ink">264</td>
                    <td className="py-3.5 px-4 font-semibold text-ink">249</td>
                    <td className="py-3.5 px-4 font-semibold text-forest">15 portions</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-ink-secondary">5.7%</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-forest bg-sage border border-line-light px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={12} />
                        100% (No Shortage)
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-canvas/50">
                    <td className="py-3.5 px-4 font-bold text-ink">Dinner</td>
                    <td className="py-3.5 px-4 font-semibold text-ink">215</td>
                    <td className="py-3.5 px-4 font-semibold text-ink">201</td>
                    <td className="py-3.5 px-4 font-semibold text-forest">14 portions</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-ink-secondary">6.5%</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-forest bg-sage border border-line-light px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={12} />
                        100% (No Shortage)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
