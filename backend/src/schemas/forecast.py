"""Pydantic schemas for demand forecasts and preparation recommendations."""

from datetime import date, datetime, timezone
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


class ForecastItemRequest(BaseModel):
    """Specific dish to forecast in a meal session."""
    dish_id: str = Field(..., description="ID of the dish to forecast")
    dish_name: Optional[str] = Field(default=None, description="Optional human-readable name of the dish")


class ForecastRequest(BaseModel):
    """Payload for next-day portion forecasting."""
    meal_date: date = Field(..., description="Target date for the meal session")
    meal_type: str = Field(..., description="Target meal type (breakfast, lunch, dinner)")
    expected_attendance: int = Field(..., ge=1, description="Expected headcount/attendance")
    dishes: List[ForecastItemRequest] = Field(..., min_length=1, description="List of dishes to prepare")
    safety_buffer_pct: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=0.50,
        description="Optional safety buffer multiplier (e.g. 0.10 for +10%). Defaults to system config if omitted."
    )


class DishForecastRecommendation(BaseModel):
    """Per-dish prediction, single-target preparation quantity, and customer-friendly explanation."""
    dish_id: str = Field(..., description="Dish identifier")
    dish_name: str = Field(..., description="Dish name")
    meal_type: str = Field(..., description="Meal type")
    category: str = Field(default="Main", description="Dish category name (e.g. Main Curry, Rice, Fresh Breads)")
    cook_portions: int = Field(..., ge=0, description="Single unambiguous preparation target for kitchen staff")
    unit: str = Field(default="plates", description="Cooking unit: plates, bowls, portions, pieces, cups")
    confidence: str = Field(default="High", description="Customer-friendly confidence rating: 'High' or 'Moderate'")
    simple_reason: str = Field(default="", description="One clear, customer-friendly explanation sentence")
    suggested_step: int = Field(default=5, ge=1, description="Recommended adjustment stepper increment (+5 / -5)")

    # Backward-compatible fields
    predicted_portions: float = Field(..., description="Raw model or baseline predicted demand")
    safety_buffer_pct: float = Field(default=0.10, description="Safety buffer applied (e.g. 0.10 for 10%)")
    recommended_portions: int = Field(..., ge=0, description="Mirror of cook_portions for backward compatibility")
    model_used: str = Field(default="random_forest", description="Forecasting model applied: 'random_forest' or 'baseline_fallback'")
    data_points_count: int = Field(default=0, description="Number of historical records available for this dish")
    is_fallback: bool = Field(default=False, description="True if fallback baseline was used due to sparse data")
    explanation_factors: List[str] = Field(
        default_factory=list,
        description="Detailed bullet factors explaining how recommendation was derived"
    )


class ForecastResponse(BaseModel):
    """Complete forecast response for a planned meal session."""
    meal_date: date = Field(..., description="Forecast target date")
    meal_type: str = Field(..., description="Meal session type")
    expected_students: int = Field(default=0, description="Expected student headcount")
    total_cook_portions: int = Field(default=0, ge=0, description="Total portions to cook across all dishes in the session")
    dishes: List[DishForecastRecommendation] = Field(default_factory=list, description="List of dishes with preparation targets")

    # Backward-compatible fields
    expected_attendance: int = Field(default=0, description="Mirror of expected_students")
    safety_buffer_pct: float = Field(default=0.10, description="Safety buffer percentage applied")
    recommendations: List[DishForecastRecommendation] = Field(default_factory=list, description="Mirror of dishes")
    total_recommended_portions: int = Field(default=0, ge=0, description="Mirror of total_cook_portions")
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of forecast generation")

    @model_validator(mode="before")
    @classmethod
    def sync_backward_compatible_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Synchronize expected_students <-> expected_attendance
            att = data.get("expected_students") if data.get("expected_students") is not None else data.get("expected_attendance")
            if att is not None:
                data.setdefault("expected_students", att)
                data.setdefault("expected_attendance", att)

            # Synchronize dishes <-> recommendations
            recs = data.get("dishes") if data.get("dishes") is not None else data.get("recommendations")
            if recs is not None:
                data.setdefault("dishes", recs)
                data.setdefault("recommendations", recs)

            # Synchronize total_cook_portions <-> total_recommended_portions
            tot = data.get("total_cook_portions") if data.get("total_cook_portions") is not None else data.get("total_recommended_portions")
            if tot is not None:
                data.setdefault("total_cook_portions", tot)
                data.setdefault("total_recommended_portions", tot)
        return data

    model_config = ConfigDict(from_attributes=True)
