"""Historical Average Baseline forecasting model for benchmark comparison and sparse-data fallback."""

from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
import numpy as np
import pandas as pd

from src.schemas.meal_record import MealRecord
from src.data.preprocessor import FeaturePreprocessor
from src.config import MIN_DATA_THRESHOLD, DAY_NAMES


@dataclass
class BaselinePrediction:
    """Structured result of a baseline demand estimation."""
    predicted_portions: float
    sample_size: int
    level: str  # "day_of_week_average" | "dish_overall_average" | "ratio_fallback"
    is_sparse: bool
    explanation: str


class HistoricalAverageBaseline:
    """Historical moving average model.
    
    Serves as:
    1. The empirical benchmark against which the Random Forest model is compared.
    2. The transparent fallback model when historical records for a dish are below MIN_DATA_THRESHOLD.
    """

    def __init__(self, min_threshold: int = MIN_DATA_THRESHOLD):
        self.min_threshold: int = min_threshold
        # (dish_id, day_of_week) -> list of historical demand portions
        self.dish_day_history: Dict[Tuple[str, int], List[float]] = {}
        # dish_id -> list of all historical demand portions
        self.dish_history: Dict[str, List[float]] = {}
        # global demand ratio relative to attendance
        self.global_consumption_ratios: List[float] = []
        self.is_fitted: bool = False

    def fit(self, records: List[MealRecord]) -> "HistoricalAverageBaseline":
        """Fits historical records into moving average buckets."""
        self.dish_day_history.clear()
        self.dish_history.clear()
        self.global_consumption_ratios.clear()

        if not records:
            self.is_fitted = True
            return self

        for record in records:
            demand = FeaturePreprocessor.extract_effective_demand(record)
            if demand is None:
                continue

            dish_id = record.dish_id
            day_of_week = record.day_of_week

            # Group by dish and day of week
            key = (dish_id, day_of_week)
            if key not in self.dish_day_history:
                self.dish_day_history[key] = []
            self.dish_day_history[key].append(demand)

            # Group by dish overall
            if dish_id not in self.dish_history:
                self.dish_history[dish_id] = []
            self.dish_history[dish_id].append(demand)

            # Track ratio relative to attendance
            if record.attendance and record.attendance > 0:
                self.global_consumption_ratios.append(demand / record.attendance)

        self.is_fitted = True
        return self

    def predict_dish(
        self,
        dish_id: str,
        day_of_week: int,
        expected_attendance: int,
        meal_type: Optional[str] = None,
        default_ratio: float = 0.90
    ) -> BaselinePrediction:
        """Predicts portion demand for a single dish with hierarchical fallback and early returns."""
        day_name = DAY_NAMES[day_of_week] if 0 <= day_of_week < len(DAY_NAMES) else f"Day {day_of_week}"

        # Tier 1: Day-of-week specific history (e.g. past Thursdays)
        key = (dish_id, day_of_week)
        if key in self.dish_day_history and len(self.dish_day_history[key]) >= 2:
            day_samples = self.dish_day_history[key]
            mean_demand = float(np.mean(day_samples))
            count = len(day_samples)
            is_sparse = count < self.min_threshold
            
            explanation = (
                f"Historical {day_name} average of {count} observed sessions "
                f"({round(mean_demand, 1)} portions)."
            )
            if is_sparse:
                explanation = f"Sparse history: {explanation}"

            return BaselinePrediction(
                predicted_portions=round(mean_demand, 1),
                sample_size=count,
                level="day_of_week_average",
                is_sparse=is_sparse,
                explanation=explanation,
            )

        # Tier 2: Overall dish history across all days
        if dish_id in self.dish_history and len(self.dish_history[dish_id]) >= 1:
            overall_samples = self.dish_history[dish_id]
            mean_demand = float(np.mean(overall_samples))
            count = len(overall_samples)
            
            return BaselinePrediction(
                predicted_portions=round(mean_demand, 1),
                sample_size=count,
                level="dish_overall_average",
                is_sparse=True,
                explanation=(
                    f"Sparse weekday data; fallback to overall average across {count} past sessions "
                    f"({round(mean_demand, 1)} portions)."
                ),
            )

        # Tier 3: Zero prior records fallback using expected attendance ratio
        effective_ratio = (
            float(np.median(self.global_consumption_ratios))
            if self.global_consumption_ratios
            else default_ratio
        )
        estimated_demand = round(expected_attendance * effective_ratio, 1)

        return BaselinePrediction(
            predicted_portions=estimated_demand,
            sample_size=0,
            level="ratio_fallback",
            is_sparse=True,
            explanation=(
                f"No prior history for this dish; fallback estimate at "
                f"{int(effective_ratio * 100)}% of expected attendance ({estimated_demand} portions)."
            ),
        )

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Vectorized prediction compatible with scikit-learn evaluation metrics."""
        predictions = []
        for _, row in X.iterrows():
            pred = self.predict_dish(
                dish_id=str(row["dish_id"]),
                day_of_week=int(row["day_of_week"]),
                expected_attendance=int(row.get("expected_attendance", 200)),
                meal_type=str(row.get("meal_type", "lunch")),
            )
            predictions.append(pred.predicted_portions)

        return np.array(predictions, dtype=float)
