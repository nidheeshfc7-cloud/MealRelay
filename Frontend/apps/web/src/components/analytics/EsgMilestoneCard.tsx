'use client';

import React from 'react';
import {
  Leaf,
  Droplets,
  Trees,
  Flame,
  Target,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';
import { EsgImpactMetrics } from './analyticsCalculations';

interface EsgMilestoneCardProps {
  esgMetrics: EsgImpactMetrics;
  monthLabel: string;
}

export const EsgMilestoneCard: React.FC<EsgMilestoneCardProps> = ({
  esgMetrics,
  monthLabel,
}) => {
  const {
    treeYearsEquivalent,
    waterSavedLiters,
    methaneAvoidedKg,
    mealsDonatedEquivalent,
    targetProgressPercent,
    targetMonthlyRupees,
  } = esgMetrics;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-forest text-white border border-line-dark shadow-sm space-y-6 relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-lime/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Monthly Goal Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-lime">
              SUSTAINABILITY & ESG IMPACT
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-white border border-white/10">
              {monthLabel}
            </span>
          </div>
          <h3 className="text-xl font-black text-white mt-1">
            Institutional Zero-Waste Performance
          </h3>
          <p className="text-xs text-white/75 mt-1">
            Quantifying environmental dividends achieved by eliminating excess cafeteria work orders.
          </p>
        </div>

        {/* Progress Toward Monthly Target */}
        <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-3.5">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/20"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * targetProgressPercent) / 100}
                className="text-lime transition-all duration-1000"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-white">
              {targetProgressPercent}%
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-lime">
              <Target size={13} />
              <span>Goal: ₹{(targetMonthlyRupees / 1000).toFixed(0)}k/mo</span>
            </div>
            <p className="text-[11px] text-white/70 mt-0.5">
              Waste Cost Recovered
            </p>
          </div>
        </div>
      </div>

      {/* 4 Impact Pillars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {/* 1. Trees Equivalent */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-lime/20 text-lime flex items-center justify-center mb-2">
            <Trees size={16} />
          </div>
          <p className="text-2xl font-black text-white">
            {treeYearsEquivalent}
          </p>
          <p className="text-xs font-bold text-white/90 mt-1">
            Tree-Years Absorbed
          </p>
          <p className="text-[10px] text-white/60 mt-0.5">
            Equivalent annual carbon capture
          </p>
        </div>

        {/* 2. Water Saved */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center mb-2">
            <Droplets size={16} />
          </div>
          <p className="text-2xl font-black text-white">
            {Math.round(waterSavedLiters / 1000)}k L
          </p>
          <p className="text-xs font-bold text-white/90 mt-1">
            Virtual Water Preserved
          </p>
          <p className="text-[10px] text-white/60 mt-0.5">
            Crop irrigation footprint avoided
          </p>
        </div>

        {/* 3. Methane Avoided */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-2">
            <Flame size={16} />
          </div>
          <p className="text-2xl font-black text-white">
            {methaneAvoidedKg} kg
          </p>
          <p className="text-xs font-bold text-white/90 mt-1">
            Landfill Methane Diverted
          </p>
          <p className="text-[10px] text-white/60 mt-0.5">
            Anaerobic decay gas eliminated
          </p>
        </div>

        {/* 4. Meals Rescued */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-2">
            <HeartHandshake size={16} />
          </div>
          <p className="text-2xl font-black text-white">
            {mealsDonatedEquivalent.toLocaleString()}
          </p>
          <p className="text-xs font-bold text-white/90 mt-1">
            Edible Servings Rescued
          </p>
          <p className="text-[10px] text-white/60 mt-0.5">
            Nutritious food preserved
          </p>
        </div>
      </div>
    </div>
  );
};
