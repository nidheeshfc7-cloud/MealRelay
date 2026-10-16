"use client";

import React from "react";
import { Info, Utensils } from "lucide-react";
import { DishItem } from "./types";

interface DishPreparationTableProps {
  dishes: DishItem[];
  onViewFullMenu?: () => void;
  isLoading?: boolean;
}

export const DishPreparationTable: React.FC<DishPreparationTableProps> = ({
  dishes,
  onViewFullMenu,
  isLoading = false,
}) => {
  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col justify-between">
      <div>
        {/* Table Top Header */}
        <div className="flex items-center justify-between pb-5 border-b border-line-light/60">
          <div>
            <h2 className="text-xl font-black text-ink tracking-tight">
              Dish-wise Preparation Plan
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Targeted cooking portions calculated per menu dish
            </p>
          </div>

          <button
            onClick={onViewFullMenu}
            type="button"
            className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-xl hover:bg-sage"
          >
            <Utensils size={14} className="text-forest" />
            <span>View full menu</span>
          </button>
        </div>

        {/* Minimalist Data Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line-light/60 text-[11px] font-black uppercase tracking-wider text-ink-secondary">
                <th className="py-4 px-2 font-black">Dish</th>
                <th className="py-4 px-4 font-black">
                  <span className="inline-flex items-center gap-1">
                    Predicted Demand
                    <Info size={12} className="text-ink-secondary/60" />
                  </span>
                </th>
                <th className="py-4 px-4 font-black">
                  <span className="inline-flex items-center gap-1">
                    Recommended Qty
                    <Info size={12} className="text-ink-secondary/60" />
                  </span>
                </th>
                <th className="py-4 px-4 font-black">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-light/50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-line-light/70 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-28 bg-line-light/70 rounded" />
                          <div className="h-3 w-16 bg-line-light/50 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-14 bg-line-light/60 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-8 w-16 bg-line-light/70 rounded-xl" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-40 bg-line-light/50 rounded" />
                    </td>
                  </tr>
                ))
              ) : (
                dishes.map((dish) => (
                <tr
                  key={dish.id}
                  className="hover:bg-canvas/40 transition-colors group"
                >
                  {/* Dish Name with Circular Thumbnail */}
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-lg shadow-inner shrink-0 ${dish.imageBg}`}
                        title={dish.name}
                      >
                        <span className="select-none">{dish.imageEmoji}</span>
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-ink group-hover:text-forest transition-colors block">
                          {dish.name}
                        </span>
                        <span className="text-[11px] text-ink-secondary block font-medium">
                          {dish.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Predicted Demand */}
                  <td className="py-4 px-4 font-bold text-sm text-ink-secondary">
                    {dish.predictedDemand}{" "}
                    <span className="text-xs font-normal text-ink-secondary/70">
                      {dish.unit}
                    </span>
                  </td>

                  {/* Recommended Qty: Highlighted Card-Style Box */}
                  <td className="py-4 px-4">
                    <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-forest text-lime font-black text-sm shadow-sm min-w-[68px]">
                      {dish.recommendedQty}
                    </div>
                  </td>

                  {/* Notes */}
                  <td className="py-4 px-4 text-xs font-medium text-ink-secondary leading-relaxed max-w-xs">
                    {dish.note}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
