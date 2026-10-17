'use client';

import React from 'react';
import {
  Coins,
  Scale,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';
import { AggregatedPeriodMetrics } from './analyticsCalculations';

interface KitchenImpactCardsProps {
  metrics: AggregatedPeriodMetrics;
  periodLabel: string;
}

export const KitchenImpactCards: React.FC<KitchenImpactCardsProps> = ({
  metrics,
  periodLabel,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Money Saved */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Total Money Saved ({periodLabel})
            </span>
            <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
              <Coins size={16} />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-ink mt-3">
            ₹{metrics.totalRupeesSaved.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
          <span className="text-forest font-bold flex items-center gap-1">
            <TrendingUp size={13} />
            ~{metrics.wasteReductionRate}% waste reduction
          </span>
          <span className="text-ink-secondary">
            {metrics.totalPortionsRescued.toLocaleString()} plates rescued
          </span>
        </div>
      </div>

      {/* 2. Food Rescued */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Food Prevented from Waste
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Scale size={16} />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-ink mt-3">
            {metrics.totalKgSaved.toLocaleString()} kg
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
          <span className="text-ink font-semibold">
            {metrics.totalPrepared.toLocaleString()} total plates cooked
          </span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <Sparkles size={12} />
            {metrics.totalCo2eSavedKg} kg CO₂ saved
          </span>
        </div>
      </div>

      {/* 3. Kitchen Accuracy */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Kitchen Reliability Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-lime/20 text-forest-dark flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-forest mt-3">
            {metrics.serviceAccuracyRate}%
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
          <span className="text-forest font-bold flex items-center gap-1">
            <CheckCircle2 size={13} />
            Zero student shortages
          </span>
          <span className="text-ink-secondary">
            {metrics.recordsCount} meal services tracked
          </span>
        </div>
      </div>
    </div>
  );
};
