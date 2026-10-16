"""Schemas package initialization."""

from src.schemas.dish import Dish, DishBase, DishCreate, DishCategoryEnum, MealTypeEnum
from src.schemas.meal_record import MealRecord, MealRecordBase, MealRecordCreate
from src.schemas.forecast import (
    ForecastRequest,
    ForecastResponse,
    ForecastItemRequest,
    DishForecastRecommendation,
)

__all__ = [
    "Dish",
    "DishBase",
    "DishCreate",
    "DishCategoryEnum",
    "MealTypeEnum",
    "MealRecord",
    "MealRecordBase",
    "MealRecordCreate",
    "ForecastRequest",
    "ForecastResponse",
    "ForecastItemRequest",
    "DishForecastRecommendation",
]
