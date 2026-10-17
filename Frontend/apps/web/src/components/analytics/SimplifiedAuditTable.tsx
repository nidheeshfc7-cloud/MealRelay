'use client';

import React, { useMemo, useState } from 'react';
import {
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MealRecord } from '@/lib/types/api';
import { calculateRecordMetrics } from './analyticsCalculations';

interface SimplifiedAuditTableProps {
  records: MealRecord[];
  monthLabel: string;
}

export const SimplifiedAuditTable: React.FC<SimplifiedAuditTableProps> = ({
  records,
  monthLabel,
}) => {
  const [shiftFilter, setShiftFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (shiftFilter !== 'all' && r.meal_type !== shiftFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDish = (r.dish_name || '').toLowerCase().includes(query);
        const matchesDate = (r.meal_date || '').includes(query);
        if (!matchesDish && !matchesDate) return false;
      }
      return true;
    });
  }, [records, shiftFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  // Export CSV handler
  const handleExportCSV = (): void => {
    if (filteredRecords.length === 0) {
      alert('No meal records available to export.');
      return;
    }

    const headers = [
      'Date',
      'Meal Service',
      'Dish Name',
      'Plates Cooked',
      'Plates Served',
      'Leftover Plates',
      'Leftover %',
      'Money Saved (INR)',
    ];

    const rows = filteredRecords.map((r) => {
      const m = calculateRecordMetrics(r);
      return [
        r.meal_date,
        r.meal_type.toUpperCase(),
        `"${(r.dish_name || 'Unnamed Dish').replace(/"/g, '""')}"`,
        m.prepared,
        m.served,
        m.leftovers,
        `${m.leftoverPercent}%`,
        m.rupeesSaved,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MealRelay_Kitchen_Log_${monthLabel.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-forest">
            DAILY KITCHEN LOG
          </span>
          <h3 className="text-lg font-black text-ink mt-0.5">
            Meal-by-Meal Cooking & Leftover Records
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Clear daily audit comparing what was cooked against what was consumed.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Download size={13} className="text-forest" />
          <span>Download Spreadsheet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search dish (e.g. Paneer, Rice)..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-canvas border border-line-light text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>

        {/* Shift Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-canvas border border-line-light">
          {(['all', 'breakfast', 'lunch', 'dinner'] as const).map((shift) => (
            <button
              key={shift}
              onClick={() => {
                setShiftFilter(shift);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                shiftFilter === shift
                  ? 'bg-forest text-lime shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {shift}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line-light font-extrabold text-ink-secondary uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3">Date & Shift</th>
              <th className="py-2.5 px-3">Dish</th>
              <th className="py-2.5 px-3 text-right">Cooked</th>
              <th className="py-2.5 px-3 text-right">Served</th>
              <th className="py-2.5 px-3 text-right">Leftovers</th>
              <th className="py-2.5 px-3 text-right">Money Saved</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-light">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-ink-secondary">
                  No meal records found for this filter.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => {
                const m = calculateRecordMetrics(r);

                return (
                  <tr key={r.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-ink">
                      <span>{r.meal_date}</span>
                      <span className="ml-1.5 font-bold uppercase text-[10px] text-ink-secondary">
                        · {r.meal_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-ink">
                      {r.dish_name || 'Standard Item'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-ink">
                      {m.prepared}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-ink">
                      {m.served}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-forest">
                      {m.leftovers} ({m.leftoverPercent}%)
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-forest">
                      ₹{m.rupeesSaved.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {m.hadShortage ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <AlertCircle size={10} />
                          Shortage
                        </span>
                      ) : m.leftoverPercent <= 6.0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest bg-sage border border-line-light px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} />
                          Spot On
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Controlled
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-2 flex items-center justify-between text-xs text-ink-secondary">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-lg border border-line-light bg-white hover:bg-canvas disabled:opacity-40 font-bold"
            >
              Prev
            </button>
            <span className="px-2 font-bold text-ink">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg border border-line-light bg-white hover:bg-canvas disabled:opacity-40 font-bold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
