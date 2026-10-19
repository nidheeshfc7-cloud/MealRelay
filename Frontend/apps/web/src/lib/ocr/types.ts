import type { DishCatalogItem } from "@/lib/types/api";
import type { MealServiceKey } from "@mealrelay/types";

export type OcrFilterPreset = "adaptive" | "high_contrast" | "natural";

export interface OcrProgress {
  status: string;
  progress: number; // 0 to 100
}

export interface ExtractedMenuItem {
  id: string;
  name: string;
  category: DishCatalogItem["category"];
  price: number;
  confidence: "high" | "review_needed";
  confidenceScore: number;
  isExistingMatch: boolean;
  existingId?: string;
  selected: boolean;
}

export interface ExtractedActivityRecord {
  id: string;
  service_date: string;
  meal_service: MealServiceKey;
  dish_name: string;
  menu_item_id: string;
  prepared: number;
  served: number;
  leftover: number;
  attendance: number;
  notes: string;
  isValid: boolean;
  selected: boolean;
}

export interface OcrEngineResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
  }>;
}
