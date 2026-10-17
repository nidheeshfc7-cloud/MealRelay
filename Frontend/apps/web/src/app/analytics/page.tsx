'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { fetchMealRecords, fetchModelMetrics } from '@/lib/api';
import { EvaluationReport, MealRecord } from '@/lib/types/api';
import {
  aggregateRecords,
  calculateRecordMetrics,
  calculateEsgMetrics,
  groupRecordsByCategory,
  groupRecordsByDayOfWeek,
  groupRecordsByMonth,
  groupRecordsByWeek,
  MonthlyBucket,
} from '@/components/analytics/analyticsCalculations';
import { AnalyticsKPICards } from '@/components/analytics/AnalyticsKPICards';
import { MonthlySavingsChart } from '@/components/analytics/MonthlySavingsChart';
import { ModelBenchmarkCard } from '@/components/analytics/ModelBenchmarkCard';
import { CategorySavingsChart } from '@/components/analytics/CategorySavingsChart';
import { DayOfWeekPatternChart } from '@/components/analytics/DayOfWeekPatternChart';
import { EsgMilestoneCard } from '@/components/analytics/EsgMilestoneCard';
import { AuditHistoryTable } from '@/components/analytics/AuditHistoryTable';

export default function AnalyticsPage() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [modelMetrics, setModelMetrics] = useState<EvaluationReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // View state: 'monthly' or 'weekly'
  const [timeView, setTimeView] = useState<'monthly' | 'weekly'>('monthly');
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
      } else {
        console.warn('Could not load ML evaluation metrics:', metricsRes.reason);
      }

      if (recordsRes.status === 'fulfilled') {
        setRecords(recordsRes.value);
      } else {
        console.warn('Could not load meal records:', recordsRes.reason);
        setFetchError('Failed to connect to backend server. Please verify FastAPI backend on port 8000.');
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Error loading analytics data.');
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

  // Set default selected month to latest month once records are loaded
  useEffect(() => {
    if (monthlyBuckets.length > 0 && selectedMonthKey === 'all') {
      setSelectedMonthKey(monthlyBuckets[0].key);
    }
  }, [monthlyBuckets, selectedMonthKey]);

  // 2. Active records based on selected timeview and month
  const activeRecords: MealRecord[] = useMemo(() => {
    if (records.length === 0) return [];

    if (timeView === 'weekly') {
      // Sort descending by date and take latest 7 distinct days
      const sorted = [...records].sort((a, b) => b.meal_date.localeCompare(a.meal_date));
      const dates = Array.from(new Set(sorted.map((r) => r.meal_date))).slice(0, 7);
      const datesSet = new Set(dates);
      return sorted.filter((r) => datesSet.has(r.meal_date));
    }

    if (selectedMonthKey === 'all') {
      return records;
    }

    return records.filter((r) => (r.meal_date || '').startsWith(selectedMonthKey));
  }, [records, timeView, selectedMonthKey]);

  // 3. Computed Aggregates
  const currentMetrics = useMemo(() => {
    return aggregateRecords(activeRecords);
  }, [activeRecords]);

  // 4. Weekly buckets within the selected month (for Monthly View chart)
  const weeklyBuckets = useMemo(() => {
    if (activeRecords.length === 0) return [];
    return groupRecordsByWeek(activeRecords);
  }, [activeRecords]);

  // 5. Daily data breakdown (for Weekly View chart)
  const dailyData = useMemo(() => {
    if (timeView !== 'weekly' || activeRecords.length === 0) return [];

    const dateMap = new Map<string, MealRecord[]>();
    for (const r of activeRecords) {
      if (!dateMap.has(r.meal_date)) {
        dateMap.set(r.meal_date, []);
      }
      dateMap.get(r.meal_date)!.push(r);
    }

    // Sort ascending by date
    const sortedDates = Array.from(dateMap.keys()).sort();

    return sortedDates.map((dateStr) => {
      const dayRecords = dateMap.get(dateStr) || [];
      const m = aggregateRecords(dayRecords);
      let dayLabel = dateStr;
      try {
        const d = new Date(dateStr);
        dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      } catch {
        dayLabel = dateStr;
      }

      return {
        date: dateStr,
        dayLabel,
        rupeesSaved: m.totalRupeesSaved,
        portionsRescued: m.totalPortionsRescued,
        kgSaved: m.totalKgSaved,
        prepared: m.totalPrepared,
        leftovers: m.totalLeftovers,
      };
    });
  }, [timeView, activeRecords]);

  // 6. Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (activeRecords.length === 0) return [];
    return groupRecordsByCategory(activeRecords);
  }, [activeRecords]);

  // 7. Day-of-Week Recurrent Analysis
  const dayOfWeekSummaries = useMemo(() => {
    if (activeRecords.length === 0) return [];
    return groupRecordsByDayOfWeek(activeRecords);
  }, [activeRecords]);

  // 8. ESG & Sustainability Milestones
  const esgMetrics = useMemo(() => {
    return calculateEsgMetrics(
      currentMetrics.totalKgSaved,
      currentMetrics.totalPortionsRescued,
      currentMetrics.totalRupeesSaved,
      100000
    );
  }, [currentMetrics]);

  // Active Label
  const activePeriodLabel = useMemo(() => {
    if (timeView === 'weekly') return 'Last 7 Days';
    if (selectedMonthKey === 'all') return 'All Recorded History';
    const b = monthlyBuckets.find((item) => item.key === selectedMonthKey);
    return b ? b.label : selectedMonthKey;
  }, [timeView, selectedMonthKey, monthlyBuckets]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <Header
            title="Food Waste & Financial Savings Analytics"
            subtitle="Closed-Loop Impact Measurement · Machine Learning Calibration Audit"
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  className="px-3.5 py-2 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  title="Reload live metrics from backend"
                >
                  <RefreshCw
                    size={13}
                    className={isRefreshing ? 'animate-spin text-forest' : 'text-ink-secondary'}
                  />
                  <span className="hidden sm:inline">Refresh Data</span>
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-xl bg-forest text-lime text-xs font-bold hover:bg-forest-dark transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Cooking Plan</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            }
          />

          {/* Timeframe Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-line-light shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-forest">
                TIMEFRAME VIEW:
              </span>
              {/* Monthly vs Weekly Switcher */}
              <div className="flex items-center p-1 rounded-2xl bg-canvas border border-line-light">
                <button
                  onClick={() => setTimeView('monthly')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    timeView === 'monthly'
                      ? 'bg-forest text-lime shadow-sm'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <CalendarDays size={13} />
                  <span>Monthly View</span>
                </button>
                <button
                  onClick={() => setTimeView('weekly')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    timeView === 'weekly'
                      ? 'bg-forest text-lime shadow-sm'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Weekly View</span>
                </button>
              </div>
            </div>

            {/* Month Dropdown (visible in Monthly View) */}
            {timeView === 'monthly' && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-ink-secondary hidden sm:inline">
                  Select Month:
                </span>
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl bg-canvas border border-line-light text-xs font-bold text-ink focus:outline-none cursor-pointer"
                >
                  {monthlyBuckets.map((bucket) => (
                    <option key={bucket.key} value={bucket.key}>
                      {bucket.label} ({bucket.metrics.recordsCount} records)
                    </option>
                  ))}
                  <option value="all">All Available Records ({records.length})</option>
                </select>
              </div>
            )}
          </div>

          {/* Error Banner if backend unreachable */}
          {fetchError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between">
              <span>{fetchError}</span>
              <button
                onClick={() => loadData(true)}
                className="underline font-bold text-amber-900 ml-4 hover:opacity-80"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* 1. Dynamic Key Impact KPI Cards */}
          <AnalyticsKPICards
            metrics={currentMetrics}
            modelMetrics={modelMetrics}
            periodLabel={activePeriodLabel}
          />

          {/* 2. ESG & Sustainability Performance Card */}
          <EsgMilestoneCard
            esgMetrics={esgMetrics}
            monthLabel={activePeriodLabel}
          />

          {/* 3. Main Visual Graph: Monthly / Weekly Savings Trajectory */}
          <MonthlySavingsChart
            weeklyData={weeklyBuckets}
            dailyData={dailyData}
            timeView={timeView}
            monthLabel={activePeriodLabel}
          />

          {/* 4. Two-Column Analytics Grid: Model Benchmark & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: ML Model Accuracy & Benchmark Card */}
            <ModelBenchmarkCard
              modelMetrics={modelMetrics}
              isLoading={isLoading}
            />

            {/* Right: Food Category Savings & Waste Breakdown */}
            <CategorySavingsChart
              categories={categoryBreakdown}
            />
          </div>

          {/* 5. Recurrent Day-of-Week Consumption & Waste Pattern Graph */}
          <DayOfWeekPatternChart
            daySummaries={dayOfWeekSummaries}
          />

          {/* 6. Closed-Loop Audit History Table with CSV Export */}
          <AuditHistoryTable
            records={activeRecords}
            monthLabel={activePeriodLabel}
          />
        </main>
      </div>
    </div>
  );
}
