'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { fetchMealRecords, fetchModelMetrics } from '@/lib/api';
import { EvaluationReport, MealRecord } from '@/lib/types/api';
import {
  aggregateRecords,
  groupRecordsByCategory,
  groupRecordsByDayOfMonth,
  groupRecordsByMealSession,
  groupRecordsByMonth,
  MonthlyBucket,
} from '@/components/analytics/analyticsCalculations';
import { KitchenImpactCards } from '@/components/analytics/KitchenImpactCards';
import { DailySavingsTimelineChart } from '@/components/analytics/DailySavingsTimelineChart';
import { MealSessionDistribution } from '@/components/analytics/MealSessionDistribution';
import { SimplifiedAuditTable } from '@/components/analytics/SimplifiedAuditTable';

export default function AnalyticsPage() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [modelMetrics, setModelMetrics] = useState<EvaluationReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selected month key: e.g. "2026-10" or "all"
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all');

  const loadData = async (isManualRefresh: boolean = false): Promise<void> => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setFetchError(null);

    try {
      const [metricsRes, recordsRes] = await Promise.allSettled([
        fetchModelMetrics(),
        fetchMealRecords({ limit: 500 }),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setModelMetrics(metricsRes.value);
      }

      if (recordsRes.status === 'fulfilled') {
        setRecords(recordsRes.value);
      } else {
        setFetchError('Unable to connect to backend server. Showing local demo cache.');
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Error loading kitchen data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Group records by month dynamically
  const monthlyBuckets: MonthlyBucket[] = useMemo(() => {
    if (records.length === 0) return [];
    return groupRecordsByMonth(records);
  }, [records]);

  // Default to the latest month once loaded
  useEffect(() => {
    if (monthlyBuckets.length > 0 && selectedMonthKey === 'all') {
      setSelectedMonthKey(monthlyBuckets[0].key);
    }
  }, [monthlyBuckets, selectedMonthKey]);

  // 2. Filter records for selected month
  const activeRecords: MealRecord[] = useMemo(() => {
    if (records.length === 0) return [];
    if (selectedMonthKey === 'all') return records;
    return records.filter((r) => (r.meal_date || '').startsWith(selectedMonthKey));
  }, [records, selectedMonthKey]);

  // 3. Overall aggregates for hero cards
  const currentMetrics = useMemo(() => {
    return aggregateRecords(activeRecords);
  }, [activeRecords]);

  // 4. Daily individual timeline data (Day 1 to 30/31)
  const dailyTimelineData = useMemo(() => {
    if (activeRecords.length === 0) return [];
    return groupRecordsByDayOfMonth(activeRecords, selectedMonthKey);
  }, [activeRecords, selectedMonthKey]);

  // 5. Meal session breakdown (Breakfast, Lunch, Dinner)
  const sessionBreakdown = useMemo(() => {
    if (activeRecords.length === 0) return [];
    return groupRecordsByMealSession(activeRecords);
  }, [activeRecords]);

  // 6. Food Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (activeRecords.length === 0) return [];
    return groupRecordsByCategory(activeRecords);
  }, [activeRecords]);

  // Active Month Label
  const activeMonthLabel = useMemo(() => {
    if (selectedMonthKey === 'all') return 'All Recorded History';
    const b = monthlyBuckets.find((item) => item.key === selectedMonthKey);
    return b ? b.label : selectedMonthKey;
  }, [selectedMonthKey, monthlyBuckets]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <Header
            title="Kitchen Food & Cost Savings"
            subtitle="Daily Savings Tracker · Portion Calibration & Food Waste Prevention"
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="px-3.5 py-2 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  title="Reload metrics"
                >
                  <RefreshCw
                    size={13}
                    className={isRefreshing ? 'animate-spin text-forest' : 'text-ink-secondary'}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-xl bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>Today's Cooking Plan</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            }
          />

          {/* Simple Month Selector Bar */}
          <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-line-light shadow-xs">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-forest" />
              <span className="text-xs font-black uppercase tracking-wider text-ink">
                Viewing Month:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-canvas border border-line-light text-xs font-bold text-ink focus:outline-none cursor-pointer"
              >
                {monthlyBuckets.map((bucket) => (
                  <option key={bucket.key} value={bucket.key}>
                    {bucket.label} ({bucket.metrics.recordsCount} dishes logged)
                  </option>
                ))}
                <option value="all">All Available History ({records.length} total dishes)</option>
              </select>
            </div>
          </div>

          {/* Error Notice if offline */}
          {fetchError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
              <span>{fetchError}</span>
              <button
                onClick={() => loadData(true)}
                className="underline font-bold ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. Clear, Non-Technical Hero KPI Cards */}
          <KitchenImpactCards
            metrics={currentMetrics}
            periodLabel={activeMonthLabel}
          />

          {/* 2. Main Daily Visual Timeline: Individual Day-by-Day (Day 1 to 31) */}
          <DailySavingsTimelineChart
            dailyData={dailyTimelineData}
            monthLabel={activeMonthLabel}
          />

          {/* 3. Simple Breakdown: Meal Shifts & High-Saving Categories */}
          <MealSessionDistribution
            sessions={sessionBreakdown}
            categories={categoryBreakdown}
          />

          {/* 4. Streamlined Daily Kitchen Log Table with Spreadsheet Export */}
          <SimplifiedAuditTable
            records={activeRecords}
            monthLabel={activeMonthLabel}
          />
        </main>
      </div>
    </div>
  );
}
