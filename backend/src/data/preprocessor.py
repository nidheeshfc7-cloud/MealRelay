"""Feature engineering and preprocessing for demand forecasting models."""

from datetime import date
from typing import List, Tuple, Optional, Dict
import pandas as pd
import numpy as np

from src.schemas.meal_record import MealRecord
from src.data.synthetic import get_standard_dishes


class FeaturePreprocessor:
    """Prepares structured features for Random Forest Regressor and baseline models."""

    FEATURE_COLUMNS = [
        "dish_id",
        "meal_type",
        "day_of_week",
        "category",
        "expected_attendance",
        "is_holiday_or_weekend",
        "lagged_avg_demand_7d",
        "lagged_same_weekday_demand",
        "competing_curries_count",
        "is_paired_with_rice",
    ]

    _DISH_CAT_CACHE: Dict[str, str] = {}

    @classmethod
    def get_dish_category(cls, dish_id: str) -> str:
        """Returns standard category for known dish or defaults to 'main'."""
        if not cls._DISH_CAT_CACHE:
            try:
                dishes = get_standard_dishes()
                cls._DISH_CAT_CACHE = {
                    d.id: (d.category.value if hasattr(d.category, "value") else str(d.category))
                    for d in dishes
                }
            except Exception:
                cls._DISH_CAT_CACHE = {}
        return cls._DISH_CAT_CACHE.get(dish_id, "main")

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
                "id", "dish_id", "dish_name", "meal_date", "meal_type",
                "day_of_week", "attendance", "prepared_portions",
                "served_portions", "leftover_portions", "category",
                "is_synthetic", "target_demand", "is_paired_with_rice",
                "competing_curries_count"
            ])

        rows = []
        for r in records:
            effective_demand = cls.extract_effective_demand(r)
            cat = getattr(r, "category", None) or cls.get_dish_category(r.dish_id)
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
                "category": cat,
                "is_synthetic": r.is_synthetic,
                "target_demand": effective_demand,
            })

        df = pd.DataFrame(rows)
        df = df.sort_values(by=["meal_date", "meal_type", "dish_id"]).reset_index(drop=True)

        # Compute session menu context (rice pairing, competing curry count)
        df["is_paired_with_rice"] = 0
        df["competing_curries_count"] = 1

        if not df.empty:
            for (m_date, m_type), session_group in df.groupby(["meal_date", "meal_type"]):
                has_rice = int(
                    session_group["category"].str.lower().eq("rice").any()
                    or session_group["dish_id"].str.lower().str.contains("rice").any()
                )
                curry_count = int(session_group["category"].str.lower().isin(["curry", "main"]).sum())
                if curry_count < 1:
                    curry_count = 1

                df.loc[session_group.index, "is_paired_with_rice"] = has_rice
                df.loc[session_group.index, "competing_curries_count"] = curry_count

        return df

    @classmethod
    def compute_lagged_averages(cls, df: pd.DataFrame, window_days: int = 7) -> pd.DataFrame:
        """Computes rolling historical demand average and same-weekday rolling lags per dish."""
        df = df.copy()
        df["lagged_avg_demand_7d"] = np.nan
        df["lagged_same_weekday_demand"] = np.nan

        # 1. 7-observation rolling demand per dish
        for dish_id, group in df.groupby("dish_id"):
            valid_demand = group["target_demand"].dropna()
            if valid_demand.empty:
                continue

            rolling_avg = (
                group["target_demand"]
                .shift(1)
                .rolling(window=window_days, min_periods=1)
                .mean()
            )
            expanding_mean = group["target_demand"].shift(1).expanding(min_periods=1).mean()
            imputed_lag = rolling_avg.fillna(expanding_mean).fillna(valid_demand.mean())
            df.loc[group.index, "lagged_avg_demand_7d"] = imputed_lag

        # 2. Same-weekday rolling demand lag (last 3 occurrences of same day_of_week)
        for (dish_id, dow), group in df.groupby(["dish_id", "day_of_week"]):
            valid_demand = group["target_demand"].dropna()
            if valid_demand.empty:
                continue

            dow_rolling = (
                group["target_demand"]
                .shift(1)
                .rolling(window=3, min_periods=1)
                .mean()
            )
            dow_expanding = group["target_demand"].shift(1).expanding(min_periods=1).mean()
            imputed_dow_lag = dow_rolling.fillna(dow_expanding).fillna(valid_demand.mean())
            df.loc[group.index, "lagged_same_weekday_demand"] = imputed_dow_lag

        # Fallbacks if any NaN persists
        overall_mean = df["target_demand"].dropna().mean()
        fallback_val = overall_mean if not pd.isna(overall_mean) else 100.0

        df["lagged_avg_demand_7d"] = df["lagged_avg_demand_7d"].fillna(fallback_val)
        df["lagged_same_weekday_demand"] = df["lagged_same_weekday_demand"].fillna(df["lagged_avg_demand_7d"])

        return df

    @classmethod
    def prepare_training_dataset(
        cls,
        records: List[MealRecord],
        return_weights: bool = False,
    ) -> Tuple[pd.DataFrame, pd.Series, Optional[np.ndarray]]:
        """Prepares feature matrix X and continuous target vector y for model training."""
        df = cls.records_to_dataframe(records)
        
        # Filter out records without valid ground truth demand (explicit null preservation)
        df_valid = df.dropna(subset=["target_demand"]).copy()
        if df_valid.empty:
            empty_x = pd.DataFrame(columns=cls.FEATURE_COLUMNS)
            empty_y = pd.Series(dtype=float)
            return (empty_x, empty_y, np.array([])) if return_weights else (empty_x, empty_y)

        df_featured = cls.compute_lagged_averages(df_valid)

        # Feature mapping
        df_featured["expected_attendance"] = df_featured["attendance"].fillna(200).astype(int)
        df_featured["is_holiday_or_weekend"] = df_featured["day_of_week"].isin([5, 6]).astype(int)

        X = df_featured[cls.FEATURE_COLUMNS].copy()
        y = df_featured["target_demand"].astype(float).copy()

        if return_weights:
            # Real kitchen records get 3.0x higher weighting than synthetic data
            weights = np.where(df_featured["is_synthetic"] == False, 3.0, 1.0)
            return X, y, weights

        return X, y

    @classmethod
    def prepare_inference_features(
        cls,
        dish_id: str,
        meal_type: str,
        meal_date: date,
        expected_attendance: int,
        historical_records: List[MealRecord],
        category: Optional[str] = None,
        competing_curries_count: int = 1,
        is_paired_with_rice: int = 1,
    ) -> pd.DataFrame:
        """Constructs a 1-row feature vector for a dish ready for model prediction."""
        day_of_week = meal_date.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0
        dish_category = category or cls.get_dish_category(dish_id)

        # Calculate dish's recent rolling demand average from history
        dish_records = [
            r for r in historical_records
            if r.dish_id == dish_id and cls.extract_effective_demand(r) is not None
        ]

        if dish_records:
            recent_records = sorted(dish_records, key=lambda x: x.meal_date)[-7:]
            recent_demands = [cls.extract_effective_demand(r) for r in recent_records if cls.extract_effective_demand(r) is not None]
            lagged_demand = float(np.mean(recent_demands)) if recent_demands else float(expected_attendance * 0.90)

            # Same-weekday historical lag
            dow_records = [r for r in dish_records if r.day_of_week == day_of_week]
            if dow_records:
                recent_dow_records = sorted(dow_records, key=lambda x: x.meal_date)[-3:]
                recent_dow_demands = [cls.extract_effective_demand(r) for r in recent_dow_records if cls.extract_effective_demand(r) is not None]
                lagged_same_dow = float(np.mean(recent_dow_demands)) if recent_dow_demands else lagged_demand
            else:
                lagged_same_dow = lagged_demand
        else:
            # Fallback estimation based on default expected consumption ratio
            lagged_demand = float(expected_attendance * 0.90)
            lagged_same_dow = lagged_demand

        feature_row = {
            "dish_id": dish_id,
            "meal_type": meal_type,
            "day_of_week": day_of_week,
            "category": dish_category,
            "expected_attendance": int(expected_attendance),
            "is_holiday_or_weekend": is_weekend,
            "lagged_avg_demand_7d": float(lagged_demand),
            "lagged_same_weekday_demand": float(lagged_same_dow),
            "competing_curries_count": int(competing_curries_count),
            "is_paired_with_rice": int(is_paired_with_rice),
        }

        return pd.DataFrame([feature_row])[cls.FEATURE_COLUMNS]
