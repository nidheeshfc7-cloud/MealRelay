"""Recommendation logic: safety buffer application, portion rounding, and explainability factors."""

import math
from typing import List, Optional, Tuple
from src.schemas.forecast import DishForecastRecommendation
from src.config import DEFAULT_SAFETY_BUFFER


# Category-to-kitchen-unit mapping for intuitive staff instructions
CATEGORY_UNIT_MAP = {
    "rice": "portions",
    "bread": "pieces",
    "curry": "bowls",
    "main": "plates",
    "side": "bowls",
    "beverage": "cups",
    "dessert": "pieces",
}


def determine_kitchen_unit(category: Optional[str]) -> str:
    """Derives practical kitchen counting unit (plates, bowls, pieces, cups) from category."""
    if not category:
        return "plates"
    cat_lower = category.lower()
    for cat_key, unit in CATEGORY_UNIT_MAP.items():
        if cat_key in cat_lower:
            return unit
    return "plates"


def build_simple_reason(
    dish_name: str,
    meal_type: str,
    attendance: Optional[int],
    day_name: Optional[str] = None,
    is_weekend: bool = False,
    is_fallback: bool = False,
    data_points_count: Optional[int] = None,
) -> str:
    """Generates a single, friendly plain-language sentence without math formulas."""
    meal_label = meal_type.capitalize()
    students_str = f" for {attendance} students" if attendance else ""

    if is_fallback or (data_points_count is not None and data_points_count < 5):
        return f"Covers {meal_label}{students_str}. Based on standard campus averages while building dish history."

    if is_weekend:
        return f"Covers {meal_label}{students_str}. Adjusted for typical weekend mess turnout."

    if day_name:
        return f"Covers {meal_label}{students_str}. Aligned with typical {day_name} dining preferences."

    return f"Covers {meal_label}{students_str}. Popular dining staple with steady student demand."


def calculate_safety_buffer_portions(predicted_portions: float, buffer_pct: float) -> int:
    """Calculates final recommended preparation portions using ceiling rounding."""
    if predicted_portions <= 0:
        return 0
    safe_multiplier = 1.0 + max(0.0, min(0.50, buffer_pct))
    return int(math.ceil(round(predicted_portions * safe_multiplier, 6)))


def apply_nutritional_safety_floor(
    cook_portions: int,
    category: Optional[str],
    attendance: Optional[int],
    min_floor_ratio: float = 0.50,
) -> Tuple[int, bool]:
    """Ensures primary meal staples (rice, curry, bread, main) never drop below 50% attendance coverage."""
    if not attendance or attendance <= 0:
        return cook_portions, False

    cat_clean = (category or "").lower()
    if any(k in cat_clean for k in ["main", "curry", "rice", "bread"]):
        min_floor = int(math.ceil(attendance * min_floor_ratio))
        if cook_portions < min_floor:
            return min_floor, True

    return cook_portions, False


def build_dish_recommendation(
    dish_id: str,
    dish_name: str,
    meal_type: str,
    predicted_portions: float,
    safety_buffer_pct: Optional[float],
    model_used: str,
    data_points_count: int,
    is_fallback: bool,
    base_explanations: Optional[List[str]] = None,
    category: Optional[str] = None,
    attendance: Optional[int] = None,
    day_name: Optional[str] = None,
    is_weekend: bool = False,
) -> DishForecastRecommendation:
    """Builds a complete single-target preparation recommendation with customer-friendly explanations."""
    buffer_val = DEFAULT_SAFETY_BUFFER if safety_buffer_pct is None else max(0.0, min(0.50, safety_buffer_pct))
    predicted_val = max(0.0, round(predicted_portions, 1))
    raw_cook_val = calculate_safety_buffer_portions(predicted_val, buffer_val)

    # Human-friendly attributes
    category_name = category or "Main"
    unit_str = determine_kitchen_unit(category_name)
    confidence_tier = "Moderate (Building kitchen history)" if (is_fallback or data_points_count < 5) else "High"
    simple_reason_text = build_simple_reason(
        dish_name=dish_name,
        meal_type=meal_type,
        attendance=attendance,
        day_name=day_name,
        is_weekend=is_weekend,
        is_fallback=is_fallback,
        data_points_count=data_points_count,
    )

    # Hardcoded physical nutritional safety floor: primary meal staples must never drop below 50% attendance
    cook_val, floor_applied = apply_nutritional_safety_floor(raw_cook_val, category_name, attendance)

    explanations: List[str] = []

    # 1. Fallback transparency banner if sparse data was detected
    if is_fallback:
        explanations.append(
            f"Limited historical data ({data_points_count} records): transparent baseline average used instead of ML."
        )

    # 2. Append operational model factors (attendance ratio, weekday curve, recent momentum)
    if base_explanations:
        explanations.extend(base_explanations)

    # 3. Buffer explanation note
    buffer_pct_int = int(round(buffer_val * 100))
    buffer_diff = raw_cook_val - int(math.ceil(predicted_val))
    if buffer_diff > 0:
        explanations.append(
            f"+{buffer_pct_int}% safety buffer applied (+{buffer_diff} extra portions) to prevent food shortage."
        )
    else:
        explanations.append(
            f"Portion recommended at ceiling demand level ({raw_cook_val} portions)."
        )

    # 4. Nutritional floor notice if triggered
    if floor_applied:
        explanations.append(
            f"Nutritional safety floor enforced: minimum 50% headcount coverage ({cook_val} portions) for primary dining course."
        )

    return DishForecastRecommendation(
        dish_id=dish_id,
        dish_name=dish_name,
        meal_type=meal_type,
        category=category_name,
        cook_portions=int(math.ceil(cook_val)),
        unit=unit_str,
        confidence=confidence_tier,
        simple_reason=simple_reason_text,
        suggested_step=5,
        predicted_portions=predicted_val,
        safety_buffer_pct=buffer_val,
        recommended_portions=int(math.ceil(cook_val)),
        model_used=model_used,
        data_points_count=data_points_count,
        is_fallback=is_fallback,
        explanation_factors=explanations,
    )
