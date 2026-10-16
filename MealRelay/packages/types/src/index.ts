/**
 * @mealrelay/types — Shared Domain Types for MealRelay
 * Cross-platform data models shared between Web (Next.js) and Mobile (React Native / Expo).
 */

export type MealServiceKey = 'breakfast' | 'lunch' | 'dinner';

export interface MealServiceConfig {
  key: MealServiceKey;
  name: string;
  period: string;
  icon: string;
  base: number;
  actual: number;
  color: string;
}

export type MealPortionCounts = Record<MealServiceKey, number>;

export type OrganizationPlan = 'demo' | 'starter' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  createdAt: string;
  contactEmail: string;
}

export interface Kitchen {
  id: string;
  orgId: string;
  name: string;
  location: string;
  capacity: number;
  timezone: string;
  servicesEnabled: MealServiceKey[];
}

export interface PreparationPlan {
  id: string;
  kitchenId: string;
  date: string;
  portions: MealPortionCounts;
  totalPortions: number;
  bufferPercent: number;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

export interface ConsumptionRecord {
  id: string;
  kitchenId: string;
  mealService: MealServiceKey;
  date: string;
  preparedPortions: number;
  servedPortions: number;
  leftoverPortions: number;
  wasteWeightKg: number;
  headcount: number;
}

export interface DemandForecast {
  mealService: MealServiceKey;
  serviceName: string;
  baselinePortions: number;
  suggestedPortions: number;
  recommendedBufferPercent: number;
  confidenceScore: number;
  historicalAvg: number;
  weatherFactor: number;
  reasoning: string;
}

export interface KitchenMetrics {
  totalPlannedToday: number;
  approved: boolean;
  serviceRate: number;
  leftoverPortionsToday: number;
  wastePreventedKg: number;
  wasteReductionPercent: number;
  activeKitchens: number;
  sevenDayPlannedTotal: number;
  weeklyHistory: number[];
}

export type UserRole = 'admin' | 'head_chef' | 'sous_chef' | 'operations_manager' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  kitchenId?: string;
}
