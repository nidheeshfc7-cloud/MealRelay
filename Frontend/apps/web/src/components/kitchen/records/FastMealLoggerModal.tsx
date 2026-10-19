"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  RotateCcw,
  Sun,
  Utensils,
  Moon,
  X,
  Plus,
  Scale,
} from "lucide-react";
import type { ActivityInput, MenuItem } from "@/lib/kitchen/types";
import type { MealServiceKey } from "@mealrelay/types";

interface FastMealLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ActivityInput;
  onChange: React.Dispatch<React.SetStateAction<ActivityInput>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  menu: MenuItem[];
  isEditing: boolean;
  isSaving: boolean;
}

const inputControlClass =
  "w-full h-[42px] rounded-xl bg-[#F8F9F5] border border-line-light px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-forest transition-all";

export const FastMealLoggerModal: React.FC<FastMealLoggerModalProps> = ({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  menu,
  isEditing,
  isSaving,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const prepNum = Number(form.prepared) || 0;
  const servedNum = Number(form.served) || 0;
  const leftNum = Number(form.leftover) || 0;
  const calculatedLeftover = Math.max(0, prepNum - servedNum);
  const isPortionBalanced = prepNum === servedNum + leftNum;
  const surplusPct = prepNum > 0 ? ((leftNum / prepNum) * 100).toFixed(1) : "0.0";

  const handleShiftSelect = (shift: MealServiceKey): void => {
    onChange((prev) => ({ ...prev, meal_service: shift }));
  };

  const handleSetToday = (): void => {
    const d = new Date();
    const today = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
    onChange((prev) => ({ ...prev, service_date: today }));
  };

  const handleAutoBalance = (): void => {
    onChange((prev) => ({ ...prev, leftover: calculatedLeftover }));
  };

  const handleAddPrep = (amount: number): void => {
    onChange((prev) => {
      const nextPrep = Math.max(0, (Number(prev.prepared) || 0) + amount);
      const nextServed = Math.min(nextPrep, Number(prev.served) || 0);
      return {
        ...prev,
        prepared: nextPrep,
        served: nextServed,
        leftover: Math.max(0, nextPrep - nextServed),
      };
    });
  };

  const handleAddServed = (amount: number): void => {
    onChange((prev) => {
      const nextServed = Math.max(0, (Number(prev.served) || 0) + amount);
      return {
        ...prev,
        served: nextServed,
        leftover: Math.max(0, (Number(prev.prepared) || 0) - nextServed),
      };
    });
  };

  const handleMatchCooked = (): void => {
    onChange((prev) => ({
      ...prev,
      served: Number(prev.prepared) || 0,
      leftover: 0,
    }));
  };

  const handleMatchServedAttendance = (): void => {
    onChange((prev) => ({
      ...prev,
      attendance: Number(prev.served) || 0,
    }));
  };

  const handleReset = (): void => {
    onChange({
      menu_item_id: menu[0]?.id || "",
      service_date: form.service_date,
      meal_service: "lunch",
      prepared: 0,
      served: 0,
      leftover: 0,
      attendance: 0,
      notes: "",
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-forest-dark/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-line-light shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-canvas/70 border-b border-line-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage text-forest flex items-center justify-center border border-line-light/60">
              <ChefHat size={18} />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-forest">
                {isEditing ? "EDIT SERVICE RECORD" : "KITCHEN SERVICE ENTRY"}
              </span>
              <h2 id="modal-title" className="text-lg font-black text-ink">
                {isEditing ? "Update Meal Service Record" : "Log Daily Meal Service"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-line-light text-ink-secondary hover:text-ink hover:bg-canvas flex items-center justify-center transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Menu Warning if no items exist */}
          {!menu.length ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>No dishes found in your menu catalogue. Add dishes first.</span>
              <Link
                href="/menu"
                className="px-3 py-1.5 rounded-xl bg-forest text-lime font-bold hover:bg-forest-dark transition-all"
              >
                Go to Menu
              </Link>
            </div>
          ) : null}

          {/* Row 1: Shift & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shift Selector */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Meal Shift Service
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-canvas border border-line-light">
                {(
                  [
                    { key: "breakfast", label: "Breakfast", icon: Sun },
                    { key: "lunch", label: "Lunch", icon: Utensils },
                    { key: "dinner", label: "Dinner", icon: Moon },
                  ] as const
                ).map((shift) => {
                  const Icon = shift.icon;
                  const isActive = form.meal_service === shift.key;
                  return (
                    <button
                      key={shift.key}
                      type="button"
                      onClick={() => handleShiftSelect(shift.key)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? "bg-forest text-lime shadow-xs"
                          : "text-ink-secondary hover:text-ink"
                      }`}
                    >
                      <Icon size={12} className={isActive ? "text-lime" : "text-ink-secondary"} />
                      <span>{shift.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink">Service Date</label>
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="text-[11px] font-bold text-forest hover:underline cursor-pointer"
                >
                  Set Today
                </button>
              </div>
              <input
                required
                type="date"
                value={form.service_date}
                className={inputControlClass}
                onChange={(e) => onChange((prev) => ({ ...prev, service_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Row 2: Dish Selection */}
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              Menu Dish / Catalog Item
            </label>
            <select
              required
              value={form.menu_item_id}
              onChange={(e) => onChange((prev) => ({ ...prev, menu_item_id: e.target.value }))}
              className={inputControlClass}
            >
              <option value="">Select a saved dish from catalogue...</option>
              {menu.map((dish) => (
                <option value={dish.id} key={dish.id}>
                  {dish.name} {dish.category ? `(${dish.category})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Portions Ledger Grid */}
          <div className="p-4 rounded-2xl bg-canvas border border-line-light space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                <Scale size={13} />
                Portions Ledger (Cooked = Served + Leftover)
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Plates Cooked */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-ink">
                  Plates Cooked
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  placeholder="e.g. 200"
                  className={inputControlClass}
                  value={form.prepared === 0 ? "" : form.prepared}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, prepared: Number(e.target.value) || 0 }))
                  }
                />
                <div className="flex items-center gap-1 pt-0.5">
                  {[10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAddPrep(amt)}
                      className="px-1.5 py-0.5 rounded-md bg-white border border-line-light text-[10px] font-bold text-ink hover:bg-canvas cursor-pointer"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Plates Served */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink">Plates Served</label>
                  <button
                    type="button"
                    onClick={handleMatchCooked}
                    className="text-[10px] font-bold text-forest hover:underline cursor-pointer"
                  >
                    Match
                  </button>
                </div>
                <input
                  required
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  placeholder="e.g. 192"
                  className={inputControlClass}
                  value={form.served === 0 ? "" : form.served}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, served: Number(e.target.value) || 0 }))
                  }
                />
                <div className="flex items-center gap-1 pt-0.5">
                  {[10, 25].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAddServed(amt)}
                      className="px-1.5 py-0.5 rounded-md bg-white border border-line-light text-[10px] font-bold text-ink hover:bg-canvas cursor-pointer"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Leftover Safety Cushion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink">Leftover Cushion</label>
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="text-[10px] font-bold text-forest hover:underline cursor-pointer"
                  >
                    Auto ({calculatedLeftover})
                  </button>
                </div>
                <input
                  required
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  placeholder="e.g. 8"
                  className={inputControlClass}
                  value={form.leftover === 0 ? "" : form.leftover}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, leftover: Number(e.target.value) || 0 }))
                  }
                />
              </div>

              {/* 4. Diner Attendance */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink">Diner Turnout</label>
                  <button
                    type="button"
                    onClick={handleMatchServedAttendance}
                    className="text-[10px] font-bold text-forest hover:underline cursor-pointer"
                  >
                    Match
                  </button>
                </div>
                <input
                  required
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  placeholder="e.g. 188"
                  className={inputControlClass}
                  value={form.attendance === 0 ? "" : form.attendance}
                  onChange={(e) =>
                    onChange((prev) => ({ ...prev, attendance: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Live Ledger Validation Callout */}
            {prepNum > 0 ? (
              <div
                className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 transition-all ${
                  isPortionBalanced
                    ? "bg-sage border-forest/20 text-forest"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isPortionBalanced ? (
                    <CheckCircle2 size={15} className="text-forest shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-amber-700 shrink-0" />
                  )}
                  <span className="font-semibold">
                    {isPortionBalanced
                      ? `Ledger balanced: ${prepNum} cooked = ${servedNum} served + ${leftNum} leftover (${surplusPct}% cushion).`
                      : `Unbalanced: ${prepNum} cooked vs ${servedNum + leftNum} accounted. Difference: ${
                          prepNum - (servedNum + leftNum)
                        } plates.`}
                  </span>
                </div>

                {!isPortionBalanced ? (
                  <button
                    type="button"
                    onClick={handleAutoBalance}
                    className="px-3 py-1 rounded-lg bg-forest hover:bg-forest-dark text-lime text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Auto-balance Leftover to {calculatedLeftover}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Row 4: Notes / Context */}
          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Operational Context (Optional)
            </label>
            <input
              type="text"
              maxLength={1000}
              placeholder="e.g. Heavy rain during lunch; campus sports event reduced turnout..."
              className={inputControlClass}
              value={form.notes}
              onChange={(e) => onChange((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-line-light">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-bold text-ink-secondary hover:text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-line-light bg-white text-xs font-bold text-ink hover:bg-canvas transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || !menu.length || !form.menu_item_id || !isPortionBalanced}
                className="h-10 px-5 rounded-xl bg-forest hover:bg-forest-dark text-lime text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs border border-forest-light flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>{isSaving ? "Saving..." : isEditing ? "Update Service Record" : "Save Meal Record"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
