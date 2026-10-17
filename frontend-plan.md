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

---

## 4. Phase 6: Awwwards-Caliber Visual & UX Craft Redesign (Anti-AI-Slop Overhaul)

### 4.1 Design Philosophy: From "AI Template" to "Luxury Enterprise Operations"
- **Zero Gimmicks / Emojis**: Replace cartoonish pastel emoji bubbles with bespoke culinary station tags, dietary badges (`100% VEG`, `HIGH PROTEIN`), and ingredient classification chips.
- **Architectural Radii & Hairline Precision**: Replace exaggerated 32px (`rounded-3xl`) bubbles with crisp, refined `rounded-2xl` and `rounded-xl` geometries with sub-pixel borders (`border-line-light/80`) and subtle ambient elevation (`shadow-[0_1px_3px_rgba(0,47,36,0.04),0_6px_20px_rgba(0,47,36,0.03)]`).
- **Cohesive Metric Instrument Deck**: Harmonize the 3 top metric cards. Rather than a jarring, all-dark green card next to an empty white card with the giant word "High", all three cards will share consistent visual dignity:
  - **Card 1: Expected Diner Turnout** (185 diners, 92.5% occupancy, Tuesday curve comparison).
  - **Card 2: Target Kitchen Production** (720 portions, 683 base + 37 buffer split, ~14.2 kg waste prevented).
  - **Card 3: ML Model Intelligence & Telemetry** (91% accuracy score, Random Forest Ensemble badge, 848 historical meal sessions, ±3.8% confidence interval).
- **Culinary Domain Realism**: Real commercial kitchens need raw batch weights and station routing. Add dynamic raw batch conversion (e.g. `188 portions ≈ 37.6 kg dry rice`) and kitchen prep stations (`Steamer 1`, `Kadai 2`, `Roti Press`).
- **Tabular Figures & Editorial Typography**: Implement `font-mono tabular-nums` for all quantities, weights, and percentages for razor-sharp alignment.
- **Brand Palette Adherence**: Strictly leverage the core design tokens:
  - `forest` (`#003F2F`, `#002F24`, `#143928`, `#245C40`)
  - `lime` (`#D5FB53`, `#E6FCA8`)
  - `canvas` & `ivory` (`#F6F7F1`, `#FFFFFF`)
  - `ink` (`#172A21`, `#718078`, `#8B9C92`)
  - `line` (`#E5EBE1`, `#123D2E`)
  - `sage` (`#EDF2E7`)

### 4.2 Component Work Breakdown
- [ ] **6.1 DashboardHeader.tsx**:
  - Live facility context bar (`Sreenidhi Central Dining • Hall 1 • Capacity: 200`).
  - Segmented meal service selector with active timing (`Breakfast`, `Lunch (12:30–14:30)`, `Dinner`).
  - Integrated safety buffer cushion group (`+5% Standard`, `+8% Surge`, `+10% Special`).
  - Refined date picker with quick shortcuts ("Today", "Tomorrow").
- [ ] **6.2 MetricCards.tsx**:
  - Executive 3-card instrument cluster with micro visual meters, tabular numbers, and zero awkward whitespace.
- [ ] **6.3 DishPreparationTable.tsx**:
  - Commercial kitchen production sheet layout.
  - Columns: Dish & Station, Modeled Appetite, Safety Cushion, Target Batch Output (portions + raw kg weight), 7-Day Trend Spark, and ML Factor Insight.
- [ ] **6.4 KeyInsightsPanel.tsx**:
  - Structured "Operational Intelligence Brief" replacing repetitive grey boxes.
  - Three distinct cards: Attendance Trajectory, Culinary Pairing Momentum, and Waste Guard.
- [ ] **6.5 DashboardActionBar.tsx**:
  - Docked glassmorphic production bar with batch summary, edit quantities trigger, shift actuals logging, and print/confirmation state.

