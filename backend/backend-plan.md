# 📋 MealRelay Backend AI Model — Improvement Plan & Roadmap

> **Human-First, Production-Focused Machine Learning Architecture Plan**  
> Tailored for everyday kitchen managers, hostel mess supervisors, and canteen operators. Focuses on single-target preparation recommendations, closed-loop retraining, domain feature engineering, and robust physical safety guardrails (with zero unnecessary database or terminology clutter).

---

## 📑 Table of Contents

1. [Core Design Philosophy & Architectural Principles](#1-core-design-philosophy--architectural-principles)
2. [Phase 1: Real-Time Kitchen Log Ingestion & Closed-Loop Learning](#phase-1-real-time-kitchen-log-ingestion--closed-loop-learning)
3. [Phase 2: Customer-Friendly Backend Output Schema (Single-Target Output)](#phase-2-customer-friendly-backend-output-schema-single-target-output)
4. [Phase 3: Domain Feature Engineering & Seasonality Signals](#phase-3-domain-feature-engineering--seasonality-signals)
5. [Phase 4: AI Pattern Recognition vs. Hardcoded Physical Guardrails](#phase-4-ai-pattern-recognition-vs-hardcoded-physical-guardrails)
6. [Phase 5: Model Optimization, Persistence & Edge Deployment](#phase-5-model-optimization-persistence--edge-deployment)

---

## 1. Core Design Philosophy & Architectural Principles

1. **One Clear Cooking Number (No "Cushion" Sliders or Math Jargon)**:
   - A mess supervisor should never have to calculate a buffer percentage or wonder which number to cook.
   - The AI model absorbs demand volatility internally and outputs **one single actionable target: `cook_portions`** (e.g. *"Cook 170 plates"*).
   - If a chef wants to adjust, they use intuitive `+` / `-` steppers (+5 / -5 plates) based on their daily intuition.
2. **AI Pattern Recognition vs. Hardcoded Guardrails**:
   - **No hardcoded demand curves**: The Random Forest dynamically learns how attendance, day of week, and dish popularity affect demand.
   - **Hardcoded physical guardrails only**: Hardcoded rules are strictly reserved for physical constraints (whole plate ceiling rounding, minimum nutritional serving floors, and typo rejection).
3. **Database Simplicity**:
   - **No SQLite**: Avoid creating an intermediate throwaway database. Keep the lightweight in-memory cache for ultra-fast local testing and development, and integrate directly with **Supabase PostgreSQL** for multi-tenant production.
4. **Instant Adaptation**:
   - When actual meal consumption is logged at the end of a shift, the model retrains immediately in-memory ($< 80\text{ ms}$) so tomorrow's forecast already reflects today's dining habits.

---

## Phase 1: Real-Time Kitchen Log Ingestion & Closed-Loop Learning

Close the operational loop so the AI model dynamically improves every time a meal session finishes.

- [x] **1.1: Automated Dynamic Retraining on Record Ingestion**
  - [x] Wire `ForecastService.add_record()` to automatically trigger `_retrain_models()` upon logging a meal outcome.
  - [x] Update both `HistoricalAverageBaseline` and `DemandRandomForestModel` in-memory without restarting the FastAPI server.
- [x] **1.2: Batch Shift Outcomes Ingestion Endpoint**
  - [x] Implement `POST /api/records/batch` in `backend/src/api/routes/records.py` accepting a list of meal outcomes from the frontend shift close modal.
  - [x] Retrain the Random Forest model once for the entire batch to optimize performance.
- [x] **1.3: Priority Sample Weighting (Real Kitchen Data vs. Synthetic)**
  - [x] Configure `FeaturePreprocessor.prepare_training_dataset()` to assign a **$3.0\times$ priority sample weight** (`sample_weight=3.0`) to authenticated kitchen logs (`is_synthetic=False`).
  - [x] Ensure real student eating habits rapidly steer tree splits over initial synthetic seed data without catastrophic forgetting.
- [x] **1.4: Kitchen Input Sanity Guardrails**
  - [x] Add physical sanity checks in `MealRecordCreate`:
    - [x] Reject negative portions or negative attendance.
    - [x] Reject obvious typo values (e.g., $\text{served} > 5\times \text{attendance}$).
    - [x] Enforce $\text{leftover} \le \text{prepared}$ and $\text{served} \le \text{prepared}$.
    - [x] Enforce $(\text{served} + \text{leftover}) \le \text{prepared}$.

---

## Phase 2: Customer-Friendly Backend Output Schema (Single-Target Output)

Eliminate confusing data-science telemetry from the API response and output clean, everyday kitchen terms.

- [x] **2.1: Transition to Single-Target Preparation Schema (`cook_portions`)**
  - [x] Update `DishForecastRecommendation` schema to replace `predicted_portions`, `safety_buffer_pct`, and `recommended_portions` with:
    ```python
    class DishForecastRecommendation(BaseModel):
        dish_id: str
        dish_name: str
        meal_type: str
        category: str                    # "Main Curry", "Rice", "Bread", etc.
        cook_portions: int               # Single unambiguous target to cook
        unit: str                        # "plates", "bowls", "pieces", "cups"
        confidence: str                  # "High", "Moderate" (replaces raw fallback booleans)
        simple_reason: str               # One clear, friendly sentence
        suggested_step: int = 5          # Stepper increment for manual adjustment
    ```
- [x] **2.2: Plain-Language Reason Generator**
  - [x] Replace mathematical formula strings with natural kitchen explanations:
    - *Good*: *"Based on 185 students expected for lunch. Sunday special curry sees high turnout."*
    - *Avoid*: *"+10% safety buffer applied (+16 extra portions) with modeled ratio 0.83x."*
- [x] **2.3: Non-Technical Session Response**
  - [x] Update `ForecastResponse` to present clear session totals:
    - `total_cook_portions: int` (sum across all dishes in the session)
    - `expected_students: int`
    - `dishes: List[DishForecastRecommendation]`

---

## Phase 3: Domain Feature Engineering & Seasonality Signals

Give the Random Forest regressor rich institutional mess signals to boost prediction accuracy.

- [x] **3.1: Ratio-Based Demand Modeling**
  - [x] Model target as continuous per-student consumption ratio:
    $$y = \frac{\text{served\_portions}}{\text{attendance}}$$
  - [x] Reconstruct recommended preparation at inference time:
    $$\text{cook\_portions} = \lceil \text{predicted\_ratio} \times \text{expected\_attendance} \rceil$$
  - [x] Prevents model distortion when student headcount swings between weekends (110 students) and weekdays (195 students).
- [x] **3.2: Same-Weekday Rolling Demand Lags**
  - [x] Replace the generic 7-day average with a **same-weekday rolling lag** (e.g., average demand over the last 3 Tuesdays for a Tuesday meal).
  - [x] Captures cyclical weekly routines (e.g., Friday dinner peaks, Sunday breakfast sleep-ins).
- [x] **3.3: Dish Category Encoding**
  - [x] Include dish `category` (`curry`, `rice`, `bread`, `main`, `side`, `dessert`, `beverage`) in the `ColumnTransformer`.
  - [x] Allows the model to generalize intake baselines (e.g., rotis typically eaten at $\sim 2.2$ per student vs. sweet desserts strictly $1.0$ per student).
- [x] **3.4: Menu Synergy & Co-Occurrence Appetite Splits**
  - [x] Include session menu context flags (e.g. `is_paired_with_rice`, `competing_curries_count`) to account for appetite splits when multiple curries/dishes are offered simultaneously.

---

## Phase 4: AI Pattern Recognition vs. Hardcoded Physical Guardrails

Clearly separate dynamic machine learning from essential physical kitchen safety limits.

- [x] **4.1: Internal Volatility Absorption (Adaptive Buffer)**
  - [x] Let the model measure dish variance internally (using tree spread or historical residuals).
  - [x] Automatically bake higher protection into high-volatility dishes (e.g. non-veg / paneer specials) and tighter margins into staples (steamed rice, yellow dal) without exposing math sliders to the user.
- [x] **4.2: Hardcoded Nutritional Safety Floor (Never Starve Students)**
  - [x] Enforce hardcoded rule:
    $$\text{cook\_portions} \ge \lceil \text{expected\_attendance} \times \text{min\_floor\_ratio} \rceil$$
  - [x] For main rice/curry/bread dishes, ensure minimum preparation never drops below $0.50$ servings per student, regardless of sparse data anomalies.
- [x] **4.3: Physical Integer Ceilings**
  - [x] Enforce `math.ceil` rounding on all preparation numbers. Kitchen staff cannot cook fractional portions.
- [x] **4.4: Transparent Data Sufficiency Indicator**
  - [x] When a dish has $< 5$ recorded historical meals, internally use the historical mess average and set `confidence: "Moderate (Building kitchen history)"` instead of technical fallback warnings.

---

## Phase 5: Model Optimization, Persistence & Edge Deployment

Keep the backend fast, lightweight, and deployable on edge kitchen hardware or cloud instances.

- [x] **5.1: Thread-Safe Single-Core Execution (`n_jobs=1`)**
  - [x] Set `n_jobs=1` in `DemandRandomForestModel` to eliminate inter-process socket locks on Windows and single-board edge computers.
  - [x] Retain lightning-fast training times ($< 80\text{ ms}$ for 850 records).
- [x] **5.2: In-Memory Cache + Direct Supabase Integration (No SQLite)**
  - [x] Maintain the lightweight in-memory collection for zero-setup local speed and hackathon testing.
  - [x] Prepare direct Supabase PostgreSQL connector for persistent production storage (skipping temporary SQLite complexity).
- [x] **5.3: Offline-First Edge Readiness**
  - [x] Verify that the complete FastAPI service runs locally on a kitchen terminal, Intel NUC, or Raspberry Pi 4/5 with $< 50\text{ MB}$ RAM footprint.
  - [x] Allow kitchen staff to generate plans and log outcomes with zero internet connectivity.
- [x] **5.4: Automated Test Suite for Continuous Learning**
  - [x] Write integration test verifying that logging 3 high-consumption meals immediately increases the next day's `cook_portions` for that dish.

---

## 📌 Checklist Progress Summary

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Real-Time Kitchen Log Ingestion & Closed-Loop Learning | 🟢 Completed |
| **Phase 2** | Customer-Friendly Backend Output Schema (Single-Target Output) | 🟢 Completed |
| **Phase 3** | Domain Feature Engineering & Seasonality Signals | 🟢 Completed |
| **Phase 4** | AI Pattern Recognition vs. Hardcoded Physical Guardrails | 🟢 Completed |
| **Phase 5** | Model Optimization, Persistence & Edge Deployment | 🟢 Completed |
