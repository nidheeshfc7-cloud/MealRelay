'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  Sparkles,
  Sun,
  Utensils,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DemoBanner } from '@/components/DemoBanner';
import {
  DEFAULT_MEALS,
  INITIAL_PORTIONS,
  adjustPortionQuantity,
  calculateTotalPortions,
  formatPortionNumber,
} from '@mealrelay/core';

export default function PlannerPage() {
  const [counts, setCounts] = useState(INITIAL_PORTIONS);
  const [approved, setApproved] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const total = calculateTotalPortions(counts);

  const updateQuantity = (key: keyof typeof counts, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: adjustPortionQuantity(prev[key], delta),
    }));
    setApproved(false);
  };

  const handleApprove = () => {
    setApproved(true);
    setNotification('Preparation plan approved! Quantities are synchronized locally for this demo session.');
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleReset = () => {
    setCounts(INITIAL_PORTIONS);
    setApproved(false);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <DemoBanner />

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <Header
            title="Meal Preparation Planner"
            subtitle="Sunday, 18 October 2026 · Operations Work Order"
            action={
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-line-light bg-white hover:bg-slate-50 text-ink text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Reset to Recommendations</span>
              </button>
            }
          />

          {notification && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>{notification}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Operational Banner */}
          <div className="p-6 rounded-3xl bg-forest-dark text-white border border-line-dark flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lime text-forest-dark flex items-center justify-center font-black">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Your Kitchen. Your Decisions.</h3>
                <p className="text-xs sm:text-sm text-white/70 mt-0.5">
                  Adjust portions in increments of 5 before confirming tomorrow's production run.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white/60">Buffer:</span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-lime/20 text-lime border border-lime/30">
                +4.8% Protective Tolerance
              </span>
            </div>
          </div>

          {/* Service Cards */}
          <div className="space-y-4">
            {DEFAULT_MEALS.map((meal) => {
              const Icon = meal.key === 'breakfast' ? Sun : meal.key === 'lunch' ? Utensils : Moon;
              const currentVal = counts[meal.key];
              const delta = currentVal - meal.base;

              return (
                <div
                  key={meal.key}
                  className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-forest/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center text-forest">
                      <Icon size={26} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-ink">{meal.name}</h3>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-lime/30 text-forest border border-lime/40 uppercase">
                          SUGGESTED
                        </span>
                      </div>
                      <p className="text-xs text-ink-secondary mt-1">{meal.period} · Standard Student Service</p>
                      <p className="text-[11px] text-ink-secondary mt-1">
                        Statistical Baseline: {meal.base} servings · {delta === 0 ? 'Exact recommendation' : `${delta > 0 ? `+${delta}` : delta} manual adjustment`}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Adjustment Controls */}
                  <div className="flex items-center gap-6 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold uppercase text-ink-secondary tracking-widest block">
                        PREPARE
                      </span>
                      <span className="text-4xl font-black text-ink tracking-tight">
                        {formatPortionNumber(currentVal)}
                      </span>
                      <span className="text-xs text-ink-secondary font-bold block">servings</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(meal.key, -5)}
                        className="w-11 h-11 rounded-xl border border-line-light bg-canvas hover:bg-slate-200 text-ink flex items-center justify-center transition-all active:scale-95 shadow-sm"
                        aria-label={`Decrease ${meal.name} portions by 5`}
                      >
                        <Minus size={18} />
                      </button>
                      <button
                        onClick={() => updateQuantity(meal.key, 5)}
                        className="w-11 h-11 rounded-xl bg-forest hover:bg-forest-dark text-lime flex items-center justify-center transition-all active:scale-95 shadow-sm"
                        aria-label={`Increase ${meal.name} portions by 5`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Preparation Summary & Approval Card */}
          <div className="rounded-3xl bg-forest p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-line-dark">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-lime">
                TOTAL PLANNED PREPARATION
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-black text-white">{formatPortionNumber(total)}</span>
                <span className="text-white/70 text-lg font-bold">servings across all services</span>
              </div>
              <p className="text-xs text-white/60 mt-1">
                Demo values only. No live external kitchen ERP connected.
              </p>
            </div>

            <button
              onClick={handleApprove}
              className={`py-4 px-8 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                approved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-lime text-forest-dark hover:bg-lime-soft'
              }`}
            >
              <CheckCircle2 size={18} />
              <span>{approved ? 'Plan Approved ✓' : 'Approve Preparation Plan'}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
