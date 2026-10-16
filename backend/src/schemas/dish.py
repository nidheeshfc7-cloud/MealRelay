"""Pydantic schemas for dish definitions."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MealTypeEnum(str, Enum):
    """Meal time categories."""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"


class DishCategoryEnum(str, Enum):
    """Food categories within a meal."""
    MAIN = "main"
    CURRY = "curry"
    RICE = "rice"
    BREAD = "bread"
    SIDE = "side"
    BEVERAGE = "beverage"
    DESSERT = "dessert"


class DishBase(BaseModel):
    """Base schema for dish properties."""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the dish")
    meal_type: MealTypeEnum = Field(..., description="Meal service (breakfast, lunch, dinner)")
    category: DishCategoryEnum = Field(default=DishCategoryEnum.MAIN, description="Food category")
    description: Optional[str] = Field(default=None, max_length=300, description="Optional description")

    model_config = ConfigDict(use_enum_values=True)


class DishCreate(DishBase):
    """Schema for registering a new dish."""
    id: Optional[str] = Field(default=None, description="Optional custom unique identifier")


class Dish(DishBase):
    """Full dish model with unique ID."""
    id: str = Field(..., description="Unique identifier for the dish")
