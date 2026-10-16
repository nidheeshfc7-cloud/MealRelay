"""FastAPI route handlers for forecasting and model benchmark metrics."""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from src.schemas.forecast import ForecastRequest, ForecastResponse
from src.services.forecast_service import ForecastService
from src.models.evaluation import run_chronological_evaluation

router = APIRouter()


@router.post(
    "/forecast",
    response_model=ForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Forecast next-day dish portion demand with safety buffer recommendations",
)
def create_forecast(request: ForecastRequest) -> ForecastResponse:
    """Generates next-day demand predictions and preparation recommendations for planned dishes."""
    if not request.dishes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one dish must be specified in the forecast request.",
        )

    service = ForecastService.get_instance()
    try:
        response = service.generate_forecast(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting error: {str(e)}",
        )


@router.get(
    "/metrics",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Retrieve model evaluation metrics comparing Random Forest vs. Historical Baseline",
)
def get_model_benchmark_metrics() -> Dict[str, Any]:
    """Returns chronological holdout validation metrics comparing Random Forest to Historical Average."""
    try:
        report = run_chronological_evaluation()
        return report.to_dict()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation error: {str(e)}",
        )
