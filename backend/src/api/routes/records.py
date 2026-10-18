"""FastAPI route handlers for historical meal records and dish catalog."""

from datetime import date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, status, HTTPException

from src.schemas.meal_record import MealRecord, MealRecordCreate
from src.schemas.dish import Dish
from src.services.forecast_service import ForecastService

router = APIRouter()


@router.get(
    "/records",
    response_model=List[MealRecord],
    status_code=status.HTTP_200_OK,
    summary="List historical meal records with optional filters",
)
def get_meal_records(
    dish_id: Optional[str] = Query(default=None, description="Filter by dish ID"),
    meal_type: Optional[str] = Query(default=None, description="Filter by breakfast, lunch, or dinner"),
    start_date: Optional[date] = Query(default=None, description="Earliest meal date to include"),
    end_date: Optional[date] = Query(default=None, description="Latest meal date to include"),
    limit: int = Query(default=100, ge=1, le=1000, description="Max number of records to return"),
) -> List[MealRecord]:
    """Retrieves chronological meal records. Preserves explicit nulls on served portions."""
    service = ForecastService.get_instance()
    return [record for record in service.get_records(
        dish_id=dish_id,
        meal_type=meal_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    ) if record.is_synthetic]


@router.post(
    "/records",
    response_model=MealRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new historical meal record",
)
def create_meal_record(record_in: MealRecordCreate) -> MealRecord:
    """Legacy shared storage is not an account-authorized write path."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Shared record writes are disabled. Use MealRelay Daily Activity for account-owned records.",
    )


@router.post(
    "/records/batch",
    response_model=List[MealRecord],
    status_code=status.HTTP_201_CREATED,
    summary="Create multiple historical meal records and retrain models on the batch",
)
def create_meal_records_batch(records_in: List[MealRecordCreate]) -> List[MealRecord]:
    """Never ingest private restaurant records into the shared demo engine."""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Shared record writes are disabled. Use MealRelay Daily Activity for account-owned records.",
    )


@router.post(
    "/records/reset-synthetic",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Reset system to standard 60-day synthetic dataset",
)
def reset_synthetic_dataset() -> Dict[str, Any]:
    """Resets records and retrains models on the canonical 60-day synthetic hostel mess data."""
    service = ForecastService.get_instance()
    count = service.reset_to_synthetic_data()
    return {
        "status": "success",
        "message": f"Successfully reset and retrained models on {count} synthetic meal records.",
        "records_count": count,
    }


@router.get(
    "/dishes",
    response_model=List[Dish],
    status_code=status.HTTP_200_OK,
    summary="Retrieve the catalog of mess dishes",
)
def get_dishes_catalog() -> List[Dish]:
    """Returns all canonical dishes across Breakfast, Lunch, and Dinner."""
    service = ForecastService.get_instance()
    return service.get_dishes()
