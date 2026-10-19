"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  Plus,
  RotateCcw,
  ScanLine,
  Trash2,
  Utensils,
  Users,
  ChefHat,
  Scale,
  X,
  ClipboardCheck,
} from "lucide-react";
import {
  listMenuItems,
  listActivityLogs,
  saveActivityLog,
  deleteActivityLog,
} from "@/lib/kitchen/actions";
import type { ActivityInput, ActivityLog, MenuItem } from "@/lib/kitchen/types";
import { WorkspaceShell } from "./WorkspaceShell";
import { OcrRegisterImportModal } from "./OcrRegisterImportModal";

const getTodayString = (): string => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const createBlankActivityInput = (): ActivityInput => ({
  menu_item_id: "",
  service_date: getTodayString(),
  meal_service: "lunch",
  prepared: 0,
  served: 0,
  leftover: 0,
  attendance: 0,
  notes: "",
});

const inputControlClass =
  "w-full rounded-xl bg-white border border-line-light px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all";

export const ActivityWorkspace: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [form, setForm] = useState<ActivityInput>(createBlankActivityInput);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [filterDate, setFilterDate] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [isBusy, setIsBusy] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string>("");
  const [successNotice, setSuccessNotice] = useState<string>("");
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);

  const loadData = async (date = filterDate, offset = page * 100): Promise<void> => {
    try {
      const result = await listActivityLogs(date || undefined, offset);
      if (result.ok) {
        setLogs(result.data);
      } else {
        setErrorNotice(result.error);
      }
    } catch {
      setErrorNotice("Unable to refresh saved kitchen activity. Please retry.");
    }
  };

  useEffect(() => {
    let isActive = true;
    setIsBusy(true);
    setErrorNotice("");

    Promise.all([
      listMenuItems(),
      listActivityLogs(filterDate || undefined, page * 100),
    ])
      .then(([itemsRes, logsRes]) => {
        if (!isActive) return;
        if (itemsRes.ok) setMenu(itemsRes.data);
        else setErrorNotice(itemsRes.error);

        if (logsRes.ok) setLogs(logsRes.data);
        else setErrorNotice(logsRes.error);
      })
      .catch(() => {
        if (isActive) setErrorNotice("Unable to load kitchen records.");
      })
      .finally(() => {
        if (isActive) setIsBusy(false);
      });

    return () => {
      isActive = false;
    };
  }, [filterDate, page]);

  // Operational metrics summary
  const metrics = useMemo(() => {
    const totalRecords = logs.length;
    const totalPrepared = logs.reduce((sum, item) => sum + (Number(item.prepared) || 0), 0);
    const totalServed = logs.reduce((sum, item) => sum + (Number(item.served) || 0), 0);
    const totalLeftovers = logs.reduce((sum, item) => sum + (Number(item.leftover) || 0), 0);
    const totalDiners = logs.reduce((sum, item) => sum + (Number(item.attendance) || 0), 0);
    const surplusPct = totalPrepared > 0 ? ((totalLeftovers / totalPrepared) * 100).toFixed(1) : "0.0";

    return {
      totalRecords,
      totalPrepared,
      totalServed,
      totalLeftovers,
      totalDiners,
      surplusPct,
    };
  }, [logs]);

  // Save or update an activity log
  const handleSave = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setIsBusy(true);
    setErrorNotice("");
    setSuccessNotice("");

    try {
      const result = await saveActivityLog(form, editingId);
      if (!result.ok) {
        setErrorNotice(result.error);
        return;
      }

      setEditingId(undefined);
      setForm(createBlankActivityInput());
      await loadData();
      setSuccessNotice(
        editingId ? "Activity log updated successfully." : "Daily kitchen activity saved successfully."
      );
    } catch {
      setErrorNotice("Unable to reach the server. Your entry has not been cleared.");
    } finally {
      setIsBusy(false);
    }
  };

  // OCR Batch Import
  const handleOcrConfirmLogs = async (extracted: ActivityInput[]): Promise<void> => {
    setIsBusy(true);
    setErrorNotice("");
    setSuccessNotice("");

    try {
      let savedCount = 0;
      for (const item of extracted) {
        const res = await saveActivityLog(item);
        if (res.ok) savedCount++;
      }
      await loadData();
      setSuccessNotice(
        `Successfully imported and verified ${savedCount} daily kitchen record${
          savedCount === 1 ? "" : "s"
        } from register scan.`
      );
    } catch {
      setErrorNotice("Unable to save activity logs from register scan.");
    } finally {
      setIsBusy(false);
    }
  };

  // Delete an activity log
  const handleRemove = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this meal activity record?")) return;
    setIsBusy(true);
    setErrorNotice("");
    setSuccessNotice("");

    try {
      const result = await deleteActivityLog(id);
      if (result.ok) {
        await loadData();
        setSuccessNotice("Activity log removed.");
      } else {
        setErrorNotice(result.error);
      }
    } catch {
      setErrorNotice("Unable to reach the server.");
    } finally {
      setIsBusy(false);
    }
  };

  // Populate form for editing
  const handleStartEdit = (log: ActivityLog): void => {
    setEditingId(log.id);
    setForm({
      menu_item_id: log.menu_item_id,
      service_date: log.service_date,
      meal_service: log.meal_service,
      prepared: log.prepared,
      served: log.served,
      leftover: log.leftover,
      attendance: log.attendance,
      notes: log.notes,
    });
    setSuccessNotice("Editing saved record. Review and update the form fields above.");
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleCancelEdit = (): void => {
    setEditingId(undefined);
    setForm(createBlankActivityInput());
  };

  // Live balance calculation
  const calculatedLeftover = Math.max(0, form.prepared - form.served);
  const isPortionBalanced = form.prepared === form.served + form.leftover;

  const handleAutoBalanceLeftover = (): void => {
    setForm((prev) => ({ ...prev, leftover: calculatedLeftover }));
  };

  return (
    <WorkspaceShell
      title="Daily Kitchen Activity & Surplus Logs"
      description="Record cooked portions, served meals, and leftover surplus across each shift to calibrate demand forecasting."
    >
      {/* Alert Notices */}
      {errorNotice && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-2xl text-sm font-semibold border border-red-200"
        >
          <AlertCircle size={18} className="shrink-0 text-red-700" />
          <span className="flex-1">{errorNotice}</span>
          <button
            type="button"
            onClick={() => setErrorNotice("")}
            className="text-red-700/60 hover:text-red-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {successNotice && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 bg-sage rounded-2xl text-forest text-sm font-semibold border border-forest/15"
        >
          <CheckCircle2 size={18} className="shrink-0 text-forest" />
          <span className="flex-1">{successNotice}</span>
          <button
            type="button"
            onClick={() => setSuccessNotice("")}
            className="text-forest/60 hover:text-forest"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Register Photo OCR Modal */}
      <OcrRegisterImportModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onConfirmLogs={handleOcrConfirmLogs}
        menu={menu}
      />

      {/* SECTION 1: Kitchen Metrics Overview */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-line-light p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
              Recorded Meals
            </span>
            <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
              <ClipboardCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-ink">{metrics.totalRecords.toLocaleString()}</p>
          <p className="text-xs text-ink-secondary">Logged service shifts</p>
        </div>

        <div className="rounded-2xl bg-white border border-line-light p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
              Total Prepared
            </span>
            <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
              <ChefHat size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-ink">{metrics.totalPrepared.toLocaleString()}</p>
          <p className="text-xs text-ink-secondary">Total cooked portions</p>
        </div>

        <div className="rounded-2xl bg-white border border-line-light p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
              Total Served
            </span>
            <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
              <Utensils size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-ink">{metrics.totalServed.toLocaleString()}</p>
          <p className="text-xs text-ink-secondary">Portions consumed</p>
        </div>

        <div className="rounded-2xl bg-white border border-line-light p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
              Surplus Leftovers
            </span>
            <div className="w-8 h-8 rounded-xl bg-lime/30 text-forest flex items-center justify-center shrink-0">
              <Scale size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-ink">{metrics.totalLeftovers.toLocaleString()}</p>
            <span className="text-xs font-bold text-forest bg-sage px-3 py-1 rounded-full">
              {metrics.surplusPct}%
            </span>
          </div>
          <p className="text-xs text-ink-secondary">Surplus safety cushion</p>
        </div>
      </section>

      {/* SECTION 2: Form to Log or Edit Activity */}
      <form
        onSubmit={handleSave}
        className="rounded-3xl bg-white border border-line-light p-6 shadow-xs space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sage text-forest flex items-center justify-center shrink-0">
              <Utensils size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-ink">
                  {editingId ? "Edit Kitchen Activity Record" : "Log Meal Service Activity"}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sage text-forest">
                  Shift Ledger
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-1">
                Record exact cooked portions, plates served, and leftover surplus
              </p>
            </div>
          </div>

          {!editingId && (
            <button
              type="button"
              disabled={isBusy || !menu.length}
              onClick={() => setIsOcrOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <ScanLine size={16} />
              <span>Scan Paper Register</span>
            </button>
          )}
        </div>

        {!menu.length && !isBusy && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
            <span>No menu dishes found. Please create your kitchen menu items before logging daily activity.</span>
            <Link
              href="/menu"
              className="px-3 py-2 rounded-xl bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all"
            >
              Add dishes in Menu
            </Link>
          </div>
        )}

        {/* Group 1: Service Context */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
            1. Service Context
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                Service Date
              </label>
              <input
                required
                type="date"
                value={form.service_date}
                className={inputControlClass}
                onChange={(e) => setForm({ ...form, service_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                Meal Shift
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-canvas border border-line-light">
                {(["breakfast", "lunch", "dinner"] as const).map((shift) => {
                  const isSelected = form.meal_service === shift;
                  return (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => setForm({ ...form, meal_service: shift })}
                      className={`py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        isSelected
                          ? "bg-forest text-lime shadow-xs"
                          : "text-ink-secondary hover:text-ink"
                      }`}
                    >
                      {shift}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                Menu Item Dish
              </label>
              <select
                required
                className={inputControlClass}
                value={form.menu_item_id}
                onChange={(e) => setForm({ ...form, menu_item_id: e.target.value })}
              >
                <option value="">Select a saved menu dish</option>
                {menu.map((dish) => (
                  <option value={dish.id} key={dish.id}>
                    {dish.name} {dish.category ? `(${dish.category})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Group 2: Portions Ledger */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
              2. Portion Ledger &amp; Wastage Balance
            </h3>
            <span className="text-xs text-ink-secondary font-medium">
              Rule: Prepared = Served + Leftover
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                Prepared (Cooked Portions)
              </label>
              <input
                required
                type="number"
                min="0"
                max="2147483647"
                step="1"
                placeholder="e.g. 200"
                className={inputControlClass}
                value={form.prepared || ""}
                onChange={(e) => setForm({ ...form, prepared: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                Served (Plates Consumed)
              </label>
              <input
                required
                type="number"
                min="0"
                max="2147483647"
                step="1"
                placeholder="e.g. 192"
                className={inputControlClass}
                value={form.served || ""}
                onChange={(e) => setForm({ ...form, served: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                Leftover (Surplus Remaining)
              </label>
              <input
                required
                type="number"
                min="0"
                max="2147483647"
                step="1"
                placeholder="e.g. 8"
                className={inputControlClass}
                value={form.leftover || ""}
                onChange={(e) => setForm({ ...form, leftover: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                Diner Attendance (Headcount)
              </label>
              <input
                required
                type="number"
                min="0"
                max="2147483647"
                step="1"
                placeholder="e.g. 185"
                className={inputControlClass}
                value={form.attendance || ""}
                onChange={(e) => setForm({ ...form, attendance: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Live Balance / Calculation Feedback Banner */}
          {form.prepared > 0 && (
            <div
              className={`p-4 rounded-xl border text-xs font-semibold flex flex-wrap items-center justify-between gap-3 ${
                isPortionBalanced
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : "bg-amber-50/80 border-amber-200 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {isPortionBalanced ? (
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-amber-700 shrink-0" />
                )}
                <span>
                  {isPortionBalanced
                    ? `Portion ledger balanced: ${form.prepared} prepared = ${form.served} served + ${
                        form.leftover
                      } leftover (${((form.leftover / form.prepared) * 100).toFixed(1)}% surplus).`
                    : `Discrepancy: ${form.prepared} prepared vs ${form.served + form.leftover} (served + leftover).`}
                </span>
              </div>

              {!isPortionBalanced && (
                <button
                  type="button"
                  onClick={handleAutoBalanceLeftover}
                  className="px-3 py-1 rounded-lg bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all cursor-pointer shadow-xs"
                >
                  Auto-set leftover to {calculatedLeftover}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Group 3: Kitchen Notes */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-ink">
            Operational Notes (Optional)
          </label>
          <textarea
            className={inputControlClass}
            maxLength={2000}
            rows={2}
            placeholder="e.g. Rainy afternoon caused turnout drop; extra curry redistributed to evening staff mess."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-line-light">
          <button
            type="submit"
            disabled={isBusy || !menu.length}
            className="px-6 py-3 bg-forest text-lime rounded-xl font-bold hover:bg-forest-dark transition-all disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-2"
          >
            <Plus size={16} />
            <span>{editingId ? "Update Activity Log" : "Save Activity Record"}</span>
          </button>

          {editingId && (
            <button
              type="button"
              disabled={isBusy}
              onClick={handleCancelEdit}
              className="px-4 py-3 rounded-xl border border-line-light bg-white text-ink-secondary hover:text-ink font-semibold transition-all cursor-pointer"
            >
              Cancel Edit
            </button>
          )}

          <button
            type="button"
            onClick={() => setForm(createBlankActivityInput())}
            className="px-3 py-2 text-xs font-semibold text-ink-secondary hover:text-ink flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset form</span>
          </button>
        </div>
      </form>

      {/* SECTION 3: Saved Activity Records Table */}
      <section
        className="rounded-3xl bg-white border border-line-light p-6 shadow-xs space-y-5"
        aria-busy={isBusy}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-light">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-ink">Saved Kitchen Activity</h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sage text-forest">
                {logs.length} record{logs.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="text-xs text-ink-secondary mt-1">
              Historical ledger used to train your kitchen demand model
            </p>
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-canvas px-3 py-2 rounded-xl border border-line-light">
              <Filter size={14} className="text-ink-secondary" />
              <input
                type="date"
                value={filterDate}
                className="bg-transparent text-xs font-bold text-ink focus:outline-none"
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {filterDate && (
              <button
                type="button"
                onClick={() => {
                  setFilterDate("");
                  setPage(0);
                }}
                className="px-3 py-2 rounded-xl bg-sage text-forest text-xs font-bold hover:bg-forest hover:text-lime transition-all cursor-pointer"
              >
                Show all dates
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {!logs.length && !isBusy && (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sage text-forest flex items-center justify-center mx-auto">
              <ClipboardCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-ink">No Activity Logs Found</h3>
            <p className="text-xs text-ink-secondary max-w-sm mx-auto">
              {filterDate
                ? "No meal services recorded for this date filter. Clear the date filter or log a service above."
                : "No saved meal records found. Start by logging your latest breakfast or lunch above, or scan a physical register sheet."}
            </p>
          </div>
        )}

        {/* Desktop Ledger Table */}
        {logs.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line-light text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Shift</th>
                  <th className="py-3 px-4">Menu Dish</th>
                  <th className="py-3 px-3 text-right">Prepared</th>
                  <th className="py-3 px-3 text-right">Served</th>
                  <th className="py-3 px-3 text-right">Leftover</th>
                  <th className="py-3 px-3 text-right">Surplus %</th>
                  <th className="py-3 px-3 text-right">Diners</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-light text-sm">
                {logs.map((log) => {
                  const dish = menu.find((item) => item.id === log.menu_item_id);
                  const prep = Number(log.prepared) || 0;
                  const left = Number(log.leftover) || 0;
                  const surplusRate = prep > 0 ? ((left / prep) * 100).toFixed(1) : "0.0";
                  const rateNum = Number(surplusRate);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-canvas/50 transition-colors group"
                    >
                      <td className="py-3 px-3 font-semibold text-ink whitespace-nowrap">
                        {log.service_date}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                            log.meal_service === "breakfast"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : log.meal_service === "lunch"
                              ? "bg-sage text-forest border border-forest/15"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}
                        >
                          {log.meal_service}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-ink">
                        <div>
                          <span>{dish?.name || "Saved Menu Dish"}</span>
                          {dish?.category && (
                            <span className="block text-xs font-medium text-ink-secondary">
                              {dish.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-ink">
                        {log.prepared}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-ink-secondary">
                        {log.served}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-ink">
                        {log.leftover}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                            rateNum <= 5
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : rateNum <= 10
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {surplusRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-ink-secondary">
                        {log.attendance}
                      </td>
                      <td className="py-3 px-4 text-xs text-ink-secondary max-w-xs truncate">
                        {log.notes || "—"}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleStartEdit(log)}
                            aria-label="Edit record"
                            className="p-2 rounded-lg text-forest hover:bg-sage transition-colors cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleRemove(log.id)}
                            aria-label="Delete record"
                            className="p-2 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Ledger Cards (Responsive view) */}
        {logs.length > 0 && (
          <div className="md:hidden space-y-3">
            {logs.map((log) => {
              const dish = menu.find((item) => item.id === log.menu_item_id);
              const prep = Number(log.prepared) || 0;
              const left = Number(log.leftover) || 0;
              const surplusRate = prep > 0 ? ((left / prep) * 100).toFixed(1) : "0.0";

              return (
                <div
                  key={log.id}
                  className="rounded-2xl border border-line-light p-4 bg-canvas/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-ink text-sm">
                        {dish?.name || "Saved Menu Dish"}
                      </h4>
                      <p className="text-xs text-ink-secondary">
                        {log.service_date} ·{" "}
                        <span className="capitalize font-semibold">{log.meal_service}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(log)}
                        className="p-2 text-forest hover:bg-sage rounded-lg"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemove(log.id)}
                        className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs bg-white p-3 rounded-xl border border-line-light">
                    <div>
                      <span className="text-ink-secondary text-xs block">Prep</span>
                      <strong className="text-ink">{log.prepared}</strong>
                    </div>
                    <div>
                      <span className="text-ink-secondary text-xs block">Served</span>
                      <strong className="text-ink">{log.served}</strong>
                    </div>
                    <div>
                      <span className="text-ink-secondary text-xs block">Left</span>
                      <strong className="text-ink">{log.leftover}</strong>
                    </div>
                    <div>
                      <span className="text-ink-secondary text-xs block">Surplus</span>
                      <strong className="text-forest">{surplusRate}%</strong>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-xs text-ink-secondary italic bg-white/60 p-2 rounded-lg">
                      {log.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-line-light">
          <button
            type="button"
            disabled={isBusy || !page}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-line-light text-xs font-bold text-ink disabled:opacity-40 hover:bg-canvas transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <span className="text-xs font-bold text-ink-secondary">
            Page {page + 1}
          </span>

          <button
            type="button"
            disabled={isBusy || logs.length < 100}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-line-light text-xs font-bold text-ink disabled:opacity-40 hover:bg-canvas transition-colors cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </WorkspaceShell>
  );
};
export default ActivityWorkspace;
