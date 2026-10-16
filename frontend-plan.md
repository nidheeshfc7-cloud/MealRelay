# MealRelay — Frontend & ML Model Integration Plan

This document details the engineering roadmap to connect the **FastAPI Machine Learning Forecasting Engine** (`backend/`) with the **Next.js Web Application** (`frontend/apps/web/`).

The objective is to achieve a **pragmatic balance** between changes in the ML model and the UI to deliver the **most critical, high-impact functionality without unnecessary complexity**.

---

## 1. Scope Decision Matrix: Important vs. Low-Value Functionality

Institutional kitchen operators (hostel mess supervisors, college canteen managers) need actionable cooking numbers and clear operational reasons—not raw data science telemetry.

### ✅ Important Functionality (Core MVP — High Value)

| Feature | Operational Value | Implementation Path |
| :--- | :--- | :--- |
| **Next-Day Portion Demand** | Chefs know exactly how many portions of rice, dal, and roti to prepare before cooking starts. | `POST /forecast` querying `DemandRandomForestModel` with fallback to `HistoricalAverageBaseline`. |
| **Protective Safety Cushion** | Prevents running out during peak student rushes without overproducing food. | Configurable `safety_buffer_pct` (+5%, +8%, +10%) dynamically recalculating preparation ceiling: $\lceil \text{demand} \times (1 + \text{buffer}) \rceil$. |
| **Plain-Language Explainability** | Mess managers trust recommendations because they see the grounded operational factors (e.g., weekend slump, recent 7-day momentum). | Map `explanation_factors` directly into the UI table's **Notes** column and **Key Insights** panel. |
| **Chef Override & Lock** | Chef retains ultimate control; can bump quantities up or down by 5 portions and lock the final work order. | Interactive `EditQuantitiesModal` with steppers and `Confirm Preparation Plan` action state. |
| **Closing the Feedback Loop** | Enables the ML model to learn from real kitchen outcomes day-over-day. | `POST /records` endpoint logging actual prepared, served, and leftover quantities at shift close. |
| **Offline & Demo Fallback** | Guarantees the dashboard never crashes during client demos or network interruptions. | Client falls back to `@mealrelay/core` local heuristics if the FastAPI server is unreachable. |

### ❌ Low-Value Functionality (Excluded / Fluff to Avoid)

| Low-Value Feature | Reason to Exclude |
| :--- | :--- |
| **SHAP Waterfall & Tree Visualizations** | Confuses non-technical mess supervisors. Operational text explanations are far more useful. |
| **Raw Hyperparameter Tuning UI** | Mess managers should not be tuning `n_estimators`, `max_depth`, or `min_samples_split`. |
| **Complex Multi-Tenant Auth Walls** | Adds friction to local pilot deployments and testing. Organization context can be stored in session state. |
| **Per-Keystroke Realtime Retraining** | Retraining Random Forest on every slider change causes UI latency. Batch retraining at shift close or daily cron is sufficient. |

---

## 2. ML Backend Contracts & Required Adjustments

### 2.1 Backend Endpoints Available (`backend/src/api/routes/`)

1. **`POST /forecast`** (`src/api/routes/forecast.py`):
   - **Request Payload**:
     ```json
     {
       "meal_date": "2025-08-12",
       "meal_type": "lunch",
       "expected_attendance": 185,
       "dishes": [
         { "dish_id": "dish_rice", "dish_name": "Steamed Rice" },
         { "dish_id": "dish_dal", "dish_name": "Dal Tadka" },
         { "dish_id": "dish_mix_veg", "dish_name": "Mixed Vegetable" },
         { "dish_id": "dish_roti", "dish_name": "Roti" }
       ],
       "safety_buffer_pct": 0.05
     }
     ```
   - **Response Payload**:
     ```json
     {
       "meal_date": "2025-08-12",
       "meal_type": "lunch",
       "expected_attendance": 185,
       "safety_buffer_pct": 0.05,
       "recommendations": [
         {
           "dish_id": "dish_rice",
           "dish_name": "Steamed Rice",
           "meal_type": "lunch",
           "predicted_portions": 60.0,
           "safety_buffer_pct": 0.05,
           "recommended_portions": 65,
           "model_used": "random_forest",
           "data_points_count": 60,
           "is_fallback": false,
           "explanation_factors": [
             "Expected attendance of 185 students with modeled consumption ratio of ~0.32x.",
             "Aligned with typical weekday Tuesday dining attendance curve.",
             "+5% safety buffer applied (+5 extra portions) to prevent food shortage."
           ]
         }
       ],
       "total_recommended_portions": 213,
       "generated_at": "2025-08-11T18:30:00Z"
     }
     ```

2. **`POST /records`** (`src/api/routes/records.py`):
   - Submits actual outcomes (`prepared_portions`, `served_portions`, `leftover_portions`, `attendance`) to update the training dataset.

3. **`GET /metrics`** (`src/api/routes/forecast.py`):
   - Returns validation metrics (`mae`, `rmse`, `over_prediction_rate_pct`, `mae_improvement_pct`) comparing Random Forest against historical average baseline.

### 2.2 Minimal Backend Refinements Needed

To ensure seamless integration with the frontend without introducing breaking changes:
1. **CORS Middleware Verification** (`backend/src/main.py`):
   - Verify `CORSMiddleware` allows requests from `http://localhost:3000` and `https://*.vercel.app`.
2. **Standard Dish ID Alignment**:
   - Ensure standard synthetic dish catalog (`src/data/synthetic.py`) shares matching dish IDs (`dish_rice`, `dish_dal`, `dish_mix_veg`, `dish_roti`) with the frontend UI presets.
3. **Summary Factors in Forecast Response**:
   - Add an optional top-level `session_insights` list to `ForecastResponse` summarizing overall shift trends (e.g., "5% lower attendance expected for Tuesday lunch") so the frontend `KeyInsightsPanel` can consume it directly.

---

## 3. Step-by-Step Frontend Integration Roadmap

### Phase 1: API Client Layer (`packages/api/` or `apps/web/src/lib/api.ts`)

- **Objective**: Create a strongly typed, resilient API client for all backend calls.
- **Tasks**:
  1. Define TypeScript request/response interfaces matching Pydantic schemas in `backend/src/schemas/forecast.py`.
  2. Implement `fetchForecast(request: ForecastRequest): Promise<ForecastResponse>` using standard `fetch` with a 4-second timeout.
  3. Support environment variable configuration:
     - `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` (FastAPI backend).
     - Fallback to mock adapter if `NEXT_PUBLIC_API_URL` is empty or unreachable.

```typescript
// Example Client Method
export const fetchMealForecast = async (
  request: ForecastRequest
): Promise<ForecastResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const response = await fetch(`${baseUrl}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) {
    throw new Error(`Forecasting API returned HTTP ${response.status}`);
  }
  return response.json();
};
```

---

### Phase 2: React Data Fetching Hook (`useMealForecast.ts`)

- **Objective**: Manage asynchronous state, loading spinners, and transparent fallbacks.
- **Tasks**:
  1. Create `useMealForecast(date, shift, attendance, dishes, bufferPct)`.
  2. Cache responses by `[date, shift, bufferPct]` to prevent redundant API queries.
  3. When an API call fails or times out:
     - Log a non-blocking console notice.
     - Fallback seamlessly to `@mealrelay/core` local estimation.
     - Mark `isOfflineFallback: true` to display a subtle indicator ("Using local baseline") rather than a fatal error screen.

---

### Phase 3: Wire ML Output into the 5 UI Components

#### 1. `DashboardHeader.tsx`
- **Integration**:
  - Selecting a new date (`selectedDate`) or shift (`selectedShift`) triggers a re-fetch of the ML forecast.
  - Passes formatted ISO date (`YYYY-MM-DD`) and lowercase meal type to the API.

#### 2. `MetricCards.tsx`
- **Integration**:
  - **Estimated Demand**: Populated by summing `r.predicted_portions` across all dishes in the response.
  - **Recommended Preparation**: Populated by `total_recommended_portions` from the ML response.
  - **Forecast Confidence**: Evaluated based on whether Random Forest or baseline fallback was used:
    - If `recommendations.every(r => !r.is_fallback)` $\rightarrow$ **High Confidence** (Random Forest trained on $\ge 60$ days).
    - If any dish uses fallback $\rightarrow$ **Moderate Confidence** with transparent tooltip note.

#### 3. `DishPreparationTable.tsx`
- **Integration**:
  - `Predicted Demand`: Displays raw ML model output `predicted_portions`.
  - `Recommended Qty`: Displays ceiling output `recommended_portions` (incorporating `safety_buffer_pct`).
  - `Notes`: Displays `recommendation.explanation_factors[0]` (e.g., *"Based on average demand for Tuesdays"* or *"Similar to last 4 weeks"*).

#### 4. `KeyInsightsPanel.tsx`
- **Integration**:
  - Extracts cross-cutting operational factors from the ML response:
    - Attendance velocity factor $\rightarrow$ *"Lower attendance expected: 5% lower than usual for Tuesdays"*.
    - Dish momentum factor $\rightarrow$ *"Dal demand slightly higher: consumption +12% over past 2 weeks"*.
    - Calendar event factor $\rightarrow$ *"No holidays or special events expected tomorrow"*.

#### 5. `EditQuantitiesModal.tsx` & `DashboardActionBar.tsx`
- **Integration**:
  - Chef can fine-tune portion recommendations before locking.
  - Clicking **Confirm Preparation Plan** updates the local session plan and marks the work order locked.

---

### Phase 4: Closing the Feedback Loop (`POST /records`)

- **Objective**: Enable mess supervisors to log end-of-day leftovers so the ML model adapts.
- **Tasks**:
  1. Add a streamlined "Log Shift Outcomes" modal/page accessible from the header or action bar.
  2. For each dish in the completed shift, record:
     - `served_portions`
     - `leftover_portions`
     - `actual_attendance`
  3. Dispatch payload to `POST /records`.
  4. Backend automatically updates training data and retrains `DemandRandomForestModel` in memory.

---

### Phase 5: Resilient Fallback Layer

- **Objective**: Zero downtime, zero broken screens during demos or network downtime.
- **Architecture**:
  ```text
  [Next.js Dashboard]
          │
          ├──> 1. Try FastAPI Backend (POST /forecast)
          │         └──> Success: Render Random Forest Predictions & Live Factors
          │
          └──> 2. On Network Timeout / Offline:
                    └──> Fallback to @mealrelay/core Deterministic Heuristics
                    └──> Display subtle pill: "Local Baseline Active"
  ```

---

## 4. Verification & Testing Checklist

- [ ] **Type Safety**: `npm run typecheck` passes with zero errors across `@mealrelay/web` and `@mealrelay/api`.
- [ ] **Dynamic Dropdown**: Selecting a date in `DashboardHeader` updates state and fetches the corresponding forecast.
- [ ] **Buffer Reactivity**: Toggling buffer (+5%, +8%, +10%) immediately recalculates recommended portions.
- [ ] **Explainability Grounding**: Every dish note reflects actual ML output factors rather than hardcoded strings.
- [ ] **Graceful Degradation**: Dashboard renders perfectly even when the Python FastAPI server is stopped.
- [ ] **End-to-End Test**: Verify full flow: Forecast $\rightarrow$ Edit Quantities $\rightarrow$ Confirm Plan $\rightarrow$ Log Actual Outcomes.
