'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CloudRain,
  Info,
  LineChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Utensils,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DemoBanner } from '@/components/DemoBanner';
import { DEFAULT_MEALS, estimateMealDemand, formatPortionNumber } from '@mealrelay/core';

export default function ForecastsPage() {
  const forecasts = DEFAULT_MEALS.map((service) =>
    estimateMealDemand([], service.key, '2026-10-18', 4.8)
  );

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <DemoBanner />

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <Header
            title="Demand Forecasting Engine"
            subtitle="Deterministic Kitchen Heuristics & Calibrated Attendance Projections"
            action={
              <Link
                href="/planner"
                className="px-4 py-2.5 rounded-xl bg-forest text-lime font-bold text-xs hover:bg-forest-dark transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Apply to Planner</span>
                <ArrowRight size={14} />
              </Link>
            }
          />

          {/* Statistical Transparency Notice */}
          <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-ink">Explainable Operations Engine</h3>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1 leading-relaxed">
                MealRelay uses transparent statistical methods (day-of-week moving averages, attendance velocity, and
                protective buffers) rather than black-box algorithms. Every portion recommendation can be traced to verifiable kitchen logs.
              </p>
            </div>
          </div>

          {/* Forecasting Factor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-forest-dark text-white border border-line-dark shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime">FACTOR 01</span>
                <Users size={16} className="text-white/60" />
              </div>
              <h4 className="text-lg font-black text-white">Headcount Velocity</h4>
              <p className="text-xs text-white/70 mt-1">
                Historical dining complex headcount derived from 14-day rolling campus attendance logs.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-forest-dark text-white border border-line-dark shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime">FACTOR 02</span>
                <CloudRain size={16} className="text-white/60" />
              </div>
              <h4 className="text-lg font-black text-white">Weather Adjustment</h4>
              <p className="text-xs text-white/70 mt-1">
                +2.0% attendance multiplier applied when outdoor dining options are limited by rainfall.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-forest-dark text-white border border-line-dark shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime">FACTOR 03</span>
                <Sparkles size={16} className="text-white/60" />
              </div>
              <h4 className="text-lg font-black text-white">Protective Buffer</h4>
              <p className="text-xs text-white/70 mt-1">
                Configurable safety margin (+4.8%) to guarantee zero tray exhaustion during peak rushes.
              </p>
            </div>
          </div>

          {/* Forecast Detail Tables */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-ink">Service-by-Service Forecast Analysis</h2>

            <div className="grid grid-cols-1 gap-4">
              {forecasts.map((f) => (
                <div
                  key={f.mealService}
                  className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm hover:border-forest/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-line-light">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-ink">{f.serviceName}</h3>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Confidence: {Math.round(f.confidenceScore * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-ink-secondary mt-1">{f.reasoning}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider block">RECOMMENDED PREP</span>
                      <span className="text-3xl font-black text-forest">{formatPortionNumber(f.suggestedPortions)}</span>
                      <span className="text-xs text-ink-secondary font-bold ml-1">servings</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-sm">
                    <div>
                      <span className="text-xs text-ink-secondary font-medium">Historical Baseline</span>
                      <p className="text-lg font-black text-ink mt-0.5">{f.baselinePortions} servings</p>
                    </div>
                    <div>
                      <span className="text-xs text-ink-secondary font-medium">Weather Multiplier</span>
                      <p className="text-lg font-black text-ink mt-0.5">{f.weatherFactor}x</p>
                    </div>
                    <div>
                      <span className="text-xs text-ink-secondary font-medium">Safety Buffer</span>
                      <p className="text-lg font-black text-forest mt-0.5">+{f.recommendedBufferPercent}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-ink-secondary font-medium">Buffer Servings</span>
                      <p className="text-lg font-black text-forest mt-0.5">
                        +{f.suggestedPortions - f.baselinePortions} servings
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
