"""API routes module exports."""

from src.api.routes.forecast import router as forecast_router
from src.api.routes.records import router as records_router

__all__ = ["forecast_router", "records_router"]
