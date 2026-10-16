"use client";

import React from "react";
import { CheckCircle2, ClipboardCheck, FileEdit } from "lucide-react";

interface DashboardActionBarProps {
  onEditQuantities: () => void;
  onConfirmPlan: () => void;
  onLogOutcomes?: () => void;
  isConfirmed: boolean;
}

export const DashboardActionBar: React.FC<DashboardActionBarProps> = ({
  onEditQuantities,
  onConfirmPlan,
  onLogOutcomes,
  isConfirmed,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
      {/* 1. Edit Quantities Button */}
      <button
        onClick={onEditQuantities}
        type="button"
        className="py-4 px-6 rounded-2xl border-2 border-line-light bg-white hover:bg-canvas hover:border-forest/40 text-forest font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-95"
      >
        <FileEdit size={17} className="text-forest stroke-[2.3]" />
        <span>Edit Quantities</span>
      </button>

      {/* 2. Confirm Preparation Plan Button */}
      <button
        onClick={onConfirmPlan}
        type="button"
        className={`py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-95 ${
          isConfirmed
            ? "bg-sage text-forest border-2 border-forest/20"
            : "bg-forest text-lime hover:bg-forest-dark shadow-forest/20 border-2 border-forest"
        }`}
      >
        <CheckCircle2 size={18} className={isConfirmed ? "text-forest" : "text-lime"} />
        <span>
          {isConfirmed
            ? "Preparation Plan Confirmed ✓"
            : "Confirm Preparation Plan"}
        </span>
      </button>

      {/* 3. Log Shift Outcomes (Feedback Loop to ML) */}
      <button
        onClick={onLogOutcomes}
        type="button"
        className={`py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-95 sm:col-span-2 lg:col-span-1 ${
          isConfirmed
            ? "bg-white border-2 border-forest text-forest hover:bg-sage/40"
            : "bg-white border-2 border-line-light text-ink-secondary hover:border-forest/30 hover:text-ink"
        }`}
      >
        <ClipboardCheck size={18} className="text-forest stroke-[2.3]" />
        <span>Log Shift Outcomes</span>
      </button>
    </div>
  );
};
