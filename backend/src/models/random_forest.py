"""Random Forest Regressor pipeline for hostel mess demand forecasting."""

from pathlib import Path
from typing import List, Dict, Tuple, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.config import RANDOM_STATE, N_ESTIMATORS, DAY_NAMES


class DemandRandomForestModel:
    """Scikit-learn RandomForestRegressor pipeline with preprocessing and explainability."""

    CATEGORICAL_FEATURES = ["dish_id", "meal_type", "day_of_week"]
    NUMERICAL_FEATURES = ["expected_attendance", "is_holiday_or_weekend", "lagged_avg_demand_7d"]

    def __init__(self, n_estimators: int = N_ESTIMATORS, random_state: int = RANDOM_STATE):
        self.n_estimators = n_estimators
        self.random_state = random_state

        preprocessor = ColumnTransformer(
            transformers=[
                (
                    "cat",
                    OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                    self.CATEGORICAL_FEATURES,
                ),
                (
                    "num",
                    StandardScaler(),
                    self.NUMERICAL_FEATURES,
                ),
            ]
        )

        regressor = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=12,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=self.random_state,
            n_jobs=-1,
        )

        self.pipeline: Pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("regressor", regressor),
            ]
        )
        self.is_fitted: bool = False
        self.feature_names_: List[str] = []
        self.feature_importances_: Dict[str, float] = {}

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "DemandRandomForestModel":
        """Fits the pipeline on feature matrix X and continuous target vector y."""
        if X.empty or y.empty:
            raise ValueError("Training feature set and target series cannot be empty.")

        self.pipeline.fit(X, y)
        self.is_fitted = True
        self._extract_feature_importances()
        return self

    def _extract_feature_importances(self) -> None:
        """Extracts and maps tree feature importances back to column names."""
        if not self.is_fitted:
            return

        preprocessor = self.pipeline.named_steps["preprocessor"]
        regressor = self.pipeline.named_steps["regressor"]

        feature_names = []
        # Categorical feature names
        try:
            cat_encoder = preprocessor.named_transformers_["cat"]
            feature_names.extend(cat_encoder.get_feature_names_out(self.CATEGORICAL_FEATURES))
        except Exception:
            feature_names.extend(self.CATEGORICAL_FEATURES)

        # Numerical feature names
        feature_names.extend(self.NUMERICAL_FEATURES)
        self.feature_names_ = feature_names

        importances = regressor.feature_importances_
        self.feature_importances_ = {
            name: float(imp)
            for name, imp in zip(feature_names, importances)
        }

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predicts demand portions for a matrix of features."""
        if not self.is_fitted:
            raise ValueError("Model is not fitted. Call fit() before predict().")

        raw_preds = self.pipeline.predict(X)
        # Demand cannot be negative
        clipped_preds = np.maximum(0.0, np.round(raw_preds, 1))
        return clipped_preds

    def predict_with_explanation(
        self,
        X_row: pd.DataFrame,
        dish_name: Optional[str] = None
    ) -> Tuple[float, List[str]]:
        """Predicts portion demand for a single dish and provides grounded factor explanations."""
        if not self.is_fitted:
            raise ValueError("Model is not fitted. Call fit() before predicting.")

        pred = float(self.predict(X_row)[0])
        row = X_row.iloc[0]

        dish_label = dish_name or str(row.get("dish_id", "dish"))
        meal_type = str(row.get("meal_type", "meal")).capitalize()
        day_of_week = int(row.get("day_of_week", 0))
        day_name = DAY_NAMES[day_of_week] if 0 <= day_of_week < len(DAY_NAMES) else f"Day {day_of_week}"
        attendance = int(row.get("expected_attendance", 200))
        is_weekend = int(row.get("is_holiday_or_weekend", 0)) == 1
        lagged_demand = float(row.get("lagged_avg_demand_7d", 0))

        explanations: List[str] = []

        # Factor 1: Expected Attendance Impact
        attendance_ratio = round(pred / attendance, 2) if attendance > 0 else 0.90
        explanations.append(
            f"Expected attendance of {attendance} students with modeled {dish_label} consumption ratio of ~{attendance_ratio}x."
        )

        # Factor 2: Day of Week & Weekend Trend
        if is_weekend:
            explanations.append(
                f"{day_name} {meal_type} historical pattern reflects lower weekend student turnout on campus."
            )
        elif day_of_week == 4 and meal_type.lower() == "dinner":
            explanations.append(
                f"Friday dinner special schedule historically captures peak hostel dining attendance."
            )
        else:
            explanations.append(
                f"Aligned with typical weekday {day_name} dining attendance curve."
            )

        # Factor 3: Recent Rolling Momentum
        if lagged_demand > 0:
            diff = pred - lagged_demand
            if abs(diff) < 5:
                explanations.append(
                    f"Consistent with 7-day rolling average consumption ({round(lagged_demand, 1)} portions)."
                )
            elif diff > 0:
                explanations.append(
                    f"Forecasted +{round(diff, 1)} portions above 7-day rolling average ({round(lagged_demand, 1)}) due to higher expected turnout."
                )
            else:
                explanations.append(
                    f"Forecasted -{round(abs(diff), 1)} portions below 7-day rolling average ({round(lagged_demand, 1)}) due to lower session attendance."
                )

        return pred, explanations

    def save(self, file_path: Path) -> None:
        """Saves model pipeline to disk."""
        file_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, file_path)

    @classmethod
    def load(cls, file_path: Path) -> "DemandRandomForestModel":
        """Loads model pipeline from disk."""
        if not file_path.exists():
            raise FileNotFoundError(f"Model file not found at: {file_path}")
        return joblib.load(file_path)
