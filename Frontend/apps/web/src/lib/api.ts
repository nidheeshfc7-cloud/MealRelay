/**
 * MealRelay API Client
 * Provides direct communication with the FastAPI Machine Learning Forecasting Engine.
 * Strict zero-fallback policy: reports network/model errors cleanly to the UI.
 */

import {
  ForecastRequest,
  ForecastResponse,
  MealRecordCreate,
  MealRecord,
  MealRecordsFilterParams,
  DishCatalogItem,
  EvaluationReport,
} from "./types/api";

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

/**
 * Queries the Random Forest model for dish-level portions needed for the planned meal session.
 */
export const fetchMealForecast = async (
  request: ForecastRequest
): Promise<ForecastResponse> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/forecast`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail ||
      `Forecast request failed with status ${response.status} (${response.statusText})`;
    throw new Error(message);
  }

  const data: ForecastResponse = await response.json();
  return data;
};

/**
 * Submits actual shift outcomes (served, leftover, attendance) for a single dish to close the feedback loop.
 */
export const logMealRecord = async (
  record: MealRecordCreate
): Promise<MealRecord> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/records`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail ||
      `Logging meal record failed with status ${response.status} (${response.statusText})`;
    throw new Error(message);
  }

  const data: MealRecord = await response.json();
  return data;
};

/**
 * Atomically submits a batch of meal outcomes across multiple dishes from a shift.
 * Triggers a single continuous learning retrain on the Random Forest model with 3.0x sample weighting.
 */
export const logMealRecordsBatch = async (
  records: MealRecordCreate[]
): Promise<MealRecord[]> => {
  if (records.length === 0) {
    return [];
  }

  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/records/batch`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(records),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail ||
      `Batch logging failed with status ${response.status} (${response.statusText})`;
    throw new Error(message);
  }

  const data: MealRecord[] = await response.json();
  return data;
};

/**
 * Retrieves chronological meal records from the backend with optional filtering.
 */
export const fetchMealRecords = async (
  params?: MealRecordsFilterParams
): Promise<MealRecord[]> => {
  const baseUrl = getApiBaseUrl();
  const query = new URLSearchParams();

  if (params?.dish_id) query.append("dish_id", params.dish_id);
  if (params?.meal_type) query.append("meal_type", params.meal_type);
  if (params?.start_date) query.append("start_date", params.start_date);
  if (params?.end_date) query.append("end_date", params.end_date);
  if (params?.limit) query.append("limit", String(params.limit));

  const queryString = query.toString();
  const endpoint = `${baseUrl}/api/records${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch meal records (${response.status})`);
  }

  const data: MealRecord[] = await response.json();
  return data;
};


/**
 * Fetches the registered dish catalog from the backend.
 */
export const fetchDishesCatalog = async (): Promise<DishCatalogItem[]> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/dishes`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dishes catalog (${response.status})`);
  }

  const data: DishCatalogItem[] = await response.json();
  return data;
};

/**
 * Quick health check to verify if the FastAPI server is reachable.
 */
export const checkBackendHealth = async (): Promise<{
  status: string;
  models_ready: boolean;
  records_count: number;
}> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/health`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Backend health check failed (${response.status})`);
  }

  return response.json();
};

/**
 * Retrieves the ML model chronological holdout evaluation report (Random Forest vs Historical Average).
 */
export const fetchModelMetrics = async (): Promise<EvaluationReport> => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/api/metrics`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch model evaluation metrics (${response.status})`);
  }

  const data: EvaluationReport = await response.json();
  return data;
};
