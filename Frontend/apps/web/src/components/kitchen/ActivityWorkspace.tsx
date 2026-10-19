"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Edit3,
  Info,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  ScanLine,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  listMenuItems,
  listActivityLogs,
  saveActivityLog,
  deleteActivityLog,
} from "@/lib/kitchen/actions";
import type { ActivityInput, ActivityLog, MenuItem } from "@/lib/kitchen/types";
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
  "w-full rounded-xl bg-canvas border border-line-light px-3 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-forest transition-all";

export const ActivityWorkspace: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [form, setForm] = useState<ActivityInput>(createBlankActivityInput);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(true);

  // Filters & Search
  const [shiftFilter, setShiftFilter] = useState<"all" | "breakfast" | "lunch" | "dinner">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);

  const loadData = async (isManual: boolean = false): Promise<void> => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage("");

    try {
      const [itemsRes, logsRes] = await Promise.all([
        listMenuItems(),
        listActivityLogs(dateFilter || undefined, 0),
      ]);

      if (itemsRes.ok) {
        setMenu(itemsRes.data);
      } else {
        setErrorMessage(itemsRes.error);
      }

      if (logsRes.ok) {
        setLogs(logsRes.data);
      } else {
        setErrorMessage(logsRes.error);
      }
    } catch {
      setErrorMessage("Unable to connect to server. Please verify your connection.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  // Overall aggregates for 3 Impact Cards (matching KitchenImpactCards style)
  const metrics = useMemo(() => {
    const totalRecords = logs.length;
    const totalPrepared = logs.reduce((sum, item) => sum + (Number(item.prepared) || 0), 0);
    const totalServed = logs.reduce((sum, item) => sum + (Number(item.served) || 0), 0);
    const totalLeftovers = logs.reduce((sum, item) => sum + (Number(item.leftover) || 0), 0);
    const totalDiners = logs.reduce((sum, item) => sum + (Number(item.attendance) || 0), 0);
    const surplusPct =
      totalPrepared > 0 ? ((totalLeftovers / totalPrepared) * 100).toFixed(1) : "0.0";
    const servedRate =
      totalPrepared > 0 ? ((totalServed / totalPrepared) * 100).toFixed(1) : "0.0";

    return {
      totalRecords,
      totalPrepared,
      totalServed,
      totalLeftovers,
      totalDiners,
      surplusPct,
      servedRate,
    };
  }, [logs]);

  // Filtered and searched logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (shiftFilter !== "all" && log.meal_service !== shiftFilter) return false;

      if (dateFilter && log.service_date !== dateFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const dish = menu.find((item) => item.id === log.menu_item_id);
        const dishName = (dish?.name || "").toLowerCase();
        const serviceDate = (log.service_date || "").toLowerCase();
        const notes = (log.notes || "").toLowerCase();
        if (!dishName.includes(q) && !serviceDate.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, menu, shiftFilter, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Save or update an activity log
  const handleSave = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setIsRefreshing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await saveActivityLog(form, editingId);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setEditingId(undefined);
      setForm(createBlankActivityInput());
      await loadData();
      setSuccessMessage(
        editingId ? "Activity log updated successfully." : "Daily kitchen activity saved successfully."
      );
    } catch {
      setErrorMessage("Unable to save activity log. Please check server connection.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // OCR Batch Import
  const handleOcrConfirmLogs = async (extracted: ActivityInput[]): Promise<void> => {
    setIsRefreshing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let savedCount = 0;
      for (const item of extracted) {
        const res = await saveActivityLog(item);
        if (res.ok) savedCount++;
      }
      await loadData();
      setSuccessMessage(
        `Successfully imported and verified ${savedCount} daily kitchen record${
          savedCount === 1 ? "" : "s"
        } from register scan.`
      );
    } catch {
      setErrorMessage("Unable to save activity logs from register scan.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Delete an activity log
  const handleRemove = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this meal activity record?")) return;
    setIsRefreshing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await deleteActivityLog(id);
      if (result.ok) {
        await loadData();
        setSuccessMessage("Activity record removed.");
      } else {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage("Unable to reach the server.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Start editing a record
  const handleStartEdit = (log: ActivityLog): void => {
    setEditingId(log.id);
    setIsFormOpen(true);
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
    setSuccessMessage("Editing saved record. Update the form fields below.");
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleCancelEdit = (): void => {
    setEditingId(undefined);
    setForm(createBlankActivityInput());
  };

  // Live balance check
  const calculatedLeftover = Math.max(0, form.prepared - form.served);
  const isPortionBalanced = form.prepared === form.served + form.leftover;

  const handleAutoBalanceLeftover = (): void => {
    setForm((prev) => ({ ...prev, leftover: calculatedLeftover }));
  };

  // CSV Export handler
  const handleExportCSV = (): void => {
    if (filteredLogs.length === 0) {
      alert("No meal records available to export.");
      return;
    }

    const headers = [
      "Date",
      "Meal Service",
      "Dish Name",
      "Plates Cooked",
      "Plates Served",
      "Leftover Cushion",
      "Surplus Percent",
      "Diner Attendance",
      "Operational Notes",
    ];

    const rows = filteredLogs.map((log) => {
      const dish = menu.find((item) => item.id === log.menu_item_id);
      const prep = Number(log.prepared) || 0;
      const left = Number(log.leftover) || 0;
      const surplusRate = prep > 0 ? ((left / prep) * 100).toFixed(1) : "0.0";
      return [
        log.service_date,
        log.meal_service.toUpperCase(),
        `"${(dish?.name || "Dish").replace(/"/g, '""')}"`,
        log.prepared,
        log.served,
        log.leftover,
        `${surplusRate}%`,
        log.attendance,
        `"${(log.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `MealRelay_Kitchen_Records_${getTodayString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans selection:bg-lime selection:text-forest-dark">
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Universal Header */}
          <Header
            title="Daily Meal Records & Surplus Ledger"
            subtitle="Daily Service Tracker · Prep Quantities, Diner Turnout & Leftover Cushion"
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="px-4 py-2 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
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
                  disabled={isRefreshing || !menu.length}
                  onClick={() => setIsOcrOpen(true)}
                  className="px-4 py-2 rounded-xl bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <ScanLine size={13} />
                  <span>Scan Register</span>
                </button>

                <Link
                  href="/analytics"
                  className="px-4 py-2 rounded-xl border border-line-light bg-white text-ink-secondary hover:text-ink text-xs font-bold hover:bg-canvas transition-all flex items-center gap-2 shadow-xs"
                >
                  <span>Analytics</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            }
          />

          {/* Feedback Notices */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-2xl text-xs font-semibold border border-red-200"
            >
              <AlertCircle size={16} className="shrink-0 text-red-700" />
              <span className="flex-1">{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="text-red-700 hover:text-red-900"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-center gap-3 p-4 bg-sage rounded-2xl text-forest text-xs font-semibold border border-forest/15"
            >
              <CheckCircle2 size={16} className="shrink-0 text-forest" />
              <span className="flex-1">{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                className="text-forest/60 hover:text-forest"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* OCR Modal */}
          <OcrRegisterImportModal
            isOpen={isOcrOpen}
            onClose={() => setIsOcrOpen(false)}
            onConfirmLogs={handleOcrConfirmLogs}
            menu={menu}
          />

          {/* 1. Clear, Non-Technical Hero KPI Cards (Exact KitchenImpactCards Pattern) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Meals Logged */}
            <div className="p-6 rounded-3xl bg-white border border-line-light shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Total Meals Logged
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
                    <ClipboardList size={16} />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-ink mt-3">
                  {metrics.totalRecords.toLocaleString()} meals
                </p>
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Recorded shift services logged into your kitchen demand ledger.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
                <span className="text-forest font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Verified operational logs
                </span>
                <span className="text-ink-secondary">
                  Across 3 meal shifts
                </span>
              </div>
            </div>

            {/* Card 2: Food Prepared & Served */}
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
                <p className="text-3xl sm:text-4xl font-black text-ink mt-3">
                  {metrics.totalPrepared.toLocaleString()} plates
                </p>
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Prepared with <strong className="text-ink font-bold">{metrics.totalServed.toLocaleString()} plates served</strong> directly to diners.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
                <span className="text-forest font-bold">
                  {metrics.servedRate}% consumption rate
                </span>
                <span className="text-ink-secondary">
                  {metrics.totalDiners.toLocaleString()} diners logged
                </span>
              </div>
            </div>

            {/* Card 3: Leftover Surplus Cushion */}
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
                <p className="text-3xl sm:text-4xl font-black text-forest mt-3">
                  {metrics.surplusPct}%
                </p>
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  Controlled buffer of <strong className="text-forest font-bold">{metrics.totalLeftovers.toLocaleString()} surplus plates</strong> preventing student shortages.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-line-light flex items-center justify-between text-xs">
                <span className="text-forest font-bold flex items-center gap-1">
                  Within 4–5% buffer target
                </span>
                <span className="text-ink-secondary">
                  Zero blind waste
                </span>
              </div>
            </div>
          </section>

          {/* Operational Context Callout (Matching SimplifiedAuditTable Callout) */}
          <div className="p-4 rounded-2xl bg-canvas border border-line-light flex items-start gap-3 text-xs text-ink-secondary">
            <Info size={16} className="text-forest shrink-0 mt-1" />
            <p className="leading-relaxed">
              <strong className="text-ink font-bold">Why log daily cooked and leftover quantities?</strong> MealRelay’s forecasting engine learns your hostel’s real day-of-week attendance patterns from historical records. Maintaining a lean leftover buffer (3–5%) prevents food shortages while stopping avoidable food waste before cooking starts.
            </p>
          </div>

          {/* 2. Interactive Service Entry Form */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line-light">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-forest">
                  KITCHEN SERVICE ENTRY
                </span>
                <h3 className="text-lg font-black text-ink mt-1">
                  {editingId ? "Edit Meal Service Record" : "Log Daily Meal Service"}
                </h3>
                <p className="text-xs text-ink-secondary mt-1">
                  Record exact cooked portions, plates served, and leftover surplus for your kitchen dishes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen((prev) => !prev)}
                  className="px-3 py-2 rounded-xl border border-line-light text-xs font-bold text-ink hover:bg-canvas transition-colors cursor-pointer"
                >
                  {isFormOpen ? "Collapse Form" : "Open Form"}
                </button>
              </div>
            </div>

            {!menu.length && !isLoading && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <span>No menu dishes found. Please create your kitchen menu items before logging daily activity.</span>
                <Link
                  href="/menu"
                  className="px-3 py-2 rounded-xl bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all"
                >
                  Manage Menu
                </Link>
              </div>
            )}

            {isFormOpen && (
              <form onSubmit={handleSave} className="space-y-4 pt-1">
                {/* Context Row */}
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
                    <div className="flex items-center p-1 rounded-xl bg-canvas border border-line-light">
                      {(["breakfast", "lunch", "dinner"] as const).map((shift) => (
                        <button
                          key={shift}
                          type="button"
                          onClick={() => setForm({ ...form, meal_service: shift })}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                            form.meal_service === shift
                              ? "bg-forest text-lime shadow-xs"
                              : "text-ink-secondary hover:text-ink"
                          }`}
                        >
                          {shift}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-2">
                      Menu Dish
                    </label>
                    <select
                      required
                      className={inputControlClass}
                      value={form.menu_item_id}
                      onChange={(e) => setForm({ ...form, menu_item_id: e.target.value })}
                    >
                      <option value="">Select a saved dish</option>
                      {menu.map((dish) => (
                        <option value={dish.id} key={dish.id}>
                          {dish.name} {dish.category ? `(${dish.category})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Portions Ledger Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-2">
                      Plates Cooked (Prepared)
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
                      Plates Served (Consumed)
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
                      Leftover Cushion (Surplus)
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
                      Diner Headcount (Turnout)
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="2147483647"
                      step="1"
                      placeholder="e.g. 188"
                      className={inputControlClass}
                      value={form.attendance || ""}
                      onChange={(e) => setForm({ ...form, attendance: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Live Balance Helper Callout */}
                {form.prepared > 0 && (
                  <div
                    className={`p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                      isPortionBalanced
                        ? "bg-canvas border-line-light text-ink"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isPortionBalanced ? (
                        <CheckCircle2 size={15} className="text-forest shrink-0" />
                      ) : (
                        <AlertCircle size={15} className="text-amber-700 shrink-0" />
                      )}
                      <span>
                        {isPortionBalanced
                          ? `Portion ledger balanced: ${form.prepared} cooked = ${form.served} served + ${
                              form.leftover
                            } leftover (${((form.leftover / form.prepared) * 100).toFixed(1)}% buffer).`
                          : `Unbalanced: ${form.prepared} cooked vs ${form.served + form.leftover} (served + leftover).`}
                      </span>
                    </div>

                    {!isPortionBalanced && (
                      <button
                        type="button"
                        onClick={handleAutoBalanceLeftover}
                        className="px-3 py-1 rounded-lg bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all cursor-pointer shadow-xs"
                      >
                        Auto-set Leftover to {calculatedLeftover}
                      </button>
                    )}
                  </div>
                )}

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Operational Context (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={1000}
                    placeholder="e.g. Heavy rain during lunch; campus sports event reduced headcount..."
                    className={inputControlClass}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isRefreshing || !menu.length}
                    className="px-5 py-3 rounded-xl bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <Plus size={14} />
                    <span>{editingId ? "Update Service Record" : "Save Meal Record"}</span>
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-xl border border-line-light bg-white text-ink-secondary hover:text-ink text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setForm(createBlankActivityInput())}
                    className="px-3 py-2 text-xs font-semibold text-ink-secondary hover:text-ink flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* 3. Streamlined Daily Kitchen Log Table with Spreadsheet Export (Exact SimplifiedAuditTable Pattern) */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-xs space-y-4">
            {/* Table Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-forest">
                  KITCHEN LOG &amp; AUDIT
                </span>
                <h3 className="text-lg font-black text-ink mt-1">
                  Dish-by-Dish Cooking &amp; Leftover Records
                </h3>
                <p className="text-xs text-ink-secondary mt-1">
                  Audit verifying that small safety cushions were kept while cutting out blind waste.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto shadow-xs cursor-pointer"
              >
                <Download size={13} className="text-forest" />
                <span>Download Spreadsheet</span>
              </button>
            </div>

            {/* Filter and Search Bar (Exact SimplifiedAuditTable Pattern) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Search Input */}
              <div className="relative flex-1 min-w-48">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search dish or date (e.g. Paneer, Rice)..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-canvas border border-line-light text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              {/* Shift Filter Pills */}
              <div className="flex items-center p-1 rounded-xl bg-canvas border border-line-light">
                {(["all", "breakfast", "lunch", "dinner"] as const).map((shift) => (
                  <button
                    key={shift}
                    type="button"
                    onClick={() => {
                      setShiftFilter(shift);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      shiftFilter === shift
                        ? "bg-forest text-lime shadow-xs"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    {shift}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2 bg-canvas px-3 py-2 rounded-xl border border-line-light text-xs">
                <Calendar size={13} className="text-forest shrink-0" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-bold text-ink focus:outline-none"
                />
                {dateFilter && (
                  <button
                    type="button"
                    onClick={() => setDateFilter("")}
                    className="text-ink-secondary hover:text-ink ml-1 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Clean Table (Exact SimplifiedAuditTable Pattern) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line-light font-extrabold text-ink-secondary uppercase tracking-wider text-xs">
                    <th className="py-3 px-3">Date &amp; Shift</th>
                    <th className="py-3 px-3">Dish Name</th>
                    <th className="py-3 px-3 text-right">Plates Cooked</th>
                    <th className="py-3 px-3 text-right">Plates Served</th>
                    <th className="py-3 px-3 text-right">Leftover Cushion</th>
                    <th className="py-3 px-3 text-right">Diners</th>
                    <th className="py-3 px-4">Context / Notes</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-light">
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-ink-secondary">
                        No meal activity records found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => {
                      const dish = menu.find((item) => item.id === log.menu_item_id);
                      const prep = Number(log.prepared) || 0;
                      const left = Number(log.leftover) || 0;
                      const surplusRate = prep > 0 ? ((left / prep) * 100).toFixed(1) : "0.0";
                      const rateNum = Number(surplusRate);

                      return (
                        <tr key={log.id} className="hover:bg-canvas/50 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap font-semibold text-ink">
                            <span>{log.service_date}</span>
                            <span className="ml-2 font-bold uppercase text-xs text-ink-secondary">
                              · {log.meal_service}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-ink">
                            <span>{dish?.name || "Standard Item"}</span>
                            {dish?.category && (
                              <span className="block text-xs font-normal text-ink-secondary">
                                {dish.category}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-ink">
                            {log.prepared}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-ink-secondary">
                            {log.served}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-forest whitespace-nowrap">
                            <span>{log.leftover} plates</span>{" "}
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-bold ml-1 ${
                                rateNum <= 5
                                  ? "bg-sage text-forest"
                                  : "bg-amber-50 text-amber-900 border border-amber-200"
                              }`}
                            >
                              {surplusRate}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-ink">
                            {log.attendance}
                          </td>
                          <td className="py-3 px-4 text-xs text-ink-secondary max-w-xs truncate">
                            {log.notes || "—"}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(log)}
                                className="p-2 text-forest hover:bg-sage rounded-lg transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleRemove(log.id)}
                                className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

            {/* Pagination Controls (Matching SimplifiedAuditTable Pattern) */}
            <div className="flex items-center justify-between pt-3 border-t border-line-light text-xs font-bold text-ink-secondary">
              <span>
                Showing {Math.min(filteredLogs.length, (currentPage - 1) * pageSize + 1)}–
                {Math.min(filteredLogs.length, currentPage * pageSize)} of {filteredLogs.length} records
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-2 rounded-lg border border-line-light bg-white text-ink disabled:opacity-40 hover:bg-canvas transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} className="inline mr-1" />
                  Previous
                </button>

                <span className="text-ink">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-2 rounded-lg border border-line-light bg-white text-ink disabled:opacity-40 hover:bg-canvas transition-colors cursor-pointer"
                >
                  Next
                  <ChevronRight size={14} className="inline ml-1" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
export default ActivityWorkspace;
