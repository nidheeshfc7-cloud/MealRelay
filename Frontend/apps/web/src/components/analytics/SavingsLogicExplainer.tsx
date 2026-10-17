'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  TrendingDown,
  ShieldCheck,
  Coins,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const SavingsLogicExplainer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="rounded-3xl bg-white border border-line-light shadow-xs overflow-hidden transition-all">
      {/* Top Header Toggle */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-canvas/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
            <HelpCircle size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-ink">
                How come there are leftovers, but you still saved money?
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-lime text-forest-dark hidden sm:inline-block">
                Simple Explanation
              </span>
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">
              Click to understand how MealRelay calculates your kitchen savings without any confusing math.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-forest shrink-0 ml-3">
          <span>{isExpanded ? 'Hide' : 'Explain'}</span>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Expanded 3-Step Plain English Cards */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-line-light/60 bg-canvas/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3">
            {/* Step 1: The Old Way */}
            <div className="p-4 rounded-2xl bg-white border border-line-light space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                  1. Without AI (Past)
                </span>
                <span className="text-xs font-bold text-ink-secondary">~14% Waste</span>
              </div>
              <h5 className="font-extrabold text-xs text-ink">Blind Overcooking</h5>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                To avoid running short, traditional kitchens guess and overcook by <strong>14% to 15%</strong>. On 200 plates, that meant <strong>28 plates dumped straight into the bin</strong> every single meal.
              </p>
            </div>

            {/* Step 2: The MealRelay Way */}
            <div className="p-4 rounded-2xl bg-white border border-line-light space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-forest bg-sage px-2 py-0.5 rounded-md">
                  2. With MealRelay
                </span>
                <span className="text-xs font-bold text-forest">~4% Buffer</span>
              </div>
              <h5 className="font-extrabold text-xs text-ink">Smart Safety Cushion</h5>
              <p className="text-[11px] text-ink-secondary leading-relaxed">
                MealRelay predicts exact student turnout and keeps a <strong>lean safety cushion of 6–8 plates</strong>. Having a few leftovers guarantees no student ever leaves hungry.
              </p>
            </div>

            {/* Step 3: Where the Money Comes From */}
            <div className="p-4 rounded-2xl bg-forest text-white space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-forest-dark bg-lime px-2 py-0.5 rounded-md">
                  3. Your Savings
                </span>
                <Coins size={14} className="text-lime" />
              </div>
              <h5 className="font-extrabold text-xs text-white">Direct Money Kept</h5>
              <p className="text-[11px] text-white/80 leading-relaxed">
                You avoided buying and cooking the <strong>20 extra plates</strong> that used to go in the trash bin. That is ₹1,000 kept directly in your kitchen budget!
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-[11px] text-ink-secondary">
            <span>
              💡 <strong>Key Takeaway:</strong> Small leftovers (3–5%) are intentional safety buffers. Your savings come from the food you <em>didn’t throw away</em>.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
