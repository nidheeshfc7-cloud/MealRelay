"""Recommendation logic: safety buffer application, portion rounding, and explainability factors."""

import math
from typing import List, Optional
from src.schemas.forecast import DishForecastRecommendation
from src.config import DEFAULT_SAFETY_BUFFER


def calculate_safety_buffer_portions(predicted_portions: float, buffer_pct: float) -> int:
    """Calculates final recommended preparation portions using ceiling rounding."""
    if predicted_portions <= 0:
        return 0
    safe_multiplier = 1.0 + max(0.0, min(0.50, buffer_pct))
    return int(math.ceil(round(predicted_portions * safe_multiplier, 6)))


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
) -> DishForecastRecommendation:
    """Builds a complete preparation recommendation with grounded operational factors."""
    buffer_val = DEFAULT_SAFETY_BUFFER if safety_buffer_pct is None else max(0.0, min(0.50, safety_buffer_pct))
    predicted_val = max(0.0, round(predicted_portions, 1))
    recommended_val = calculate_safety_buffer_portions(predicted_val, buffer_val)

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
    buffer_diff = recommended_val - int(math.ceil(predicted_val))
    if buffer_diff > 0:
        explanations.append(
            f"+{buffer_pct_int}% safety buffer applied (+{buffer_diff} extra portions) to prevent food shortage."
        )
    else:
        explanations.append(
            f"Portion recommended at ceiling demand level ({recommended_val} portions)."
        )

    return DishForecastRecommendation(
        dish_id=dish_id,
        dish_name=dish_name,
        meal_type=meal_type,
        predicted_portions=predicted_val,
        safety_buffer_pct=buffer_val,
        recommended_portions=recommended_val,
        model_used=model_used,
        data_points_count=data_points_count,
        is_fallback=is_fallback,
        explanation_factors=explanations,
    )
