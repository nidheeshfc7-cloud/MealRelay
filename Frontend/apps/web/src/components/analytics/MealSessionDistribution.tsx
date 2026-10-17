'use client';

import React from 'react';
import {
  Sun,
  Utensils,
  Moon,
  Coins,
  Scale,
  Sparkles,
} from 'lucide-react';
import { MealSessionSummary, CategorySummary } from './analyticsCalculations';

interface MealSessionDistributionProps {
  sessions: MealSessionSummary[];
  categories: CategorySummary[];
}

export const MealSessionDistribution: React.FC<MealSessionDistributionProps> = ({
  sessions,
  categories,
}) => {
  const sessionIcons = {
    breakfast: Sun,
    lunch: Utensils,
    dinner: Moon,
  };

  const topCategories = categories.slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Savings by Meal Shift */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-forest">
            SHIFT PERFORMANCE
          </span>
          <h3 className="text-lg font-black text-ink mt-0.5">
            Savings by Meal Service
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Comparing Breakfast, Lunch, and Dinner performance this month.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {sessions.map((s) => {
            const IconComponent = sessionIcons[s.session] || Utensils;

            return (
              <div
                key={s.session}
                className="p-4 rounded-2xl bg-canvas border border-line-light flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-line-light flex items-center justify-center text-forest shadow-xs">
                    <IconComponent size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ink">{s.name}</h4>
                    <p className="text-[11px] text-ink-secondary">{s.timeRange}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-forest text-sm">
                    ₹{s.rupeesSaved.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-ink-secondary">
                    {s.portionsRescued.toLocaleString()} plates saved ({s.leftoverPercent}% waste)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Top Saving Food Categories */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-forest">
            MENU EFFICIENCY
          </span>
          <h3 className="text-lg font-black text-ink mt-0.5">
            Highest Saving Food Categories
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Where precise portion calibration saved the most kitchen budget.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {topCategories.map((cat, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-canvas border border-line-light flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-forest text-lime text-xs font-black flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-xs text-ink">{cat.label}</h4>
                  <p className="text-[10px] text-ink-secondary">
                    {cat.kgSaved.toFixed(1)} kg food waste avoided
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-black text-xs text-ink">
                  ₹{cat.rupeesSaved.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-forest font-semibold">
                  {cat.portionsRescued} plates saved
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
