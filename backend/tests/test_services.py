"""Unit tests for recommendation math and forecast orchestration service."""

from datetime import date
import pytest

from src.services.recommendation import (
    calculate_safety_buffer_portions,
    build_dish_recommendation,
)
from src.services.forecast_service import ForecastService
from src.schemas.forecast import ForecastRequest, ForecastItemRequest
from src.schemas.meal_record import MealRecordCreate


def test_safety_buffer_math():
    """Verifies that safety buffer applies ceiling rounding and bounds."""
    # 100 portions with 10% buffer = 110
    assert calculate_safety_buffer_portions(100.0, 0.10) == 110

    # 95.3 portions with 10% buffer -> 95.3 * 1.10 = 104.83 -> ceil = 105
    assert calculate_safety_buffer_portions(95.3, 0.10) == 105

    # 0 portions stays 0
    assert calculate_safety_buffer_portions(0.0, 0.10) == 0

    # Negative portions clamped to 0
    assert calculate_safety_buffer_portions(-10.0, 0.10) == 0


def test_build_dish_recommendation_fallback_flag():
    """Verifies that fallback recommendation explicitly labels baseline usage."""
    rec = build_dish_recommendation(
        dish_id="d_new",
        dish_name="New Dish",
        meal_type="lunch",
        predicted_portions=150.0,
        safety_buffer_pct=0.15,
        model_used="baseline_fallback",
        data_points_count=2,
        is_fallback=True,
    )

    assert rec.is_fallback is True
    assert rec.model_used == "baseline_fallback"
    assert rec.recommended_portions == 173  # ceil(150 * 1.15) = 173
    assert any("Limited historical data" in factor for factor in rec.explanation_factors)
    assert any("+15% safety buffer" in factor for factor in rec.explanation_factors)


def test_forecast_service_orchestration():
    """Verifies ForecastService routes frequent dishes to Random Forest and new dishes to fallback."""
    service = ForecastService.get_instance()
    
    # Request containing 1 established dish (d_rice_lunch) and 1 brand-new unseen dish (d_brand_new)
    request = ForecastRequest(
        meal_date=date(2026, 10, 20),
        meal_type="lunch",
        expected_attendance=190,
        safety_buffer_pct=0.10,
        dishes=[
            ForecastItemRequest(dish_id="d_rice_lunch", dish_name="Steamed Basmati Rice"),
            ForecastItemRequest(dish_id="d_brand_new", dish_name="Fusion Curry"),
        ],
    )

    response = service.generate_forecast(request)
    assert len(response.recommendations) == 2
    assert response.expected_attendance == 190
    assert response.safety_buffer_pct == 0.10

    # d_rice_lunch should have used Random Forest
    rf_rec = next(r for r in response.recommendations if r.dish_id == "d_rice_lunch")
    assert rf_rec.model_used == "random_forest"
    assert rf_rec.is_fallback is False
    assert rf_rec.data_points_count >= 5
    assert rf_rec.recommended_portions > 0

    # d_brand_new should have used Baseline Fallback
    fallback_rec = next(r for r in response.recommendations if r.dish_id == "d_brand_new")
    assert fallback_rec.model_used == "baseline_fallback"
    assert fallback_rec.is_fallback is True
    assert fallback_rec.data_points_count == 0
    assert fallback_rec.recommended_portions > 0

    # Verify total portions calculation
    assert response.total_recommended_portions == rf_rec.recommended_portions + fallback_rec.recommended_portions


def test_record_management_in_service():
    """Verifies adding records and filtering through ForecastService."""
    service = ForecastService.get_instance()
    initial_count = len(service.records)

    new_rec = service.add_record(
        MealRecordCreate(
            dish_id="d_tea",
            dish_name="Masala Chai",
            meal_date=date(2026, 10, 19),
            meal_type="breakfast",
            attendance=160,
            prepared_portions=150,
            served_portions=145,
            leftover_portions=5,
        )
    )

    assert len(service.records) == initial_count + 1
    assert new_rec.is_synthetic is False

    # Filter by dish
    tea_records = service.get_records(dish_id="d_tea", limit=10)
    assert len(tea_records) > 0
    assert tea_records[0].dish_id == "d_tea"


def test_batch_records_management():
    """Verifies batch logging of multiple dishes and dynamic model retraining."""
    service = ForecastService.get_instance()
    initial_count = len(service.records)

    batch_input = [
        MealRecordCreate(
            dish_id="d_rice_lunch",
            dish_name="Steamed Rice",
            meal_date=date(2026, 10, 20),
            meal_type="lunch",
            attendance=180,
            prepared_portions=190,
            served_portions=175,
            leftover_portions=15,
        ),
        MealRecordCreate(
            dish_id="d_dal_tadka",
            dish_name="Yellow Dal",
            meal_date=date(2026, 10, 20),
            meal_type="lunch",
            attendance=180,
            prepared_portions=170,
            served_portions=160,
            leftover_portions=10,
        ),
    ]

    created = service.add_records_batch(batch_input)
    assert len(created) == 2
    assert len(service.records) == initial_count + 2
    assert service.is_trained is True


def test_kitchen_guardrails_validation():
    """Verifies that physical guardrails reject impossible kitchen data."""
    # 1. Leftover cannot exceed prepared
    with pytest.raises(ValueError, match="cannot exceed prepared portions"):
        MealRecordCreate(
            dish_id="d_rice_lunch",
            meal_date=date(2026, 10, 21),
            meal_type="lunch",
            attendance=180,
            prepared_portions=100,
            leftover_portions=150,
        )

    # 2. Served cannot exceed prepared
    with pytest.raises(ValueError, match="cannot exceed prepared portions"):
        MealRecordCreate(
            dish_id="d_rice_lunch",
            meal_date=date(2026, 10, 21),
            meal_type="lunch",
            attendance=180,
            prepared_portions=100,
            served_portions=120,
        )

    # 3. Served + Leftover cannot exceed prepared
    with pytest.raises(ValueError, match="exceeds prepared portions"):
        MealRecordCreate(
            dish_id="d_rice_lunch",
            meal_date=date(2026, 10, 21),
            meal_type="lunch",
            attendance=180,
            prepared_portions=100,
            served_portions=80,
            leftover_portions=30,  # 80 + 30 = 110 > 100
        )

    # 4. Absurdly high served portions relative to attendance (typo check)
    with pytest.raises(ValueError, match="unrealistically high for reported attendance"):
        MealRecordCreate(
            dish_id="d_rice_lunch",
            meal_date=date(2026, 10, 21),
            meal_type="lunch",
            attendance=100,
            prepared_portions=1000,
            served_portions=600,  # 600 > 100 * 5
        )

    # 5. Zero attendance cannot serve food
    with pytest.raises(ValueError, match="Cannot serve portions when attendance is 0"):
        MealRecordCreate(
            dish_id="d_rice_lunch",
            meal_date=date(2026, 10, 21),
            meal_type="lunch",
            attendance=0,
            prepared_portions=100,
            served_portions=50,
        )

