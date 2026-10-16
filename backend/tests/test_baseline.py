"""Unit tests for HistoricalAverageBaseline."""

from datetime import date
import pytest
import pandas as pd

from src.models.baseline import HistoricalAverageBaseline
from src.schemas.meal_record import MealRecord


@pytest.fixture
def sample_records():
    """Generates a small known dataset for deterministic baseline testing."""
    records = []
    # Dish A: 3 records on Monday (day_of_week=0), 1 on Tuesday (day_of_week=1)
    records.append(MealRecord(id="r1", dish_id="dish_a", meal_date=date(2026, 10, 5), meal_type="lunch", day_of_week=0, attendance=200, prepared_portions=180, served_portions=170))
    records.append(MealRecord(id="r2", dish_id="dish_a", meal_date=date(2026, 10, 12), meal_type="lunch", day_of_week=0, attendance=200, prepared_portions=180, served_portions=160))
    records.append(MealRecord(id="r3", dish_id="dish_a", meal_date=date(2026, 10, 19), meal_type="lunch", day_of_week=0, attendance=200, prepared_portions=180, served_portions=180))
    records.append(MealRecord(id="r4", dish_id="dish_a", meal_date=date(2026, 10, 6), meal_type="lunch", day_of_week=1, attendance=200, prepared_portions=180, served_portions=150))

    # Dish B: Only 1 record on Wednesday (day_of_week=2)
    records.append(MealRecord(id="r5", dish_id="dish_b", meal_date=date(2026, 10, 7), meal_type="dinner", day_of_week=2, attendance=200, prepared_portions=190, served_portions=175))

    # Record with None served_portions (explicit null)
    records.append(MealRecord(id="r6", dish_id="dish_c", meal_date=date(2026, 10, 8), meal_type="breakfast", day_of_week=3, attendance=150, prepared_portions=130, served_portions=None, leftover_portions=None))
    return records


def test_baseline_day_of_week_tier(sample_records):
    """Verifies Tier 1 (weekday average) is selected when count >= 2."""
    baseline = HistoricalAverageBaseline(min_threshold=5)
    baseline.fit(sample_records)

    # For dish_a on Monday (0): 3 observations (170, 160, 180) -> mean = 170.0
    pred = baseline.predict_dish(dish_id="dish_a", day_of_week=0, expected_attendance=200)
    assert pred.level == "day_of_week_average"
    assert pred.predicted_portions == 170.0
    assert pred.sample_size == 3
    assert pred.is_sparse is True  # 3 < min_threshold (5)


def test_baseline_overall_dish_tier(sample_records):
    """Verifies Tier 2 (overall dish average) fallback when weekday count < 2 but overall >= 1."""
    baseline = HistoricalAverageBaseline(min_threshold=5)
    baseline.fit(sample_records)

    # For dish_a on Friday (4): 0 observations on Friday, but 4 overall (170, 160, 180, 150) -> mean = 165.0
    pred = baseline.predict_dish(dish_id="dish_a", day_of_week=4, expected_attendance=200)
    assert pred.level == "dish_overall_average"
    assert pred.predicted_portions == 165.0
    assert pred.sample_size == 4
    assert pred.is_sparse is True


def test_baseline_brand_new_dish_ratio(sample_records):
    """Verifies Tier 3 (ratio fallback) for completely unseen dishes."""
    baseline = HistoricalAverageBaseline(min_threshold=5)
    baseline.fit(sample_records)

    # Brand new dish: 0 prior records
    pred = baseline.predict_dish(dish_id="dish_unknown", day_of_week=2, expected_attendance=100)
    assert pred.level == "ratio_fallback"
    assert pred.sample_size == 0
    assert pred.is_sparse is True
    assert pred.predicted_portions > 0


def test_baseline_predict_dataframe(sample_records):
    """Verifies scikit-learn compatible predict on a DataFrame."""
    baseline = HistoricalAverageBaseline()
    baseline.fit(sample_records)

    df_test = pd.DataFrame([
        {"dish_id": "dish_a", "day_of_week": 0, "expected_attendance": 200},
        {"dish_id": "dish_b", "day_of_week": 2, "expected_attendance": 200},
    ])
    preds = baseline.predict(df_test)
    assert len(preds) == 2
    assert preds[0] == 170.0
