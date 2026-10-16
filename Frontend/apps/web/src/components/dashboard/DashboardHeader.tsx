"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Coffee, Moon, Sun } from "lucide-react";
import { MealShiftKey } from "./types";

interface DashboardHeaderProps {
  chefName?: string;
  selectedDate: string;
  selectedShift: MealShiftKey;
  onShiftChange: (shift: MealShiftKey) => void;
  onDateChange?: (date: string) => void;
}

const SHIFT_OPTIONS: { key: MealShiftKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { key: "breakfast", label: "Breakfast (7:30 – 9:30 AM)", icon: Coffee },
  { key: "lunch", label: "Lunch (12:30 – 2:30 PM)", icon: Sun },
  { key: "dinner", label: "Dinner (7:30 – 9:45 PM)", icon: Moon },
];

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  chefName = "Sunil",
  selectedDate,
  selectedShift,
  onShiftChange,
  onDateChange,
}) => {
  const [shiftDropdownOpen, setShiftDropdownOpen] = useState<boolean>(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState<boolean>(false);

  const activeShiftOption = SHIFT_OPTIONS.find((s) => s.key === selectedShift) || SHIFT_OPTIONS[1];
  const ActiveShiftIcon = activeShiftOption.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
          Good morning, {chefName}
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-1 font-medium">
          Here&apos;s the preparation plan for tomorrow.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Selector Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              setDateDropdownOpen((prev) => !prev);
              setShiftDropdownOpen(false);
            }}
            type="button"
            className="px-4 py-2.5 rounded-2xl bg-white border border-line-light hover:border-forest/30 text-xs font-bold text-ink shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Calendar size={15} className="text-ink-secondary" />
            <span>{selectedDate}</span>
            <ChevronDown size={14} className="text-ink-secondary" />
          </button>

          {dateDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-line-light shadow-xl p-2 z-30 animate-fadeIn">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-ink-secondary">
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
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      isCurrent
                        ? "bg-forest text-lime font-bold shadow-sm"
                        : "text-ink hover:bg-canvas"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isCurrent && <span className="text-lime text-xs font-black">✓</span>}
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
            className="px-4 py-2.5 rounded-2xl bg-white border border-line-light hover:border-forest/30 text-xs font-bold text-ink shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <ActiveShiftIcon size={15} className="text-forest" />
            <span className="capitalize">{activeShiftOption.key}</span>
            <ChevronDown size={14} className="text-ink-secondary" />
          </button>

          {shiftDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-line-light shadow-xl p-2 z-30 animate-fadeIn">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-ink-secondary">
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
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                      isCurrent ? "bg-forest text-lime font-bold" : "text-ink hover:bg-canvas"
                    }`}
                  >
                    <Icon size={14} className={isCurrent ? "text-lime" : "text-ink-secondary"} />
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
