"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Scale,
  Utensils,
  Users,
  Sun,
  Moon,
  TrendingUp,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import type { ShiftFilterKey } from "./RecordsToolbar";

export interface KitchenRecordsMetrics {
  totalRecords: number;
  totalPrepared: number;
  totalServed: number;
  totalLeftovers: number;
  totalDiners: number;
  surplusPct: string;
  servedRate: string;
  shiftCounts: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

interface RecordsMetricBentoProps {
  metrics: KitchenRecordsMetrics;
  onSelectShift: (shift: ShiftFilterKey) => void;
  selectedShift: ShiftFilterKey;
}

export const RecordsMetricBento: React.FC<RecordsMetricBentoProps> = ({
  metrics,
  onSelectShift,
  selectedShift,
}) => {
  const surplusNum = Number(metrics.surplusPct) || 0;
  const servedNum = Number(metrics.servedRate) || 0;
  const averagePerDiner =
    metrics.totalDiners > 0
      ? (metrics.totalServed / metrics.totalDiners).toFixed(2)
      : "1.00";

  // Determine cushion health category
  const getCushionStatus = (): { label: string; textClass: string; icon: React.ReactNode } => {
    if (metrics.totalPrepared === 0) {
      return {
        label: "Awaiting logs",
        textClass: "text-ink-secondary",
        icon: <Scale size={13} />,
      };
    }
    if (surplusNum >= 2.5 && surplusNum <= 5.5) {
      return {
        label: "Optimal buffer (3–5%)",
        textClass: "text-forest",
        icon: <CheckCircle2 size={13} className="text-forest" />,
      };
    }
    if (surplusNum > 5.5) {
      return {
        label: "Elevated surplus",
        textClass: "text-amber-800",
        icon: <AlertTriangle size={13} className="text-amber-700" />,
      };
    }
    return {
      label: "Shortage risk (<2.5%)",
      textClass: "text-rose-800",
      icon: <AlertTriangle size={13} className="text-rose-700" />,
    };
  };

  const status = getCushionStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Production & Consumption Card (Matches KitchenImpactCards) */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Total Portions Cooked
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Utensils size={16} />
            </div>
          </div>

          <p className="text-3xl sm:text-4xl font-black text-ink mt-3 tabular-nums tracking-tight">
            {metrics.totalPrepared.toLocaleString()}{" "}
            <span className="text-sm font-bold text-ink-secondary tracking-normal">plates</span>
          </p>

          <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
            Prepared with <strong className="text-ink font-bold">{metrics.totalServed.toLocaleString()} plates served</strong> directly to diners.
          </p>

          {/* Progress bar */}
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-canvas overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, Math.max(0, servedNum))}%` }}
                className="bg-forest h-full rounded-full transition-all duration-500"
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, surplusNum))}%` }}
                className="bg-lime h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
          <span className="text-forest font-bold flex items-center gap-1">
            <TrendingUp size={13} />
            {metrics.servedRate}% consumption rate
          </span>
          <span className="text-ink-secondary text-[11px]">
            {metrics.totalRecords} records
          </span>
        </div>
      </div>

      {/* 2. Safety Cushion & Buffer Health (Matches KitchenImpactCards) */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Leftover Safety Cushion
            </span>
            <div className="w-8 h-8 rounded-xl bg-lime/20 text-forest-dark flex items-center justify-center shrink-0">
              <Scale size={16} />
            </div>
          </div>

          <p className="text-3xl sm:text-4xl font-black text-forest mt-3 tabular-nums tracking-tight">
            {metrics.surplusPct}%
          </p>

          <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
            Controlled buffer of <strong className="text-forest font-bold">{metrics.totalLeftovers.toLocaleString()} surplus plates</strong> preventing student shortages.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
          <span className={`font-bold flex items-center gap-1 ${status.textClass}`}>
            {status.icon}
            {status.label}
          </span>
          <span className="text-ink-secondary text-[11px]">
            Zero blind waste
          </span>
        </div>
      </div>

      {/* 3. Diners & Intake Card (Matches KitchenImpactCards) */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Diner Attendance
            </span>
            <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          </div>

          <p className="text-3xl sm:text-4xl font-black text-ink mt-3 tabular-nums tracking-tight">
            {metrics.totalDiners.toLocaleString()}{" "}
            <span className="text-sm font-bold text-ink-secondary tracking-normal">diners</span>
          </p>

          <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
            Verified turnout across shifts averaging <strong className="text-ink font-bold">{averagePerDiner} plates</strong> per logged diner.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
          <span className="text-forest font-bold flex items-center gap-1">
            <CheckCircle2 size={13} />
            Turnout verified
          </span>
          <span className="text-ink-secondary text-[11px]">
            Mess Headcount
          </span>
        </div>
      </div>

      {/* 4. Shift Coverage Matrix (Matches KitchenImpactCards) */}
      <div className="p-6 rounded-3xl bg-white border border-line-light shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Active Shift Coverage
            </span>
            <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
              <ClipboardList size={16} />
            </div>
          </div>

          {/* Shift quick cards */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectShift(selectedShift === "breakfast" ? "all" : "breakfast")}
              className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                selectedShift === "breakfast"
                  ? "bg-forest text-lime border-forest font-bold shadow-xs"
                  : "bg-canvas border-line-light hover:border-forest/30 text-ink"
              }`}
            >
              <Sun size={12} className={selectedShift === "breakfast" ? "text-lime mb-1" : "text-amber-600 mb-1"} />
              <span className={`text-[10px] font-bold uppercase ${selectedShift === "breakfast" ? "text-lime" : "text-ink-secondary"}`}>
                B-Fast
              </span>
              <span className="text-xs font-black mt-0.5">{metrics.shiftCounts.breakfast}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectShift(selectedShift === "lunch" ? "all" : "lunch")}
              className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                selectedShift === "lunch"
                  ? "bg-forest text-lime border-forest font-bold shadow-xs"
                  : "bg-canvas border-line-light hover:border-forest/30 text-ink"
              }`}
            >
              <Utensils size={12} className={selectedShift === "lunch" ? "text-lime mb-1" : "text-forest mb-1"} />
              <span className={`text-[10px] font-bold uppercase ${selectedShift === "lunch" ? "text-lime" : "text-ink-secondary"}`}>
                Lunch
              </span>
              <span className="text-xs font-black mt-0.5">{metrics.shiftCounts.lunch}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectShift(selectedShift === "dinner" ? "all" : "dinner")}
              className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                selectedShift === "dinner"
                  ? "bg-forest text-lime border-forest font-bold shadow-xs"
                  : "bg-canvas border-line-light hover:border-forest/30 text-ink"
              }`}
            >
              <Moon size={12} className={selectedShift === "dinner" ? "text-lime mb-1" : "text-indigo-600 mb-1"} />
              <span className={`text-[10px] font-bold uppercase ${selectedShift === "dinner" ? "text-lime" : "text-ink-secondary"}`}>
                Dinner
              </span>
              <span className="text-xs font-black mt-0.5">{metrics.shiftCounts.dinner}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
          <span className="text-forest font-bold flex items-center gap-1">
            <Sparkles size={12} />
            3 Daily Shifts
          </span>
          <span className="text-ink-secondary text-[11px]">
            Filter by shift
          </span>
        </div>
      </div>
    </div>
  );
};
