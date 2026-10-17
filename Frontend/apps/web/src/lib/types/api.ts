/**
 * Shared API Types matching FastAPI backend schemas exactly.
 */

export interface ForecastItemRequest {
  dish_id: string;
  dish_name?: string;
}

export type ForecastDishItem = ForecastItemRequest;

export interface ForecastRequest {
  meal_date: string; // ISO format: YYYY-MM-DD
  meal_type: "breakfast" | "lunch" | "dinner";
  expected_attendance: number;
  dishes: ForecastItemRequest[];
  safety_buffer_pct?: number; // e.g. 0.05, 0.08, 0.10
}

export interface DishForecastRecommendation {
  dish_id: string;
  dish_name: string;
  meal_type: string;
  predicted_portions: number;
  safety_buffer_pct: number;
  recommended_portions: number;
  model_used: "random_forest" | "baseline_fallback" | string;
  data_points_count: number;
  is_fallback: boolean;
  explanation_factors: string[];
}

export interface ForecastResponse {
  meal_date: string;
  meal_type: string;
  expected_attendance: number;
  safety_buffer_pct: number;
  recommendations: DishForecastRecommendation[];
  total_recommended_portions: number;
  generated_at: string;
}

export interface MealRecordCreate {
  dish_id: string;
  dish_name?: string;
  meal_date: string; // ISO format: YYYY-MM-DD
  meal_type: "breakfast" | "lunch" | "dinner";
  day_of_week?: number; // 0=Monday, 6=Sunday
  attendance?: number | null;
  prepared_portions: number;
  served_portions?: number | null;
  leftover_portions?: number | null;
  category?: string | null;
  is_synthetic?: boolean;
}

export interface MealRecord extends MealRecordCreate {
  id: string;
  day_of_week: number;
}

export interface MealRecordsFilterParams {
  dish_id?: string;
  meal_type?: "breakfast" | "lunch" | "dinner" | string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface DishCatalogItem {
  id: string;
  name: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  category: "main" | "curry" | "rice" | "bread" | "side" | "beverage" | "dessert";
  description?: string;
}

export interface ModelMetrics {
  model_name: string;
  mae: number;
  rmse: number;
  over_prediction_rate_pct: number;
  under_prediction_rate_pct: number;
  mean_bias_portions: number;
  sample_count: number;
}

export interface EvaluationReport {
  random_forest: ModelMetrics;
  baseline: ModelMetrics;
  mae_improvement_pct: number;
  train_samples_count: number;
  test_samples_count: number;
  train_days_count: number;
  test_days_count: number;
  is_synthetic: boolean;
  disclaimer: string;
}

