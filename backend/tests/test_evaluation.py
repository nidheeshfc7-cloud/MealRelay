"""Unit tests for chronological holdout evaluation."""

import pytest
from src.models.evaluation import run_chronological_evaluation, EvaluationReport
from src.data.synthetic import generate_synthetic_records


def test_chronological_evaluation_success():
    """Verifies that chronological holdout evaluation runs and calculates valid metrics."""
    records = generate_synthetic_records(num_days=30, base_capacity=200, random_seed=42)
    report = run_chronological_evaluation(records=records, train_days=20, random_state=42)

    assert isinstance(report, EvaluationReport)
    assert report.is_synthetic is True
    assert report.train_days_count == 20
    assert report.test_days_count == 10
    assert report.train_samples_count > 0
    assert report.test_samples_count > 0

    # Metrics validity
    assert report.random_forest.mae > 0
    assert report.baseline.mae > 0
    assert report.random_forest.rmse >= report.random_forest.mae
    assert 0 <= report.random_forest.over_prediction_rate_pct <= 100
    assert 0 <= report.random_forest.under_prediction_rate_pct <= 100

    # Verify dictionary serialization for API responses
    report_dict = report.to_dict()
    assert "random_forest" in report_dict
    assert "baseline" in report_dict
    assert report_dict["is_synthetic"] is True
    assert "synthetic hostel mess data" in report_dict["disclaimer"].lower()
