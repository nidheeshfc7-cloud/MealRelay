/**
 * @mealrelay/api — Shared API Architecture & Demo Adapter
 * Defines the unified client contract for web and mobile.
 */

import {
  ConsumptionRecord,
  DemandForecast,
  Kitchen,
  KitchenMetrics,
  MealPortionCounts,
  Organization,
  PreparationPlan,
} from '@mealrelay/types';
import {
  DEFAULT_MEALS,
  INITIAL_PORTIONS,
  SAMPLE_METRICS,
  calculateTotalPortions,
  estimateMealDemand,
} from '@mealrelay/core';

/**
 * Universal MealRelay API Client Contract
 */
export interface MealRelayApiClient {
  getOrganization(orgId: string): Promise<Organization>;
  updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization>;
  getKitchens(orgId: string): Promise<Kitchen[]>;
  getKitchenMetrics(kitchenId: string): Promise<KitchenMetrics>;
  getPreparationPlan(kitchenId: string, date: string): Promise<PreparationPlan>;
  updatePreparationPlan(plan: PreparationPlan): Promise<PreparationPlan>;
  approvePreparationPlan(planId: string): Promise<PreparationPlan>;
  getDemandForecasts(kitchenId: string, date: string): Promise<DemandForecast[]>;
  getConsumptionHistory(kitchenId: string): Promise<ConsumptionRecord[]>;
}

/**
 * Standard In-Memory Demo Adapter
 * Provides high-fidelity, deterministic demo data without requiring a live remote database connection.
 * Used for development, local demos, and offline testing.
 */
export class DemoMealRelayApiClient implements MealRelayApiClient {
  private org: Organization = {
    id: 'org_sreenidhi_01',
    name: 'Sreenidhi Campus Dining',
    slug: 'sreenidhi-campus',
    plan: 'starter',
    createdAt: '2026-01-15T08:00:00Z',
    contactEmail: 'operations@sreenidhi.edu',
  };

  private kitchen: Kitchen = {
    id: 'kt_main_01',
    orgId: 'org_sreenidhi_01',
    name: 'Central Prep Kitchen A',
    location: 'Main Dining Complex, Floor 1',
    capacity: 1200,
    timezone: 'Asia/Kolkata',
    servicesEnabled: ['breakfast', 'lunch', 'dinner'],
  };

  private plan: PreparationPlan = {
    id: 'plan_20261017',
    kitchenId: 'kt_main_01',
    date: '2026-10-17',
    portions: { ...INITIAL_PORTIONS },
    totalPortions: calculateTotalPortions(INITIAL_PORTIONS),
    bufferPercent: 4.8,
    approved: false,
    notes: 'Standard weekend operations buffer enabled.',
  };

  private history: ConsumptionRecord[] = [
    {
      id: 'rec_01',
      kitchenId: 'kt_main_01',
      mealService: 'breakfast',
      date: '2026-10-16',
      preparedPortions: 182,
      servedPortions: 169,
      leftoverPortions: 13,
      wasteWeightKg: 4.9,
      headcount: 175,
    },
    {
      id: 'rec_02',
      kitchenId: 'kt_main_01',
      mealService: 'lunch',
      date: '2026-10-16',
      preparedPortions: 264,
      servedPortions: 249,
      leftoverPortions: 15,
      wasteWeightKg: 5.7,
      headcount: 255,
    },
    {
      id: 'rec_03',
      kitchenId: 'kt_main_01',
      mealService: 'dinner',
      date: '2026-10-16',
      preparedPortions: 215,
      servedPortions: 201,
      leftoverPortions: 14,
      wasteWeightKg: 5.3,
      headcount: 208,
    },
    {
      id: 'rec_04',
      kitchenId: 'kt_main_01',
      mealService: 'lunch',
      date: '2026-10-15',
      preparedPortions: 260,
      servedPortions: 246,
      leftoverPortions: 14,
      wasteWeightKg: 5.3,
      headcount: 250,
    },
  ];

  async getOrganization(_orgId: string): Promise<Organization> {
    return { ...this.org };
  }

  async updateOrganization(_orgId: string, updates: Partial<Organization>): Promise<Organization> {
    this.org = { ...this.org, ...updates };
    return { ...this.org };
  }

  async getKitchens(_orgId: string): Promise<Kitchen[]> {
    return [{ ...this.kitchen }];
  }

  async getKitchenMetrics(_kitchenId: string): Promise<KitchenMetrics> {
    const total = calculateTotalPortions(this.plan.portions);
    return {
      ...SAMPLE_METRICS,
      totalPlannedToday: total,
      approved: this.plan.approved,
    };
  }

  async getPreparationPlan(_kitchenId: string, _date: string): Promise<PreparationPlan> {
    return { ...this.plan };
  }

  async updatePreparationPlan(updatedPlan: PreparationPlan): Promise<PreparationPlan> {
    this.plan = {
      ...updatedPlan,
      totalPortions: calculateTotalPortions(updatedPlan.portions),
      approved: false, // reset approval upon plan modification
    };
    return { ...this.plan };
  }

  async approvePreparationPlan(_planId: string): Promise<PreparationPlan> {
    this.plan = {
      ...this.plan,
      approved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: 'Chef Operations (Demo)',
    };
    return { ...this.plan };
  }

  async getDemandForecasts(_kitchenId: string, date: string): Promise<DemandForecast[]> {
    return DEFAULT_MEALS.map((service) =>
      estimateMealDemand(this.history, service.key, date, this.plan.bufferPercent)
    );
  }

  async getConsumptionHistory(_kitchenId: string): Promise<ConsumptionRecord[]> {
    return [...this.history];
  }
}

// Global demo singleton instance
export const demoApiClient = new DemoMealRelayApiClient();

/**
 * Returns the active API client.
 * Currently defaults to DemoMealRelayApiClient until remote Supabase credentials are authenticated.
 */
export function getMealRelayApiClient(): MealRelayApiClient {
  return demoApiClient;
}
