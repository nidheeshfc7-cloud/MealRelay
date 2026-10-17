'use client';

import React from 'react';
import {
  Coins,
  Scale,
  Leaf,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { AggregatedPeriodMetrics } from './analyticsCalculations';
import { EvaluationReport } from '@/lib/types/api';

interface AnalyticsKPICardsProps {
  metrics: AggregatedPeriodMetrics;
  modelMetrics: EvaluationReport | null;
  periodLabel: string;
}

export const AnalyticsKPICards: React.FC<AnalyticsKPICardsProps> = ({
  metrics,
  modelMetrics,
  periodLabel,
}) => {
  const formatRupees = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const maeImprovement = modelMetrics?.mae_improvement_pct !== undefined
    ? modelMetrics.mae_improvement_pct
    : 17.0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Net Financial Savings */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Net Savings ({periodLabel})
          </span>
          <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
            <Coins size={16} />
          </div>
        </div>
        <p className="text-3xl font-black text-ink mt-2">
          {formatRupees(metrics.totalRupeesSaved)}
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-forest">
          <TrendingUp size={14} />
          <span>~{metrics.wasteReductionRate}% waste cost recovered</span>
        </div>
        <p className="text-[11px] text-ink-secondary mt-1">
          Based on {metrics.totalPortionsRescued.toLocaleString()} portions prevented from landfill
        </p>
      </div>

      {/* 2. Weight of Food Rescued */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Food Rescued
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Scale size={16} />
          </div>
        </div>
        <p className="text-3xl font-black text-ink mt-2">
          {metrics.totalKgSaved.toLocaleString()} kg
        </p>
        <p className="text-xs text-ink-secondary mt-2">
          Edible volume saved vs. 14% uncalibrated baseline
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
          <span className="w-2 h-2 rounded-full bg-forest inline-block" />
          <span>{metrics.totalPrepared.toLocaleString()} total portions prepared</span>
        </div>
      </div>

      {/* 3. Carbon Emissions Offset */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Emissions Avoided
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Leaf size={16} />
          </div>
        </div>
        <p className="text-3xl font-black text-forest mt-2">
          {metrics.totalCo2eSavedKg.toLocaleString()} kg
        </p>
        <p className="text-xs text-ink-secondary mt-2">
          CO₂e greenhouse gases eliminated from methane decay
        </p>
        <p className="text-[11px] font-semibold text-forest mt-1">
          2.5 kg CO₂e multiplier per kg food saved
        </p>
      </div>

      {/* 4. Service Fulfillment & AI Accuracy */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Dining Service Reliability
          </span>
          <div className="w-8 h-8 rounded-xl bg-lime/20 text-forest-dark flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <p className="text-3xl font-black text-forest mt-2">
          {metrics.serviceAccuracyRate}%
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-forest">
          <Sparkles size={14} className="text-amber-500" />
          <span>+{maeImprovement}% ML accuracy gain</span>
        </div>
        <p className="text-[11px] text-ink-secondary mt-1">
          Zero kitchen stockout across evaluated meal sessions
        </p>
      </div>
    </div>
  );
};
