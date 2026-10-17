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
    """Scikit-learn RandomForestRegressor pipeline with domain features and ratio-based prediction."""

    CATEGORICAL_FEATURES = ["dish_id", "meal_type", "day_of_week", "category"]
    NUMERICAL_FEATURES = [
        "expected_attendance",
        "is_holiday_or_weekend",
        "lagged_avg_demand_7d",
        "lagged_same_weekday_demand",
        "competing_curries_count",
        "is_paired_with_rice",
    ]

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
            n_jobs=1,
        )

        self.pipeline: Pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("regressor", regressor),
            ]
        )
        self.is_fitted: bool = False
        self.is_ratio_model: bool = True
        self.feature_names_: List[str] = []
        self.feature_importances_: Dict[str, float] = {}

    @classmethod
    def _prepare_input_df(cls, X: pd.DataFrame) -> pd.DataFrame:
        """Ensures all expected feature columns exist with robust default values."""
        df = X.copy()
        if "category" not in df.columns:
            df["category"] = "main"
        if "expected_attendance" not in df.columns:
            df["expected_attendance"] = 200
        if "is_holiday_or_weekend" not in df.columns:
            df["is_holiday_or_weekend"] = 0
        if "lagged_avg_demand_7d" not in df.columns:
            df["lagged_avg_demand_7d"] = 150.0
        if "lagged_same_weekday_demand" not in df.columns:
            df["lagged_same_weekday_demand"] = df["lagged_avg_demand_7d"]
        if "competing_curries_count" not in df.columns:
            df["competing_curries_count"] = 1
        if "is_paired_with_rice" not in df.columns:
            df["is_paired_with_rice"] = 1
        return df[cls.CATEGORICAL_FEATURES + cls.NUMERICAL_FEATURES]

    def fit(self, X: pd.DataFrame, y: pd.Series, sample_weight: Optional[np.ndarray] = None) -> "DemandRandomForestModel":
        """Fits the pipeline on feature matrix X and target y using ratio-based modeling."""
        if X.empty or y.empty:
            raise ValueError("Training feature set and target series cannot be empty.")

        X_clean = self._prepare_input_df(X)
        attendance = X_clean["expected_attendance"].clip(lower=1).astype(float)

        # Ratio-based demand modeling:
        # If target y is in portions (> 5.0 mean), convert to continuous per-student consumption ratio:
        # y_ratio = served_portions / attendance
        if float(y.mean()) > 5.0:
            y_target = (y.astype(float) / attendance).astype(float)
            self.is_ratio_model = True
        else:
            y_target = y.astype(float)
            self.is_ratio_model = False

        fit_params = {}
        if sample_weight is not None:
            fit_params["regressor__sample_weight"] = sample_weight

        self.pipeline.fit(X_clean, y_target, **fit_params)
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
        try:
            cat_encoder = preprocessor.named_transformers_["cat"]
            feature_names.extend(cat_encoder.get_feature_names_out(self.CATEGORICAL_FEATURES))
        except Exception:
            feature_names.extend(self.CATEGORICAL_FEATURES)

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

        X_clean = self._prepare_input_df(X)
        raw_preds = self.pipeline.predict(X_clean)

        if self.is_ratio_model:
            # Reconstruct portions: cook_portions = predicted_ratio * expected_attendance
            attendance = X_clean["expected_attendance"].clip(lower=1).to_numpy()
            portions = raw_preds * attendance
        else:
            portions = raw_preds

        # Demand cannot be negative
        clipped_preds = np.maximum(0.0, np.round(portions, 1))
        return clipped_preds

    def predict_ratio(self, X: pd.DataFrame) -> np.ndarray:
        """Returns raw predicted consumption ratios without scaling by attendance."""
        if not self.is_fitted:
            raise ValueError("Model is not fitted. Call fit() before predict().")

        X_clean = self._prepare_input_df(X)
        raw_preds = self.pipeline.predict(X_clean)
        if self.is_ratio_model:
            return np.maximum(0.0, np.round(raw_preds, 3))
        attendance = X_clean["expected_attendance"].clip(lower=1).to_numpy()
        return np.maximum(0.0, np.round(raw_preds / attendance, 3))

    def predict_with_explanation(
        self,
        X_row: pd.DataFrame,
        dish_name: Optional[str] = None
    ) -> Tuple[float, List[str]]:
        """Predicts portion demand for a single dish and provides grounded factor explanations."""
        if not self.is_fitted:
            raise ValueError("Model is not fitted. Call fit() before predicting.")

        X_clean = self._prepare_input_df(X_row)
        pred = float(self.predict(X_clean)[0])
        row = X_clean.iloc[0]

        dish_label = dish_name or str(X_row.iloc[0].get("dish_id", "dish"))
        meal_type = str(row.get("meal_type", "meal")).capitalize()
        day_of_week = int(row.get("day_of_week", 0))
        day_name = DAY_NAMES[day_of_week] if 0 <= day_of_week < len(DAY_NAMES) else f"Day {day_of_week}"
        attendance = int(row.get("expected_attendance", 200))
        is_weekend = int(row.get("is_holiday_or_weekend", 0)) == 1
        lagged_demand = float(row.get("lagged_avg_demand_7d", 0))
        same_weekday_lag = float(row.get("lagged_same_weekday_demand", lagged_demand))
        competing_curries = int(row.get("competing_curries_count", 1))
        is_rice = int(row.get("is_paired_with_rice", 0))
        category_val = str(row.get("category", "main")).lower()

        explanations: List[str] = []

        # Factor 1: Expected Attendance & Modeled Intake Ratio
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

        # Factor 3: Same-Weekday Historical Routine & Rolling Momentum
        if abs(same_weekday_lag - lagged_demand) >= 5 and same_weekday_lag > 0:
            explanations.append(
                f"Reflects specific {day_name} dining habits ({round(same_weekday_lag, 1)} historical avg portions)."
            )
        elif lagged_demand > 0:
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

        # Factor 4: Menu Synergy & Appetite Split
        if competing_curries > 1 and category_val in ["curry", "main"]:
            explanations.append(
                f"Appetite split factored across {competing_curries} featured main courses in this meal session."
            )
        elif is_rice == 1 and category_val in ["curry", "side"]:
            explanations.append("Paired with steamed rice course.")

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

