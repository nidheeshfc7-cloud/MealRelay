"""Unit tests for recommendation math and forecast orchestration service."""

from datetime import date
import pytest

from src.services.recommendation import (
    calculate_safety_buffer_portions,
    build_dish_recommendation,
    determine_kitchen_unit,
    build_simple_reason,
    apply_nutritional_safety_floor,
)
from src.services.forecast_service import ForecastService
from src.schemas.forecast import ForecastRequest, ForecastItemRequest, ForecastResponse, DishForecastRecommendation
from src.schemas.meal_record import MealRecordCreate, MealRecord
from src.data.supabase_client import SupabaseStorageAdapter


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


def test_kitchen_unit_mapping():
    """Verifies that culinary categories map to intuitive everyday kitchen units."""
    assert determine_kitchen_unit("rice") == "portions"
    assert determine_kitchen_unit("main curry") == "bowls"
    assert determine_kitchen_unit("fresh bread") == "pieces"
    assert determine_kitchen_unit("main") == "plates"
    assert determine_kitchen_unit("side dish") == "bowls"
    assert determine_kitchen_unit("beverage") == "cups"
    assert determine_kitchen_unit("dessert") == "pieces"
    assert determine_kitchen_unit("unknown_category") == "plates"
    assert determine_kitchen_unit(None) == "plates"


def test_simple_reason_generation():
    """Verifies that human-friendly explanation sentences are generated without math jargon."""
    # 1. Fallback or sparse data
    reason_sparse = build_simple_reason("Paneer Tikka", "dinner", 180, is_fallback=True)
    assert "Covers Dinner for 180 students" in reason_sparse
    assert "standard campus averages" in reason_sparse

    # 2. Weekend turnout
    reason_weekend = build_simple_reason("Poha", "breakfast", 120, is_weekend=True)
    assert "Covers Breakfast for 120 students" in reason_weekend
    assert "weekend mess turnout" in reason_weekend

    # 3. Weekday preference
    reason_weekday = build_simple_reason("Rajma", "lunch", 200, day_name="Wednesday")
    assert "Covers Lunch for 200 students" in reason_weekday
    assert "Wednesday" in reason_weekday


def test_customer_friendly_forecast_schema():
    """Verifies that generate_forecast outputs single preparation target, units, confidence, and reasons."""
    service = ForecastService.get_instance()
    request = ForecastRequest(
        meal_date=date(2026, 10, 22),
        meal_type="lunch",
        expected_attendance=185,
        dishes=[
            ForecastItemRequest(dish_id="d_rice_lunch"),
            ForecastItemRequest(dish_id="d_dal_tadka"),
        ],
    )

    response = service.generate_forecast(request)

    # Check session-level customer-friendly fields
    assert response.expected_students == 185
    assert response.expected_attendance == 185
    assert response.total_cook_portions > 0
    assert response.total_cook_portions == response.total_recommended_portions
    assert len(response.dishes) == 2
    assert response.dishes == response.recommendations

    # Check dish-level single-target output
    rice_rec = next(d for d in response.dishes if d.dish_id == "d_rice_lunch")
    assert rice_rec.cook_portions > 0
    assert rice_rec.cook_portions == rice_rec.recommended_portions
    assert rice_rec.unit == "portions"
    assert rice_rec.confidence in ["High", "Moderate"]
    assert "Covers Lunch for 185 students" in rice_rec.simple_reason
    assert rice_rec.suggested_step == 5

    dal_rec = next(d for d in response.dishes if d.dish_id == "d_dal_tadka")
    assert dal_rec.cook_portions > 0
    assert dal_rec.unit == "bowls"
    assert dal_rec.suggested_step == 5


def test_forecast_response_validator_synchronization():
    """Verifies that ForecastResponse model_validator synchronizes new and legacy keys bi-directionally."""
    sample_item = DishForecastRecommendation(
        dish_id="d_test",
        dish_name="Test Dish",
        meal_type="dinner",
        category="main",
        cook_portions=150,
        unit="plates",
        confidence="High",
        simple_reason="Covers dinner well.",
        suggested_step=5,
        predicted_portions=140.0,
        safety_buffer_pct=0.10,
        recommended_portions=150,
        model_used="random_forest",
        data_points_count=20,
        is_fallback=False,
    )

    # 1. Supplied with new customer-friendly fields only
    resp1 = ForecastResponse.model_validate({
        "meal_date": date(2026, 10, 22),
        "meal_type": "dinner",
        "expected_students": 160,
        "total_cook_portions": 150,
        "dishes": [sample_item],
    })
    assert resp1.expected_attendance == 160
    assert resp1.total_recommended_portions == 150
    assert len(resp1.recommendations) == 1

    # 2. Supplied with legacy fields only
    resp2 = ForecastResponse.model_validate({
        "meal_date": date(2026, 10, 22),
        "meal_type": "dinner",
        "expected_attendance": 175,
        "total_recommended_portions": 150,
        "recommendations": [sample_item],
    })
    assert resp2.expected_students == 175
    assert resp2.total_cook_portions == 150
    assert len(resp2.dishes) == 1


def test_nutritional_safety_floor():
    """Verifies that primary meal staples cannot drop below 50% attendance coverage."""
    # 1. Direct helper test: 40 portions for attendance 200 on curry -> bumped to 100
    portions, applied = apply_nutritional_safety_floor(40, category="curry", attendance=200)
    assert applied is True
    assert portions == 100

    # 2. Already above floor: 130 portions for attendance 200 on curry -> unchanged
    portions_ok, applied_ok = apply_nutritional_safety_floor(130, category="curry", attendance=200)
    assert applied_ok is False
    assert portions_ok == 130

    # 3. Non-main category (beverage) -> floor not forced
    bev_portions, bev_applied = apply_nutritional_safety_floor(30, category="beverage", attendance=200)
    assert bev_applied is False
    assert bev_portions == 30

    # 4. Recommendation integration: build_dish_recommendation enforces floor and adds explanation
    rec = build_dish_recommendation(
        dish_id="d_low",
        dish_name="Dal Tadka",
        meal_type="lunch",
        predicted_portions=20.0,
        safety_buffer_pct=0.10,
        model_used="baseline_fallback",
        data_points_count=10,
        is_fallback=False,
        category="curry",
        attendance=180,
    )
    assert rec.cook_portions >= 90  # 180 * 0.50 = 90
    assert any("Nutritional safety floor enforced" in factor for factor in rec.explanation_factors)


def test_internal_adaptive_volatility_buffer():
    """Verifies that Random Forest ensemble volatility automatically adjusts buffer without customer cushion sliders."""
    service = ForecastService.get_instance()
    # Request without explicit safety_buffer_pct (None)
    request = ForecastRequest(
        meal_date=date(2026, 10, 24),
        meal_type="lunch",
        expected_attendance=190,
        safety_buffer_pct=None,
        dishes=[
            ForecastItemRequest(dish_id="d_rice_lunch"),
        ],
    )

    response = service.generate_forecast(request)
    rice_rec = response.dishes[0]

    # Model calculates adaptive buffer in 0.06 - 0.18 range
    assert 0.05 <= rice_rec.safety_buffer_pct <= 0.20
    assert rice_rec.cook_portions > 0
    # Explanations reflect internal volatility absorption
    joined_factors = " ".join(rice_rec.explanation_factors)
    assert "adaptive cushion" in joined_factors or "safety buffer" in joined_factors


def test_data_sufficiency_indicator():
    """Verifies that dishes with sparse data display 'Moderate (Building kitchen history)'."""
    service = ForecastService.get_instance()
    request = ForecastRequest(
        meal_date=date(2026, 10, 24),
        meal_type="lunch",
        expected_attendance=190,
        dishes=[
            ForecastItemRequest(dish_id="d_brand_new_unseen", dish_name="Fusion Curry"),
        ],
    )

    response = service.generate_forecast(request)
    new_rec = response.dishes[0]
    assert new_rec.confidence == "Moderate (Building kitchen history)"
    assert "standard campus averages" in new_rec.simple_reason


def test_continuous_learning_dynamic_adaptation():
    """Verifies that logging real high-consumption meals immediately increases future cook recommendations."""
    service = ForecastService.get_instance()
    target_date = date(2026, 10, 27)

    request = ForecastRequest(
        meal_date=target_date,
        meal_type="lunch",
        expected_attendance=200,
        dishes=[
            ForecastItemRequest(dish_id="d_paneer_lunch"),
        ],
    )

    # 1. Baseline forecast before logging real kitchen surge
    initial_response = service.generate_forecast(request)
    initial_cook = initial_response.dishes[0].cook_portions

    # 2. Kitchen logs 3 consecutive high-consumption lunch sessions (students ate extra paneer)
    surge_logs = [
        MealRecordCreate(
            dish_id="d_paneer_lunch",
            dish_name="Paneer Butter Masala",
            meal_date=date(2026, 10, 24),
            meal_type="lunch",
            attendance=200,
            prepared_portions=240,
            served_portions=235,
            leftover_portions=5,
            category="curry",
        ),
        MealRecordCreate(
            dish_id="d_paneer_lunch",
            dish_name="Paneer Butter Masala",
            meal_date=date(2026, 10, 25),
            meal_type="lunch",
            attendance=200,
            prepared_portions=240,
            served_portions=238,
            leftover_portions=2,
            category="curry",
        ),
        MealRecordCreate(
            dish_id="d_paneer_lunch",
            dish_name="Paneer Butter Masala",
            meal_date=date(2026, 10, 26),
            meal_type="lunch",
            attendance=200,
            prepared_portions=245,
            served_portions=240,
            leftover_portions=5,
            category="curry",
        ),
    ]

    service.add_records_batch(surge_logs)

    # 3. Forecast again for the target lunch date
    updated_response = service.generate_forecast(request)
    updated_cook = updated_response.dishes[0].cook_portions

    # The dynamic model must have increased recommended cook portions in response to higher consumption
    assert updated_cook > initial_cook


def test_supabase_storage_adapter_offline_mode():
    """Verifies that Supabase adapter operates in offline edge mode when credentials are not configured."""
    adapter = SupabaseStorageAdapter(supabase_url=None, supabase_key=None)
    assert adapter.is_configured() is False
    assert adapter.mode == "in_memory_edge"

    # Edge sync operations must return safely without raising network exceptions
    sample_record = MealRecord(
        id="rec_offline_test",
        dish_id="d_test",
        meal_date=date(2026, 10, 25),
        meal_type="lunch",
        day_of_week=6,
        attendance=150,
        prepared_portions=160,
        served_portions=150,
        leftover_portions=10,
        category="main",
        is_synthetic=False,
    )

    assert adapter.sync_record(sample_record) is False
    assert adapter.sync_records_batch([sample_record]) == 0




