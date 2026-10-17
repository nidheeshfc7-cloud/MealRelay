'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Search,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MealRecord } from '@/lib/types/api';
import { calculateRecordMetrics } from './analyticsCalculations';

interface AuditHistoryTableProps {
  records: MealRecord[];
  monthLabel: string;
}

type SortKey = 'meal_date' | 'dish_name' | 'prepared' | 'served' | 'leftovers' | 'leftoverPercent' | 'kgSaved' | 'rupeesSaved';
type SortOrder = 'asc' | 'desc';

export const AuditHistoryTable: React.FC<AuditHistoryTableProps> = ({
  records,
  monthLabel,
}) => {
  const [shiftFilter, setShiftFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('meal_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Extract unique categories dynamically from the actual records
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    records.forEach((r) => {
      if (r.category) cats.add(r.category.toLowerCase());
    });
    return Array.from(cats).sort();
  }, [records]);

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    const filtered = records.filter((r) => {
      if (shiftFilter !== 'all' && r.meal_type !== shiftFilter) return false;
      if (categoryFilter !== 'all' && (r.category || '').toLowerCase() !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDish = (r.dish_name || '').toLowerCase().includes(query);
        const matchesDate = (r.meal_date || '').includes(query);
        if (!matchesDish && !matchesDate) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const ma = calculateRecordMetrics(a);
      const mb = calculateRecordMetrics(b);

      let valA: any;
      let valB: any;

      if (sortKey === 'meal_date') {
        valA = a.meal_date;
        valB = b.meal_date;
      } else if (sortKey === 'dish_name') {
        valA = (a.dish_name || '').toLowerCase();
        valB = (b.dish_name || '').toLowerCase();
      } else if (sortKey === 'prepared') {
        valA = ma.prepared;
        valB = mb.prepared;
      } else if (sortKey === 'served') {
        valA = ma.served;
        valB = mb.served;
      } else if (sortKey === 'leftovers') {
        valA = ma.leftovers;
        valB = mb.leftovers;
      } else if (sortKey === 'leftoverPercent') {
        valA = ma.leftoverPercent;
        valB = mb.leftoverPercent;
      } else if (sortKey === 'kgSaved') {
        valA = ma.kgSaved;
        valB = mb.kgSaved;
      } else if (sortKey === 'rupeesSaved') {
        valA = ma.rupeesSaved;
        valB = mb.rupeesSaved;
      } else {
        valA = a.meal_date;
        valB = b.meal_date;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, shiftFilter, categoryFilter, searchQuery, sortKey, sortOrder]);

  // Summary figures for currently filtered records
  const filteredSummary = useMemo(() => {
    let prep = 0;
    let served = 0;
    let leftovers = 0;
    let kg = 0;
    let rupees = 0;

    for (const r of filteredAndSortedRecords) {
      const m = calculateRecordMetrics(r);
      prep += m.prepared;
      served += m.served;
      leftovers += m.leftovers;
      kg += m.kgSaved;
      rupees += m.rupeesSaved;
    }

    return {
      count: filteredAndSortedRecords.length,
      prep,
      served,
      leftovers,
      kgSaved: Math.round(kg * 10) / 10,
      rupeesSaved: rupees,
    };
  }, [filteredAndSortedRecords]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedRecords.slice(start, start + pageSize);
  }, [filteredAndSortedRecords, page, pageSize]);

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Real CSV Export Handler
  const handleExportCSV = (): void => {
    if (filteredAndSortedRecords.length === 0) {
      alert('No meal records available to export.');
      return;
    }

    const headers = [
      'Date',
      'Meal Session',
      'Dish Name',
      'Category',
      'Attendance',
      'Prepared (Portions)',
      'Served (Portions)',
      'Leftovers (Portions)',
      'Leftover Rate (%)',
      'Rescued (kg)',
      'Financial Savings (INR)',
      'Fulfillment Status',
    ];

    const rows = filteredAndSortedRecords.map((r) => {
      const m = calculateRecordMetrics(r);
      return [
        r.meal_date,
        r.meal_type.toUpperCase(),
        `"${(r.dish_name || 'Unnamed Dish').replace(/"/g, '""')}"`,
        r.category || 'N/A',
        r.attendance || 'N/A',
        m.prepared,
        m.served,
        m.leftovers,
        `${m.leftoverPercent}%`,
        m.kgSaved,
        m.rupeesSaved,
        m.hadShortage ? 'Shortage Occurred' : 'Demand Met (100%)',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MealRelay_Food_Savings_Audit_${monthLabel.replace(/\s+/g, '_')}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown size={11} className="text-ink-secondary/50 group-hover:text-forest" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={11} className="text-forest" />
    ) : (
      <ArrowDown size={11} className="text-forest" />
    );
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-forest">
            CLOSED-LOOP AUDIT LOG
          </span>
          <h2 className="text-xl font-black text-ink mt-0.5">
            Operational Meal Records & Waste Audit
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Comparing daily kitchen prep against actual plates served and logged leftovers for {monthLabel}.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-2 self-start lg:self-auto shadow-sm"
        >
          <Download size={14} className="text-forest" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search dish or date (e.g., Paneer, 2026-10)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-canvas border border-line-light text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
        </div>

        {/* Meal Shift Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-canvas border border-line-light">
          {(['all', 'breakfast', 'lunch', 'dinner'] as const).map((shift) => (
            <button
              key={shift}
              onClick={() => {
                setShiftFilter(shift);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                shiftFilter === shift
                  ? 'bg-forest text-lime shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {shift}
            </button>
          ))}
        </div>

        {/* Category Dropdown Filter */}
        {uniqueCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-canvas border border-line-light text-xs font-bold text-ink focus:outline-none capitalize"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Filter Subtotal Summary Chip */}
      <div className="px-4 py-2.5 rounded-2xl bg-canvas border border-line-light flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-ink">
          <Layers size={13} className="text-forest" />
          <span>Filtered Scope: {filteredSummary.count} entries</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-secondary">
          <span>Prepared: <strong className="text-ink">{filteredSummary.prep.toLocaleString()}</strong></span>
          <span>Served: <strong className="text-ink">{filteredSummary.served.toLocaleString()}</strong></span>
          <span>Rescued: <strong className="text-forest">{filteredSummary.kgSaved} kg</strong></span>
          <span>Total Saved: <strong className="text-forest font-black">₹{filteredSummary.rupeesSaved.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* Table with Click-to-Sort Headers */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line-light text-[11px] font-extrabold uppercase tracking-wider text-ink-secondary">
              <th
                onClick={() => handleSort('meal_date')}
                className="py-3 px-3 cursor-pointer hover:text-forest transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {renderSortIcon('meal_date')}
                </div>
              </th>
              <th className="py-3 px-3">Session</th>
              <th
                onClick={() => handleSort('dish_name')}
                className="py-3 px-4 cursor-pointer hover:text-forest transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Dish</span>
                  {renderSortIcon('dish_name')}
                </div>
              </th>
              <th
                onClick={() => handleSort('prepared')}
                className="py-3 px-3 cursor-pointer hover:text-forest transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Prepared</span>
                  {renderSortIcon('prepared')}
                </div>
              </th>
              <th
                onClick={() => handleSort('served')}
                className="py-3 px-3 cursor-pointer hover:text-forest transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Served</span>
                  {renderSortIcon('served')}
                </div>
              </th>
              <th
                onClick={() => handleSort('leftovers')}
                className="py-3 px-3 cursor-pointer hover:text-forest transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Leftovers</span>
                  {renderSortIcon('leftovers')}
                </div>
              </th>
              <th
                onClick={() => handleSort('leftoverPercent')}
                className="py-3 px-3 cursor-pointer hover:text-forest transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Waste %</span>
                  {renderSortIcon('leftoverPercent')}
                </div>
              </th>
              <th
                onClick={() => handleSort('kgSaved')}
                className="py-3 px-3 cursor-pointer hover:text-forest transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Rescued</span>
                  {renderSortIcon('kgSaved')}
                </div>
              </th>
              <th
                onClick={() => handleSort('rupeesSaved')}
                className="py-3 px-3 cursor-pointer hover:text-forest transition-colors group select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Net Saved</span>
                  {renderSortIcon('rupeesSaved')}
                </div>
              </th>
              <th className="py-3 px-3">Service Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-light">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-xs font-semibold text-ink-secondary">
                  No records matching your search and filter criteria.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => {
                const m = calculateRecordMetrics(record);
                const shiftColor =
                  record.meal_type === 'breakfast'
                    ? 'bg-amber-100 text-amber-800'
                    : record.meal_type === 'lunch'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-indigo-100 text-indigo-800';

                // Waste threshold color coding
                const wasteBadge =
                  m.leftoverPercent <= 5.0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : m.leftoverPercent <= 9.0
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <tr key={record.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-xs text-ink whitespace-nowrap">
                      {record.meal_date}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${shiftColor}`}>
                        {record.meal_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-xs text-ink">{record.dish_name}</p>
                      <p className="text-[10px] text-ink-secondary capitalize">
                        {record.category || 'Standard'}
                      </p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs text-ink">
                      {m.prepared}
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs text-ink">
                      {m.served}
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs text-forest">
                      {m.leftovers}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${wasteBadge}`}>
                        {m.leftoverPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-bold text-forest whitespace-nowrap">
                      {m.kgSaved > 0 ? `${m.kgSaved} kg` : '0 kg'}
                    </td>
                    <td className="py-3 px-3 font-black text-xs text-ink whitespace-nowrap">
                      {m.rupeesSaved > 0 ? `₹${m.rupeesSaved}` : '₹0'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {m.hadShortage ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <AlertCircle size={11} />
                          Shortage Logged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest bg-sage border border-line-light px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} />
                          Demand Met
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-line-light flex items-center justify-between text-xs text-ink-secondary">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredAndSortedRecords.length)} of {filteredAndSortedRecords.length} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-lg border border-line-light bg-white hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-ink">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg border border-line-light bg-white hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
