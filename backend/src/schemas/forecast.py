"""Pydantic schemas for demand forecasts and preparation recommendations."""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


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
    """Per-dish prediction, safety buffer, and explainability factors."""
    dish_id: str = Field(..., description="Dish identifier")
    dish_name: str = Field(..., description="Dish name")
    meal_type: str = Field(..., description="Meal type")
    predicted_portions: float = Field(..., description="Raw model or baseline predicted demand")
    safety_buffer_pct: float = Field(..., description="Safety buffer applied (e.g. 0.10 for 10%)")
    recommended_portions: int = Field(..., ge=0, description="Final ceiling recommended preparation count")
    model_used: str = Field(..., description="Forecasting model applied: 'random_forest' or 'baseline_fallback'")
    data_points_count: int = Field(..., description="Number of historical records available for this dish")
    is_fallback: bool = Field(..., description="True if fallback baseline was used due to sparse data")
    explanation_factors: List[str] = Field(
        default_factory=list,
        description="Plain-language factors explaining how the recommendation was derived"
    )


class ForecastResponse(BaseModel):
    """Complete forecast response for a planned meal session."""
    meal_date: date = Field(..., description="Forecast target date")
    meal_type: str = Field(..., description="Meal session type")
    expected_attendance: int = Field(..., description="Expected attendance used")
    safety_buffer_pct: float = Field(..., description="Safety buffer percentage applied")
    recommendations: List[DishForecastRecommendation] = Field(..., description="Per-dish preparation recommendations")
    total_recommended_portions: int = Field(..., ge=0, description="Sum of all recommended portions for the meal")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of forecast generation")

    model_config = ConfigDict(from_attributes=True)
