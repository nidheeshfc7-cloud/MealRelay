"use client";

import React from "react";
import {
  Calendar,
  Download,
  Plus,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  Sun,
  Utensils,
  Moon,
  Layers,
  X,
} from "lucide-react";
import type { MealServiceKey } from "@mealrelay/types";

export type ShiftFilterKey = "all" | MealServiceKey;

interface RecordsToolbarProps {
  dateFilter: string;
  onDateChange: (date: string) => void;
  selectedShift: ShiftFilterKey;
  onShiftChange: (shift: ShiftFilterKey) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreate: () => void;
  onOpenOcr: () => void;
  onExport: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalFilteredCount: number;
}

const getTodayString = (): string => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const SHIFTS: { key: ShiftFilterKey; label: string; icon: React.ComponentType<{ size: number; className?: string }> }[] = [
  { key: "all", label: "All Shifts", icon: Layers },
  { key: "breakfast", label: "Breakfast", icon: Sun },
  { key: "lunch", label: "Lunch", icon: Utensils },
  { key: "dinner", label: "Dinner", icon: Moon },
];

export const RecordsToolbar: React.FC<RecordsToolbarProps> = ({
  dateFilter,
  onDateChange,
  selectedShift,
  onShiftChange,
  searchQuery,
  onSearchChange,
  onOpenCreate,
  onOpenOcr,
  onExport,
  onRefresh,
  isRefreshing,
  totalFilteredCount,
}) => {
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();

  return (
    <div className="space-y-3.5">
      {/* Top Action Row: Date Presets & Primary Calls to Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Date Selector with Today / Yesterday Presets */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="relative inline-flex items-center h-10 bg-white border border-line-light rounded-xl px-3 shadow-xs hover:border-forest/30 transition-all">
            <Calendar size={14} className="text-forest shrink-0 mr-2" />
            <input
              type="date"
              aria-label="Filter by service date"
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-ink focus:outline-none cursor-pointer"
            />
            {dateFilter ? (
              <button
                type="button"
                onClick={() => onDateChange("")}
                className="ml-2 text-ink-secondary hover:text-ink transition-colors cursor-pointer"
                title="Clear date filter"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onDateChange(todayStr)}
            className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === todayStr
                ? "bg-forest text-lime shadow-xs font-black"
                : "bg-white border border-line-light text-ink hover:bg-canvas"
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => onDateChange(yesterdayStr)}
            className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === yesterdayStr
                ? "bg-forest text-lime shadow-xs font-black"
                : "bg-white border border-line-light text-ink hover:bg-canvas"
            }`}
          >
            Yesterday
          </button>

          {dateFilter ? (
            <button
              type="button"
              onClick={() => onDateChange("")}
              className="h-10 px-2.5 rounded-xl text-xs font-medium text-ink-secondary hover:text-ink flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>All Dates</span>
            </button>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-10 px-3.5 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            title="Reload records from server"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? "animate-spin text-forest" : "text-ink-secondary"}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={totalFilteredCount === 0}
            className="h-10 px-3.5 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 cursor-pointer"
            title="Download spreadsheet CSV"
          >
            <Download size={13} className="text-forest" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenOcr}
            className="h-10 px-3.5 rounded-xl border border-forest/20 bg-sage hover:bg-sage/80 text-forest text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Scan register photo or paste register text"
          >
            <ScanLine size={13} className="text-forest" />
            <span>Scan Register</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="h-10 px-4 rounded-xl bg-forest hover:bg-forest-dark text-lime text-xs font-black transition-all flex items-center gap-1.5 shadow-xs border border-forest-light cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Log Meal Record</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Shift Segmented Pills & Live Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-line-light shadow-xs">
        {/* Shift Pills */}
        <div className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-xl bg-canvas border border-line-light">
          {SHIFTS.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedShift === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onShiftChange(item.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-forest text-lime shadow-xs"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                <Icon size={12} className={isSelected ? "text-lime" : "text-ink-secondary"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dish (e.g. Paneer, Rice)..."
            className="w-full h-9 pl-8 pr-7 rounded-xl bg-canvas border border-line-light text-xs font-medium text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:ring-1 focus:ring-forest transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink"
              title="Clear search"
            >
              <X size={12} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
