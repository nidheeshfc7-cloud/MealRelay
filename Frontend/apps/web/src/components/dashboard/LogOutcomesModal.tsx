"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  Loader2,
  Sparkles,
  Utensils,
  X,
  AlertCircle,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Clock,
  Info,
} from "lucide-react";
import { DishItem, MealShiftKey } from "./types";
import { fetchDishesCatalog, logMealRecord, logMealRecordsBatch } from "@/lib/api";
import { DishCatalogItem, MealRecordCreate } from "@/lib/types/api";
import { clearForecastCache, normalizeToIsoDate } from "@/lib/hooks/useMealForecast";


interface LogOutcomesModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishes: DishItem[];
  date: string;
  shift: MealShiftKey;
  defaultAttendance?: number;
  onSuccess: (message: string) => void;
}

interface BatchDishInput {
  dishId: string;
  dishName: string;
  category?: string;
  included: boolean;
  preparedPortions: number;
  servedPortions: number;
  isServedUnmeasured: boolean;
  leftoverPortions: number;
}

interface DishValidation {
  isValid: boolean;
  errorMessage?: string;
}

const validateDishOutcome = (
  prepared: number,
  served: number | null,
  leftover: number | null,
  attendance: number
): DishValidation => {
  if (prepared < 0) {
    return { isValid: false, errorMessage: "Prepared portions cannot be negative." };
  }

  if (leftover !== null && leftover > prepared) {
    return {
      isValid: false,
      errorMessage: `Leftover uneaten (${leftover}) cannot exceed prepared (${prepared}).`,
    };
  }

  if (served !== null && served > prepared) {
    return {
      isValid: false,
      errorMessage: `Served count (${served}) cannot exceed prepared (${prepared}).`,
    };
  }

  if (served !== null && leftover !== null && served + leftover > prepared) {
    return {
      isValid: false,
      errorMessage: `Sum of served (${served}) + leftover (${leftover}) exceeds prepared portions (${prepared}).`,
    };
  }

  if (attendance > 0 && served !== null && served > attendance * 5) {
    return {
      isValid: false,
      errorMessage: `Served count (${served}) is unrealistically high for ${attendance} attendees (5x max).`,
    };
  }

  return { isValid: true };
};

export const LogOutcomesModal: React.FC<LogOutcomesModalProps> = ({
  isOpen,
  onClose,
  dishes,
  date,
  shift,
  defaultAttendance = 185,
  onSuccess,
}) => {
  const [modalMode, setModalMode] = useState<"batch" | "single">("batch");
  const [actualAttendance, setActualAttendance] = useState<number>(defaultAttendance);
  const [batchOutcomes, setBatchOutcomes] = useState<BatchDishInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Single Record Mode States
  const [catalogDishes, setCatalogDishes] = useState<DishCatalogItem[]>([]);
  const [singleDishId, setSingleDishId] = useState<string>("");
  const [singleDate, setSingleDate] = useState<string>(normalizeToIsoDate(date));
  const [singleShift, setSingleShift] = useState<MealShiftKey>(shift);
  const [singleAttendance, setSingleAttendance] = useState<number>(defaultAttendance);
  const [singlePrepared, setSinglePrepared] = useState<number>(150);
  const [singleServed, setSingleServed] = useState<number>(140);
  const [singleServedUnmeasured, setSingleServedUnmeasured] = useState<boolean>(false);
  const [singleLeftover, setSingleLeftover] = useState<number>(10);

  // Fetch full dish catalog to support selecting dishes across all meal shifts
  useEffect(() => {
    if (!isOpen) return;
    fetchDishesCatalog()
      .then((cat) => {
        if (Array.isArray(cat) && cat.length > 0) {
          setCatalogDishes(cat);
        }
      })
      .catch(() => {
        // Fallback to active dishes if backend is offline
      });
  }, [isOpen]);

  // Derived single dishes matching the selected shift
  const availableSingleDishes = useMemo(() => {
    if (catalogDishes.length > 0) {
      const filtered = catalogDishes.filter(
        (d) => d.meal_type.toLowerCase() === singleShift.toLowerCase()
      );
      if (filtered.length > 0) return filtered;
    }
    return dishes.map((d) => ({
      id: d.id,
      name: d.name,
      meal_type: shift,
      category: d.category as any,
    }));
  }, [catalogDishes, singleShift, dishes, shift]);

  // Sync single dish ID when shift or available dishes change
  useEffect(() => {
    if (availableSingleDishes.length > 0) {
      const exists = availableSingleDishes.some((d) => d.id === singleDishId);
      if (!exists) {
        const first = availableSingleDishes[0];
        setSingleDishId(first.id);
        const matchingDish = dishes.find((d) => d.id === first.id);
        if (matchingDish) {
          setSinglePrepared(matchingDish.recommendedQty);
          setSingleLeftover(Math.max(0, Math.round(matchingDish.recommendedQty * 0.05)));
          setSingleServed(Math.max(0, matchingDish.recommendedQty - Math.round(matchingDish.recommendedQty * 0.05)));
        }
      }
    }
  }, [availableSingleDishes, singleDishId, dishes]);

  // Initialize batch inputs when dishes, isOpen, or shift changes
  useEffect(() => {
    if (!isOpen) return;

    setActualAttendance(defaultAttendance);
    setErrorMessage(null);
    setSingleDate(normalizeToIsoDate(date));
    setSingleShift(shift);
    setSingleAttendance(defaultAttendance);

    const initialBatch: BatchDishInput[] = dishes.map((d) => {
      const prepared = d.recommendedQty;
      const leftover = Math.max(0, Math.round(prepared * 0.05));
      const served = Math.max(0, prepared - leftover);
      return {
        dishId: d.id,
        dishName: d.name,
        category: d.category,
        included: true,
        preparedPortions: prepared,
        servedPortions: served,
        isServedUnmeasured: false,
        leftoverPortions: leftover,
      };
    });

    setBatchOutcomes(initialBatch);

    if (dishes.length > 0) {
      setSingleDishId(dishes[0].id);
      setSinglePrepared(dishes[0].recommendedQty);
      setSingleLeftover(Math.max(0, Math.round(dishes[0].recommendedQty * 0.05)));
      setSingleServed(Math.max(0, dishes[0].recommendedQty - Math.round(dishes[0].recommendedQty * 0.05)));
    }
  }, [dishes, isOpen, defaultAttendance, date, shift]);


  // Validation checks for all active batch dishes
  const batchValidations = useMemo<Record<string, DishValidation>>(() => {
    const results: Record<string, DishValidation> = {};
    for (const item of batchOutcomes) {
      if (!item.included) {
        results[item.dishId] = { isValid: true };
        continue;
      }
      const servedVal = item.isServedUnmeasured ? null : item.servedPortions;
      results[item.dishId] = validateDishOutcome(
        item.preparedPortions,
        servedVal,
        item.leftoverPortions,
        actualAttendance
      );
    }
    return results;
  }, [batchOutcomes, actualAttendance]);

  const hasBatchValidationError = useMemo<boolean>(() => {
    return Object.values(batchValidations).some((v) => !v.isValid);
  }, [batchValidations]);

  const singleValidation = useMemo<DishValidation>(() => {
    const servedVal = singleServedUnmeasured ? null : singleServed;
    return validateDishOutcome(
      singlePrepared,
      servedVal,
      singleLeftover,
      singleAttendance
    );
  }, [singlePrepared, singleServed, singleServedUnmeasured, singleLeftover, singleAttendance]);

  if (!isOpen) return null;

  const handleBatchItemToggle = (dishId: string): void => {
    setBatchOutcomes((prev) =>
      prev.map((item) =>
        item.dishId === dishId ? { ...item, included: !item.included } : item
      )
    );
  };

  const handleBatchFieldChange = (
    dishId: string,
    field: "preparedPortions" | "servedPortions" | "leftoverPortions",
    value: number
  ): void => {
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    setBatchOutcomes((prev) =>
      prev.map((item) => {
        if (item.dishId !== dishId) return item;
        return {
          ...item,
          [field]: safeVal,
        };
      })
    );
  };

  const handleBatchUnmeasuredToggle = (dishId: string): void => {
    setBatchOutcomes((prev) =>
      prev.map((item) => {
        if (item.dishId !== dishId) return item;
        return {
          ...item,
          isServedUnmeasured: !item.isServedUnmeasured,
        };
      })
    );
  };

  // Submit entire shift batch atomically via POST /api/records/batch
  const handleBatchSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);

    const includedItems = batchOutcomes.filter((item) => item.included);
    if (includedItems.length === 0) {
      setErrorMessage("Please select at least one dish to submit in this batch.");
      return;
    }

    if (hasBatchValidationError) {
      setErrorMessage("Please resolve the portion quantity warnings before submitting.");
      return;
    }

    setIsSubmitting(true);
    const isoDate = normalizeToIsoDate(date);

    try {
      const recordsPayload: MealRecordCreate[] = includedItems.map((item) => ({
        dish_id: item.dishId,
        dish_name: item.dishName,
        meal_date: isoDate,
        meal_type: shift,
        attendance: actualAttendance,
        prepared_portions: item.preparedPortions,
        served_portions: item.isServedUnmeasured ? null : item.servedPortions,
        leftover_portions: item.leftoverPortions,
        category: item.category || "main",
        is_synthetic: false,
      }));

      await logMealRecordsBatch(recordsPayload);
      clearForecastCache();

      onSuccess(
        `Batch saved! ${recordsPayload.length} dishes logged. ML model retrained with 3.0× priority sample weighting.`
      );
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit batch records to the FastAPI forecasting backend.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit single dish record via POST /api/records
  const handleSingleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);

    if (!singleDishId) {
      setErrorMessage("Please select a dish to record.");
      return;
    }

    if (!singleValidation.isValid) {
      setErrorMessage(singleValidation.errorMessage || "Invalid portion quantities.");
      return;
    }

    setIsSubmitting(true);
    const selectedDishObj =
      dishes.find((d) => d.id === singleDishId) ||
      catalogDishes.find((d) => d.id === singleDishId);


    try {
      const singlePayload: MealRecordCreate = {
        dish_id: singleDishId,
        dish_name: selectedDishObj?.name || singleDishId,
        meal_date: normalizeToIsoDate(singleDate),
        meal_type: singleShift,
        attendance: singleAttendance,
        prepared_portions: singlePrepared,
        served_portions: singleServedUnmeasured ? null : singleServed,
        leftover_portions: singleLeftover,
        category: selectedDishObj?.category || "main",
        is_synthetic: false,
      };

      await logMealRecord(singlePayload);
      clearForecastCache();

      onSuccess(
        `Recorded ${singlePayload.dish_name}! ML models immediately retrained with updated consumption patterns.`
      );
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit single record to the FastAPI backend.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const includedDishesCount = batchOutcomes.filter((i) => i.included).length;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-line-light space-y-4 animate-scaleUp max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mode Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-line-light shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest text-lime flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-xl font-black text-ink tracking-tight">Record Meal Outcomes</h2>
              <p className="text-xs sm:text-sm text-ink-secondary">
                Direct feedback loop into Random Forest continuous learning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl bg-canvas hover:bg-line-light text-ink-secondary hover:text-ink transition-colors disabled:opacity-50"
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Continuous Learning Operational Notice */}
        <div className="p-3.5 rounded-2xl bg-forest-dark text-white border border-lime/20 flex items-start gap-3 shrink-0 shadow-inner">
          <div className="w-6 h-6 rounded-lg bg-lime/20 text-lime flex items-center justify-center shrink-0 mt-0.5 border border-lime/30">
            <Info size={14} strokeWidth={2.5} />
          </div>
          <div className="text-xs leading-relaxed text-warmIvory/90">
            <strong className="text-lime font-black">Continuous Learning (3.0× Priority Weight): </strong>
            Real kitchen records are weighted 3× over baseline synthetic data, training the ML model in &lt;80ms to adapt to actual student turnout.
          </div>
        </div>

        {/* Mode Selector Tabs: Batch Shift vs Single Dish */}
        <div className="flex rounded-2xl bg-canvas p-1 border border-line-light shrink-0">
          <button
            type="button"
            onClick={() => setModalMode("batch")}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              modalMode === "batch"
                ? "bg-white text-forest shadow-sm border border-line-light"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            <Layers size={16} />
            <span>Shift Batch Ingestion ({dishes.length} Dishes)</span>
          </button>
          <button
            type="button"
            onClick={() => setModalMode("single")}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              modalMode === "single"
                ? "bg-white text-forest shadow-sm border border-line-light"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>Single Dish Record</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 animate-fadeIn">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body: MODE 1 - BATCH SHIFT INGESTION */}
        {modalMode === "batch" && (
          <form onSubmit={handleBatchSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Shift Headcount Bar */}
            <div className="p-4 rounded-2xl bg-canvas border border-line-light flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label htmlFor="batch-attendance" className="font-extrabold text-sm text-ink block">
                  Observed Student Attendance ({shift.toUpperCase()})
                </label>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Target Date: <strong className="text-forest font-bold">{normalizeToIsoDate(date)}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="batch-attendance"
                  type="number"
                  min="1"
                  max="600"
                  value={actualAttendance}
                  onChange={(e) => setActualAttendance(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-24 px-3 py-2 rounded-xl bg-white border border-line-light text-ink font-black text-sm text-center focus:outline-none focus:border-forest"
                  required
                />
                <span className="text-xs font-bold text-ink-secondary">students</span>
              </div>
            </div>

            {/* Dish-wise Inputs Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Dish Preparation, Consumption &amp; Surplus
                </p>
                <span className="text-xs font-bold text-forest bg-sage px-2.5 py-0.5 rounded-full">
                  {includedDishesCount} of {batchOutcomes.length} dishes active
                </span>
              </div>

              {batchOutcomes.map((item) => {
                const matchingDish = dishes.find((d) => d.id === item.dishId);
                const validation = batchValidations[item.dishId];

                return (
                  <div
                    key={item.dishId}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.included
                        ? "bg-canvas border-line-light shadow-sm"
                        : "bg-canvas/40 border-line-light/50 opacity-60"
                    } ${!validation.isValid ? "border-rose-300 ring-1 ring-rose-200" : ""}`}
                  >
                    {/* Dish Header with Toggle Checkbox */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.included}
                          onChange={() => handleBatchItemToggle(item.dishId)}
                          className="w-4 h-4 rounded text-forest focus:ring-forest cursor-pointer"
                          title="Include/exclude dish in batch"
                        />
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                            matchingDish?.imageBg || "bg-white"
                          } shrink-0`}
                        >
                          {matchingDish?.imageEmoji || <Utensils size={14} />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-ink truncate">
                            {item.dishName}
                          </h4>
                          <span className="text-xs text-ink-secondary">
                            {matchingDish?.category || "Kitchen Dish"}
                          </span>
                        </div>
                      </div>

                      {/* Prepared Portions Stepper/Input */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-ink-secondary hidden sm:inline">
                          Prepared:
                        </span>
                        <input
                          type="number"
                          min="0"
                          disabled={!item.included}
                          value={item.preparedPortions}
                          onChange={(e) =>
                            handleBatchFieldChange(
                              item.dishId,
                              "preparedPortions",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20 px-2.5 py-1.5 rounded-xl bg-white border border-line-light text-ink font-bold text-xs text-center focus:outline-none focus:border-forest disabled:opacity-50"
                          title="Total portions prepared"
                          required
                        />
                        <span className="text-xs text-ink-secondary">qty</span>
                      </div>
                    </div>

                    {/* Served & Leftover Portions Columns */}
                    {item.included && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line-light/60">
                        {/* Served Portions Column */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                              Served (Consumed)
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-ink-secondary cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.isServedUnmeasured}
                                onChange={() => handleBatchUnmeasuredToggle(item.dishId)}
                                className="w-3.5 h-3.5 rounded text-forest"
                              />
                              <span>Unmeasured</span>
                            </label>
                          </div>
                          <input
                            type="number"
                            min="0"
                            disabled={item.isServedUnmeasured}
                            value={item.isServedUnmeasured ? "" : item.servedPortions}
                            placeholder={item.isServedUnmeasured ? "Null / Not counted" : "0"}
                            onChange={(e) =>
                              handleBatchFieldChange(
                                item.dishId,
                                "servedPortions",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className={`w-full px-3 py-2 rounded-xl border text-ink font-bold text-xs sm:text-sm focus:outline-none ${
                              item.isServedUnmeasured
                                ? "bg-line-light/40 border-dashed border-line-light text-ink-secondary italic"
                                : "bg-white border-line-light focus:border-forest"
                            }`}
                          />
                        </div>

                        {/* Leftover Portions Column */}
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                            Leftover (Wasted / Surplus)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.leftoverPortions}
                            onChange={(e) =>
                              handleBatchFieldChange(
                                item.dishId,
                                "leftoverPortions",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white border border-line-light text-ink font-bold text-xs sm:text-sm focus:outline-none focus:border-forest"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Inline Validation Warning */}
                    {item.included && !validation.isValid && (
                      <div className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-1.5 animate-fadeIn">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{validation.errorMessage}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Batch Submission Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-line-light shrink-0">
              <span className="text-xs text-ink-secondary">
                Submits atomically via <code className="bg-canvas px-1.5 py-0.5 rounded text-forest font-mono">POST /api/records/batch</code>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink-secondary hover:text-ink transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || hasBatchValidationError || includedDishesCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-forest text-lime hover:bg-forest-dark font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-lime" />
                      <span>Ingesting Batch...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Submit Batch ({includedDishesCount} Dishes)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Modal Body: MODE 2 - SINGLE DISH RECORD INGESTION */}
        {modalMode === "single" && (
          <form onSubmit={handleSingleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Date */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5 mb-1">
                  <Calendar size={13} />
                  <span>Meal Date</span>
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line-light text-ink font-bold text-xs sm:text-sm focus:outline-none focus:border-forest"
                  required
                />
              </div>

              {/* Meal Shift */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5 mb-1">
                  <Clock size={13} />
                  <span>Meal Shift</span>
                </label>
                <select
                  value={singleShift}
                  onChange={(e) => setSingleShift(e.target.value as MealShiftKey)}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line-light text-ink font-bold text-xs sm:text-sm focus:outline-none focus:border-forest"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>

            {/* Target Dish Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5 mb-1">
                <Utensils size={13} />
                <span>Select Dish</span>
              </label>
              <select
                value={singleDishId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSingleDishId(id);
                  const d = dishes.find((item) => item.id === id);
                  if (d) {
                    setSinglePrepared(d.recommendedQty);
                    setSingleLeftover(Math.max(0, Math.round(d.recommendedQty * 0.05)));
                    setSingleServed(Math.max(0, d.recommendedQty - Math.round(d.recommendedQty * 0.05)));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-canvas border border-line-light text-ink font-bold text-xs sm:text-sm focus:outline-none focus:border-forest"
                required
              >
                {availableSingleDishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.category})
                  </option>
                ))}
              </select>
            </div>


            {/* Attendance & Prepared Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Attendance (Headcount)
                </label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={singleAttendance}
                  onChange={(e) => setSingleAttendance(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line-light text-ink font-bold text-xs sm:text-sm focus:outline-none focus:border-forest"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Prepared Portions
                </label>
                <input
                  type="number"
                  min="0"
                  value={singlePrepared}
                  onChange={(e) => setSinglePrepared(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line-light text-ink font-bold text-xs sm:text-sm focus:outline-none focus:border-forest"
                  required
                />
              </div>
            </div>

            {/* Served & Leftover Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Served Portions
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-ink-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={singleServedUnmeasured}
                      onChange={() => setSingleServedUnmeasured(!singleServedUnmeasured)}
                      className="w-3.5 h-3.5 rounded text-forest"
                    />
                    <span>Unmeasured</span>
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  disabled={singleServedUnmeasured}
                  value={singleServedUnmeasured ? "" : singleServed}
                  placeholder={singleServedUnmeasured ? "Null / Not counted" : "0"}
                  onChange={(e) => setSingleServed(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 rounded-xl border text-ink font-bold text-xs sm:text-sm focus:outline-none ${
                    singleServedUnmeasured
                      ? "bg-line-light/40 border-dashed border-line-light text-ink-secondary italic"
                      : "bg-canvas border-line-light focus:border-forest"
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1">
                  Leftover Portions
                </label>
                <input
                  type="number"
                  min="0"
                  value={singleLeftover}
                  onChange={(e) => setSingleLeftover(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line-light text-ink font-bold text-xs sm:text-sm focus:outline-none focus:border-forest"
                  required
                />
              </div>
            </div>

            {/* Guardrail Validation Message */}
            {!singleValidation.isValid && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span>{singleValidation.errorMessage}</span>
              </div>
            )}

            {/* Single Record Submission Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-line-light shrink-0">
              <span className="text-xs text-ink-secondary">
                Submits directly via <code className="bg-canvas px-1.5 py-0.5 rounded text-forest font-mono">POST /api/records</code>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink-secondary hover:text-ink transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !singleValidation.isValid || !singleDishId}
                  className="px-5 py-2.5 rounded-xl bg-forest text-lime hover:bg-forest-dark font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-lime" />
                      <span>Logging Dish...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Log Single Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
