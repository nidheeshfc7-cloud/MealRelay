/**
 * Dynamic calculation utilities for Food & Savings Analytics.
 * Computes financial savings, food waste rescued, carbon offsets,
 * and service fulfillment directly from raw meal records and ML outputs.
 */

import { MealRecord } from '@/lib/types/api';

export const CATEGORY_COST_PER_PORTION: Record<string, number> = {
  main: 60,
  curry: 50,
  rice: 30,
  bread: 20,
  side: 25,
  dessert: 40,
  beverage: 15,
};

export const DEFAULT_PORTION_COST = 40;
export const KG_PER_PORTION = 0.38;
export const KG_CO2E_PER_KG_FOOD = 2.5;
export const UNMANAGED_BASELINE_WASTE_RATE = 0.14; // 14% uncalibrated institutional mess baseline

export interface RecordCalculatedMetrics {
  prepared: number;
  served: number;
  leftovers: number;
  baselineWaste: number;
  portionsRescued: number;
  kgSaved: number;
  rupeesSaved: number;
  co2eSavedKg: number;
  leftoverPercent: number;
  hadShortage: boolean;
}

export const calculateRecordMetrics = (record: MealRecord): RecordCalculatedMetrics => {
  const prepared = Math.max(0, record.prepared_portions || 0);
  const served = record.served_portions !== null && record.served_portions !== undefined
    ? Math.max(0, record.served_portions)
    : Math.max(0, prepared - (record.leftover_portions || 0));

  const leftovers = record.leftover_portions !== null && record.leftover_portions !== undefined
    ? Math.max(0, record.leftover_portions)
    : Math.max(0, prepared - served);

  const baselineWaste = Math.round(prepared * UNMANAGED_BASELINE_WASTE_RATE);
  const portionsRescued = Math.max(0, baselineWaste - leftovers);
  const kgSaved = Math.round(portionsRescued * KG_PER_PORTION * 10) / 10;
  
  const categoryKey = (record.category || 'main').toLowerCase();
  const unitCost = CATEGORY_COST_PER_PORTION[categoryKey] || DEFAULT_PORTION_COST;
  const rupeesSaved = portionsRescued * unitCost;
  const co2eSavedKg = Math.round(kgSaved * KG_CO2E_PER_KG_FOOD * 10) / 10;

  const leftoverPercent = prepared > 0
    ? Math.round((leftovers / prepared) * 1000) / 10
    : 0;

  const hadShortage = served > prepared;

  return {
    prepared,
    served,
    leftovers,
    baselineWaste,
    portionsRescued,
    kgSaved,
    rupeesSaved,
    co2eSavedKg,
    leftoverPercent,
    hadShortage,
  };
};

export interface AggregatedPeriodMetrics {
  totalPrepared: number;
  totalServed: number;
  totalLeftovers: number;
  totalBaselineWaste: number;
  totalPortionsRescued: number;
  totalKgSaved: number;
  totalRupeesSaved: number;
  totalCo2eSavedKg: number;
  serviceAccuracyRate: number;
  wasteReductionRate: number;
  recordsCount: number;
}

export const aggregateRecords = (records: MealRecord[]): AggregatedPeriodMetrics => {
  if (records.length === 0) {
    return {
      totalPrepared: 0,
      totalServed: 0,
      totalLeftovers: 0,
      totalBaselineWaste: 0,
      totalPortionsRescued: 0,
      totalKgSaved: 0,
      totalRupeesSaved: 0,
      totalCo2eSavedKg: 0,
      serviceAccuracyRate: 100,
      wasteReductionRate: 0,
      recordsCount: 0,
    };
  }

  let totalPrepared = 0;
  let totalServed = 0;
  let totalLeftovers = 0;
  let totalBaselineWaste = 0;
  let totalPortionsRescued = 0;
  let totalKgSaved = 0;
  let totalRupeesSaved = 0;
  let totalCo2eSavedKg = 0;
  let shortageCount = 0;

  for (const record of records) {
    const m = calculateRecordMetrics(record);
    totalPrepared += m.prepared;
    totalServed += m.served;
    totalLeftovers += m.leftovers;
    totalBaselineWaste += m.baselineWaste;
    totalPortionsRescued += m.portionsRescued;
    totalKgSaved += m.kgSaved;
    totalRupeesSaved += m.rupeesSaved;
    totalCo2eSavedKg += m.co2eSavedKg;
    if (m.hadShortage) {
      shortageCount += 1;
    }
  }

  const serviceAccuracyRate = records.length > 0
    ? Math.round(((records.length - shortageCount) / records.length) * 1000) / 10
    : 100;

  const wasteReductionRate = totalBaselineWaste > 0
    ? Math.round((totalPortionsRescued / totalBaselineWaste) * 1000) / 10
    : 0;

  return {
    totalPrepared,
    totalServed,
    totalLeftovers,
    totalBaselineWaste,
    totalPortionsRescued,
    totalKgSaved: Math.round(totalKgSaved * 10) / 10,
    totalRupeesSaved,
    totalCo2eSavedKg: Math.round(totalCo2eSavedKg * 10) / 10,
    serviceAccuracyRate,
    wasteReductionRate,
    recordsCount: records.length,
  };
};

export interface MonthlyBucket {
  key: string; // "YYYY-MM"
  label: string; // "October 2026"
  records: MealRecord[];
  metrics: AggregatedPeriodMetrics;
}

export const groupRecordsByMonth = (records: MealRecord[]): MonthlyBucket[] => {
  const map = new Map<string, MealRecord[]>();

  for (const record of records) {
    const ym = record.meal_date ? record.meal_date.slice(0, 7) : 'Unknown';
    if (!map.has(ym)) {
      map.set(ym, []);
    }
    map.get(ym)!.push(record);
  }

  // Sort descending by month
  const sortedKeys = Array.from(map.keys()).sort().reverse();

  return sortedKeys.map((key) => {
    const bucketRecords = map.get(key) || [];
    let label = key;
    try {
      const [year, month] = key.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      label = key;
    }

    return {
      key,
      label,
      records: bucketRecords,
      metrics: aggregateRecords(bucketRecords),
    };
  });
};

export interface WeeklyBucket {
  weekLabel: string;
  startDate: string;
  endDate: string;
  records: MealRecord[];
  metrics: AggregatedPeriodMetrics;
}

export const groupRecordsByWeek = (records: MealRecord[]): WeeklyBucket[] => {
  if (records.length === 0) return [];

  // Sort chronologically ascending
  const sorted = [...records].sort((a, b) => a.meal_date.localeCompare(b.meal_date));
  const buckets: WeeklyBucket[] = [];
  const chunkSize = Math.max(1, Math.ceil(sorted.length / 4));

  for (let i = 0; i < sorted.length; i += chunkSize) {
    const chunk = sorted.slice(i, i + chunkSize);
    const startDate = chunk[0].meal_date;
    const endDate = chunk[chunk.length - 1].meal_date;
    const weekIndex = buckets.length + 1;

    buckets.push({
      weekLabel: `Week ${weekIndex}`,
      startDate,
      endDate,
      records: chunk,
      metrics: aggregateRecords(chunk),
    });
  }

  return buckets;
};

export interface CategorySummary {
  category: string;
  label: string;
  portionsRescued: number;
  kgSaved: number;
  rupeesSaved: number;
  leftoverPercent: number;
  totalPrepared: number;
}

export const groupRecordsByCategory = (records: MealRecord[]): CategorySummary[] => {
  const map = new Map<string, MealRecord[]>();

  for (const r of records) {
    const cat = (r.category || 'other').toLowerCase();
    if (!map.has(cat)) {
      map.set(cat, []);
    }
    map.get(cat)!.push(r);
  }

  const categoryLabels: Record<string, string> = {
    main: 'Main Dishes & Proteins',
    curry: 'Curries & Gravies',
    rice: 'Steamed & Flavored Rice',
    bread: 'Fresh Indian Breads',
    side: 'Accompaniments & Curds',
    dessert: 'Sweets & Desserts',
    beverage: 'Beverages',
  };

  const results: CategorySummary[] = [];

  map.forEach((catRecords, catKey) => {
    const m = aggregateRecords(catRecords);
    results.push({
      category: catKey,
      label: categoryLabels[catKey] || catKey.charAt(0).toUpperCase() + catKey.slice(1),
      portionsRescued: m.totalPortionsRescued,
      kgSaved: m.totalKgSaved,
      rupeesSaved: m.totalRupeesSaved,
      leftoverPercent: m.totalPrepared > 0
        ? Math.round((m.totalLeftovers / m.totalPrepared) * 1000) / 10
        : 0,
      totalPrepared: m.totalPrepared,
    });
  });

  // Sort descending by rupees saved
  return results.sort((a, b) => b.rupeesSaved - a.rupeesSaved);
};

export interface DayOfWeekSummary {
  dayIndex: number; // 0=Mon, 6=Sun
  dayName: string;
  dayShort: string;
  totalPrepared: number;
  totalServed: number;
  totalLeftovers: number;
  leftoverPercent: number;
  portionsRescued: number;
  rupeesSaved: number;
  recordsCount: number;
}

export const groupRecordsByDayOfWeek = (records: MealRecord[]): DayOfWeekSummary[] => {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const buckets: DayOfWeekSummary[] = dayNames.map((name, idx) => ({
    dayIndex: idx,
    dayName: name,
    dayShort: dayShorts[idx],
    totalPrepared: 0,
    totalServed: 0,
    totalLeftovers: 0,
    leftoverPercent: 0,
    portionsRescued: 0,
    rupeesSaved: 0,
    recordsCount: 0,
  }));

  for (const r of records) {
    let dayIdx = typeof r.day_of_week === 'number' && r.day_of_week >= 0 && r.day_of_week <= 6
      ? r.day_of_week
      : -1;

    if (dayIdx === -1 && r.meal_date) {
      try {
        const d = new Date(r.meal_date);
        dayIdx = (d.getDay() + 6) % 7; // Convert Sun(0)-Sat(6) to Mon(0)-Sun(6)
      } catch {
        dayIdx = 0;
      }
    }

    if (dayIdx >= 0 && dayIdx <= 6) {
      const m = calculateRecordMetrics(r);
      const b = buckets[dayIdx];
      b.totalPrepared += m.prepared;
      b.totalServed += m.served;
      b.totalLeftovers += m.leftovers;
      b.portionsRescued += m.portionsRescued;
      b.rupeesSaved += m.rupeesSaved;
      b.recordsCount += 1;
    }
  }

  for (const b of buckets) {
    b.leftoverPercent = b.totalPrepared > 0
      ? Math.round((b.totalLeftovers / b.totalPrepared) * 1000) / 10
      : 0;
  }

  return buckets;
};

export interface EsgImpactMetrics {
  treeYearsEquivalent: number;
  waterSavedLiters: number;
  methaneAvoidedKg: number;
  mealsDonatedEquivalent: number;
  targetMonthlyRupees: number;
  targetProgressPercent: number;
}

export const calculateEsgMetrics = (
  totalKgSaved: number,
  totalPortionsRescued: number,
  totalRupeesSaved: number,
  targetMonthlyRupees: number = 100000
): EsgImpactMetrics => {
  // 1 mature tree absorbs ~22 kg CO2e per year
  const treeYearsEquivalent = Math.round((totalKgSaved * KG_CO2E_PER_KG_FOOD) / 22);
  // Average 800 Liters of agricultural water embedded per kg of food produced
  const waterSavedLiters = Math.round(totalKgSaved * 800);
  // Landfill decomposition produces ~0.45 kg methane per kg uneaten food
  const methaneAvoidedKg = Math.round(totalKgSaved * 0.45 * 10) / 10;
  // Rescued edible portions
  const mealsDonatedEquivalent = totalPortionsRescued;
  const targetProgressPercent = targetMonthlyRupees > 0
    ? Math.min(100, Math.round((totalRupeesSaved / targetMonthlyRupees) * 100))
    : 0;

  return {
    treeYearsEquivalent,
    waterSavedLiters,
    methaneAvoidedKg,
    mealsDonatedEquivalent,
    targetMonthlyRupees,
    targetProgressPercent,
  };
};

export interface DailyRecordSummary {
  dayNumber: number;
  date: string;
  dayOfWeekShort: string;
  isWeekend: boolean;
  totalPrepared: number;
  totalServed: number;
  totalLeftovers: number;
  leftoverPercent: number;
  rupeesSaved: number;
  kgSaved: number;
  portionsRescued: number;
  hasShortage: boolean;
  recordsCount: number;
}

export const groupRecordsByDayOfMonth = (
  records: MealRecord[],
  monthKey: string
): DailyRecordSummary[] => {
  if (records.length === 0) return [];

  // Determine effective year and month
  let effectiveYear = 2026;
  let effectiveMonth = 10;

  if (monthKey && monthKey.includes('-')) {
    const [y, m] = monthKey.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      effectiveYear = y;
      effectiveMonth = m;
    }
  } else {
    // Default to the first record's month
    const firstDate = records[0]?.meal_date;
    if (firstDate && firstDate.includes('-')) {
      const [y, m] = firstDate.split('-').map(Number);
      effectiveYear = y;
      effectiveMonth = m;
    }
  }

  // Days in month
  const totalDays = new Date(effectiveYear, effectiveMonth, 0).getDate();

  // Index records by date
  const dateMap = new Map<string, MealRecord[]>();
  for (const r of records) {
    if (!r.meal_date) continue;
    if (!dateMap.has(r.meal_date)) {
      dateMap.set(r.meal_date, []);
    }
    dateMap.get(r.meal_date)!.push(r);
  }

  const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailySummaries: DailyRecordSummary[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(effectiveMonth).padStart(2, '0');
    const dateStr = `${effectiveYear}-${monthStr}-${dayStr}`;

    const dateObj = new Date(effectiveYear, effectiveMonth - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayOfWeekShort = dayShorts[dayOfWeek];

    const dayRecords = dateMap.get(dateStr) || [];
    let prep = 0;
    let served = 0;
    let leftovers = 0;
    let rescued = 0;
    let kg = 0;
    let rupees = 0;
    let hasShortage = false;

    for (const r of dayRecords) {
      const m = calculateRecordMetrics(r);
      prep += m.prepared;
      served += m.served;
      leftovers += m.leftovers;
      rescued += m.portionsRescued;
      kg += m.kgSaved;
      rupees += m.rupeesSaved;
      if (m.hadShortage) hasShortage = true;
    }

    const leftoverPercent = prep > 0 ? Math.round((leftovers / prep) * 1000) / 10 : 0;

    dailySummaries.push({
      dayNumber: day,
      date: dateStr,
      dayOfWeekShort,
      isWeekend,
      totalPrepared: prep,
      totalServed: served,
      totalLeftovers: leftovers,
      leftoverPercent,
      rupeesSaved: rupees,
      kgSaved: Math.round(kg * 10) / 10,
      portionsRescued: rescued,
      hasShortage,
      recordsCount: dayRecords.length,
    });
  }

  return dailySummaries;
};

export interface MealSessionSummary {
  session: 'breakfast' | 'lunch' | 'dinner';
  name: string;
  timeRange: string;
  totalPrepared: number;
  totalServed: number;
  totalLeftovers: number;
  leftoverPercent: number;
  rupeesSaved: number;
  kgSaved: number;
  portionsRescued: number;
  accuracyRate: number;
}

export const groupRecordsByMealSession = (records: MealRecord[]): MealSessionSummary[] => {
  const sessions: { key: 'breakfast' | 'lunch' | 'dinner'; name: string; time: string }[] = [
    { key: 'breakfast', name: 'Breakfast Service', time: '7:30 – 9:30 AM' },
    { key: 'lunch', name: 'Lunch Service', time: '12:30 – 2:30 PM' },
    { key: 'dinner', name: 'Dinner Service', time: '7:00 – 9:00 PM' },
  ];

  return sessions.map((s) => {
    const sessionRecords = records.filter((r) => r.meal_type === s.key);
    let prep = 0;
    let served = 0;
    let leftovers = 0;
    let rescued = 0;
    let kg = 0;
    let rupees = 0;
    let shortages = 0;

    for (const r of sessionRecords) {
      const m = calculateRecordMetrics(r);
      prep += m.prepared;
      served += m.served;
      leftovers += m.leftovers;
      rescued += m.portionsRescued;
      kg += m.kgSaved;
      rupees += m.rupeesSaved;
      if (m.hadShortage) shortages += 1;
    }

    const leftoverPercent = prep > 0 ? Math.round((leftovers / prep) * 1000) / 10 : 0;
    const accuracyRate = sessionRecords.length > 0
      ? Math.round(((sessionRecords.length - shortages) / sessionRecords.length) * 1000) / 10
      : 100;

    return {
      session: s.key,
      name: s.name,
      timeRange: s.time,
      totalPrepared: prep,
      totalServed: served,
      totalLeftovers: leftovers,
      leftoverPercent,
      rupeesSaved: rupees,
      kgSaved: Math.round(kg * 10) / 10,
      portionsRescued: rescued,
      accuracyRate,
    };
  });
};

