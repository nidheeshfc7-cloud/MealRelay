'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Leaf,
  Moon,
  Sparkles,
  Sun,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  DEFAULT_MEALS,
  INITIAL_PORTIONS,
  SAMPLE_METRICS,
  calculateTotalPortions,
  formatPortionNumber,
} from '@mealrelay/core';

export default function DashboardPage() {
  const [counts, setCounts] = useState(INITIAL_PORTIONS);
  const [approved, setApproved] = useState(false);

  const total = calculateTotalPortions(counts);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <Header
            title="Kitchen Operations Overview"
            subtitle="Campus Central Dining Complex A · Live Preparation Status"
            action={
              <Link
                href="/planner"
                className="px-4 py-2.5 rounded-xl bg-forest text-lime font-bold text-xs hover:bg-forest-dark transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Edit Preparation Quantities</span>
                <ArrowRight size={14} />
              </Link>
            }
          />

          {/* Tomorrow's Plan Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-forest via-forest to-forest-dark p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-line-dark">
            <div className="absolute right-0 top-0 w-96 h-96 bg-lime/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/10">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-lime">
                  TOMORROW'S TARGET WORK ORDER
                </span>
                <p className="text-sm text-white/70 mt-0.5">Sunday, 18 October 2026</p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5 ${
                    approved
                      ? 'bg-lime text-forest-dark border border-lime'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  <span>{approved ? 'PLAN APPROVED ✓' : 'AWAITING FINAL APPROVAL'}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end pt-8">
              <div className="md:col-span-7">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Total Scheduled Production</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">{formatPortionNumber(total)}</span>
                  <span className="text-lime text-xl font-bold">portions</span>
                </div>
                <p className="text-sm text-white/70 mt-2">
                  Calibrated across 3 shifts with +4.8% safety buffer to eliminate student shortage risk.
                </p>
              </div>

              <div className="md:col-span-5 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/planner"
                  className="flex-1 py-4 px-6 rounded-2xl bg-lime text-forest-dark font-black text-sm hover:bg-lime-soft transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>{approved ? 'Review Approved Plan' : 'Review & Approve Plan'}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-white/10 text-center sm:text-left">
              <div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">MEAL SERVICES</p>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">3 Shifts</p>
              </div>
              <div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">PROTECTIVE BUFFER</p>
                <p className="text-xl sm:text-2xl font-black text-lime mt-1">+4.8%</p>
              </div>
              <div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">PRODUCTION STATUS</p>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">Ready for Prep</p>
              </div>
            </div>
          </div>

          {/* Meal by Meal Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-forest uppercase tracking-widest">MEAL-BY-MEAL SCHEDULE</p>
                <h2 className="text-xl font-black text-ink">Service Quantities Breakdown</h2>
              </div>
              <Link href="/planner" className="text-xs font-bold text-forest hover:underline flex items-center gap-1">
                <span>Open in planner</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEFAULT_MEALS.map((meal) => {
                const Icon = meal.key === 'breakfast' ? Sun : meal.key === 'lunch' ? Utensils : Moon;
                return (
                  <div
                    key={meal.key}
                    className="p-6 rounded-3xl bg-white border border-line-light shadow-sm hover:border-forest/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-forest">
                          <Icon size={20} />
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-canvas text-ink-secondary">
                          {meal.period}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-ink">{meal.name}</h3>
                      <p className="text-xs text-ink-secondary mt-0.5">Campus Dining Hall East</p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-line-light flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-ink-secondary uppercase font-bold tracking-wider">TARGET</p>
                        <p className="text-3xl font-black text-ink tracking-tight">{formatPortionNumber(counts[meal.key])}</p>
                      </div>
                      <span className="text-xs font-bold text-ink-secondary">servings</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Service Accuracy</span>
                <span className="p-2 rounded-xl bg-sage text-forest">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <p className="text-3xl font-black text-ink">{SAMPLE_METRICS.serviceRate}%</p>
              <p className="text-xs text-ink-secondary mt-1">Institutional meal fulfillment benchmark</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Food Waste Avoided</span>
                <span className="p-2 rounded-xl bg-lime/20 text-forest">
                  <Leaf size={16} />
                </span>
              </div>
              <p className="text-3xl font-black text-forest">~{SAMPLE_METRICS.wasteReductionPercent}%</p>
              <p className="text-xs text-ink-secondary mt-1">Equivalent to ~42.5 kg saved per service cycle</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Yesterday Leftovers</span>
                <span className="p-2 rounded-xl bg-canvas border border-line-light text-ink-secondary">
                  <TrendingUp size={16} />
                </span>
              </div>
              <p className="text-3xl font-black text-ink">{SAMPLE_METRICS.leftoverPortionsToday}</p>
              <p className="text-xs text-ink-secondary mt-1">Unserved portions redirected or safely stored</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
