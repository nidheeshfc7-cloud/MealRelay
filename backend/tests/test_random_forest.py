"""Unit tests for DemandRandomForestModel pipeline."""

import pytest
import pandas as pd
import numpy as np

from src.models.random_forest import DemandRandomForestModel
from src.data.synthetic import generate_synthetic_records
from src.data.preprocessor import FeaturePreprocessor


@pytest.fixture(scope="module")
def trained_model_and_data():
    """Generates synthetic dataset, pre-processes it, and fits a DemandRandomForestModel."""
    records = generate_synthetic_records(num_days=30, base_capacity=200, random_seed=42)
    X, y = FeaturePreprocessor.prepare_training_dataset(records)
    
    model = DemandRandomForestModel(n_estimators=30, random_state=42)
    model.fit(X, y)
    return model, X, y, records


def test_model_fit_and_importances(trained_model_and_data):
    """Verifies that model fits properly and computes feature importances."""
    model, X, y, _ = trained_model_and_data
    assert model.is_fitted is True
    assert len(model.feature_importances_) > 0
    # Sum of feature importances should be approximately 1.0
    total_importance = sum(model.feature_importances_.values())
    assert 0.99 <= total_importance <= 1.01


def test_model_predictions_shape_and_bounds(trained_model_and_data):
    """Verifies predictions are non-negative and properly shaped."""
    model, X, _, _ = trained_model_and_data
    sample_X = X.head(10)
    preds = model.predict(sample_X)

    assert len(preds) == 10
    assert isinstance(preds, np.ndarray)
    assert (preds >= 0).all()


def test_model_prediction_with_explanation(trained_model_and_data):
    """Verifies single-row prediction generates structured human-readable explanations."""
    model, X, _, _ = trained_model_and_data
    sample_row = X.iloc[[0]]

    pred_val, explanations = model.predict_with_explanation(sample_row, dish_name="Indori Poha")
    assert isinstance(pred_val, float)
    assert pred_val > 0
    assert len(explanations) >= 2
    # Check that explanation mentions key operational signals
    joined_text = " ".join(explanations)
    assert "Indori Poha" in joined_text
    assert "attendance" in joined_text.lower()


def test_model_handles_unknown_categorical():
    """Verifies pipeline does not crash when presented with an unseen dish_id."""
    df_train = pd.DataFrame([
        {"dish_id": "d1", "meal_type": "lunch", "day_of_week": 0, "expected_attendance": 200, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 180.0},
        {"dish_id": "d1", "meal_type": "lunch", "day_of_week": 1, "expected_attendance": 200, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 175.0},
        {"dish_id": "d2", "meal_type": "lunch", "day_of_week": 0, "expected_attendance": 200, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 160.0},
        {"dish_id": "d2", "meal_type": "lunch", "day_of_week": 1, "expected_attendance": 200, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 165.0},
    ])
    y_train = pd.Series([180.0, 175.0, 160.0, 165.0])

    model = DemandRandomForestModel(n_estimators=10, random_state=42)
    model.fit(df_train, y_train)

    # Test with unseen dish "d99"
    df_test = pd.DataFrame([
        {"dish_id": "d99", "meal_type": "lunch", "day_of_week": 2, "expected_attendance": 190, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 170.0}
    ])
    pred = model.predict(df_test)
    assert len(pred) == 1
    assert pred[0] > 0


def test_unfitted_model_raises():
    """Verifies calling predict before fit raises ValueError."""
    model = DemandRandomForestModel()
    dummy_df = pd.DataFrame([{"dish_id": "d1"}])
    with pytest.raises(ValueError):
        model.predict(dummy_df)


def test_ratio_based_demand_modeling():
    """Verifies that Random Forest learns per-student ratio and scales linearly with attendance."""
    # 85% consumption ratio across various attendances
    df_train = pd.DataFrame([
        {"dish_id": "d_paneer", "meal_type": "lunch", "day_of_week": 1, "category": "curry", "expected_attendance": 200, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 170.0, "lagged_same_weekday_demand": 170.0, "competing_curries_count": 1, "is_paired_with_rice": 1},
        {"dish_id": "d_paneer", "meal_type": "lunch", "day_of_week": 2, "category": "curry", "expected_attendance": 100, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 85.0, "lagged_same_weekday_demand": 85.0, "competing_curries_count": 1, "is_paired_with_rice": 1},
        {"dish_id": "d_paneer", "meal_type": "lunch", "day_of_week": 3, "category": "curry", "expected_attendance": 150, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 128.0, "lagged_same_weekday_demand": 128.0, "competing_curries_count": 1, "is_paired_with_rice": 1},
    ])
    # Portions matching 0.85 ratio
    y_portions = pd.Series([170.0, 85.0, 127.5])

    model = DemandRandomForestModel(n_estimators=10, random_state=42)
    model.fit(df_train, y_portions)

    assert model.is_ratio_model is True

    # Test prediction on 200 students vs 100 students
    test_200 = pd.DataFrame([{"dish_id": "d_paneer", "meal_type": "lunch", "day_of_week": 1, "category": "curry", "expected_attendance": 200, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 170.0, "lagged_same_weekday_demand": 170.0, "competing_curries_count": 1, "is_paired_with_rice": 1}])
    test_100 = pd.DataFrame([{"dish_id": "d_paneer", "meal_type": "lunch", "day_of_week": 1, "category": "curry", "expected_attendance": 100, "is_holiday_or_weekend": 0, "lagged_avg_demand_7d": 85.0, "lagged_same_weekday_demand": 85.0, "competing_curries_count": 1, "is_paired_with_rice": 1}])

    pred_200 = float(model.predict(test_200)[0])
    pred_100 = float(model.predict(test_100)[0])
    ratios = model.predict_ratio(test_200)

    assert len(ratios) == 1
    assert 0.70 <= ratios[0] <= 1.0
    # 200 headcount prediction should be approximately double the 100 headcount prediction
    assert 1.7 <= (pred_200 / pred_100) <= 2.3


def test_category_encoding_and_features():
    """Verifies that dish category and same-weekday numerical features are integrated into the pipeline."""
    model = DemandRandomForestModel()
    assert "category" in model.CATEGORICAL_FEATURES
    assert "lagged_same_weekday_demand" in model.NUMERICAL_FEATURES
    assert "competing_curries_count" in model.NUMERICAL_FEATURES
    assert "is_paired_with_rice" in model.NUMERICAL_FEATURES


def test_preprocessor_session_menu_synergy():
    """Verifies session menu flags: is_paired_with_rice and competing_curries_count."""
    records = generate_synthetic_records(num_days=3, base_capacity=200, random_seed=42)
    df = FeaturePreprocessor.records_to_dataframe(records)

    assert "is_paired_with_rice" in df.columns
    assert "competing_curries_count" in df.columns
    assert "category" in df.columns
    # Lunch sessions typically feature rice
    lunch_records = df[df["meal_type"] == "lunch"]
    assert (lunch_records["is_paired_with_rice"] == 1).any()

    # Verify lagged same-weekday computation
    df_featured = FeaturePreprocessor.compute_lagged_averages(df)
    assert "lagged_same_weekday_demand" in df_featured.columns
    assert not df_featured["lagged_same_weekday_demand"].isna().any()

