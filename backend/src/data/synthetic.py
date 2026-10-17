"""Synthetic hostel mess historical data generator.

Generates realistic 60-day historical meal records for a 200-student hostel mess,
incorporating day-of-week attendance patterns, meal-specific trends, and realistic waste.
All generated records are explicitly labeled with is_synthetic = True.
"""

from datetime import date, timedelta
import random
from typing import List, Dict, Any, Optional

from src.schemas.dish import Dish, MealTypeEnum, DishCategoryEnum
from src.schemas.meal_record import MealRecord
from src.config import SYNTHETIC_DAYS, DEFAULT_HOSTEL_CAPACITY


def get_standard_dishes() -> List[Dish]:
    """Returns the canonical catalog of standard dishes prepared in the hostel mess."""
    return [
        # Breakfast dishes
        Dish(id="d_idli", name="Idli & Sambar", meal_type=MealTypeEnum.BREAKFAST, category=DishCategoryEnum.MAIN),
        Dish(id="d_poha", name="Indori Poha", meal_type=MealTypeEnum.BREAKFAST, category=DishCategoryEnum.MAIN),
        Dish(id="d_dosa", name="Masala Dosa", meal_type=MealTypeEnum.BREAKFAST, category=DishCategoryEnum.MAIN),
        Dish(id="d_tea", name="Masala Chai & Coffee", meal_type=MealTypeEnum.BREAKFAST, category=DishCategoryEnum.BEVERAGE),

        # Lunch dishes
        Dish(id="d_rice_lunch", name="Steamed Basmati Rice", meal_type=MealTypeEnum.LUNCH, category=DishCategoryEnum.RICE),
        Dish(id="d_dal_tadka", name="Yellow Dal Tadka", meal_type=MealTypeEnum.LUNCH, category=DishCategoryEnum.CURRY),
        Dish(id="d_paneer_lunch", name="Paneer Butter Masala", meal_type=MealTypeEnum.LUNCH, category=DishCategoryEnum.CURRY),
        Dish(id="d_roti_lunch", name="Phulka Roti", meal_type=MealTypeEnum.LUNCH, category=DishCategoryEnum.BREAD),
        Dish(id="d_curd", name="Fresh Sweet Curd", meal_type=MealTypeEnum.LUNCH, category=DishCategoryEnum.SIDE),

        # Dinner dishes
        Dish(id="d_jeera_rice", name="Jeera Rice", meal_type=MealTypeEnum.DINNER, category=DishCategoryEnum.RICE),
        Dish(id="d_chicken_dinner", name="Chicken Curry / Soya Chaap", meal_type=MealTypeEnum.DINNER, category=DishCategoryEnum.MAIN),
        Dish(id="d_rajma", name="Punjabi Rajma Masala", meal_type=MealTypeEnum.DINNER, category=DishCategoryEnum.CURRY),
        Dish(id="d_roti_dinner", name="Butter Roti", meal_type=MealTypeEnum.DINNER, category=DishCategoryEnum.BREAD),
        Dish(id="d_gulab_jamun", name="Gulab Jamun", meal_type=MealTypeEnum.DINNER, category=DishCategoryEnum.DESSERT),
    ]


def _get_attendance_for_session(
    meal_type: str,
    day_of_week: int,
    base_capacity: int,
    rng: random.Random
) -> int:
    """Calculates realistic student turnout based on meal session and day of week."""
    is_weekend: bool = day_of_week in [5, 6]
    is_friday: bool = day_of_week == 4

    if meal_type == "breakfast":
        if is_weekend:
            # Significant drop on weekends as students sleep in
            mean_turnout = base_capacity * 0.55
            noise = rng.uniform(-15, 15)
            return max(50, int(mean_turnout + noise))
        mean_turnout = base_capacity * 0.82
        noise = rng.uniform(-10, 10)
        return min(base_capacity, max(100, int(mean_turnout + noise)))

    if meal_type == "lunch":
        if is_weekend:
            # Students out for lunch or weekend outings
            mean_turnout = base_capacity * 0.72
            noise = rng.uniform(-12, 12)
            return max(80, int(mean_turnout + noise))
        mean_turnout = base_capacity * 0.92
        noise = rng.uniform(-8, 8)
        return min(base_capacity, max(120, int(mean_turnout + noise)))

    # Dinner session
    if is_friday:
        # Friday special dinner peaks
        mean_turnout = base_capacity * 0.96
        noise = rng.uniform(-6, 4)
        return min(base_capacity, max(140, int(mean_turnout + noise)))
    if is_weekend:
        mean_turnout = base_capacity * 0.80
        noise = rng.uniform(-12, 12)
        return max(100, int(mean_turnout + noise))
    
    mean_turnout = base_capacity * 0.89
    noise = rng.uniform(-10, 10)
    return min(base_capacity, max(120, int(mean_turnout + noise)))


def _get_dish_portion_ratio(category: DishCategoryEnum) -> float:
    """Returns typical portion consumption factor relative to attendance."""
    if category == DishCategoryEnum.RICE:
        return 0.96
    if category == DishCategoryEnum.BREAD:
        return 1.04
    if category == DishCategoryEnum.CURRY:
        return 0.88
    if category == DishCategoryEnum.MAIN:
        return 0.92
    if category == DishCategoryEnum.SIDE:
        return 0.78
    if category == DishCategoryEnum.BEVERAGE:
        return 0.89
    if category == DishCategoryEnum.DESSERT:
        return 0.84
    return 0.90


def generate_synthetic_records(
    num_days: int = SYNTHETIC_DAYS,
    base_capacity: int = DEFAULT_HOSTEL_CAPACITY,
    random_seed: int = 42
) -> List[MealRecord]:
    """Generates a realistic chronological dataset of hostel mess historical meal records.
    
    All returned records have `is_synthetic = True`.
    """
    rng = random.Random(random_seed)
    dishes = get_standard_dishes()
    dishes_by_meal: Dict[str, List[Dish]] = {
        "breakfast": [d for d in dishes if d.meal_type == MealTypeEnum.BREAKFAST],
        "lunch": [d for d in dishes if d.meal_type == MealTypeEnum.LUNCH],
        "dinner": [d for d in dishes if d.meal_type == MealTypeEnum.DINNER],
    }

    records: List[MealRecord] = []
    end_date = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=num_days - 1)

    for day_offset in range(num_days):
        current_date = start_date + timedelta(days=day_offset)
        day_of_week = current_date.weekday()

        for meal_type, session_dishes in dishes_by_meal.items():
            attendance = _get_attendance_for_session(meal_type, day_of_week, base_capacity, rng)

            for dish in session_dishes:
                base_ratio = _get_dish_portion_ratio(dish.category)
                # Add dish-level preference variance
                variance = rng.uniform(-0.06, 0.06)
                consumption_factor = max(0.40, base_ratio + variance)
                
                # Actual demand/consumption
                actual_served = int(attendance * consumption_factor)

                # Kitchen over-preparation (hostels buffer 5-15% arbitrarily)
                cook_buffer = rng.uniform(1.05, 1.15)
                prepared = int(actual_served * cook_buffer)
                leftover = max(0, prepared - actual_served)

                # Simulate ~3% untracked records where kitchen staff forgot to log served count
                is_untracked = rng.random() < 0.03
                served_portions: Optional[int] = None if is_untracked else actual_served
                leftover_portions: Optional[int] = None if is_untracked else leftover

                record_id = f"synth_{current_date.strftime('%Y%m%d')}_{dish.id}"
                records.append(
                    MealRecord(
                        id=record_id,
                        dish_id=dish.id,
                        dish_name=dish.name,
                        meal_date=current_date,
                        meal_type=meal_type,
                        day_of_week=day_of_week,
                        attendance=attendance,
                        prepared_portions=prepared,
                        served_portions=served_portions,
                        leftover_portions=leftover_portions,
                        category=dish.category.value if hasattr(dish.category, 'value') else str(dish.category),
                        is_synthetic=True,
                    )
                )

    return records
