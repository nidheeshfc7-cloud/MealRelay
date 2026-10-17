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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
      {/* 1. Edit Quantities Button */}
      <button
        onClick={onEditQuantities}
        type="button"
        className="py-3 px-6 rounded-xl border border-line-light bg-white hover:bg-canvas text-forest font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
      >
        <FileEdit size={18} strokeWidth={2} className="text-forest" />
        <span>Edit Quantities</span>
      </button>

      {/* 2. Confirm Preparation Plan Button */}
      <button
        onClick={onConfirmPlan}
        type="button"
        className={`py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
          isConfirmed
            ? "bg-sage text-forest border border-forest/20"
            : "bg-forest text-lime hover:bg-forest-dark border border-forest"
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
        className={`py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 sm:col-span-2 lg:col-span-1 ${
          isConfirmed
            ? "bg-white border border-forest/40 text-forest hover:bg-sage/40"
            : "bg-white border border-line-light text-ink-secondary hover:text-ink hover:bg-canvas"
        }`}
      >
        <ClipboardCheck size={18} strokeWidth={2} className="text-forest" />
        <span>Log Shift Outcomes</span>
      </button>
    </div>
  );
};

