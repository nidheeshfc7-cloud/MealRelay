"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader2, Sparkles, Utensils, X, AlertCircle } from "lucide-react";
import { DishItem, MealShiftKey } from "./types";
import { logMealRecord } from "@/lib/api";
import { normalizeToIsoDate } from "@/lib/hooks/useMealForecast";

interface LogOutcomesModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishes: DishItem[];
  date: string;
  shift: MealShiftKey;
  defaultAttendance?: number;
  onSuccess: (message: string) => void;
}

interface DishOutcomeInput {
  dishId: string;
  dishName: string;
  preparedPortions: number;
  servedPortions: number;
  leftoverPortions: number;
}

export const LogOutcomesModal: React.FC<LogOutcomesModalProps> = ({
  isOpen,
  onClose,
  dishes,
  date,
  shift,
  defaultAttendance = 185,
  onSuccess,
}) => {
  const [actualAttendance, setActualAttendance] = useState<number>(defaultAttendance);
  const [outcomes, setOutcomes] = useState<DishOutcomeInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize outcomes when dishes or isOpen changes
  useEffect(() => {
    if (!isOpen) return;

    setActualAttendance(defaultAttendance);
    setErrorMessage(null);

    const initialOutcomes: DishOutcomeInput[] = dishes.map((d) => {
      const prepared = d.recommendedQty;
      // Default plausible values: ~95% served, ~5% leftover
      const leftover = Math.max(0, Math.round(prepared * 0.05));
      const served = Math.max(0, prepared - leftover);
      return {
        dishId: d.id,
        dishName: d.name,
        preparedPortions: prepared,
        servedPortions: served,
        leftoverPortions: leftover,
      };
    });

    setOutcomes(initialOutcomes);
  }, [dishes, isOpen, defaultAttendance]);

  if (!isOpen) return null;

  const handlePortionChange = (
    dishId: string,
    field: "servedPortions" | "leftoverPortions",
    value: number
  ): void => {
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    setOutcomes((prev) =>
      prev.map((item) => {
        if (item.dishId !== dishId) return item;
        return {
          ...item,
          [field]: safeVal,
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const isoDate = normalizeToIsoDate(date);

    try {
      // Submit outcomes sequentially for each dish
      for (const item of outcomes) {
        await logMealRecord({
          dish_id: item.dishId,
          dish_name: item.dishName,
          meal_date: isoDate,
          meal_type: shift,
          attendance: actualAttendance,
          prepared_portions: item.preparedPortions,
          served_portions: item.servedPortions,
          leftover_portions: item.leftoverPortions,
        });
      }

      onSuccess(
        `Successfully logged outcomes for ${outcomes.length} dishes! ML models updated.`
      );
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit meal outcomes to the FastAPI backend.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-line-light space-y-5 animate-scaleUp max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line-light shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest text-lime flex items-center justify-center shrink-0">
              <Sparkles size={18} className="stroke-[2.3]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink">Log Shift Outcomes</h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Feed actual consumption numbers back into the Random Forest model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl bg-canvas hover:bg-line-light text-ink-secondary hover:text-ink transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert if Submission Fails */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Headcount Input */}
          <div className="p-4 rounded-2xl bg-canvas border border-line-light flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label htmlFor="actual-headcount" className="font-extrabold text-sm text-ink block">
                Actual Shift Attendance
              </label>
              <p className="text-xs text-ink-secondary mt-0.5">
                Total observed student turnout for {shift}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="actual-headcount"
                type="number"
                min="1"
                max="500"
                value={actualAttendance}
                onChange={(e) => setActualAttendance(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-24 px-3 py-2 rounded-xl bg-white border border-line-light text-ink font-black text-sm text-center focus:outline-none focus:border-forest"
                required
              />
              <span className="text-xs font-semibold text-ink-secondary">students</span>
            </div>
          </div>

          {/* Dish-by-dish Breakdown */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-ink-secondary">
              Dish Portions Consumed & Leftover
            </p>
            {outcomes.map((item) => {
              const matchingDish = dishes.find((d) => d.id === item.dishId);
              return (
                <div
                  key={item.dishId}
                  className="p-4 rounded-2xl bg-canvas border border-line-light space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                          matchingDish?.imageBg || "bg-white"
                        } shrink-0`}
                      >
                        {matchingDish?.imageEmoji || <Utensils size={14} />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-ink">{item.dishName}</h4>
                        <p className="text-[11px] text-ink-secondary">
                          Prepared: <span className="font-bold text-forest">{item.preparedPortions}</span> portions
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Served Portions */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-1">
                        Served Portions
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.servedPortions}
                        onChange={(e) =>
                          handlePortionChange(item.dishId, "servedPortions", parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-line-light text-ink font-bold text-xs focus:outline-none focus:border-forest"
                        required
                      />
                    </div>

                    {/* Leftover Portions */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-ink-secondary block mb-1">
                        Leftover Uneaten
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.leftoverPortions}
                        onChange={(e) =>
                          handlePortionChange(item.dishId, "leftoverPortions", parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-line-light text-ink font-bold text-xs focus:outline-none focus:border-forest"
                        required
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line-light shrink-0">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              type="button"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-ink-secondary hover:text-ink transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-forest text-lime hover:bg-forest-dark font-black text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin text-lime" />
                  <span>Logging to ML Model...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Submit Actuals to ML Model</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
