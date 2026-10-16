# MealRelay — Frontend & ML Model Integration Plan

This document provides a checklist-driven, step-by-step roadmap to directly integrate the **FastAPI Machine Learning Forecasting Engine** (`backend/`) with the **Next.js Web Frontend** (`frontend/apps/web/`).

The plan focuses strictly on **essential institutional kitchen functionality** with direct communication to the ML model (zero fallback layer). Every task is broken into granular sub-steps with checkboxes that can be checked off upon completion.

---

## 1. Scope & Decision Matrix

Institutional kitchen operators (hostel mess supervisors, college canteen managers) require accurate cooking numbers and clear operational reasons—not raw data science telemetry.

### ✅ In Scope: Essential Functionality
- **Direct Live Forecasting (`POST /forecast`)**: Query the Random Forest model for portions needed for next-day breakfast, lunch, and dinner.
- **Dynamic Safety Cushion**: Apply a configurable safety buffer (+5%, +8%, +10%) that computes the ceiling preparation count: $\lceil \text{demand} \times (1 + \text{buffer}) \rceil$.
- **Grounded Factor Explainability**: Directly map model `explanation_factors` into dish notes and key insight cards.
- **Chef Quantity Override**: Allow the mess supervisor to adjust quantities manually before confirming tomorrow's plan.
- **Closing the Feedback Loop (`POST /records`)**: Log actual served portions and leftovers at shift close so the ML model adapts.
- **Direct Error Feedback**: Clean, unambiguous error states if the FastAPI service is unreachable (no synthetic fallback layer).

### ❌ Out of Scope: Excluded Clutter
- No local heuristic fallback layer (direct FastAPI connection only).
- No complex SHAP waterfall plots or tree branch diagrams.
- No raw model hyperparameter tuning controls.
- No per-keystroke real-time retraining.

---

## 2. API Contract & Payload Specifications

### 2.1 Next-Day Forecast Endpoint
- **Method & Path**: `POST /forecast`
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

### 2.2 Actual Outcomes Logging Endpoint
- **Method & Path**: `POST /records`
- **Request Payload**:
  ```json
  {
    "dish_id": "dish_rice",
    "meal_date": "2025-08-12",
    "meal_type": "lunch",
    "attendance": 182,
    "prepared_portions": 65,
    "served_portions": 61,
    "leftover_portions": 4
  }
  ```

---

## 3. Checklist-Driven Implementation Roadmap

### Phase 1: API Client Setup & Configuration
- [x] **1.1**: Verify FastAPI CORS settings in `backend/src/main.py` explicitly allow requests from `http://localhost:3000`.
- [x] **1.2**: Add `NEXT_PUBLIC_API_URL=http://localhost:8000` to `frontend/apps/web/.env.local` and `.env.example`.
- [x] **1.3**: Create shared TypeScript interfaces matching backend schemas in `frontend/apps/web/src/lib/types/api.ts`:
  - `ForecastRequest`
  - `ForecastResponse`
  - `DishForecastRecommendation`
  - `MealRecordCreate`
- [x] **1.4**: Implement strongly typed `fetchMealForecast(request: ForecastRequest)` in `frontend/apps/web/src/lib/api.ts` with error handling.
- [x] **1.5**: Implement strongly typed `logMealRecord(record: MealRecordCreate)` in `frontend/apps/web/src/lib/api.ts`.

### Phase 2: Live Forecast Hook & State Management
- [x] **2.1**: Build `useMealForecast` React hook managing active parameters `[date, shift, attendance, bufferPct]`.
- [x] **2.2**: Implement in-flight loading state (`isLoading: boolean`) with visual indicator.
- [x] **2.3**: Implement clear error state (`error: string | null`) that displays an alert banner if the backend is offline.
- [x] **2.4**: Implement buffer reactivity: changing safety buffer (+5%, +8%, +10%) triggers re-calculation or re-query.
- [x] **2.5**: Cache responses in session memory by `date_shift_buffer` to prevent redundant network requests.

### Phase 3: Wiring ML Outputs into Dashboard UI Components
- [x] **3.1**: Connect `DashboardHeader`:
  - [x] Selecting a date triggers `useMealForecast` with the target planning date.
  - [x] Selecting a meal shift (Breakfast, Lunch, Dinner) passes the active shift to the forecast query.
- [x] **3.2**: Connect `MetricCards`:
  - [x] **Estimated Demand**: Bind to the sum of ML `predicted_portions` from recommendations.
  - [x] **Recommended Preparation**: Bind to ML `total_recommended_portions`.
  - [x] **Forecast Confidence**: Set to "High" when Random Forest is used, or "Moderate" if sparse history triggered baseline fallback.
- [x] **3.3**: Connect `DishPreparationTable`:
  - [x] Dynamically render dishes from ML `recommendations`.
  - [x] Display ML `predicted_portions` in the **Predicted Demand** column.
  - [x] Display ML `recommended_portions` in the **Recommended Qty** highlighted card pill.
  - [x] Display `recommendation.explanation_factors[0]` in the **Notes** column.
- [x] **3.4**: Connect `KeyInsightsPanel`:
  - [x] Parse attendance ratio factor from ML response into the "Attendance Trend" card.
  - [x] Parse day-of-week curve factor from ML response into the "Dining Schedule" card.
  - [x] Parse buffer calculation into the "Shortage Protection" card.
- [x] **3.5**: Connect `DashboardActionBar` & `EditQuantitiesModal`:
  - [x] Allow chef to adjust portions manually using `-` and `+` steppers before cooking.
  - [x] Save manual overrides locally and update total portion counts.
  - [x] Mark work order as "Confirmed" on clicking **Confirm Preparation Plan**.

### Phase 4: Closing the Feedback Loop (Recording Actual Outcomes)
- [x] **4.1**: Build a clean "Log Shift Outcomes" modal/drawer in `frontend/apps/web/src/components/dashboard/LogOutcomesModal.tsx`.
- [x] **4.2**: Add inputs for each dish: `served_portions`, `leftover_portions`, and final `actual_attendance`.
- [x] **4.3**: Wire form submission to call `logMealRecord` (`POST /records`).
- [x] **4.4**: Verify that submitted records update backend model state for subsequent forecasting cycles.

### Phase 5: Verification & End-to-End Validation
- [x] **5.1**: Run `npm run typecheck` across `frontend/apps/web` to confirm zero TypeScript errors.
- [x] **5.2**: Test live forecast query against the running FastAPI server (`http://localhost:8000`).
- [x] **5.3**: Verify clean error handling when FastAPI server is stopped (no fallback layer, clear connection warning).
- [x] **5.4**: Test the complete mess workflow end-to-end:
  - Select planning date and shift $\rightarrow$
  - Inspect ML recommended portions and grounded notes $\rightarrow$
  - Adjust buffer or edit portions $\rightarrow$
  - Confirm cooking plan $\rightarrow$
  - Log actual served and leftover outcomes.
