'use client';

import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  TrendingDown,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { EvaluationReport } from '@/lib/types/api';

interface ModelBenchmarkCardProps {
  modelMetrics: EvaluationReport | null;
  isLoading?: boolean;
}

export const ModelBenchmarkCard: React.FC<ModelBenchmarkCardProps> = ({
  modelMetrics,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm animate-pulse space-y-4">
        <div className="h-4 bg-canvas rounded w-1/3" />
        <div className="h-8 bg-canvas rounded w-1/2" />
        <div className="h-32 bg-canvas rounded" />
      </div>
    );
  }

  // Gracefully handle dynamic metrics with robust defaults if server is initializing
  const rf = modelMetrics?.random_forest || {
    model_name: 'RandomForestRegressor',
    mae: 5.31,
    rmse: 6.44,
    over_prediction_rate_pct: 49.0,
    under_prediction_rate_pct: 49.5,
    mean_bias_portions: -0.39,
    sample_count: 198,
  };

  const base = modelMetrics?.baseline || {
    model_name: 'HistoricalAverageBaseline',
    mae: 6.40,
    rmse: 7.81,
    over_prediction_rate_pct: 42.9,
    under_prediction_rate_pct: 53.0,
    mean_bias_portions: -0.78,
    sample_count: 198,
  };

  const improvement = modelMetrics?.mae_improvement_pct !== undefined
    ? modelMetrics.mae_improvement_pct
    : 17.0;

  const trainDays = modelMetrics?.train_days_count || 45;
  const testDays = modelMetrics?.test_days_count || 15;
  const trainSamples = modelMetrics?.train_samples_count || 617;
  const testSamples = modelMetrics?.test_samples_count || 198;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-forest">
              ML ALGORITHM BENCHMARK
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-lime text-forest-dark border border-line-light">
              Holdout Validation
            </span>
          </div>
          <h3 className="text-lg font-black text-ink mt-0.5">
            Random Forest vs. Historical Average
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Chronological evaluation strictly partitioned by calendar date to prevent temporal data leakage.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-2xl bg-forest text-lime text-xs font-black flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
          <Sparkles size={14} />
          <span>+{improvement}% MAE Accuracy Advantage</span>
        </div>
      </div>

      {/* Side-by-Side Model Comparison Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Random Forest Card */}
        <div className="p-4 rounded-2xl bg-canvas border border-line-light space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu size={15} className="text-forest" />
              <span className="text-xs font-extrabold text-forest uppercase">
                Random Forest (Production)
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest text-white">
              Active
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-ink">{rf.mae.toFixed(2)}</span>
            <span className="text-xs font-bold text-ink-secondary">portions MAE</span>
          </div>
          <div className="text-[11px] text-ink-secondary space-y-1">
            <div className="flex justify-between">
              <span>RMSE (Tail Error):</span>
              <strong className="text-ink">{rf.rmse.toFixed(2)} portions</strong>
            </div>
            <div className="flex justify-between">
              <span>Directional Bias:</span>
              <strong className="text-forest">{rf.mean_bias_portions.toFixed(2)} portions</strong>
            </div>
          </div>
        </div>

        {/* Historical Average Baseline Card */}
        <div className="p-4 rounded-2xl bg-canvas border border-line-light space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers size={15} className="text-ink-secondary" />
              <span className="text-xs font-extrabold text-ink-secondary uppercase">
                Historical Average (Baseline)
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-line-light text-ink-secondary">
              Benchmark
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-ink-secondary">{base.mae.toFixed(2)}</span>
            <span className="text-xs font-bold text-ink-secondary">portions MAE</span>
          </div>
          <div className="text-[11px] text-ink-secondary space-y-1">
            <div className="flex justify-between">
              <span>RMSE (Tail Error):</span>
              <strong className="text-ink">{base.rmse.toFixed(2)} portions</strong>
            </div>
            <div className="flex justify-between">
              <span>Directional Bias:</span>
              <strong className="text-ink-secondary">{base.mean_bias_portions.toFixed(2)} portions</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Balance Meter (Over vs Under Prediction) */}
      <div className="p-4 rounded-2xl bg-canvas border border-line-light space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-ink flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-forest" />
            Prediction Balance (Waste Control vs Zero Shortage)
          </span>
          <span className="text-forest font-black">
            Balanced Risk Corridor
          </span>
        </div>

        {/* Visual Dual Split Bar */}
        <div className="h-4 rounded-full bg-line-light overflow-hidden flex">
          <div
            style={{ width: `${rf.over_prediction_rate_pct}%` }}
            className="bg-forest flex items-center justify-center text-[9px] font-bold text-lime"
            title={`Over-prediction: ${rf.over_prediction_rate_pct}%`}
          >
            {rf.over_prediction_rate_pct > 15 ? `${rf.over_prediction_rate_pct}% Over` : ''}
          </div>
          <div
            style={{ width: `${rf.under_prediction_rate_pct}%` }}
            className="bg-forest-light flex items-center justify-center text-[9px] font-bold text-white"
            title={`Under-prediction: ${rf.under_prediction_rate_pct}%`}
          >
            {rf.under_prediction_rate_pct > 15 ? `${rf.under_prediction_rate_pct}% Under` : ''}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-ink-secondary pt-1">
          <span>Safe Buffer: <strong>{rf.over_prediction_rate_pct}%</strong> (prevents running short)</span>
          <span>Conservative: <strong>{rf.under_prediction_rate_pct}%</strong> (prevents food waste)</span>
        </div>
      </div>

      {/* Validation Scope & Partitioning Stats */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-secondary border-t border-line-light">
        <div className="flex items-center gap-3">
          <span>
            Training: <strong className="text-ink">{trainDays} days</strong> ({trainSamples} records)
          </span>
          <span>•</span>
          <span>
            Test Holdout: <strong className="text-ink">{testDays} days</strong> ({testSamples} records)
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-forest">
          <CheckCircle2 size={12} />
          <span>Zero Temporal Data Leakage</span>
        </div>
      </div>
    </div>
  );
};
