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
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-line-light shadow-sm flex flex-col justify-between">
      <div>
        {/* Table Top Header */}
        <div className="flex items-center justify-between pb-5 border-b border-line-light/70">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              Dish-wise Preparation Plan
            </h2>
            <p className="text-sm text-ink-secondary mt-1 font-medium">
              Targeted cooking portions calculated per menu dish
            </p>
          </div>

          <button
            onClick={onViewFullMenu}
            type="button"
            className="text-sm font-semibold text-forest hover:text-forest-dark flex items-center gap-2 transition-colors px-4 py-2 rounded-xl hover:bg-canvas border border-line-light/80"
          >
            <Utensils size={16} className="text-forest" />
            <span>View full menu</span>
          </button>
        </div>

        {/* Minimalist Data Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line-light/60 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                <th className="py-4 px-3 font-bold">Dish</th>
                <th className="py-4 px-4 font-bold">
                  <span className="inline-flex items-center gap-2">
                    Predicted Demand
                    <Info size={15} className="text-ink-secondary" />
                  </span>
                </th>
                <th className="py-4 px-4 font-bold">
                  <span className="inline-flex items-center gap-2">
                    Recommended Qty
                    <Info size={15} className="text-ink-secondary" />
                  </span>
                </th>
                <th className="py-4 px-4 font-bold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-light/50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-5 px-3">
                      <div className="space-y-2">
                        <div className="h-4 w-36 bg-line-light/70 rounded" />
                        <div className="h-3 w-20 bg-line-light/50 rounded" />
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="h-5 w-20 bg-line-light/60 rounded" />
                    </td>
                    <td className="py-5 px-4">
                      <div className="h-8 w-20 bg-line-light/70 rounded-xl" />
                    </td>
                    <td className="py-5 px-4">
                      <div className="h-4 w-48 bg-line-light/50 rounded" />
                    </td>
                  </tr>
                ))
              ) : (
                dishes.map((dish) => (
                  <tr
                    key={dish.id}
                    className="hover:bg-canvas/40 transition-colors group"
                  >
                    {/* Dish Name & Category - Minimalist Typography */}
                    <td className="py-5 px-3">
                      <div className="space-y-1">
                        <span className="font-extrabold text-base text-ink group-hover:text-forest transition-colors block">
                          {dish.name}
                        </span>
                        <span className="text-sm text-ink-secondary block font-medium">
                          {dish.category}
                        </span>
                      </div>
                    </td>

                    {/* Predicted Demand */}
                    <td className="py-5 px-4 font-bold text-base text-ink font-mono tabular-nums">
                      {dish.predictedDemand}{" "}
                      <span className="text-sm font-sans font-normal text-ink-secondary">
                        {dish.unit}
                      </span>
                    </td>

                    {/* Recommended Qty: Highlighted Card-Style Box */}
                    <td className="py-5 px-4">
                      <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-forest text-lime font-mono font-extrabold text-base shadow-sm w-20">
                        {dish.recommendedQty}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-5 px-4 text-sm font-normal text-ink-secondary leading-relaxed max-w-sm">
                      {dish.note}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


