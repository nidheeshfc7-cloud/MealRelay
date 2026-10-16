"""Chronological holdout validation and benchmark evaluation comparing Random Forest to Historical Average."""

from dataclasses import dataclass, asdict
from datetime import date
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from src.schemas.meal_record import MealRecord
from src.data.synthetic import generate_synthetic_records
from src.data.preprocessor import FeaturePreprocessor
from src.models.baseline import HistoricalAverageBaseline
from src.models.random_forest import DemandRandomForestModel
from src.config import SYNTHETIC_DAYS, RANDOM_STATE


@dataclass
class ModelMetrics:
    """Performance metrics for a demand forecasting model."""
    model_name: str
    mae: float
    rmse: float
    over_prediction_rate_pct: float
    under_prediction_rate_pct: float
    mean_bias_portions: float
    sample_count: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EvaluationReport:
    """Holdout evaluation report comparing Random Forest against Baseline."""
    random_forest: ModelMetrics
    baseline: ModelMetrics
    mae_improvement_pct: float
    train_samples_count: int
    test_samples_count: int
    train_days_count: int
    test_days_count: int
    is_synthetic: bool = True
    disclaimer: str = (
        "Evaluation performed on synthetic hostel mess data. "
        "Illustrative benchmark only; real-world accuracy depends on kitchen logging consistency."
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "random_forest": self.random_forest.to_dict(),
            "baseline": self.baseline.to_dict(),
            "mae_improvement_pct": self.mae_improvement_pct,
            "train_samples_count": self.train_samples_count,
            "test_samples_count": self.test_samples_count,
            "train_days_count": self.train_days_count,
            "test_days_count": self.test_days_count,
            "is_synthetic": self.is_synthetic,
            "disclaimer": self.disclaimer,
        }


def _compute_metrics(model_name: str, y_true: np.ndarray, y_pred: np.ndarray) -> ModelMetrics:
    """Calculates MAE, RMSE, over/under prediction percentages, and bias."""
    if len(y_true) == 0:
        return ModelMetrics(
            model_name=model_name,
            mae=0.0,
            rmse=0.0,
            over_prediction_rate_pct=0.0,
            under_prediction_rate_pct=0.0,
            mean_bias_portions=0.0,
            sample_count=0,
        )

    errors = y_pred - y_true
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(root_mean_squared_error(y_true, y_pred))
    
    over_count = int(np.sum(errors > 0.5))
    under_count = int(np.sum(errors < -0.5))
    total = len(y_true)

    over_pct = round((over_count / total) * 100, 1)
    under_pct = round((under_count / total) * 100, 1)
    mean_bias = round(float(np.mean(errors)), 2)

    return ModelMetrics(
        model_name=model_name,
        mae=round(mae, 2),
        rmse=round(rmse, 2),
        over_prediction_rate_pct=over_pct,
        under_prediction_rate_pct=under_pct,
        mean_bias_portions=mean_bias,
        sample_count=total,
    )


def run_chronological_evaluation(
    records: Optional[List[MealRecord]] = None,
    train_days: int = 45,
    random_state: int = RANDOM_STATE,
) -> EvaluationReport:
    """Executes chronological holdout evaluation (train on past days, evaluate on unseen future days).
    
    Prevents temporal data leakage by strictly partitioning train/test along the calendar timeline.
    """
    all_records = records if records is not None else generate_synthetic_records(num_days=SYNTHETIC_DAYS)
    if not all_records:
        raise ValueError("Cannot evaluate models on empty records.")

    # Sort records chronologically
    sorted_records = sorted(all_records, key=lambda r: (r.meal_date, r.meal_type))
    unique_dates = sorted(list(set(r.meal_date for r in sorted_records)))
    
    if len(unique_dates) <= train_days:
        split_idx = int(len(unique_dates) * 0.75)
    else:
        split_idx = train_days

    train_dates = set(unique_dates[:split_idx])
    test_dates = set(unique_dates[split_idx:])

    train_records = [r for r in sorted_records if r.meal_date in train_dates]
    test_records = [r for r in sorted_records if r.meal_date in test_dates]

    # 1. Train and evaluate HistoricalAverageBaseline
    baseline = HistoricalAverageBaseline()
    baseline.fit(train_records)

    # 2. Prepare feature matrices
    X_train, y_train = FeaturePreprocessor.prepare_training_dataset(train_records)
    X_test, y_test = FeaturePreprocessor.prepare_training_dataset(test_records)

    if X_test.empty or y_test.empty:
        raise ValueError("Insufficient test observations in holdout period.")

    # 3. Train DemandRandomForestModel
    rf_model = DemandRandomForestModel(random_state=random_state)
    rf_model.fit(X_train, y_train)

    # 4. Generate predictions on test set
    y_pred_rf = rf_model.predict(X_test)
    y_pred_base = baseline.predict(X_test)
    y_true = y_test.to_numpy()

    # 5. Compute metrics
    rf_metrics = _compute_metrics("RandomForestRegressor", y_true, y_pred_rf)
    base_metrics = _compute_metrics("HistoricalAverageBaseline", y_true, y_pred_base)

    # 6. Calculate relative improvement in MAE
    if base_metrics.mae > 0:
        improvement_pct = round(((base_metrics.mae - rf_metrics.mae) / base_metrics.mae) * 100, 1)
    else:
        improvement_pct = 0.0

    return EvaluationReport(
        random_forest=rf_metrics,
        baseline=base_metrics,
        mae_improvement_pct=improvement_pct,
        train_samples_count=len(y_train),
        test_samples_count=len(y_test),
        train_days_count=len(train_dates),
        test_days_count=len(test_dates),
        is_synthetic=True,
    )


def print_evaluation_summary(report: EvaluationReport) -> None:
    """Prints a formatted evaluation table and synthetic disclosure to stdout."""
    rf = report.random_forest
    base = report.baseline

    print("=" * 78)
    print("MEALRELAY — FORECAST MODEL BENCHMARK EVALUATION")
    print("=" * 78)
    print(f"Data Partition: Chronological Holdout (Train: {report.train_days_count} days, Test: {report.test_days_count} days)")
    print(f"Observations:   Train: {report.train_samples_count} portions, Test: {report.test_samples_count} portions")
    print(f"Dataset Status: SYNTHETIC HOSTEL MESS DATA (is_synthetic = {report.is_synthetic})")
    print("-" * 78)
    print(f"{'Metric':<32} | {'Random Forest':<18} | {'Historical Average':<18}")
    print("-" * 78)
    print(f"{'Mean Absolute Error (MAE)':<32} | {rf.mae:<18.2f} | {base.mae:<18.2f}")
    print(f"{'Root Mean Squared Error (RMSE)':<32} | {rf.rmse:<18.2f} | {base.rmse:<18.2f}")
    print(f"{'Over-Prediction Rate (%)':<32} | {rf.over_prediction_rate_pct:<17.1f}% | {base.over_prediction_rate_pct:<17.1f}%")
    print(f"{'Under-Prediction Rate (%)':<32} | {rf.under_prediction_rate_pct:<17.1f}% | {base.under_prediction_rate_pct:<17.1f}%")
    print(f"{'Mean Directional Bias (portions)':<32} | {rf.mean_bias_portions:<18.2f} | {base.mean_bias_portions:<18.2f}")
    print("-" * 78)
    print(f"MAE Improvement over Baseline: {report.mae_improvement_pct:+.1f}%")
    print("-" * 78)
    print(f"NOTE: {report.disclaimer}")
    print("=" * 78)


if __name__ == "__main__":
    report = run_chronological_evaluation()
    print_evaluation_summary(report)
