"""Feature engineering and preprocessing for demand forecasting models."""

from datetime import date
from typing import List, Tuple, Optional, Dict
import pandas as pd
import numpy as np

from src.schemas.meal_record import MealRecord


class FeaturePreprocessor:
    """Prepares structured features for Random Forest Regressor and baseline models."""

    FEATURE_COLUMNS = [
        "dish_id",
        "meal_type",
        "day_of_week",
        "expected_attendance",
        "is_holiday_or_weekend",
        "lagged_avg_demand_7d",
    ]

    @staticmethod
    def extract_effective_demand(record: MealRecord) -> Optional[float]:
        """Extracts ground-truth demand portions without falsely assuming 0 for missing values.
        
        Returns None if consumption was not tracked.
        """
        if record.served_portions is not None:
            return float(record.served_portions)

        if record.leftover_portions is not None:
            # Derived demand if leftover was counted
            return float(max(0, record.prepared_portions - record.leftover_portions))

        return None

    @classmethod
    def records_to_dataframe(cls, records: List[MealRecord]) -> pd.DataFrame:
        """Converts a collection of MealRecord objects into a sorted pandas DataFrame."""
        if not records:
            return pd.DataFrame(columns=[
                "dish_id", "dish_name", "meal_date", "meal_type",
                "day_of_week", "attendance", "prepared_portions",
                "served_portions", "leftover_portions", "is_synthetic", "target_demand"
            ])

        rows = []
        for r in records:
            effective_demand = cls.extract_effective_demand(r)
            rows.append({
                "id": getattr(r, "id", None),
                "dish_id": r.dish_id,
                "dish_name": r.dish_name,
                "meal_date": pd.to_datetime(r.meal_date),
                "meal_type": r.meal_type,
                "day_of_week": r.day_of_week,
                "attendance": r.attendance,
                "prepared_portions": r.prepared_portions,
                "served_portions": r.served_portions,
                "leftover_portions": r.leftover_portions,
                "is_synthetic": r.is_synthetic,
                "target_demand": effective_demand,
            })

        df = pd.DataFrame(rows)
        df = df.sort_values(by=["meal_date", "meal_type", "dish_id"]).reset_index(drop=True)
        return df

    @classmethod
    def compute_lagged_averages(cls, df: pd.DataFrame, window_days: int = 7) -> pd.DataFrame:
        """Computes rolling historical demand average per dish up to each observation date."""
        df = df.copy()
        df["lagged_avg_demand_7d"] = np.nan

        # Group by dish and compute rolling average of past observations
        for dish_id, group in df.groupby("dish_id"):
            valid_demand = group["target_demand"].dropna()
            if valid_demand.empty:
                continue

            # Rolling shift by 1 to prevent data leakage from the current row
            rolling_avg = (
                group["target_demand"]
                .shift(1)
                .rolling(window=window_days, min_periods=1)
                .mean()
            )
            # If rolling average is NaN for early observations, fill with expanding mean
            expanding_mean = group["target_demand"].shift(1).expanding(min_periods=1).mean()
            imputed_lag = rolling_avg.fillna(expanding_mean)
            
            # For the very first record where even expanding mean is NaN, fill with group overall mean
            imputed_lag = imputed_lag.fillna(valid_demand.mean())
            df.loc[group.index, "lagged_avg_demand_7d"] = imputed_lag

        # Global fallback if any NaN persists
        overall_demand_mean = df["target_demand"].dropna().mean()
        df["lagged_avg_demand_7d"] = df["lagged_avg_demand_7d"].fillna(overall_demand_mean if not pd.isna(overall_demand_mean) else 100.0)
        return df

    @classmethod
    def prepare_training_dataset(
        cls,
        records: List[MealRecord]
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepares feature matrix X and continuous target vector y for model training."""
        df = cls.records_to_dataframe(records)
        
        # Filter out records without valid ground truth demand (explicit null preservation)
        df_valid = df.dropna(subset=["target_demand"]).copy()
        if df_valid.empty:
            return pd.DataFrame(columns=cls.FEATURE_COLUMNS), pd.Series(dtype=float)

        df_featured = cls.compute_lagged_averages(df_valid)

        # Feature mapping
        df_featured["expected_attendance"] = df_featured["attendance"].fillna(200).astype(int)
        df_featured["is_holiday_or_weekend"] = df_featured["day_of_week"].isin([5, 6]).astype(int)

        X = df_featured[cls.FEATURE_COLUMNS].copy()
        y = df_featured["target_demand"].astype(float).copy()

        return X, y

    @classmethod
    def prepare_inference_features(
        cls,
        dish_id: str,
        meal_type: str,
        meal_date: date,
        expected_attendance: int,
        historical_records: List[MealRecord],
    ) -> pd.DataFrame:
        """Constructs a 1-row feature vector for a dish ready for model prediction."""
        day_of_week = meal_date.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0

        # Calculate dish's recent rolling demand average from history
        dish_records = [
            r for r in historical_records
            if r.dish_id == dish_id and cls.extract_effective_demand(r) is not None
        ]

        if dish_records:
            recent_records = sorted(dish_records, key=lambda x: x.meal_date)[-7:]
            recent_demands = [cls.extract_effective_demand(r) for r in recent_records if cls.extract_effective_demand(r) is not None]
            lagged_demand = float(np.mean(recent_demands)) if recent_demands else float(expected_attendance * 0.90)
        else:
            # Fallback estimation based on default expected consumption ratio
            lagged_demand = float(expected_attendance * 0.90)

        feature_row = {
            "dish_id": dish_id,
            "meal_type": meal_type,
            "day_of_week": day_of_week,
            "expected_attendance": int(expected_attendance),
            "is_holiday_or_weekend": is_weekend,
            "lagged_avg_demand_7d": float(lagged_demand),
        }

        return pd.DataFrame([feature_row])[cls.FEATURE_COLUMNS]
