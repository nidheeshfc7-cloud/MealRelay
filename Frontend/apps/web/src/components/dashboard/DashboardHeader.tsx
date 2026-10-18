"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Coffee, Moon, Shield, Sun } from "lucide-react";
import { MealShiftKey } from "./types";

interface DashboardHeaderProps {
  chefName?: string;
  selectedDate: string;
  selectedShift: MealShiftKey;
  safetyBufferPct?: number;
  onShiftChange: (shift: MealShiftKey) => void;
  onDateChange?: (date: string) => void;
  onBufferChange?: (bufferPct: number) => void;
}

const SHIFT_OPTIONS: { key: MealShiftKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "breakfast", label: "Breakfast (7:30 – 9:30 AM)", icon: Coffee },
  { key: "lunch", label: "Lunch (12:30 – 2:30 PM)", icon: Sun },
  { key: "dinner", label: "Dinner (7:30 – 9:45 PM)", icon: Moon },
];

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  chefName = "Chef",
  selectedDate,
  selectedShift,
  safetyBufferPct = 0.05,
  onShiftChange,
  onDateChange,
  onBufferChange,
}) => {
  const [shiftDropdownOpen, setShiftDropdownOpen] = useState<boolean>(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState<boolean>(false);

  const activeShiftOption = SHIFT_OPTIONS.find((s) => s.key === selectedShift) || SHIFT_OPTIONS[1];
  const ActiveShiftIcon = activeShiftOption.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Good morning, {chefName}
        </h1>
        <p className="text-sm text-ink-secondary mt-1 font-medium">
          Here&apos;s the preparation plan for tomorrow.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Safety Cushion Buffer Toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-line-light shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary px-2 flex items-center gap-2">
            <Shield size={14} className="text-forest" />
            <span className="hidden sm:inline">Cushion:</span>
          </span>
          {[0.05, 0.08, 0.10].map((pct) => {
            const isSelected = Math.abs(safetyBufferPct - pct) < 0.001;
            return (
              <button
                key={pct}
                onClick={() => onBufferChange?.(pct)}
                type="button"
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-forest text-lime shadow-sm font-bold"
                    : "text-ink-secondary hover:text-ink hover:bg-canvas"
                }`}
                title={`Apply +${Math.round(pct * 100)}% safety buffer`}
              >
                +{Math.round(pct * 100)}%
              </button>
            );
          })}
        </div>

        {/* Date Selector Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              setDateDropdownOpen((prev) => !prev);
              setShiftDropdownOpen(false);
            }}
            type="button"
            className="px-4 py-2 rounded-xl bg-white border border-line-light hover:border-forest/30 text-sm font-semibold text-ink shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Calendar size={15} className="text-forest" />
            <span className="font-mono">{selectedDate}</span>
            <ChevronDown size={15} className="text-ink-secondary" />
          </button>

          {dateDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-line-light shadow-lg p-2 z-30 animate-fadeIn">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Select Planning Date
              </p>
              {[
                { value: "Tue, 12 Aug 2025", label: "Tue, 12 Aug 2025 (Tomorrow)" },
                { value: "Wed, 13 Aug 2025", label: "Wed, 13 Aug 2025" },
                { value: "Thu, 14 Aug 2025", label: "Thu, 14 Aug 2025" },
                { value: "Fri, 15 Aug 2025", label: "Fri, 15 Aug 2025" },
                { value: "Sat, 16 Aug 2025", label: "Sat, 16 Aug 2025" },
                { value: "Sun, 17 Aug 2025", label: "Sun, 17 Aug 2025" },
              ].map((item) => {
                const isCurrent = selectedDate === item.value || selectedDate.startsWith(item.value);
                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      onDateChange?.(item.value);
                      setDateDropdownOpen(false);
                    }}
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors ${
                      isCurrent
                        ? "bg-forest text-lime font-bold shadow-sm"
                        : "text-ink hover:bg-canvas"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isCurrent && <span className="text-lime text-sm font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Shift Selector Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShiftDropdownOpen((prev) => !prev);
              setDateDropdownOpen(false);
            }}
            type="button"
            className="px-4 py-2 rounded-xl bg-white border border-line-light hover:border-forest/30 text-sm font-semibold text-ink shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <ActiveShiftIcon size={16} className="text-forest" />
            <span className="capitalize">{activeShiftOption.key}</span>
            <ChevronDown size={15} className="text-ink-secondary" />
          </button>

          {shiftDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-line-light shadow-lg p-2 z-30 animate-fadeIn">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Switch Meal Service
              </p>
              {SHIFT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isCurrent = opt.key === selectedShift;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      onShiftChange(opt.key);
                      setShiftDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                      isCurrent ? "bg-forest text-lime font-bold shadow-sm" : "text-ink hover:bg-canvas"
                    }`}
                  >
                    <Icon size={15} className={isCurrent ? "text-lime" : "text-ink-secondary"} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

