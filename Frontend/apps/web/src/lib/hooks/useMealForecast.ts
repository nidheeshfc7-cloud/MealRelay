"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { fetchMealForecast } from "../api";
import { useAccountIdentity } from "@/components/auth/AccountIdentity";
import {
  ForecastRequest,
  ForecastResponse,
  ForecastDishItem,
} from "../types/api";

export interface UseMealForecastParams {
  date: string; // ISO date string "YYYY-MM-DD" or formatted "Tue, 12 Aug 2025"
  mealType: "breakfast" | "lunch" | "dinner";
  expectedAttendance: number;
  safetyBufferPct: number; // e.g. 0.05, 0.08, 0.10
  dishes: ForecastDishItem[];
}

export interface UseMealForecastReturn {
  forecast: ForecastResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isOffline: boolean;
}

// Session-level memory cache to eliminate redundant network roundtrips
const forecastSessionCache = new Map<string, ForecastResponse>();

/**
 * Normalizes input date string to "YYYY-MM-DD"
 */
export const normalizeToIsoDate = (inputDate: string): string => {
  if (!inputDate) {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    return inputDate;
  }

  // Parse strings like "Tue, 12 Aug 2025" or standard parseable dates
  const parsed = Date.parse(inputDate);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Default fallback if unparseable
  return "2025-08-12";
};

/**
 * React hook to query the FastAPI Random Forest forecasting service.
 * Follows zero-fallback specification: cleanly reports errors if backend is unavailable.
 */
export const useMealForecast = ({
  date,
  mealType,
  expectedAttendance,
  safetyBufferPct,
  dishes,
}: UseMealForecastParams): UseMealForecastReturn => {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const account = useAccountIdentity();
  const isoDate = normalizeToIsoDate(date);
  const dishesKey = dishes.map((d) => d.dish_id).sort().join(",");
  const cacheKey = `${account.id}_${isoDate}_${mealType}_${expectedAttendance}_${safetyBufferPct}_${dishesKey}`;

  // Keep track of ongoing request ID to prevent race conditions
  const requestIdRef = useRef<number>(0);

  const loadForecast = useCallback(
    async (forceBypassCache: boolean = false): Promise<void> => {
      // Early return if dishes list is empty
      if (dishes.length === 0) {
        setForecast(null);
        setIsLoading(false);
        setError("At least one dish must be specified to generate a forecast.");
        return;
      }

      // Check session memory cache first
      if (!forceBypassCache && forecastSessionCache.has(cacheKey)) {
        setForecast(forecastSessionCache.get(cacheKey)!);
        setIsLoading(false);
        setError(null);
        setIsOffline(false);
        return;
      }

      const currentRequestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);

      const payload: ForecastRequest = {
        meal_date: isoDate,
        meal_type: mealType,
        expected_attendance: expectedAttendance,
        safety_buffer_pct: safetyBufferPct,
        dishes: dishes.map((d) => ({
          dish_id: d.dish_id,
          dish_name: d.dish_name,
        })),
      };

      try {
        const response = await fetchMealForecast(payload);

        // If another request started while this was pending, discard result
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        forecastSessionCache.set(cacheKey, response);
        setForecast(response);
        setError(null);
        setIsOffline(false);
      } catch (err: unknown) {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to connect to FastAPI forecasting engine at http://localhost:8000";

        setError(errorMessage);
        setForecast(null);
        setIsOffline(true);
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsLoading(false);
        }
      }
    },
    [isoDate, mealType, expectedAttendance, safetyBufferPct, dishes, cacheKey]
  );

  useEffect(() => {
    loadForecast(false);
  }, [loadForecast]);

  const refetch = useCallback(async (): Promise<void> => {
    await loadForecast(true);
  }, [loadForecast]);

  return {
    forecast,
    isLoading,
    error,
    refetch,
    isOffline,
  };
};
