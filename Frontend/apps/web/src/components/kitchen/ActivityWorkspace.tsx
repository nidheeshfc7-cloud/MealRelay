"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Info,
  RefreshCw,
  ScanLine,
  UtensilsCrossed,
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
import { RecordsToolbar, type ShiftFilterKey } from "./records/RecordsToolbar";
import { RecordsMetricBento, type KitchenRecordsMetrics } from "./records/RecordsMetricBento";
import { RecordsLedgerTable, type AuditTabFilterKey } from "./records/RecordsLedgerTable";
import { FastMealLoggerModal } from "./records/FastMealLoggerModal";
import { RecordsDeleteConfirmModal } from "./records/RecordsDeleteConfirmModal";

const WORKSPACE_TABS = [
  { label: "Daily Records & Activity", href: "/records", Icon: ClipboardList },
  { label: "Menu Management", href: "/menu", Icon: UtensilsCrossed },
  { label: "Cooking Plan", href: "/dashboard", Icon: ChefHat },
] as const;

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

export const ActivityWorkspace: React.FC = () => {
  const pathname = usePathname();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [form, setForm] = useState<ActivityInput>(createBlankActivityInput);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [deletingLog, setDeletingLog] = useState<ActivityLog | null>(null);

  // Filters & Search
  const [shiftFilter, setShiftFilter] = useState<ShiftFilterKey>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [auditTab, setAuditTab] = useState<AuditTabFilterKey>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadData = useCallback(async (isManual: boolean = false): Promise<void> => {
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
      setErrorMessage("Unable to connect to kitchen server. Please check your network.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Overall aggregates for Bento Metric Cards
  const metrics = useMemo<KitchenRecordsMetrics>(() => {
    const totalRecords = logs.length;
    const totalPrepared = logs.reduce((sum, item) => sum + (Number(item.prepared) || 0), 0);
    const totalServed = logs.reduce((sum, item) => sum + (Number(item.served) || 0), 0);
    const totalLeftovers = logs.reduce((sum, item) => sum + (Number(item.leftover) || 0), 0);
    const totalDiners = logs.reduce((sum, item) => sum + (Number(item.attendance) || 0), 0);
    const surplusPct =
      totalPrepared > 0 ? ((totalLeftovers / totalPrepared) * 100).toFixed(1) : "0.0";
    const servedRate =
      totalPrepared > 0 ? ((totalServed / totalPrepared) * 100).toFixed(1) : "0.0";

    const shiftCounts = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
    };

    logs.forEach((log) => {
      if (log.meal_service in shiftCounts) {
        shiftCounts[log.meal_service]++;
      }
    });

    return {
      totalRecords,
      totalPrepared,
      totalServed,
      totalLeftovers,
      totalDiners,
      surplusPct,
      servedRate,
      shiftCounts,
    };
  }, [logs]);

  // Filtered logs based on search, shift, date, and audit tab
  const allFilteredLogs = useMemo(() => {
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

      if (auditTab !== "all") {
        const prep = Number(log.prepared) || 0;
        const left = Number(log.leftover) || 0;
        if (prep === 0) return false;
        const rate = (left / prep) * 100;

        if (auditTab === "optimal" && (rate < 2.5 || rate > 5.5)) return false;
        if (auditTab === "high_surplus" && rate <= 5.5) return false;
        if (auditTab === "shortage_risk" && rate >= 2.5) return false;
      }

      return true;
    });
  }, [logs, menu, shiftFilter, dateFilter, searchQuery, auditTab]);

  const totalPages = Math.max(1, Math.ceil(allFilteredLogs.length / pageSize));

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allFilteredLogs.slice(start, start + pageSize);
  }, [allFilteredLogs, currentPage, pageSize]);

  // Handle open create modal
  const handleOpenCreate = (): void => {
    setEditingId(undefined);
    setForm({
      ...createBlankActivityInput(),
      menu_item_id: menu[0]?.id || "",
      service_date: dateFilter || getTodayString(),
    });
    setIsLogModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (log: ActivityLog): void => {
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
    setIsLogModalOpen(true);
  };

  // Handle Save
  const handleSave = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await saveActivityLog(form, editingId);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setIsLogModalOpen(false);
      setEditingId(undefined);
      setForm(createBlankActivityInput());
      await loadData();
      setSuccessMessage(
        editingId
          ? "Meal service record updated successfully."
          : "Daily kitchen service record saved to ledger."
      );
    } catch {
      setErrorMessage("Unable to save activity log. Please check server connection.");
    } finally {
      setIsSaving(false);
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

  // Delete flow
  const handleDeleteTrigger = (log: ActivityLog): void => {
    setDeletingLog(log);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deletingLog) return;
    setIsDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await deleteActivityLog(deletingLog.id);
      if (result.ok) {
        setDeletingLog(null);
        await loadData();
        setSuccessMessage("Service record removed from ledger.");
      } else {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage("Unable to delete record from server.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear all filters
  const handleClearFilters = (): void => {
    setShiftFilter("all");
    setSearchQuery("");
    setDateFilter("");
    setAuditTab("all");
    setCurrentPage(1);
  };

  // CSV Export handler
  const handleExportCSV = (): void => {
    if (allFilteredLogs.length === 0) {
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

    const rows = allFilteredLogs.map((log) => {
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
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row font-sans selection:bg-lime selection:text-forest-dark">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Universal Standard Header (Matching /analytics & /settings) */}
        <Header
          title="Daily Meal Records & Surplus Ledger"
          subtitle="Daily Service Tracker · Prep Quantities, Diner Turnout & Leftover Cushion"
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadData(true)}
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

        {/* Workflow Sub-Navigation Bar (Matching WorkspaceShell & Other Pages) */}
        <nav
          aria-label="Kitchen workflows"
          className="flex items-center gap-2 flex-wrap border-b border-line-light pb-4"
        >
          {WORKSPACE_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const TabIcon = tab.Icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all ${
                  isActive
                    ? "bg-forest text-lime border-forest font-bold shadow-xs"
                    : "bg-white border-line-light text-ink-secondary hover:text-ink hover:bg-canvas font-semibold"
                }`}
              >
                <TabIcon size={15} className={isActive ? "text-lime" : "text-ink-secondary"} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Feedback Notifications */}
        {errorMessage ? (
          <div
            role="alert"
            className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-2xl text-xs font-semibold border border-red-200"
          >
            <AlertCircle size={16} className="shrink-0 text-red-700" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="text-red-700 hover:text-red-900 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="flex items-center gap-3 p-4 bg-sage rounded-2xl text-forest text-xs font-semibold border border-forest/15"
          >
            <CheckCircle2 size={16} className="shrink-0 text-forest" />
            <span className="flex-1">{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-forest/60 hover:text-forest cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        {/* 1. Clear, Non-Technical Hero Metric Cards (Exact KitchenImpactCards Pattern) */}
        <RecordsMetricBento
          metrics={metrics}
          selectedShift={shiftFilter}
          onSelectShift={(shift) => {
            setShiftFilter(shift);
            setCurrentPage(1);
          }}
        />

        {/* Operational Context Callout (Exact SimplifiedAuditTable Pattern) */}
        <div className="p-4 rounded-2xl bg-canvas border border-line-light flex items-start gap-3 text-xs text-ink-secondary">
          <Info size={16} className="text-forest shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-ink font-bold">Why log daily cooked and leftover quantities?</strong> MealRelay’s forecasting engine learns your hostel’s real day-of-week attendance patterns from historical records. Maintaining a lean leftover buffer (3–5%) prevents food shortages while stopping avoidable food waste before cooking starts.
          </p>
        </div>

        {/* 2. Filter & Action Toolbar (Exact SimplifiedAuditTable Search & Filter Pattern) */}
        <RecordsToolbar
          dateFilter={dateFilter}
          onDateChange={(val) => {
            setDateFilter(val);
            setCurrentPage(1);
          }}
          selectedShift={shiftFilter}
          onShiftChange={(shift) => {
            setShiftFilter(shift);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            setCurrentPage(1);
          }}
          onOpenCreate={handleOpenCreate}
          onOpenOcr={() => setIsOcrOpen(true)}
          onExport={handleExportCSV}
          onRefresh={() => void loadData(true)}
          isRefreshing={isRefreshing || isLoading}
          totalFilteredCount={allFilteredLogs.length}
        />

        {/* 3. Streamlined Daily Kitchen Log Table with Spreadsheet Export (Exact SimplifiedAuditTable Pattern) */}
        <RecordsLedgerTable
          records={paginatedLogs}
          allFilteredRecords={allFilteredLogs}
          menu={menu}
          activeTab={auditTab}
          onTabChange={(tab) => {
            setAuditTab(tab);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteTrigger}
          onOpenCreate={handleOpenCreate}
          onClearFilters={handleClearFilters}
        />

        {/* Fast Kitchen Logger Modal */}
        <FastMealLoggerModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          form={form}
          onChange={setForm}
          onSubmit={handleSave}
          menu={menu}
          isEditing={Boolean(editingId)}
          isSaving={isSaving}
        />

        {/* Delete Confirmation Modal */}
        <RecordsDeleteConfirmModal
          isOpen={Boolean(deletingLog)}
          onClose={() => setDeletingLog(null)}
          onConfirm={handleConfirmDelete}
          log={deletingLog}
          menu={menu}
          isDeleting={isDeleting}
        />

        {/* OCR Register Import Modal */}
        <OcrRegisterImportModal
          isOpen={isOcrOpen}
          onClose={() => setIsOcrOpen(false)}
          onConfirmLogs={handleOcrConfirmLogs}
          menu={menu}
        />
      </main>
    </div>
  );
};

export default ActivityWorkspace;
