"use client";

import React, { useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { DishItem } from "./types";

interface EditQuantitiesModalProps {
  dishes: DishItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDishes: DishItem[]) => void;
}

export const EditQuantitiesModal: React.FC<EditQuantitiesModalProps> = ({
  dishes,
  isOpen,
  onClose,
  onSave,
}) => {
  const [draftDishes, setDraftDishes] = useState<DishItem[]>(dishes);

  // Sync draft whenever modal opens with fresh dishes
  React.useEffect(() => {
    setDraftDishes(dishes);
  }, [dishes, isOpen]);

  if (!isOpen) return null;

  const handleAdjust = (dishId: string, delta: number) => {
    setDraftDishes((prev) =>
      prev.map((d) => {
        if (d.id !== dishId) return d;
        const nextVal = Math.max(0, d.recommendedQty + delta);
        return {
          ...d,
          recommendedQty: nextVal,
        };
      })
    );
  };

  const handleSave = () => {
    onSave(draftDishes);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-line-light space-y-5 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-line-light">
          <div>
            <h2 className="text-xl font-black text-ink">Edit Cooking Portions</h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Customize recommended quantities for tomorrow&apos;s meal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-canvas hover:bg-line-light text-ink-secondary hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {draftDishes.map((dish) => (
            <div
              key={dish.id}
              className="p-3.5 rounded-2xl bg-canvas border border-line-light flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-base ${dish.imageBg} shrink-0`}
                >
                  {dish.imageEmoji}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">{dish.name}</h4>
                  <p className="text-xs text-ink-secondary">
                    Baseline: {dish.predictedDemand} {dish.unit}
                  </p>
                </div>
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-line-light shadow-sm">
                <button
                  onClick={() => handleAdjust(dish.id, -5)}
                  type="button"
                  className="w-8 h-8 rounded-lg bg-canvas hover:bg-line-light active:scale-90 text-ink flex items-center justify-center transition-all font-bold"
                >
                  <Minus size={14} />
                </button>
                <span className="font-black text-sm text-forest min-w-[36px] text-center px-1">
                  {dish.recommendedQty}
                </span>
                <button
                  onClick={() => handleAdjust(dish.id, 5)}
                  type="button"
                  className="w-8 h-8 rounded-lg bg-forest text-lime hover:bg-forest-dark active:scale-90 flex items-center justify-center transition-all font-bold"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-light">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-ink-secondary hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-forest text-lime hover:bg-forest-dark font-black text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Check size={14} />
            <span>Save Quantities</span>
          </button>
        </div>
      </div>
    </div>
  );
};
