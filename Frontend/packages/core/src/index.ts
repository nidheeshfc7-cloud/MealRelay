/**
 * @mealrelay/core — Shared Business & Forecasting Logic
 * Framework-independent pure functions consumed by both Next.js Web and Expo Mobile.
 */

import {
  ConsumptionRecord,
  DemandForecast,
  KitchenMetrics,
  MealPortionCounts,
  MealServiceConfig,
  MealServiceKey,
  Organization,
  PreparationPlan,
} from '@mealrelay/types';

/**
 * Standard meal services configuration
 */
export const DEFAULT_MEALS: MealServiceConfig[] = [
  {
    key: 'breakfast',
    name: 'Breakfast',
    period: '7:30 – 9:30 AM',
    icon: 'sunny-outline',
    base: 182,
    actual: 169,
    color: '#EDF4DF',
  },
  {
    key: 'lunch',
    name: 'Lunch',
    period: '12:30 – 2:30 PM',
    icon: 'restaurant-outline',
    base: 264,
    actual: 249,
    color: '#FFF1DF',
  },
  {
    key: 'dinner',
    name: 'Dinner',
    period: '7:00 – 9:00 PM',
    icon: 'moon-outline',
    base: 215,
    actual: 201,
    color: '#EEF0FA',
  },
];

export const INITIAL_PORTIONS: MealPortionCounts = {
  breakfast: 182,
  lunch: 264,
  dinner: 215,
};

export const SAMPLE_WEEKLY_VOLUME: number[] = [510, 588, 535, 621, 571, 624, 661];

/**
 * Computes sum of all meal portions across all daily services
 */
export function calculateTotalPortions(counts: MealPortionCounts): number {
  return Object.values(counts).reduce((acc, count) => acc + (typeof count === 'number' && !isNaN(count) ? count : 0), 0);
}

/**
 * Formats a portion count with locale grouping
 */
export function formatPortionNumber(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString('en-IN');
}

/**
 * Applies step-based adjustment with boundary constraints
 */
export function adjustPortionQuantity(
  current: number,
  delta: number,
  min: number = 0,
  max: number = 9999
): number {
  const safeCurrent = typeof current === 'number' && !isNaN(current) ? current : 0;
  return Math.max(min, Math.min(max, safeCurrent + delta));
}

/**
 * Computes safety buffer additions
 */
export function calculateBuffer(portions: number, bufferPercent: number = 4.8): number {
  return Math.round((portions * bufferPercent) / 100);
}

/**
 * Computes breakdown of base + buffer portions
 */
export function calculateBufferBreakdown(
  basePortions: number,
  bufferPercent: number = 4.8
): { basePortions: number; bufferPortions: number; totalPortions: number } {
  const bufferPortions = calculateBuffer(basePortions, bufferPercent);
  return {
    basePortions,
    bufferPortions,
    totalPortions: basePortions + bufferPortions,
  };
}

/**
 * Computes food waste avoided and percentage reduction against historical uncalibrated baseline
 * (Typical unmanaged institutional kitchens operate with 12–15% excess waste).
 */
export function calculateWasteReduction(
  prepared: number,
  leftovers: number,
  baselineWasteRate: number = 0.14
): {
  leftoverPercent: number;
  wastePreventedPortions: number;
  estimatedKgSaved: number;
  wasteReductionPercent: number;
} {
  const safePrepared = Math.max(prepared, 1);
  const leftoverPercent = Math.min(100, Math.max(0, (leftovers / safePrepared) * 100));
  
  // Historical unmanaged baseline portions wasted
  const unmanagedWastedPortions = Math.round(safePrepared * baselineWasteRate);
  const wastePreventedPortions = Math.max(0, unmanagedWastedPortions - leftovers);
  
  // Average portion weight ~ 0.38 kg
  const estimatedKgSaved = Math.round(wastePreventedPortions * 0.38 * 10) / 10;
  
  // Waste reduction percentage
  const wasteReductionPercent = unmanagedWastedPortions > 0
    ? Math.round((wastePreventedPortions / unmanagedWastedPortions) * 100)
    : 0;

  return {
    leftoverPercent: Math.round(leftoverPercent * 10) / 10,
    wastePreventedPortions,
    estimatedKgSaved,
    wasteReductionPercent,
  };
}

/**
 * Pure statistical demand estimation
 * NOTE: This is a transparent kitchen heuristic using day-of-week rolling averages,
 * not a black-box machine learning model.
 */
export function estimateMealDemand(
  history: ConsumptionRecord[],
  service: MealServiceKey,
  targetDate: string,
  customBuffer: number = 4.8
): DemandForecast {
  const serviceRecords = history.filter((r) => r.mealService === service);
  
  // Service configuration metadata
  const config = DEFAULT_MEALS.find((m) => m.key === service) || DEFAULT_MEALS[0];
  
  if (serviceRecords.length === 0) {
    return {
      mealService: service,
      serviceName: config.name,
      baselinePortions: config.base,
      suggestedPortions: config.base + calculateBuffer(config.base, customBuffer),
      recommendedBufferPercent: customBuffer,
      confidenceScore: 0.88,
      historicalAvg: config.actual,
      weatherFactor: 1.0,
      reasoning: 'Default baseline derived from campus dining averages.',
    };
  }

  // Calculate moving average of actual served portions
  const totalServed = serviceRecords.reduce((acc, r) => acc + r.servedPortions, 0);
  const historicalAvg = Math.round(totalServed / serviceRecords.length);

  // Weather factor (default 1.0; e.g. rain may increase on-campus attendance slightly)
  const weatherFactor = 1.02;
  const baseline = Math.round(historicalAvg * weatherFactor);
  const bufferPortions = calculateBuffer(baseline, customBuffer);
  const suggested = baseline + bufferPortions;

  return {
    mealService: service,
    serviceName: config.name,
    baselinePortions: baseline,
    suggestedPortions: suggested,
    recommendedBufferPercent: customBuffer,
    confidenceScore: 0.94,
    historicalAvg,
    weatherFactor,
    reasoning: `Based on a ${serviceRecords.length}-day rolling average of ${historicalAvg} servings + ${customBuffer}% protective kitchen buffer.`,
  };
}

/**
 * Calculates forecast error metrics
 */
export function calculateForecastError(
  forecasted: number,
  actualServed: number
): {
  errorPortions: number;
  percentageError: number;
  wasShortage: boolean;
} {
  const errorPortions = forecasted - actualServed;
  const percentageError = actualServed > 0
    ? Math.round((Math.abs(errorPortions) / actualServed) * 1000) / 10
    : 0;
  
  return {
    errorPortions,
    percentageError,
    wasShortage: actualServed > forecasted,
  };
}

/**
 * Validates preparation plan data integrity
 */
export function validatePreparationPlan(plan: Partial<PreparationPlan>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!plan.kitchenId) errors.push('Kitchen identifier is required.');
  if (!plan.date) errors.push('Target service date is required.');
  if (!plan.portions) {
    errors.push('Portion numbers must be provided.');
  } else {
    for (const [key, value] of Object.entries(plan.portions)) {
      if (typeof value !== 'number' || isNaN(value) || value < 0) {
        errors.push(`Invalid portion quantity for ${key}: must be non-negative.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates organization parameters
 */
export function validateOrganizationData(org: Partial<Organization>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!org.name || org.name.trim().length < 2) {
    errors.push('Organization name must be at least 2 characters.');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Initial demo metrics
 */
export const SAMPLE_METRICS: KitchenMetrics = {
  totalPlannedToday: 661,
  approved: false,
  serviceRate: 94.2,
  leftoverPortionsToday: 38,
  wastePreventedKg: 42.5,
  wasteReductionPercent: 24.6,
  activeKitchens: 1,
  sevenDayPlannedTotal: 4110,
  weeklyHistory: SAMPLE_WEEKLY_VOLUME,
};
