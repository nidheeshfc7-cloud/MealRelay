import type { DishCatalogItem } from "@/lib/types/api";
import type { MealServiceKey } from "@mealrelay/types";

// Uses the existing FastAPI category contract.
export const MENU_CATEGORIES: DishCatalogItem["category"][] = ["main", "curry", "rice", "bread", "side", "beverage", "dessert"];
export type MenuInput = { name: string; category: DishCatalogItem["category"]; price: number };
export type MenuItem = MenuInput & { id: string; created_at: string };
export type ActivityInput = {
  menu_item_id: string; service_date: string; meal_service: MealServiceKey;
  prepared: number; served: number; leftover: number; attendance: number; notes: string;
};
export type ActivityLog = ActivityInput & { id: string; created_at: string };
export type KitchenResult<T> = { ok: true; data: T } | { ok: false; error: string };

