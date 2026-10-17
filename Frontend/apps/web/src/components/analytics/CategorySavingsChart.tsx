'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Coins,
  Scale,
  PieChart,
  ArrowUpRight,
} from 'lucide-react';
import { CategorySummary } from './analyticsCalculations';

interface CategorySavingsChartProps {
  categories: CategorySummary[];
}

export const CategorySavingsChart: React.FC<CategorySavingsChartProps> = ({
  categories,
}) => {
  const [activeTab, setActiveTab] = useState<'rupees' | 'portions'>('rupees');

  if (categories.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm text-center py-12">
        <p className="text-xs font-semibold text-ink-secondary">
          No category breakdowns available for this selection.
        </p>
      </div>
    );
  }

  const maxRupees = Math.max(1, ...categories.map((c) => c.rupeesSaved));
  const maxPortions = Math.max(1, ...categories.map((c) => c.portionsRescued));

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-forest">
            CATEGORY DISTRIBUTION
          </span>
          <h3 className="text-lg font-black text-ink mt-0.5">
            Food & Cost Savings by Dish Type
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Breakdown showing where AI optimization eliminated the most over-preparation.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 rounded-2xl bg-canvas border border-line-light self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('rupees')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rupees'
                ? 'bg-forest text-lime shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            By ₹ Savings
          </button>
          <button
            onClick={() => setActiveTab('portions')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'portions'
                ? 'bg-forest text-lime shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            By Servings
          </button>
        </div>
      </div>

      {/* Category Horizontal Bars */}
      <div className="space-y-4 pt-2">
        {categories.map((cat, idx) => {
          const val = activeTab === 'rupees' ? cat.rupeesSaved : cat.portionsRescued;
          const maxVal = activeTab === 'rupees' ? maxRupees : maxPortions;
          const barWidthPercent = Math.max(8, Math.round((val / maxVal) * 100));

          return (
            <div key={idx} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink group-hover:text-forest transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-forest inline-block" />
                  {cat.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-ink-secondary">
                    {cat.kgSaved.toFixed(1)} kg saved ({cat.leftoverPercent}% leftover rate)
                  </span>
                  <strong className="text-forest font-black">
                    {activeTab === 'rupees'
                      ? `₹${cat.rupeesSaved.toLocaleString('en-IN')}`
                      : `${cat.portionsRescued.toLocaleString()} servings`}
                  </strong>
                </div>
              </div>

              {/* Bar track */}
              <div className="w-full h-3 rounded-full bg-canvas border border-line-light overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-forest to-forest-light group-hover:from-forest-mid group-hover:to-forest transition-all duration-500"
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Insight */}
      <div className="pt-4 border-t border-line-light flex items-center justify-between text-xs text-ink-secondary">
        <span>High-cost curries and proteins generate the largest financial recovery.</span>
        <span className="font-bold text-forest">
          {categories.reduce((acc, c) => acc + c.portionsRescued, 0).toLocaleString()} total portions saved
        </span>
      </div>
    </div>
  );
};
