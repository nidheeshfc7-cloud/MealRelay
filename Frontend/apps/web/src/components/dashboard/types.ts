export type MealShiftKey = "breakfast" | "lunch" | "dinner";

export interface DishItem {
  id: string;
  name: string;
  category: string;
  imageEmoji: string;
  imageBg: string;
  predictedDemand: number;
  recommendedQty: number;
  unit: string;
  note: string;
}

export interface ShiftInfo {
  key: MealShiftKey;
  label: string;
  timeWindow: string;
}

export interface KeyInsight {
  id: string;
  type: "down" | "up" | "info";
  title: string;
  description: string;
}
