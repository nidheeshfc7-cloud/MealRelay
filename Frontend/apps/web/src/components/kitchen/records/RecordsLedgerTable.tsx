"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Utensils,
  Sun,
  Moon,
  Plus,
  Filter,
} from "lucide-react";
import type { ActivityLog, MenuItem } from "@/lib/kitchen/types";

export type AuditTabFilterKey = "all" | "optimal" | "high_surplus" | "shortage_risk";

interface RecordsLedgerTableProps {
  records: ActivityLog[];
  allFilteredRecords: ActivityLog[];
  menu: MenuItem[];
  activeTab: AuditTabFilterKey;
  onTabChange: (tab: AuditTabFilterKey) => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (log: ActivityLog) => void;
  onDelete: (log: ActivityLog) => void;
  onOpenCreate: () => void;
  onClearFilters: () => void;
}

const SHIFT_CONFIG = {
  breakfast: {
    label: "Breakfast",
    icon: Sun,
    badgeClass: "bg-amber-50 text-amber-900 border-amber-200",
  },
  lunch: {
    label: "Lunch",
    icon: Utensils,
    badgeClass: "bg-sage text-forest border-forest/20",
  },
  dinner: {
    label: "Dinner",
    icon: Moon,
    badgeClass: "bg-indigo-50 text-indigo-900 border-indigo-200",
  },
} as const;

export const RecordsLedgerTable: React.FC<RecordsLedgerTableProps> = ({
  records,
  allFilteredRecords,
  menu,
  activeTab,
  onTabChange,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onOpenCreate,
  onClearFilters,
}) => {
  // Counts by audit status for tab badges
  const tabCounts = React.useMemo(() => {
    let optimal = 0;
    let high = 0;
    let shortage = 0;

    allFilteredRecords.forEach((log) => {
      const prep = Number(log.prepared) || 0;
      const left = Number(log.leftover) || 0;
      if (prep === 0) return;
      const rate = (left / prep) * 100;
      if (rate >= 2.5 && rate <= 5.5) {
        optimal++;
      } else if (rate > 5.5) {
        high++;
      } else {
        shortage++;
      }
    });

    return { all: allFilteredRecords.length, optimal, high, shortage };
  }, [allFilteredRecords]);

  const startIndex = Math.min(allFilteredRecords.length, (currentPage - 1) * pageSize + 1);
  const endIndex = Math.min(allFilteredRecords.length, currentPage * pageSize);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-xs space-y-4">
      {/* Header and Filter Tabs (Matches SimplifiedAuditTable Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line-light">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-forest">
            KITCHEN LOG &amp; AUDIT
          </span>
          <h3 className="text-lg font-black text-ink mt-0.5">
            Dish-by-Dish Cooking &amp; Leftover Records
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Audit verifying that small safety cushions were kept while cutting out blind waste.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 p-1 bg-canvas border border-line-light rounded-xl overflow-x-auto self-start sm:self-auto">
          {(
            [
              { key: "all", label: "All Logs", count: tabCounts.all },
              { key: "optimal", label: "Optimal Buffer (3–5%)", count: tabCounts.optimal },
              { key: "high_surplus", label: "High Surplus (>5%)", count: tabCounts.high },
              { key: "shortage_risk", label: "Shortage Risk (<2.5%)", count: tabCounts.shortage },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-forest text-lime shadow-xs"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-forest-dark text-lime" : "bg-line-light text-ink-secondary"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line-light font-extrabold text-ink-secondary uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3">Date &amp; Shift</th>
              <th className="py-2.5 px-3">Dish Name</th>
              <th className="py-2.5 px-3 text-right">Plates Cooked</th>
              <th className="py-2.5 px-3 text-right">Plates Served</th>
              <th className="py-2.5 px-3 text-right">Leftover Cushion</th>
              <th className="py-2.5 px-3 text-right">Diners</th>
              <th className="py-2.5 px-4">Context Notes</th>
              <th className="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-light">
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-canvas text-ink-secondary flex items-center justify-center mx-auto">
                      <Filter size={16} />
                    </div>
                    <p className="text-xs font-bold text-ink">No meal activity records found matching this filter.</p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="px-3 py-1.5 rounded-xl border border-line-light bg-white text-xs font-bold text-ink hover:bg-canvas transition-colors cursor-pointer"
                      >
                        Clear Filters
                      </button>
                      <button
                        type="button"
                        onClick={onOpenCreate}
                        className="px-3.5 py-1.5 rounded-xl bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all cursor-pointer shadow-xs"
                      >
                        Log Meal Record
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((log) => {
                const dish = menu.find((item) => item.id === log.menu_item_id);
                const prep = Number(log.prepared) || 0;
                const left = Number(log.leftover) || 0;
                const surplusRate = prep > 0 ? ((left / prep) * 100).toFixed(1) : "0.0";
                const surplusNum = Number(surplusRate);
                const shiftCfg =
                  SHIFT_CONFIG[log.meal_service] || SHIFT_CONFIG.lunch;
                const ShiftIcon = shiftCfg.icon;

                const isOptimal = surplusNum >= 2.5 && surplusNum <= 5.5;
                const isHigh = surplusNum > 5.5;

                return (
                  <tr key={log.id} className="hover:bg-canvas/50 transition-colors">
                    {/* Date & Shift */}
                    <td className="py-3 px-3 whitespace-nowrap font-semibold text-ink">
                      <span>{log.service_date}</span>
                      <span className="ml-2 font-bold uppercase text-[11px] text-ink-secondary">
                        · {log.meal_service}
                      </span>
                    </td>

                    {/* Dish Name */}
                    <td className="py-3 px-3 font-bold text-ink">
                      <span>{dish?.name || "Standard Item"}</span>
                      {dish?.category ? (
                        <span className="block text-[11px] font-normal text-ink-secondary">
                          {dish.category}
                        </span>
                      ) : null}
                    </td>

                    {/* Plates Cooked */}
                    <td className="py-3 px-3 text-right font-semibold text-ink">
                      {prep.toLocaleString()}
                    </td>

                    {/* Plates Served */}
                    <td className="py-3 px-3 text-right font-semibold text-ink-secondary">
                      {Number(log.served || 0).toLocaleString()}
                    </td>

                    {/* Leftover Cushion */}
                    <td className="py-3 px-3 text-right font-semibold text-forest whitespace-nowrap">
                      <span>{left.toLocaleString()} plates</span>{" "}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ml-1 border ${
                          isOptimal
                            ? "bg-sage text-forest border-forest/20"
                            : isHigh
                            ? "bg-amber-50 text-amber-900 border-amber-200"
                            : "bg-rose-50 text-rose-900 border-rose-200"
                        }`}
                      >
                        {surplusRate}%
                      </span>
                    </td>

                    {/* Turnout */}
                    <td className="py-3 px-3 text-right font-semibold text-ink">
                      {Number(log.attendance || 0).toLocaleString()}
                    </td>

                    {/* Context Notes */}
                    <td className="py-3 px-4 text-xs text-ink-secondary max-w-xs truncate" title={log.notes || ""}>
                      {log.notes || "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(log)}
                          className="p-1.5 text-forest hover:bg-sage rounded-lg transition-colors cursor-pointer"
                          title="Edit record"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(log)}
                          className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Cards View (Visible below lg breakpoint) */}
      <div className="block lg:hidden space-y-3">
        {records.length === 0 ? (
          <div className="p-6 text-center bg-canvas rounded-2xl border border-line-light space-y-2">
            <p className="text-xs font-bold text-ink">No meal activity records found</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="px-3 py-1.5 rounded-xl border border-line-light bg-white text-xs font-bold text-ink cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          records.map((log) => {
            const dish = menu.find((item) => item.id === log.menu_item_id);
            const prep = Number(log.prepared) || 0;
            const left = Number(log.leftover) || 0;
            const surplusRate = prep > 0 ? ((left / prep) * 100).toFixed(1) : "0.0";
            const surplusNum = Number(surplusRate);
            const shiftCfg =
              SHIFT_CONFIG[log.meal_service] || SHIFT_CONFIG.lunch;

            const isOptimal = surplusNum >= 2.5 && surplusNum <= 5.5;
            const isHigh = surplusNum > 5.5;

            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-canvas/60 border border-line-light space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${shiftCfg.badgeClass}`}
                      >
                        <span className="capitalize">{log.meal_service}</span>
                      </span>
                      <span className="text-xs font-semibold text-ink-secondary">
                        {log.service_date}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-ink mt-1">
                      {dish?.name || "Standard Dish"}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(log)}
                      className="p-1.5 text-forest hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(log)}
                      className="p-1.5 text-rose-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-line-light/80 text-center">
                  <div className="bg-white p-2 rounded-xl border border-line-light">
                    <span className="text-[10px] font-bold text-ink-secondary block">Cooked</span>
                    <span className="text-xs font-bold text-ink">{prep}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-line-light">
                    <span className="text-[10px] font-bold text-ink-secondary block">Served</span>
                    <span className="text-xs font-bold text-ink">{log.served}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-line-light">
                    <span className="text-[10px] font-bold text-ink-secondary block">Leftover</span>
                    <span className="text-xs font-bold text-forest">{left}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-line-light">
                    <span className="text-[10px] font-bold text-ink-secondary block">Diners</span>
                    <span className="text-xs font-bold text-ink">{log.attendance}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isOptimal
                        ? "bg-sage text-forest border-forest/20"
                        : isHigh
                        ? "bg-amber-50 text-amber-900 border-amber-200"
                        : "bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                  >
                    {surplusRate}% Buffer
                  </span>

                  {log.notes ? (
                    <span className="text-[11px] text-ink-secondary truncate max-w-[180px]">
                      {log.notes}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer (Matches SimplifiedAuditTable Pagination) */}
      <div className="flex items-center justify-between pt-3 border-t border-line-light text-xs font-bold text-ink-secondary">
        <span>
          Showing {allFilteredRecords.length === 0 ? 0 : startIndex}–{endIndex} of{" "}
          {allFilteredRecords.length} records
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1.5 rounded-lg border border-line-light bg-white text-ink disabled:opacity-40 hover:bg-canvas transition-colors cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft size={13} />
            <span>Previous</span>
          </button>

          <span className="text-ink">
            Page {currentPage} of {Math.max(1, totalPages)}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1.5 rounded-lg border border-line-light bg-white text-ink disabled:opacity-40 hover:bg-canvas transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
