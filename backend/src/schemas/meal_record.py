"""Pydantic schemas for historical meal records."""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class MealRecordBase(BaseModel):
    """Base historical record for a dish served in a meal session."""
    dish_id: str = Field(..., description="Unique ID of the dish")
    dish_name: Optional[str] = Field(default=None, description="Descriptive name of the dish")
    meal_date: date = Field(..., description="Date of the meal session")
    meal_type: str = Field(..., description="breakfast, lunch, or dinner")
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6, description="0=Monday, 6=Sunday")
    attendance: Optional[int] = Field(default=None, ge=0, description="Observed or expected student headcount")
    prepared_portions: int = Field(..., ge=0, description="Total portions cooked/prepared")
    served_portions: Optional[int] = Field(
        default=None,
        ge=0,
        description="Portions consumed. Explicit nulls allowed when not tracked; never cast to 0 silently."
    )
    leftover_portions: Optional[int] = Field(
        default=None,
        ge=0,
        description="Portions remaining uneaten/wasted at end of meal session."
    )
    is_synthetic: bool = Field(
        default=False,
        description="Flag indicating whether this record was synthetically generated."
    )

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def populate_day_of_week_and_validate(cls, data: dict) -> dict:
        """Derive day_of_week from meal_date if not explicitly provided."""
        if not isinstance(data, dict):
            return data

        meal_date_val = data.get("meal_date")
        if meal_date_val and data.get("day_of_week") is None:
            if isinstance(meal_date_val, str):
                parsed_date = date.fromisoformat(meal_date_val)
                data["day_of_week"] = parsed_date.weekday()
            elif isinstance(meal_date_val, date):
                data["day_of_week"] = meal_date_val.weekday()

        return data

    @model_validator(mode="after")
    def validate_kitchen_guardrails(self) -> "MealRecordBase":
        """Physical kitchen reality checks to reject corrupt or impossible data."""
        # 1. Leftover portions cannot exceed prepared portions
        if self.leftover_portions is not None and self.leftover_portions > self.prepared_portions:
            raise ValueError(
                f"Leftover portions ({self.leftover_portions}) cannot exceed prepared portions ({self.prepared_portions})."
            )

        # 2. Served portions cannot exceed prepared portions
        if self.served_portions is not None and self.served_portions > self.prepared_portions:
            raise ValueError(
                f"Served portions ({self.served_portions}) cannot exceed prepared portions ({self.prepared_portions})."
            )

        # 3. Sum of served and leftover cannot exceed prepared portions
        if (
            self.served_portions is not None
            and self.leftover_portions is not None
            and (self.served_portions + self.leftover_portions) > self.prepared_portions
        ):
            raise ValueError(
                f"Sum of served ({self.served_portions}) and leftover ({self.leftover_portions}) "
                f"portions exceeds prepared portions ({self.prepared_portions})."
            )

        # 4. Typo guardrail: served portions cannot be absurdly higher than attendance
        if self.attendance is not None and self.attendance > 0 and self.served_portions is not None:
            if self.served_portions > self.attendance * 5:
                raise ValueError(
                    f"Served portions ({self.served_portions}) is unrealistically high for reported "
                    f"attendance of {self.attendance} students (maximum 5x allowed). Please check for typos."
                )

        # 5. Zero attendance cannot have positive served portions
        if self.attendance == 0 and (self.served_portions or 0) > 0:
            raise ValueError("Cannot serve portions when attendance is 0.")

        return self


class MealRecordCreate(MealRecordBase):
    """Schema for adding a new meal record."""
    pass


class MealRecord(MealRecordBase):
    """Full meal record schema with unique ID."""
    id: str = Field(..., description="Unique identifier for the meal record")
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
