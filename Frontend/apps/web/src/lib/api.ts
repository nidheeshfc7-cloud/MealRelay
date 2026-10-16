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
  DishCatalogItem,
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
 * Submits actual shift outcomes (served, leftover, attendance) to close the feedback loop.
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
