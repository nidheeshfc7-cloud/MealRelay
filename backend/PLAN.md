# Backend AI Model & API — PLAN.md

> Implementation plan for the MealRelay backend service and machine learning pipeline, adhering to `AGENTS.md` and root `PLAN.md`.

---

## 1. Objectives

- **Core Goal**: Forecast next-day portion demand per dish for hostel messes and recommend preparation quantities with a configurable safety buffer.
- **Base ML Model**: `RandomForestRegressor` (scikit-learn).
- **Benchmark Baseline**: Historical-average baseline for comparison; transparent fallback when data is sparse.
- **Explainability**: Plain-language factor explanations for each recommendation (e.g., day-of-week trend, expected attendance change).
- **Package Manager**: `uv` for all dependency management (`uv add ...`) and execution (`uv run ...`).
- **Code Organization**: Modular architecture — no monolithic files.

---

## 2. Directory Structure

```text
backend/
├── PLAN.md                     # This plan
├── pyproject.toml              # Managed by uv
├── src/
│   ├── __init__.py
│   ├── config.py               # Constants, default safety buffer (e.g. 10%), paths
│   ├── schemas/                # Pydantic schemas for data validation
│   │   ├── __init__.py
│   │   ├── dish.py             # Dish representation
│   │   ├── meal_record.py      # Historical prepared, served, leftover records
│   │   └── forecast.py         # Forecast request, prediction & recommendation response
│   ├── data/                   # Data generation and feature preparation
│   │   ├── __init__.py
│   │   ├── synthetic.py        # Clearly labeled synthetic hostel mess historical data generator
│   │   └── preprocessor.py     # Feature engineering (day of week, attendance, rolling averages)
│   ├── models/                 # Forecasting models and evaluation
│   │   ├── __init__.py
│   │   ├── baseline.py         # Historical-average moving baseline model
│   │   ├── random_forest.py    # scikit-learn RandomForestRegressor pipeline with column transformers
│   │   └── evaluation.py       # Chronological holdout evaluation (MAE, over/under prediction tracking)
│   ├── services/               # Business logic & recommendation orchestration
│   │   ├── __init__.py
│   │   ├── recommendation.py   # Safety buffer calculation, rounding, and human-readable explanation
│   │   └── forecast_service.py # Orchestrator: checks data sufficiency, runs RF or fallback
│   └── api/                    # FastAPI web layer
│       ├── __init__.py
│       ├── main.py             # FastAPI entrypoint and health check
│       └── routes/
│           ├── __init__.py
│           ├── forecast.py     # POST /api/forecast/next-day
│           └── records.py      # GET/POST historical meal records
└── tests/                      # Unit and regression tests
    ├── test_baseline.py
    └── test_random_forest.py
```

---

## 3. Tooling & Dependencies (`uv`)

### Dependency Management
- Initialize environment:
  ```bash
  uv init
  ```
- Core dependencies:
  ```bash
  uv add scikit-learn pandas numpy fastapi uvicorn pydantic
  ```
- Development dependencies:
  ```bash
  uv add --dev pytest
  ```

### Running Commands
- Train / Evaluate model:
  ```bash
  uv run python -m src.models.evaluation
  ```
- Run FastAPI server:
  ```bash
  uv run uvicorn src.api.main:app --reload --port 8000
  ```

---

## 4. Step-by-Step Implementation Roadmap

### Step 1: Environment & Project Setup with `uv`
- Run `uv init` inside `backend/`.
- Install dependencies (`scikit-learn`, `pandas`, `numpy`, `pydantic`, `fastapi`, `uvicorn`).
- Create `src/config.py` with default configuration (default safety buffer = 10%, minimum data threshold = 5 records).

### Step 2: Data Schemas (`src/schemas/`)
- Define `Dish` schema (id, name, meal_type, category).
- Define `MealRecord` schema:
  - `prepared_portions: int`
  - `served_portions: Optional[int]` (explicit nulls allowed; never silently cast missing to zero)
  - `leftover_portions: Optional[int]`
  - `attendance: Optional[int]`
  - `meal_date: date`, `meal_type: str`, `day_of_week: int`
- Define `ForecastRequest` and `ForecastResponse` schemas.

### Step 3: Synthetic Data & Feature Preprocessing (`src/data/`)
- `synthetic.py`:
  - Generate a realistic 60-day dataset for a 200-student hostel mess across Breakfast, Lunch, and Dinner.
  - Clearly label all records with `is_synthetic = True`.
  - Simulate realistic demand variations (e.g., lower weekend breakfast attendance, Friday dinner variations).
- `preprocessor.py`:
  - Feature extraction: `dish_id`, `meal_type`, `day_of_week`, `expected_attendance`, `is_holiday_or_weekend`, `lagged_avg_demand_7d`.

### Step 4: Baseline Model (`src/models/baseline.py`)
- Implement `HistoricalAverageBaseline`:
  - Calculate moving average demand for (dish_id, meal_type, day_of_week).
  - Serve as the benchmark against which the Random Forest model is judged.
  - Serve as the transparent fallback when data points for a dish are insufficient (< threshold).

### Step 5: Random Forest Regressor Pipeline (`src/models/random_forest.py`)
- Implement `DemandRandomForestModel`:
  - Uses `sklearn.ensemble.RandomForestRegressor`.
  - `ColumnTransformer` / `Pipeline`:
    - One-hot encode categorical features: `dish_id`, `meal_type`, `day_of_week`.
    - Standardize or pass through numerical features: `attendance`, `lagged_avg_demand`.
  - Feature importance inspection to provide grounded explanations for predictions.

### Step 6: Model Evaluation (`src/models/evaluation.py`)
- Chronological holdout validation (e.g., train on first 45 days, evaluate on remaining 15 days).
- Metrics tracked:
  - Mean Absolute Error (MAE) in portions.
  - Over-prediction rate (%) and Under-prediction rate (%).
  - Direct comparison table: `Random Forest vs. Historical Average`.
- Clearly output that results are on synthetic data.

### Step 7: Recommendation & Explainability Service (`src/services/`)
- `recommendation.py`:
  - Apply user-configured safety buffer: $\text{Recommended} = \lceil \text{Prediction} \times (1 + \text{buffer}) \rceil$.
  - Generate plain-language explanations using model feature importances and historical trends (e.g., *"Demand is forecasted at 165 portions based on historical Thursday lunch attendance (avg 158) with a +10% safety buffer"*).
  - Explicitly flag fallback situations (*"Limited historical data: baseline average used"*).

### Step 8: FastAPI Endpoints (`src/api/`)
- `GET /health`: Health check and model readiness status.
- `POST /api/forecast`: Accept planned dishes, date, expected attendance, and safety buffer; return predictions, recommendations, and explanations.
- `GET /api/metrics`: Return model evaluation comparison (RF vs Baseline).

---

## 5. Acceptance Checklist

- [x] All code split across modular files under `src/` (no monolithic script).
- [x] Dependencies managed and executable via `uv`.
- [x] Random Forest Regressor implemented and benchmarked against historical-average baseline.
- [x] Sparse data fallback handled cleanly without fabricated confidence.
- [x] Safety buffer configurable and explainability notes provided for every recommendation.
- [x] Synthetic data explicitly labeled.
